<!-- src/components/NotificationContainer.svelte -->
<script lang="ts">
  import { notificationStore } from "$stores/notifications";
  import Notification from "$components/ui/Notification.svelte";
  import { flip } from "svelte/animate";
</script>

<div
  class="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col-reverse gap-4"
>
  {#each $notificationStore as notification (notification.id)}
    <div animate:flip={{ duration: 300 }}>
      <Notification
        {notification}
        onDismiss={(id) => notificationStore.remove(id)}
      />
    </div>
  {/each}
</div>
