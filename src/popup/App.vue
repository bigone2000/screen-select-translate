<template>
  <div class="popup-container">
    <header class="popup-header">
      <img src="icon.png" class="logo" alt="logo" />
      <h1 class="popup-title">{{ title }}</h1>
    </header>

    <main class="popup-content">
      <p v-if="!isUnsupportedPage" class="popup-description">
        點擊下方按鈕，即可在網頁上拖曳選取您想翻譯的區域。
      </p>
      <p v-else class="popup-description error-message">
        {{ unsupportedMessage }}
      </p>
    </main>

    <footer class="popup-footer">
      <button
        @click="toggleActivation"
        class="popup-button"
        :class="{ 'is-active': isActive }"
        :disabled="isUnsupportedPage"
      >
        {{ isActive ? '退出選取模式' : '啟動選取' }}
      </button>
      <p class="version-tag">v{{ version }}</p>
    </footer>
  </div>
</template>

<style scoped>
/* 全局樣式與字體 */
.popup-container {
  display: flex;
  flex-direction: column;
  width: 280px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: #f9fafb; /* 更柔和的背景色 */
  color: #374151; /* 深灰色文字 */
}

/* 頁首 */
.popup-header {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.logo {
  width: 24px;
  height: 24px;
  margin-right: 12px;
}

.popup-title {
  font-size: 1.125rem; /* 18px */
  font-weight: 600;
  color: #111827;
  margin: 0;
  line-height: 1;
}

/* 主要內容 */
.popup-content {
  padding: 16px;
  text-align: center;
}

.popup-description {
  font-size: 0.875rem; /* 14px */
  line-height: 1.5;
  margin: 0;
}

.error-message {
  color: #ef4444; /* 更鮮明的紅色 */
  font-weight: 500;
}

/* 頁腳 */
.popup-footer {
  padding: 16px;
  background-color: #f3f4f6;
  border-top: 1px solid #e5e7eb;
}

/* 按鈕 */
.popup-button {
  width: 100%;
  padding: 10px 16px;
  font-size: 0.9375rem; /* 15px */
  font-weight: 500;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  background: linear-gradient(45deg, #3b82f6, #6366f1);
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
}

.popup-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
}

.popup-button.is-active {
  background: linear-gradient(45deg, #6b7280, #4b5563);
}

.popup-button:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}

/* 版本號 */
.version-tag {
  font-size: 0.75rem; /* 12px */
  color: #6b7280;
  text-align: center;
  margin-top: 12px;
  margin-bottom: 0;
}
</style>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const isActive = ref(false);
const isUnsupportedPage = ref(false);
const unsupportedMessage = ref('');
const version = ref('');
const title = ref('');

// 當彈出視窗開啟時，檢查此分頁的啟用狀態
onMounted(async () => {
  // 從 manifest 獲取版本號與應用程式名稱
  const manifest = chrome.runtime.getManifest();
  version.value = manifest.version;
  title.value = chrome.i18n.getMessage('extName');

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) {
    isUnsupportedPage.value = true;
    unsupportedMessage.value = '無法偵測到目前的分頁。';
    return;
  }

  // 檢查是否為不支援的 URL
  if (tab.url?.startsWith('chrome://') || tab.url?.startsWith('https://chrome.google.com/')) {
    isUnsupportedPage.value = true;
    unsupportedMessage.value = '此頁面不支援擴充功能。';
    return;
  }

  // 向內容腳本發送訊息，詢問其當前狀態
  try {
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'queryState' });
    isActive.value = response?.isActive || false;
  } catch (e) {
    // 如果內容腳本不存在或未回應，我們假設它是非活動狀態
    isActive.value = false;
    // 這個錯誤是預期的，如果內容腳本還沒注入
    console.log("無法查詢分頁狀態，可能內容腳本尚未注入。");
  }
});

const toggleActivation = async () => {
  if (isUnsupportedPage.value) return;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) {
    unsupportedMessage.value = '操作失敗，找不到目前的分頁。';
    return;
  }

  const newState = !isActive.value;
  const action = newState ? 'activate' : 'deactivate';

  try {
    // 直接向當前分頁發送啟用/停用指令
    await chrome.tabs.sendMessage(tab.id, { action });
    isActive.value = newState;
  } catch (error) {
    console.error(`向分頁 ${tab.id} 發送 '${action}' 指令時發生錯誤:`, error);
    unsupportedMessage.value = '操作失敗，請重新整理頁面後再試。';
    return;
  }

  setTimeout(() => window.close(), 150); // 稍微延長關閉時間以顯示按鈕狀態變化
};
</script>