# 開發指南 - Svelte 重構版

## 🏗️ 架構概覽

### 目錄結構說明

```
src/
├── components/          # Svelte 組件
│   ├── ui/             # 基礎 UI 組件
│   │   ├── Button.svelte
│   │   ├── Input.svelte
│   │   ├── LoadingSpinner.svelte
│   │   └── Notification.svelte
│   ├── LoginForm.svelte
│   ├── WarrantyRegistrationForm.svelte
│   ├── WarrantySearch.svelte
│   ├── WarrantyCard.svelte
│   ├── WarrantyDetails.svelte
│   ├── AdminDashboard.svelte
│   ├── Header.svelte
│   ├── HomePage.svelte
│   ├── UserMenu.svelte
│   ├── AuthGuard.svelte
│   ├── NotificationContainer.svelte
│   └── LoadingOverlay.svelte
├── stores/             # 狀態管理
│   ├── auth.ts         # 認證狀態
│   ├── warranty.ts     # 保固狀態
│   ├── app.ts          # 應用狀態
│   └── notifications.ts # 通知狀態
├── lib/                # 核心服務
│   ├── api.ts          # API 服務
│   ├── auth.ts         # 認證服務
│   └── env.ts          # 環境配置
├── utils/              # 工具函數
│   ├── validation.ts   # 表單驗證
│   ├── format.ts       # 格式化工具
│   └── router.ts       # 路由管理
├── App.svelte          # 主應用組件
├── main.ts             # 應用入口
└── app.css             # 全局樣式
```

## 🔧 開發環境設置

### 必要工具

- Node.js 18+
- npm 或 yarn
- VS Code (推薦)

### VS Code 擴展推薦

- Svelte for VS Code
- TypeScript Importer
- Tailwind CSS IntelliSense
- Prettier - Code formatter
- ESLint

### 環境變數配置

在 `src/lib/env.ts` 中配置環境變數：

```typescript
export const config = {
  apiBaseUrl: getEnvVar("VITE_API_BASE_URL") || "http://localhost:8080/api/v1",
  debug: getEnvVar("VITE_DEBUG") === "true",
};
```

## 📦 狀態管理

### Svelte Stores 使用

#### 認證狀態 (`authStore`)

```typescript
import { authStore, isAuthenticated, isAdmin } from "$stores/auth";

// 登入
authStore.login(token, username, role, expiresAt);

// 登出
authStore.logout();

// 檢查認證狀態
$: isLoggedIn = $isAuthenticated;
$: isAdminUser = $isAdmin;
```

#### 保固狀態 (`warrantyStore`)

```typescript
import { warrantyStore } from "$stores/warranty";

// 設置保固列表
warrantyStore.setWarranties(warranties, pagination);

// 添加新保固
warrantyStore.addWarranty(warranty);

// 搜尋保固
warrantyStore.setSearchResults(results, query);
```

#### 通知系統 (`notificationStore`)

```typescript
import { notificationStore } from "$stores/notifications";

// 顯示通知
notificationStore.success("操作成功！");
notificationStore.error("發生錯誤");
notificationStore.warning("警告訊息");
notificationStore.info("資訊提示");
```

## 🎨 UI 組件開發

### 基礎組件使用

#### Button 組件

```svelte
<Button variant="default" size="md" onclick={handleClick}>
  <i data-lucide="plus" class="mr-2 h-4 w-4"></i>
  新增
</Button>
```

#### Input 組件

```svelte
<Input
  id="username"
  type="text"
  placeholder="請輸入用戶名"
  bind:value={formData.username}
  error={errors.username?.[0]}
  required
>
  <span slot="label">用戶名</span>
</Input>
```

### 組件開發規範

1. **命名規範**: 使用 PascalCase
2. **Props 定義**: 明確定義 props 類型
3. **事件處理**: 使用 `createEventDispatcher`
4. **樣式**: 使用 Tailwind CSS 類別
5. **可訪問性**: 添加適當的 ARIA 屬性

## 🔌 API 整合

### API 服務使用

```typescript
import { apiService } from "$lib/api";

// 登入
const response = await apiService.login({ username, password });

// 保固登記
const response = await apiService.registerWarranty(warrantyData);

// 搜尋保固
const response = await apiService.searchWarranty(query);
```

### 錯誤處理

```typescript
import { authService } from "$lib/auth";

try {
  const response = await apiService.someMethod();
  // 處理成功回應
} catch (error) {
  authService.handleApiError(error);
}
```

## 🧪 測試指南

### 組件測試

```typescript
// 待實作：使用 @testing-library/svelte
import { render, fireEvent } from "@testing-library/svelte";
import Button from "$components/ui/Button.svelte";

test("button click event", async () => {
  const { getByRole } = render(Button, { props: { variant: "default" } });
  const button = getByRole("button");

  await fireEvent.click(button);
  // 驗證事件處理
});
```

### Store 測試

```typescript
// 待實作：測試 Svelte stores
import { get } from "svelte/store";
import { authStore } from "$stores/auth";

test("auth store login", () => {
  authStore.login("token", "user", "admin", "2024-12-31");
  const auth = get(authStore);

  expect(auth.token).toBe("token");
  expect(auth.username).toBe("user");
});
```

## 🚀 部署指南

### 構建生產版本

```bash
npm run build:svelte
```

### 部署到靜態主機

構建後的文件在 `dist/` 目錄中，可以部署到任何靜態主機：

- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

### 環境變數設置

生產環境需要設置：

- `VITE_API_BASE_URL`: API 服務地址
- `VITE_DEBUG`: 是否啟用調試模式

## 📝 代碼規範

### TypeScript 規範

- 使用嚴格模式
- 明確定義介面和類型
- 避免使用 `any` 類型

### Svelte 規範

- 組件名稱使用 PascalCase
- Props 使用 camelCase
- 事件名稱使用 kebab-case

### CSS 規範

- 優先使用 Tailwind CSS 類別
- 自定義樣式放在組件內的 `<style>` 標籤
- 使用 CSS 變數定義主題色彩

## 🔍 調試技巧

### Svelte DevTools

安裝 Svelte DevTools 瀏覽器擴展來調試組件狀態。

### 控制台調試

```typescript
// 在組件中添加調試日誌
$: console.log("Component state:", { prop1, prop2 });

// 在 stores 中添加調試
authStore.subscribe(($auth) => {
  console.log("Auth state changed:", $auth);
});
```

### 錯誤邊界

使用 `AuthGuard` 組件處理認證錯誤：

```svelte
<AuthGuard requireAuth={true}>
  <ProtectedComponent />
</AuthGuard>
```

## 📚 學習資源

- [Svelte 官方文檔](https://svelte.dev/docs)
- [Svelte Tutorial](https://svelte.dev/tutorial)
- [Tailwind CSS 文檔](https://tailwindcss.com/docs)
- [TypeScript 手冊](https://www.typescriptlang.org/docs/)

## 🤝 貢獻指南

1. Fork 專案
2. 創建功能分支
3. 提交變更
4. 創建 Pull Request
5. 等待代碼審查

### 提交訊息規範

```
feat: 新增功能
fix: 修復錯誤
docs: 更新文檔
style: 代碼格式調整
refactor: 代碼重構
test: 新增測試
chore: 其他變更
```
