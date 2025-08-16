<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import Button from "$components/ui/Button.svelte";
  import Label from "$components/ui/Label.svelte";
  import Input from "$components/ui/Input.svelte";
  import ProductFilter from "$components/ProductFilter.svelte";
  import { extractSerialNumber, isValidFullSerialLength } from "$utils/serial";
  import type {
    Serial,
    SerialCreateRequest,
    SerialUpdateRequest,
    ProductFilters,
  } from "$lib/types";
  import { apiService, type Product } from "$lib/api";

  // Props
  export let serial: Serial | null = null;
  export let isLoading = false;
  export let products: Product[] = [];

  // Events
  const dispatch = createEventDispatcher<{
    submit: SerialCreateRequest | SerialUpdateRequest;
    cancel: void;
  }>();

  // Form data
  let formData = {
    serial_number: "",
    full_serial_number: "",
    product_id: "",
  };

  let productFilters: ProductFilters = {
    brand: "Mentor",
    type: "",
    model_number: "",
    size: "",
    active: "",
  };

  // Initialize form data when serial changes
  $: if (serial) {
    formData = {
      serial_number: serial.serial_number,
      full_serial_number: serial.full_serial_number,
      product_id: serial.product_id || "",
    };

    // Set product filters for editing
    if (serial.product_id) {
      const product = products.find((p) => p.id === serial.product_id);
      if (product) {
        productFilters = {
          brand: "Mentor",
          type: product.type,
          model_number: product.model_number,
          size: product.size,
          active: product.is_active ? "true" : "false",
        };
      }
    } else {
      productFilters = {
        brand: "Mentor",
        type: "",
        model_number: "",
        size: "",
        active: "",
      };
    }
  } else {
    // Reset form for new serial
    formData = { serial_number: "", full_serial_number: "", product_id: "" };
    productFilters = {
      brand: "Mentor",
      type: "",
      model_number: "",
      size: "",
      active: "",
    };
  }

  // Handle full serial number input
  function handleFullSerialInput(e: Event) {
    const target = e.target as HTMLInputElement;
    const value = target.value;

    // Auto-extract serial number when length is exactly 54
    if (isValidFullSerialLength(value)) {
      const extractedSerial = extractSerialNumber(value);
      if (extractedSerial) {
        formData.serial_number = extractedSerial;
      }
    }
  }

  // Handle product filter changes
  async function handleProductFilterChange(filters: ProductFilters) {
    productFilters = filters;

    // Find product ID based on filter criteria
    if (filters.type && filters.model_number && filters.size) {
      const product = products.find(
        (p) =>
          p.brand === "Mentor" &&
          p.type === filters.type &&
          p.model_number === filters.model_number &&
          p.size === filters.size
      );
      if (product) {
        formData.product_id = product.id;
      }
    } else {
      formData.product_id = "";
    }
  }

  // Handle form submission
  function handleSubmit() {
    if (serial) {
      // Update existing serial
      const updateData: SerialUpdateRequest = {};
      if (formData.serial_number !== serial.serial_number) {
        updateData.serial_number = formData.serial_number;
      }
      if (formData.full_serial_number !== serial.full_serial_number) {
        updateData.full_serial_number = formData.full_serial_number;
      }
      if (formData.product_id !== (serial.product_id || "")) {
        updateData.product_id = formData.product_id || undefined;
      }

      dispatch("submit", updateData);
    } else {
      // Create new serial
      const createData: SerialCreateRequest = {
        serial_number: formData.serial_number,
        full_serial_number: formData.full_serial_number,
        product_id: formData.product_id,
      };
      dispatch("submit", createData);
    }
  }

  function handleCancel() {
    dispatch("cancel");
  }
</script>

<form on:submit|preventDefault={handleSubmit} class="space-y-4">
  <div>
    <Label for="full_serial_number">完整序號 *</Label>
    <Input
      id="full_serial_number"
      bind:value={formData.full_serial_number}
      placeholder="請輸入完整序號"
      required
      maxlength={100}
      on:input={handleFullSerialInput}
    />
    {#if formData.full_serial_number && !isValidFullSerialLength(formData.full_serial_number)}
      <p class="text-sm text-amber-600 mt-1">
        完整序號長度應為54位元，輸入正確長度後將自動提取序號
      </p>
    {/if}
  </div>

  <div>
    <Label for="serial_number">序號 *</Label>
    <Input
      id="serial_number"
      bind:value={formData.serial_number}
      placeholder="將從完整序號自動提取"
      required
      maxlength={20}
      readonly={isValidFullSerialLength(formData.full_serial_number)}
      class={isValidFullSerialLength(formData.full_serial_number)
        ? "bg-gray-50"
        : ""}
    />
    {#if formData.serial_number && isValidFullSerialLength(formData.full_serial_number)}
      <p class="text-sm text-green-600 mt-1">序號已自動提取自完整序號</p>
    {/if}
  </div>

  <div>
    <Label>產品選擇 *</Label>
    <div class="border rounded-lg p-4 bg-muted/30">
      <ProductFilter
        bind:filters={productFilters}
        getAllMetadata={true}
        onFiltersChange={handleProductFilterChange}
        presetBrand="Mentor"
      />
    </div>
    {#if !formData.product_id}
      <p class="text-sm text-amber-600 mt-1">
        請選擇品牌、類型、型號和尺寸來確定產品
      </p>
    {/if}
  </div>

  <div class="flex justify-end gap-2 pt-4">
    <Button type="button" variant="outline" onclick={handleCancel}>取消</Button>
    <Button
      type="submit"
      disabled={isLoading ||
        formData.serial_number === "" ||
        formData.full_serial_number === "" ||
        formData.product_id === ""}
    >
      {isLoading ? "儲存中..." : serial ? "更新" : "新增"}
    </Button>
  </div>
</form>
