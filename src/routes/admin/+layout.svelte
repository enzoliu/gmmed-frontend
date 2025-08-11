<!-- src/routes/admin/+layout.svelte -->
<script lang="ts">
  import { authStore, isAuthenticated, isAdmin } from "$stores/auth";
  import { apiService } from "$lib/api";
  import { page } from "$app/state";
  import { Menu, X } from "lucide-svelte";
  import Button from "$components/ui/Button.svelte";
  import { onMount } from "svelte";
  import { notificationStore } from "$stores/notifications";
  import { goto } from "$app/navigation";

  onMount(async () => {
    if (!$authStore.user) {
      const me = await apiService.getMe();
      if (me.data) {
        authStore.setLogin(me.data.user, me.data.expires_at);
        if (me.data.user.role !== "admin" && me.data.user.role !== "editor") {
          notificationStore.error("您的權限不足，無法存取此頁面");
          goto("/", { replaceState: true });
        }
      } else {
        notificationStore.error("請先登入");
        goto("/login?redirectTo=" + page.url.pathname, { replaceState: true });
      }
    }
  });

  let isMobileMenuOpen = false;

  function toggleMobileMenu() {
    isMobileMenuOpen = !isMobileMenuOpen;
  }

  function closeMobileMenu() {
    isMobileMenuOpen = false;
  }
</script>

