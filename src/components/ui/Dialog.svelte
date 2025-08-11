<!-- src/components/ui/Dialog.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { browser } from "$app/environment";
  import { twMerge } from "tailwind-merge";

  export let isOpen = false;
  export let title = "";
  export let onClose: () => void;

  // 使用 tailwind-merge 智能合併內部 class 和外部傳入的 class
  $: dialogClass = twMerge(
    "fixed left-1/2 top-1/2 z-50 w-full max-w-6xl -translate-x-1/2 -translate-y-1/2 transform rounded-lg border bg-background p-6 shadow-lg",
    $$restProps.class || ""
  );

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      onClose();
    }
  }

  onMount(() => {
    if (browser) {
      document.addEventListener("keydown", handleKeydown);
    }
  });

  onDestroy(() => {
    if (browser) {
      document.removeEventListener("keydown", handleKeydown);
    }
  });
</script>

{#if isOpen}
  <div
    class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
    aria-hidden="true"
    onclick={onClose}
  ></div>

  <div
    class={dialogClass}
    role="dialog"
    aria-labelledby="dialog-title"
    aria-modal="true"
  >
    <div class="flex flex-col space-y-1.5 text-center sm:text-left">
      <h2
        id="dialog-title"
        class="text-lg font-semibold leading-none tracking-tight"
      >
        {title}
      </h2>
    </div>
    <div class="py-4">
      <slot />
    </div>
  </div>
{/if}
