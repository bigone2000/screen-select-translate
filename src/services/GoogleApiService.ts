import type { VisionResponse, TranslateResponse } from '@/types';
import type { ApiServiceInterface } from './ApiServiceInterface';

export class GoogleApiService implements ApiServiceInterface {
  private static readonly VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';
  private static readonly TRANSLATE_API_URL = 'https://translation.googleapis.com/language/translate/v2';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async fetchApi<T>(url: string, body: object): Promise<T> {
    const fullUrl = `${url}?key=${this.apiKey}`;
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const apiName = new URL(url).hostname.split('.')[0] || 'API';
      throw new Error(chrome.i18n.getMessage('error_googleApi', [apiName, response.statusText, errorText]));
    }
    return response.json();
  }

  public async callVisionApi(base64content: string): Promise<string> {
    const payload = {
      requests: [{
        image: { content: base64content },
        features: [{ type: 'TEXT_DETECTION' }],
      }],
    };
    const data = await this.fetchApi<VisionResponse>(GoogleApiService.VISION_API_URL, payload);
    return data.responses[0]?.fullTextAnnotation?.text || '';
  }

  public async callTranslateApi(text: string, targetLanguage: string): Promise<string> {
    const payload = { q: text, target: targetLanguage };
    const data = await this.fetchApi<TranslateResponse>(GoogleApiService.TRANSLATE_API_URL, payload);
    return data.data.translations[0].translatedText;
  }
}