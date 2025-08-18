<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { Loader2 } from "lucide-svelte";

  let warrantyId = "";

  onMount(() => {
    warrantyId = $page.params.id;
    // 重定向到新的驗證頁面
    goto(`/warranty/register/${warrantyId}/verify`);
  });
</script>

<svelte:head>
  <title>保固註冊</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center">
  <div class="text-center">
    <Loader2 class="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
    <p class="text-gray-600">正在跳轉到保固註冊頁面...</p>
  </div>
</div>
