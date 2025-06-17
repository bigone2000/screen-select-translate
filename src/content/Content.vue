<template>
  <!-- 這是主要的事件監聽圖層 -->
  <div v-if="isReady" class="event-layer" @mousedown="handleMouseDown" @mousemove="handleMouseMove" @mouseup="handleMouseUp">
    <!-- 遮罩與選取框只在拖曳時顯示 -->
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
    處理中...
  </div>

  <!-- Result Card -->
  <div v-if="showResult" class="result-card" :style="resultCardStyle">
    <div class="result-card__header" @mousedown.prevent="handleResultDragStart">
      <span class="result-card__title">翻譯結果</span>
      <button @click="closeResult" class="result-card__close-btn">&times;</button>
    </div>
    <div class="result-card__body">
      <div v-if="error" class="error-text">{{ error }}</div>
      <div v-else>
        <div class="result-section">
          <strong class="result-section__title original" @click="isOcrVisible = !isOcrVisible">
            原始文字 (OCR):
            <span class="accordion-icon">{{ isOcrVisible ? '−' : '+' }}</span>
          </strong>
          <p v-if="isOcrVisible" class="result-section__text" :style="{ fontSize: `${settings.fontSize}px` }">{{ ocrText }}</p>
        </div>
        <hr class="result-divider" />
        <div class="result-section">
          <strong class="result-section__title translated" @click="isTranslationVisible = !isTranslationVisible">
            翻譯文字 (中文):
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

const isReady = ref(false); // 是否已啟動，準備好進行框選
const isSelecting = ref(false); // 使用者是否正在拖曳選取
const isMouseDown = ref(false); // 滑鼠按鍵是否被按住
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
  // 初始化選取框，但尚不顯示
  selectionRect.x = e.clientX;
  selectionRect.y = e.clientY;
  selectionRect.width = 0;
  selectionRect.height = 0;
};

const handleMouseMove = (e: any) => {
  if (!isMouseDown.value) return;

  // 按下滑鼠後，檢查是否應該開始選取
  if (!isSelecting.value) {
    const moveX = Math.abs(e.clientX - startPos.x);
    const moveY = Math.abs(e.clientY - startPos.y);
    // 只有在滑鼠移動超過一個小小的閾值後才開始選取
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
  isMouseDown.value = false; // Reset mouse down state regardless

  // 如果我們不是在選取模式（例如只是點擊而沒有拖曳），就直接退出
  if (!isSelecting.value) {
    document.body.style.cursor = 'auto'; // 確保游標被重設
    return;
  }
  
  document.body.style.cursor = 'auto';
  isSelecting.value = false;
  // 不要停用監聽圖層，讓使用者可以進行下一次選取

  if (selectionRect.width < 10 || selectionRect.height < 10) {
    // 這是一個點擊，不是拖曳。直接忽略並等待下一次拖曳。
    return;
  }

  isLoading.value = true;

  // 設定結果卡片的寬度
  const minWidth = 300;
  resultCardStyle.width = `${Math.max(selectionRect.width, minWidth)}px`;

  // 根據設定來決定結果卡片的位置
  const gap = 10; // 與選取範圍的間距為 10px
  resultCardStyle.right = 'auto'; // 重設 right 定位
  resultCardStyle.transform = ''; // 重設 transform

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

  // 取得元素在畫面上的真實視覺位置，將 transform 的效果也計算在內
  const cardRect = (e.currentTarget as HTMLElement).parentElement!.getBoundingClientRect();

  // 將 transform 後的位置「固定」到 top/left 屬性上，並移除 transform
  // 這樣可以避免拖曳時的跳動，讓拖曳更平滑
  resultCardStyle.top = `${cardRect.top}px`;
  resultCardStyle.left = `${cardRect.left}px`;
  resultCardStyle.transform = 'none';
  resultCardStyle.right = 'auto';

  // 拖曳的初始位置現在是已經「固定」好的 top/left
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
  // 重設所有狀態到初始值，而不是移除整個元件
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
  // 不要銷毀元件，只是隱藏結果。
  // 元件會等待下一次的 'activate' 訊息。
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    destroy();
  }
};

onMounted(async () => {
  window.addEventListener('keydown', handleKeyDown);

  // 監聽來自背景腳本的訊息
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
      // 這是推送訊息，不需要回應
    } else if (request.action === 'queryState') {
      sendResponse({ isActive: isReady.value });
    }
    return true; // 保持訊息通道開啟以進行非同步回應
  });


  // 掛載時載入設定
  chrome.storage.sync.get(['fontSize', 'popupPosition'], (result) => {
    if (result.fontSize) {
      settings.fontSize = result.fontSize;
    }
    if (result.popupPosition) {
      settings.popupPosition = result.popupPosition;
    }
  });

  // 監聽設定變更
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
/* 我們沒有使用 'scoped' 是因為這個容器被掛載在 body 的根層級，
   但我們使用特定的 class 名稱來避免樣式衝突。 */

.event-layer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2147483640;
  /* 這個圖層是透明的，但會捕捉滑鼠事件 */
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
  border: 2px solid white;
  background-color: rgba(255, 255, 255, 0.1);
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
  font-weight: 600;
  font-family: sans-serif;
}

.result-card {
  position: fixed;
  /* top, left, right 現在由 inline style 控制 */
  z-index: 2147483646;
  /* width is now controlled by inline style */
  min-width: 300px;
  max-width: 90vw;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.2), 0 8px 10px -6px rgb(0 0 0 / 0.2);
  border: 1px solid #e2e8f0; /* slate-200 */
  display: flex;
  flex-direction: column;
  font-family: sans-serif;
}

.result-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background-color: #1e293b; /* slate-800 */
  border-bottom: 1px solid #334155; /* slate-700 */
  cursor: move;
}

.result-card__title {
  font-weight: 600;
  font-size: 0.875rem;
  color: #f1f5f9; /* slate-100 */
}

.result-card__close-btn {
  font-size: 1.5rem;
  line-height: 1;
  color: #94a3b8; /* slate-400 */
  background: none;
  border: none;
  cursor: pointer;
}
.result-card__close-btn:hover {
  color: #f8fafc; /* slate-50 */
}

.result-card__body {
  padding: 1rem;
  max-height: 24rem;
  overflow-y: auto;
}

.error-text {
  color: #dc2626; /* red-600 */
}

.result-section {
  margin-bottom: 0.75rem;
}

.result-section__title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
  cursor: pointer;
}
.result-section__title.original {
  color: #2563eb; /* blue-600 */
}
.result-section__title.translated {
  color: #16a34a; /* green-600 */
}

.result-section__text {
  /* font-size 現在由 inline style 控制 */
  color: #1e293b; /* slate-800 */
  white-space: pre-wrap;
  padding-top: 0.25rem;
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
  margin: 0.75rem 0;
  border-color: #e2e8f0; /* slate-200 */
  border-top-width: 1px;
}
</style>