# 預設品牌使用示例

## 場景描述

當您的頁面已經知道特定品牌（例如從 URL 參數或路由中獲取）時，您可以使用 `presetBrand` 屬性來簡化篩選器。

## 使用方式

### 1. 從 URL 參數獲取品牌

```svelte
<!-- src/routes/admin/products/[brand]/+page.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  import ProductFilter from "$components/ProductFilter.svelte";
  import type { ProductFilters } from "$lib/types";

  // 從URL參數獲取品牌
  $: brand = $page.params.brand || "";

  let filters: ProductFilters = {
    brand: "",
    type: "",
    model_number: "",
    size: "",
    active: "",
  };

  function handleFiltersChange(newFilters: ProductFilters) {
    filters = newFilters;
    // 這裡 filters.brand 會自動設定為 URL 中的品牌
  }
</script>

<svelte:head>
  <title>{brand} 產品管理</title>
</svelte:head>

<div>
  <h1>{brand} 產品列表</h1>

    <!-- 使用預設品牌 -->
  <ProductFilter
    bind:filters
    presetBrand={brand}
    onFiltersChange={handleFiltersChange}
  />

  <!-- 產品列表 -->
  <!-- ... -->
</div>
```

### 2. 在現有頁面中使用

```svelte
<!-- src/routes/admin/products/+page.svelte -->
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

  let selectedBrand = ""; // 可以是用戶選擇的品牌

  function handleFiltersChange(newFilters: ProductFilters) {
    filters = newFilters;
    fetchProducts();
  }

  // 當用戶選擇特定品牌時，切換到預設品牌模式
  function focusOnBrand(brand: string) {
    selectedBrand = brand;
    filters = {
      brand: "",
      type: "",
      model_number: "",
      size: "",
      active: "",
    };
  }
</script>

<div>
  <h1>產品管理</h1>

  <!-- 品牌快速選擇 -->
  <div class="mb-4">
    <button onclick={() => focusOnBrand("")} class="btn">全部品牌</button>
    <button onclick={() => focusOnBrand("Apple")} class="btn">Apple</button>
    <button onclick={() => focusOnBrand("Samsung")} class="btn">Samsung</button>
  </div>

    <!-- 根據是否有選擇品牌來決定篩選器模式 -->
  {#if selectedBrand}
    <ProductFilter
      bind:filters
      presetBrand={selectedBrand}
      onFiltersChange={handleFiltersChange}
    />
  {:else}
    <ProductFilter
      bind:filters
      onFiltersChange={handleFiltersChange}
    />
  {/if}
</div>
```

## 佈局差異

### 沒有預設品牌（6 欄）

```
| 品牌 | 類型 | 型號 | 尺寸 | 狀態 | 操作 |
```

### 有預設品牌（5 欄）

```
| 品牌(固定) | 類型 | 型號 | 尺寸 | 狀態 | 操作 |
```

## 優勢

1. **簡化 UI**: 當品牌已知時，不需要顯示品牌選擇器
2. **更好的 UX**: 用戶專注於其他篩選條件
3. **響應式**: 自動調整佈局以適應不同數量的篩選器
4. **靈活性**: 可以動態切換預設品牌模式
