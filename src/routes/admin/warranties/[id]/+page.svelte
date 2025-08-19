<script lang="ts">
  import { page } from "$app/state";
  import { onMount, tick } from "svelte";
  import { apiService, type Product, type WarrantyInfo } from "$lib/api";
  import { notificationStore } from "$stores/notifications";
  import { goto } from "$app/navigation";
  import { browser } from "$app/environment";
  import WarrantyInfoDisplay from "$components/WarrantyInfoDisplay.svelte";

  let warranty: WarrantyInfo | null = null;
  let product1: Product | undefined = undefined;
  let product2: Product | undefined = undefined;
  let isLoading = true;
  let error: string | null = null;

  async function loadWarranty() {
    isLoading = true;
    error = null;
    try {
      const id = page.params.id;
      const response = await apiService.getWarrantyById(id);
      if (response.data) {
        warranty = response.data.warranty_registration;
        product1 = response.data.product1;
        product2 = response.data.product2;
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

  function goBack() {
    if (browser) {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        goto("/admin/warranties"); // Default back location for admin detail page
      }
    }
  }
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
        <button
          onclick={goBack}
          class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          返回
        </button>
      </div>
    {:else if warranty}
      <!-- 使用共用組件顯示保固資訊 -->
      <WarrantyInfoDisplay
        {warranty}
        {product1}
        {product2}
        showBackButton={true}
        onBack={goBack}
      />
    {/if}
  </div>
</div>
