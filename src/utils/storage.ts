export async function getApiKey(): Promise<string> {
  const result = await chrome.storage.local.get(['apiKey']);
  if (!result.apiKey) {
    throw new Error('找不到 API 金鑰，請在擴充功能的設定頁面中設定。');
  }
  return result.apiKey;
}