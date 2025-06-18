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
.options-page {
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: calc(var(--spacing-unit) * 8);
  background-color: var(--color-background);
}

.options-container {
  width: 100%;
  max-width: 480px;
  padding: 0; /* Remove padding from card to allow header/footer to span full-width */
}

.options-header {
  padding: calc(var(--spacing-unit) * 3);
  text-align: center;
}

.options-title {
  font-size: 16px; /* As requested */
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 var(--spacing-unit) 0;
}

.options-description {
  font-size: var(--font-size-body);
  color: var(--color-text-secondary);
  margin: 0;
}

.form-container {
  padding: 0 calc(var(--spacing-unit) * 3);
}

.form-group {
  margin-bottom: calc(var(--spacing-unit) * 3);
}

.form-label {
  display: block;
  font-size: var(--font-size-caption);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-unit);
}

.form-divider {
  margin: calc(var(--spacing-unit) * 3) 0;
  border: none;
  border-top: 1px solid var(--color-divider);
}

.select-wrapper {
  position: relative;
  display: inline-block;
  width: 100%;
}

.select-wrapper::after {
  content: '';
  position: absolute;
  top: 50%;
  right: calc(var(--spacing-unit) * 1.5);
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 5px solid var(--color-text-secondary);
  pointer-events: none;
  transform: translateY(-50%);
}

.select-field {
  /* Replicating .text-field styles directly and removing native arrow */
  font-family: var(--font-family);
  font-size: var(--font-size-body);
  padding: calc(var(--spacing-unit) * 1.5) calc(var(--spacing-unit) * 4) calc(var(--spacing-unit) * 1.5) var(--spacing-unit); /* Make space for custom arrow */
  border: 1px solid var(--color-divider);
  border-radius: var(--border-radius);
  background-color: var(--color-background);
  width: 100%;
  box-sizing: border-box;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

.select-field:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px var(--color-primary);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  padding: calc(var(--spacing-unit) * 2) calc(var(--spacing-unit) * 3) calc(var(--spacing-unit) * 3);
}

.status-footer {
  padding: var(--spacing-unit) calc(var(--spacing-unit) * 3);
  border-top: 1px solid var(--color-divider);
}

.status-message {
  font-size: var(--font-size-body);
  text-align: center;
  font-weight: 500;
  margin: 0;
}

.status-message.success {
  color: var(--color-primary);
}

.status-message.error {
  color: var(--color-error);
}
</style>