import { ref, reactive } from 'vue';
import type { Rect } from '@/types';

export function useSelection(onSelectionEnd: (rect: Rect) => void) {
  const isSelecting = ref(false);
  const isMouseDown = ref(false);
  const startPos = reactive({ x: 0, y: 0 });
  const selectionRect = reactive<Rect>({ x: 0, y: 0, width: 0, height: 0 });

  const handleMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    isMouseDown.value = true;
    startPos.x = e.clientX;
    startPos.y = e.clientY;
    selectionRect.x = e.clientX;
    selectionRect.y = e.clientY;
    selectionRect.width = 0;
    selectionRect.height = 0;
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isMouseDown.value) return;

    if (!isSelecting.value) {
      const moveX = Math.abs(e.clientX - startPos.x);
      const moveY = Math.abs(e.clientY - startPos.y);
      if (moveX > 5 || moveY > 5) {
        isSelecting.value = true;
        document.body.style.cursor = 'crosshair';
      }
    }

    if (isSelecting.value) {
      const currentX = e.clientX;
      const currentY = e.clientY;
      selectionRect.x = Math.min(startPos.x, currentX);
      selectionRect.y = Math.min(startPos.y, currentY);
      selectionRect.width = Math.abs(currentX - startPos.x);
      selectionRect.height = Math.abs(currentY - startPos.y);
    }
  };

  const handleMouseUp = () => {
    isMouseDown.value = false;
    document.body.style.cursor = 'auto';

    if (!isSelecting.value) {
      return;
    }
    
    isSelecting.value = false;

    if (selectionRect.width > 10 && selectionRect.height > 10) {
      onSelectionEnd({ ...selectionRect });
    }
  };

  const resetSelection = () => {
    isSelecting.value = false;
    isMouseDown.value = false;
    Object.assign(selectionRect, { x: 0, y: 0, width: 0, height: 0 });
  };

  return {
    isSelecting,
    selectionRect,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    resetSelection,
  };
}