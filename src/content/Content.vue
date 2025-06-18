<template>
  <!-- 事件監聽圖層 -->
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

  <!-- 載入指示器 -->
  <div v-if="isLoading" class="loading-indicator">
    <div class="spinner"></div>
    <span>處理中...</span>
  </div>

  <!-- 結果卡片 -->
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
@import './content.style.css';
</style>