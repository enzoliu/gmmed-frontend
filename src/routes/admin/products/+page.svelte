<!-- src/routes/admin/products/+page.svelte -->
<script lang="ts">
  import { onMount } from "svelte";
  import { apiService } from "$lib/api";
  import type {
    Product,
    CreateProductRequest,
    UpdateProductRequest,
  } from "$lib/api";
  import type { ProductFilters, ProductFiltersOnchangeData } from "$lib/types";
  import { notificationStore } from "$stores/notifications";
  import Button from "$components/ui/Button.svelte";
  import Dialog from "$components/ui/Dialog.svelte";
  import ProductForm from "$components/ProductForm.svelte";
  import { Plus, FilePenLine, Trash2, Copy } from "lucide-svelte";
  import ProductFilter from "$components/ProductFilter.svelte";
  let products: Product[] = [];
  let isLoading = true;
  let isFormLoading = false;
  let isDialogOpen = false;
  let selectedProduct: Product | null = null;

  let total = 0;
  let page = 1;
  let pageSize = 10;
  let totalPages = 1;

  let filters: ProductFilters = {
    category: "",
    subcategory: "",
    size: "",
  };

  async function fetchProducts() {
    isLoading = true;
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("page_size", String(pageSize));
      params.set("brand", "Mentor");
      params.set("type", filters.category + "-" + filters.subcategory);

      const response = await apiService.getProducts(params);
      if (response.data) {
        products = response.data.products;
        total = response.data.total;
        totalPages = response.data.total_pages;
      }
    } catch (e: any) {
      notificationStore.error(`無法載入產品列表: ${e.message}`);
    } finally {
      isLoading = false;
    }
  }

  function handleFiltersChange(data: ProductFiltersOnchangeData) {
    fetchProducts();
  }

  function goToPage(newPage: number) {
    if (newPage >= 1 && newPage <= totalPages) {
      page = newPage;
      fetchProducts();
    }
  }

  function openCreateForm() {
    selectedProduct = null;
    isDialogOpen = true;
  }

  function openEditForm(product: Product) {
    selectedProduct = product;
    isDialogOpen = true;
  }

  function openCopyForm(product: Product) {
    selectedProduct = {
      ...product,
      id: "",
      model_number: `${product.model_number}`,
      description: `${product.description}`,
    };
    isDialogOpen = true;
  }

  function closeDialog() {
    isDialogOpen = false;
    selectedProduct = null;
  }

  async function handleFormSubmit(
    data: CreateProductRequest | UpdateProductRequest
  ) {
    isFormLoading = true;
    try {
      if (selectedProduct && selectedProduct.id) {
        // 編輯現有產品 - 使用 PUT
        await apiService.updateProduct(selectedProduct.id, data);
        notificationStore.success("產品更新成功");
      } else {
        // 新增產品或複製產品 - 使用 POST
        await apiService.createProduct(data as CreateProductRequest);
        notificationStore.success("產品新增成功");
      }
      closeDialog();
      await fetchProducts();
    } catch (e: any) {
      notificationStore.error(`儲存失敗: ${e.message}`);
    } finally {
      isFormLoading = false;
    }
  }

  async function handleDelete(productId: string) {
    if (!confirm("您確定要刪除這個產品嗎？此操作無法復原。")) {
      return;
    }
    try {
      await apiService.deleteProduct(productId);
      notificationStore.success("產品已刪除");
      await fetchProducts();
    } catch (e: any) {
      notificationStore.error(`刪除失敗: ${e.message}`);
    }
  }

  onMount(async () => {
    try {
      await fetchProducts();
    } catch (error) {
      console.error("Failed to load products:", error);
    }
  });
</script>

<svelte:head>
  <title>產品管理</title>
</svelte:head>

