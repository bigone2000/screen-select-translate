import type { VisionResponse, TranslateResponse } from '@/types';

const VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';
const TRANSLATE_API_URL = 'https://translation.googleapis.com/language/translate/v2';

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
    // Google $apiName$ API 錯誤: $statusText$. 回應: $responseText$
    throw new Error(chrome.i18n.getMessage('error_googleApi', [apiName, response.statusText, errorText]));
  }
  return response.json();
}

export async function callVisionApi(base64content: string, apiKey: string): Promise<string> {
  const payload = {
    requests: [{
      image: { content: base64content },
      features: [{ type: 'TEXT_DETECTION' }],
    }],
  };
  const data = await fetchApi<VisionResponse>(VISION_API_URL, payload, apiKey);
  return data.responses[0]?.fullTextAnnotation?.text || '';
}

export async function callTranslateApi(text: string, apiKey: string, targetLanguage: string): Promise<string> {
  const payload = { q: text, target: targetLanguage };
  const data = await fetchApi<TranslateResponse>(TRANSLATE_API_URL, payload, apiKey);
  return data.data.translations[0].translatedText;
}