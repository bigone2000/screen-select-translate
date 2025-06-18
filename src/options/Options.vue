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

        <div class="form-group">
          <label for="target-language" class="form-label">
            目標語言
          </label>
          <!-- Custom Select Component -->
          <div class="custom-select" ref="customSelectRef">
            <div class="custom-select__trigger" @click="isLangDropdownOpen = !isLangDropdownOpen">
              <img v-if="selectedLanguage?.countryCode" :src="`https://flagcdn.com/w20/${selectedLanguage.countryCode}.png`" class="flag-icon" />
              <span>{{ selectedLanguage?.name || '請選擇語言' }}</span>
              <div class="custom-select__arrow" :class="{ 'open': isLangDropdownOpen }"></div>
            </div>
            <ul v-if="isLangDropdownOpen" class="custom-select__options">
              <li
                v-for="lang in supportedLanguages"
                :key="lang.code"
                class="custom-select__option"
                :class="{ 'selected': lang.code === targetLanguage }"
                @click="selectLanguage(lang)"
              >
                <img v-if="lang.countryCode" :src="`https://flagcdn.com/w20/${lang.countryCode}.png`" class="flag-icon" />
                <span v-else class="flag-icon-placeholder"></span>
                <span>{{ lang.name }}</span>
              </li>
            </ul>
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
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { supportedLanguages, type Language } from '@/utils/languages';

const apiKey = ref('');
const fontSize = ref(14);
const popupPosition = ref('bottom');
const targetLanguage = ref('zh-TW');
const statusMessage = ref('');
const isError = ref(false);
const isLangDropdownOpen = ref(false);
const customSelectRef = ref<HTMLElement | null>(null);

const selectedLanguage = computed(() => supportedLanguages.find(l => l.code === targetLanguage.value));

const statusClass = computed(() => ({
  'error': isError.value,
  'success': !isError.value,
}));

const selectLanguage = (lang: Language) => {
  targetLanguage.value = lang.code;
  isLangDropdownOpen.value = false;
};

const handleClickOutside = (event: MouseEvent) => {
  if (customSelectRef.value && !customSelectRef.value.contains(event.target as Node)) {
    isLangDropdownOpen.value = false;
  }
};

watch(isLangDropdownOpen, (isOpen) => {
  if (isOpen) {
    document.addEventListener('click', handleClickOutside);
  } else {
    document.removeEventListener('click', handleClickOutside);
  }
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
    targetLanguage: targetLanguage.value || 'zh-TW',
  };

  chrome.storage.local.set({ apiKey: settings.apiKey }, () => {
    if (chrome.runtime.lastError) {
      isError.value = true;
      statusMessage.value = `儲存失敗: ${chrome.runtime.lastError.message}`;
      setTimeout(() => { statusMessage.value = ''; }, 3000);
      return;
    }
    
    chrome.storage.sync.set({
      fontSize: settings.fontSize,
      popupPosition: settings.popupPosition,
      targetLanguage: settings.targetLanguage
    }, () => {
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
  
  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
  });
};

onMounted(() => {
  chrome.storage.local.get(['apiKey'], (result) => {
    if (result.apiKey) {
      apiKey.value = result.apiKey;
    }
  });

  chrome.storage.sync.get(['fontSize', 'popupPosition', 'targetLanguage'], (result) => {
    if (result.fontSize) {
      fontSize.value = result.fontSize;
    }
    if (result.popupPosition) {
      popupPosition.value = result.popupPosition;
    }
    if (result.targetLanguage) {
      targetLanguage.value = result.targetLanguage;
    } else {
      // 如果未設定，則使用瀏覽器語言作為預設值
      const browserLang = chrome.i18n.getUILanguage();
      const langCodeOnly = browserLang.split('-')[0];
      
      // 檢查完整語言代碼 (e.g., 'zh-TW') 是否支援
      if (supportedLanguages.some(l => l.code === browserLang)) {
        targetLanguage.value = browserLang;
      }
      // 否則，檢查主要語言代碼 (e.g., 'en') 是否支援
      else if (supportedLanguages.some(l => l.code === langCodeOnly)) {
        targetLanguage.value = langCodeOnly;
      }
      // 若都不支援，則維持預設的 'zh-TW'
    }
  });
});
</script>

<style scoped>
@import './options.style.css';
</style>