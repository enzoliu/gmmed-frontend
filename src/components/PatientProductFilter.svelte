<!-- src/components/ProductFilter.svelte -->
<script lang="ts">
  import { onMount, tick } from "svelte";
  import { apiService } from "$lib/api";
  import Label from "$components/ui/Label.svelte";
  import type { PatientProductFilters } from "$lib/types";

  // Props
  export let patientFilters: PatientProductFilters = {
    brand: "",
    category: "",
    subcategory: "",
    size: "",
  };

  // 外部傳入的預設品牌，如果有指定則隱藏品牌選擇器
  export let presetBrand: string = "";

  // 外部傳入是否取得所有產品元資料，預設為 false
  export let getAllMetadata: boolean = false;

  // 事件回調函數
  export let onFiltersChange:
    | ((filters: PatientProductFilters) => void)
    | undefined = undefined;

  // 計算實際使用的品牌值
  $: effectiveBrand = presetBrand || patientFilters.brand;

  // 內部狀態
  let brands: string[] = [];
  let sizes: string[] = [];
  let types: string[] = [];
  let categories: string[] = [];
  let subcategories: string[] = [];

  // 常數定義
  const ENUM_BRAND = "brand";
  const ENUM_CATEGORY = "category";
  const ENUM_SUBCATEGORY = "subcategory";
  const ENUM_SIZE = "size";
  const ENUM_STATUS = "status";

  const categoryProcessor = (type: string) => {
    const strs = type.split("-");
    const categoryArr = strs.slice(0, strs.length - 1);
    const category = categoryArr.join("-");
    const subcategory = strs[strs.length - 1];
    return { category, subcategory };
  };

  async function fetchMetadata(target: string) {
    const params = new URLSearchParams();
    let triggerFetch = true;
    const type = patientFilters.category + "-" + patientFilters.subcategory;
    switch (target) {
      case ENUM_BRAND:
        // 如果有預設品牌，就不需要載入brands，直接載入types
        if (presetBrand) {
          return fetchMetadata(ENUM_CATEGORY);
        }
        sizes = [];
        patientFilters.brand = "";
        patientFilters.category = "";
        patientFilters.subcategory = "";
        patientFilters.size = "";
        params.set("metadata_type", "brands");
        break;
      case ENUM_CATEGORY:
        sizes = [];
        types = [];
        patientFilters.category = "";
        patientFilters.subcategory = "";
        patientFilters.size = "";
        params.set("metadata_type", "types");
        break;
      case ENUM_SUBCATEGORY:
        subcategories = Array.from(
          new Set(
            types
              .map((item) => categoryProcessor(item))
              .filter((item) => item.category === patientFilters.category)
              .map((item) => item.subcategory)
          )
        ).sort();
        triggerFetch = false;
        break;
      case ENUM_SIZE:
        params.set("metadata_type", "sizes");
        params.set("brand", effectiveBrand);
        params.set("type", type);
        params.set("size", patientFilters.size);
        sizes = [];
        patientFilters.size = "";
        break;
      case ENUM_STATUS:
        return;
    }
    if (!triggerFetch) return;
    try {
      const response = await apiService.getProductMetadata(params);
      if (response.data && response.data.data) {
        switch (params.get("metadata_type")) {
          case "brands":
            brands = response.data.data;
            break;
          case "types":
            types = response.data.data;
            const categoryMap = types.map((item) => categoryProcessor(item));
            categories = Array.from(
              new Set(categoryMap.map((item) => item.category))
            ).sort();
            break;
          case "sizes":
            sizes = response.data.data.sort();
            if (sizes.length === 1) {
              patientFilters.size = sizes[0];
              onFiltersChange?.(patientFilters);
            }
            break;
        }
      }
    } catch (e: any) {
      console.error("Failed to fetch metadata:", e);
    } finally {
      await tick();
    }
  }

  async function fetchMetadataAll() {
    try {
      const response = await apiService.getProductMetadataAll();
      if (response.data && response.data.data) {
        brands = Array.from(
          new Set(response.data.data.map((item) => item.brand))
        ).sort();
        if (patientFilters.brand !== "") {
          const types = Array.from(
            new Set(
              response.data.data
                .filter((item) => item.brand === patientFilters.brand)
                .map((item) => item.type)
            )
          ).map((item) => categoryProcessor(item));
          categories = Array.from(
            new Set(types.map((item) => item.category))
          ).sort();
          subcategories = Array.from(
            new Set(types.map((item) => item.subcategory))
          ).sort();
        }
        if (patientFilters.category !== "") {
          sizes = Array.from(
            new Set(
              response.data.data
                .filter(
                  (item) =>
                    item.brand === patientFilters.brand &&
                    item.type ===
                      patientFilters.category + "-" + patientFilters.subcategory
                )
                .map((item) => item.size)
            )
          ).sort();
        }
      }
    } catch (e: any) {
      console.error("Failed to fetch metadata:", e);
    } finally {
      await tick();
    }
  }

  function handleFilterChange(nextLevel: string) {
    return () => {
      // 避免無限循環：只在真正需要時才調用 API
      if (nextLevel === ENUM_CATEGORY && patientFilters.brand) {
        fetchMetadata(nextLevel);
      } else if (nextLevel === ENUM_SUBCATEGORY && patientFilters.category) {
        fetchMetadata(nextLevel);
      } else if (nextLevel === ENUM_SIZE && patientFilters.subcategory) {
        fetchMetadata(nextLevel);
      }

      // 通知父組件
      if (onFiltersChange) {
        onFiltersChange({ ...patientFilters });
      }
    };
  }

  // 公開方法，供外部調用
  export function initializeFilters() {
    return fetchMetadata(ENUM_BRAND);
  }

  onMount(async () => {
    try {
      // 如果getAllMetadata為true，則不載入品牌選擇器，直接載入所有產品元資料
      if (getAllMetadata) {
        await fetchMetadataAll();
        return;
      }

      // 如果有預設品牌，設定到filters並載入types
      if (presetBrand) {
        patientFilters.brand = presetBrand;
        // 延遲載入，避免在 onMount 中立即觸發複雜操作
        setTimeout(() => {
          fetchMetadata(ENUM_CATEGORY);
        }, 100);
      } else {
        // 延遲載入，避免在 onMount 中立即觸發複雜操作
        setTimeout(() => {
          fetchMetadata(ENUM_BRAND);
        }, 100);
      }
    } catch (error) {
      console.error("初始化失敗:", error);
    }
  });
