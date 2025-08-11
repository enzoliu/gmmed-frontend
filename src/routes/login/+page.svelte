<!-- src/routes/login/+page.svelte -->
<script lang="ts">
  import { goto } from "$app/navigation";
  import { apiService } from "$lib/api";
  import { notificationStore } from "$stores/notifications";
  import { Loader2 } from "lucide-svelte";
  import { authStore } from "$stores/auth";

  import Button from "$components/ui/Button.svelte";
  import Input from "$components/ui/Input.svelte";
  import Label from "$components/ui/Label.svelte";

  let username = "";
  let password = "";
  let isLoading = false;
  let error: string | null = null;

  async function handleSubmit() {
    isLoading = true;
    error = null;

    try {
      const response = await apiService.login({ username, password });
      if (response.data === true) {
        notificationStore.success("登入成功！");
        const me = await apiService.getMe();
        if (me.data) {
          authStore.setLogin(me.data.user, me.data.expires_at);
        }
        await goto("/admin/warranties");
      } else {
        error = "登入失敗，請確認帳號密碼是否正確";
        notificationStore.error(`登入失敗: ${error}`);
      }
    } catch (e: any) {
      console.error("Login error:", e);
      error = e.message || "發生錯誤，請稍後再試";
      notificationStore.error(`登入失敗: ${error}`);
    } finally {
      isLoading = false;
    }
  }
</script>

<svelte:head>
  <title>管理員登入</title>
</svelte:head>

<div class="flex items-center justify-center py-12">
  <div
    class="mx-auto grid w-[350px] gap-6 p-8 bg-white/60 backdrop-blur-md rounded-xl shadow-2xl border border-white/20"
  >
    <div class="grid gap-2 text-center">
      <h1 class="text-3xl font-bold">登入</h1>
      <p class="text-balance text-muted-foreground">
        輸入您的帳號密碼以登入管理後台
      </p>
    </div>
    <form on:submit|preventDefault={handleSubmit} class="grid gap-4">
      <div class="grid gap-2">
        <Label for="username">使用者名稱</Label>
        <Input
          id="username"
          type="text"
          required
          bind:value={username}
          disabled={isLoading}
        />
      </div>
      <div class="grid gap-2">
        <Label for="password">密碼</Label>
        <Input
          id="password"
          type="password"
          required
          bind:value={password}
          disabled={isLoading}
        />
      </div>
      {#if error}
        <p class="text-sm text-destructive">{error}</p>
      {/if}
      <Button type="submit" class="mx-auto w-1/2 mt-4" disabled={isLoading}>
        {#if isLoading}
          <Loader2 class="mr-2 h-4 w-4 animate-spin"></Loader2>
          登入中...
        {:else}
          登入
        {/if}
      </Button>
    </form>
  </div>
</div>
