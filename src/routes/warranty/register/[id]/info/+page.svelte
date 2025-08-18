<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { apiService } from "$lib/api";
  import Button from "$components/ui/Button.svelte";
  import Input from "$components/ui/Input.svelte";
  import Label from "$components/ui/Label.svelte";
  import { Loader2, User, Send } from "lucide-svelte";
  import { notificationStore } from "$stores/notifications";

  let warrantyId = "";
  let isLoading = false;
  let error: string | null = null;
  let isSubmitting = false;

  // 表單資料
  let formData = {
    patient_name: "",
    is_local_identity: true,
    patient_id: "",
    patient_birth_date: "",
    patient_phone: "",
    patient_email: "",
    hospital_name: "",
    doctor_name: "",
  };

  // 驗證錯誤狀態
  let validationErrors: Record<string, string> = {};

  // 獲取最大日期（今天）
  function getMaxDate(): string {
    const today = new Date();
    return today.toISOString().split("T")[0];
  }

  // 表單驗證
  function validateForm(): boolean {
    const errors: Record<string, string> = {};

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
    if (!formData.hospital_name.trim()) {
      errors.hospital_name = "請輸入手術醫院";
    }
    if (!formData.doctor_name.trim()) {
      errors.doctor_name = "請輸入執刀醫師";
    }

    validationErrors = errors;
    return Object.keys(errors).length === 0;
  }

  // 提交表單
  async function submitForm() {
    if (!validateForm()) {
      return;
    }

    isSubmitting = true;
    error = null;

    try {
      const submitData = {
        patient_name: formData.patient_name,
        is_local_identity: formData.is_local_identity,
        patient_id: formData.patient_id,
        patient_birth_date: formData.patient_birth_date,
        patient_phone: formData.patient_phone,
        patient_email: formData.patient_email,
        hospital_name: formData.hospital_name,
        doctor_name: formData.doctor_name,
      };

      await apiService.updateWarrantyInfo(warrantyId, submitData);

      // 將機敏資訊存儲到 localStorage，供第三頁使用
      const patientInfoToStore = {
        patient_id: formData.patient_id,
        patient_phone: formData.patient_phone,
        patient_email: formData.patient_email,
        is_local_identity: formData.is_local_identity,
      };
      localStorage.setItem(
        `warranty_${warrantyId}_patient_info`,
        JSON.stringify(patientInfoToStore)
      );

      // 成功後跳轉到確認頁面
      goto(`/warranty/register/${warrantyId}/confirm`);
    } catch (e: any) {
      error = e.message || "提交失敗，請稍後再試";
    } finally {
      isSubmitting = false;
    }
  }

  // 載入現有資訊
  async function loadExistingInfo() {
    try {
      const response = await apiService.getWarrantyInfo(warrantyId);
      if (response.data) {
        // 填入現有資訊（已移除機敏資訊）
        if (response.data.patient_name) {
          formData.patient_name = response.data.patient_name;
        }
        if (response.data.hospital_name) {
          formData.hospital_name = response.data.hospital_name;
        }
        if (response.data.doctor_name) {
          formData.doctor_name = response.data.doctor_name;
        }
        // 注意：身分證號、電話等機敏資訊不會從後端返回
      }
    } catch (e: any) {
      console.error("載入現有資訊失敗:", e);
      // 不顯示錯誤，因為這不是必需的
    }
  }

  // 使用 onMount 來初始化
  onMount(async () => {
    warrantyId = $page.params.id;

    // 檢查當前步驟，如果不是步驟 1 或 2，則跳轉到對應頁面
    try {
      const response = await apiService.getWarrantyStep(warrantyId);
      if (response.data) {
        const currentStep = response.data.step;
        if (currentStep !== 1 && currentStep !== 2) {
          // 根據步驟跳轉到對應頁面
          if (currentStep === 0) {
            goto(`/warranty/register/${warrantyId}/verify`);
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
      // 如果檢查失敗，繼續顯示資訊頁面
    }

    // 設置預設值
    formData.patient_birth_date = new Date(
      Date.now() - 18 * 365 * 24 * 60 * 60 * 1000
    )
      .toISOString()
      .split("T")[0];

    // 載入現有資訊
    await loadExistingInfo();
  });
</script>

<svelte:head>
  <title>保固註冊 - 填寫資訊</title>
</svelte:head>

<div class="container mx-auto max-w-3xl py-8 px-4">
  <div
    class="bg-white/60 backdrop-blur-md rounded-xl shadow-2xl border border-white/20"
  >
    <div class="p-8">
      <h1 class="text-3xl font-bold mb-6 text-center text-gray-800">
        保固註冊 - 第二步：填寫資訊
      </h1>
      <p class="text-center text-gray-600 mb-6">
        請填寫您的個人資訊和醫療院所資訊
      </p>

      <form class="space-y-6">
        <!-- 患者資訊 -->
        <div
          class="space-y-4 p-4 border border-white/30 rounded-lg bg-white/30 backdrop-blur-sm"
        >
          <h2
            class="text-xl font-semibold border-b border-white/30 pb-2 text-gray-800"
          >
            患者資訊
          </h2>

          <div class="grid md:grid-cols-2 gap-4">
            <div class="grid gap-2">
              <Label for="patient_name" class="mb-1">
                患者姓名 <span class="text-red-500">*</span>
              </Label>
              <Input
                id="patient_name"
                value={formData.patient_name}
                required
                on:input={(e) =>
                  (formData.patient_name = (
                    e.target as HTMLInputElement
                  ).value)}
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
                <Label for="patient_id">
                  身分證/護照 <span class="text-red-500">*</span>
                </Label>
                <div class="flex items-center gap-2">
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="identity_type"
                      value="true"
                      checked={formData.is_local_identity}
                      on:change={() => {
                        formData.is_local_identity = true;
                      }}
                      class="w-4 h-4 text-primary focus:ring-primary border-gray-300 cursor-pointer"
                    />
                    <span class="text-sm font-medium text-gray-700">身分證</span
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
                      }}
                      class="w-4 h-4 text-primary focus:ring-primary border-gray-300 cursor-pointer"
                    />
                    <span class="text-sm font-medium text-gray-700">護照</span>
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
                  (formData.patient_id = (e.target as HTMLInputElement).value)}
              />
              {#if validationErrors.patient_id}
                <p class="text-sm text-red-500">
                  {validationErrors.patient_id}
                </p>
              {/if}
            </div>
          </div>

          <div class="grid gap-2">
            <Label for="patient_birth_date">
              出生年月日 <span class="text-red-500">*</span>
            </Label>
            <Input
              id="patient_birth_date"
              type="date"
              value={formData.patient_birth_date}
              max={getMaxDate()}
              required
              on:input={(e) =>
                (formData.patient_birth_date = (
                  e.target as HTMLInputElement
                ).value)}
            />
            {#if validationErrors.patient_birth_date}
              <p class="text-sm text-red-500">
                {validationErrors.patient_birth_date}
              </p>
            {/if}
          </div>

          <div class="grid md:grid-cols-2 gap-4">
            <div class="grid gap-2">
              <Label for="patient_phone">
                聯絡電話 <span class="text-red-500">*</span>
              </Label>
              <Input
                id="patient_phone"
                value={formData.patient_phone}
                type="tel"
                required
                on:input={(e) =>
                  (formData.patient_phone = (
                    e.target as HTMLInputElement
                  ).value)}
              />
              {#if validationErrors.patient_phone}
                <p class="text-sm text-red-500">
                  {validationErrors.patient_phone}
                </p>
              {/if}
            </div>

            <div class="grid gap-2">
              <Label for="patient_email">
                電子郵件 <span class="text-red-500">*</span>
              </Label>
              <Input
                id="patient_email"
                value={formData.patient_email}
                type="email"
                required
                on:input={(e) =>
                  (formData.patient_email = (
                    e.target as HTMLInputElement
                  ).value)}
              />
              {#if validationErrors.patient_email}
                <p class="text-sm text-red-500">
                  {validationErrors.patient_email}
                </p>
              {/if}
            </div>
          </div>
        </div>

        <!-- 醫療院所資訊 -->
        <div
          class="space-y-4 p-4 border border-white/30 rounded-lg bg-white/30 backdrop-blur-sm"
        >
          <h2
            class="text-xl font-semibold border-b border-white/30 pb-2 text-gray-800"
          >
            醫療院所資訊
          </h2>

          <div class="grid md:grid-cols-2 gap-4">
            <div class="grid gap-2">
              <Label for="hospital_name">
                手術醫院 <span class="text-red-500">*</span>
              </Label>
              <Input
                id="hospital_name"
                value={formData.hospital_name}
                required
                on:input={(e) =>
                  (formData.hospital_name = (
                    e.target as HTMLInputElement
                  ).value)}
              />
              {#if validationErrors.hospital_name}
                <p class="text-sm text-red-500">
                  {validationErrors.hospital_name}
                </p>
              {/if}
            </div>

            <div class="grid gap-2">
              <Label for="doctor_name">
                執刀醫師 <span class="text-red-500">*</span>
              </Label>
              <Input
                id="doctor_name"
                value={formData.doctor_name}
                required
                on:input={(e) =>
                  (formData.doctor_name = (e.target as HTMLInputElement).value)}
              />
              {#if validationErrors.doctor_name}
                <p class="text-sm text-red-500">
                  {validationErrors.doctor_name}
                </p>
              {/if}
            </div>
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
          <Button type="button" disabled={isSubmitting} onclick={submitForm}>
            {#if isSubmitting}
              <Loader2 class="mr-2 h-4 w-4 animate-spin" />
              提交中...
            {:else}
              <Send class="mr-2 h-4 w-4" />
              提交資訊
            {/if}
          </Button>
        </div>
      </form>
    </div>
  </div>
</div>
