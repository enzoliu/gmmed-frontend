<script lang="ts">
  import { apiService, type Product, type WarrantyInfo } from "$lib/api";
  import Button from "$components/ui/Button.svelte";
  import {
    User,
    Building,
    Package,
    ShieldCheck,
    ArrowRight,
    ArrowLeft,
  } from "lucide-svelte";
  import { onMount } from "svelte";

  export let warranty: WarrantyInfo | null = null;
  export let product1: Product | undefined = undefined;
  export let product2: Product | undefined = undefined;
  export let showBackButton = true;
  export let onBack: (() => void) | null = null;

  function formatDate(dateString?: string) {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function isLifeTimeWarranty(): boolean {
    if (product1 && product2) {
      if (product1.warranty_years === -1 && product2.warranty_years === -1) {
        return true;
      }
    } else if (product1) {
      return product1.warranty_years === -1;
    } else if (product2) {
      return product2.warranty_years === -1;
    }
    return false;
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

  function handleBack() {
    if (onBack) {
      onBack();
    }
  }

  onMount(async () => {
    if (!warranty) return;
    if (product1 && product2) return;

    if (warranty.product_serial_number) {
      product1 = (
        await apiService.getProductBySerialNumber(
          warranty.product_serial_number
        )
      ).data;
    }
    if (warranty.product_serial_number_2) {
      product2 = (
        await apiService.getProductBySerialNumber(
          warranty.product_serial_number_2
        )
      ).data;
    }
  });
</script>

{#if warranty}
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
        {#if warranty.status && warranty.status !== "pending"}
          <div
            class={`rounded-full px-4 py-1.5 text-base font-medium ${getStatusClass(
              warranty.status
            )}`}
          >
            {warranty.status === "active" ? "有效" : warranty.status}
          </div>
        {/if}
      </div>
    </div>

    <!-- 患者資訊 -->
    <div class="rounded-lg border bg-white p-6 shadow-sm">
      <h2 class="mb-4 flex items-center text-xl font-semibold">
        <User class="mr-3 h-5 w-5 text-primary" />
        患者資訊
      </h2>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
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
      {#if product1}
        <div class="rounded-lg border bg-white p-6 shadow-sm">
          <h2 class="mb-4 flex items-center text-xl font-semibold">
            <Package class="mr-3 h-5 w-5 text-primary" />
            產品資訊 - 第一個植入體
          </h2>
          <div class="space-y-4">
            <div>
              <p class="text-sm text-muted-foreground">型號</p>
              <p class="font-medium">
                {product1.type}
                {product1.size}
              </p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">產品序號</p>
              <div class="space-y-1">
                <p class="font-mono">{warranty.product_serial_number}</p>
              </div>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">保固類型</p>
              <p class="font-medium">
                {#if product1.warranty_years === -1}
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                  >
                    永久保固
                  </span>
                {:else if product1.warranty_years === 0}
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    無保固
                  </span>
                {:else}
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {product1.warranty_years}年保固
                  </span>
                {/if}
              </p>
            </div>
          </div>
        </div>
      {/if}
      {#if product2}
        <div class="rounded-lg border bg-white p-6 shadow-sm">
          <h2 class="mb-4 flex items-center text-xl font-semibold">
            <Package class="mr-3 h-5 w-5 text-primary" />
            產品資訊 - 第二個植入體
          </h2>
          <div class="space-y-4">
            <div>
              <p class="text-sm text-muted-foreground">型號</p>
              <p class="font-medium">
                {product2.type}
                {product2.size}
              </p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">產品序號</p>
              <div class="space-y-1">
                <p class="font-mono">{warranty.product_serial_number_2}</p>
              </div>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">保固類型</p>
              <p class="font-medium">
                {#if product2.warranty_years === -1}
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                  >
                    永久保固
                  </span>
                {:else if product2.warranty_years === 0}
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    無保固
                  </span>
                {:else}
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {product2.warranty_years}年保固
                  </span>
                {/if}
              </p>
            </div>
          </div>
        </div>
      {:else}
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
      {/if}
    </div>

    <!-- 如果產品資訊有兩個，則手術資訊顯示在這-->
    {#if product1 && product2}
      <div class="rounded-lg border bg-white p-6 shadow-sm">
        <h2 class="mb-4 flex items-center text-xl font-semibold">
          <Building class="mr-3 h-5 w-5 text-primary" />
          手術資訊
        </h2>
        <div class="flex items-center justify-around text-center">
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
    {/if}

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
            {#if isLifeTimeWarranty()}
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
      {#if showBackButton}
        <Button variant="default" onclick={handleBack}>
          <ArrowLeft class="mr-2 h-4 w-4" />
          返回列表
        </Button>
      {/if}
    </div>
  </div>
{/if}
