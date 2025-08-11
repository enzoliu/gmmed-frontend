<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { Mail, Phone, MapPin, Shield, Award, Users } from "lucide-svelte";

  let redirecting = false;

  // 檢查 URL 參數，如果有 action=register 和 id，則跳轉到保固填寫頁面
  onMount(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get("action");
    const id = urlParams.get("id");

    if (action === "register" && id) {
      redirecting = true;
      goto(`/warranty/register/${id}`);
    }
  });
</script>

<svelte:head>
  <title>偉鉅股份有限公司 - 乳房植入物保固系統</title>
</svelte:head>

{#if redirecting}
  <div
    class="w-screen h-screen flex items-center justify-center bg-white/80 backdrop-blur"
  >
    <span class="text-lg text-gray-600">跳轉中...</span>
  </div>
{:else}
  <!-- 內容容器 -->
  <div class="container mx-auto max-w-6xl py-8 px-4">
    <!-- 公司介紹區塊 -->
    <div
      class="bg-white/60 backdrop-blur-md rounded-xl shadow-2xl border border-white/20 mb-8"
    >
      <div class="p-8">
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold mb-4 text-gray-800">
            偉鉅股份有限公司
          </h1>
          <p class="text-xl text-gray-600 mb-6">專業的乳房植入物保固管理服務</p>
          <div class="w-24 h-1 bg-blue-600 mx-auto rounded"></div>
        </div>

        <div class="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 class="text-2xl font-semibold mb-4 text-gray-800">關於我們</h2>
            <p class="text-gray-600 mb-4 leading-relaxed">
              偉鉅股份有限公司致力於為醫療院所和患者提供最優質的乳房植入物產品和保固服務。
              我們與國際知名品牌合作，確保每一件產品都符合最高品質標準。
            </p>
            <p class="text-gray-600 mb-4 leading-relaxed">
              我們的保固系統採用先進的數位化管理，為每一位患者提供完整的保固追蹤服務，
              確保您的權益得到充分保障。
            </p>
          </div>
          <div
            class="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-lg"
          >
            <h3 class="text-lg font-semibold mb-4 text-gray-800">我們的優勢</h3>
            <div class="space-y-3">
              <div class="flex items-center">
                <Shield class="h-5 w-5 text-blue-600 mr-3" />
                <span class="text-gray-700">完整的保固保障</span>
              </div>
              <div class="flex items-center">
                <Award class="h-5 w-5 text-blue-600 mr-3" />
                <span class="text-gray-700">國際品質認證</span>
              </div>
              <div class="flex items-center">
                <Users class="h-5 w-5 text-blue-600 mr-3" />
                <span class="text-gray-700">專業醫療團隊支援</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 服務特色區塊 -->
    <div class="grid md:grid-cols-3 gap-6 mb-8">
      <div
        class="bg-white/60 backdrop-blur-md rounded-xl shadow-lg border border-white/20 p-6"
      >
        <div class="text-center">
          <div
            class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Shield class="h-8 w-8 text-blue-600" />
          </div>
          <h3 class="text-xl font-semibold mb-2 text-gray-800">保固管理</h3>
          <p class="text-gray-600">
            完整的數位化保固追蹤系統，確保您的權益得到充分保障
          </p>
        </div>
      </div>

      <div
        class="bg-white/60 backdrop-blur-md rounded-xl shadow-lg border border-white/20 p-6"
      >
        <div class="text-center">
          <div
            class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Award class="h-8 w-8 text-green-600" />
          </div>
          <h3 class="text-xl font-semibold mb-2 text-gray-800">品質保證</h3>
          <p class="text-gray-600">
            與國際知名品牌合作，所有產品均通過嚴格品質認證
          </p>
        </div>
      </div>

      <div
        class="bg-white/60 backdrop-blur-md rounded-xl shadow-lg border border-white/20 p-6"
      >
        <div class="text-center">
          <div
            class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Users class="h-8 w-8 text-purple-600" />
          </div>
          <h3 class="text-xl font-semibold mb-2 text-gray-800">專業支援</h3>
          <p class="text-gray-600">
            專業的醫療團隊提供全方位的技術支援和客戶服務
          </p>
        </div>
      </div>
    </div>
  </div>
{/if}
