<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { CheckCircle, Shield } from "lucide-svelte";
  import { apiService } from "$lib/api";

  let warrantyId = "";

  // 檢查當前步驟，如果不是步驟 9，則跳轉到對應頁面
  async function checkStepAndRedirect() {
    try {
      const response = await apiService.getWarrantyStep(warrantyId);
      if (response.data) {
        const currentStep = response.data.step;
        if (currentStep !== 9) {
          // 根據步驟跳轉到對應頁面
          if (currentStep === 0) {
            goto(`/warranty/register/${warrantyId}/verify`);
          } else if (currentStep === 1 || currentStep === 2) {
            goto(`/warranty/register/${warrantyId}/info`);
          } else if (currentStep === 3) {
            goto(`/warranty/register/${warrantyId}/success`);
          }
          return;
        }
      }
    } catch (e: any) {
      console.error("檢查步驟失敗:", e);
      // 如果檢查失敗，繼續顯示正貨驗證頁面
    }
  }

  onMount(async () => {
    warrantyId = $page.params.id;
    await checkStepAndRedirect();
  });
</script>

<svelte:head>
  <title>產品序號已驗證</title>
</svelte:head>

<div class="container mx-auto max-w-2xl py-8 px-4">
  <div
    class="bg-white/60 backdrop-blur-md rounded-xl shadow-2xl border border-white/20"
  >
    <div class="p-8 text-center">
      <Shield class="h-24 w-24 text-blue-600 mx-auto mb-6" />

      <h1 class="text-3xl font-bold mb-4 text-gray-800">產品序號已驗證</h1>

      <p class="text-lg text-gray-600 mb-8">您的產品序號已成功驗證。</p>

      <div class="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
        <div class="flex items-center justify-center gap-3 mb-3">
          <CheckCircle class="h-6 w-6 text-green-600" />
          <h2 class="text-lg font-semibold text-green-800">驗證通過</h2>
        </div>
      </div>
    </div>
  </div>
</div>
