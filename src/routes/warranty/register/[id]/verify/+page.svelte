<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { apiService } from "$lib/api";
  import Button from "$components/ui/Button.svelte";
  import Input from "$components/ui/Input.svelte";
  import Label from "$components/ui/Label.svelte";
  import PatientProductFilter from "$components/PatientProductFilter.svelte";
  import { Loader2, CheckCircle, AlertCircle } from "lucide-svelte";

  let warrantyId = "";
  let isLoading = false;
  let error: string | null = null;

  // 表單資料
  let formData = {
    product_id: "",
    product_serial_number: "",
    product_serial_number_2: "",
    surgery_date: "",
  };

  // 產品過濾器狀態
  let patientFilters = {
    brand: "Mentor",
    category: "",
    subcategory: "",
    size: "",
  };

  // 序號檢查狀態
  let serial1 = {
    isChecking: false,
    exists: false,
    formatError: null as string | null,
  };
  let serial2 = {
    isChecking: false,
    exists: false,
    formatError: null as string | null,
  };

  // 獲取最大日期（今天）
  function getMaxDate(): string {
    const today = new Date();
    return today.toISOString().split("T")[0];
  }

  // 產品過濾器更新函數
  async function updatePatientFilters(newFilters: any) {
    patientFilters = { ...newFilters };

    // 如果所有必要欄位都有值，嘗試獲取產品 ID
    if (newFilters.category && newFilters.subcategory && newFilters.size) {
      try {
        const params = new URLSearchParams();
        params.set("brand", newFilters.brand);
        params.set("type", newFilters.category + "-" + newFilters.subcategory);
        params.set("size", newFilters.size);

        const response = await apiService.getProductByCondition(params);
        if (response.data) {
          formData.product_id = response.data.id;
        }
      } catch (e) {
        console.error("獲取產品 ID 失敗:", e);
      }
    }
  }

  // 序號檢查函數
  function checkSerialNumber(serialNumber: string, isSecondSerial: boolean) {
    if (!serialNumber.trim()) {
      if (isSecondSerial) {
        serial2 = { isChecking: false, exists: false, formatError: null };
      } else {
        serial1 = { isChecking: false, exists: false, formatError: null };
      }
      return;
    }

    // 檢查兩個序號是否相同
    if (isSecondSerial && serialNumber === formData.product_serial_number) {
      serial2 = {
        isChecking: false,
        exists: true,
        formatError: "兩個序號不能相同",
      };
      return;
    }

    // 驗證序號格式：7個數字 + dash + 3個數字 (例：1234567-123)
    const serialFormat = /^\d{7}-\d{3}$/;
    if (!serialFormat.test(serialNumber)) {
      const formatError =
        "序號格式不正確，正確格式為：1234567-123 (7個數字-3個數字)";
      if (isSecondSerial) {
        serial2 = { isChecking: false, exists: false, formatError };
      } else {
        serial1 = { isChecking: false, exists: false, formatError };
      }
      return;
    }

    // 設置檢查狀態
    if (isSecondSerial) {
      serial2 = { ...serial2, isChecking: true, formatError: null };
    } else {
      serial1 = { ...serial1, isChecking: true, formatError: null };
    }

    // 調用 API 進行序號檢查
    apiService
      .checkSerialNumber(serialNumber, warrantyId)
      .then(() => {
        // 檢查完成後更新狀態
        if (isSecondSerial) {
          serial2 = { isChecking: false, exists: false, formatError: null };
        } else {
          serial1 = { isChecking: false, exists: false, formatError: null };
        }
      })
      .catch((e: any) => {
        console.error("序號檢查失敗:", e.message);
        if (isSecondSerial) {
          serial2 = {
            isChecking: false,
            exists: true,
            formatError: "無法使用的序號，請聯繫您的手術診所。",
          };
        } else {
          serial1 = {
            isChecking: false,
            exists: true,
            formatError: "無法使用的序號，請聯繫您的手術診所。",
          };
        }
      });
  }

  // 表單驗證
  function validateForm(): boolean {
    if (!formData.product_id.trim()) {
      error = "請選擇產品";
      return false;
    }
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
        product_id: formData.product_id,
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
      <p class="text-center text-gray-600 mb-6">請選擇產品並輸入序號進行驗證</p>

      <form class="space-y-6">
        <!-- 產品選擇器 -->
        <div
          class="space-y-4 p-4 border border-white/30 rounded-lg bg-white/30 backdrop-blur-sm"
        >
          <h2 class="text-lg font-semibold text-gray-900">產品資訊</h2>

          <div class="grid gap-2">
            <Label for="product_id">選擇產品</Label>
            <PatientProductFilter
              {patientFilters}
              presetBrand="Mentor"
              onFiltersChange={updatePatientFilters}
            />
          </div>
        </div>

        <!-- 序號輸入 -->
        <div
          class="space-y-4 p-4 border border-white/30 rounded-lg bg-white/30 backdrop-blur-sm"
        >
          <h2 class="text-lg font-semibold text-gray-900">序號驗證</h2>

          <div class="grid gap-4">
            <div class="grid gap-2">
              <Label for="product_serial_number">
                第一個植入體序號 <span class="text-red-500">*</span>
              </Label>
              <div class="relative">
                <Input
                  id="product_serial_number"
                  value={formData.product_serial_number}
                  placeholder="格式：1234567-123"
                  required
                  on:input={(e) =>
                    (formData.product_serial_number = (
                      e.target as HTMLInputElement
                    ).value)}
                  on:blur={() =>
                    checkSerialNumber(
                      formData.product_serial_number || "",
                      false
                    )}
                  class={serial1.exists || serial1.formatError
                    ? "border-red-500 focus-visible:ring-red-500"
                    : ""}
                />
                {#if serial1.isChecking}
                  <div
                    class="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <Loader2 class="h-4 w-4 animate-spin text-gray-500" />
                  </div>
                {/if}
              </div>
              {#if serial1.formatError}
                <p class="text-sm text-red-500">{serial1.formatError}</p>
              {:else if serial1.exists}
                <p class="text-sm text-red-500">此序號已被註冊，請檢查輸入</p>
              {/if}
            </div>

            <div class="grid gap-2">
              <Label for="product_serial_number_2">
                第二個植入體序號 <span class="text-gray-500 text-sm"
                  >（選填）</span
                >
              </Label>
              <div class="relative">
                <Input
                  id="product_serial_number_2"
                  value={formData.product_serial_number_2 || ""}
                  placeholder="格式：1234567-123"
                  on:input={(e) =>
                    (formData.product_serial_number_2 = (
                      e.target as HTMLInputElement
                    ).value)}
                  on:blur={() =>
                    checkSerialNumber(
                      formData.product_serial_number_2 || "",
                      true
                    )}
                  class={serial2.exists || serial2.formatError
                    ? "border-red-500 focus-visible:ring-red-500"
                    : ""}
                />
                {#if serial2.isChecking}
                  <div
                    class="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <Loader2 class="h-4 w-4 animate-spin text-gray-500" />
                  </div>
                {/if}
              </div>
              {#if serial2.formatError}
                <p class="text-sm text-red-500">{serial2.formatError}</p>
              {:else if serial2.exists}
                <p class="text-sm text-red-500">此序號已被註冊，請檢查輸入</p>
              {/if}
            </div>
          </div>
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
