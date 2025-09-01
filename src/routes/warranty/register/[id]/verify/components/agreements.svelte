<script lang="ts">
  // 接收父組件傳入的 callback function
  export let onAgree: (() => void) | undefined = undefined;
  export let displayOnly: boolean = false;

  let containerRef: HTMLDivElement;
  let agreementCheckboxDisabled = true;
  let agreement1Checked = false;
  let agreement2Checked = false;
  let agreement3Checked = false;

  // 處理滾動事件
  function handleScroll(event: Event) {
    const target = event.target as HTMLDivElement;
    const { scrollTop, scrollHeight, clientHeight } = target;

    // 檢查是否滾動到底部（允許 1px 的誤差）
    if (scrollTop + clientHeight >= scrollHeight - 1) {
      agreementCheckboxDisabled = false;
    }
  }

  function agreeTransition() {
    // 使用 View Transitions API 創建平滑轉場
    const transition = document.startViewTransition?.(() => {
      if (onAgree) {
        onAgree();
      }
      // 轉場完成後滾動到頂部
      if (transition) {
        transition.finished.then(() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
        });
      } else {
        // 如果沒有轉場，直接滾動
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });

    // 如果瀏覽器不支援，直接執行
    if (!transition && onAgree) {
      onAgree();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleAgree1() {
    agreement1Checked = true;
    if (agreement2Checked && agreement3Checked && onAgree) {
      agreeTransition();
    }
  }
  function handleAgree2() {
    agreement2Checked = true;
    if (agreement1Checked && agreement3Checked && onAgree) {
      agreeTransition();
    }
  }
  function handleAgree3() {
    agreement3Checked = true;
    if (agreement1Checked && agreement2Checked && onAgree) {
      agreeTransition();
    }
  }
</script>

<div class="max-w-[90vw] md:max-w-4xl mx-auto">
  <div
    bind:this={containerRef}
    on:scroll={handleScroll}
    class="flex flex-col gap-3 mt-4 p-6 bg-white rounded-lg shadow-lg border border-mentor-gray
    {displayOnly ? 'max-h-[80vh]' : 'max-h-[40vh]'} overflow-y-auto"
  >
    <h1 class="text-xl font-bold text-mentor-primary mb-4 text-center">
      曼陀乳房植入物保固註冊申請書
    </h1>

    <div class="space-y-4 text-sm leading-relaxed">
      <p class="text-gray-700 text-xs">
        曼陀乳房植入物保固註冊申請書（包括用戶申請保固註冊所需之個人資料捜集，處理及利用之告知曁同意書）。偉鉅股份有限公司遵守個人資訊保護法等相關法律，致力於保護顧客個人資料。根據個人資料保護法第8條第四款，蒐集到您的個人資料，僅使用於保固相關資訊核對，並以電子檔案形式供原廠壯生醫療器材股份有限公司用於審核保固相關資料處理與使用。
      </p>

      <div>
        <h3 class="text-sm font-semibold text-mentor-primary mb-2">保固產品</h3>
        <p class="text-gray-700 text-xs leading-5">
          中文品名/型號/衛福部許可證字號:<br />
          "曼陀"矽膠填充義乳/SMPX/SMHX/SHPX/SMPB/SMHB/SHPB/:衛署醫器輸字第019462號<br
          />
          "曼陀"水滴型矽膠填充義乳/CPG/衛署醫器輸字第032720號<br />
          英文品名/型號: "Mentor" MemoryGel Silicone Gel-Filled Breast Implants/
          SMPX/SMHX/SHPX/SMPB/SMHB/SHPB<br />
          "Mentor" CPG Gel Breast Implants/ CPG331/332/333/321/322/323/333/311/312/313
        </p>
      </div>

      <div>
        <h3 class="text-sm font-semibold text-mentor-primary mb-2">保固對象</h3>
        <p class="text-gray-700 text-xs leading-5">
          1. 使用保固產品於乳房美容隆乳手術之患者<br />
          2. 使用保固產品於乳房重建手術之患者
        </p>
      </div>

      <div>
        <h3 class="text-sm font-semibold text-mentor-primary mb-2">
          保固效期及內容
        </h3>
        <p class="text-gray-700 text-xs leading-5">
          自手術植入保固產品後，直至患者取出植入物為止，使用"曼陀"矽膠填充義乳/SMPX/SMHX/SHPX/SMPB/SMHB/SHPB者享終身保固;
          使用"曼陀"水滴型矽膠填充義乳/CPG 者享終身保固。<br /><br />
          如患者發生以下情況：<br />
          1. 貝克三級莢膜攣縮與貝克四級莢膜攣縮或<br />
          2. 植入物體內破裂<br /><br />
          則可提交保固請領證明文件，由偉鉅股份有限公司審查，若符合保固出保資格，則免費提供與保固系統登錄資料相同之型號及尺寸及數量的產品。
        </p>
      </div>

      <div>
        <h3 class="text-sm font-semibold text-mentor-primary mb-2">
          如患者有下列情形之一者，偉鉅醫材有限公司及原廠壯生醫療器材股份有限公司得不負保固責任
        </h3>
        <p class="text-gray-700 text-xs leading-5">
          1. 非醫師依規範植入手術，或未依產品操作規範使用之植入物。<br />
          2. 患者因外傷、事故、其他疾病或治療導致植入物損壞。<br />
          3. 與手術操作相關，而與保固產品品質無關之併發症（如位置偏移、不對稱、乳頭位置及感覺變化等），不屬於保固範圍。<br
          />
          4. 美觀或主觀滿意度問題（如形狀、觸感不滿意）不屬於保固範圍<br />
          5. 如為二次隆乳，需經醫師診斷已排除感染狀態達超過6個月，若因患者仍在感染狀態而植入保固產品，導致產生後續病症等，經發現則保固自動失效。
        </p>
      </div>

      <div>
        <h3 class="text-sm font-semibold text-mentor-primary mb-2">
          患者資訊收集和使用目的:保固註冊必要的資訊
        </h3>
        <p class="text-gray-700 text-xs leading-5">
          甲、包含患者姓名/身分證字號/出生年月日/電話/電子郵件
        </p>
      </div>

      <div>
        <h3 class="text-sm font-semibold text-mentor-primary mb-2">
          醫療資訊收集和使用
        </h3>
        <p class="text-gray-700 text-xs leading-5">
          甲、手術日期/手術醫師/手術院所單位<br />乙、植入物型號與其SN碼
        </p>
      </div>

      <div>
        <h3 class="text-sm font-semibold text-mentor-primary mb-2">
          其他條款：
        </h3>
        <p class="text-gray-700 text-xs leading-5">
          爭議之案例須經專案討論後決定，偉鉅股份有限公司保有最終審査保固是否出保之權利。
        </p>
      </div>

      <div>
        <h3 class="text-sm font-semibold text-mentor-primary mb-2">
          保固請領證明文件
        </h3>
        <p class="text-gray-700 text-xs leading-5">
          1. 診所或醫院開立之診斷證明:
          貝克三級莢膜攣縮與貝克四級莢膜攣縮診斷證明書<br />
          2. 清楚乳房外觀照：手臂自然下垂跟及手臂往上舉之正面，左右側面45，左右側面90度之清晰照片共10張<br
          />
          3. 經醫師簽章之MRI檢查或超音波檢查認定植入物體內破裂報告書，或如經手術取出後證實植入物發生體內破損，須繳回取出植入物認定<br
          />
          4. Mentor植入物保固註冊申請書之影本
        </p>
      </div>

      <p class="text-gray-700 text-xs leading-5">
        上述文件，請於再次手術前至少30天，提前交予預計手術的醫療院所，由院所代為繳交偉鉅股份有限公司，偉鉅股份有限公司將於審查保固資格通過後，將理賠之植入物送達手術院所。
      </p>
    </div>
  </div>

  {#if !displayOnly}
    <div class="flex justify-center mt-6">
      <label
        class="flex items-start space-x-3 max-w-2xl"
        class:cursor-pointer={!agreementCheckboxDisabled}
        class:cursor-not-allowed={agreementCheckboxDisabled}
      >
        <input
          type="checkbox"
          class="mt-1 h-4 w-4 text-mentor-primary border-mentor-gray rounded focus:ring-mentor-primary focus:ring-2 transition-all duration-200"
          class:opacity-50={agreementCheckboxDisabled}
          class:bg-gray-100={agreementCheckboxDisabled}
          class:border-gray-300={agreementCheckboxDisabled}
          disabled={agreementCheckboxDisabled}
          on:change={(e) => {
            if (e.currentTarget.checked) {
              handleAgree1();
            }
          }}
        />
        <span
          class="text-xs leading-relaxed transition-colors duration-200"
          class:text-gray-700={!agreementCheckboxDisabled}
          class:text-gray-400={agreementCheckboxDisabled}
        >
          本人已經閱讀並瞭解上述保固條件與申請流程需準備之文件，及申請作業時程。如因資料未能備齊或造假，偉鉅股份有限公司將不負責賠償之責任。
        </span>
      </label>
    </div>
    <div class="flex justify-center mt-4">
      <label
        class="flex items-start space-x-3 max-w-2xl"
        class:cursor-pointer={!agreementCheckboxDisabled}
        class:cursor-not-allowed={agreementCheckboxDisabled}
      >
        <input
          type="checkbox"
          class="mt-1 h-4 w-4 text-mentor-primary border-mentor-gray rounded focus:ring-mentor-primary focus:ring-2 transition-all duration-200"
          class:opacity-50={agreementCheckboxDisabled}
          class:bg-gray-100={agreementCheckboxDisabled}
          class:border-gray-300={agreementCheckboxDisabled}
          disabled={agreementCheckboxDisabled}
          on:change={(e) => {
            if (e.currentTarget.checked) {
              handleAgree2();
            }
          }}
        />
        <span
          class="text-xs leading-relaxed transition-colors duration-200"
          class:text-gray-700={!agreementCheckboxDisabled}
          class:text-gray-400={agreementCheckboxDisabled}
        >
          本人同意參與曼陀保固計畫並提供以上資料予偉鉅股份有限公司代為保管，作為日後於保固期限內審核本人之保固請求，並作為更新植入物之依據。
        </span>
      </label>
    </div>
    <div class="flex justify-center mt-4 mb-4">
      <label
        class="flex items-start space-x-3 max-w-2xl"
        class:cursor-pointer={!agreementCheckboxDisabled}
        class:cursor-not-allowed={agreementCheckboxDisabled}
      >
        <input
          type="checkbox"
          class="mt-1 h-4 w-4 text-mentor-primary border-mentor-gray rounded focus:ring-mentor-primary focus:ring-2 transition-all duration-200"
          class:opacity-50={agreementCheckboxDisabled}
          class:bg-gray-100={agreementCheckboxDisabled}
          class:border-gray-300={agreementCheckboxDisabled}
          disabled={agreementCheckboxDisabled}
          on:change={(e) => {
            if (e.currentTarget.checked) {
              handleAgree3();
            }
          }}
        />
        <span
          class="text-xs leading-relaxed transition-colors duration-200"
          class:text-gray-700={!agreementCheckboxDisabled}
          class:text-gray-400={agreementCheckboxDisabled}
        >
          本人已知悉，根據個人資料保護法第3條規定，就本人之個人資料，本人享有下列權利：
          一、查詢或請求閱覽。二、請求製給複製本。三、請求補充或更正。四、請求停止蒐集、處理或利用。五、請求刪除。
        </span>
      </label>
    </div>
  {/if}
</div>

<style>
  /* 自定義滾動條樣式 */
  div::-webkit-scrollbar {
    width: 8px;
  }

  div::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
  }

  div::-webkit-scrollbar-thumb {
    background: #004b8d;
    border-radius: 4px;
  }

  div::-webkit-scrollbar-thumb:hover {
    background: #1d427c;
  }

  /* Firefox 滾動條樣式 */
  div {
    scrollbar-width: thin;
    scrollbar-color: #004b8d #f1f5f9;
  }
</style>
