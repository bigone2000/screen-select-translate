import { createApp } from 'vue'
import Options from './Options.vue'
import '../style.css'
import i18n from '@/i18n';

// 動態設定頁面標題
document.title = chrome.i18n.getMessage('optionsTitle');

createApp(Options).use(i18n).mount('#options')