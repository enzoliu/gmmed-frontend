<script lang="ts">
  import { page } from "$app/state";
  import { onMount, tick } from "svelte";
  import { apiService, type WarrantyInfo } from "$lib/api";
  import { notificationStore } from "$stores/notifications";
  import Button from "$components/ui/Button.svelte";
  import { goto } from "$app/navigation";
  import { browser } from "$app/environment";
  import Dialog from "$components/ui/Dialog.svelte";
  import Input from "$components/ui/Input.svelte";
  import Label from "$components/ui/Label.svelte";
  import {
    Edit,
    User,
    Building,
    Package,
    ShieldCheck,
    ArrowRight,
    ArrowLeft,
    Loader2,
    Mail,
  } from "lucide-svelte";

  let warranty: WarrantyInfo | null = null;
  let isLoading = true;
  let error: string | null = null;

  // --- 編輯 Dialog 相關狀態 ---
  let isEditDialogOpen = false;
  let editingWarranty: WarrantyInfo | null = null;
  let isSaving = false;
  let isResendingEmail = false;
  // ---

  async function loadWarranty() {
    isLoading = true;
    error = null;
    try {
      const id = page.params.id;
      const response = await apiService.getWarrantyById(id);
      if (response.data) {
        warranty = response.data;
      } else {
        throw new Error(
          response.message || response.error || "找不到指定的保固資料"
        );
      }
    } catch (e: any) {
      error = e.message;
      notificationStore.error(`載入資料失敗: ${e.message}`);
    } finally {
      isLoading = false;
      await tick();
    }
  }

  onMount(async () => {
    try {
      await loadWarranty();
    } catch (error) {
      console.error("Failed to load warranty:", error);
    }
  });

  function formatDate(dateString?: string) {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function getStatusClass(status?: "active" | "expired" | "cancelled") {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "expired":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  function goBack() {
    if (browser) {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        goto("/admin/warranties"); // Default back location for admin detail page
      }
    }
  }

  // --- 編輯 Dialog 相關函數 ---
  function openEditDialog() {
    if (!warranty) return;
    // 格式化日期以符合 <input type="date">
    const surgeryDate = warranty.surgery_date
      ? new Date(warranty.surgery_date).toISOString().split("T")[0]
      : "";
    editingWarranty = {
      ...warranty,
      surgery_date: surgeryDate,
    };
    isEditDialogOpen = true;
  }

  function closeEditDialog() {
    isEditDialogOpen = false;
    editingWarranty = null;
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
        status: editingWarranty.status,
      });

      if (response.data) {
        notificationStore.success("保固資料更新成功");
        closeEditDialog();
        await loadWarranty(); // 重新載入頁面資料
      } else {
        throw new Error(response.message || "更新失敗");
      }
    } catch (e: any) {
      notificationStore.error(`更新失敗: ${e.message}`);
    } finally {
      isSaving = false;
    }
  }

  async function resendConfirmationEmail() {
    if (!warranty) return;

    isResendingEmail = true;
    try {
      const response = await apiService.resendConfirmationEmail(warranty.id);

      // API 呼叫完成後，立刻解除按鈕的載入狀態
      isResendingEmail = false;

      if (response.data) {
        notificationStore.success(response.data.message || "郵件已成功寄出");
        await loadWarranty(); // 然後再重新載入資料以更新頁面
      } else {
        throw new Error(response.message || "無法寄送郵件");
      }
    } catch (e: any) {
      // 如果出錯，也要確保解除載入狀態
      isResendingEmail = false;
      notificationStore.error(`寄送失敗: ${e.message}`);
    }
  }
  // ---
</script>

<svelte:head>
  <title>保固詳細資料 - {warranty?.patient_name ?? "查詢"}</title>
</svelte:head>

<!-- 
  這個 div 是此頁面的根元素，用來覆蓋從根佈局繼承的背景。
  它設定了白色背景，並確保最小高度為全螢幕。
