import { reactive, onMounted } from 'vue';

interface Settings {
  fontSize: number;
  popupPosition: 'top' | 'bottom' | 'left' | 'right';
}

export function useSettings() {
  const settings = reactive<Settings>({
    fontSize: 14,
    popupPosition: 'bottom',
  });

  onMounted(() => {
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

  return {
    settings,
  };
}