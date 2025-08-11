<script lang="ts">
  import { onMount, tick } from "svelte";
  import {
    apiService,
    type User,
    type CreateUserRequest,
    type UpdateUserRequest,
  } from "$lib/api";
  import { notificationStore } from "$stores/notifications";
  import Button from "$components/ui/Button.svelte";
  import Dialog from "$components/ui/Dialog.svelte";
  import UserForm from "$components/UserForm.svelte";
  import Label from "$components/ui/Label.svelte";
  import { authStore } from "$stores/auth";
  import { Plus, FilePenLine, Trash2 } from "lucide-svelte";
  import { goto } from "$app/navigation";

  let users: User[] = [];
  let isLoading = true;
  let isFormLoading = false;
  let isDialogOpen = false;
  let selectedUser: User | null = null;

  $: currentUser = $authStore.user;

  let total = 0;
  let page = 1;
  let pageSize = 10;
  let totalPages = 1;

  let filters = {
    role: "",
    is_active: "",
  };

  const roleMapping = {
    admin: "所有權限",
    editor: "編輯權限",
    readonly: "閱覽權限",
  };

  async function fetchUsers() {
    isLoading = true;
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("page_size", String(pageSize));
      if (filters.role) params.set("role", filters.role);
      if (filters.is_active !== "") params.set("is_active", filters.is_active);

      const response = await apiService.getUsers(params);
      if (response.data) {
        users = response.data.users;
        total = response.data.total;
        totalPages = response.data.total_pages;
      }
    } catch (e: any) {
      notificationStore.error(`無法載入使用者列表: ${e.message}`);
    } finally {
      isLoading = false;
      await tick();
    }
  }

  function handleFilterChange() {
    page = 1;
    fetchUsers();
  }

  function clearFilters() {
    filters = { role: "", is_active: "" };
    handleFilterChange();
  }

  function goToPage(newPage: number) {
    if (newPage >= 1 && newPage <= totalPages) {
      page = newPage;
      fetchUsers();
    }
  }

  function openCreateForm() {
    selectedUser = null;
    isDialogOpen = true;
  }

  function openEditForm(user: User) {
    if (user.id === currentUser?.id) {
      notificationStore.warning("無法編輯自己的帳號。");
      return;
    }
    selectedUser = user;
    isDialogOpen = true;
  }

  function closeDialog() {
    isDialogOpen = false;
    selectedUser = null;
  }

  async function handleFormSubmit(data: CreateUserRequest | UpdateUserRequest) {
    isFormLoading = true;
    try {
      if (selectedUser) {
        await apiService.updateUser(selectedUser.id, data);
        notificationStore.success("使用者更新成功");
      } else {
        await apiService.createUser(data as CreateUserRequest);
        notificationStore.success("使用者新增成功");
      }
      closeDialog();
      await fetchUsers();
    } catch (e: any) {
      notificationStore.error(`儲存失敗: ${e.message}`);
    } finally {
      isFormLoading = false;
    }
  }

  async function handleDelete(userId: string) {
    if (userId === currentUser?.id) {
      notificationStore.warning("無法刪除自己的帳號。");
      return;
    }
    if (!confirm("您確定要刪除這位使用者嗎？")) {
      return;
    }
    try {
      await apiService.deleteUser(userId);
      notificationStore.success("使用者已刪除");
      await fetchUsers();
    } catch (e: any) {
      notificationStore.error(`刪除失敗: ${e.message}`);
    }
  }

  onMount(async () => {
    try {
      await fetchUsers();
    } catch (error) {
      console.error("Failed to load users:", error);
    }
  });
</script>

<svelte:head>
  <title>使用者管理</title>
</svelte:head>

