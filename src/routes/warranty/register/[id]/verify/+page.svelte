<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { apiService, type Product } from "$lib/api";
  import Button from "$components/ui/Button.svelte";
  import Input from "$components/ui/Input.svelte";
  import Label from "$components/ui/Label.svelte";
  import { Loader2, CheckCircle } from "lucide-svelte";
  import SerialInput from "$components/SerialInput.svelte";

  let warrantyId = "";
  let isLoading = false;
  let error: string | null = null;

  // 表單資料
  let formData = {
    product_serial_number: "",
    product_serial_number_2: "",
    surgery_date: "",
  };

  // 序號檢查狀態
  let serial1 = {
    isChecking: false,
    exists: false,
    formatError: null as string | null,
    product_id: "",
    product_info: null as Product | null,
  };
  let serial2 = {
    isChecking: false,
    exists: false,
    formatError: null as string | null,
    product_id: "",
    product_info: null as Product | null,
  };

  // 獲取最大日期（今天）
  function getMaxDate(): string {
    const today = new Date();
    return today.toISOString().split("T")[0];
  }

  // 表單驗證
  function validateForm(): boolean {
    if (!formData.product_serial_number.trim()) {
      error = "請輸入第一個序號";
      return false;
    }
    if (serial1.formatError || serial1.exists) {
      error = "第一個序號有問題，請檢查";
      return false;
    }
    if (formData.product_serial_number_2.trim()) {
      if (serial2.formatError || serial2.exists) {
        error = "第二個序號有問題，請檢查";
        return false;
      }
    }
    if (!formData.surgery_date) {
      error = "請選擇手術日期";
      return false;
    }
    return true;
  }

  // 提交驗證
  async function submitVerification() {
    if (!validateForm()) {
      return;
    }

    isLoading = true;
    error = null;

    try {
      const submitData = {
        product_serial_number: formData.product_serial_number,
        product_serial_number_2: formData.product_serial_number_2 || undefined,
        surgery_date: formData.surgery_date,
      };

      const response = await apiService.verifySerial(warrantyId, submitData);

      // 檢查回應狀態
      if (response.data) {
        // 有保固，跳轉到填寫資訊頁面
        goto(`/warranty/register/${warrantyId}/info`);
      } else {
        // 沒有保固，跳轉到正貨已驗證頁面
        goto(`/warranty/register/${warrantyId}/verified`);
      }
    } catch (e: any) {
      error = e.message || "驗證失敗，請稍後再試";
    } finally {
      isLoading = false;
    }
  }

  // 使用 onMount 來初始化
  onMount(async () => {
    warrantyId = $page.params.id;

    // 檢查當前步驟，如果不是步驟 0，則跳轉到對應頁面
    try {
      const response = await apiService.getWarrantyStep(warrantyId);
      if (response.data) {
        const currentStep = response.data.step;
        if (currentStep !== 0) {
          // 根據步驟跳轉到對應頁面
          if (currentStep === 1 || currentStep === 2) {
            goto(`/warranty/register/${warrantyId}/info`);
          } else if (currentStep === 3) {
            goto(`/warranty/register/${warrantyId}/success`);
          } else if (currentStep === 9) {
            goto(`/warranty/register/${warrantyId}/verified`);
          }
          return;
        }
      }
    } catch (e: any) {
      console.error("檢查步驟失敗:", e);
      // 如果檢查失敗，繼續顯示驗證頁面
    }

    // 設置預設手術日期為今天
    formData.surgery_date = new Date().toISOString().split("T")[0];
  });
</script>

<svelte:head>
  <title>驗證</title>
</svelte:head>

<div class="container mx-auto max-w-3xl py-8 px-4">
  <div
    class="bg-white/60 backdrop-blur-md rounded-xl shadow-2xl border border-white/20"
  >
    <div class="p-8">
      <h1 class="text-3xl font-bold mb-6 text-center text-gray-800">
        驗證產品序號
      </h1>
      <p class="text-center text-gray-600 mb-6">請輸入序號進行驗證</p>

      <form class="space-y-6">
        <!-- 序號輸入 -->
        <div
          class="space-y-4 p-4 border border-white/30 rounded-lg bg-white/30 backdrop-blur-sm"
        >
          <h2 class="text-lg font-semibold text-gray-900">序號驗證</h2>
          <SerialInput
            {serial1}
            {serial2}
            formSerial1={formData.product_serial_number}
            formSerial2={formData.product_serial_number_2}
            {warrantyId}
            onUpdate={(s1, s2) => {
              formData.product_serial_number = s1 || "";
              formData.product_serial_number_2 = s2 || "";
            }}
          />
        </div>

        <!-- 手術日期 -->
        <div
          class="space-y-4 p-4 border border-white/30 rounded-lg bg-white/30 backdrop-blur-sm"
        >
          <h2 class="text-lg font-semibold text-gray-900">手術資訊</h2>

          <div class="grid gap-2">
            <Label for="surgery_date">
              手術日期 <span class="text-red-500">*</span>
            </Label>
            <Input
              id="surgery_date"
              type="date"
              value={formData.surgery_date}
              max={getMaxDate()}
              required
              on:input={(e) =>
                (formData.surgery_date = (e.target as HTMLInputElement).value)}
            />
          </div>
        </div>

        <!-- 錯誤訊息 -->
        {#if error}
          <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-sm text-red-600">{error}</p>
          </div>
        {/if}

        <!-- 提交按鈕 -->
        <div class="flex justify-center">
          <Button
            type="button"
            disabled={isLoading}
            onclick={submitVerification}
          >
            {#if isLoading}
              <Loader2 class="mr-2 h-4 w-4 animate-spin" />
              驗證中...
            {:else}
              <CheckCircle class="mr-2 h-4 w-4" />
              驗證序號
            {/if}
          </Button>
        </div>
      </form>
    </div>
  </div>
</div>
