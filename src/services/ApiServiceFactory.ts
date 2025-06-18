import type { ApiServiceInterface } from './ApiServiceInterface';
import { GoogleApiService } from './GoogleApiService';

// 在此處定義所有支援的服務提供者
type ApiProvider = 'google'; // 未來可以擴充為 'google' | 'microsoft' | 'aws'

export class ApiServiceFactory {
  /**
   * 根據指定的服務提供者建立一個 API 服務的實例。
   * @param provider - 服務提供者的名稱 (例如 'google')。
   * @param apiKey - 該服務所需的 API 金鑰。
   * @returns 一個遵守 ApiServiceInterface 合約的服務實例。
   */
  public static create(provider: ApiProvider, apiKey: string): ApiServiceInterface {
    switch (provider) {
      case 'google':
        return new GoogleApiService(apiKey);
      // 未來若要新增 Microsoft 服務，只需在此處新增一個 case：
      // case 'microsoft':
      //   return new MicrosoftApiService(apiKey);
      default:
        // 確保所有情況都有處理，若無則在編譯時期報錯
        const exhaustiveCheck: never = provider;
        throw new Error(`不支援的服務提供者: ${exhaustiveCheck}`);
    }
  }
}