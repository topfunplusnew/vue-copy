import { ref, type Ref } from 'vue';

export interface DragSortItem {
  id: number;
  order: number;

  [key: string]: unknown;
}

export function useDragSort<T extends DragSortItem>(items: Ref<T[]>) {
  const draggedIndex = ref<number | null>(null);
  const draggedOverIndex = ref<number | null>(null);

  const handleDragStart = (event: DragEvent, index: number) => {
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
      touchStartIndex.value = index;
      draggedIndex.value = index;
      touchContainer.value = container;
      event.preventDefault(); // 阻止默认滚动行为
    }
  };

  const handleTouchMove = (event: TouchEvent) => {
    if (touchStartIndex.value === null || touchContainer.value === null || event.touches.length !== 1) {
      return;
    }

    event.preventDefault(); // 阻止默认滚动行为

    const touch = event.touches[0];
    const targetIndex = findElementIndexByTouch(touch, touchContainer.value);

    if (targetIndex !== null && targetIndex !== touchStartIndex.value) {
      draggedOverIndex.value = targetIndex;
    } else {
      draggedOverIndex.value = null;
    }
  };

  const handleTouchEnd = (event: TouchEvent) => {
    if (touchStartIndex.value === null || touchContainer.value === null) {
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
    draggedIndex.value = null;
    draggedOverIndex.value = null;
  };

  const handleTouchCancel = () => {
    // 取消触摸时重置状态
    touchStartIndex.value = null;
    touchContainer.value = null;
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
