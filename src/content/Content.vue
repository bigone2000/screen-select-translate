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
    <span>{{ $t('content.loading') }}</span>
  </div>

  <!-- 結果卡片 -->
  <div v-if="showResult" ref="resultCardRef" class="result-card card" :style="resultCardStyle">
    <div class="result-card__header" @mousedown.prevent="handleResultDragStart">
      <span class="result-card__title">{{ $t('content.resultTitle') }}</span>
      <button @click="closeResult" class="result-card__close-btn">&times;</button>
    </div>
    <div class="result-card__body">
      <div v-if="error" class="error-text">{{ error }}</div>
      <div v-else>
        <div class="result-section">
          <strong class="result-section__title original" @click="isOcrVisible = !isOcrVisible">
            {{ $t('content.originalText') }}
            <span class="accordion-icon">{{ isOcrVisible ? '−' : '+' }}</span>
          </strong>
          <p v-if="isOcrVisible" class="result-section__text" :style="{ fontSize: `${settings.fontSize}px` }">{{ ocrText }}</p>
        </div>
        <hr class="result-divider" />
        <div class="result-section">
          <strong class="result-section__title translated" @click="isTranslationVisible = !isTranslationVisible">
            {{ $t('content.translatedText') }}
            <span class="accordion-icon">{{ isTranslationVisible ? '−' : '+' }}</span>
          </strong>
          <p v-if="isTranslationVisible" class="result-section__text" :style="{ fontSize: `${settings.fontSize}px` }">{{ translatedText }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSelection } from '@/composables/useSelection';
import { useDraggable } from '@/composables/useDraggable';
import { useSettings } from '@/composables/useSettings';
import type { Rect } from '@/types';

const { t } = useI18n();

// --- 核心狀態管理 ---
const isReady = ref(false); // 是否已啟動，準備好進行框選
const isLoading = ref(false);
const showResult = ref(false);
const ocrText = ref('');
const translatedText = ref('');
const error = ref('');

// --- 結果卡片可見性 ---
const isOcrVisible = ref(false);
const isTranslationVisible = ref(true);

// --- 組合式函式 ---
const resultCardRef = ref<HTMLElement | null>(null);
const { settings } = useSettings();
const { position: resultCardPosition, handleDragStart: handleResultDragStart } = useDraggable(resultCardRef);
const {
  isSelecting,
  selectionRect,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  resetSelection,
} = useSelection(handleSelectionEnd);

// --- 樣式計算 ---
const resultCardStyle = computed(() => ({
  ...resultCardPosition,
  width: resultCardWidth.value,
}));
const resultCardWidth = ref('auto');


// --- 核心邏輯 ---

// 當選取結束時的回呼函式
function handleSelectionEnd(rect: Rect) {
  isLoading.value = true;
  
  // 設定結果卡片的位置與寬度
  const minWidth = 300;
  resultCardWidth.value = `${Math.max(rect.width, minWidth)}px`;
  
  const gap = 10;
  resultCardPosition.right = 'auto';
  resultCardPosition.transform = '';

  switch (settings.popupPosition) {
    case 'top':
      resultCardPosition.top = `${rect.y - gap}px`;
      resultCardPosition.left = `${rect.x}px`;
      resultCardPosition.transform = 'translateY(-100%)';
      break;
    case 'left':
      resultCardPosition.top = `${rect.y}px`;
      resultCardPosition.left = `${rect.x - gap}px`;
      resultCardPosition.transform = 'translateX(-100%)';
      break;
    case 'right':
      resultCardPosition.top = `${rect.y}px`;
      resultCardPosition.left = `${rect.x + rect.width + gap}px`;
      break;
    case 'bottom':
    default:
      resultCardPosition.top = `${rect.y + rect.height + gap}px`;
      resultCardPosition.left = `${rect.x}px`;
      break;
  }

  // 向背景腳本發送圖片處理請求
  chrome.runtime.sendMessage({
    action: 'processImage',
    rect,
    devicePixelRatio: window.devicePixelRatio || 1,
  });
}

// 關閉結果卡片
const closeResult = () => {
  showResult.value = false;
};

// 完全重設元件狀態
const destroy = () => {
  document.body.style.cursor = 'auto';
  isReady.value = false;
  isLoading.value = false;
  showResult.value = false;
  resetSelection();
};

// --- 事件與訊息監聽 ---

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    destroy();
  }
};

onMounted(() => {
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
        error.value = request.error || t('content.error.unknown');
      }
      showResult.value = true;
    } else if (request.action === 'queryState') {
      sendResponse({ isActive: isReady.value });
      return true;
    }
  });
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<style>
@import './content.style.css';
</style>