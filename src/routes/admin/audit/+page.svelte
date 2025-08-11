<!-- src/routes/admin/audit/+page.svelte -->
<script lang="ts">
  import { onMount, tick } from "svelte";
  import { apiService, type AuditLog } from "$lib/api";
  import { notificationStore } from "$stores/notifications";
  import Button from "$components/ui/Button.svelte";
  import Input from "$components/ui/Input.svelte";
  import Label from "$components/ui/Label.svelte";
  import { goto } from "$app/navigation";
  import { authStore } from "$stores/auth";

  let auditLogs: AuditLog[] = [];
  let isLoading = true;
  let total = 0;
  let page = 1;
  let pageSize = 20;
  let totalPages = 1;

  let filters = {
    username: "",
    action: "",
    table_name: "",
    start_date: "",
    end_date: "",
  };

  const actions = ["LOGIN", "CREATE", "UPDATE", "DELETE"];
  const tableNames = ["users", "products", "warranty_registrations", "auth"];

  async function fetchAuditLogs() {
    isLoading = true;
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("page_size", String(pageSize));
      if (filters.username) params.set("username", filters.username);
      if (filters.action) params.set("action", filters.action);
      if (filters.table_name) params.set("table_name", filters.table_name);
      if (filters.start_date) params.set("start_date", filters.start_date);
      if (filters.end_date) params.set("end_date", filters.end_date);

      const response = await apiService.getAuditLogs(params);
      if (response.data) {
        auditLogs = response.data.audit_logs;
        total = response.data.total;
        totalPages = response.data.total_pages;
      }
    } catch (e: any) {
      notificationStore.error(`無法載入審計日誌: ${e.message}`);
    } finally {
      isLoading = false;
      await tick();
    }
  }

  function handleFilterChange() {
    page = 1;
    fetchAuditLogs();
  }

  function clearFilters() {
    filters = {
      username: "",
      action: "",
      table_name: "",
      start_date: "",
      end_date: "",
    };
    handleFilterChange();
  }

  function goToPage(newPage: number) {
    if (newPage >= 1 && newPage <= totalPages) {
      page = newPage;
      fetchAuditLogs();
    }
  }

  onMount(async () => {
    try {
      await fetchAuditLogs();
    } catch (error) {
      console.error("Failed to load audit logs:", error);
    }
  });
</script>

<svelte:head>
  <title>審計日誌</title>
</svelte:head>

<div>
  <h2 class="text-2xl font-bold mb-6">審計日誌</h2>

  <div class="p-4 border rounded-lg mb-6 bg-muted/30">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div>
        <Label for="user_filter">使用者</Label>
        <Input
          id="user_filter"
          bind:value={filters.username}
          on:change={handleFilterChange}
        />
      </div>
      <div>
        <Label for="action_filter">操作</Label>
        <select
          id="action_filter"
          bind:value={filters.action}
          onchange={handleFilterChange}
          class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">全部</option>
          {#each actions as action}
            <option value={action}>{action}</option>
          {/each}
        </select>
      </div>
      <div>
        <Label for="table_filter">資料表</Label>
        <select
          id="table_filter"
          bind:value={filters.table_name}
          onchange={handleFilterChange}
          class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">全部</option>
          {#each tableNames as name}
            <option value={name}>{name}</option>
          {/each}
        </select>
      </div>
      <div>
        <Label for="start_date_filter">開始日期</Label>
        <Input
          id="start_date_filter"
          type="date"
          bind:value={filters.start_date}
          on:change={handleFilterChange}
        />
      </div>
      <div>
        <Label for="end_date_filter">結束日期</Label>
        <Input
          id="end_date_filter"
          type="date"
          bind:value={filters.end_date}
          on:change={handleFilterChange}
        />
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
    <div class="border rounded-lg overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-muted/50">
          <tr class="[&_th]:px-4 [&_th]:py-3 [&_th]:text-left">
            <th>時間</th>
            <th>使用者</th>
            <th>操作</th>
            <th>資料表</th>
            <th>IP 位址</th>
          </tr>
        </thead>
        <tbody>
          {#each auditLogs as log (log.id)}
            <tr
              class="border-t [&_td]:px-4 [&_td]:py-3 hover:bg-muted/50 cursor-pointer"
              onclick={() => goto(`/admin/audit/${log.id}`)}
            >
              <td class="whitespace-nowrap"
                >{new Date(log.created_at).toLocaleString("zh-TW")}</td
              >
              <td class="whitespace-nowrap">{log.username ?? "N/A"}</td>
              <td class="whitespace-nowrap">{log.action}</td>
              <td class="whitespace-nowrap">{log.table_name}</td>
              <td class="whitespace-nowrap">{log.ip_address}</td>
            </tr>
          {:else}
            <tr>
              <td colspan="5" class="text-center p-8 text-muted-foreground"
                >無符合條件的日誌</td
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
