# ProductFilter 組件使用說明

## 概述

`ProductFilter` 是一個可重複使用的產品篩選組件，提供品牌、類型、型號、尺寸和狀態的階層式篩選功能。

## 特性

- 📱 響應式設計（手機版/桌面版）
- 🔄 階層式篩選（品牌 → 類型 → 型號 → 尺寸）
- 🎯 自動載入相關選項
- 🧹 一鍵清除篩選
- 🔧 TypeScript 支持
- 🎨 支援預設品牌，動態調整篩選器數量

## 使用方法

### 1. 導入組件和類型

```typescript
import ProductFilter from "$components/ProductFilter.svelte";
import type { ProductFilters } from "$lib/types";
```

### 2. 在頁面中使用

```svelte
<script lang="ts">
  import ProductFilter from "$components/ProductFilter.svelte";
  import type { ProductFilters } from "$lib/types";

  let filters: ProductFilters = {
    brand: "",
    type: "",
    model_number: "",
    size: "",
    active: "",
  };

  function handleFiltersChange(newFilters: ProductFilters) {
    filters = newFilters;
    // 在這裡處理篩選變化，例如重新載入資料
    console.log("篩選條件已更新:", filters);
  }
</script>

<ProductFilter
  bind:filters
  onFiltersChange={handleFiltersChange}
/>
```

### 3. 使用預設品牌

當您已知特定品牌時，可以傳入 `presetBrand` 參數，這樣組件會自動隱藏品牌選擇器，只顯示類型、型號、尺寸和狀態篩選：

```svelte
<script lang="ts">
  import ProductFilter from "$components/ProductFilter.svelte";
  import type { ProductFilters } from "$lib/types";

  let filters: ProductFilters = {
    brand: "", // 會被presetBrand設定
    type: "",
    model_number: "",
    size: "",
    active: "",
  };

    function handleFiltersChange(newFilters: ProductFilters) {
    filters = newFilters;
    console.log("篩選條件已更新:", filters);
    // filters.brand 會自動設定為 "Apple"
  }
</script>

<ProductFilter
  bind:filters
  presetBrand="Apple"
  onFiltersChange={handleFiltersChange}
/>
```

### 4. 完整實例

```svelte
<!-- src/routes/admin/inventory/+page.svelte -->
<script lang="ts">
  import { onMount } from "svelte";
  import ProductFilter from "$components/ProductFilter.svelte";
  import type { ProductFilters } from "$lib/types";

  let filters: ProductFilters = {
    brand: "",
    type: "",
    model_number: "",
    size: "",
    active: "",
  };

  let inventoryData = [];
  let isLoading = false;

  async function fetchInventory() {
    isLoading = true;
    try {
      const params = new URLSearchParams();
      if (filters.brand) params.set("brand", filters.brand);
      if (filters.type) params.set("type", filters.type);
      if (filters.model_number) params.set("model_number", filters.model_number);
      if (filters.size) params.set("size", filters.size);
      if (filters.active) params.set("active", filters.active);

      // 呼叫API載入庫存資料
      const response = await apiService.getInventory(params);
      inventoryData = response.data;
    } catch (error) {
      console.error("載入庫存資料失敗:", error);
    } finally {
      isLoading = false;
    }
  }

  function handleFiltersChange(newFilters: ProductFilters) {
    filters = newFilters;
    fetchInventory();
  }

  onMount(() => {
    fetchInventory();
  });
</script>

<svelte:head>
  <title>庫存管理</title>
</svelte:head>

<div>
  <h1>庫存管理</h1>

  <!-- 使用篩選組件 -->
  <ProductFilter
    bind:filters
    onFiltersChange={handleFiltersChange}
  />

  <!-- 資料展示區域 -->
  {#if isLoading}
    <div class="loading">載入中...</div>
  {:else}
    <div class="inventory-grid">
      {#each inventoryData as item}
        <div class="inventory-card">
          <h3>{item.brand} {item.model_number}</h3>
          <p>庫存: {item.quantity}</p>
        </div>
      {/each}
    </div>
  {/if}
</div>
```

## API

### Props

- `filters: ProductFilters` - 篩選條件物件（雙向綁定）
- `presetBrand?: string` - 預設品牌，如果提供則隱藏品牌選擇器
- `onFiltersChange?: (filters: ProductFilters) => void` - 篩選條件變化時的回調函數

### Methods

- `initializeFilters(): Promise<void>` - 初始化篩選選項（通常不需要手動調用）

## 類型定義

```typescript
interface ProductFilters {
  brand: string; // 品牌
  type: string; // 類型
  model_number: string; // 型號
  size: string; // 尺寸
  active: string; // 狀態 ("true", "false", "")
}
```

## 注意事項

1. 組件會自動載入品牌選項（除非提供了 `presetBrand`）
2. 類型、型號、尺寸選項會根據上層選擇動態載入
3. 清除篩選會重設所有條件並重新載入相應選項
4. 組件使用 `apiService.getProductMetadata()` 方法載入選項資料
5. 當提供 `presetBrand` 時，品牌選擇器會被隱藏，布局自動調整為 5 欄（桌面版）
6. 預設品牌會自動設定到 `filters.brand` 中

## 自定義樣式

組件使用 Tailwind CSS 類別，您可以透過全域 CSS 或 `:global()` 修飾符來自定義樣式。
