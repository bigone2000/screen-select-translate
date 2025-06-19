# 框選即翻譯

[English](./README.md) | [繁體中文](./README.zh-TW.md)

這是一個 Chrome 瀏覽器擴充套件，讓使用者可以輕鬆框選網頁上的任何區域，並立即對選取範圍內的文字進行 OCR 辨識與翻譯。它特別適用於翻譯圖片、影片、Canvas 或任何無法直接選取複製的網頁內容。

## ▶️ 功能演示
![功能演示](assets/demo.gif)

## ✨ 主要功能

- **任意區域框選**：在任何網頁上，點擊擴充功能圖示即可啟動，然後拖曳滑鼠選取您想翻譯的區域。
- **OCR 文字辨識**：使用 Google Cloud Vision API 進行高準確度的光學字元辨識。
- **即時翻譯**：使用 Google Cloud Translation API 將辨識出的文字翻譯成繁體中文。
- **快速離開選取模式**：點擊擴充功能圖示或按下 `Esc` 鍵即可快速退出選取模式。
- **可拖曳的結果視窗**：翻譯結果會顯示在一個可自由拖曳的彈出視窗中，方便您對照原文。
- **手風琴式結果顯示**：原文與譯文採手風琴效果呈現，預設顯示譯文，讓介面更簡潔。
- **高度自訂化**：
  - **API 金鑰設定**：直接在擴充功能的設定頁面中，安全地儲存您的 Google Cloud API 金鑰。
  - **彈出位置**：可設定結果視窗預設出現在選取範圍的上、下、左、右方。
  - **字體大小**：可自由調整結果文字的字體大小。
  - **動態寬度**：結果視窗的寬度會根據您的選取範圍自動調整。
- **狀態持續性**：即使重整頁面，擴充功能的啟用狀態也會被保留。
- **國際化 (i18n)**：擴充套件介面支援多國語言（目前為繁體中文）。

## 🛠️ 技術棧

- **框架**: [Vue 3](https://vuejs.org/)
- **建置工具**: [Webpack](https://webpack.js.org/)
- **語言**: [TypeScript](https://www.typescriptlang.org/)
- **API**: Google Cloud Vision & Translation API

## 🚀 安裝與使用

### 1. 取得專案

```bash
git clone https://github.com/bigone2000/screen-select-translate.git
cd your-repo-name
```

### 2. 安裝依賴

本專案使用 `npm` 作為套件管理器。

```bash
npm install
```

### 3. 建置專案

```bash
npm run build
```

這個指令會在專案根目錄下產生一個 `dist` 資料夾。

### 4. 載入擴充功能至 Chrome

1.  開啟 Chrome 瀏覽器，前往 `chrome://extensions`。
2.  啟用右上角的「開發人員模式」。
3.  點擊「載入未封裝的項目」。
4.  選擇剛剛產生的 `dist` 資料夾。
5.  您應該就能在瀏覽器的工具列上看到「框選即翻譯」的圖示了。

### 5. 設定 API 金鑰

本擴充功能需要您自己的 Google Cloud API 金鑰才能使用 OCR 與翻譯功能。請依照以下步驟申請：

#### A. 取得 Google Cloud API 金鑰

1.  **建立/選取 Google Cloud 專案**
    *   前往 [Google Cloud Console](https://console.cloud.google.com/) 並登入您的 Google 帳戶。
    *   如果您還沒有專案，請點擊頁面頂端的專案選單，選擇「新增專案」。為專案命名後點擊「建立」。

2.  **為專案啟用計費功能**
    *   Vision API 和 Translation API 是付費服務（但提供免費額度）。您必須為專案啟用計費。
    *   在左側導覽選單中，前往「計費」，並將您的專案連結至一個有效的計費帳戶。

3.  **啟用 Vision API 和 Translation API**
    *   在左側導覽選單中，前往「API 和服務」>「程式庫」。
    *   搜尋 `Cloud Vision API`，選取後點擊「啟用」。
    *   再次返回「程式庫」，搜尋 `Cloud Translation API`，選取後點擊「啟用」。

4.  **建立 API 金鑰**
    *   在左側導覽選單中，前往「API 和服務」>「憑證」。
    *   點擊頁面上方的「+ 建立憑證」，然後選擇「API 金鑰」。
    *   系統會產生您的 API 金鑰。請立即**複製**這組金鑰。

5.  **限制金鑰以策安全 (強烈建議)**
    *   在剛剛建立金鑰的彈出視窗中，點擊「編輯 API 金鑰」（或是在憑證清單中找到您的金鑰並點擊編輯圖示）。
    *   在「應用程式限制」部分，請設定為「網站」。
    *   在「網站限制」下，點選新增，輸入 `chrome-extension://<your-extension-id>/*`，其中 `<your-extension-id>` 是您的擴充功能 ID（可以在 `chrome://extensions` 頁面找到）。
    *   在「API 限制」部分，選擇「限制金鑰」。
    *   在下方的「選取 API」下拉選單中，僅勾選 `Cloud Vision API` 和 `Cloud Translation API`。
    *   點擊「儲存」。這能確保您的金鑰只能用於這兩項服務，防止被濫用。

#### B. 將金鑰儲存至擴充功能

1.  在 Chrome 工具列上，對著「框選即翻譯」的圖示**按右鍵**，然後點擊「**選項**」。
2.  在開啟的設定頁面中，將您剛剛複製的 Google Cloud API 金鑰貼上到輸入框中。
3.  點擊「儲存」。

修改程式碼後，您通常需要在 `chrome://extensions` 頁面點擊「重新載入」按鈕來查看變更。
