<script lang="ts">
  import { goto } from "$app/navigation";
  import { warrantyRegistrationStore } from "$stores/warrantyRegistration.svelte";
  import type { WarrantyStatusResponse } from "$lib/api";
  import Button from "$components/ui/Button.svelte";
  import Input from "$components/ui/Input.svelte";
  import Label from "$components/ui/Label.svelte";
  import ProductFilter from "$components/ProductFilter.svelte";
  import { Info, Send, Loader2, CheckCircle, AlertCircle } from "lucide-svelte";

  // 使用 Svelte 5 $props() rune
  let {
    data,
  }: {
    data: {
      warrantyId: string;
      statusCheckResult: WarrantyStatusResponse | null;
      statusError: string | null;
    };
  } = $props();

  // 初始化 store（在 Svelte 5 中不需要 onMount）
  warrantyRegistrationStore.initialize(data);

  // 直接使用 store getters（Svelte 5 自動響應）
  const formData = $derived(warrantyRegistrationStore.formData);
  const filters = $derived(warrantyRegistrationStore.filters);
  const isLoading = $derived(warrantyRegistrationStore.isLoading);
  const error = $derived(warrantyRegistrationStore.error);
  const validationErrors = $derived(warrantyRegistrationStore.validationErrors);
  const serial1 = $derived(warrantyRegistrationStore.serial1);
  const serial2 = $derived(warrantyRegistrationStore.serial2);
  const canSubmit = $derived(warrantyRegistrationStore.canSubmit);
  const statusCheckResult = $derived(
    warrantyRegistrationStore.statusCheckResult
  );

  function getMaxDate() {
    return new Date().toISOString().split("T")[0];
  }
</script>

