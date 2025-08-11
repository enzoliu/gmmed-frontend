<!-- src/components/Header.svelte -->
<script lang="ts">
  import { authStore } from "$stores/auth";
  import { goto } from "$app/navigation";
  import Button from "$components/ui/Button.svelte";
  import { page } from "$app/state";
  import { ShieldCheck, Settings, LogOut, LogIn } from "lucide-svelte";

  async function handleLogout() {
    await authStore.logout();
    await goto("/login");
  }

  $: user = $authStore.user;

  function isLinkActive(path: string) {
    return page.url.pathname === path;
  }
</script>

<header
  class="sticky top-0 z-50 w-full border-b {page.url.pathname.startsWith(
    '/admin'
  )
    ? 'bg-white border-gray-200'
    : 'bg-white/80 backdrop-blur-md border-white/20'}"
>
  <div
    class="container flex h-16 max-w-screen-2xl items-center justify-between"
  >
    <a href="/" class="flex items-center space-x-2">
      <img src="/images/logo.png" alt="logo" class="h-5" />
      <span class="text-xl font-bold text-primary">保固管理系統</span>
    </a>

    <div class="flex items-center space-x-4">
      {#if $authStore.user}
        <Button
          variant="ghost"
          size="sm"
          onclick={() => goto("/admin/warranties")}
        >
          <Settings class="mr-2 h-4 w-4 text-foreground" />
          管理
        </Button>
        <Button variant="ghost" size="sm" onclick={handleLogout}>
          <LogOut class="mr-2 h-4 w-4 text-foreground" />
          登出
        </Button>
      {:else}
        <Button variant="ghost" size="sm" onclick={() => goto("/login")}>
          <LogIn class="mr-2 h-4 w-4 text-foreground" />
          登入
        </Button>
      {/if}
    </div>
  </div>
</header>
