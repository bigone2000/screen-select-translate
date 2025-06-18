/**
 * @interface ApiServiceInterface
 * @description 定義所有 API 服務都必須遵守的合約。
 * 這確保了無論我們使用 Google、Microsoft 還是其他任何服務，
 * 它們都提供相同的方法簽名，讓我們的應用程式可以輕鬆地切換服務提供者。
 */
export interface ApiServiceInterface {
  /**
   * 呼叫光學字元辨識 (OCR) API。
   * @param base64content - 圖片的 Base64 編碼字串。
   * @returns 一個解析為辨識出文字的 Promise。
   */
  callVisionApi(base64content: string): Promise<string>;

  /**
   * 呼叫翻譯 API。
   * @param text - 要翻譯的文字。
   * @param targetLanguage - 目標語言的代碼 (例如 'en', 'zh-TW')。
   * @returns 一個解析為翻譯後文字的 Promise。
   */
  callTranslateApi(text: string, targetLanguage: string): Promise<string>;
}