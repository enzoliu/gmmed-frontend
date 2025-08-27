<script lang="ts">
  import { onMount, tick } from "svelte";
  import { apiService, type ProductMetadataStruct } from "$lib/api";
  import Label from "$components/ui/Label.svelte";
  import type {
    ProductFilters,
    ProductFiltersOnchangeData,
    TypeCategorySubcategory,
  } from "$lib/types";

  export let productFilters: ProductFilters = {
    category: "",
    subcategory: "",
    size: "",
  };
  export let onFiltersChange: (filters: ProductFiltersOnchangeData) => void;

  let types: TypeCategorySubcategory[] = [];
  let sizes: string[] = [];
  let categories: string[] = [];
  let subcategories: string[] = [];
  let allMetadata: ProductMetadataStruct[] = [];

  const categoryProcessor = (type: string): TypeCategorySubcategory => {
    const strs = type.split("-");
    const categoryArr = strs.slice(0, strs.length - 1);
    const category = categoryArr.join("-");
    const subcategory = strs[strs.length - 1];
    return { category, subcategory };
  };

  const responseToTypes = (data: ProductMetadataStruct[]) => {
    return Array.from(
      new Set(
        data.filter((item) => item.brand === "Mentor").map((item) => item.type)
      )
    ).map((item) => categoryProcessor(item));
  };

  const responseToSizes = (data: ProductMetadataStruct[]) => {
    return Array.from(
      new Set(
        data
          .filter(
            (item) =>
              item.brand === "Mentor" &&
              item.type ===
                productFilters.category + "-" + productFilters.subcategory
          )
          .map((item) => item.size)
      )
    ).sort();
  };

  const typesToCategories = (types: TypeCategorySubcategory[]) => {
    return Array.from(new Set(types.map((item) => item.category))).sort();
  };
  const typesToSubcategories = (types: TypeCategorySubcategory[]) => {
    return Array.from(new Set(types.map((item) => item.subcategory))).sort();
  };

  function handleCategoryChange() {
    const selectedTypes = types.filter(
      (item) => item.category === productFilters.category
    );
    // update subcategories
    productFilters.subcategory = "";
    productFilters.size = "";
    subcategories = typesToSubcategories(selectedTypes);

    const rtnData: ProductFiltersOnchangeData = {
      type: productFilters.category + "-" + productFilters.subcategory,
      size: productFilters.size,
      product_id: "",
    };
    onFiltersChange?.(rtnData);
  }

  function handleSubcategoryChange() {
    // update sizes
    sizes = responseToSizes(allMetadata);
    productFilters.size = "";
    const rtnData: ProductFiltersOnchangeData = {
      type: productFilters.category + "-" + productFilters.subcategory,
      size: productFilters.size,
      product_id: "",
    };
    onFiltersChange?.(rtnData);
  }

  async function handleSizeChange() {
    const product_id = await getProductID();
    const rtnData: ProductFiltersOnchangeData = {
      type: productFilters.category + "-" + productFilters.subcategory,
      size: productFilters.size,
      product_id: product_id || "",
    };
    onFiltersChange?.(rtnData);
  }

  async function fetchMetadataAll() {
    try {
      const response = await apiService.getProductMetadataAll();
      if (response.data && response.data.data) {
        allMetadata = response.data.data;
        const rts = responseToTypes(response.data.data);
        types = rts;
        categories = typesToCategories(rts);
        subcategories = typesToSubcategories(rts);
        if (productFilters.category !== "") {
          sizes = responseToSizes(response.data.data);
        }
      }
    } catch (e: any) {
      console.error("Failed to fetch metadata:", e);
    } finally {
      await tick();
    }
  }

  async function getProductID() {
    // call api to get product id
    const urlParams = new URLSearchParams();
    urlParams.set("brand", "Mentor");
    urlParams.set(
      "type",
      productFilters.category + "-" + productFilters.subcategory
    );
    urlParams.set("size", productFilters.size);
    const response = await apiService.getProducts(urlParams);
    if (response.data && response.data.products) {
      return response.data.products[0].id;
    }
    return null;
  }

  onMount(async () => {
    await fetchMetadataAll();
  });
</script>

<div class="hidden md:block p-4 border rounded-lg mb-6 bg-muted/30">
  <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
    <div>
      <Label for="type_filter">類型</Label>
      <select
        id="type_filter"
        bind:value={productFilters.category}
        class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        on:change={handleCategoryChange}
      >
        {#if productFilters.category.length === 0 || categories.length === 0}
          <option value="" selected>請選擇</option>
        {/if}
        {#each categories as category}
          <option
            value={category}
            selected={productFilters.category === category}
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
        bind:value={productFilters.subcategory}
        class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        on:change={handleSubcategoryChange}
      >
        {#if productFilters.subcategory.length === 0 || subcategories.length === 0}
          <option value="" selected>請選擇</option>
        {/if}
        {#each subcategories as subcategory}
          <option
            value={subcategory}
            selected={productFilters.subcategory === subcategory}
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
        bind:value={productFilters.size}
        class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        on:change={handleSizeChange}
      >
        {#if productFilters.size.length === 0 || sizes.length === 0}
          <option value="" selected>請選擇</option>
        {/if}
        {#each sizes as size}
          <option value={size} selected={productFilters.size === size}>
            {size}
          </option>
        {/each}
      </select>
    </div>
  </div>
</div>
