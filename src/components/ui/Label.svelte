<!-- src/components/ui/Label.svelte -->
<script lang="ts">
  import { tv, type VariantProps } from "tailwind-variants";

  const labelVariants = tv({
    base: "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
  });

  type $$Props = {
    class?: string;
  } & import("svelte/elements").HTMLLabelAttributes;

  let className: $$Props["class"] = undefined;
  export { className as class };
</script>

<label class={labelVariants({ class: className })} {...$$restProps}>
  <slot />
</label>
