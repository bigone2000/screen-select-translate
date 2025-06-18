<template>
  <div class="options-page">
    <div class="options-container card">
      <header class="options-header">
        <h1 class="options-title">設定</h1>
        <p class="options-description">
          管理您的 API 金鑰與擴充功能顯示設定。
        </p>
      </header>

      <main class="form-container">
        <div class="form-group">
          <label for="api-key" class="form-label">
            Google Cloud API Key
          </label>
          <input
            v-model="apiKey"
            id="api-key"
            type="password"
            class="text-field"
            placeholder="請在此貼上您的 API 金鑰"
          />
        </div>

        <hr class="form-divider" />

        <div class="form-group">
          <label for="font-size" class="form-label">
            顯示結果字型大小 (px)
          </label>
          <input
            v-model.number="fontSize"
            id="font-size"
            type="number"
            class="text-field"
            placeholder="預設為 14"
          />
        </div>

        <div class="form-group">
          <label for="popup-position" class="form-label">
            顯示結果彈出位置
          </label>
          <div class="select-wrapper">
            <select v-model="popupPosition" id="popup-position" class="select-field">
              <option value="bottom">選取範圍下方</option>
              <option value="top">選取範圍上方</option>
              <option value="left">選取範圍左方</option>
              <option value="right">選取範圍右方</option>
            </select>
          </div>
        </div>

        <div class="form-actions">
          <button @click="saveSettings" class="button">
            儲存設定
          </button>
        </div>
      </main>

      <footer v-if="statusMessage" class="status-footer">
        <p class="status-message" :class="statusClass">
          {{ statusMessage }}
        </p>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';

const apiKey = ref('');
const fontSize = ref(14);
const popupPosition = ref('bottom');
const statusMessage = ref('');
const isError = ref(false);

const statusClass = computed(() => ({
  'error': isError.value,
  'success': !isError.value,
}));

const saveSettings = () => {
  if (!apiKey.value.trim()) {
    isError.value = true;
    statusMessage.value = 'API 金鑰不能為空。';
    setTimeout(() => { statusMessage.value = ''; }, 3000);
    return;
  }

  const settings = {
    apiKey: apiKey.value,
    fontSize: fontSize.value || 14,
    popupPosition: popupPosition.value || 'bottom',
  };

  chrome.storage.local.set({ apiKey: settings.apiKey }, () => {
    if (chrome.runtime.lastError) {
      isError.value = true;
      statusMessage.value = `儲存失敗: ${chrome.runtime.lastError.message}`;
      setTimeout(() => { statusMessage.value = ''; }, 3000);
      return;
    }
    
    chrome.storage.sync.set({ fontSize: settings.fontSize, popupPosition: settings.popupPosition }, () => {
      if (chrome.runtime.lastError) {
        isError.value = true;
        statusMessage.value = `儲存失敗: ${chrome.runtime.lastError.message}`;
      } else {
        isError.value = false;
        statusMessage.value = '設定已成功儲存，您可以關閉視窗！';
      }
      setTimeout(() => { statusMessage.value = ''; }, 3000);
    });
  });
};

onMounted(() => {
  chrome.storage.local.get(['apiKey'], (result) => {
    if (result.apiKey) {
      apiKey.value = result.apiKey;
    }
  });

  chrome.storage.sync.get(['fontSize', 'popupPosition'], (result) => {
    if (result.fontSize) {
      fontSize.value = result.fontSize;
    }
    if (result.popupPosition) {
      popupPosition.value = result.popupPosition;
    }
  });
});
</script>

<style scoped>
@import './options.style.css';
</style>