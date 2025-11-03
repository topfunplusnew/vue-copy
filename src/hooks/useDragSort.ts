import { ref, type Ref } from 'vue';

export interface DragSortItem {
  id: number;
  order: number;

  [key: string]: unknown;
}

export function useDragSort<T extends DragSortItem>(items: Ref<T[]>) {
  const draggedIndex = ref<number | null>(null);
  const draggedOverIndex = ref<number | null>(null);

  // 检查目标是否是关闭按钮（用于桌面端）
  const isCloseButtonForDrag = (event: DragEvent): boolean => {
    const target = event.target as HTMLElement;
    if (!target) return false;
    // Element Plus el-tag 的关闭按钮通常是 .el-tag__close 或者包含 el-icon-close
    return (
      target.classList?.contains('el-tag__close') ||
      target.closest?.('.el-tag__close') !== null ||
      target.classList?.contains('el-icon-close') ||
      target.closest?.('.el-icon-close') !== null ||
      target.getAttribute('aria-label') === 'Close' ||
      target.tagName === 'I' // 关闭图标通常是 <i> 标签
    );
  };

  const handleDragStart = (event: DragEvent, index: number) => {
    // 如果拖拽起始点是关闭按钮，阻止拖拽
    if (isCloseButtonForDrag(event)) {
      event.preventDefault();
      return;
    }
    draggedIndex.value = index;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/html', '');
    }
  };

  const handleDragOver = (event: DragEvent, index: number) => {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    draggedOverIndex.value = index;
  };

  const handleDragLeave = () => {
    draggedOverIndex.value = null;
  };

  const handleDrop = (event: DragEvent, index: number) => {
    event.preventDefault();

    if (draggedIndex.value === null || draggedIndex.value === index) {
      return;
    }

    const draggedItem = items.value[draggedIndex.value];
    const targetItem = items.value[index];

    // 交换order值
    const tempOrder = draggedItem.order;
    draggedItem.order = targetItem.order;
    targetItem.order = tempOrder;

    // 重新排序数组
    items.value.sort((a, b) => a.order - b.order);

    // 重置拖拽状态
    draggedIndex.value = null;
    draggedOverIndex.value = null;
  };

  const handleDragEnd = () => {
    draggedIndex.value = null;
    draggedOverIndex.value = null;
  };

  // 触摸拖动相关状态
  const touchStartIndex = ref<number | null>(null);
  const touchContainer = ref<HTMLElement | null>(null);
  const touchStartPos = ref<{ x: number; y: number } | null>(null);
  const isDragging = ref(false);

  // 检查触摸目标是否是关闭按钮
  const isCloseButton = (target: EventTarget | null): boolean => {
    if (!target) return false;
    const element = target as HTMLElement;
    // Element Plus el-tag 的关闭按钮通常是 .el-tag__close 或者包含 el-icon-close
    return (
      element.classList?.contains('el-tag__close') ||
      element.closest?.('.el-tag__close') !== null ||
      element.classList?.contains('el-icon-close') ||
      element.closest?.('.el-icon-close') !== null ||
      element.getAttribute('aria-label') === 'Close' ||
      element.tagName === 'I' // 关闭图标通常是 <i> 标签
    );
  };

  // 根据触摸坐标查找元素索引
  const findElementIndexByTouch = (touch: Touch, container: HTMLElement): number | null => {
    const elements = container.querySelectorAll('[data-drag-index]');
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i] as HTMLElement;
      const rect = element.getBoundingClientRect();
      if (touch.clientX >= rect.left && touch.clientX <= rect.right && touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
        const index = parseInt(element.getAttribute('data-drag-index') || '-1', 10);
        return index >= 0 ? index : null;
      }
    }
    return null;
  };

  const handleTouchStart = (event: TouchEvent, index: number, container: HTMLElement) => {
    if (event.touches.length === 1) {
      // 如果点击的是关闭按钮，不启动拖动
      if (isCloseButton(event.target)) {
        return;
      }

      const touch = event.touches[0];
      touchStartIndex.value = index;
      touchStartPos.value = { x: touch.clientX, y: touch.clientY };
      touchContainer.value = container;
      isDragging.value = false;
      // 不在这里阻止默认行为，等确认是拖动再阻止
    }
  };

  const handleTouchMove = (event: TouchEvent) => {
    if (touchStartIndex.value === null || touchContainer.value === null || touchStartPos.value === null || event.touches.length !== 1) {
      return;
    }

    const touch = event.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartPos.value.x);
    const deltaY = Math.abs(touch.clientY - touchStartPos.value.y);
    const moveDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // 如果移动距离超过阈值（10px），认为是拖动而不是点击
    if (moveDistance > 10) {
      isDragging.value = true;
      draggedIndex.value = touchStartIndex.value;
      event.preventDefault(); // 只有确认是拖动时才阻止默认滚动行为

      const targetIndex = findElementIndexByTouch(touch, touchContainer.value);

      if (targetIndex !== null && targetIndex !== touchStartIndex.value) {
        draggedOverIndex.value = targetIndex;
      } else {
        draggedOverIndex.value = null;
      }
    }
  };

  const handleTouchEnd = (event: TouchEvent) => {
    if (touchStartIndex.value === null || touchContainer.value === null) {
      return;
    }

    // 如果点击的是关闭按钮，或者没有发生拖动，不执行排序
    if (isCloseButton(event.target) || !isDragging.value) {
      // 重置状态但不执行排序
      touchStartIndex.value = null;
      touchContainer.value = null;
      touchStartPos.value = null;
      isDragging.value = false;
      draggedIndex.value = null;
      draggedOverIndex.value = null;
      return;
    }

    if (event.changedTouches.length > 0) {
      const touch = event.changedTouches[0];
      const targetIndex = findElementIndexByTouch(touch, touchContainer.value);

      if (targetIndex !== null && touchStartIndex.value !== null && touchStartIndex.value !== targetIndex) {
        // 执行排序逻辑
        const draggedItem = items.value[touchStartIndex.value];
        const targetItem = items.value[targetIndex];

        // 交换order值
        const tempOrder = draggedItem.order;
        draggedItem.order = targetItem.order;
        targetItem.order = tempOrder;

        // 重新排序数组
        items.value.sort((a, b) => a.order - b.order);
      }
    }

    // 重置触摸状态
    touchStartIndex.value = null;
    touchContainer.value = null;
    touchStartPos.value = null;
    isDragging.value = false;
    draggedIndex.value = null;
    draggedOverIndex.value = null;
  };

  const handleTouchCancel = () => {
    // 取消触摸时重置状态
    touchStartIndex.value = null;
    touchContainer.value = null;
    touchStartPos.value = null;
    isDragging.value = false;
    draggedIndex.value = null;
    draggedOverIndex.value = null;
  };

  return {
    draggedIndex,
    draggedOverIndex,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
  };
}