<div>
  <div class="flex justify-between items-center mb-6">
    <h2 class="text-2xl font-bold">使用者列表</h2>
    <Button onclick={openCreateForm}>
      <Plus class="mr-2 h-4 w-4" />
      新增使用者
    </Button>
  </div>

  <!-- 手機版搜尋區域 -->
  <div class="md:hidden mb-6">
    <div class="p-4 border rounded-lg bg-muted/30">
      <div class="space-y-4">
        <div>
          <Label for="mobile_role_filter">角色</Label>
          <select
            id="mobile_role_filter"
            bind:value={filters.role}
            on:change={handleFilterChange}
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">全部</option>
            <option value="editor">{roleMapping.editor}</option>
            <option value="admin">{roleMapping.admin}</option>
            <option value="readonly">{roleMapping.readonly}</option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <Label for="mobile_status_filter">狀態</Label>
            <select
              id="mobile_status_filter"
              bind:value={filters.is_active}
              on:change={handleFilterChange}
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">全部</option>
              <option value="true">啟用</option>
              <option value="false">停用</option>
            </select>
          </div>
          <div class="flex items-end">
            <Button variant="ghost" onclick={clearFilters} class="w-full"
              >清除</Button
            >
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 桌面版篩選區域 -->
  <div class="hidden md:block p-4 border rounded-lg mb-6 bg-muted/30">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <Label for="role_filter">角色</Label>
        <select
          id="role_filter"
          bind:value={filters.role}
          on:change={handleFilterChange}
          class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">全部</option>
          <option value="editor">{roleMapping.editor}</option>
          <option value="admin">{roleMapping.admin}</option>
          <option value="readonly">{roleMapping.readonly}</option>
        </select>
      </div>
      <div>
        <Label for="status_filter">狀態</Label>
        <select
          id="status_filter"
          bind:value={filters.is_active}
          on:change={handleFilterChange}
          class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">全部</option>
          <option value="true">啟用</option>
          <option value="false">停用</option>
        </select>
      </div>
      <div class="flex items-end">
        <Button variant="ghost" onclick={clearFilters}>清除篩選</Button>
      </div>
    </div>
  </div>

  {#if isLoading}
    <div class="text-center p-8">
      <p>載入中...</p>
    </div>
  {:else}
    <!-- 手機版卡片佈局 -->
    <div class="md:hidden space-y-4">
      {#each users as user (user.id)}
        <div class="border rounded-lg p-4 bg-white shadow-sm">
          <div class="flex justify-between items-start mb-3">
            <div>
              <h3 class="font-semibold text-lg">{user.username}</h3>
              <p class="text-sm text-gray-600">{user.email}</p>
            </div>
            <span
              class="px-2 py-1 rounded-full text-xs {user.is_active
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'}"
            >
              {user.is_active ? "啟用" : "停用"}
            </span>
          </div>

          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">角色:</span>
              <span class="capitalize">{roleMapping[user.role]}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">建立時間:</span>
              <span
                >{new Date(user.created_at).toLocaleDateString("zh-TW")}</span
              >
            </div>
          </div>

          <div class="flex gap-2 mt-4 pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onclick={() => openEditForm(user)}
              class="flex-1"
            >
              <FilePenLine class="mr-1 h-4 w-4" />
              編輯
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onclick={() => handleDelete(user.id)}
              class="flex-1"
            >
              <Trash2 class="mr-1 h-4 w-4" />
              刪除
            </Button>
          </div>
        </div>
      {:else}
        <div class="text-center p-8 text-muted-foreground border rounded-lg">
          無符合條件的使用者記錄
        </div>
      {/each}
    </div>

    <!-- 桌面版表格佈局 -->
    <div class="hidden md:block border rounded-lg overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-muted/50">
          <tr class="[&_th]:px-4 [&_th]:py-3 [&_th]:text-left">
            <th>使用者名稱</th>
            <th>電子郵件</th>
            <th>角色</th>
            <th>狀態</th>
            <th>建立時間</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {#each users as user (user.id)}
            <tr class="border-t [&_td]:px-4 [&_td]:py-3">
              <td class="font-medium">{user.username}</td>
              <td>{user.email}</td>
              <td class="capitalize">{roleMapping[user.role]}</td>
              <td>
                <span
                  class="px-2 py-1 rounded-full text-xs {user.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'}"
                >
                  {user.is_active ? "啟用" : "停用"}
                </span>
              </td>
              <td class="whitespace-nowrap">
                {new Date(user.created_at).toLocaleDateString("zh-TW")}
              </td>
              <td class="whitespace-nowrap flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onclick={() => openEditForm(user)}
                  class="w-9 h-9 p-0 flex items-center justify-center"
                >
                  <FilePenLine class="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onclick={() => handleDelete(user.id)}
                  class="w-9 h-9 p-0 flex items-center justify-center"
                >
                  <Trash2 class="h-4 w-4" />
                </Button>
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="6" class="text-center p-8 text-muted-foreground"
                >無符合條件的使用者記錄</td
              >
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <div class="flex justify-between items-center mt-4">
      <p class="text-sm text-muted-foreground">共 {total} 筆資料</p>
      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onclick={() => goToPage(page - 1)}
          disabled={page <= 1}
        >
          上一頁
        </Button>
        <span>第 {page} / {totalPages} 頁</span>
        <Button
          variant="outline"
          size="sm"
          onclick={() => goToPage(page + 1)}
          disabled={page >= totalPages}
        >
          下一頁
        </Button>
      </div>
    </div>
  {/if}
</div>

<Dialog
  bind:isOpen={isDialogOpen}
  title={selectedUser ? "編輯使用者" : "新增使用者"}
  onClose={closeDialog}
  class="max-w-lg"
>
  <UserForm
    user={selectedUser}
    isLoading={isFormLoading}
    onSubmit={handleFormSubmit}
    onCancel={closeDialog}
  />
</Dialog>