<div>
  <div class="flex justify-between items-center mb-6">
    <h2 class="text-2xl font-bold">產品列表</h2>
    <Button
      onclick={openCreateForm}
      class="text-mentor-white bg-mentor-primary hover:text-mentor-primary hover:bg-mentor-white hover:border-mentor-primary border"
    >
      <Plus class="mr-2 h-4 w-4" />
      新增產品
    </Button>
  </div>

  <!-- 產品篩選組件 -->
  <ProductFilter
    bind:productFilters={filters}
    onFiltersChange={handleFiltersChange}
  />

  {#if isLoading}
    <div class="text-center p-8">
      <p>載入中...</p>
    </div>
  {:else}
    <!-- 手機版卡片佈局 -->
    <div class="md:hidden space-y-4">
      {#each products as product (product.id)}
        <div class="border rounded-lg p-4 bg-white shadow-sm">
          <div class="flex justify-between items-start mb-3">
            <div>
              <h3 class="font-semibold text-lg">{product.brand}</h3>
              <p class="text-sm text-gray-600">{product.model_number}</p>
            </div>
            <span
              class="px-2 py-1 rounded-full text-xs {product.is_active
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'}"
            >
              {product.is_active ? "啟用" : "停用"}
            </span>
          </div>

          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">保固年限:</span>
              <span>
                {#if product.warranty_years === -1}
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                  >
                    永久保固
                  </span>
                {:else if product.warranty_years === 0}
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    無保固
                  </span>
                {:else}
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {product.warranty_years}年保固
                  </span>
                {/if}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">建立時間:</span>
              <span
                >{new Date(product.created_at).toLocaleDateString(
                  "zh-TW"
                )}</span
              >
            </div>
            {#if product.description}
              <div class="text-gray-600 text-xs mt-2 p-2 bg-gray-50 rounded">
                {product.description}
              </div>
            {/if}
          </div>

          <div class="flex gap-2 mt-4 pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onclick={() => openEditForm(product)}
              class="flex-1"
            >
              <FilePenLine class="mr-1 h-4 w-4" />
              編輯
            </Button>
            <Button
              variant="outline"
              size="sm"
              onclick={() => openCopyForm(product)}
              class="flex-1"
            >
              <Copy class="mr-1 h-4 w-4" />
              複製
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onclick={() => handleDelete(product.id)}
              class="flex-1"
            >
              <Trash2 class="mr-1 h-4 w-4" />
              刪除
            </Button>
          </div>
        </div>
      {:else}
        <div class="text-center p-8 text-muted-foreground border rounded-lg">
          無符合條件的產品記錄
        </div>
      {/each}
    </div>

    <!-- 桌面版表格佈局 -->
    <div class="hidden md:block border rounded-lg overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-muted/50">
          <tr class="[&_th]:px-4 [&_th]:py-3 [&_th]:text-left">
            <th>品牌</th>
            <th>類型</th>
            <th>型號</th>
            <th>尺寸</th>
            <th>保固年限</th>
            <th>狀態</th>
            <th>建立時間</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {#each products as product (product.id)}
            <tr class="border-t [&_td]:px-4 [&_td]:py-3">
              <td class="font-medium">{product.brand}</td>
              <td>{product.type}</td>
              <td>{product.model_number}</td>
              <td>{product.size}</td>
              <td>
                {#if product.warranty_years === -1}
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                  >
                    永久保固
                  </span>
                {:else if product.warranty_years === 0}
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    無保固
                  </span>
                {:else}
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {product.warranty_years}年保固
                  </span>
                {/if}
              </td>
              <td>
                <span
                  class="px-2 py-1 rounded-full text-xs {product.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'}"
                >
                  {product.is_active ? "啟用" : "停用"}
                </span>
              </td>
              <td class="whitespace-nowrap">
                {new Date(product.created_at).toLocaleDateString("zh-TW")}
              </td>
              <td class="whitespace-nowrap flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onclick={() => openEditForm(product)}
                  class="w-9 h-9 p-0 flex items-center justify-center"
                >
                  <FilePenLine class="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onclick={() => openCopyForm(product)}
                  class="w-9 h-9 p-0 flex items-center justify-center"
                >
                  <Copy class="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onclick={() => handleDelete(product.id)}
                  class="w-9 h-9 p-0 flex items-center justify-center"
                >
                  <Trash2 class="h-4 w-4" />
                </Button>
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="6" class="text-center p-8 text-muted-foreground"
                >無符合條件的產品記錄</td
              >
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <div class="flex justify-between items-center mt-4">
      <p class="text-sm text-muted-foreground">共 {total} 筆資料</p>
      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onclick={() => goToPage(page - 1)}
          disabled={page <= 1}
        >
          上一頁
        </Button>
        <span>第 {page} / {totalPages} 頁</span>
        <Button
          variant="outline"
          size="sm"
          onclick={() => goToPage(page + 1)}
          disabled={page >= totalPages}
        >
          下一頁
        </Button>
      </div>
    </div>
  {/if}
</div>

<Dialog
  bind:isOpen={isDialogOpen}
  title={selectedProduct
    ? selectedProduct.id
      ? "編輯產品"
      : "複製產品"
    : "新增產品"}
  onClose={closeDialog}
  class="max-w-lg"
>
  <ProductForm
    product={selectedProduct}
    isLoading={isFormLoading}
    onSubmit={handleFormSubmit}
    onCancel={closeDialog}
  />
</Dialog>
