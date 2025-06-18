<template>
  <!-- Event listening layer -->
  <div v-if="isReady" class="event-layer" @mousedown="handleMouseDown" @mousemove="handleMouseMove" @mouseup="handleMouseUp">
    <template v-if="isSelecting">
      <div class="selection-overlay"></div>
      <div
        class="selection-box"
        :style="{
          left: `${selectionRect.x}px`,
          top: `${selectionRect.y}px`,
          width: `${selectionRect.width}px`,
          height: `${selectionRect.height}px`,
        }"
      ></div>
    </template>
  </div>

  <!-- Loading Indicator -->
  <div v-if="isLoading" class="loading-indicator">
    <div class="spinner"></div>
    <span>處理中...</span>
  </div>

  <!-- Result Card -->
  <div v-if="showResult" class="result-card card" :style="resultCardStyle">
    <div class="result-card__header" @mousedown.prevent="handleResultDragStart">
      <span class="result-card__title">翻譯結果</span>
      <button @click="closeResult" class="result-card__close-btn">&times;</button>
    </div>
    <div class="result-card__body">
      <div v-if="error" class="error-text">{{ error }}</div>
      <div v-else>
        <div class="result-section">
          <strong class="result-section__title original" @click="isOcrVisible = !isOcrVisible">
            原始文字 (OCR)
            <span class="accordion-icon">{{ isOcrVisible ? '−' : '+' }}</span>
          </strong>
          <p v-if="isOcrVisible" class="result-section__text" :style="{ fontSize: `${settings.fontSize}px` }">{{ ocrText }}</p>
        </div>
        <hr class="result-divider" />
        <div class="result-section">
          <strong class="result-section__title translated" @click="isTranslationVisible = !isTranslationVisible">
            翻譯文字 (中文)
            <span class="accordion-icon">{{ isTranslationVisible ? '−' : '+' }}</span>
          </strong>
          <p v-if="isTranslationVisible" class="result-section__text" :style="{ fontSize: `${settings.fontSize}px` }">{{ translatedText }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue';

const isReady = ref(false);
const isSelecting = ref(false);
const isMouseDown = ref(false);
const isLoading = ref(false);
const showResult = ref(false);
const ocrText = ref('');
const translatedText = ref('');
const error = ref('');

const startPos = reactive({ x: 0, y: 0 });
const selectionRect = reactive({ x: 0, y: 0, width: 0, height: 0 });

const resultCardStyle = reactive({
  top: '20px',
  left: 'auto',
  right: '20px',
  transform: '',
  width: 'auto',
});
const settings = reactive({
  fontSize: 14,
  popupPosition: 'bottom',
});
const isOcrVisible = ref(false);
const isTranslationVisible = ref(true);

const handleMouseDown = (e: any) => {
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

const handleMouseMove = (e: any) => {
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

const handleMouseUp = async () => {
  isMouseDown.value = false;

  if (!isSelecting.value) {
    document.body.style.cursor = 'auto';
    return;
  }
  
  document.body.style.cursor = 'auto';
  isSelecting.value = false;

  if (selectionRect.width < 10 || selectionRect.height < 10) {
    return;
  }

  isLoading.value = true;

  const minWidth = 300;
  resultCardStyle.width = `${Math.max(selectionRect.width, minWidth)}px`;

  const gap = 10;
  resultCardStyle.right = 'auto';
  resultCardStyle.transform = '';

  switch (settings.popupPosition) {
    case 'top':
      resultCardStyle.top = `${selectionRect.y - gap}px`;
      resultCardStyle.left = `${selectionRect.x}px`;
      resultCardStyle.transform = 'translateY(-100%)';
      break;
    case 'left':
      resultCardStyle.top = `${selectionRect.y}px`;
      resultCardStyle.left = `${selectionRect.x - gap}px`;
      resultCardStyle.transform = 'translateX(-100%)';
      break;
    case 'right':
      resultCardStyle.top = `${selectionRect.y}px`;
      resultCardStyle.left = `${selectionRect.x + selectionRect.width + gap}px`;
      break;
    case 'bottom':
    default:
      resultCardStyle.top = `${selectionRect.y + selectionRect.height + gap}px`;
      resultCardStyle.left = `${selectionRect.x}px`;
      break;
  }

  chrome.runtime.sendMessage({
    action: 'processImage',
    rect: {
      x: selectionRect.x,
      y: selectionRect.y,
      width: selectionRect.width,
      height: selectionRect.height,
    },
    devicePixelRatio: window.devicePixelRatio || 1,
  });
};

const dragState = reactive({
  isDragging: false,
  startX: 0,
  startY: 0,
  initialCardX: 0,
  initialCardY: 0,
});

const handleResultDragStart = (e: any) => {
  dragState.isDragging = true;
  dragState.startX = e.clientX;
  dragState.startY = e.clientY;

  const cardRect = (e.currentTarget as HTMLElement).parentElement!.getBoundingClientRect();

  resultCardStyle.top = `${cardRect.top}px`;
  resultCardStyle.left = `${cardRect.left}px`;
  resultCardStyle.transform = 'none';
  resultCardStyle.right = 'auto';

  dragState.initialCardX = cardRect.left;
  dragState.initialCardY = cardRect.top;

  window.addEventListener('mousemove', handleResultDragMove);
  window.addEventListener('mouseup', handleResultDragEnd);
};

const handleResultDragMove = (e: MouseEvent) => {
  if (!dragState.isDragging) return;
  const dx = e.clientX - dragState.startX;
  const dy = e.clientY - dragState.startY;
  resultCardStyle.top = `${dragState.initialCardY + dy}px`;
  resultCardStyle.left = `${dragState.initialCardX + dx}px`;
};

const handleResultDragEnd = () => {
  dragState.isDragging = false;
  window.removeEventListener('mousemove', handleResultDragMove);
  window.removeEventListener('mouseup', handleResultDragEnd);
};

const destroy = () => {
  document.body.style.cursor = 'auto';
  isReady.value = false;
  isMouseDown.value = false;
  isSelecting.value = false;
  isLoading.value = false;
  showResult.value = false;
  ocrText.value = '';
  translatedText.value = '';
  error.value = '';
  Object.assign(startPos, { x: 0, y: 0 });
  Object.assign(selectionRect, { x: 0, y: 0, width: 0, height: 0 });
};

const closeResult = () => {
  showResult.value = false;
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    destroy();
  }
};

onMounted(async () => {
  window.addEventListener('keydown', handleKeyDown);

  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === 'activate') {
      isReady.value = true;
      sendResponse({ success: true });
    } else if (request.action === 'deactivate') {
      destroy();
      sendResponse({ success: true });
    } else if (request.action === 'processImageResult') {
      isLoading.value = false;
      if (request.success) {
        ocrText.value = request.ocrText;
        translatedText.value = request.translatedText;
        error.value = '';
      } else {
        ocrText.value = '';
        translatedText.value = '';
        error.value = request.error || '發生未知錯誤。';
      }
      showResult.value = true;
    } else if (request.action === 'queryState') {
      sendResponse({ isActive: isReady.value });
    }
    return true;
  });

  chrome.storage.sync.get(['fontSize', 'popupPosition'], (result) => {
    if (result.fontSize) {
      settings.fontSize = result.fontSize;
    }
    if (result.popupPosition) {
      settings.popupPosition = result.popupPosition;
    }
  });

  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync') {
      if (changes.fontSize) {
        settings.fontSize = changes.fontSize.newValue;
      }
      if (changes.popupPosition) {
        settings.popupPosition = changes.popupPosition.newValue;
      }
    }
  });
});

