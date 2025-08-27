<script lang="ts">
  export let step: number;
  // 使用完整的 Tailwind 類別名稱
  const completedStyle = "border-mentor-teal text-mentor-teal";
  const activeStyle = "border-mentor-primary text-mentor-primary";
  const inactiveStyle = "border-mentor-gray text-mentor-gray";

  const style = (s: number) => {
    if (step > s) {
      // 已完成的步驟：顯示為 completed 狀態（淺青綠色）
      return completedStyle;
    } else if (step === s) {
      // 當前步驟：顯示為 active 狀態（深藍色）
      return activeStyle;
    } else {
      // 未完成的步驟：顯示為 inactive 狀態（灰色）
      return inactiveStyle;
    }
  };
</script>

{#if step}
  <ol
    class="flex items-center w-full p-2 space-x-2 text-sm font-medium text-center border-b border-gray-200 sm:text-base sm:p-4 sm:space-x-4 rtl:space-x-reverse"
  >
    <li class="flex items-center {style(1)}">
      <span
        class="flex items-center justify-center w-5 h-5 me-1 text-xs border rounded-full shrink-0 {style(
          1
        )}"
      >
        1
      </span>
      <span class="text-xs md:text-sm {style(1)}">保固須知</span>
      <svg
        class="w-3 h-3 ms-2 sm:ms-4 rtl:rotate-180"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 12 10"
      >
        <path
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="m7 9 4-4-4-4M1 9l4-4-4-4"
        />
      </svg>
    </li>
    <li class="flex items-center {style(2)}">
      <span
        class="flex items-center justify-center w-5 h-5 me-1 text-xs border rounded-full shrink-0 {style(
          2
        )}"
      >
        2
      </span>
      <span class="text-xs md:text-sm {style(2)}">驗證序號</span>
      <svg
        class="w-3 h-3 ms-2 sm:ms-4 rtl:rotate-180"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 12 10"
      >
        <path
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="m7 9 4-4-4-4M1 9l4-4-4-4"
        />
      </svg>
    </li>
    <li class="flex items-center {style(3)}">
      <span
        class="flex items-center justify-center w-5 h-5 me-1 text-xs border rounded-full shrink-0 {style(
          3
        )}"
      >
        3
      </span>
      <span class="text-xs md:text-sm {style(3)}">填寫保固</span>
    </li>
    <li class="flex items-center {style(4)}">
      <span
        class="flex items-center justify-center w-5 h-5 me-1 text-xs border rounded-full shrink-0 {style(
          4
        )}"
      >
        4
      </span>
      <span class="text-xs md:text-sm {style(4)}">確認保固</span>
    </li>
  </ol>
{/if}
