<!-- src/components/ui/Notification.svelte -->
<script lang="ts">
  import type { Notification } from "$stores/notifications";
  import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-svelte";

  export let notification: Notification;
  export let onDismiss: (id: string) => void;

  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  // Type assertion to access timeout property
  const timeout = (notification as any).timeout;
  if (timeout && timeout > 0) {
    timeoutId = setTimeout(() => onDismiss(notification.id), timeout);
  }

  function handleDismiss() {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    onDismiss(notification.id);
  }
</script>

<div
  class="pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg border bg-background shadow-lg"
>
  <div class="p-4">
    <div class="flex items-start">
      <div class="flex-shrink-0">
        {#if notification.type === "success"}
          <CheckCircle class="h-6 w-6 text-green-500" />
        {:else if notification.type === "error"}
          <XCircle class="h-6 w-6 text-red-500" />
        {:else if notification.type === "warning"}
          <AlertTriangle class="h-6 w-6 text-yellow-500" />
        {:else}
          <Info class="h-6 w-6 text-blue-500" />
        {/if}
      </div>
      <div class="ml-3 w-0 flex-1 pt-0.5">
        <p class="text-sm font-medium text-foreground">
          {notification.message}
        </p>
      </div>
      <div class="ml-4 flex flex-shrink-0">
        <button
          onclick={handleDismiss}
          class="inline-flex rounded-md bg-background text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
        >
          <span class="sr-only">Close</span>
          <X class="h-5 w-5" />
        </button>
      </div>
    </div>
  </div>
</div>
