# 豐胸隆乳矽膠保固查詢系統 - 前端 (Svelte 重構版)

這是一個專為醫療器材保固管理設計的現代化 Web 應用程式，使用 Svelte 框架重構，提供完整的保固登記、查詢和管理功能。

## 🚀 功能特色

### 🌐 公開功能

- **保固登記** - 患者可以通過 QR Code 或序號進行保固登記
- **保固查詢** - 查詢保固狀態和相關資訊
- **響應式設計** - 支援桌面和行動裝置

### 🔒 管理功能

- **管理員登入** - 安全的認證系統
- **保固管理** - 查看和管理所有保固記錄
- **統計報表** - 查看系統統計資訊

## 📁 項目結構 (重構後)

```
frontend/
├── src/
│   ├── components/         # Svelte 組件
│   │   ├── ui/            # 基礎 UI 組件
│   │   ├── LoginForm.svelte
│   │   ├── WarrantyRegistrationForm.svelte
│   │   ├── WarrantySearch.svelte
│   │   ├── AdminDashboard.svelte
│   │   └── ...
│   ├── stores/            # 狀態管理
│   │   ├── auth.ts        # 認證狀態
│   │   ├── warranty.ts    # 保固狀態
│   │   ├── app.ts         # 應用狀態
│   │   └── notifications.ts
│   ├── lib/               # 核心服務
│   │   ├── api.ts         # API 服務
│   │   ├── auth.ts        # 認證服務
│   │   └── env.ts         # 環境配置
│   ├── utils/             # 工具函數
│   │   ├── validation.ts  # 表單驗證
│   │   ├── format.ts      # 格式化工具
│   │   └── router.ts      # 路由管理
│   ├── App.svelte         # 主應用組件
│   ├── main.ts            # 應用入口
│   └── app.css            # 全局樣式
├── index-svelte.html       # Svelte 版本入口
├── test-svelte.html        # 測試頁面
├── vite.config.js          # Vite 配置
├── svelte.config.js        # Svelte 配置
├── tailwind.config.js      # Tailwind 配置
├── tsconfig.json           # TypeScript 配置
└── package.json            # 依賴管理
```

## 🛠️ 技術棧 (重構後)

### 前端技術

- **框架**: Svelte + TypeScript
- **構建工具**: Vite
- **樣式**: Tailwind CSS
- **狀態管理**: Svelte Stores
- **圖標**: Lucide Icons
- **類型檢查**: TypeScript

### 架構優化

- **模組化設計**: 組件化架構，提高代碼重用性
- **狀態管理**: 集中式狀態管理，避免程式碼分散
- **類型安全**: TypeScript 支援，減少運行時錯誤
- **響應式設計**: 支援桌面和行動裝置
- **現代化 UI**: 基於設計系統的一致性界面

## 🎨 設計特色

### 響應式設計

- 使用 Tailwind CSS 的響應式工具類
- 支援桌面、平板和手機裝置
- 流暢的使用者體驗

### 使用者介面

- 現代化的卡片式設計
- 直觀的導航系統
- 清晰的表單驗證回饋
- 即時通知系統

### 無障礙設計

- 語義化的 HTML 結構
- 適當的顏色對比
- 鍵盤導航支援

## 🚀 快速開始

### 1. 啟動後端服務

確保後端服務正在運行：

```bash
cd ../backend
go run cmd/server/main.go
```

### 2. 安裝依賴

```bash
cd frontend
npm install
```

### 3. 啟動開發伺服器

#### 原版 (Vanilla JS)

```bash
npm run dev
```

#### Svelte 重構版

```bash
npm run dev:svelte
```

這將啟動 Vite 開發伺服器，具有以下功能：

- 🔥 熱重載 (Hot Reload)
- 🚀 快速冷啟動
- 🔄 API 代理到後端
- 🛠️ 開發工具整合
- 📦 Svelte 組件熱更新

### 4. 訪問應用

- **原版**: `http://localhost:3000`
- **Svelte 版**: `http://localhost:5173`
- **測試頁面**: 直接打開 `test-svelte.html`

### 5. 其他命令

```bash
# 構建生產版本 (原版)
npm run build

# 構建生產版本 (Svelte)
npm run build:svelte

# 預覽生產版本
npm run preview

# TypeScript 類型檢查 (Svelte)
npm run check

# 監控類型檢查 (Svelte)
npm run check:watch
```

## 🔄 Svelte 重構說明

### 重構目標

原始程式碼存在以下問題：

- 程式碼過度集中在單一文件中
- 缺乏模組化設計
- 狀態管理分散
- 缺乏類型安全

### 重構成果

✅ **模組化架構**: 將功能拆分為獨立的 Svelte 組件
✅ **狀態管理**: 使用 Svelte Stores 集中管理應用狀態
✅ **類型安全**: 完整的 TypeScript 支援
✅ **組件化 UI**: 可重用的 UI 組件庫
✅ **更好的開發體驗**: 熱重載、類型檢查、自動完成

