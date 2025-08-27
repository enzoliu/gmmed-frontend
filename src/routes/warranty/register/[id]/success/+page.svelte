<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { CheckCircle, Mail, Home } from "lucide-svelte";
  import { apiService } from "$lib/api";

  let warrantyId = "";

  // 檢查當前步驟，如果不是步驟 3，則跳轉到對應頁面
  async function checkStepAndRedirect() {
    try {
      const response = await apiService.getWarrantyStep(warrantyId);
      if (response.data) {
        const currentStep = response.data.step;
        if (currentStep !== 3) {
          // 根據步驟跳轉到對應頁面
          if (currentStep === 0) {
            goto(`/warranty/register/${warrantyId}/verify`);
          } else if (currentStep === 1 || currentStep === 2) {
            goto(`/warranty/register/${warrantyId}/info`);
          } else if (currentStep === 9) {
            goto(`/warranty/register/${warrantyId}/verified`);
          }
          return;
        }
      }
    } catch (e: any) {
      console.error("檢查步驟失敗:", e);
      // 如果檢查失敗，繼續顯示成功頁面
    }
  }

  onMount(async () => {
    warrantyId = $page.params.id;
    await checkStepAndRedirect();
  });
</script>

<svelte:head>
  <title>保固註冊 - 完成</title>
</svelte:head>

<div class="container mx-auto max-w-2xl py-8 px-4">
  <div
    class="bg-white/60 backdrop-blur-md rounded-xl shadow-2xl border border-mentor-gray"
  >
    <div class="p-8 text-center">
      <CheckCircle class="h-24 w-24 text-mentor-teal mx-auto mb-6" />

      <h1 class="text-xl font-bold mb-2 text-gray-800">保固註冊完成</h1>

      <p class="text-sm text-mentor-gray mb-8">
        您的保固已成功註冊，確認信件將發送至您的電子信箱。
      </p>

      <div class="bg-white border border-mentor-primary rounded-lg p-6 mb-8">
        <div class="flex items-center justify-center gap-3 mb-3">
          <Mail class="h-6 w-6 text-mentor-primary" />
          <h2 class="text-lg font-semibold text-mentor-primary">重要提醒</h2>
        </div>
        <ul
          class="text-left text-xs md:text-sm text-mentor-primary space-y-2 inline-block"
        >
          <li>• 請檢查您的電子信箱，確認信件是否收到</li>
          <li>• 如未收到信件，請檢查垃圾郵件資料夾</li>
          <li>• 保固確認信件包含完整的保固資訊</li>
          <li>• 請妥善保存此保固記錄，以備日後查詢</li>
        </ul>
      </div>
    </div>
  </div>
</div>
