// --- 常數 ---
const VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';
const TRANSLATE_API_URL = 'https://translation.googleapis.com/language/translate/v2';

// --- 類型定義 ---
interface VisionResponse {
  responses: {
    fullTextAnnotation?: {
      text: string;
    };
  }[];
}

interface TranslateResponse {
  data: {
    translations: {
      translatedText: string;
    }[];
  };
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// --- 通用 API 輔助函式 ---
async function fetchApi<T>(url: string, body: object, apiKey: string): Promise<T> {
  const fullUrl = `${url}?key=${apiKey}`;
  const response = await fetch(fullUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const contentType = response.headers.get("content-type");
  if (!response.ok || !contentType || !contentType.includes("application/json")) {
    const errorText = await response.text();
    const apiName = new URL(url).hostname.split('.')[0] || 'API';
    throw new Error(`Google ${apiName} 錯誤: ${response.statusText}. 回應: ${errorText}`);
  }
  return response.json();
}

// --- Google API 呼叫函式 ---
async function callVisionApi(base64content: string, apiKey: string): Promise<string> {
  const payload = {
    requests: [{
      image: { content: base64content },
      features: [{ type: 'TEXT_DETECTION' }],
    }],
  };
  const data = await fetchApi<VisionResponse>(VISION_API_URL, payload, apiKey);
  return data.responses[0]?.fullTextAnnotation?.text || '';
}

async function callTranslateApi(text: string, apiKey: string): Promise<string> {
  const payload = { q: text, target: 'zh-TW' };
  const data = await fetchApi<TranslateResponse>(TRANSLATE_API_URL, payload, apiKey);
  return data.data.translations[0].translatedText;
}

// --- Chrome API 輔助函式 ---
async function getApiKey(): Promise<string> {
  const result = await chrome.storage.local.get(['apiKey']);
  if (!result.apiKey) {
    throw new Error('找不到 API 金鑰，請在擴充功能的設定頁面中設定。');
  }
  return result.apiKey;
}

// --- 圖片處理函式 ---
async function cropImage(imageDataUrl: string, rect: Rect, devicePixelRatio: number): Promise<string> {
  const response = await fetch(imageDataUrl);
  const blob = await response.blob();
  const imageBitmap = await createImageBitmap(blob);

  const physicalRect = {
    x: rect.x * devicePixelRatio,
    y: rect.y * devicePixelRatio,
    width: rect.width * devicePixelRatio,
    height: rect.height * devicePixelRatio,
  };

  const canvas = new OffscreenCanvas(physicalRect.width, physicalRect.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('無法取得 canvas context');
  }

  ctx.drawImage(
    imageBitmap,
    physicalRect.x, physicalRect.y, physicalRect.width, physicalRect.height,
    0, 0, physicalRect.width, physicalRect.height
  );

  const canvasBlob = await canvas.convertToBlob({ type: 'image/png' });
  if (!canvasBlob) {
    throw new Error('無法將 Canvas 轉換為 Blob');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(canvasBlob);
  });
}

// --- 主要訊息處理器 ---
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

// --- 事件監聽器 ---
chrome.runtime.onMessage.addListener((request, sender) => {
  if (request.action === 'processImage' && request.rect) {
    handleProcessImage(request, sender);
  }
  // 因為我們是透過 chrome.tabs.sendMessage 非同步回傳結果，
  // 而不是使用 onMessage 的 sendResponse 回呼，所以不需要 `return true`。
});