<!-- 後台管理容器 - 覆蓋背景圖片 -->
<div class="w-full bg-white min-h-screen">
  <div class="flex">
    <!-- 桌面版側邊欄 -->
    <aside
      class="hidden md:block w-40 flex-shrink-0 bg-gray-50 border-r border-gray-200 p-4"
    >
      <h2 class="text-xl font-bold mb-4 text-gray-800">管理選單</h2>
      <nav class="flex flex-col space-y-1">
        <a
          href="/admin/warranties"
          class="px-4 py-2 rounded-lg transition-colors"
          class:font-semibold={page.url.pathname.startsWith(
            "/admin/warranties"
          )}
          class:bg-blue-100={page.url.pathname.startsWith("/admin/warranties")}
          class:text-blue-800={page.url.pathname.startsWith(
            "/admin/warranties"
          )}
          class:hover:bg-gray-100={!page.url.pathname.startsWith(
            "/admin/warranties"
          )}
          class:text-gray-700={!page.url.pathname.startsWith(
            "/admin/warranties"
          )}
        >
          保固管理
        </a>
        <a
          href="/admin/products"
          class="px-4 py-2 rounded-lg transition-colors"
          class:font-semibold={page.url.pathname.startsWith("/admin/products")}
          class:bg-blue-100={page.url.pathname.startsWith("/admin/products")}
          class:text-blue-800={page.url.pathname.startsWith("/admin/products")}
          class:hover:bg-gray-100={!page.url.pathname.startsWith(
            "/admin/products"
          )}
          class:text-gray-700={!page.url.pathname.startsWith("/admin/products")}
        >
          產品管理
        </a>
        {#if $authStore.user?.role === "admin"}
          <a
            href="/admin/users"
            class="px-4 py-2 rounded-lg transition-colors"
            class:font-semibold={page.url.pathname.startsWith("/admin/users")}
            class:bg-blue-100={page.url.pathname.startsWith("/admin/users")}
            class:text-blue-800={page.url.pathname.startsWith("/admin/users")}
            class:hover:bg-gray-100={!page.url.pathname.startsWith(
              "/admin/users"
            )}
            class:text-gray-700={!page.url.pathname.startsWith("/admin/users")}
          >
            使用者管理
          </a>
          <a
            href="/admin/audit"
            class="px-4 py-2 rounded-lg transition-colors"
            class:font-semibold={page.url.pathname.startsWith("/admin/audit")}
            class:bg-blue-100={page.url.pathname.startsWith("/admin/audit")}
            class:text-blue-800={page.url.pathname.startsWith("/admin/audit")}
            class:hover:bg-gray-100={!page.url.pathname.startsWith(
              "/admin/audit"
            )}
            class:text-gray-700={!page.url.pathname.startsWith("/admin/audit")}
          >
            審計日誌
          </a>
        {/if}
      </nav>
    </aside>

    <!-- 手機版選單按鈕 -->
    <div class="md:hidden fixed top-4 left-4 z-50">
      <button
        onclick={toggleMobileMenu}
        class="p-2 bg-blue-600 text-white rounded-lg shadow-lg"
      >
        {#if isMobileMenuOpen}
          <X class="h-6 w-6" />
        {:else}
          <Menu class="h-6 w-6" />
        {/if}
      </button>
    </div>

    <!-- 手機版側邊欄 -->
    {#if isMobileMenuOpen}
      <div class="md:hidden fixed inset-0 z-40">
        <Button
          class="fixed inset-0 bg-black bg-opacity-50"
          onclick={closeMobileMenu}
        ></Button>
        <div class="fixed left-0 top-0 h-full w-64 bg-white shadow-lg">
          <div class="p-4 border-b">
            <div class="flex justify-between items-center">
              <h2 class="text-xl font-bold text-gray-800">管理選單</h2>
              <button onclick={closeMobileMenu} class="p-1">
                <X class="h-5 w-5" />
              </button>
            </div>
          </div>
          <nav class="p-4">
            <div class="flex flex-col space-y-2">
              <a
                href="/admin/warranties"
                onclick={closeMobileMenu}
                class="px-4 py-3 rounded-lg transition-colors"
                class:font-semibold={page.url.pathname.startsWith(
                  "/admin/warranties"
                )}
                class:bg-blue-100={page.url.pathname.startsWith(
                  "/admin/warranties"
                )}
                class:text-blue-800={page.url.pathname.startsWith(
                  "/admin/warranties"
                )}
                class:hover:bg-gray-100={!page.url.pathname.startsWith(
                  "/admin/warranties"
                )}
                class:text-gray-700={!page.url.pathname.startsWith(
                  "/admin/warranties"
                )}
              >
                保固管理
              </a>
              <a
                href="/admin/products"
                onclick={closeMobileMenu}
                class="px-4 py-3 rounded-lg transition-colors"
                class:font-semibold={page.url.pathname.startsWith(
                  "/admin/products"
                )}
                class:bg-blue-100={page.url.pathname.startsWith(
                  "/admin/products"
                )}
                class:text-blue-800={page.url.pathname.startsWith(
                  "/admin/products"
                )}
                class:hover:bg-gray-100={!page.url.pathname.startsWith(
                  "/admin/products"
                )}
                class:text-gray-700={!page.url.pathname.startsWith(
                  "/admin/products"
                )}
              >
                產品管理
              </a>
              {#if $authStore.user?.role === "admin"}
                <a
                  href="/admin/users"
                  onclick={closeMobileMenu}
                  class="px-4 py-3 rounded-lg transition-colors"
                  class:font-semibold={page.url.pathname.startsWith(
                    "/admin/users"
                  )}
                  class:bg-blue-100={page.url.pathname.startsWith(
                    "/admin/users"
                  )}
                  class:text-blue-800={page.url.pathname.startsWith(
                    "/admin/users"
                  )}
                  class:hover:bg-gray-100={!page.url.pathname.startsWith(
                    "/admin/users"
                  )}
                  class:text-gray-700={!page.url.pathname.startsWith(
                    "/admin/users"
                  )}
                >
                  使用者管理
                </a>
                <a
                  href="/admin/audit"
                  onclick={closeMobileMenu}
                  class="px-4 py-3 rounded-lg transition-colors"
                  class:font-semibold={page.url.pathname.startsWith(
                    "/admin/audit"
                  )}
                  class:bg-blue-100={page.url.pathname.startsWith(
                    "/admin/audit"
                  )}
                  class:text-blue-800={page.url.pathname.startsWith(
                    "/admin/audit"
                  )}
                  class:hover:bg-gray-100={!page.url.pathname.startsWith(
                    "/admin/audit"
                  )}
                  class:text-gray-700={!page.url.pathname.startsWith(
                    "/admin/audit"
                  )}
                >
                  審計日誌
                </a>
              {/if}
            </div>
          </nav>
        </div>
      </div>
    {/if}

    <main class="flex-1 min-w-0 bg-white p-4 md:p-6 md:ml-0">
      <slot />
    </main>
  </div>
</div>
