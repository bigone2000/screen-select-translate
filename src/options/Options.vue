<template>
  <div class="options-page">
    <div class="options-container">
      <div>
        <h1 class="options-container__title">設定</h1>
        <p class="options-container__description">
          管理您的 API 金鑰與擴充功能顯示設定。
        </p>
      </div>
      <div class="form-container">
        <div class="form-group">
          <label for="api-key" class="form-group__label">
            Google Cloud API Key
          </label>
          <input
            v-model="apiKey"
            id="api-key"
            type="password"
            class="form-group__input"
            placeholder="請在此貼上您的 API 金鑰"
          />
        </div>
        <hr class="form-divider" />
        <div class="form-group">
          <label for="font-size" class="form-group__label">
            顯示結果字型大小 (px)
          </label>
          <input
            v-model.number="fontSize"
            id="font-size"
            type="number"
            class="form-group__input"
            placeholder="預設為 14"
          />
        </div>
        <div class="form-group">
          <label for="popup-position" class="form-group__label">
            顯示結果彈出位置
          </label>
          <select v-model="popupPosition" id="popup-position" class="form-group__select">
            <option value="bottom">選取範圍下方</option>
            <option value="top">選取範圍上方</option>
            <option value="left">選取範圍左方</option>
            <option value="right">選取範圍右方</option>
          </select>
        </div>
        <div class="form-group">
          <button @click="saveSettings" class="button button--primary">
            儲存設定
          </button>
        </div>
      </div>
      <p v-if="statusMessage" class="status-message" :class="statusClass">
        {{ statusMessage }}
      </p>
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

const statusClass = computed(() => {
  return {
    'status-message--error': isError.value,
    'status-message--success': !isError.value,
  };
});

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

  // Use local storage for API key for security, sync for settings
  chrome.storage.local.set({ apiKey: settings.apiKey }, () => {
    if (chrome.runtime.lastError) {
      isError.value = true;
      statusMessage.value = `儲存失敗: ${chrome.runtime.lastError.message}`;
      setTimeout(() => { statusMessage.value = ''; }, 3000);
      return; // Stop if API key saving fails
    }
    
    chrome.storage.sync.set({ fontSize: settings.fontSize, popupPosition: settings.popupPosition }, () => {
      if (chrome.runtime.lastError) {
        isError.value = true;
        statusMessage.value = `儲存失敗: ${chrome.runtime.lastError.message}`;
      } else {
        isError.value = false;
        statusMessage.value = '設定已成功儲存！';
      }
      setTimeout(() => { statusMessage.value = ''; }, 3000);
    });
  });
};

onMounted(() => {
  // Get API Key from local storage
  chrome.storage.local.get(['apiKey'], (result) => {
    if (result.apiKey) {
      apiKey.value = result.apiKey;
    }
  });

  // Get settings from sync storage
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
.options-page {
  min-height: 100vh;
  background-color: #f8fafc; /* slate-50 */
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: sans-serif;
}

.options-container {
  width: 100%;
  max-width: 28rem; /* max-w-md */
  padding: 2rem; /* p-8 */
  background-color: #ffffff;
  border-radius: 0.5rem; /* rounded-lg */
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); /* shadow-md */
}

.options-container > *:not(:first-child) {
    margin-top: 1.5rem; /* space-y-6 */
}

.options-container__title {
  font-size: 1.5rem; /* text-2xl */
  font-weight: 700; /* font-bold */
  text-align: center;
  color: #1e293b; /* slate-800 */
}

.options-container__description {
  margin-top: 0.5rem; /* mt-2 */
  font-size: 0.875rem; /* text-sm */
  text-align: center;
  color: #475569; /* slate-600 */
}

.form-container > *:not(:first-child) {
    margin-top: 1rem; /* space-y-4 */
}

.form-group {
  /* No specific styles for the group wrapper itself */
}

.form-group__label {
  font-size: 0.875rem; /* text-sm */
  font-weight: 500; /* font-medium */
  color: #334155; /* slate-700 */
}

.form-group__input {
  width: 100%;
  padding: 0.5rem 0.75rem; /* px-3 py-2 */
  margin-top: 0.25rem; /* mt-1 */
  color: #0f172a; /* slate-900 */
  background-color: #f8fafc; /* bg-slate-50 */
  border: 1px solid #cbd5e1; /* border-slate-300 */
  border-radius: 0.375rem; /* rounded-md */
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); /* shadow-sm */
  outline: none;
}

.form-group__input:focus {
  border-color: #3b82f6; /* focus:border-blue-500 */
  box-shadow: 0 0 0 2px #3b82f680; /* focus:ring-2 focus:ring-blue-500 */
}

.form-divider {
  margin: 1.5rem 0;
  border-color: #e2e8f0; /* slate-200 */
  border-top-width: 1px;
}

.form-group__select {
  width: 100%;
  padding: 0.5rem 0.75rem;
  margin-top: 0.25rem;
  color: #0f172a;
  background-color: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 0.375rem;
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  outline: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
}

.form-group__select:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px #3b82f680;
}

.button {
  width: 100%;
  padding: 0.5rem 1rem; /* px-4 py-2 */
  font-weight: 600; /* font-semibold */
  border-radius: 0.375rem; /* rounded-md */
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
  outline: none;
}

.button--primary {
  color: #ffffff;
  background-color: #2563eb; /* bg-blue-600 */
}

.button--primary:hover {
  background-color: #1d4ed8; /* hover:bg-blue-700 */
}

.button--primary:focus {
  box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px #3b82f6; /* focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 */
}

.status-message {
  font-size: 0.875rem; /* text-sm */
  text-align: center;
  font-weight: 500; /* font-medium */
}

.status-message--success {
  color: #16a34a; /* text-green-600 */
}

.status-message--error {
  color: #dc2626; /* text-red-600 */
}
</style>