<svelte:head>
  <title>保固註冊 - 捷揚醫材</title>
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
  {:else if error}
    <!-- 錯誤狀態 -->
    <div
      class="bg-white/60 backdrop-blur-md rounded-xl shadow-2xl border border-white/20"
    >
      <div class="p-8 text-center">
        <AlertCircle class="h-16 w-16 text-red-600 mx-auto mb-4" />
        <h1 class="text-2xl font-bold mb-4 text-gray-800">發生錯誤</h1>
        <p class="text-gray-600 mb-6">{error}</p>
        <Button onclick={() => goto("/")}>返回首頁</Button>
      </div>
    </div>
  {:else}
    <!-- 保固填寫表單 -->
    <div
      class="bg-white/60 backdrop-blur-md rounded-xl shadow-2xl border border-white/20"
    >
      <div class="p-8">
        <h1 class="text-3xl font-bold mb-6 text-center text-gray-800">
          乳房植入物保固註冊
        </h1>
        <p class="text-center text-gray-600 mb-6">請填寫以下資訊完成保固註冊</p>

        <form class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Product Info -->
          <div
            class="col-span-1 md:col-span-2 space-y-4 p-4 border border-white/30 rounded-lg bg-white/30 backdrop-blur-sm"
          >
            <h2
              class="text-xl font-semibold border-b border-white/30 pb-2 text-gray-800"
            >
              產品資訊
            </h2>
            <div class="grid gap-2">
              <Label for="product_id">選擇產品</Label>
              <ProductFilter
                {filters}
                presetBrand={filters.brand}
                onFiltersChange={(filters) =>
                  warrantyRegistrationStore.updateFilters(filters)}
              />
            </div>

            <div class="grid gap-2">
              <Label for="product_serial_number">
                第一個植入體序號 <span class="text-destructive">*</span>
              </Label>
              <div class="relative">
                <Input
                  id="product_serial_number"
                  value={formData.product_serial_number}
                  placeholder="格式：1234567-123"
                  required
                  on:input={(e) =>
                    warrantyRegistrationStore.updateFormData(
                      "product_serial_number",
                      (e.target as HTMLInputElement).value
                    )}
                  on:blur={() =>
                    warrantyRegistrationStore.checkSerialNumber(
                      formData.product_serial_number,
                      false
                    )}
                  class={serial1.exists || serial1.formatError
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""}
                />
                {#if serial1.isChecking}
                  <div
                    class="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <Loader2
                      class="h-4 w-4 animate-spin text-muted-foreground"
                    />
                  </div>
                {/if}
              </div>
              {#if validationErrors.product_serial_number}
                <p class="text-sm text-destructive">
                  {validationErrors.product_serial_number}
                </p>
              {:else if serial1.formatError}
                <p class="text-sm text-destructive">
                  {serial1.formatError}
                </p>
              {:else if serial1.exists}
                <p class="text-sm text-destructive">
                  此序號已被註冊，請檢查輸入
                </p>
              {/if}
            </div>

            <div class="grid gap-2">
              <Label for="product_serial_number_2"
                >第二個植入體序號 <span class="text-muted-foreground text-sm"
                  >（選填，雙側手術請填寫）</span
                ></Label
              >
              <div class="relative">
                <Input
                  id="product_serial_number_2"
                  value={formData.product_serial_number_2}
                  placeholder="格式：1234567-123"
                  on:input={(e) =>
                    warrantyRegistrationStore.updateFormData(
                      "product_serial_number_2",
                      (e.target as HTMLInputElement).value
                    )}
                  on:blur={() =>
                    warrantyRegistrationStore.checkSerialNumber(
                      formData.product_serial_number_2 || "",
                      true
                    )}
                  class={serial2.exists || serial2.formatError
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""}
                />
                {#if serial2.isChecking}
                  <div
                    class="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <Loader2
                      class="h-4 w-4 animate-spin text-muted-foreground"
                    />
                  </div>
                {/if}
              </div>
              {#if validationErrors.product_serial_number_2}
                <p class="text-sm text-destructive">
                  {validationErrors.product_serial_number_2}
                </p>
              {:else if serial2.formatError}
                <p class="text-sm text-destructive">
                  {serial2.formatError}
                </p>
              {:else if serial2.exists}
                <p class="text-sm text-destructive">
                  此序號已被註冊，請檢查輸入
                </p>
              {/if}
              <p class="text-xs text-muted-foreground">
                <Info class="h-3 w-3 inline mr-1" />
                單側手術只需填寫第一個序號，雙側手術請填寫兩個不同的序號
              </p>
            </div>
          </div>

          <!-- Patient Info -->
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
                <Label for="patient_name"
                  >患者姓名 <span class="text-destructive">*</span></Label
                >
                <Input
                  id="patient_name"
                  value={formData.patient_name}
                  required
                  on:input={(e) =>
                    warrantyRegistrationStore.updateFormData(
                      "patient_name",
                      (e.target as HTMLInputElement).value
                    )}
                />
                {#if validationErrors.patient_name}<p
                    class="text-sm text-destructive"
                  >
                    {validationErrors.patient_name}
                  </p>{/if}
              </div>

              <div class="grid gap-2">
                <Label for="patient_id"
                  >身分證號/護照號碼 <span class="text-destructive">*</span
                  ></Label
                >
                <Input
                  id="patient_id"
                  value={formData.patient_id}
                  on:input={(e) =>
                    warrantyRegistrationStore.updateFormData(
                      "patient_id",
                      (e.target as HTMLInputElement).value
                    )}
                />
              </div>
            </div>
            <div class="grid md:grid-cols-2 gap-4">
              <div class="grid gap-2">
                <Label for="patient_birth_date"
                  >出生年月日 <span class="text-destructive">*</span></Label
                >
                <Input
                  id="patient_birth_date"
                  type="date"
                  value={formData.patient_birth_date}
                  max={getMaxDate()}
                  on:input={(e) =>
                    warrantyRegistrationStore.updateFormData(
                      "patient_birth_date",
                      (e.target as HTMLInputElement).value
                    )}
                />
              </div>

              <div class="grid gap-2">
                <Label for="patient_phone"
                  >聯絡電話 <span class="text-destructive">*</span></Label
                >
                <Input
                  id="patient_phone"
                  value={formData.patient_phone}
                  type="tel"
                  on:input={(e) =>
                    warrantyRegistrationStore.updateFormData(
                      "patient_phone",
                      (e.target as HTMLInputElement).value
                    )}
                />
              </div>
            </div>
            <div class="grid gap-2">
              <Label for="patient_email"
                >電子郵件 <span class="text-destructive">*</span></Label
              >
              <Input
                id="patient_email"
                value={formData.patient_email}
                type="email"
                on:input={(e) =>
                  warrantyRegistrationStore.updateFormData(
                    "patient_email",
                    (e.target as HTMLInputElement).value
                  )}
              />
            </div>
          </div>

          <!-- Surgery Info -->
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
                  >手術醫院 <span class="text-destructive">*</span></Label
                >
                <Input
                  id="hospital_name"
                  value={formData.hospital_name}
                  on:input={(e) =>
                    warrantyRegistrationStore.updateFormData(
                      "hospital_name",
                      (e.target as HTMLInputElement).value
                    )}
                />
              </div>

              <div class="grid gap-2">
                <Label for="doctor_name"
                  >執刀醫師 <span class="text-destructive">*</span></Label
                >
                <Input
                  id="doctor_name"
                  value={formData.doctor_name}
                  on:input={(e) =>
                    warrantyRegistrationStore.updateFormData(
                      "doctor_name",
                      (e.target as HTMLInputElement).value
                    )}
                />
              </div>
            </div>
            <div class="grid gap-2">
              <Label for="surgery_date"
                >手術日期 <span class="text-destructive">*</span></Label
              >
              <Input
                id="surgery_date"
                type="date"
                value={formData.surgery_date}
                max={getMaxDate()}
                on:input={(e) =>
                  warrantyRegistrationStore.updateFormData(
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
              <p class="text-sm text-destructive mr-4">{error}</p>
            {/if}
            <Button
              type="button"
              disabled={isLoading || !canSubmit}
              onclick={() =>
                warrantyRegistrationStore.submitForm(data.warrantyId)}
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
