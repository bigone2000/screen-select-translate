import { reactive, ref, watch } from 'vue';
import type { Ref } from 'vue';

export function useDraggable(targetRef: Ref<HTMLElement | null>) {
  const position = reactive({
    top: '20px',
    left: 'auto',
    right: '20px',
    transform: '',
  });

  const isDragging = ref(false);
  const dragStartPos = reactive({ x: 0, y: 0 });
  const initialPos = reactive({ x: 0, y: 0 });

  const handleDragStart = (e: MouseEvent) => {
    if (!targetRef.value) return;

    isDragging.value = true;
    dragStartPos.x = e.clientX;
    dragStartPos.y = e.clientY;

    const cardRect = targetRef.value.getBoundingClientRect();
    
    position.top = `${cardRect.top}px`;
    position.left = `${cardRect.left}px`;
    position.transform = 'none';
    position.right = 'auto';

    initialPos.x = cardRect.left;
    initialPos.y = cardRect.top;

    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
  };

  const handleDragMove = (e: MouseEvent) => {
    if (!isDragging.value) return;
    const dx = e.clientX - dragStartPos.x;
    const dy = e.clientY - dragStartPos.y;
    position.top = `${initialPos.y + dy}px`;
    position.left = `${initialPos.x + dx}px`;
  };

  const handleDragEnd = () => {
    isDragging.value = false;
    window.removeEventListener('mousemove', handleDragMove);
    window.removeEventListener('mouseup', handleDragEnd);
  };

  return {
    position,
    handleDragStart,
  };
}