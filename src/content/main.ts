import { createApp } from 'vue';
import Content from './Content.vue';
import '../style.css';

// 為 Vue 應用程式建立一個容器
const appContainer = document.createElement('div');
appContainer.id = 'screen-translator-vue-container';
document.body.appendChild(appContainer);

// 建立並掛載 Vue 應用程式
createApp(Content).mount(appContainer);