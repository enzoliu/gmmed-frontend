import { apiService, type WarrantyRegistration, type WarrantyStatusResponse } from '$lib/api';
import type { ProductFilters } from '$lib/types';
import { notificationStore } from './notifications';

interface SerialNumberState {
  isChecking: boolean;
  exists: boolean;
  formatError: string | null;
}

interface WarrantyRegistrationState {
  // Form data
  formData: WarrantyRegistration;
  selectedBrand: string;
  filters: ProductFilters;
  
  // Status
  isLoading: boolean;
  error: string | null;
  validationErrors: Record<string, string>;
  
  // Serial number checking
  serial1: SerialNumberState;
  serial2: SerialNumberState;
  
  // Registration status
  statusCheckResult: WarrantyStatusResponse | null;
}

const createInitialFormData = (): WarrantyRegistration => ({
  product_id: "",
  product_serial_number: "",
  product_serial_number_2: "",
  patient_name: "",
  patient_id: "",
  patient_birth_date: new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0],
  patient_phone: "",
  patient_email: "",
  hospital_name: "",
  doctor_name: "",
  surgery_date: new Date().toISOString().split("T")[0],
});

const initialState: WarrantyRegistrationState = {
  formData: createInitialFormData(),
  selectedBrand: "Mentor",
  filters: {
    brand: "Mentor",
    type: "",
    model_number: "",
    size: "",
    active: "",
  },
  isLoading: false,
  error: null,
  validationErrors: {},
  serial1: { isChecking: false, exists: false, formatError: null },
  serial2: { isChecking: false, exists: false, formatError: null },
  statusCheckResult: null,
};

