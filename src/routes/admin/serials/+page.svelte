<script lang="ts">
  import { onMount } from "svelte";
  import {
    apiService,
    type Serial,
    type SerialCreateRequest,
    type SerialUpdateRequest,
    type Product,
    type SerialWithWarranty,
  } from "$lib/api";
  import { notificationStore } from "$stores/notifications";
  import Button from "$components/ui/Button.svelte";
  import Dialog from "$components/ui/Dialog.svelte";
  import Label from "$components/ui/Label.svelte";
  import Input from "$components/ui/Input.svelte";
  import { Plus, FilePenLine, Trash2, Upload, Link } from "lucide-svelte";
  import SerialForm from "$components/SerialForm.svelte";
  import { goto } from "$app/navigation";
  import type { ProductFilters, ProductFiltersOnchangeData } from "$lib/types";
  import ProductFilter from "$components/ProductFilter.svelte";

  let serials: SerialWithWarranty[] = [];
  let products: Product[] = [];
  let isLoading = true;
  let isFormLoading = false;
  let isDialogOpen = false;
  let selectedSerial: Serial | null = null;
  let isUploadDialogOpen = false;
  let isUploading = false;
  let uploadProgress = 0;
  let failedItems: any[] = [];
  let showFailedItems = false;
  let uploadResult: {
    success_count: number;
    failed_count: number;
    failed_items?: any[];
  } | null = null;
  let isFailedItemsDialogOpen = false;
  let productFilters: ProductFilters = {
    category: "",
    subcategory: "",
    size: "",
  };

  // 拖拽相關狀態
  let isDragOver = false;
  let dragCounter = 0;

  let total = 0;
  let page = 1;
  let pageSize = 10;
  let totalPages = 1;

  let filters = {
    serial_number: "",
    full_serial_number: "",
    product_id: "",
    product_type: "",
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
      if (filters.product_type)
        params.set("product_type", filters.product_type);

      const response = await apiService.getSerials(params);

      if (response.data) {
        // 強制創建新數組並賦值 - 使用後端實際返回的字段名
        serials = response.data.serials ? [...response.data.serials] : [];
        total = response.data.total || 0;
        totalPages = response.data.total_pages || 1;
      } else {
        serials = [];
        total = 0;
        totalPages = 1;
      }
    } catch (e: any) {
      notificationStore.error(`無法載入序號列表: ${e.message}`);
      serials = [];
      total = 0;
      totalPages = 1;
    } finally {
      isLoading = false;
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
    filters = {
      serial_number: "",
      full_serial_number: "",
      product_id: "",
      product_type: "",
    };
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
    // 先載入產品資料
    await fetchProducts();
    // 然後再設置 selectedSerial 和開啟 dialog
    selectedSerial = serial;
    isDialogOpen = true;
  }

  function openUploadDialog() {
    isUploadDialogOpen = true;
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
      // 等待 fetchSerials 完成
      await fetchSerials();
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
      // 等待 fetchSerials 完成
      await fetchSerials();
    } catch (e: any) {
      notificationStore.error(`刪除失敗: ${e.message}`);
    }
  }

  function getProductModelNumber(productId: string | null): string {
    if (!productId) return "未知產品";
    const product = products.find((p) => p.id === productId);
    return product ? `${product.model_number}` : "未知產品";
  }

  function getProductType(productId: string | null): string {
    if (!productId) return "未知產品";
    const product = products.find((p) => p.id === productId);
    return product ? `${product.type}` : "未知產品";
  }

  // CSV 上傳處理函數
  async function handleFileUpload(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (!file) return;

    // 檢查文件類型
    const allowedTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (
      !allowedTypes.includes(file.type) &&
      !file.name.match(/\.(csv|xls|xlsx)$/i)
    ) {
      notificationStore.error("請選擇 CSV、XLS 或 XLSX 檔案");
      return;
    }

    isUploading = true;
    uploadProgress = 0;
    failedItems = []; // 清空失敗項目
    uploadResult = null; // 清空上傳結果
    showFailedItems = false; // 隱藏失敗項目顯示

    const validRow = (row: any[]) => {
      return row.some((cell) => cell && String(cell).trim() !== "");
    };

    try {
      // 讀取 Excel/CSV 文件
      const { ReadExcelOrCSV } = await import("$lib/excel");
      const data = (await ReadExcelOrCSV(file, false)) as (
        | string
        | number
        | boolean
        | null
      )[][];

      if (data.length < 2) {
        notificationStore.error("檔案至少需要包含標題行和一行資料");
        return;
      }

      // 從第二行開始處理資料（跳過標題行）
      const serialsData = data.slice(1).filter(validRow);
      const serialsToImport: any[] = [];

      for (let i = 0; i < serialsData.length; i++) {
        const row = serialsData[i];
        uploadProgress = ((i + 1) / serialsData.length) * 100;

        // 第二列是 model_number（第1個索引），第七列是 full_serial_number（第6個索引）
        const modelNumber = String(row[1] || "").trim();
        const fullSerialNumber = String(row[6] || "").trim();

        if (!modelNumber || !fullSerialNumber) {
          failedItems.push({
            index: i, // 行號從 0 開始
            product_id: null,
            serial_number: null,
            full_serial_number: fullSerialNumber,
            error: `資料異常，請檢查。`,
          });
          continue; // 跳過空行
        }

        const exists = serialsToImport.some(
          (item) => item.full_serial_number === fullSerialNumber
        );
        if (exists) {
          failedItems.push({
            index: i, // 行號從 0 開始
            product_id: null,
            serial_number: null,
            full_serial_number: fullSerialNumber,
            error: `檔案內存在重複的序號`,
          });
          continue;
        }

        // 根據 model_number 找到對應的 product_id
        // 注意：CSV 中的 model_number 沒有 dash，需要忽略 dash 進行比對
        const product = products.find((p) => {
          const csvModelNumber = modelNumber.replace(/-/g, "");
          const dbModelNumber = p.model_number.replace(/-/g, "");
          return csvModelNumber === dbModelNumber;
        });

        if (!product) {
          console.warn(`找不到對應的產品: ${modelNumber}`);
          failedItems.push({
            index: i, // 行號從 0 開始
            product_id: null,
            serial_number: null,
            full_serial_number: fullSerialNumber,
            error: `找不到對應的產品: ${modelNumber}`,
          });
          continue;
        }

        // 從 full_serial_number 提取 serial_number（倒數11碼）
        const serialNumber = fullSerialNumber.slice(-11);

        serialsToImport.push({
          index: i,
          product_id: product.id,
          serial_number: serialNumber,
          full_serial_number: fullSerialNumber,
        });
      }

      if (serialsToImport.length === 0) {
        notificationStore.error("沒有找到有效的資料可以匯入");
        return;
      }

      // 調用 API 進行批量創建
      const response = await apiService.bulkCreateSerials({
        serials: serialsToImport,
      });

      if (response.data) {
        uploadResult = response.data;

        // 合併 CSV 處理過程中的失敗項目和 API 返回的失敗項目
        let allFailedItems: any[] = [];
        if (uploadResult.failed_items && uploadResult.failed_items.length > 0) {
          for (let i = 0; i < serialsData.length; i++) {
            if (failedItems.find((item) => item.index === i)) {
              allFailedItems.push(failedItems.find((item) => item.index === i));
            } else if (
              uploadResult.failed_items.find((item) => item.index === i)
            ) {
              allFailedItems.push(
                uploadResult.failed_items.find((item) => item.index === i)
              );
            }
          }
        } else {
          allFailedItems = [...failedItems];
        }

        if (allFailedItems.length > 0) {
          notificationStore.error(
            `匯入完成，成功 ${uploadResult.success_count} 筆，失敗 ${allFailedItems.length} 筆`
          );
          failedItems = allFailedItems; // 更新失敗項目
          // 關閉上傳 Dialog 並開啟失敗項目 Dialog
          isUploadDialogOpen = false;
          isFailedItemsDialogOpen = true;
        } else {
          notificationStore.success(
            `成功匯入 ${uploadResult.success_count} 筆序號`
          );
          // 完全成功時才關閉 Dialog 並刷新列表
          isUploadDialogOpen = false;
          await fetchSerials();
        }
      }
    } catch (error: any) {
      console.error("CSV 上傳錯誤:", error);
      notificationStore.error(`上傳失敗: ${error.message}`);
    } finally {
      isUploading = false;
      uploadProgress = 0;
      // 清空文件輸入
      target.value = "";
    }
  }

  function closeUploadDialog() {
    isUploadDialogOpen = false;
    isUploading = false;
    uploadProgress = 0;
    // 不清空失敗項目資料，因為可能會在失敗項目 Dialog 中顯示
    // failedItems = [];
    // showFailedItems = false;
    // uploadResult = null;
  }

  function closeFailedItemsDialog() {
    isFailedItemsDialogOpen = false;
    failedItems = [];
    showFailedItems = false;
    uploadResult = null;
    // 刷新序號列表
    fetchSerials();
  }

  // 拖拽處理函數
  function handleDragEnter(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter++;
    isDragOver = true;
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter--;
    if (dragCounter === 0) {
      isDragOver = false;
    }
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    isDragOver = false;
    dragCounter = 0;

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      // 創建一個模擬的事件對象來重用現有的 handleFileUpload 函數
      const mockEvent = {
        target: {
          files: [file],
        },
      } as any;
      handleFileUpload(mockEvent);
    }
  }

  function goToWarranty(warrantyId: string) {
    goto(`/admin/warranties/${warrantyId}`);
  }

  async function handleProductFilterChange(data: ProductFiltersOnchangeData) {
    filters.product_type = data.type;
    filters.product_id = data.product_id;
    handleFilterChange();
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
    <div class="flex gap-2">
      <Button
        variant="outline"
        onclick={openCreateForm}
        class="text-mentor-primary border-mentor-primary hover:text-mentor-white hover:bg-mentor-primary "
      >
        <Plus class="mr-2 h-4 w-4" />
        新增序號
      </Button>
      <Button
        onclick={openUploadDialog}
        class="text-mentor-white bg-mentor-primary hover:text-mentor-primary hover:bg-mentor-white hover:border-mentor-primary border"
      >
        <Upload class="mr-2 h-4 w-4" />
        上傳 Excel
      </Button>
    </div>
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
      <div class="flex items-end">
        <Button variant="ghost" onclick={clearFilters}>清除篩選</Button>
      </div>
    </div>
  </div>
  <ProductFilter
    bind:productFilters
    onFiltersChange={handleProductFilterChange}
  />

  {#if isLoading}
    <div class="text-center p-8">
      <p>載入中...</p>
    </div>
  {:else}
    <!-- 手機版卡片佈局 -->
    <div class="md:hidden space-y-4">
      {#each serials as serial, index (serial.id + "_" + index)}
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
            <th>產品類型</th>
            <th>產品型號</th>
            <th>序號</th>
            <!-- <th>驗證碼</th> -->
            <th>保固書</th>
            <th>建立時間</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {#each serials as serial, index (serial.id + "_" + index)}
            <tr class="border-t [&_td]:px-4 [&_td]:py-3">
              <td class="max-w-xs truncate"
                >{getProductType(serial.product_id)}</td
              >
              <td>{getProductModelNumber(serial.product_id)}</td>
              <td class="font-medium">{serial.serial_number}</td>
              <!-- <td class="font-medium">{serial.checksum}</td> -->
              <td class="flex items-center">
                {#if serial.warranty_id}
                  <Button
                    variant="outline"
                    size="sm"
                    onclick={() => goToWarranty(serial.warranty_id)}
                    class="w-9 h-9 p-0 flex items-center justify-center"
                  >
                    <Link class="h-4 w-4" />
                  </Button>
                {/if}
              </td>
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

<!-- CSV 上傳 Dialog -->
<Dialog
  bind:isOpen={isUploadDialogOpen}
  title="上傳 Excel 檔案"
  onClose={closeUploadDialog}
  class="max-w-2xl"
>
  <div class="space-y-4">
    <div class="text-sm text-muted-foreground">
      <p>請選擇包含序號資料的 CSV、XLS 或 XLSX 檔案。</p>
      <p class="mt-2">檔案格式說明：</p>
      <ul class="mt-2 list-disc list-inside space-y-1">
        <li>第一橫列：標題列（會被忽略）</li>
        <li>第二直行：產品型號</li>
        <li>
          第七直行：完整序號（程式會自動抓取最後面的 11
          碼轉化爲序號，無需增加欄位）
        </li>
      </ul>
    </div>

    <div
      class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition-colors duration-200"
      class:border-primary={isDragOver}
      class:bg-blue-50={isDragOver}
      on:dragenter={handleDragEnter}
      on:dragleave={handleDragLeave}
      on:dragover={handleDragOver}
      on:drop={handleDrop}
      role="button"
      tabindex="0"
      aria-label="拖拽檔案到此處上傳"
    >
      <input
        type="file"
        accept=".csv,.xls,.xlsx"
        on:change={handleFileUpload}
        class="hidden"
        id="csv-upload"
        disabled={isUploading}
      />
      <label
        for="csv-upload"
        class="cursor-pointer block"
        class:pointer-events-none={isUploading}
      >
        {#if isUploading}
          <div class="space-y-2">
            <div
              class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"
            ></div>
            <p class="text-sm text-muted-foreground">
              處理中... {Math.round(uploadProgress)}%
            </p>
          </div>
        {:else if isDragOver}
          <div class="space-y-2">
            <Upload class="h-8 w-8 text-primary mx-auto mb-2" />
            <p class="text-sm text-primary font-medium">放開滑鼠來上傳檔案</p>
            <p class="text-xs text-primary/70">支援 CSV、XLS、XLSX 格式</p>
          </div>
        {:else}
          <Upload class="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p class="text-sm text-gray-600">點擊選擇檔案或拖拽檔案到此處</p>
          <p class="text-xs text-gray-500 mt-1">支援 CSV、XLS、XLSX 格式</p>
        {/if}
      </label>
    </div>

    {#if isUploading}
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div
          class="bg-primary h-2 rounded-full transition-all duration-300"
          style="width: {uploadProgress}%"
        ></div>
      </div>
    {/if}
  </div>
</Dialog>

<!-- 失敗項目詳細 Dialog -->
<Dialog
  bind:isOpen={isFailedItemsDialogOpen}
  title="匯入失敗項目詳情"
  onClose={closeFailedItemsDialog}
  class="max-w-4xl"
>
  <div class="space-y-4">
    {#if uploadResult}
      <div class="p-4 border rounded-lg bg-blue-50">
        <div class="grid grid-cols-2 gap-4">
          <div class="p-3 bg-white rounded border border-blue-200">
            <p class="text-2xl font-bold text-blue-600">
              {uploadResult.success_count}
            </p>
            <p class="text-sm text-blue-700">成功匯入</p>
          </div>
          <div class="p-3 bg-white rounded border border-red-200">
            <p class="text-2xl font-bold text-red-600">
              {failedItems.length}
            </p>
            <p class="text-sm text-red-700">匯入失敗</p>
          </div>
        </div>
      </div>
    {/if}

    <div class="p-4 border rounded-lg bg-red-50">
      <h3 class="text-lg font-semibold text-red-800 mb-3">失敗項目詳細資訊</h3>

      <div class="max-h-96 overflow-y-auto">
        <table class="w-full text-sm">
          <thead class="bg-red-100">
            <tr>
              <th class="text-left p-2 text-red-800">列號</th>
              <th class="text-left p-2 text-red-800">產品型號</th>
              <th class="text-left p-2 text-red-800">序號</th>
              <th class="text-left p-2 text-red-800">完整序號</th>
              <th class="text-left p-2 text-red-800">錯誤原因</th>
            </tr>
          </thead>
          <tbody>
            {#each failedItems as item}
              <tr class="border-b border-red-200">
                <td class="p-2 text-red-700">{item.index + 2}</td>
                <td class="p-2 text-red-700 font-mono text-xs"
                  >{products.find((p) => p.id === item.product_id)
                    ?.model_number || "N/A"}</td
                >
                <td class="p-2 text-red-700 font-mono text-xs"
                  >{item.serial_number || "N/A"}</td
                >
                <td class="p-2 text-red-700 font-mono text-xs"
                  >{item.full_serial_number || "N/A"}</td
                >
                <td class="p-2 text-red-700">{item.error}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <div class="mt-4 text-xs text-red-600">
        <p>💡 提示：請檢查失敗項目的資料格式，修正後可以重新上傳</p>
      </div>
    </div>
  </div>
</Dialog>
