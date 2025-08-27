<!-- src/components/ui/Checkbox.svelte -->
<script lang="ts">
  import { tv, type VariantProps } from "tailwind-variants";

  const checkboxVariants = tv({
    base: "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
  });

  type $$Props = {
    checked?: boolean;
    class?: string;
    onCheckedChange?: (checked: boolean) => void;
  } & import("svelte/elements").HTMLInputAttributes;

  export let checked: $$Props["checked"] = undefined;
  export let onCheckedChange: $$Props["onCheckedChange"] = undefined;
  let className: $$Props["class"] = undefined;
  export { className as class };

  function handleChange(event: Event) {
    const target = event.target as HTMLInputElement;
    checked = target.checked;
    onCheckedChange?.(checked);
  }
</script>

<input
  type="checkbox"
  {checked}
  class={checkboxVariants({ class: className })}
  on:change={handleChange}
  {...$$restProps}
/>
