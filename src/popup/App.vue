<template>
  <div class="popup-container">
    <header class="popup-header">
      <img src="icon.png" class="logo" alt="logo" />
      <h1 class="popup-title">{{ title }}</h1>
    </header>

    <main class="popup-content">
      <p class="popup-description">
        點擊下方按鈕，在網頁上拖曳選取範圍。
      </p>
    </main>

    <footer class="popup-footer">
      <button @click="toggleActivation" class="button" :class="{ 'is-active': isActive }" :disabled="isUnsupportedPage">
        {{ isActive ? '退出選取' : '啟動選取' }}
      </button>
      <div v-if="unsupportedMessage">
        <p class="error-message">{{ unsupportedMessage }}</p>
      </div>
      <p class="version-tag">v{{ version }}</p>
    </footer>
  </div>
</template>

<style scoped>
@import './popup.style.css';
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