</script>

<!-- 手機版搜尋區域 -->
<div class="md:hidden mb-6">
  <div class="p-4 border rounded-lg bg-muted/30">
    <div class="space-y-4">
      {#if !presetBrand}
        <!-- 品牌選擇器（下拉） -->
        <div>
          <Label for="mobile_brand_filter">品牌</Label>
          <select
            id="mobile_brand_filter"
            bind:value={patientFilters.brand}
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            on:change={handleFilterChange(ENUM_CATEGORY)}
          >
            <option value="" disabled selected>請選擇</option>
            {#each brands as brand}
              <option value={brand} selected={patientFilters.brand === brand}>
                {brand}
              </option>
            {/each}
          </select>
        </div>
      {/if}

      <!-- 類型選擇器 -->
      <div>
        <Label for="mobile_type_filter">類型</Label>
        <select
          id="mobile_type_filter"
          bind:value={patientFilters.category}
          class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          on:change={handleFilterChange(ENUM_SUBCATEGORY)}
        >
          {#if patientFilters.category.length === 0 || categories.length === 0}
            <option value="" selected>請選擇</option>
          {/if}
          {#each categories as category}
            <option
              value={category}
              selected={patientFilters.category === category}
            >
              {category}
            </option>
          {/each}
        </select>
      </div>

      <!-- 子類選擇器 -->
      <div>
        <Label for="mobile_subcategory_filter">子類型</Label>
        <select
          id="mobile_subcategory_filter"
          bind:value={patientFilters.subcategory}
          class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          on:change={handleFilterChange(ENUM_SIZE)}
        >
          {#if patientFilters.subcategory.length === 0 || subcategories.length === 0}
            <option value="" selected>請選擇</option>
          {/if}
          {#each subcategories as subcategory}
            <option
              value={subcategory}
              selected={patientFilters.subcategory === subcategory}
            >
              {subcategory}
            </option>
          {/each}
        </select>
      </div>

      <!-- 尺寸選擇器 -->
      <div>
        <Label for="mobile_size_filter">尺寸</Label>
        <select
          id="mobile_size_filter"
          bind:value={patientFilters.size}
          class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          on:change={handleFilterChange(ENUM_STATUS)}
        >
          {#if patientFilters.size.length === 0 || sizes.length === 0}
            <option value="" selected>請選擇</option>
          {/if}
          {#each sizes as size}
            <option value={size} selected={patientFilters.size === size}>
              {size}
            </option>
          {/each}
        </select>
      </div>
    </div>
  </div>
</div>

<!-- 桌面版篩選區域 -->
<div class="hidden md:block p-4 border rounded-lg mb-6 bg-muted/30">
  <div
    class="grid grid-cols-1 gap-4 {presetBrand
      ? 'md:grid-cols-3'
      : 'md:grid-cols-6'}"
  >
    {#if !presetBrand}
      <!-- 品牌選擇器 -->
      <div>
        <Label for="brand_filter">品牌</Label>
        <select
          id="brand_filter"
          bind:value={patientFilters.brand}
          class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          on:change={handleFilterChange(ENUM_CATEGORY)}
        >
          <option value="" disabled selected>請選擇</option>
          {#each brands as brand}
            <option value={brand} selected={patientFilters.brand === brand}>
              {brand}
            </option>
          {/each}
        </select>
      </div>
    {/if}
    <div>
      <Label for="type_filter">類型</Label>
      <select
        id="type_filter"
        bind:value={patientFilters.category}
        class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        on:change={handleFilterChange(ENUM_SUBCATEGORY)}
      >
        {#if patientFilters.category.length === 0 || categories.length === 0}
          <option value="" selected>請選擇</option>
        {/if}
        {#each categories as category}
          <option
            value={category}
            selected={patientFilters.category === category}
          >
            {category}
          </option>
        {/each}
      </select>
    </div>
    <div>
      <Label for="subcategory_filter">子類型</Label>
      <select
        id="subcategory_filter"
        bind:value={patientFilters.subcategory}
        class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        on:change={handleFilterChange(ENUM_SIZE)}
      >
        {#if patientFilters.subcategory.length === 0 || subcategories.length === 0}
          <option value="" selected>請選擇</option>
        {/if}
        {#each subcategories as subcategory}
          <option
            value={subcategory}
            selected={patientFilters.subcategory === subcategory}
          >
            {subcategory}
          </option>
        {/each}
      </select>
    </div>
    <div>
      <Label for="size_filter">尺寸</Label>
      <select
        id="size_filter"
        bind:value={patientFilters.size}
        class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        on:change={handleFilterChange(ENUM_STATUS)}
      >
        {#if patientFilters.size.length === 0 || sizes.length === 0}
          <option value="" selected>請選擇</option>
        {/if}
        {#each sizes as size}
          <option value={size} selected={patientFilters.size === size}>
            {size}
          </option>
        {/each}
      </select>
    </div>
  </div>
</div>
