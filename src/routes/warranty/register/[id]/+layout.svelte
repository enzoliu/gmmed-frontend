<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { apiService } from "$lib/api";
  import { Loader2, AlertCircle } from "lucide-svelte";

  let currentStep = 4;
  let isLoading = true;
  let error: string | null = null;
  let warrantyId = "";

  // 步驟對應的頁面路由
  const stepRoutes = {
    0: "/warranty/register/[id]/verify", // 驗證頁面
    1: "/warranty/register/[id]/info", // 填寫資訊頁面
    2: "/warranty/register/[id]/info", // 填寫資訊頁面（編輯中）
    3: "/warranty/register/[id]/success", // 保固已登記頁面
    9: "/warranty/register/[id]/verified", // 正貨已驗證頁面
  };

  // 檢查當前步驟並跳轉
  async function checkStepAndRedirect() {
    try {
      const response = await apiService.getWarrantyStep(warrantyId);
      if (response.data) {
        currentStep = response.data.step;
        const targetRoute = stepRoutes[currentStep as keyof typeof stepRoutes];

        if (targetRoute && targetRoute !== $page.url.pathname) {
          const actualRoute = targetRoute.replace("[id]", warrantyId);
          goto(actualRoute);
        }
      }
    } catch (e: any) {
      error = "無法取得保固狀態：" + (e.message || "未知錯誤");
    } finally {
      isLoading = false;
    }
  }

  onMount(async () => {
    warrantyId = $page.params.id;
    await checkStepAndRedirect();
  });
</script>

{#if isLoading}
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <Loader2 class="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
      <p class="text-gray-600">正在檢查保固狀態...</p>
    </div>
  </div>
{:else if error}
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <AlertCircle class="h-16 w-16 text-red-600 mx-auto mb-4" />
      <h1 class="text-2xl font-bold mb-4 text-gray-800">發生錯誤</h1>
      <p class="text-gray-600 mb-6">{error}</p>
      <button
        onclick={() => goto("/")}
        class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
      >
        返回首頁
      </button>
    </div>
  </div>
{:else}
  <slot />
{/if}
