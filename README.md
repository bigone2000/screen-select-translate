# 框選即翻譯 (Screen-Select-Translate)

這是一個 Chrome 瀏覽器擴充套件，讓使用者可以輕鬆框選網頁上的任何區域，並立即對選取範圍內的文字進行 OCR 辨識與翻譯。它特別適用於翻譯圖片、影片、Canvas 或任何無法直接選取複製的網頁內容。

## ✨ 主要功能

- **任意區域框選**：在任何網頁上，點擊擴充功能圖示即可啟動，然後拖曳滑鼠選取您想翻譯的區域。
- **OCR 文字辨識**：使用 Google Cloud Vision API 進行高準確度的光學字元辨識。
- **即時翻譯**：使用 Google Cloud Translation API 將辨識出的文字翻譯成繁體中文。
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
- **建置工具**: [Vite](https://vitejs.dev/)
- **語言**: [TypeScript](https://www.typescriptlang.org/)
- **擴充功能框架**: [@crxjs/vite-plugin](https://crxjs.dev/vite-plugin)
- **API**: Google Cloud Vision & Translation API

## 🚀 安裝與使用

### 1. 取得專案

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

### 2. 安裝依賴

本專案使用 `pnpm` 作為套件管理器。

```bash
pnpm install
```

### 3. 建置專案

```bash
pnpm build
```

這個指令會在專案根目錄下產生一個 `dist` 資料夾。

### 4. 載入擴充功能至 Chrome

1.  開啟 Chrome 瀏覽器，前往 `chrome://extensions`。
2.  啟用右上角的「開發人員模式」。
3.  點擊「載入未封裝的項目」。
4.  選擇剛剛產生的 `dist` 資料夾。
5.  您應該就能在瀏覽器的工具列上看到「框選即翻譯」的圖示了。

### 5. 設定 API 金鑰

1.  在 Chrome 工具列上，對著「框選即翻譯」的圖示**按右鍵**，然後點擊「**選項**」。
2.  在開啟的設定頁面中，輸入您的 Google Cloud API 金鑰並儲存。
3.  **重要**: 請確保您的 Google Cloud 專案已經啟用了 Vision API 和 Translation API。

## 💻 開發

在開發過程中，您可以使用 watch 模式，讓 Vite 自動在您存檔時重新建置：

```bash
pnpm dev
```

修改程式碼後，您通常需要在 `chrome://extensions` 頁面點擊「重新載入」按鈕來查看變更。