onUnmounted(() => {
  document.body.style.cursor = 'auto';
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<style>
/* Using global styles with specific class names to avoid conflicts */
.event-layer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2147483640;
  pointer-events: all;
}

.selection-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: black;
  opacity: 0.5;
}

.selection-box {
  position: absolute;
  border: 2px solid var(--color-primary);
  background-color: rgba(98, 0, 238, 0.1);
}

.loading-indicator {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2147483647;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 1.125rem;
  font-weight: 500;
  font-family: var(--font-family);
  display: flex;
  align-items: center;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
  margin-right: 0.75rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.result-card {
  position: fixed;
  z-index: 2147483646;
  min-width: 300px;
  max-width: 90vw;
  display: flex;
  flex-direction: column;
  font-family: var(--font-family);
  padding: 0; /* Remove padding from .card utility */
  box-shadow: var(--shadow-dp8); /* More prominent shadow */
}

.result-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-unit) calc(var(--spacing-unit) * 2);
  background-color: var(--color-primary);
  color: var(--color-on-primary);
  border-bottom: 1px solid var(--color-primary-variant);
  cursor: move;
}

.result-card__title {
  font-weight: 500;
  font-size: var(--font-size-body);
}

.result-card__close-btn {
  font-size: 1.5rem;
  line-height: 1;
  color: var(--color-on-primary);
  opacity: 0.7;
  background: none;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s;
}
.result-card__close-btn:hover {
  opacity: 1;
}

.result-card__body {
  padding: calc(var(--spacing-unit) * 2);
  max-height: 24rem;
  overflow-y: auto;
  background-color: var(--color-surface);
  color: var(--color-on-surface);
}

.error-text {
  color: var(--color-error);
  font-weight: 500;
}

.result-section {
  margin-bottom: var(--spacing-unit);
}

.result-section__title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-caption);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: calc(var(--spacing-unit) / 2);
  cursor: pointer;
  color: var(--color-text-secondary);
}

.result-section__text {
  color: var(--color-text-primary);
  white-space: pre-wrap;
  padding-top: calc(var(--spacing-unit) / 2);
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.accordion-icon {
  font-size: 1rem;
  font-weight: bold;
}

.result-divider {
  margin: var(--spacing-unit) 0;
  border: none;
  border-top: 1px solid var(--color-divider);
}
</style>