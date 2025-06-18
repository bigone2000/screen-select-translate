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
.popup-container {
  display: flex;
  flex-direction: column;
  width: 300px;
  background-color: var(--color-surface);
  color: var(--color-on-surface);
}

.popup-header {
  display: flex;
  align-items: center;
  padding: calc(var(--spacing-unit) * 2);
  border-bottom: 1px solid var(--color-divider);
  background-image: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23e0e0e0' fill-opacity='0.4' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E");
}

.logo {
  width: 24px;
  height: 24px;
  margin-right: calc(var(--spacing-unit) * 1.5);
}

.popup-title {
  font-size: var(--font-size-title);
  font-weight: 500;
  margin: 0;
  line-height: 1;
}

.popup-content {
  padding: calc(var(--spacing-unit) * 3) calc(var(--spacing-unit) * 2);
  /* More vertical padding */
  text-align: center;
  background-color: #fafafa;
}

.popup-description {
  font-size: var(--font-size-body);
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin: 0;
}

.error-message {
  color: var(--color-error);
  font-weight: 500;
  margin: 0;
  line-height: 1.5;
}

.popup-footer {
  padding: calc(var(--spacing-unit) * 2);
  background-color: var(--color-background);
  border-top: 1px solid var(--color-divider);
  position: relative;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cg fill='%23d2d2d2' fill-opacity='0.4'%3E%3Ccircle cx='12' cy='12' r='1'/%3E%3C/g%3E%3C/svg%3E");
}

/* Override for the main action button */
.button {
  width: 100%;
}

/* Specific style for the active (deactivation) state */
.button.is-active {
  background-color: var(--color-error);
}

.version-tag {
  font-size: var(--font-size-caption);
  color: var(--color-text-secondary);
  text-align: center;
  margin-top: var(--spacing-unit);
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