-->
<div class="min-h-screen w-full bg-white" style="background-image: none;">
  <div class="container mx-auto max-w-4xl py-8">
    {#if isLoading}
      <div class="flex h-64 items-center justify-center">
        <p>載入中...</p>
      </div>
    {:else if error}
      <div class="rounded-lg bg-destructive/10 p-12 text-center">
        <p class="font-semibold text-destructive">錯誤: {error}</p>
        <Button onclick={goBack} class="mt-4">返回</Button>
      </div>
    {:else if warranty}
      <div class="space-y-8">
        <!-- 頁面標題 -->
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold">保固詳細資料</h1>
            <p class="font-mono text-sm text-muted-foreground">
              ID: {warranty.id}
            </p>
          </div>
          <div class="flex items-center gap-4">
            <div
              class={`rounded-full px-4 py-1.5 text-base font-medium ${getStatusClass(
                warranty.status
              )}`}
            >
              {warranty.status === "active"
                ? "有效"
                : warranty.status === "expired"
                  ? "過期"
                  : "取消"}
            </div>
            <Button variant="secondary" size="sm" onclick={openEditDialog}>
              <Edit class="mr-2 h-4 w-4" />
              編輯
            </Button>
          </div>
        </div>

        <!-- 患者資訊 -->
        <div class="rounded-lg border bg-white p-6 shadow-sm">
          <h2 class="mb-4 flex items-center text-xl font-semibold">
            <User class="mr-3 h-5 w-5 text-primary" />
            患者資訊
          </h2>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p class="text-sm text-muted-foreground">姓名</p>
              <p class="font-medium">{warranty.patient_name}</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">身分證字號</p>
              <p class="font-mono">{warranty.patient_id}</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">出生年月日</p>
              <p class="font-medium">
                {formatDate(warranty.patient_birth_date)}
              </p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">聯絡電話</p>
              <p class="font-medium">{warranty.patient_phone}</p>
            </div>
            <div class="md:col-span-2">
              <p class="text-sm text-muted-foreground">電子郵件</p>
              <p class="font-medium">{warranty.patient_email}</p>
            </div>
          </div>
        </div>

        <!-- 手術與產品資訊 -->
        <div class="grid gap-8 md:grid-cols-2">
          <div class="rounded-lg border bg-white p-6 shadow-sm">
            <h2 class="mb-4 flex items-center text-xl font-semibold">
              <Building class="mr-3 h-5 w-5 text-primary" />
              手術資訊
            </h2>
            <div class="space-y-4">
              <div>
                <p class="text-sm text-muted-foreground">醫院名稱</p>
                <p class="font-medium">{warranty.hospital_name}</p>
              </div>
              <div>
                <p class="text-sm text-muted-foreground">醫師姓名</p>
                <p class="font-medium">{warranty.doctor_name}</p>
              </div>
              <div>
                <p class="text-sm text-muted-foreground">手術日期</p>
                <p class="font-medium">{formatDate(warranty.surgery_date)}</p>
              </div>
            </div>
          </div>
          <div class="rounded-lg border bg-white p-6 shadow-sm">
            <h2 class="mb-4 flex items-center text-xl font-semibold">
              <Package class="mr-3 h-5 w-5 text-primary" />
              產品資訊
            </h2>
            <div class="space-y-4">
              <div>
                <p class="text-sm text-muted-foreground">型號</p>
                <p class="font-medium">
                  {warranty.brand}
                  {warranty.type}
                  {warranty.model_number}
                  {warranty.size}
                </p>
              </div>
              <div>
                <p class="text-sm text-muted-foreground">產品序號</p>
                <div class="space-y-1">
                  <p class="font-mono">{warranty.product_serial_number}</p>
                  {#if warranty.product_serial_number_2}
                    <p class="font-mono text-muted-foreground">
                      第二個序號: {warranty.product_serial_number_2}
                    </p>
                  {/if}
                </div>
              </div>
              <div>
                <p class="text-sm text-muted-foreground">保固類型</p>
                <p class="font-medium">
                  {#if warranty.warranty_years === 0}
                    <span class="font-semibold text-green-600">終身保固</span>
                  {:else}
                    {warranty.warranty_years} 年保固
                  {/if}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- 保固期限 -->
        <div class="rounded-lg border bg-white p-6 shadow-sm">
          <h2 class="mb-4 flex items-center text-xl font-semibold">
            <ShieldCheck class="mr-3 h-5 w-5 text-primary" />
            保固期限
          </h2>
          <div class="flex items-center justify-around text-center">
            <div>
              <p class="text-sm text-muted-foreground">保固起始日</p>
              <p class="text-lg font-medium">
                {formatDate(warranty.warranty_start_date)}
              </p>
            </div>
            <ArrowRight class="h-6 w-6 text-muted-foreground" />
            <div>
              <p class="text-sm text-muted-foreground">保固到期日</p>
              <p class="text-lg font-medium text-primary">
                {#if warranty.warranty_years === 0}
                  <span class="font-semibold text-green-600">終身保固</span>
                {:else}
                  {formatDate(warranty.warranty_end_date)}
                {/if}
              </p>
            </div>
          </div>
        </div>

        <!-- 按鈕區塊 -->
        <div class="flex items-center justify-between pt-8">
          <!-- 左側返回按鈕 -->
          <Button variant="default" onclick={goBack}>
            <ArrowLeft class="mr-2 h-4 w-4" />
            返回列表
          </Button>

          <!-- 右側操作按鈕 - 只有有效保固才顯示重寄按鈕 -->
          {#if warranty.status === "active"}
            <Button
              variant="outline"
              onclick={resendConfirmationEmail}
              disabled={isResendingEmail}
            >
              {#if isResendingEmail}
                <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                寄送中...
              {:else}
                <Mail class="mr-2 h-4 w-4" />
                重寄保固信
              {/if}
            </Button>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>

<!-- 編輯保固 Dialog (pasted from list page) -->
<Dialog
  isOpen={isEditDialogOpen}
  title="編輯保固資料"
  onClose={closeEditDialog}
>
  {#if editingWarranty}
    <div class="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div class="grid grid-cols-2 gap-4">
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
      </div>

      <div class="grid grid-cols-2 gap-4">
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
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <Label for="edit_hospital_name">醫院名稱</Label>
          <Input
            id="edit_hospital_name"
            bind:value={editingWarranty.hospital_name}
            placeholder="醫院名稱"
          />
        </div>
        <div>
          <Label for="edit_doctor_name">醫師姓名</Label>
          <Input
            id="edit_doctor_name"
            bind:value={editingWarranty.doctor_name}
            placeholder="醫師姓名"
          />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <Label for="edit_surgery_date">手術日期</Label>
          <Input
            id="edit_surgery_date"
            type="date"
            bind:value={editingWarranty.surgery_date}
          />
        </div>
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
      </div>

      <div class="grid grid-cols-2 gap-4">
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

      <div class="flex justify-end gap-2 pt-4">
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
