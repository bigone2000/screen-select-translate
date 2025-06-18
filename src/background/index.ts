import type { Rect } from '@/types';
import { callTranslateApi, callVisionApi } from '@/utils/api';
import { cropImage } from '@/utils/image';
import { getApiKey } from '@/utils/storage';

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

    const fullImageDataUrl = await chrome.tabs.captureVisibleTab({ format: 'png' });
    if (!fullImageDataUrl) throw new Error('擷取螢幕畫面失敗。');

    const croppedImageDataUrl = await cropImage(fullImageDataUrl, request.rect, request.devicePixelRatio);
    const base64content = croppedImageDataUrl.split(',')[1];

    const ocrText = await callVisionApi(base64content, apiKey);
    if (!ocrText.trim()) {
      sendResult({ success: true, ocrText: '', translatedText: '未偵測到任何文字。' });
      return;
    }

    const translatedText = await callTranslateApi(ocrText, apiKey);

    sendResult({ success: true, ocrText, translatedText });

  } catch (error) {
    console.error('處理圖片時發生錯誤:', error);
    sendResult({ success: false, error: (error as Error).message });
  }
}

chrome.runtime.onMessage.addListener((request, sender) => {
  if (request.action === 'processImage' && request.rect) {
    handleProcessImage(request, sender);
  }
});