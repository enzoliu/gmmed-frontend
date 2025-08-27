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
    class="bg-white/60 backdrop-blur-md rounded-xl shadow-2xl border border-mentor-primary"
  >
    <div class="p-8 text-center">
      <Shield class="h-24 w-24 text-mentor-primary mx-auto mb-6" />

      <h1 class="text-3xl font-bold mb-8 text-gray-800">產品序號已驗證</h1>

      <div
        class="bg-mentor-darkblue border border-mentor-primary rounded-lg p-6 mb-8"
      >
        <div class="flex items-center justify-center gap-3">
          <CheckCircle class="h-6 w-6 text-mentor-white" />
          <h2 class="text-lg font-semibold text-mentor-white">驗證通過</h2>
        </div>
      </div>
    </div>
  </div>
</div>
