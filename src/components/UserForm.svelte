<!-- src/components/UserForm.svelte -->
<script lang="ts">
  import { onMount } from "svelte";
  import type { User, CreateUserRequest, UpdateUserRequest } from "$lib/api";
  import Button from "$components/ui/Button.svelte";
  import Input from "$components/ui/Input.svelte";
  import Label from "$components/ui/Label.svelte";
  import Checkbox from "$components/ui/Checkbox.svelte";

  export let user: User | null = null;
  export let isLoading = false;
  export let onSubmit: (data: CreateUserRequest | UpdateUserRequest) => void;
  export let onCancel: () => void;

  let formData: CreateUserRequest | UpdateUserRequest = {
    username: "",
    email: "",
    password: "",
    role: "readonly",
    is_active: true,
  };

  let isEditMode = false;
  let errors: Record<string, string> = {};

  // 密碼驗證函數，參考後端 validator.go
  function validatePassword(password: string): {
    isValid: boolean;
    message: string;
  } {
    if (password.length < 8) {
      return { isValid: false, message: "密碼長度至少需要 8 個字元" };
    }

    let hasUpper = false;
    let hasLower = false;
    let hasDigit = false;
    let hasSpecial = false;

    for (const char of password) {
      if (char >= "A" && char <= "Z") hasUpper = true;
      else if (char >= "a" && char <= "z") hasLower = true;
      else if (char >= "0" && char <= "9") hasDigit = true;
      else if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(char))
        hasSpecial = true;
    }

    const count = [hasUpper, hasLower, hasDigit, hasSpecial].filter(
      Boolean
    ).length;

    if (count < 3) {
      return {
        isValid: false,
        message: "密碼必須包含大寫字母、小寫字母、數字、特殊字元中的至少三種",
      };
    }

    return { isValid: true, message: "" };
  }

  // 電子郵件驗證
  function validateEmail(email: string): { isValid: boolean; message: string } {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, message: "請輸入有效的電子郵件地址" };
    }
    return { isValid: true, message: "" };
  }

  // 使用者名稱驗證
  function validateUsername(username: string): {
    isValid: boolean;
    message: string;
  } {
    if (username.length < 3) {
      return { isValid: false, message: "使用者名稱至少需要 3 個字元" };
    }
    if (username.length > 50) {
      return { isValid: false, message: "使用者名稱不能超過 50 個字元" };
    }
    return { isValid: true, message: "" };
  }

  // 驗證表單
  function validateForm(): boolean {
    errors = {};

    // 驗證使用者名稱
    const usernameValidation = validateUsername(formData.username || "");
    if (!usernameValidation.isValid) {
      errors.username = usernameValidation.message;
    }

    // 驗證電子郵件
    const emailValidation = validateEmail(formData.email || "");
    if (!emailValidation.isValid) {
      errors.email = emailValidation.message;
    }

    // 驗證密碼（只在新增模式或編輯模式有輸入密碼時驗證）
    if (!isEditMode || formData.password) {
      const passwordValidation = validatePassword(formData.password || "");
      if (!passwordValidation.isValid) {
        errors.password = passwordValidation.message;
      }
    }

    return Object.keys(errors).length === 0;
  }

  onMount(() => {
    if (user) {
      isEditMode = true;
      formData = {
        username: user.username,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
        // 密碼欄位留空，除非需要更新
      };
    }
  });

  function handleSubmit() {
    if (!validateForm()) {
      return;
    }

    const dataToSubmit = { ...formData };
    // 如果是編輯模式且密碼為空，則不提交密碼欄位
    if (isEditMode && !dataToSubmit.password) {
      delete dataToSubmit.password;
    }
    onSubmit(dataToSubmit);
  }

  // 即時驗證
  function handleInput(field: string) {
    if (errors[field]) {
      delete errors[field];
    }
  }
</script>

<form on:submit|preventDefault={handleSubmit} class="space-y-6">
  <div class="grid grid-cols-2 gap-4">
    <div class="space-y-2">
      <Label for="username">使用者名稱</Label>
      <Input
        id="username"
        bind:value={formData.username}
        on:input={() => handleInput("username")}
        class={errors.username ? "border-red-500" : ""}
        required
      />
      {#if errors.username}
        <p class="text-sm text-red-500">{errors.username}</p>
      {/if}
    </div>
    <div class="space-y-2">
      <Label for="email">電子郵件</Label>
      <Input
        id="email"
        type="email"
        bind:value={formData.email}
        on:input={() => handleInput("email")}
        class={errors.email ? "border-red-500" : ""}
        required
      />
      {#if errors.email}
        <p class="text-sm text-red-500">{errors.email}</p>
      {/if}
    </div>
  </div>
  <div class="space-y-2">
    <Label for="password">{isEditMode ? "新密碼（可選）" : "密碼"}</Label>
    <Input
      id="password"
      type="password"
      bind:value={formData.password}
      on:input={() => handleInput("password")}
      class={errors.password ? "border-red-500" : ""}
      required={!isEditMode}
    />
    {#if errors.password}
      <p class="text-sm text-red-500">{errors.password}</p>
    {/if}
    {#if !isEditMode}
      <p class="text-sm text-gray-500">
        密碼必須包含大寫字母、小寫字母、數字、特殊字元中的至少三種，且長度至少 8
        個字元
      </p>
    {/if}
  </div>
  <div class="space-y-2">
    <Label for="role">角色</Label>
    <select
      id="role"
      bind:value={formData.role}
      class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      required
    >
      <option value="readonly">閱覽權限</option>
      <option value="editor">編輯權限</option>
      <option value="admin">所有權限</option>
    </select>
  </div>
  <div class="flex items-center space-x-2">
    <Checkbox id="is_active" bind:checked={formData.is_active} />
    <Label for="is_active">啟用使用者</Label>
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
