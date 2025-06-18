export async function getApiKey(): Promise<string> {
  const result = await chrome.storage.local.get(['apiKey']);
  if (!result.apiKey) {
    throw new Error('找不到 API 金鑰，請點選「框選即翻譯」的擴充圖示右鍵，再點選選項，即可進入設定頁面。');
  }
  return result.apiKey;
}