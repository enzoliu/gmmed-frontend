<script lang="ts">
  import { page } from "$app/state";
  import { onMount, tick } from "svelte";
  import { apiService, type AuditLog } from "$lib/api";
  import { notificationStore } from "$stores/notifications";
  import Button from "$components/ui/Button.svelte";
  import { goto } from "$app/navigation";
  import { browser } from "$app/environment";
  import {
    ArrowLeft,
    User,
    Clock,
    Monitor,
    Database,
    Activity,
    FileText,
    Globe,
  } from "lucide-svelte";
  import { authStore } from "$stores/auth";
  import Dialog from "$components/ui/Dialog.svelte";

  let auditLog: AuditLog | null = null;
  let isLoading = true;
  let error: string | null = null;

  // Dialog 狀態
  let showDiffDialog = false;
  let diffDialogKey: string | null = null;
  let diffDialogOld: any = null;
  let diffDialogNew: any = null;
  let diffDialogDiff: {
    oldResult: { line: string; type: string }[];
    newResult: { line: string; type: string }[];
  } | null = null;

  async function loadAuditLog() {
    isLoading = true;
    error = null;
    try {
      const id = page.params.id;
      const response = await apiService.getAuditLogById(id);
      if (response.data) {
        auditLog = response.data;
      } else {
        throw new Error(
          response.message || response.error || "找不到指定的審計日誌"
        );
      }
    } catch (e: any) {
      error = e.message;
      notificationStore.error(`載入資料失敗: ${e.message}`);
    } finally {
      isLoading = false;
      await tick();
    }
  }

  onMount(async () => {
    try {
      await loadAuditLog();
    } catch (error) {
      console.error("Failed to load audit log:", error);
    }
  });

  function formatDate(dateString?: string) {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("zh-TW", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  function getActionClass(action?: string) {
    switch (action) {
      case "CREATE":
        return "bg-green-100 text-green-800";
      case "UPDATE":
        return "bg-blue-100 text-blue-800";
      case "DELETE":
        return "bg-red-100 text-red-800";
      case "LOGIN":
        return "bg-purple-100 text-purple-800";
      case "VIEW":
        return "bg-gray-100 text-gray-800";
      case "EXPORT":
        return "bg-orange-100 text-orange-800";
      case "IMPORT":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  function goBack() {
    if (browser) {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        goto("/admin/audit"); // Default back location for audit list page
      }
    }
  }

  function formatJsonData(data: Record<string, any> | null) {
    if (!data || Object.keys(data).length === 0) {
      return "無資料";
    }
    return JSON.stringify(data, null, 2);
  }

  // 比對 old_values 和 new_values，產生 diff 標示
  function getDiffKeys(
    oldObj: Record<string, any>,
    newObj: Record<string, any>
  ) {
    const allKeys = Array.from(
      new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})])
    );
    return allKeys;
  }

  function getDiffType(
    key: string,
    oldObj: Record<string, any>,
    newObj: Record<string, any>
  ) {
    const oldHas = Object.prototype.hasOwnProperty.call(oldObj, key);
    const newHas = Object.prototype.hasOwnProperty.call(newObj, key);
    if (oldHas && !newHas) return "removed"; // 只在舊有，刪除
    if (!oldHas && newHas) return "added"; // 只在新有，新增
    if (oldHas && newHas) {
      const oldVal = oldObj[key];
      const newVal = newObj[key];
      // 若為物件，使用 JSON.stringify 比較內容
      if (typeof oldVal === "object" && typeof newVal === "object") {
        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) return "changed";
      } else {
        if (oldVal !== newVal) return "changed";
      }
    }
    return "unchanged";
  }

  function openDiffDialog(key: string, oldVal: any, newVal: any) {
    diffDialogKey = key;
    diffDialogOld = oldVal;
    diffDialogNew = newVal;
    diffDialogDiff = getDiffLines(oldVal, newVal);
    showDiffDialog = true;
  }
  function closeDiffDialog() {
    showDiffDialog = false;
    diffDialogKey = null;
    diffDialogOld = null;
    diffDialogNew = null;
    diffDialogDiff = null;
  }

  function getFullValue(val: any) {
    return typeof val === "object" && val !== null
      ? JSON.stringify(val)
      : String(val);
  }
  function getShortValue(key: string, val: any) {
    const str = getFullValue(val);
    if (key.length + str.length > 40) return str.slice(0, 20) + "...";
    return str;
  }

  // 行級diff工具
  function getDiffLines(oldVal: any, newVal: any) {
    const oldStr =
      typeof oldVal === "object" && oldVal !== null
        ? JSON.stringify(oldVal, null, 2)
        : String(oldVal);
    const newStr =
      typeof newVal === "object" && newVal !== null
        ? JSON.stringify(newVal, null, 2)
        : String(newVal);

    const oldLines = oldStr.split("\n");
    const newLines = newStr.split("\n");
    const maxLen = Math.max(oldLines.length, newLines.length);
    let oldResult = [];
    let newResult = [];
    for (let i = 0; i < maxLen; i++) {
      const o = oldLines[i].trim();
      const n = newLines[i].trim();
      if (o === n) {
        oldResult.push({ line: o ?? "", type: "same" });
        newResult.push({ line: n ?? "", type: "same" });
      } else {
        if (o !== undefined)
          oldResult.push({
            line: o,
            type: n === undefined ? "removed" : "changed",
          });
        if (n !== undefined)
          newResult.push({
            line: n,
            type: o === undefined ? "added" : "changed",
          });
      }
    }
    return { oldResult, newResult };
  }
