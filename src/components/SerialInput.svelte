<script lang="ts">
  import { apiService, type SerialCheckState } from "$lib/api";
  import { CheckCircle, Loader2 } from "lucide-svelte";
  import Input from "./ui/Input.svelte";
  import Label from "./ui/Label.svelte";
  import Cleave from "cleave.js";
  import { onMount } from "svelte";

  export let serial1: SerialCheckState;
  export let serial2: SerialCheckState;
  export let formSerial1: string;
  export let formSerial2: string;
  export let warrantyId: string;
  export let onUpdate: (serial1: string, serial2: string) => void;

  async function getProductInfo(productId: string) {
    // get product info from api
    const response = await apiService.getProductByCondition(
      new URLSearchParams({
        id: productId,
      })
    );
    if (response.data) {
      return response.data;
    }
    return null;
  }

  async function checkSerialNumber(
    serialNumber: string,
    isSecondSerial: boolean
  ) {
    if (!serialNumber.trim()) {
      if (isSecondSerial) {
        serial2 = {
          isChecking: false,
          exists: false,
          formatError: null,
          product_id: "",
          product_info: null,
        };
      } else {
        serial1 = {
          isChecking: false,
          exists: false,
          formatError: null,
          product_id: "",
          product_info: null,
        };
      }
      onUpdate(formSerial1, formSerial2);
      return;
    }

    // 檢查兩個序號是否相同
    if (isSecondSerial && serialNumber === formSerial1) {
      serial2 = {
        isChecking: false,
        exists: true,
        formatError: "兩個序號不能相同",
        product_id: "",
        product_info: null,
      };
      onUpdate(formSerial1, formSerial2);
      return;
    }

    // 驗證序號格式：7個數字 + dash + 3個數字 (例：1234567-123)
    const serialFormat = /^\d{7}-\d{3}$/;
    if (!serialFormat.test(serialNumber)) {
      const formatError =
        "序號格式不正確，正確格式為：1234567-123 (7個數字-3個數字)";
      if (isSecondSerial) {
        serial2 = {
          isChecking: false,
          exists: false,
          formatError,
          product_id: "",
          product_info: null,
        };
      } else {
        serial1 = {
          isChecking: false,
          exists: false,
          formatError,
          product_id: "",
          product_info: null,
        };
      }
      onUpdate(formSerial1, formSerial2);
      return;
    }

    // 設置檢查狀態
    if (isSecondSerial) {
      serial2 = { ...serial2, isChecking: true, formatError: null };
    } else {
      serial1 = { ...serial1, isChecking: true, formatError: null };
    }

    // 調用 API 進行序號檢查
    await apiService
      .checkSerialNumber(serialNumber, warrantyId)
      .then(async (response) => {
        const productID = response.data?.product_id || "";
        const productInfo = await getProductInfo(productID);
        if (!productID) {
          if (isSecondSerial) {
            serial2 = {
              isChecking: false,
              exists: false,
              formatError: null,
              product_id: "",
              product_info: null,
            };
          } else {
            serial1 = {
              isChecking: false,
              exists: false,
              formatError: null,
              product_id: "",
              product_info: null,
            };
          }
        }
        // 檢查完成後更新狀態
        if (isSecondSerial) {
          serial2 = {
            isChecking: false,
            exists: false,
            formatError: null,
            product_id: productID,
            product_info: productInfo,
          };
        } else {
          serial1 = {
            isChecking: false,
            exists: false,
            formatError: null,
            product_id: productID,
            product_info: productInfo,
          };
        }
      })
      .catch((e: any) => {
        console.error("序號檢查失敗:", e.message);
        if (isSecondSerial) {
          serial2 = {
            isChecking: false,
            exists: true,
            formatError: "無法使用的序號，請聯繫您的手術診所。",
            product_id: "",
            product_info: null,
          };
        } else {
          serial1 = {
            isChecking: false,
            exists: true,
            formatError: "無法使用的序號，請聯繫您的手術診所。",
            product_id: "",
            product_info: null,
          };
        }
      })
      .finally(() => {
        onUpdate(formSerial1, formSerial2);
      });
  }

  onMount(() => {
    new Cleave("#product_serial_number", {
      delimiter: "-",
      blocks: [7, 3],
      numericOnly: true,
    });

    new Cleave("#product_serial_number_2", {
      delimiter: "-",
      blocks: [7, 3],
      numericOnly: true,
    });
  });
</script>

<div class="grid gap-4">
  <div class="grid gap-2">
    <Label for="product_serial_number">
      第一個植入體序號 <span class="text-red-500">*</span>
    </Label>
    <div class="relative">
      <Input
        id="product_serial_number"
        value={formSerial1}
        placeholder="格式：1234567-123"
        required
        on:input={(e) => (formSerial1 = (e.target as HTMLInputElement).value)}
        on:blur={() => checkSerialNumber(formSerial1 || "", false)}
        class={serial1.exists || serial1.formatError
          ? "product_serial_number border-red-500 focus-visible:ring-red-500"
          : "product_serial_number"}
      />
      {#if serial1.isChecking}
        <div class="absolute right-3 top-1/2 transform -translate-y-1/2">
          <Loader2 class="h-4 w-4 animate-spin text-gray-500" />
        </div>
      {/if}
    </div>
    {#if serial1.product_info}
      <div class="flex items-center">
        <CheckCircle class="h-5 w-5 text-green-600 mr-2" />
        <p class="text-sm text-gray-500">
          {serial1.product_info.type}
          {serial1.product_info.size}
        </p>
      </div>
    {/if}
    {#if serial1.formatError}
      <p class="text-sm text-red-500">{serial1.formatError}</p>
    {:else if serial1.exists}
      <p class="text-sm text-red-500">此序號已被註冊，請檢查輸入</p>
    {/if}
  </div>
  <div class="grid gap-2">
    <Label for="product_serial_number_2">
      第二個植入體序號 <span class="text-gray-500 text-sm">（選填）</span>
    </Label>
    <div class="relative">
      <Input
        id="product_serial_number_2"
        value={formSerial2 || ""}
        placeholder="格式：1234567-123"
        on:input={(e) => (formSerial2 = (e.target as HTMLInputElement).value)}
        on:blur={() => checkSerialNumber(formSerial2 || "", true)}
        class={serial2.exists || serial2.formatError
          ? "product_serial_number border-red-500 focus-visible:ring-red-500"
          : "product_serial_number"}
      />
      {#if serial2.isChecking}
        <div class="absolute right-3 top-1/2 transform -translate-y-1/2">
          <Loader2 class="h-4 w-4 animate-spin text-gray-500" />
        </div>
      {/if}
    </div>
    {#if serial2.product_info}
      <div class="flex items-center">
        <CheckCircle class="h-5 w-5 text-green-600 mr-2" />
        <p class="text-sm text-gray-500">
          {serial2.product_info.type}
          {serial2.product_info.size}
        </p>
      </div>
    {/if}
    {#if serial2.formatError}
      <p class="text-sm text-red-500">{serial2.formatError}</p>
    {:else if serial2.exists}
      <p class="text-sm text-red-500">此序號已被註冊，請檢查輸入</p>
    {/if}
  </div>
</div>
