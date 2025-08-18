<!-- src/components/ProductForm.svelte -->
<script lang="ts">
  import type { Product, CreateProductRequest } from "$lib/api";
  import Button from "$components/ui/Button.svelte";
  import Input from "$components/ui/Input.svelte";
  import Label from "$components/ui/Label.svelte";
  import Switch from "$components/ui/Switch.svelte";
  import { Info } from "lucide-svelte";

  export let product: Product | null = null;
  export let isLoading = false;
  export let onSubmit: (
    data: CreateProductRequest & { is_active?: boolean }
  ) => void;
  export let onCancel: () => void;

  let formData: CreateProductRequest & { is_active?: boolean } = {
    model_number: "",
    brand: "",
    type: "",
    size: "",
    warranty_years: 10,
    description: "",
    is_active: true,
  };

  $: if (product) {
    formData = {
      model_number: product.model_number,
      brand: product.brand,
      type: product.type,
      size: product.size,
      warranty_years: product.warranty_years,
      description: product.description,
      is_active: product.is_active,
    };
  }
</script>

<form on:submit|preventDefault={() => onSubmit(formData)} class="space-y-6">
  <div class="grid grid-cols-2 gap-4">
    <div class="space-y-2">
      <Label for="brand">品牌</Label>
      <Input id="brand" bind:value={formData.brand} required />
    </div>
    <div class="space-y-2">
      <Label for="type">類型</Label>
      <Input id="type" bind:value={formData.type} required />
    </div>
  </div>
  <div class="grid grid-cols-2 gap-4">
    <div class="space-y-2">
      <Label for="model_number">型號</Label>
      <Input id="model_number" bind:value={formData.model_number} required />
    </div>
    <div class="space-y-2">
      <Label for="size">尺寸</Label>
      <Input id="size" bind:value={formData.size} required />
    </div>
  </div>
  <div class="space-y-2">
    <Label for="warranty_years">保固年限</Label>
    <Input
      id="warranty_years"
      type="number"
      bind:value={formData.warranty_years}
      min="-1"
      required
    />
    <p class="text-xs text-muted-foreground">
      <Info class="h-3 w-3 inline mr-1" />
      輸入 -1 表示永久保固，0 表示無保固，其他數字表示保固年數
    </p>
  </div>
  <div class="space-y-2">
    <Label for="description">描述</Label>
    <textarea
      id="description"
      bind:value={formData.description}
      class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    ></textarea>
  </div>
  <div class="flex items-center justify-between">
    <Label for="is_active" class="text-sm font-medium">啟用產品</Label>
    <Switch id="is_active" bind:checked={formData.is_active} />
  </div>
  <div class="flex justify-end gap-3 pt-6">
    <Button type="button" variant="outline" onclick={onCancel}>取消</Button>
    <Button type="submit" disabled={isLoading}>
      {#if isLoading}
        儲存中...
      {:else}
        儲存
      {/if}
    </Button>
  </div>
</form>
