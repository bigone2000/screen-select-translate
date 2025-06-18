import type { Rect } from '@/types';
import { cropImage } from '@/utils/image';
import { getApiKey } from '@/utils/storage';
import { ApiServiceFactory } from '@/services/ApiServiceFactory';
import type { ApiServiceInterface } from '@/services/ApiServiceInterface';

async function handleProcessImage(request: { rect: Rect, devicePixelRatio: number }, sender: chrome.runtime.MessageSender) {
  const sourceTabId = sender.tab?.id;
  if (!sourceTabId) {
    console.error('無法取得來源分頁 ID。');
    return;
  }

  const sendResult = (payload: object) => {
    chrome.tabs.sendMessage(sourceTabId, { action: 'processImageResult', ...payload });
  };

  try {
    const apiKey = await getApiKey();
    // TODO: 未來可以讓使用者在設定頁選擇服務提供者
    const apiService: ApiServiceInterface = ApiServiceFactory.create('google', apiKey);

    const fullImageDataUrl = await chrome.tabs.captureVisibleTab({ format: 'png' });
    // 擷取螢幕畫面失敗。
    if (!fullImageDataUrl) throw new Error(chrome.i18n.getMessage('error_captureScreen'));

    const croppedImageDataUrl = await cropImage(fullImageDataUrl, request.rect, request.devicePixelRatio);
    const base64content = croppedImageDataUrl.split(',')[1];

    const ocrText = await apiService.callVisionApi(base64content);
    if (!ocrText.trim()) {
      // 未偵測到任何文字。
      sendResult({ success: true, ocrText: '', translatedText: chrome.i18n.getMessage('info_noTextDetected') });
      return;
    }

    // 從儲存空間獲取目標語言，若無則使用預設值
    const storageResult = await chrome.storage.sync.get('targetLanguage');
    const targetLanguage = storageResult.targetLanguage || 'en'; // 預設為英文

    const translatedText = await apiService.callTranslateApi(ocrText, targetLanguage);

    sendResult({ success: true, ocrText, translatedText });

  } catch (error) {
    console.error('處理圖片時發生錯誤:', error);
    sendResult({ success: false, error: (error as Error).message });
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'processImage' && request.rect) {
    // 呼叫非同步函式來處理圖片，但不在此處等待它完成
    handleProcessImage(request, sender);
    // 返回 true 來表示我們將會非同步地發送一個（或多個）回應
    // 在這個案例中，我們是透過 tabs.sendMessage 來「回應」
    return true;
  }
});