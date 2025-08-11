<!-- src/routes/admin/warranties/+page.svelte -->
<script lang="ts">
  import { onMount, tick } from "svelte";
  import {
    apiService,
    type WarrantyInfo,
    type BatchCreateWarrantyResponse,
    type Product,
  } from "$lib/api";
  import { notificationStore } from "$stores/notifications";
  import Button from "$components/ui/Button.svelte";
  import Input from "$components/ui/Input.svelte";
  import Label from "$components/ui/Label.svelte";
  import Dialog from "$components/ui/Dialog.svelte";
  import { goto } from "$app/navigation";
  import ProductFilter from "$components/ProductFilter.svelte";
  import {
    Search,
    Eye,
    Loader2,
    Plus,
    Download,
    Mail,
    FilePenLine,
    Trash2,
  } from "lucide-svelte";
  import QRCode from "qrcode";
  import type { ProductFilters } from "$lib/types";

  let warranties: WarrantyInfo[] = [];
  let isLoading = true;

  let total = 0;
  let page = 1;
  let pageSize = 10;
  let totalPages = 1;

  // 編輯相關狀態
  let isEditDialogOpen = false;
  let editingWarranty: WarrantyInfo | null = null;
  let isSaving = false;
  let isResendingEmail = false;

  // 批次創建相關狀態
  let isBatchCreateDialogOpen = false;
  let isCreating = false;
  let batchCount = 10;
  let createdWarranties: BatchCreateWarrantyResponse | null = null;
  let qrCodes: string[] = [];
  let isFullscreen = false;

  let filters = {
    q: "",
    patient_name: "",
    serial_number: "",
    hospital_name: "",
    doctor_name: "",
    status: "",
    start_date: "",
    end_date: "",
  };

  let productFilters: ProductFilters;

  // 新增產品清單狀態
  let products: Product[] = [];

  async function fetchWarranties() {
    isLoading = true;
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("page_size", String(pageSize));

      // 添加篩選條件
      if (filters.q) params.set("q", filters.q);
      if (filters.patient_name)
        params.set("patient_name", filters.patient_name);
      if (filters.serial_number)
        params.set("serial_number", filters.serial_number);
      if (filters.hospital_name)
        params.set("hospital_name", filters.hospital_name);
      if (filters.doctor_name) params.set("doctor_name", filters.doctor_name);
      if (filters.status) params.set("status", filters.status);
      if (filters.start_date) params.set("start_date", filters.start_date);
      if (filters.end_date) params.set("end_date", filters.end_date);

      const response = await apiService.searchWarranty(params);
      if (response.data) {
        warranties = response.data.warranties;
        total = response.data.total;
        totalPages = response.data.total_pages;
      }
    } catch (e: any) {
      notificationStore.error(`無法載入保固列表: ${e.message}`);
    } finally {
      isLoading = false;
      await tick();
    }
  }

  async function batchCreateWarranties() {
    if (batchCount < 1 || batchCount > 100) {
      notificationStore.error("請輸入 1-100 之間的數量");
      return;
    }

    isCreating = true;
    try {
      const response = await apiService.batchCreateWarranty({
        count: batchCount,
      });
      if (response.data) {
        createdWarranties = response.data;
        await generateQRCodes();
        notificationStore.success(`成功創建 ${response.data.count} 個保固記錄`);
      } else {
        throw new Error(response.error || "創建失敗");
      }
    } catch (e: any) {
      notificationStore.error(`批次創建失敗: ${e.message}`);
    } finally {
      isCreating = false;
    }
  }

  async function generateQRCodes() {
    if (!createdWarranties) return;

    qrCodes = [];
    for (const id of createdWarranties.ids) {
      const url = `https://warranty.gmmed.com.tw?action=register&id=${id}`;
      try {
        const qrCodeDataUrl = await QRCode.toDataURL(url, {
          width: 200,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        });
        qrCodes.push(qrCodeDataUrl);
      } catch (error) {
        console.error("QR Code 生成失敗:", error);
        qrCodes.push(""); // 添加空字串作為佔位符
      }
    }
  }

  function downloadAllQRCodes() {
    if (!createdWarranties || qrCodes.length === 0) return;

    // 創建一個包含所有 QR Code 的 HTML 頁面
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>保固 QR Code</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .qr-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
          .qr-item { text-align: center; padding: 10px; border: 1px solid #ccc; }
          .qr-item img { max-width: 150px; height: auto; }
          .qr-item p { margin: 5px 0; font-size: 12px; }
          @media print {
            .qr-grid { grid-template-columns: repeat(3, 1fr); }
            .qr-item { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <h1>保固 QR Code 列表</h1>
        <p>生成時間: ${new Date().toLocaleString("zh-TW")}</p>
        <p>總數量: ${createdWarranties.count}</p>
        <div class="qr-grid">
          ${createdWarranties.ids
            .map(
              (id, index) => `
            <div class="qr-item">
              <img src="${qrCodes[index]}" alt="QR Code ${index + 1}">
              <p>ID: ${id}</p>
              <p>序號: ${index + 1}</p>
            </div>
          `
            )
            .join("")}
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `warranty-qrcodes-${new Date().toISOString().split("T")[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function toggleFullscreen() {
    isFullscreen = !isFullscreen;
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }

  function closeBatchCreateDialog() {
    isBatchCreateDialogOpen = false;
    createdWarranties = null;
    qrCodes = [];
    batchCount = 10;
  }

  function handleFilterChange() {
    page = 1;
    fetchWarranties();
  }

  function clearFilters() {
    filters = {
      q: "",
      patient_name: "",
      serial_number: "",
      hospital_name: "",
      doctor_name: "",
      status: "",
      start_date: "",
      end_date: "",
    };
    handleFilterChange();
  }

  function goToPage(newPage: number) {
    if (newPage >= 1 && newPage <= totalPages) {
      page = newPage;
      fetchWarranties();
    }
  }

  function viewWarrantyDetail(warrantyId: string) {
    goto(`/admin/warranties/${warrantyId}`);
  }

  async function editWarranty(warranty: WarrantyInfo) {
    const surgeryDate = warranty.surgery_date
      ? new Date(warranty.surgery_date).toISOString().split("T")[0]
      : "";
    const birthDate = warranty.patient_birth_date
      ? new Date(warranty.patient_birth_date).toISOString().split("T")[0]
      : "";
    editingWarranty = {
      ...warranty,
      surgery_date: surgeryDate,
      patient_birth_date: birthDate,
    };
    // get product info
    const product = await getProductInfo(editingWarranty.product_id);
    if (product) {
      productFilters = {
        brand: product.brand,
        type: product.type,
        model_number: product.model_number,
        size: product.size,
        active: "",
      };
    }

    isEditDialogOpen = true;
  }

  async function updateProductFilters(filters: ProductFilters) {
    productFilters = filters;

    if (filters.type && filters.model_number && filters.size) {
      const params = new URLSearchParams();
      params.set("brand", filters.brand);
      params.set("type", filters.type);
      params.set("model_number", filters.model_number);
      params.set("size", filters.size);

      const response = await apiService.getProductByCondition(params);
      if (response.data && editingWarranty) {
        editingWarranty.product_id = response.data.id;
      }
    }
  }

  async function saveWarranty() {
    if (!editingWarranty) return;

    isSaving = true;
    try {
      const response = await apiService.updateWarranty(editingWarranty.id, {
        product_id: editingWarranty.product_id,
        patient_name: editingWarranty.patient_name,
        patient_id: editingWarranty.patient_id,
        patient_birth_date: editingWarranty.patient_birth_date,
        patient_phone: editingWarranty.patient_phone,
        patient_email: editingWarranty.patient_email,
        hospital_name: editingWarranty.hospital_name,
        doctor_name: editingWarranty.doctor_name,
        surgery_date: editingWarranty.surgery_date,
        product_serial_number: editingWarranty.product_serial_number,
        product_serial_number_2: editingWarranty.product_serial_number_2,
        warranty_start_date: editingWarranty.warranty_start_date,
        status: editingWarranty.status,
      });

      if (response.data) {
        notificationStore.success("保固資料更新成功");
        isEditDialogOpen = false;
        editingWarranty = null;
        await fetchWarranties(); // 重新載入列表
      } else {
        throw new Error(response.message || "更新失敗");
      }
    } catch (e: any) {
      notificationStore.error(`更新失敗: ${e.message}`);
    } finally {
      isSaving = false;
    }
  }

  function closeEditDialog() {
    isEditDialogOpen = false;
    editingWarranty = null;
  }

  function getStatusBadgeClass(status: string) {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "expired":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  function getStatusText(status: string) {
    switch (status) {
      case "active":
        return "有效";
      case "expired":
        return "已過期";
      case "cancelled":
        return "已取消";
      default:
        return status;
    }
  }

  async function getProductInfo(productId: string) {
    // get product info from api
    const response = await apiService.getProductByCondition(
      new URLSearchParams({
        id: productId,
      })
    );
    if (response.data) {
      return response.data;
    }
    return null;
  }

  async function resendConfirmationEmail(warrantyId: string) {
    isResendingEmail = true;
    try {
      const response = await apiService.resendConfirmationEmail(warrantyId);
      if (response.data) {
        notificationStore.success("確認保固信件已重新發送");
        // 重新載入保固資料以更新保固信件發送狀態
        await fetchWarranties();
        // 如果正在編輯該保固，也更新編輯中的資料
        if (editingWarranty && editingWarranty.id === warrantyId) {
          const updatedWarranty = warranties.find((w) => w.id === warrantyId);
          if (updatedWarranty) {
            editingWarranty.confirmation_email_sent =
              updatedWarranty.confirmation_email_sent;
            editingWarranty.email_sent_at = updatedWarranty.email_sent_at;
          }
        }
      } else {
        throw new Error(response.message || "重新發送失敗");
      }
    } catch (e: any) {
      notificationStore.error(`重新發送失敗: ${e.message}`);
    } finally {
      isResendingEmail = false;
    }
  }

  async function handleDelete(warrantyId: string) {
    if (!confirm("確定要刪除此保固資料嗎？此操作無法還原。")) return;
    try {
      const response = await apiService.deleteWarranty(warrantyId);
      if (response.data) {
        notificationStore.success("保固資料已刪除");
        await fetchWarranties();
      } else {
        throw new Error(response.message || "刪除失敗");
      }
    } catch (e: any) {
      notificationStore.error(`刪除失敗: ${e.message}`);
    }
  }

  onMount(async () => {
    try {
      await fetchWarranties();
      // 載入產品清單
      const res = await apiService.getProducts();
      if (res.data) {
        products = res.data.products;
      }
    } catch (error) {
      console.error("Failed to load warranties or products:", error);
    }
  });
</script>

<svelte:head>
  <title>保固管理</title>
</svelte:head>

<div>
  <div class="flex justify-between items-center mb-6">
    <h2 class="text-2xl font-bold">保固管理</h2>
    <div class="flex gap-2">
      <Button onclick={() => (isBatchCreateDialogOpen = true)}>
        <Plus class="mr-2 h-4 w-4" />
        批次創建保固
      </Button>
    </div>
  </div>

  <!-- 手機版搜尋區域 -->
  <div class="md:hidden mb-6">
    <div class="p-4 border rounded-lg bg-muted/30">
      <div class="space-y-4">
        <div>
          <Label for="mobile_q_filter">快速搜尋</Label>
          <div class="flex gap-2 mt-1">
            <Input
              id="mobile_q_filter"
              bind:value={filters.q}
              placeholder="搜尋患者姓名、身分證、手機、序號、醫院、醫師"
              class="flex-1"
            />
            <Button onclick={handleFilterChange} class="px-4">
              <Search class="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <Label for="mobile_status_filter">狀態</Label>
            <select
              id="mobile_status_filter"
              bind:value={filters.status}
              onchange={handleFilterChange}
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">全部</option>
              <option value="active">有效</option>
              <option value="expired">已過期</option>
              <option value="cancelled">已取消</option>
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
  <div class="hidden md:block">
    <div class="p-4 border rounded-lg mb-6 bg-muted/30">
      <div class="grid grid-cols-1 gap-4 mb-4">
        <div>
          <Label for="q_filter">通用搜尋</Label>
          <div class="flex gap-2">
            <Input
              id="q_filter"
              bind:value={filters.q}
              placeholder="支援搜尋：患者姓名、身分證字號、手機號碼、產品序號、醫院名稱、醫師姓名"
              class="flex-1"
            />
            <Button onclick={handleFilterChange}>
              <Search class="mr-2 h-4 w-4" />
              搜尋
            </Button>
          </div>
        </div>
      </div>
    </div>
    <div class="p-4 border rounded-lg mb-6 bg-muted/30">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <Label for="start_date_filter">手術日期範圍：起</Label>
          <Input
            id="start_date_filter"
            type="date"
            bind:value={filters.start_date}
            on:change={handleFilterChange}
          />
        </div>
        <div>
          <Label for="end_date_filter">手術日期範圍：迄</Label>
          <Input
            id="end_date_filter"
            type="date"
            bind:value={filters.end_date}
            on:change={handleFilterChange}
          />
        </div>
        <div>
          <Label for="status_filter">保固狀態</Label>
          <select
            id="status_filter"
            bind:value={filters.status}
            onchange={handleFilterChange}
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">全部</option>
            <option value="active">有效</option>
            <option value="expired">已過期</option>
            <option value="cancelled">已取消</option>
          </select>
        </div>
        <div class="flex items-end">
          <Button variant="ghost" onclick={clearFilters}>清除篩選</Button>
        </div>
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
      {#each warranties as warranty (warranty.id)}
        <div class="border rounded-lg p-4 bg-white shadow-sm">
          <div class="flex justify-between items-start mb-3">
            <div>
              <h3 class="font-semibold text-lg">{warranty.patient_name}</h3>
              <p class="text-sm text-gray-600">{warranty.hospital_name}</p>
            </div>
            <span
              class="px-2 py-1 rounded-full text-xs {getStatusBadgeClass(
                warranty.status
              )}"
            >
              {getStatusText(warranty.status)}
            </span>
          </div>

          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">產品序號:</span>
              <span class="font-mono">{warranty.product_serial_number}</span>
            </div>
            {#if warranty.product_serial_number_2}
              <div class="flex justify-between">
                <span class="text-gray-600">第二序號:</span>
                <span class="font-mono">{warranty.product_serial_number_2}</span
                >
              </div>
            {/if}
            <div class="flex justify-between">
              <span class="text-gray-600">醫師:</span>
              <span>{warranty.doctor_name}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">保固開始:</span>
              <span
                >{new Date(warranty.warranty_start_date).toLocaleDateString(
                  "zh-TW"
                )}</span
              >
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">保固結束:</span>
              <span>
                {#if warranty.warranty_years === 0}
                  <span class="text-green-600 font-semibold">終身保固</span>
                {:else}
                  {new Date(warranty.warranty_end_date).toLocaleDateString(
                    "zh-TW"
                  )}
                {/if}
              </span>
            </div>
          </div>

          <div class="flex gap-2 mt-4 pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onclick={() => viewWarrantyDetail(warranty.id)}
              class="flex-1"
            >
              <Eye class="mr-1 h-4 w-4" />
              查看
            </Button>
            <Button
              variant="outline"
              size="sm"
              onclick={() => editWarranty(warranty)}
              class="flex-1"
            >
              <FilePenLine class="mr-1 h-4 w-4" />
              編輯
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onclick={() => handleDelete(warranty.id)}
              class="flex-1"
            >
              <Trash2 class="mr-1 h-4 w-4" />
              刪除
            </Button>
          </div>
        </div>
      {:else}
        <div class="text-center p-8 text-muted-foreground border rounded-lg">
          無符合條件的保固記錄
        </div>
      {/each}
    </div>

    <!-- 桌面版表格佈局 -->
    <div class="hidden md:block border rounded-lg overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-muted/50">
          <tr class="[&_th]:px-4 [&_th]:py-3 [&_th]:text-left">
            <th>患者姓名</th>
            <th>產品序號</th>
            <th>醫院名稱</th>
            <th>醫師姓名</th>
            <th>保固期限</th>
            <th>狀態</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {#each warranties as warranty (warranty.id)}
            <tr class="border-t [&_td]:px-4 [&_td]:py-3">
              <td class="font-medium whitespace-nowrap"
                >{warranty.patient_name}</td
              >
              <td>
                <div class="text-sm">
                  <div class="whitespace-nowrap">
                    {warranty.product_serial_number}
                  </div>
                  {#if warranty.product_serial_number_2}
                    <div class="text-muted-foreground whitespace-nowrap">
                      第二個序號: {warranty.product_serial_number_2}
                    </div>
                  {/if}
                </div>
              </td>
              <td class="whitespace-nowrap">{warranty.hospital_name}</td>
              <td class="whitespace-nowrap">{warranty.doctor_name}</td>
              <td>
                <div class="text-xs">
                  <div class="whitespace-nowrap">
                    開始: {new Date(
                      warranty.warranty_start_date
                    ).toLocaleDateString("zh-TW")}
                  </div>
                  <div class="whitespace-nowrap">
                    {#if warranty.warranty_years === 0}
                      <span class="text-green-600 font-semibold">終身保固</span>
                    {:else}
                      結束: {new Date(
                        warranty.warranty_end_date
                      ).toLocaleDateString("zh-TW")}
                    {/if}
                  </div>
                </div>
              </td>
              <td class="whitespace-nowrap">
                <span
                  class="px-2 py-1 rounded-full text-xs {getStatusBadgeClass(
                    warranty.status
                  )}"
                >
                  {getStatusText(warranty.status)}
                </span>
              </td>
              <td class="whitespace-nowrap flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onclick={() => viewWarrantyDetail(warranty.id)}
                  class="w-9 h-9 p-0 flex items-center justify-center"
                >
                  <Eye class="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onclick={() => editWarranty(warranty)}
                  class="w-9 h-9 p-0 flex items-center justify-center"
                >
                  <FilePenLine class="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onclick={() => handleDelete(warranty.id)}
                  class="w-9 h-9 p-0 flex items-center justify-center"
                >
                  <Trash2 class="h-4 w-4" />
                </Button>
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="8" class="text-center p-8 text-muted-foreground"
                >無符合條件的保固記錄</td
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

<!-- 編輯保固 Dialog -->
<Dialog
  isOpen={isEditDialogOpen}
  title="編輯保固資料"
  onClose={closeEditDialog}
>
  {#if editingWarranty}
    <div
      class="space-y-8 max-h-[70vh] overflow-y-auto pr-2 max-w-4xl w-full mx-auto"
    >
      <!-- 患者資訊區塊 -->
      <div>
        <h3
          class="text-lg font-bold text-blue-700 mb-2 flex items-center gap-2"
        >
          <span>👤</span>患者資訊
        </h3>
        <div class="grid grid-cols-3 gap-4">
          <div>
            <Label for="edit_patient_name">患者姓名</Label>
            <Input
              id="edit_patient_name"
              bind:value={editingWarranty.patient_name}
              placeholder="患者姓名"
            />
          </div>
          <div>
            <Label for="edit_patient_id">身分證字號</Label>
            <Input
              id="edit_patient_id"
              bind:value={editingWarranty.patient_id}
              placeholder="身分證字號"
            />
          </div>
          <div>
            <Label for="edit_patient_birth_date">出生年月日</Label>
            <Input
              id="edit_patient_birth_date"
              type="date"
              bind:value={editingWarranty.patient_birth_date}
            />
          </div>
        </div>
      </div>
      <hr class="my-2 border-gray-200" />
      <!-- 聯絡與醫療資訊區塊 -->
      <div>
        <h3
          class="text-lg font-bold text-blue-700 mb-2 flex items-center gap-2"
        >
          <span>🏥</span>聯絡與醫療資訊
        </h3>
        <div class="grid grid-cols-3 gap-4">
          <div>
            <Label for="edit_patient_phone">聯絡電話</Label>
            <Input
              id="edit_patient_phone"
              bind:value={editingWarranty.patient_phone}
              placeholder="聯絡電話"
            />
          </div>
          <div>
            <Label for="edit_patient_email">電子郵件</Label>
            <Input
              id="edit_patient_email"
              type="email"
              bind:value={editingWarranty.patient_email}
              placeholder="電子郵件"
            />
          </div>
          <div>
            <Label for="edit_hospital_name">醫院名稱</Label>
            <Input
              id="edit_hospital_name"
              bind:value={editingWarranty.hospital_name}
              placeholder="醫院名稱"
            />
          </div>
        </div>
        <div class="grid grid-cols-3 gap-4 mt-4">
          <div>
            <Label for="edit_doctor_name">醫師姓名</Label>
            <Input
              id="edit_doctor_name"
              bind:value={editingWarranty.doctor_name}
              placeholder="醫師姓名"
            />
          </div>
          <div>
            <Label for="edit_surgery_date">手術日期</Label>
            <Input
              id="edit_surgery_date"
              type="date"
              bind:value={editingWarranty.surgery_date}
            />
          </div>
        </div>
      </div>
      <hr class="my-2 border-gray-200" />
      <!-- 產品資訊區塊 -->
      <div>
        <h3
          class="text-lg font-bold text-blue-700 mb-2 flex items-center gap-2"
        >
          <span>📦</span>產品資訊
        </h3>
        <div class="grid grid-cols-1">
          <div class="grid gap-2">
            {#if productFilters}
              <ProductFilter
                bind:filters={productFilters}
                presetBrand={productFilters.brand}
                getAllMetadata={true}
                onFiltersChange={(filters) => updateProductFilters(filters)}
              />
            {/if}
          </div>
        </div>
        <div class="grid grid-cols-3 gap-4">
          <div>
            <Label for="edit_product_serial_number">產品序號</Label>
            <Input
              id="edit_product_serial_number"
              bind:value={editingWarranty.product_serial_number}
              placeholder="產品序號"
            />
          </div>
          <div>
            <Label for="edit_product_serial_number_2">第二個序號</Label>
            <Input
              id="edit_product_serial_number_2"
              bind:value={editingWarranty.product_serial_number_2}
              placeholder="第二個序號（選填）"
            />
          </div>
        </div>
      </div>
      <hr class="my-2 border-gray-200" />
      <!-- 狀態與紀錄區塊 -->
      <div>
        <h3
          class="text-lg font-bold text-blue-700 mb-2 flex items-center gap-2"
        >
          <span>📄</span>狀態與紀錄
        </h3>
        <div class="grid grid-cols-3 gap-4">
          <div>
            <Label for="edit_status">保固狀態</Label>
            <select
              id="edit_status"
              bind:value={editingWarranty.status}
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="active">有效</option>
              <option value="expired">已過期</option>
              <option value="cancelled">已取消</option>
            </select>
          </div>
          <div>
            <Label>保固信件發送狀態</Label>
            <div class="h-10 flex items-center gap-2">
              <span
                class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border {editingWarranty.confirmation_email_sent
                  ? 'text-green-700 border-green-300 bg-green-50'
                  : 'text-gray-500 border-gray-300 bg-gray-100'}"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                  ><path
                    d="M5 13l4 4L19 7"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  /></svg
                >
                {editingWarranty.confirmation_email_sent ? "已發送" : "未發送"}
              </span>
              {#if editingWarranty && editingWarranty.status === "active"}
                <Button
                  variant="outline"
                  size="sm"
                  onclick={() =>
                    resendConfirmationEmail(editingWarranty?.id || "")}
                  disabled={isResendingEmail}
                  class="ml-2"
                >
                  {#if isResendingEmail}
                    <Loader2 class="mr-2 h-3 w-3 animate-spin" />
                  {:else}
                    <Mail class="mr-2 h-3 w-3" />
                  {/if}
                  重新寄送
                </Button>
              {/if}
            </div>
          </div>
          <div>
            <Label>保固信件發送時間</Label>
            <div class="h-10 flex items-center">
              <span
                class="inline-block px-3 py-1 rounded bg-gray-100 text-xs text-gray-600 border border-gray-200"
                >{editingWarranty.email_sent_at
                  ? new Date(editingWarranty.email_sent_at).toLocaleString(
                      "zh-TW",
                      {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      }
                    )
                  : "-"}</span
              >
            </div>
          </div>
        </div>
        <div class="grid grid-cols-3 gap-4 mt-4">
          <div>
            <Label>建立時間</Label>
            <div class="h-10 flex items-center">
              <span
                class="inline-block px-3 py-1 rounded bg-gray-50 text-xs text-gray-500 border border-gray-200"
                >{new Date(editingWarranty.created_at).toLocaleString("zh-TW", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}</span
              >
            </div>
          </div>
          <div>
            <Label>更新時間</Label>
            <div class="h-10 flex items-center">
              <span
                class="inline-block px-3 py-1 rounded bg-gray-50 text-xs text-gray-500 border border-gray-200"
                >{new Date(editingWarranty.updated_at).toLocaleString("zh-TW", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}</span
              >
            </div>
          </div>
        </div>
      </div>
      <div class="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onclick={closeEditDialog} disabled={isSaving}>
          取消
        </Button>
        <Button onclick={saveWarranty} disabled={isSaving}>
          {#if isSaving}
            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
            儲存中...
          {:else}
            儲存變更
          {/if}
        </Button>
      </div>
    </div>
  {/if}
</Dialog>

<!-- 批次創建保固 Dialog -->
{#if isBatchCreateDialogOpen}
  <div
    class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
    aria-hidden="true"
    onclick={closeBatchCreateDialog}
  ></div>

  <div
    class="fixed left-1/2 top-1/2 z-50 w-full max-w-4xl -translate-x-1/2 -translate-y-1/2 transform rounded-lg border bg-background p-6 shadow-lg max-h-[90vh] overflow-y-auto"
    role="dialog"
    aria-labelledby="dialog-title"
    aria-modal="true"
  >
    <div class="flex flex-col space-y-1.5 text-center sm:text-left">
      <h2
        id="dialog-title"
        class="text-lg font-semibold leading-none tracking-tight"
      >
        批次創建保固
      </h2>
    </div>
    <div class="py-4">
      {#if !createdWarranties}
        <div class="space-y-4">
          <div>
            <Label for="batch_count">創建數量</Label>
            <Input
              id="batch_count"
              type="number"
              bind:value={batchCount}
              min="1"
              max="100"
              placeholder="請輸入要創建的保固數量 (1-100)"
            />
            <p class="text-sm text-muted-foreground mt-1">
              一次最多可創建 100 個空白保固記錄
            </p>
          </div>

          <div class="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onclick={closeBatchCreateDialog}
              disabled={isCreating}
            >
              取消
            </Button>
            <Button onclick={batchCreateWarranties} disabled={isCreating}>
              {#if isCreating}
                <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                創建中...
              {:else}
                <Plus class="mr-2 h-4 w-4" />
                創建保固
              {/if}
            </Button>
          </div>
        </div>
      {:else}
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <div>
              <h3 class="text-lg font-semibold">創建成功！</h3>
              <p class="text-sm text-muted-foreground">
                已創建 {createdWarranties.count} 個保固記錄
              </p>
            </div>
            <div class="flex gap-2">
              <Button onclick={downloadAllQRCodes}>
                <Download class="mr-2 h-4 w-4" />
                下載所有 QR Code
              </Button>
            </div>
          </div>

          {#if qrCodes.length > 0}
            <div class="border rounded-lg p-4 max-h-96 overflow-y-auto">
              <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {#each createdWarranties.ids as id, index}
                  <div class="text-center p-3 border rounded-lg bg-gray-50">
                    {#if qrCodes[index]}
                      <img
                        src={qrCodes[index]}
                        alt={`QR Code ${index + 1}`}
                        class="w-full max-w-32 mx-auto mb-2"
                      />
                    {:else}
                      <div
                        class="w-32 h-32 mx-auto mb-2 bg-gray-200 flex items-center justify-center"
                      >
                        <Loader2 class="h-8 w-8 animate-spin text-gray-400" />
                      </div>
                    {/if}
                    <p class="text-xs text-gray-600 mb-1">序號: {index + 1}</p>
                    <p class="text-xs text-gray-500 font-mono break-all">
                      {id}
                    </p>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          <div class="flex justify-end gap-2 pt-4">
            <Button variant="outline" onclick={closeBatchCreateDialog}>
              完成
            </Button>
            <Button
              onclick={() => {
                createdWarranties = null;
                qrCodes = [];
              }}
            >
              再創建一批
            </Button>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}

<!-- 全螢幕 QR Code 檢視 -->
{#if isFullscreen && createdWarranties && qrCodes.length > 0}
  <div class="fixed inset-0 bg-white z-50 overflow-auto">
    <div class="p-8">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold">保固 QR Code - 全螢幕檢視</h2>
        <div class="flex gap-2">
          <Button onclick={downloadAllQRCodes}>
            <Download class="mr-2 h-4 w-4" />
            下載
          </Button>
          <Button variant="outline" onclick={toggleFullscreen}>
            關閉全螢幕
          </Button>
        </div>
      </div>

      <div
        class="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
      >
        {#each createdWarranties.ids as id, index}
          <div class="text-center p-4 border rounded-lg bg-gray-50">
            {#if qrCodes[index]}
              <img
                src={qrCodes[index]}
                alt={`QR Code ${index + 1}`}
                class="w-full max-w-40 mx-auto mb-3"
              />
            {:else}
              <div
                class="w-40 h-40 mx-auto mb-3 bg-gray-200 flex items-center justify-center"
              >
                <Loader2 class="h-8 w-8 animate-spin text-gray-400" />
              </div>
            {/if}
            <p class="text-sm font-semibold mb-1">序號: {index + 1}</p>
            <p class="text-xs text-gray-500 font-mono break-all">{id}</p>
          </div>
        {/each}
      </div>
    </div>
  </div>
{/if}
