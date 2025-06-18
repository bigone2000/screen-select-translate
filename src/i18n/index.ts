import { createI18n } from 'vue-i18n';
import en from '@/locales/en.json';
import zhTW from '@/locales/zh-TW.json';

// 取得瀏覽器介面語言
const browserLanguage = chrome.i18n.getUILanguage();

// 決定要使用的語系
// 如果瀏覽器語言是任何中文語系，都使用繁體中文，否則預設為英文
const locale = browserLanguage.startsWith('zh') ? 'zh-TW' : 'en';

const i18n = createI18n({
  legacy: false, // 使用 Composition API
  locale: locale,
  fallbackLocale: 'en', // 若當前語系找不到翻譯，則退回英文
  messages: {
    'en': en,
    'zh-TW': zhTW,
  },
});

export default i18n;