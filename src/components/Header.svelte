<!-- src/components/Header.svelte -->
<script lang="ts">
  import { authStore } from "$stores/auth";
  import { goto } from "$app/navigation";
  import Button from "$components/ui/Button.svelte";
  import { page } from "$app/state";
  import { Settings, LogOut, LogIn } from "lucide-svelte";

  async function handleLogout() {
    await authStore.logout();
    await goto("/login");
  }
  function isWarrantyRegistrationPage() {
    return page.url.pathname.startsWith("/warranty/register/");
  }

  $: user = $authStore.user;

  function isLinkActive(path: string) {
    return page.url.pathname === path;
  }
</script>

<header
  class="
  sticky top-0 z-50 w-full border-b
  {page.url.pathname.startsWith('/admin')
    ? 'bg-gmmed-900 border-gray-200'
    : 'bg-gmmed-900 backdrop-blur-md opacity-80 border-white/20'}
  bg-[url('/images/dots-mini-strong.png')]
  bg-repeat
  bg-blend-multiply
  "
>
  <div class="md:hidden relative h-16 w-full grid grid-cols-3 gap-4 mx-auto">
    <div>
      <a href="/" class="flex items-center space-x-2 h-16">
        <img src="/images/logo.png" alt="logo" class="w-full" />
      </a>
    </div>
    <div class="flex items-center justify-center">
      <span class="text-l font-bold text-white">保固管理系統</span>
    </div>
    <div class="flex items-center justify-end">
      {#if !isWarrantyRegistrationPage()}
        {#if $authStore.user}
          <Button
            variant="ghost"
            class="hover:bg-primary"
            size="sm"
            onclick={() => goto("/admin/warranties")}
          >
            <Settings class="mr-2 h-4 w-4 text-white" />
            <span class="text-white">管理</span>
          </Button>
          <Button
            variant="ghost"
            class="hover:bg-primary"
            size="sm"
            onclick={handleLogout}
          >
            <LogOut class="mr-2 h-4 w-4 text-white" />
            <span class="text-white">登出</span>
          </Button>
        {:else}
          <Button
            variant="ghost"
            class="hover:bg-primary"
            size="sm"
            onclick={() => goto("/login")}
          >
            <LogIn class="mr-2 h-4 w-4 text-white" />
            <span class="text-white">登入</span>
          </Button>
        {/if}
      {/if}
    </div>
  </div>
  <div
    class="hidden md:grid relative h-16 w-full max-w-[80%] grid-cols-3 gap-4 mx-auto"
  >
    <div>
      <a href="/" class="flex items-center space-x-2 h-16">
        <img src="/images/logo.png" alt="logo" class="h-full" />
      </a>
    </div>

    <div class="flex items-center justify-center space-x-4">
      <span class="text-xl font-bold text-white">保固管理系統</span>
    </div>

    <div class="flex items-center justify-end space-x-4">
      {#if !isWarrantyRegistrationPage()}
        {#if $authStore.user}
          <Button
            variant="ghost"
            class="hover:bg-primary"
            size="sm"
            onclick={() => goto("/admin/warranties")}
          >
            <Settings class="mr-2 h-4 w-4 text-white" />
            <span class="text-white">管理</span>
          </Button>
          <Button
            variant="ghost"
            class="hover:bg-primary"
            size="sm"
            onclick={handleLogout}
          >
            <LogOut class="mr-2 h-4 w-4 text-white" />
            <span class="text-white">登出</span>
          </Button>
        {:else}
          <Button
            variant="ghost"
            class="hover:bg-primary"
            size="sm"
            onclick={() => goto("/login")}
          >
            <LogIn class="mr-2 h-4 w-4 text-white" />
            <span class="text-white">登入</span>
          </Button>
        {/if}
      {/if}
    </div>
  </div>
</header>
