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
  function disableManagementButton() {
    return (
      page.url.pathname.startsWith("/warranty/register/") ||
      page.url.pathname.startsWith("/legal")
    );
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
    ? 'bg-mentor-primary border-gray-200'
    : 'bg-mentor-primary backdrop-blur-md border-white/20'}
  bg-repeat
  "
>
  <div class="md:hidden relative h-16 w-full grid grid-cols-6 gap-4 mx-auto">
    <div class="col-span-1"></div>
    <div class="col-span-4">
      <div class="h-full w-full flex items-center justify-center">
        <img
          src="/images/mentor-logo-white.webp"
          class="h-1/2 max-h-[32px]"
          alt="logo"
        />
      </div>
    </div>
    <div class="col-span-1 flex items-center justify-end">
      {#if !disableManagementButton()}
        {#if $authStore.user}
          <Button
            variant="ghost"
            class="hover:bg-mentor-white text-white hover:text-mentor-primary"
            size="sm"
            onclick={() => goto("/admin/warranties")}
          >
            <Settings class="mr-2 h-4 w-4" />
            <span>管理</span>
          </Button>
          <Button
            variant="ghost"
            class="hover:bg-mentor-white text-white hover:text-mentor-primary"
            size="sm"
            onclick={handleLogout}
          >
            <LogOut class="mr-2 h-4 w-4" />
            <span>登出</span>
          </Button>
        {:else}
          <Button
            variant="ghost"
            class="hover:bg-mentor-white"
            size="sm"
            onclick={() => goto("/login")}
          >
            <LogIn class="mr-2 h-4 w-4 text-white" />
            <span class="text-white hover:text-mentor-primary">登入</span>
          </Button>
        {/if}
      {/if}
    </div>
  </div>
  <div
    class="hidden md:grid relative h-16 w-full max-w-[80%] grid-cols-3 gap-4 mx-auto"
  >
    <div class="flex items-center">
      <div
        class="h-1/2 w-full bg-[url(/images/mentor-logo-white.webp)] bg-contain bg-no-repeat"
      ></div>
    </div>

    <div class="flex items-center justify-center space-x-4">
      <span class="text-xl font-bold text-white">保固管理系統</span>
    </div>

    <div class="flex items-center justify-end space-x-4">
      {#if !disableManagementButton()}
        {#if $authStore.user}
          <Button
            variant="ghost"
            class="hover:bg-mentor-white text-white hover:text-mentor-primary"
            size="sm"
            onclick={() => goto("/admin/warranties")}
          >
            <Settings class="mr-2 h-4 w-4" />
            <span>管理</span>
          </Button>
          <Button
            variant="ghost"
            class="hover:bg-mentor-white text-white hover:text-mentor-primary"
            size="sm"
            onclick={handleLogout}
          >
            <LogOut class="mr-2 h-4 w-4" />
            <span>登出</span>
          </Button>
        {:else}
          <Button
            variant="ghost"
            class="hover:bg-mentor-white text-white hover:text-mentor-primary"
            size="sm"
            onclick={() => goto("/login")}
          >
            <LogIn class="mr-2 h-4 w-4 " />
            <span>登入</span>
          </Button>
        {/if}
      {/if}
    </div>
  </div>
</header>
