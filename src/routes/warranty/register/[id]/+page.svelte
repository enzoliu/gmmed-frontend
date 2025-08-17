<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { apiService } from "$lib/api";
  import Button from "$components/ui/Button.svelte";
  import Input from "$components/ui/Input.svelte";
  import Label from "$components/ui/Label.svelte";
  import PatientProductFilter from "$components/PatientProductFilter.svelte";
  import { notificationStore } from "$stores/notifications";
  import { Send, Loader2, CheckCircle, AlertCircle } from "lucide-svelte";

  let isInitialized = false;
  let warrantyId = "";
  let statusCheckResult: any = null;
  let statusError: string | null = null;

  // 使用本地狀態，完全不依賴 store
  let formData = {
    product_id: "",
    product_serial_number: "",
    product_serial_number_2: "",
    patient_name: "",
    is_local_identity: true,
    patient_id: "",
    patient_birth_date: "",
    patient_phone: "",
    patient_email: "",
    hospital_name: "",
    doctor_name: "",
    surgery_date: "",
  };

  // 產品過濾器狀態
  let patientFilters = {
    brand: "Mentor",
    category: "",
    subcategory: "",
    size: "",
  };

  let isLoading = false;
  let error: string | null = null;
  let canSubmit = false;

  // 驗證錯誤狀態
  let validationErrors: Record<string, string> = {};

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

  // 簡單的更新函數
  function updateFormData(field: string, value: string) {
    formData = { ...formData, [field]: value };

    // 清除對應欄位的驗證錯誤
    if (validationErrors[field]) {
      const { [field]: _, ...rest } = validationErrors;
      validationErrors = rest;
    }

    // 簡單的驗證
    canSubmit =
      formData.product_id.trim() !== "" &&
      formData.product_serial_number.trim() !== "" &&
      formData.patient_name.trim() !== "" &&
      formData.is_local_identity &&
      formData.patient_id.trim() !== "" &&
      formData.patient_birth_date.trim() !== "" &&
      formData.patient_phone.trim() !== "" &&
      formData.patient_email.trim() !== "" &&
      formData.hospital_name.trim() !== "" &&
      formData.doctor_name.trim() !== "" &&
      formData.surgery_date.trim() !== "" &&
      !serial1.exists &&
      !serial2.exists &&
      !serial1.formatError &&
      !serial2.formatError;
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
          updateFormData("", "");
        }
      } catch (e) {
        console.error("獲取產品 ID 失敗:", e);
      }
    }

    updateFormData("", "");
  }

  // 獲取最大日期（今天）
  function getMaxDate(): string {
    const today = new Date();
    return today.toISOString().split("T")[0];
  }

  // 表單驗證
  function validateForm(): {
    isValid: boolean;
    errors: Record<string, string>;
  } {
    const errors: Record<string, string> = {};

    // 產品相關驗證
    if (!formData.product_id.trim()) {
      errors.product_id = "請選擇產品";
    }
    if (!formData.product_serial_number.trim()) {
      errors.product_serial_number = "請輸入序號";
    } else if (serial1.formatError) {
      errors.product_serial_number = serial1.formatError;
    } else if (serial1.exists) {
      errors.product_serial_number = "此序號已被註冊，請檢查輸入";
    }
    if (formData.product_serial_number_2.trim()) {
      if (!formData.product_serial_number_2.trim()) {
        errors.product_serial_number_2 = "請輸入第二個序號";
      } else if (serial2.formatError) {
        errors.product_serial_number_2 = serial2.formatError;
      } else if (serial2.exists) {
        errors.product_serial_number_2 = "此序號已被註冊，請檢查輸入";
      }
    }

    // 患者資訊驗證
    if (!formData.patient_name.trim()) {
      errors.patient_name = "請輸入患者姓名";
    }
    if (!formData.patient_id.trim()) {
      errors.patient_id = "請輸入身分證號";
    } else if (formData.is_local_identity) {
      // 本國籍身分證驗證
      if (!/^[A-Z][12]\d{8}$/.test(formData.patient_id.trim())) {
        errors.patient_id = "身分證號格式不正確";
      }
    } else {
      // 非本國籍護照驗證（至少6位字符）
      if (formData.patient_id.trim().length < 6) {
        errors.patient_id = "護照號碼至少需要6位字符";
      }
    }
    if (!formData.patient_birth_date) {
      errors.patient_birth_date = "請選擇出生日期";
    }
    if (!formData.patient_phone.trim()) {
      errors.patient_phone = "請輸入聯絡電話";
    } else if (!/^09\d{8}$/.test(formData.patient_phone.trim())) {
      errors.patient_phone = "手機號碼格式不正確";
    }
    if (!formData.patient_email.trim()) {
      errors.patient_email = "請輸入電子郵件";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.patient_email.trim())
    ) {
      errors.patient_email = "電子郵件格式不正確";
    }

    // 手術資訊驗證
    if (!formData.hospital_name.trim()) {
      errors.hospital_name = "請輸入手術醫院";
    }
    if (!formData.doctor_name.trim()) {
      errors.doctor_name = "請輸入執刀醫師";
    }
    if (!formData.surgery_date) {
      errors.surgery_date = "請選擇手術日期";
    }

    // 序號重複檢查
    if (
      formData.product_serial_number_2.trim() &&
      formData.product_serial_number === formData.product_serial_number_2
    ) {
      errors.product_serial_number_2 = "兩個序號不能相同";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  // 表單提交
  async function submitForm() {
    const validation = validateForm();
    if (!validation.isValid) {
      validationErrors = validation.errors;
      error = "請檢查表單錯誤";
      return;
    }

    if (!warrantyId) {
      error = "系統錯誤：缺少保固 ID";
      return;
    }

    isLoading = true;
    error = null;
    validationErrors = {};

    try {
      const submitData = {
        product_id: formData.product_id,
        product_serial_number: formData.product_serial_number,
        product_serial_number_2: formData.product_serial_number_2 || undefined,
        patient_name: formData.patient_name,
        is_local_identity: formData.is_local_identity,
        patient_id: formData.patient_id,
        patient_birth_date: formData.patient_birth_date,
        patient_phone: formData.patient_phone,
        patient_email: formData.patient_email,
        hospital_name: formData.hospital_name,
        doctor_name: formData.doctor_name,
        surgery_date: formData.surgery_date,
      };

      await apiService.fillWarranty(warrantyId, submitData);

      // 使用 notificationStore
      notificationStore.success("保固註冊成功！確認信件將發送至您的電子信箱。");

      error = null;

      // 更新狀態，防止重複編輯
      if (statusCheckResult) {
        statusCheckResult = { ...statusCheckResult, can_edit: false };
      }
    } catch (e: any) {
      error = e.message || "註冊失敗，請稍後再試";
    } finally {
      isLoading = false;
    }
  }

  // 序號檢查函數
  function checkSerialNumber(serialNumber: string, isSecondSerial: boolean) {
    console.log("檢查序號:", {
      serialNumber,
      isSecondSerial,
      warrantyId: warrantyId,
    });

    if (!serialNumber.trim()) {
      if (isSecondSerial) {
        serial2 = { isChecking: false, exists: false, formatError: null };
      } else {
        serial1 = { isChecking: false, exists: false, formatError: null };
      }
      updateFormData("", "");
      return;
    }

    // 檢查兩個序號是否相同
    if (isSecondSerial && serialNumber === formData.product_serial_number) {
      serial2 = {
        isChecking: false,
        exists: true,
        formatError: "兩個序號不能相同",
      };
      updateFormData("", "");
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
      updateFormData("", "");
      return;
    }

    // 設置檢查狀態
    if (isSecondSerial) {
      serial2 = { ...serial2, isChecking: true, formatError: null };
    } else {
      serial1 = { ...serial1, isChecking: true, formatError: null };
    }
    updateFormData("", "");

    // 調用真實的 API 進行序號檢查
    if (!warrantyId) {
      console.error("warrantyId 未定義:", warrantyId);
      if (isSecondSerial) {
        serial2 = {
          isChecking: false,
          exists: false,
          formatError: "系統錯誤：缺少保固 ID",
        };
      } else {
        serial1 = {
          isChecking: false,
          exists: false,
          formatError: "系統錯誤：缺少保固 ID",
        };
      }
      updateFormData("", "");
      return;
    }

    apiService
      .checkSerialNumber(serialNumber, warrantyId)
      .then(() => {
        // 檢查完成後更新狀態
        if (isSecondSerial) {
          serial2 = { isChecking: false, exists: false, formatError: null };
        } else {
          serial1 = { isChecking: false, exists: false, formatError: null };
        }
        updateFormData("", "");
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
        updateFormData("", "");
      });
  }

  // 重置所有狀態
  function resetForm() {
    formData = {
      product_id: "",
      product_serial_number: "",
      product_serial_number_2: "",
      patient_name: "",
      is_local_identity: true,
      patient_id: "",
      patient_birth_date: "",
      patient_phone: "",
      patient_email: "",
      hospital_name: "",
      doctor_name: "",
      surgery_date: "",
    };

    patientFilters = {
      brand: "Mentor",
      category: "",
      subcategory: "",
      size: "",
    };

    isLoading = false;
    error = null;
    validationErrors = {};
    canSubmit = false;

    serial1 = { isChecking: false, exists: false, formatError: null };
    serial2 = { isChecking: false, exists: false, formatError: null };
  }

  // 使用 onMount 來初始化
  onMount(async () => {
    console.log("onMount 執行");

    // 從 URL 參數獲取 warrantyId
    warrantyId = $page.params.id;
    console.log("從 URL 獲取的 warrantyId:", warrantyId);

    // 檢查保固狀態
    try {
      const response = await apiService.checkWarrantyStatus(warrantyId);
      if (response.data) {
        statusCheckResult = response.data;
      } else {
        statusError = response.error || "無法檢查保固狀態";
      }
    } catch (e: any) {
      statusError = "檢查保固狀態時發生錯誤: " + e.message;
    }

    isInitialized = true;

    // 設置預設值
    formData.patient_birth_date = new Date(
      Date.now() - 18 * 365 * 24 * 60 * 60 * 1000
    )
      .toISOString()
      .split("T")[0];
    formData.surgery_date = new Date().toISOString().split("T")[0];

    // 初始化驗證狀態
    updateFormData("", "");
  });
</script>

<svelte:head>
  <title>保固註冊</title>
</svelte:head>

<!-- 內容容器 -->
<div class="container mx-auto max-w-3xl py-8 px-4">
  {#if statusCheckResult && !statusCheckResult.can_edit}
    <!-- 已填寫完成狀態 -->
    <div
      class="bg-white/60 backdrop-blur-md rounded-xl shadow-2xl border border-white/20"
    >
      <div class="p-8 text-center">
        <CheckCircle class="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h1 class="text-2xl font-bold mb-4 text-gray-800">保固已填寫完成</h1>
        <p class="text-gray-600 mb-6">您的保固已填寫完成。</p>
      </div>
    </div>
  {:else if statusError}
    <!-- 錯誤狀態 -->
    <div
      class="bg-white/60 backdrop-blur-md rounded-xl shadow-2xl border border-white/20"
    >
      <div class="p-8 text-center">
        <AlertCircle class="h-16 w-16 text-red-600 mx-auto mb-4" />
        <h1 class="text-2xl font-bold mb-4 text-gray-800">發生錯誤</h1>
        <p class="text-gray-600 mb-6">{statusError}</p>
        <Button onclick={() => goto("/")}>返回首頁</Button>
      </div>
    </div>
  {:else}
    <!-- 簡化的保固填寫表單 -->
    <div
      class="bg-white/60 backdrop-blur-md rounded-xl shadow-2xl border border-white/20"
    >
      <div class="p-8">
        <h1 class="text-3xl font-bold mb-6 text-center text-gray-800">
          乳房植入物保固註冊
        </h1>
        <p class="text-center text-gray-600 mb-6">請填寫以下資訊完成保固註冊</p>

        <form class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- 序號 -->
          <div
            class="col-span-1 md:col-span-2 space-y-4 p-4 border border-white/30 rounded-lg bg-white/30 backdrop-blur-sm"
          >
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              產品資訊
            </h2>

            <!-- 產品選擇器 -->
            <div class="grid gap-2">
              <Label for="product_id">選擇產品</Label>
              <PatientProductFilter
                {patientFilters}
                presetBrand="Mentor"
                onFiltersChange={updatePatientFilters}
              />
            </div>

            <div class="grid gap-2">
              <Label for="product_serial_number"
                >第一個植入體序號 <span class="text-red-500">*</span></Label
              >
              <div class="relative">
                <Input
                  id="product_serial_number"
                  value={formData.product_serial_number}
                  placeholder="格式：1234567-123"
                  required
                  on:input={(e) =>
                    updateFormData(
                      "product_serial_number",
                      (e.target as HTMLInputElement).value
                    )}
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
                <p class="text-sm text-red-500">
                  {serial1.formatError}
                </p>
              {:else if serial1.exists}
                <p class="text-sm text-red-500">此序號已被註冊，請檢查輸入</p>
              {/if}
              {#if validationErrors.product_serial_number}
                <p class="text-sm text-red-500">
                  {validationErrors.product_serial_number}
                </p>
              {/if}
            </div>

            <div class="grid gap-2">
              <Label for="product_serial_number_2"
                >第二個植入體序號 <span class="text-gray-500 text-sm"
                  >（選填）</span
                ></Label
              >
              <div class="relative">
                <Input
                  id="product_serial_number_2"
                  value={formData.product_serial_number_2 || ""}
                  placeholder="格式：1234567-123"
                  on:input={(e) =>
                    updateFormData(
                      "product_serial_number_2",
                      (e.target as HTMLInputElement).value
                    )}
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
                <p class="text-sm text-red-500">
                  {serial2.formatError}
                </p>
              {:else if serial2.exists}
                <p class="text-sm text-red-500">此序號已被註冊，請檢查輸入</p>
              {/if}
              {#if validationErrors.product_serial_number_2}
                <p class="text-sm text-red-500">
                  {validationErrors.product_serial_number_2}
                </p>
              {/if}
            </div>
          </div>

          <!-- 患者資訊 -->
          <div
            class="col-span-1 md:col-span-2 space-y-4 p-4 border border-white/30 rounded-lg bg-white/30 backdrop-blur-sm"
          >
            <h2
              class="text-xl font-semibold border-b border-white/30 pb-2 text-gray-800"
            >
              患者資訊
            </h2>
            <div class="grid md:grid-cols-2 gap-4">
              <div class="grid gap-2">
                <Label for="patient_name" class="mb-1"
                  >患者姓名 <span class="text-red-500">*</span></Label
                >
                <Input
                  id="patient_name"
                  value={formData.patient_name}
                  required
                  on:input={(e) =>
                    updateFormData(
                      "patient_name",
                      (e.target as HTMLInputElement).value
                    )}
                />
                {#if validationErrors.patient_name}
                  <p class="text-sm text-red-500">
                    {validationErrors.patient_name}
                  </p>
                {/if}
              </div>

              <div class="grid gap-2">
                <!-- 身分證類型選擇器 -->
                <div class="flex justify-between items-center">
                  <Label for="patient_id"
                    >身分證/護照 <span class="text-red-500">*</span></Label
                  >
                  <div class="flex items-center gap-2">
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="identity_type"
                        value="true"
                        checked={formData.is_local_identity}
                        on:change={() => {
                          formData.is_local_identity = true;
                          updateFormData("", "");
                        }}
                        class="w-4 h-4 text-primary focus:ring-primary border-gray-300 cursor-pointer"
                      />
                      <span class="text-sm font-medium text-gray-700"
                        >身分證</span
                      >
                    </label>
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="identity_type"
                        value="false"
                        checked={!formData.is_local_identity}
                        on:change={() => {
                          formData.is_local_identity = false;
                          updateFormData("", "");
                        }}
                        class="w-4 h-4 text-primary focus:ring-primary border-gray-300 cursor-pointer"
                      />
                      <span class="text-sm font-medium text-gray-700">護照</span
                      >
                    </label>
                  </div>
                </div>

                <Input
                  id="patient_id"
                  value={formData.patient_id}
                  placeholder={formData.is_local_identity
                    ? "格式：A123456789"
                    : "請輸入護照號碼"}
                  required
                  on:input={(e) =>
                    updateFormData(
                      "patient_id",
                      (e.target as HTMLInputElement).value
                    )}
                />
                {#if validationErrors.patient_id}
                  <p class="text-sm text-red-500">
                    {validationErrors.patient_id}
                  </p>
                {/if}
              </div>
            </div>

            <div class="grid gap-2">
              <Label for="patient_birth_date"
                >出生年月日 <span class="text-red-500">*</span></Label
              >
              <Input
                id="patient_birth_date"
                type="date"
                value={formData.patient_birth_date}
                max={getMaxDate()}
                required
                on:input={(e) =>
                  updateFormData(
                    "patient_birth_date",
                    (e.target as HTMLInputElement).value
                  )}
              />
            </div>

            <div class="grid md:grid-cols-2 gap-4">
              <div class="grid gap-2">
                <Label for="patient_phone"
                  >聯絡電話 <span class="text-red-500">*</span></Label
                >
                <Input
                  id="patient_phone"
                  value={formData.patient_phone}
                  type="tel"
                  required
                  on:input={(e) =>
                    updateFormData(
                      "patient_phone",
                      (e.target as HTMLInputElement).value
                    )}
                />
              </div>

              <div class="grid gap-2">
                <Label for="patient_email"
                  >電子郵件 <span class="text-red-500">*</span></Label
                >
                <Input
                  id="patient_email"
                  value={formData.patient_email}
                  type="email"
                  required
                  on:input={(e) =>
                    updateFormData(
                      "patient_email",
                      (e.target as HTMLInputElement).value
                    )}
                />
              </div>
            </div>
          </div>

          <!-- 手術資訊 -->
          <div
            class="col-span-1 md:col-span-2 space-y-4 p-4 border border-white/30 rounded-lg bg-white/30 backdrop-blur-sm"
          >
            <h2
              class="text-xl font-semibold border-b border-white/30 pb-2 text-gray-800"
            >
              手術資訊
            </h2>
            <div class="grid md:grid-cols-2 gap-4">
              <div class="grid gap-2">
                <Label for="hospital_name"
                  >手術醫院 <span class="text-red-500">*</span></Label
                >
                <Input
                  id="hospital_name"
                  value={formData.hospital_name}
                  required
                  on:input={(e) =>
                    updateFormData(
                      "hospital_name",
                      (e.target as HTMLInputElement).value
                    )}
                />
              </div>

              <div class="grid gap-2">
                <Label for="doctor_name"
                  >執刀醫師 <span class="text-red-500">*</span></Label
                >
                <Input
                  id="doctor_name"
                  value={formData.doctor_name}
                  required
                  on:input={(e) =>
                    updateFormData(
                      "doctor_name",
                      (e.target as HTMLInputElement).value
                    )}
                />
              </div>
            </div>
            <div class="grid gap-2">
              <Label for="surgery_date"
                >手術日期 <span class="text-red-500">*</span></Label
              >
              <Input
                id="surgery_date"
                type="date"
                value={formData.surgery_date}
                max={getMaxDate()}
                required
                on:input={(e) =>
                  updateFormData(
                    "surgery_date",
                    (e.target as HTMLInputElement).value
                  )}
              />
            </div>
          </div>

          <!-- Form Actions -->
          <div
            class="col-span-1 md:col-span-2 flex justify-center items-center mt-4"
          >
            {#if error}
              <p class="text-sm text-red-500 mr-4">{error}</p>
            {/if}
            <Button
              type="button"
              disabled={isLoading || !canSubmit}
              onclick={() => submitForm()}
            >
              {#if isLoading}
                <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                處理中...
              {:else}
                <Send class="mr-2 h-4 w-4" />
                註冊保固
              {/if}
            </Button>
          </div>
        </form>
      </div>
    </div>
  {/if}
</div>