### 主要改進

1. **認證系統**: 重構為 `authStore` + `AuthService`
2. **保固管理**: 重構為 `warrantyStore` + 相關組件
3. **UI 組件**: 創建可重用的基礎組件
4. **路由管理**: 使用 SvelteKit 檔案系統路由
5. **錯誤處理**: 統一的錯誤處理和通知系統
6. **路由保護**: 使用 SvelteKit load 函數實作認證保護

### 檔案清理

✅ **已清理的檔案**:

- `assets/js/app.js` - 原版主應用程式 (已重構為 Svelte 組件)
- `assets/js/auth.js` - 原版認證功能 (已重構為 authStore + AuthService)
- `assets/js/warranty.js` - 原版保固功能 (已重構為 warrantyStore + 組件)
- `assets/js/admin.js` - 原版管理功能 (已重構為 AdminDashboard 組件)
- `assets/js/` 目錄 - 已刪除空目錄
- 測試檔案 - 清理了舊的測試和調試檔案

✅ **保留的檔案**:

- `assets/css/style.css` - 簡化後保留基本樣式供原版參考
- `index.html` - 原版入口檔案
- `index-svelte.html` - Svelte SPA 版本入口檔案
- `index-sveltekit.html` - SvelteKit 路由版本入口檔案
- `test-svelte.html` - Svelte 版本展示頁面

## 🛣️ SvelteKit 路由架構

### 路由結構

```
src/routes/
├── +layout.svelte          # 主佈局（導航欄、全局組件）
├── +page.svelte            # 首頁 (/)
├── login/
│   └── +page.svelte        # 登入頁面 (/login)
├── warranty/
│   ├── register/
│   │   └── +page.svelte    # 保固登記 (/warranty/register)
│   ├── search/
│   │   └── +page.svelte    # 保固查詢 (/warranty/search)
│   └── [id]/
│       └── +page.svelte    # 保固詳情 (/warranty/[id])
└── admin/
    ├── +page.ts            # 路由保護 (認證檢查)
    └── +page.svelte        # 管理後台 (/admin)
```

### 路由功能

- **檔案系統路由**: 基於檔案結構自動生成路由
- **動態路由**: `[id]` 支援動態參數
- **路由保護**: 使用 `+page.ts` 實作認證檢查
- **佈局系統**: `+layout.svelte` 提供共用佈局
- **SEO 友好**: 每個頁面獨立的 `<title>` 和 meta 標籤

## 📋 API 整合

前端與後端 API 的整合配置：

### API 基礎 URL

```javascript
// 在 app.js 中配置
this.apiBaseUrl = "http://localhost:8080/api/v1";
```

### 主要 API 端點

- `POST /auth/login` - 管理員登入
- `POST /warranty/register` - 保固登記
- `GET /warranty/search` - 保固查詢

## 🔧 配置選項

### 修改 API 地址

如果後端運行在不同的地址，請修改 `assets/js/app.js` 中的 `apiBaseUrl`：

```javascript
constructor() {
    this.apiBaseUrl = 'https://your-api-domain.com/api/v1';
    // ...
}
```

### 自定義樣式

在 `assets/css/style.css` 中添加自定義樣式：

```css
/* 自定義主題色彩 */
:root {
  --primary-color: #3b82f6;
  --success-color: #10b981;
  --error-color: #ef4444;
}
```

## 🎯 主要功能說明

### 保固登記流程

1. 用戶點擊「開始登記」
2. 填寫患者資訊和醫院資訊
3. 系統驗證表單資料
4. 提交到後端 API
5. 顯示登記結果

### 保固查詢流程

1. 用戶點擊「開始查詢」
2. 輸入查詢關鍵字（姓名、序號等）
3. 系統搜尋匹配的記錄
4. 顯示查詢結果

### 管理員功能

1. 管理員登入
2. 查看保固管理後台
3. 執行管理操作

## 🔒 安全特性

- **JWT Token 認證** - 安全的身份驗證
- **自動 Token 刷新** - 防止會話過期
- **輸入驗證** - 前端表單驗證
- **XSS 防護** - 安全的資料處理

## 📱 瀏覽器支援

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 🐛 故障排除

### 常見問題

1. **CORS 錯誤**

   - 確保後端已正確配置 CORS
   - 檢查 API 地址是否正確

2. **API 連接失敗**

   - 確認後端服務正在運行
   - 檢查網路連接

3. **樣式顯示異常**
   - 確認 Tailwind CSS CDN 載入正常
   - 檢查自定義 CSS 文件路徑

## 🚀 部署建議

### 生產環境部署

1. 使用 Nginx 或 Apache 提供靜態文件服務
2. 啟用 GZIP 壓縮
3. 配置適當的快取標頭
4. 使用 HTTPS

### 範例 Nginx 配置

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 📞 支援

如有問題或建議，請聯繫開發團隊。
