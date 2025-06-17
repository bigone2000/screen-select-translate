// --- Type Definitions ---

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

// --- Helper Functions ---
async function getApiKey(): Promise<string | null> {
  const result = await chrome.storage.local.get(['apiKey']);
  return result.apiKey || null;
}

// --- Main Message Listener ---
// --- Event Listeners ---

// Listen for tab updates to inject content script state on page load/reload
// Central message listener for all actions
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Listener for processing the image from a content script
  if (request.action === 'processImage' && request.rect) {
    (async () => {
      const sourceTabId = sender.tab?.id;
      if (!sourceTabId) {
        console.error('無法取得來源分頁 ID。');
        return;
      }

      const sendResult = (payload: object) => {
        chrome.tabs.sendMessage(sourceTabId, {
          action: 'processImageResult',
          ...payload
        });
      };

      try {
        const apiKey = await getApiKey();
        if (!apiKey) {
          throw new Error('找不到 API 金鑰，請在設定頁面中設定。');
        }

        // 1. 擷取可見分頁
        const fullImageDataUrl = await chrome.tabs.captureVisibleTab({ format: 'png' });
        if (!fullImageDataUrl) {
          throw new Error('擷取螢幕畫面失敗。');
        }

        // 2. 在背景中裁切圖片
        const croppedImageDataUrl = await cropImage(fullImageDataUrl, request.rect, request.devicePixelRatio);
        const base64content = croppedImageDataUrl.split(',')[1];

        // 3. 使用 Google Cloud Vision 進行 OCR
        const visionApiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
        const visionPayload = {
          requests: [{
            image: { content: base64content },
            features: [{ type: 'TEXT_DETECTION' }],
          }],
        };

        const visionRes = await fetch(visionApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(visionPayload),
        });

        const visionContentType = visionRes.headers.get("content-type");
        if (!visionRes.ok || !visionContentType || !visionContentType.includes("application/json")) {
          const errorText = await visionRes.text();
          throw new Error(`Google Vision API 錯誤: ${visionRes.statusText}. 回應: ${errorText}`);
        }
        const visionData: VisionResponse = await visionRes.json();
        const ocrText = visionData.responses[0]?.fullTextAnnotation?.text || '';

        if (!ocrText.trim()) {
          sendResult({ success: true, ocrText: '', translatedText: '未偵測到任何文字。' });
          return;
        }

        // 4. 使用 Google Cloud Translation 進行翻譯
        const translateApiUrl = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
        const translatePayload = {
          q: ocrText,
          target: 'zh-TW',
        };

        const translateRes = await fetch(translateApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(translatePayload),
        });

        const translateContentType = translateRes.headers.get("content-type");
        if (!translateRes.ok || !translateContentType || !translateContentType.includes("application/json")) {
          const errorText = await translateRes.text();
          throw new Error(`Google Translation API 錯誤: ${translateRes.statusText}. 回應: ${errorText}`);
        }
        const translateData: TranslateResponse = await translateRes.json();
        const translatedText = translateData.data.translations[0].translatedText;

        sendResult({ success: true, ocrText, translatedText });

      } catch (error) {
        console.error('處理圖片時發生錯誤:', error);
        sendResult({ success: false, error: (error as Error).message });
      }
    })();
    
    // 我們不再使用 sendResponse，所以不需要 return true
    return;
  }

  // 處理來自 content script 的其他同步訊息
  // 這裡的 activate/deactivate 是由 popup 直接發送到 content script 的，
  // 但我們保留這個空的 sendResponse 以避免錯誤。
  if (request.action === 'activate' || request.action === 'deactivate') {
    sendResponse({ success: true });
    return true;
  }
});

// --- Image Cropping Function ---
interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

async function cropImage(imageDataUrl: string, rect: Rect, devicePixelRatio: number): Promise<string> {
  const imageBitmap = await createImageBitmap(await (await fetch(imageDataUrl)).blob());
  
  // Scale the rectangle dimensions by the device pixel ratio
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
    physicalRect.x, physicalRect.y, physicalRect.width, physicalRect.height, // 來源矩形 (物理像素)
    0, 0, physicalRect.width, physicalRect.height                         // 目標矩形 (物理像素)
  );

  const blob = await canvas.convertToBlob({ type: 'image/png' });

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}