<!-- src/components/ProductFilter.svelte -->
<script lang="ts">
  import { onMount, tick } from "svelte";
  import { apiService } from "$lib/api";
  import Button from "$components/ui/Button.svelte";
  import Input from "$components/ui/Input.svelte";
  import Label from "$components/ui/Label.svelte";
  import type { ProductFilters } from "$lib/types";

  // Props
  export let filters: ProductFilters = {
    brand: "",
    type: "",
    model_number: "",
    size: "",
    active: "",
  };

  // 外部傳入的預設品牌，如果有指定則隱藏品牌選擇器
  export let presetBrand: string = "";

  // 外部傳入是否取得所有產品元資料，預設為 false
  export let getAllMetadata: boolean = false;

  // 事件回調函數
  export let onFiltersChange: ((filters: ProductFilters) => void) | undefined =
    undefined;

  // 計算實際使用的品牌值
  $: effectiveBrand = presetBrand || filters.brand;

  // 內部狀態
  let brands: string[] = [];
  let types: string[] = [];
  let model_numbers: string[] = [];
  let sizes: string[] = [];

  // 常數定義
  const ENUM_BRAND = "brand";
  const ENUM_TYPE = "type";
  const ENUM_MODEL_NUMBER = "model_number";
  const ENUM_SIZE = "size";
  const ENUM_STATUS = "status";

  async function fetchMetadata(target: string) {
    const params = new URLSearchParams();
    switch (target) {
      case ENUM_BRAND:
        // 如果有預設品牌，就不需要載入brands，直接載入types
        if (presetBrand) {
          return fetchMetadata(ENUM_TYPE);
        }
        types = [];
        model_numbers = [];
        sizes = [];
        filters.brand = "";
        filters.type = "";
        filters.model_number = "";
        filters.size = "";
        params.set("metadata_type", "brands");
        break;
      case ENUM_TYPE:
        types = [];
        model_numbers = [];
        sizes = [];
        filters.type = "";
        filters.model_number = "";
        filters.size = "";
        params.set("metadata_type", "types");
        params.set("brand", effectiveBrand);
        break;
      case ENUM_MODEL_NUMBER:
        model_numbers = [];
        sizes = [];
        filters.model_number = "";
        filters.size = "";
        params.set("metadata_type", "model_numbers");
        params.set("brand", effectiveBrand);
        params.set("type", filters.type);
        break;
      case ENUM_SIZE:
        sizes = [];
        filters.size = "";
        params.set("metadata_type", "sizes");
        params.set("brand", effectiveBrand);
        params.set("type", filters.type);
        params.set("model_number", filters.model_number);
        break;
      case ENUM_STATUS:
        return;
    }
    try {
      const response = await apiService.getProductMetadata(params);
      if (response.data && response.data.data) {
        switch (params.get("metadata_type")) {
          case "brands":
            brands = response.data.data;
            break;
          case "types":
            types = response.data.data;
            break;
          case "model_numbers":
            model_numbers = response.data.data;
            break;
          case "sizes":
            sizes = response.data.data;
            if (sizes.length === 1) {
              filters.size = sizes[0];
              onFiltersChange?.(filters);
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
        if (filters.brand !== "") {
          types = Array.from(
            new Set(
              response.data.data
                .filter((item) => item.brand === filters.brand)
                .map((item) => item.type)
            )
          ).sort();
        }
        if (filters.type !== "") {
          model_numbers = Array.from(
            new Set(
              response.data.data
                .filter(
                  (item) =>
                    item.brand === filters.brand && item.type === filters.type
                )
                .map((item) => item.model_number)
            )
          ).sort();
        }
        if (filters.model_number !== "") {
          sizes = Array.from(
            new Set(
              response.data.data
                .filter(
                  (item) =>
                    item.brand === filters.brand &&
                    item.type === filters.type &&
                    item.model_number === filters.model_number
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
      if (nextLevel === ENUM_STATUS) {
        onFiltersChange?.(filters);
        return;
      }
      fetchMetadata(nextLevel);
      onFiltersChange?.(filters);
    };
  }

  function clearFilters() {
    filters = {
      brand: presetBrand || "",
      type: "",
      model_number: "",
      size: "",
      active: "",
    };
    types = [];
    model_numbers = [];
    sizes = [];
    handleFilterChange(presetBrand ? ENUM_TYPE : ENUM_BRAND)();
  }

  // 公開方法，供外部調用
  export function initializeFilters() {
    return fetchMetadata(ENUM_BRAND);
  }

  onMount(async () => {
    // 如果getAllMetadata為true，則不載入品牌選擇器，直接載入所有產品元資料
    if (getAllMetadata) {
      await fetchMetadataAll();
      return;
    }
    // 如果有預設品牌，設定到filters並載入types
    if (presetBrand) {
      filters.brand = presetBrand;
      await fetchMetadata(ENUM_TYPE);
    } else {
      await fetchMetadata(ENUM_BRAND);
    }
  });
</script>

<!-- 手機版搜尋區域 -->
<div class="md:hidden mb-6">
  <div class="p-4 border rounded-lg bg-muted/30">
    <div class="space-y-4">
      {#if presetBrand}
        <!-- 顯示預設品牌 -->
        <div>
          <Label>品牌</Label>
          <div
            class="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm items-center"
          >
            {presetBrand}
          </div>
        </div>
      {:else}
        <!-- 品牌選擇器（下拉） -->
        <div>
          <Label for="mobile_brand_filter">品牌</Label>
          <select
            id="mobile_brand_filter"
            bind:value={filters.brand}
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            on:change={handleFilterChange(ENUM_TYPE)}
          >
            <option value="" disabled selected>請選擇</option>
            {#each brands as brand}
              <option value={brand} selected={filters.brand === brand}>
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
          bind:value={filters.type}
          class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          on:change={handleFilterChange(ENUM_MODEL_NUMBER)}
        >
          {#if filters.type.length === 0 || types.length === 0}
            <option value="" selected>請選擇</option>
          {/if}
          {#each types as type}
            <option value={type} selected={filters.type === type}>{type}</option
            >
          {/each}
        </select>
      </div>

      <!-- 型號選擇器 -->
      <div>
        <Label for="mobile_model_number_filter">型號</Label>
        <select
          id="mobile_model_number_filter"
          bind:value={filters.model_number}
          class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          on:change={handleFilterChange(ENUM_SIZE)}
        >
          {#if filters.model_number.length === 0 || model_numbers.length === 0}
            <option value="" selected>請選擇</option>
          {/if}
          {#each model_numbers as model_number}
            <option
              value={model_number}
              selected={filters.model_number === model_number}
            >
              {model_number}
            </option>
          {/each}
        </select>
      </div>

      <!-- 尺寸選擇器 -->
      <div>
        <Label for="mobile_size_filter">尺寸</Label>
        <select
          id="mobile_size_filter"
          bind:value={filters.size}
          class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          on:change={handleFilterChange(ENUM_STATUS)}
        >
          {#if filters.size.length === 0 || sizes.length === 0}
            <option value="" selected>請選擇</option>
          {/if}
          {#each sizes as size}
            <option value={size} selected={filters.size === size}>{size}</option
            >
          {/each}
        </select>
      </div>

      {#if !presetBrand}
        <div class="grid grid-cols-2 gap-2">
          <div>
            <Label for="mobile_status_filter">產品狀態</Label>
            <select
              id="mobile_status_filter"
              bind:value={filters.active}
              on:change={handleFilterChange(ENUM_STATUS)}
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">全部</option>
              <option value="true">啟用</option>
              <option value="false">停用</option>
            </select>
          </div>
          <div class="flex items-end">
            <Button variant="ghost" onclick={clearFilters} class="w-full">
              清除
            </Button>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<!-- 桌面版篩選區域 -->
<div class="hidden md:block p-4 border rounded-lg mb-6 bg-muted/30">
  <div
    class="grid grid-cols-1 gap-4 {presetBrand
      ? 'md:grid-cols-4'
      : 'md:grid-cols-6'}"
  >
    {#if presetBrand}
      <!-- 顯示預設品牌 -->
      <div>
        <Label>品牌</Label>
        <div
          class="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm items-center"
        >
          {presetBrand}
        </div>
      </div>
    {:else}
      <!-- 品牌選擇器 -->
      <div>
        <Label for="brand_filter">品牌</Label>
        <select
          id="brand_filter"
          bind:value={filters.brand}
          class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          on:change={handleFilterChange(ENUM_TYPE)}
        >
          <option value="" disabled selected>請選擇</option>
          {#each brands as brand}
            <option value={brand} selected={filters.brand === brand}>
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
        bind:value={filters.type}
        class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        on:change={handleFilterChange(ENUM_MODEL_NUMBER)}
      >
        {#if filters.type.length === 0 || types.length === 0}
          <option value="" selected>請選擇</option>
        {/if}
        {#each types as type}
          <option value={type} selected={filters.type === type}>
            {type}
          </option>
        {/each}
      </select>
    </div>
    <div>
      <Label for="model_number_filter">型號</Label>
      <select
        id="model_number_filter"
        bind:value={filters.model_number}
        class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        on:change={handleFilterChange(ENUM_SIZE)}
      >
        {#if filters.model_number.length === 0 || model_numbers.length === 0}
          <option value="" selected>請選擇</option>
        {/if}
        {#each model_numbers as model_number}
          <option
            value={model_number}
            selected={filters.model_number === model_number}
          >
            {model_number}
          </option>
        {/each}
      </select>
    </div>
    <div>
      <Label for="size_filter">尺寸</Label>
      <select
        id="size_filter"
        bind:value={filters.size}
        class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        on:change={handleFilterChange(ENUM_STATUS)}
      >
        {#if filters.size.length === 0 || sizes.length === 0}
          <option value="" selected>請選擇</option>
        {/if}
        {#each sizes as size}
          <option value={size} selected={filters.size === size}>
            {size}
          </option>
        {/each}
      </select>
    </div>
    {#if !presetBrand}
      <div>
        <Label for="status_filter">產品狀態</Label>
        <select
          id="status_filter"
          bind:value={filters.active}
          on:change={handleFilterChange(ENUM_STATUS)}
          class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">全部</option>
          <option value="true">啟用</option>
          <option value="false">停用</option>
        </select>
      </div>
      <div class="flex items-end">
        <Button variant="ghost" onclick={clearFilters}>清除篩選</Button>
      </div>
    {/if}
  </div>
</div>