function createWarrantyRegistrationStore() {
  let state = $state<WarrantyRegistrationState>(initialState);

  return {
    // Getters (reactive accessors)
    get state() { return state; },
    get formData() { return state.formData; },
    get filters() { return state.filters; },
    get isLoading() { return state.isLoading; },
    get error() { return state.error; },
    get validationErrors() { return state.validationErrors; },
    get serial1() { return state.serial1; },
    get serial2() { return state.serial2; },
    get statusCheckResult() { return state.statusCheckResult; },
    
    // Derived computations
    get hasValidationErrors() { 
      return Object.keys(state.validationErrors).length > 0;
    },
    get canSubmit() {
      return !state.isLoading && 
        state.formData.product_serial_number.trim() !== '' &&
        state.formData.patient_name.trim() !== '' &&
        state.formData.patient_id.trim() !== '' &&
        state.formData.patient_birth_date.trim() !== '' &&
        state.formData.patient_phone.trim() !== '' &&
        state.formData.patient_email.trim() !== '' &&
        state.formData.hospital_name.trim() !== '' &&
        state.formData.doctor_name.trim() !== '' &&
        state.formData.surgery_date.trim() !== '' &&
        !state.serial1.exists &&
        !state.serial2.exists &&
        !state.serial1.formatError &&
        !state.serial2.formatError;
    },
    
    // Actions
    initialize: (data: { warrantyId: string; statusCheckResult: WarrantyStatusResponse | null; statusError: string | null }) => {
      state.statusCheckResult = data.statusCheckResult;
      state.error = data.statusError;
    },

    updateFormData: (field: keyof WarrantyRegistration, value: string) => {
      state.formData = { ...state.formData, [field]: value };
      // Clear validation error for this field
      if (state.validationErrors[field]) {
        const { [field]: _, ...rest } = state.validationErrors;
        state.validationErrors = rest;
      }
    },

    updateFilters: async (newFilters: ProductFilters) => {
      state.filters = newFilters;
      
      if (newFilters.type && newFilters.model_number && newFilters.size) {
        const params = new URLSearchParams();
        params.set("brand", newFilters.brand);
        params.set("type", newFilters.type);
        params.set("model_number", newFilters.model_number);
        params.set("size", newFilters.size);
        
        const response = await apiService.getProductByCondition(params);
        if (response.data) {
          state.formData = { ...state.formData, product_id: response.data.id };
        }
      }
    },

    checkSerialNumber: async (serialNumber: string, isSecondSerial: boolean = false) => {
      if (!serialNumber.trim()) {
        if (isSecondSerial) {
          state.serial2 = { isChecking: false, exists: false, formatError: null };
        } else {
          state.serial1 = { isChecking: false, exists: false, formatError: null };
        }
        return;
      }

      // 驗證序號格式：7個數字 + dash + 3個數字 (例：1234567-123)
      const serialFormat = /^\d{7}-\d{3}$/;
      if (!serialFormat.test(serialNumber)) {
        const formatError = "序號格式不正確，正確格式為：1234567-123 (7個數字-3個數字)";
        if (isSecondSerial) {
          state.serial2 = { isChecking: false, exists: false, formatError };
        } else {
          state.serial1 = { isChecking: false, exists: false, formatError };
        }
        return;
      }

      // Set checking state
      if (isSecondSerial) {
        state.serial2 = { ...state.serial2, isChecking: true, formatError: null };
      } else {
        state.serial1 = { ...state.serial1, isChecking: true, formatError: null };
      }

      try {
        const response = await apiService.checkSerialNumber(serialNumber);
        if (response.data) {
          if (isSecondSerial) {
            state.serial2 = { isChecking: false, exists: response.data.exists, formatError: null };
          } else {
            state.serial1 = { isChecking: false, exists: response.data.exists, formatError: null };
          }
        }
      } catch (e: any) {
        console.error("序號檢查失敗:", e.message);
        if (isSecondSerial) {
          state.serial2 = { isChecking: false, exists: false, formatError: null };
        } else {
          state.serial1 = { isChecking: false, exists: false, formatError: null };
        }
      }
    },

    submitForm: async (warrantyId: string) => {
      state.isLoading = true;
      state.error = null;
      state.validationErrors = {};

      try {
        // Validation
        const validationErrors: Record<string, string> = {};
        
        if (!state.formData.product_serial_number.trim()) {
          validationErrors.product_serial_number = "必須填寫產品序號";
        } else if (state.serial1.formatError) {
          validationErrors.product_serial_number = state.serial1.formatError;
        } else if (state.serial1.exists) {
          validationErrors.product_serial_number = "此序號已被註冊，請檢查輸入";
        }
        
        if (!state.formData.patient_name.trim()) {
          validationErrors.patient_name = "必須填寫患者姓名";
        }

        if (!state.formData.patient_id.trim()) {
          validationErrors.patient_id = "必須填寫身分證號";
        }

        if (!state.formData.patient_birth_date.trim()) {
          validationErrors.patient_birth_date = "必須填寫出生年月日";
        }

        if (!state.formData.patient_phone.trim()) {
          validationErrors.patient_phone = "必須填寫聯絡電話";
        }

        if (!state.formData.patient_email.trim()) {
          validationErrors.patient_email = "必須填寫電子郵件";
        }

        if (!state.formData.hospital_name.trim()) {
          validationErrors.hospital_name = "必須填寫手術醫院";
        }

        if (!state.formData.doctor_name.trim()) {
          validationErrors.doctor_name = "必須填寫執刀醫師";
        }

        // Validate different serial numbers
        if (
          state.formData.product_serial_number_2 &&
          state.formData.product_serial_number === state.formData.product_serial_number_2
        ) {
          validationErrors.product_serial_number_2 = "兩個序號不能相同";
        } else if (state.formData.product_serial_number_2 && state.serial2.formatError) {
          validationErrors.product_serial_number_2 = state.serial2.formatError;
        } else if (state.formData.product_serial_number_2 && state.serial2.exists) {
          validationErrors.product_serial_number_2 = "此序號已被註冊，請檢查輸入";
        }

        if (Object.keys(validationErrors).length > 0) {
          state.isLoading = false;
          state.error = "請修正表單中的錯誤";
          state.validationErrors = validationErrors;
          return false;
        }

        // Submit form
        const submitData = { ...state.formData };
        if (!submitData.product_serial_number_2?.trim()) {
          delete submitData.product_serial_number_2;
        }

        const response = await apiService.fillWarranty(warrantyId, submitData);

        if (response.data) {
          notificationStore.success("保固註冊成功！確認信件將發送至您的電子信箱。");
          
          // Update status to completed
          state.isLoading = false;
          if (state.statusCheckResult) {
            state.statusCheckResult = { ...state.statusCheckResult, can_edit: false };
          }
          return true;
        } else {
          throw new Error(response.message || response.error || "註冊失敗");
        }
      } catch (e: any) {
        const errorMessage = e.message;
        notificationStore.error(`註冊失敗: ${errorMessage}`);
        state.isLoading = false;
        state.error = errorMessage;
        return false;
      }
    },

    reset: () => {
      state = { ...initialState };
    }
  };
}

export const warrantyRegistrationStore = createWarrantyRegistrationStore(); 