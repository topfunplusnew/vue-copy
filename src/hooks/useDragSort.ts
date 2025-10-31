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

  return {
    draggedIndex,
    draggedOverIndex,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
  };
}
