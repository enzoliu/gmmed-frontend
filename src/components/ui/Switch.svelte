<!-- src/components/ui/Switch.svelte -->
<script lang="ts">
  import { tv, type VariantProps } from "tailwind-variants";

  const switchVariants = tv({
    base: "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
  });

  const thumbVariants = tv({
    base: "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
  });

  type $$Props = {
    checked?: boolean;
    class?: string;
  } & import("svelte/elements").HTMLButtonAttributes;

  export let checked: $$Props["checked"] = false;
  let className: $$Props["class"] = undefined;
  export { className as class };

  function handleClick() {
    checked = !checked;
  }
</script>

<button
  type="button"
  role="switch"
  aria-checked={checked}
  data-state={checked ? "checked" : "unchecked"}
  class={switchVariants({ class: className })}
  onclick={handleClick}
  {...$$restProps}
>
  <span data-state={checked ? "checked" : "unchecked"} class={thumbVariants()}>
  </span>
</button>
