<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { apiService } from "$lib/api";
  import Button from "$components/ui/Button.svelte";
  import WarrantyInfoDisplay from "$components/WarrantyInfoDisplay.svelte";
  import { Loader2, CheckCircle, AlertCircle } from "lucide-svelte";

  let warrantyId = "";
  let isLoading = true;
  let error: string | null = null;
  let isSubmitting = false;
  let warrantyInfo: any = null;

  // 載入保固資訊和患者資訊
  async function loadWarrantyInfo() {
    try {
      const response = await apiService.getWarrantyInfo(warrantyId);
      if (response.data) {
        warrantyInfo = response.data;
      }

      // 從 localStorage 獲取第二頁填寫的機敏資訊
      const storedInfo = localStorage.getItem(
        `warranty_${warrantyId}_patient_info`
      );
      if (storedInfo) {
        try {
          const patientInfo = JSON.parse(storedInfo);
          warrantyInfo.patient_id = patientInfo.patient_id;
          warrantyInfo.patient_phone = patientInfo.patient_phone;
          warrantyInfo.patient_email = patientInfo.patient_email;
          warrantyInfo.is_local_identity = patientInfo.is_local_identity;
        } catch (e) {
          console.error("解析存儲的患者資訊失敗:", e);
        }
      }
    } catch (e: any) {
      error = "無法載入保固資訊：" + (e.message || "未知錯誤");
    } finally {
      isLoading = false;
    }
  }

  // 確認保固
  async function confirmWarranty() {
    isSubmitting = true;
    error = null;

    try {
      await apiService.confirmWarranty(warrantyId);

      // 清理 localStorage 中存儲的機敏資訊
      localStorage.removeItem(`warranty_${warrantyId}_patient_info`);

      // 成功後跳轉到成功頁面
      goto(`/warranty/register/${warrantyId}/success`);
    } catch (e: any) {
      error = e.message || "確認失敗，請稍後再試";
    } finally {
      isSubmitting = false;
    }
  }

  // 使用 onMount 來初始化
  onMount(async () => {
    warrantyId = $page.params.id;

    // 檢查當前步驟，如果不是步驟 2，則跳轉到對應頁面
    try {
      const response = await apiService.getWarrantyStep(warrantyId);
      if (response.data) {
        const currentStep = response.data.step;
        if (currentStep !== 2) {
          // 根據步驟跳轉到對應頁面
          if (currentStep === 0) {
            goto(`/warranty/register/${warrantyId}/verify`);
          } else if (currentStep === 1) {
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
      // 如果檢查失敗，繼續顯示確認頁面
    }

    await loadWarrantyInfo();
  });
</script>

<svelte:head>
  <title>保固註冊 - 確認資訊</title>
</svelte:head>

<div class="container mx-auto max-w-4xl py-8 px-4">
  {#if isLoading}
    <div class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <Loader2 class="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p class="text-gray-600">正在載入保固資訊...</p>
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
  {:else if warrantyInfo}
    <div
      class="bg-white/60 backdrop-blur-md rounded-xl shadow-2xl border border-white/20"
    >
      <div class="p-8">
        <h1 class="text-3xl font-bold mb-6 text-center text-gray-800">
          保固註冊 - 第三步：確認資訊
        </h1>
        <p class="text-center text-gray-600 mb-8">
          請確認以下資訊是否正確，確認後將無法修改
        </p>

        <!-- 使用共用組件顯示保固資訊，隱藏編輯和重送信功能 -->
        <WarrantyInfoDisplay warranty={warrantyInfo} showBackButton={false} />

        <!-- 確認按鈕 -->
        <div class="flex justify-center mt-8">
          <Button
            type="button"
            disabled={isSubmitting}
            onclick={confirmWarranty}
          >
            {#if isSubmitting}
              <Loader2 class="mr-2 h-4 w-4 animate-spin" />
              確認中...
            {:else}
              <CheckCircle class="mr-2 h-4 w-4" />
              確認保固註冊
            {/if}
          </Button>
        </div>
      </div>
    </div>
  {/if}
</div>
