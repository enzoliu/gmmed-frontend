<script lang="ts">
  import { onMount, tick } from "svelte";
  import {
    apiService,
    type Serial,
    type SerialCreateRequest,
    type SerialUpdateRequest,
    type Product,
  } from "$lib/api";
  import { notificationStore } from "$stores/notifications";
  import Button from "$components/ui/Button.svelte";
  import Dialog from "$components/ui/Dialog.svelte";
  import Label from "$components/ui/Label.svelte";
  import Input from "$components/ui/Input.svelte";
  import { Plus, FilePenLine, Trash2, Search, Filter } from "lucide-svelte";
  import SerialForm from "$components/SerialForm.svelte";

  let serials: Serial[] = [];
  let products: Product[] = [];
  let isLoading = true;
  let isFormLoading = false;
  let isDialogOpen = false;
  let selectedSerial: Serial | null = null;

  let total = 0;
  let page = 1;
  let pageSize = 10;
  let totalPages = 1;

  let filters = {
    serial_number: "",
    full_serial_number: "",
    product_id: "",
  };

  async function fetchSerials() {
    isLoading = true;
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("page_size", String(pageSize));
      if (filters.serial_number)
        params.set("serial_number", filters.serial_number);
      if (filters.full_serial_number)
        params.set("full_serial_number", filters.full_serial_number);
      if (filters.product_id) params.set("product_id", filters.product_id);

      console.log("Fetching serials with params:", params.toString());
      const response = await apiService.getSerials(params);
      console.log("API response:", response);

      if (response.data) {
        console.log("Response data:", response.data);
        console.log("Serials data:", response.data.serials);

        // 強制創建新數組並賦值 - 使用後端實際返回的字段名
        serials = response.data.serials ? [...response.data.serials] : [];
        total = response.data.total || 0;
        totalPages = response.data.total_pages || 1;

        console.log("Updated serials:", serials);
        console.log("Updated total:", total);
        console.log("Updated totalPages:", totalPages);
      } else {
        console.log("No response data");
        serials = [];
        total = 0;
        totalPages = 1;
      }
    } catch (e: any) {
      console.error("Error in fetchSerials:", e);
      notificationStore.error(`無法載入序號列表: ${e.message}`);
      serials = [];
      total = 0;
      totalPages = 1;
    } finally {
      isLoading = false;
      await tick();
    }
  }

  async function fetchProducts() {
    try {
      const response = await apiService.getProductsAll();
      if (response.data) {
        products = [...response.data.data];
      }
    } catch (e: any) {
      console.error("Failed to load products:", e);
    }
  }

  function handleFilterChange() {
    page = 1;
    fetchSerials();
  }

  function clearFilters() {
    filters = { serial_number: "", full_serial_number: "", product_id: "" };
    handleFilterChange();
  }

  function goToPage(newPage: number) {
    if (newPage >= 1 && newPage <= totalPages) {
      page = newPage;
      fetchSerials();
    }
  }

  async function openCreateForm() {
    // 然後再設置 selectedSerial 和開啟 dialog
    selectedSerial = null;
    isDialogOpen = true;
  }

  async function openEditForm(serial: Serial) {
    // 然後再設置 selectedSerial 和開啟 dialog
    selectedSerial = serial;
    isDialogOpen = true;
  }

  function closeDialog() {
    isDialogOpen = false;
    selectedSerial = null;
  }

  async function handleFormSubmit(
    data: SerialCreateRequest | SerialUpdateRequest
  ) {
    isFormLoading = true;
    try {
      if (selectedSerial) {
        await apiService.updateSerial(
          selectedSerial.id,
          data as SerialUpdateRequest
        );
        notificationStore.success("序號更新成功");
      } else {
        await apiService.createSerial(data as SerialCreateRequest);
        notificationStore.success("序號新增成功");
      }
      closeDialog();
      // 等待 fetchSerials 完成並強制更新
      await fetchSerials();
      await tick();
    } catch (e: any) {
      notificationStore.error(`儲存失敗: ${e.message}`);
    } finally {
      isFormLoading = false;
    }
  }

  async function handleDelete(serialId: string) {
    if (!confirm("您確定要刪除這個序號嗎？")) {
      return;
    }
    try {
      await apiService.deleteSerial(serialId);
      notificationStore.success("序號已刪除");
      // 等待 fetchSerials 完成並強制更新
      await fetchSerials();
      await tick();
    } catch (e: any) {
      notificationStore.error(`刪除失敗: ${e.message}`);
    }
  }

  function getProductName(productId: string | null): string {
    if (!productId) return "未知產品";
    const product = products.find((p) => p.id === productId);
    return product ? `${product.brand} ${product.model_number}` : "未知產品";
  }

  onMount(async () => {
    try {
      await fetchProducts();
      // 只載入序號列表，產品資料在需要時才載入
      await fetchSerials();
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  });
</script>

<svelte:head>
  <title>序號管理</title>
</svelte:head>

<div>
  <div class="flex justify-between items-center mb-6">
    <h2 class="text-2xl font-bold">序號列表</h2>
    <Button onclick={openCreateForm}>
      <Plus class="mr-2 h-4 w-4" />
      新增序號
    </Button>
  </div>

  <!-- 手機版搜尋區域 -->
  <div class="md:hidden mb-6">
    <div class="p-4 border rounded-lg bg-muted/30">
      <div class="space-y-4">
        <div>
          <Label for="mobile_serial_filter">序號</Label>
          <Input
            id="mobile_serial_filter"
            bind:value={filters.serial_number}
            placeholder="搜尋序號"
            on:input={handleFilterChange}
          />
        </div>
        <div>
          <Label for="mobile_full_serial_filter">完整序號</Label>
          <Input
            id="mobile_full_serial_filter"
            bind:value={filters.full_serial_number}
            placeholder="搜尋完整序號"
            on:input={handleFilterChange}
          />
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <Label for="mobile_product_filter">產品</Label>
            <select
              id="mobile_product_filter"
              bind:value={filters.product_id}
              on:change={handleFilterChange}
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">全部產品</option>
              {#each products as product}
                <option value={product.id}
                  >{product.brand} {product.model_number}</option
                >
              {/each}
            </select>
          </div>
          <div class="flex items-end">
            <Button variant="ghost" onclick={clearFilters} class="w-full"
              >清除</Button
            >
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 桌面版篩選區域 -->
  <div class="hidden md:block p-4 border rounded-lg mb-6 bg-muted/30">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div>
        <Label for="serial_filter">序號</Label>
        <Input
          id="serial_filter"
          bind:value={filters.serial_number}
          placeholder="搜尋序號"
          on:input={handleFilterChange}
        />
      </div>
      <div>
        <Label for="full_serial_filter">完整序號</Label>
        <Input
          id="full_serial_filter"
          bind:value={filters.full_serial_number}
          placeholder="搜尋完整序號"
          on:input={handleFilterChange}
        />
      </div>
      <div>
        <Label for="product_filter">產品</Label>
        <select
          id="product_filter"
          bind:value={filters.product_id}
          on:change={handleFilterChange}
          class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">全部產品</option>
          {#each products as product}
            <option value={product.id}
              >{product.brand} {product.model_number}</option
            >
          {/each}
        </select>
      </div>
      <div class="flex items-end">
        <Button variant="ghost" onclick={clearFilters}>清除篩選</Button>
      </div>
    </div>
  </div>

  {#if isLoading}
    <div class="text-center p-8">
      <p>載入中...</p>
    </div>
  {:else}
    <!-- 手機版卡片佈局 -->
    <div class="md:hidden space-y-4">
      {#each serials as serial (serial.id)}
        <div class="border rounded-lg p-4 bg-white shadow-sm">
          <div class="flex justify-between items-start mb-3">
            <div>
              <h3 class="font-semibold text-lg">{serial.serial_number}</h3>
              <p class="text-sm text-gray-600">{serial.full_serial_number}</p>
            </div>
            <span
              class="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
            >
              {serial.product_id ? "已分配" : "未分配"}
            </span>
          </div>

          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">產品:</span>
              <span></span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">建立時間:</span>
              <span
                >{new Date(serial.created_at).toLocaleDateString("zh-TW")}</span
              >
            </div>
          </div>

          <div class="flex gap-2 mt-4 pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onclick={() => openEditForm(serial)}
              class="flex-1"
            >
              <FilePenLine class="mr-1 h-4 w-4" />
              編輯
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onclick={() => handleDelete(serial.id)}
              class="flex-1"
            >
              <Trash2 class="mr-1 h-4 w-4" />
              刪除
            </Button>
          </div>
        </div>
      {:else}
        <div class="text-center p-8 text-muted-foreground border rounded-lg">
          無符合條件的序號記錄
        </div>
      {/each}
    </div>

    <!-- 桌面版表格佈局 -->
    <div class="hidden md:block border rounded-lg overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-muted/50">
          <tr class="[&_th]:px-4 [&_th]:py-3 [&_th]:text-left">
            <th>序號</th>
            <th>完整序號</th>
            <th>產品</th>
            <th>建立時間</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {#each serials as serial (serial.id)}
            <tr class="border-t [&_td]:px-4 [&_td]:py-3">
              <td class="font-medium">{serial.serial_number}</td>
              <td class="max-w-xs truncate">{serial.full_serial_number}</td>
              <td>{getProductName(serial.product_id)}</td>
              <td class="whitespace-nowrap">
                {new Date(serial.created_at).toLocaleDateString("zh-TW")}
              </td>
              <td class="whitespace-nowrap flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onclick={() => openEditForm(serial)}
                  class="w-9 h-9 p-0 flex items-center justify-center"
                >
                  <FilePenLine class="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onclick={() => handleDelete(serial.id)}
                  class="w-9 h-9 p-0 flex items-center justify-center"
                >
                  <Trash2 class="h-4 w-4" />
                </Button>
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="6" class="text-center p-8 text-muted-foreground">
                無符合條件的序號記錄
              </td>
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
  title={selectedSerial ? "編輯序號" : "新增序號"}
  onClose={closeDialog}
  class="max-w-4xl"
>
  <SerialForm
    serial={selectedSerial}
    isLoading={isFormLoading}
    {products}
    on:submit={(e) => handleFormSubmit(e.detail)}
    on:cancel={closeDialog}
  />
</Dialog>