</script>

<svelte:head>
  <title>審計日誌詳情 - {auditLog?.id ?? "查詢"}</title>
</svelte:head>

<!-- 
  這個 div 是此頁面的根元素，用來覆蓋從根佈局繼承的背景。
  它設定了白色背景，並確保最小高度為全螢幕。
-->
<div class="min-h-screen w-full bg-white" style="background-image: none;">
  <div class="container mx-auto max-w-4xl py-8">
    {#if isLoading}
      <div class="flex h-64 items-center justify-center">
        <p>載入中...</p>
      </div>
    {:else if error}
      <div class="rounded-lg bg-destructive/10 p-12 text-center">
        <p class="font-semibold text-destructive">錯誤: {error}</p>
        <Button onclick={goBack} class="mt-4">返回</Button>
      </div>
    {:else if auditLog}
      <div class="space-y-8">
        <!-- 頁面標題和返回按鈕 -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <Button variant="ghost" onclick={goBack} class="p-2">
              <ArrowLeft class="h-5 w-5" />
            </Button>
            <div>
              <h1 class="text-3xl font-bold">審計日誌詳情</h1>
              <p class="text-muted-foreground">ID: {auditLog.id}</p>
            </div>
          </div>
        </div>

        <!-- 主要資訊卡片 -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- 基本資訊 -->
          <div class="space-y-6">
            <div class="rounded-lg border bg-card p-6">
              <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
                <Activity class="h-5 w-5" />
                基本資訊
              </h2>
              <div class="space-y-4">
                <div>
                  <div class="text-muted-foreground text-sm mb-1">操作類型</div>
                  <span
                    class="px-2 py-1 rounded-full text-sm font-medium {getActionClass(
                      auditLog.action
                    )}"
                  >
                    {auditLog.action}
                  </span>
                </div>
                <div>
                  <div class="text-muted-foreground text-sm mb-1">資料表</div>
                  <div class="font-medium break-all">{auditLog.table_name}</div>
                </div>
                <div>
                  <div class="text-muted-foreground text-sm mb-1">記錄ID</div>
                  <div class="font-medium break-all">
                    {auditLog.record_id || "N/A"}
                  </div>
                </div>
                <div>
                  <div class="text-muted-foreground text-sm mb-1">建立時間</div>
                  <div class="font-medium">
                    {formatDate(auditLog.created_at)}
                  </div>
                </div>
              </div>
            </div>

            <!-- 使用者資訊 -->
            <div class="rounded-lg border bg-card p-6">
              <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
                <User class="h-5 w-5" />
                使用者資訊
              </h2>
              <div class="space-y-4">
                <div>
                  <div class="text-muted-foreground text-sm mb-1">
                    使用者名稱
                  </div>
                  <div class="font-medium break-all">
                    {auditLog.username || "N/A"}
                  </div>
                </div>
                <div>
                  <div class="text-muted-foreground text-sm mb-1">電子郵件</div>
                  <div class="font-medium break-all">
                    {auditLog.email || "N/A"}
                  </div>
                </div>
                <div>
                  <div class="text-muted-foreground text-sm mb-1">使用者ID</div>
                  <div class="font-medium break-all">{auditLog.user_id}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 網路資訊 -->
          <div class="space-y-6">
            <div class="rounded-lg border bg-card p-6">
              <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
                <Globe class="h-5 w-5" />
                網路資訊
              </h2>
              <div class="space-y-4">
                <div>
                  <div class="text-muted-foreground text-sm mb-1">IP 位址</div>
                  <div class="font-medium break-all">{auditLog.ip_address}</div>
                </div>
                <div>
                  <div class="text-muted-foreground text-sm mb-1">
                    User Agent
                  </div>
                  <div
                    class="font-medium text-sm break-all whitespace-pre-line"
                  >
                    {auditLog.user_agent}
                  </div>
                </div>
              </div>
            </div>

            <!-- 時間資訊 -->
            <div class="rounded-lg border bg-card p-6">
              <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
                <Clock class="h-5 w-5" />
                時間資訊
              </h2>
              <div class="space-y-4">
                <div>
                  <div class="text-muted-foreground text-sm mb-1">操作時間</div>
                  <div class="font-medium">
                    {formatDate(auditLog.created_at)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 資料變更詳情 -->
        <div class="rounded-lg border bg-card p-6">
          <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
            <Database class="h-5 w-5" />
            資料變更詳情
          </h2>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <!-- 變更前資料 -->
            <div>
              <h3 class="text-lg font-medium mb-3 text-muted-foreground">
                變更前資料
              </h3>
              <div
                class="bg-muted/30 rounded-lg p-4 overflow-x-auto max-w-full"
              >
                {#if auditLog.old_values && Object.keys(auditLog.old_values).length > 0}
                  {#each getDiffKeys(auditLog.old_values, auditLog.new_values) as key}
                    {#if Object.prototype.hasOwnProperty.call(auditLog.old_values, key)}
                      <div class="mb-3">
                        <div class="flex gap-2 items-center break-all">
                          <span class="font-mono text-xs text-muted-foreground"
                            >{key}:</span
                          >
                          <span
                            class="font-mono text-xs px-1 rounded"
                            style="white-space: pre-wrap; word-break: break-all;"
                            class:bg-red-100={getDiffType(
                              key,
                              auditLog.old_values,
                              auditLog.new_values
                            ) === "removed" ||
                              getDiffType(
                                key,
                                auditLog.old_values,
                                auditLog.new_values
                              ) === "changed"}
                          >
                            {getShortValue(key, auditLog.old_values[key])}
                          </span>
                          {#if getShortValue(key, auditLog.old_values[key]) !== getFullValue(auditLog.old_values[key])}
                            <button
                              type="button"
                              class="text-primary underline cursor-pointer text-xs bg-transparent border-0 p-0"
                              onclick={() =>
                                openDiffDialog(
                                  key,
                                  auditLog && auditLog.old_values
                                    ? auditLog.old_values[key]
                                    : "",
                                  auditLog && auditLog.new_values
                                    ? auditLog.new_values[key]
                                    : ""
                                )}>顯示詳細</button
                            >
                          {/if}
                        </div>
                      </div>
                    {/if}
                  {/each}
                {:else}
                  <span class="text-muted-foreground">無資料</span>
                {/if}
              </div>
            </div>
            <!-- 變更後資料 -->
            <div>
              <h3 class="text-lg font-medium mb-3 text-muted-foreground">
                變更後資料
              </h3>
              <div
                class="bg-muted/30 rounded-lg p-4 overflow-x-auto max-w-full"
              >
                {#if auditLog.new_values && Object.keys(auditLog.new_values).length > 0}
                  {#each getDiffKeys(auditLog.old_values, auditLog.new_values) as key}
                    {#if Object.prototype.hasOwnProperty.call(auditLog.new_values, key)}
                      <div class="mb-3">
                        <div class="flex gap-2 items-center break-all">
                          <span class="font-mono text-xs text-muted-foreground"
                            >{key}:</span
                          >
                          <span
                            class="font-mono text-xs px-1 rounded"
                            style="white-space: pre-wrap; word-break: break-all;"
                            class:bg-green-100={getDiffType(
                              key,
                              auditLog.old_values,
                              auditLog.new_values
                            ) === "added" ||
                              getDiffType(
                                key,
                                auditLog.old_values,
                                auditLog.new_values
                              ) === "changed"}
                          >
                            {getShortValue(key, auditLog.new_values[key])}
                          </span>
                          {#if getShortValue(key, auditLog.new_values[key]) !== getFullValue(auditLog.new_values[key])}
                            <button
                              type="button"
                              class="text-primary underline cursor-pointer text-xs bg-transparent border-0 p-0"
                              onclick={() =>
                                openDiffDialog(
                                  key,
                                  auditLog && auditLog.old_values
                                    ? auditLog.old_values[key]
                                    : "",
                                  auditLog && auditLog.new_values
                                    ? auditLog.new_values[key]
                                    : ""
                                )}>顯示詳細</button
                            >
                          {/if}
                        </div>
                      </div>
                    {/if}
                  {/each}
                {:else}
                  <span class="text-muted-foreground">無資料</span>
                {/if}
              </div>
            </div>
          </div>
        </div>

        <!-- 操作按鈕 -->
        <div class="flex justify-center">
          <Button onclick={goBack} variant="outline">返回列表</Button>
        </div>
      </div>
    {/if}

    <Dialog
      bind:isOpen={showDiffDialog}
      onClose={closeDiffDialog}
      title="詳細比較"
    >
      <div class="space-y-4">
        <div>
          <div class="font-bold mb-1">欄位名稱：{diffDialogKey}</div>
          {#if diffDialogDiff}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div class="text-muted-foreground text-xs mb-1">變更前</div>
                <div
                  class="bg-muted/30 rounded p-2 text-xs whitespace-pre-wrap break-all"
                >
                  {#each diffDialogDiff.oldResult as item}
                    <span
                      class={item.type === "removed" || item.type === "changed"
                        ? "bg-red-100"
                        : ""}
                      style="display: block;">{item.line.trim()}</span
                    >
                  {/each}
                </div>
              </div>
              <div>
                <div class="text-muted-foreground text-xs mb-1">變更後</div>
                <div
                  class="bg-muted/30 rounded p-2 text-xs whitespace-pre-wrap break-all"
                >
                  {#each diffDialogDiff.newResult as item}
                    <span
                      class={item.type === "added" || item.type === "changed"
                        ? "bg-green-100"
                        : ""}
                      style="display: block;">{item.line.trim()}</span
                    >
                  {/each}
                </div>
              </div>
            </div>
          {/if}
        </div>
        <div class="flex justify-end">
          <Button onclick={closeDiffDialog}>關閉</Button>
        </div>
      </div>
    </Dialog>
  </div>
</div>
