<!-- src/components/ui/Input.svelte -->
<script lang="ts">
  import { tv, type VariantProps } from "tailwind-variants";

  const inputVariants = tv({
    base: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  });

  type $$Props = {
    value?: string | number;
    class?: string;
  } & import("svelte/elements").HTMLInputAttributes;

  export let value: $$Props["value"] = undefined;
  let className: $$Props["class"] = undefined;
  export { className as class };
</script>

<input
  class={inputVariants({ class: className })}
  bind:value
  {...$$restProps}
  on:blur
  on:change
  on:keydown
  on:keyup
  on:focus
  on:input
/>
