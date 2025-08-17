import { apiService, type WarrantyRegistration, type WarrantyStatusResponse } from '$lib/api';
import type { PatientProductFilters, ProductFilters } from '$lib/types';
import { notificationStore } from './notifications';
import { writable } from 'svelte/store';

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
  patientFilters: PatientProductFilters;
  
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
  is_local_identity: true,
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
  patientFilters: {
    brand: "Mentor",
    category: "",
    subcategory: "",
    size: "",
  },
  isLoading: false,
  error: null,
  validationErrors: {},
  serial1: { isChecking: false, exists: false, formatError: null },
  serial2: { isChecking: false, exists: false, formatError: null },
  statusCheckResult: null,
};

function createWarrantyRegistrationStore() {
  const { subscribe, update, set } = writable<WarrantyRegistrationState>(initialState);

  return {
    subscribe,
    // 添加 getter 來暴露 state
    get state() {
      let currentState: WarrantyRegistrationState;
      subscribe(state => { currentState = state; })();
      return currentState!;
    },
    // Actions
    initialize: (data: { warrantyId: string; statusCheckResult: WarrantyStatusResponse | null; statusError: string | null }) => {
      update(state => ({
        ...state,
        statusCheckResult: data.statusCheckResult,
        error: data.statusError
      }));
    },

    updateFormData: (field: keyof WarrantyRegistration, value: string) => {
      update(state => ({
        ...state,
        formData: { ...state.formData, [field]: value },
        validationErrors: (() => {
          if (state.validationErrors[field]) {
            const { [field]: _, ...rest } = state.validationErrors;
            return rest;
          }
          return state.validationErrors;
        })()
      }));
    },

    updateFilters: async (newFilters: ProductFilters) => {
      update(state => ({ ...state, filters: newFilters }));
      
      if (newFilters.type && newFilters.model_number && newFilters.size) {
        const params = new URLSearchParams();
        params.set("brand", newFilters.brand);
        params.set("type", newFilters.type);
        params.set("model_number", newFilters.model_number);
        params.set("size", newFilters.size);
        
        const response = await apiService.getProductByCondition(params);
        if (response.data) {
          update(state => ({
            ...state,
            formData: { ...state.formData, product_id: response.data!.id }
          }));
        }
      }
    },

    updatePatientFilters: async (newFilters: PatientProductFilters) => {
      update(state => ({ ...state, patientFilters: newFilters }));
      
      if (newFilters.category && newFilters.subcategory && newFilters.size) {
        const params = new URLSearchParams();
        params.set("brand", newFilters.brand);
        params.set("type", newFilters.category + "-" + newFilters.subcategory);
        params.set("size", newFilters.size);

        const response = await apiService.getProductByCondition(params);
        if (response.data) {
          update(state => ({
            ...state,
            formData: { ...state.formData, product_id: response.data!.id }
          }));
        }
      }
    },

    checkSerialNumber: async (serialNumber: string, warrantyID: string, isSecondSerial: boolean = false) => {
      if (!serialNumber.trim()) {
        if (isSecondSerial) {
          update(state => ({
            ...state,
            serial2: { isChecking: false, exists: false, formatError: null }
          }));
        } else {
          update(state => ({
            ...state,
            serial1: { isChecking: false, exists: false, formatError: null }
          }));
        }
        return;
      }

      // 驗證序號格式：7個數字 + dash + 3個數字 (例：1234567-123)
      const serialFormat = /^\d{7}-\d{3}$/;
      if (!serialFormat.test(serialNumber)) {
        const formatError = "序號格式不正確，正確格式為：1234567-123 (7個數字-3個數字)";
        if (isSecondSerial) {
          update(state => ({
            ...state,
            serial2: { isChecking: false, exists: false, formatError }
          }));
        } else {
          update(state => ({
            ...state,
            serial1: { isChecking: false, exists: false, formatError }
          }));
        }
        return;
      }

      // Set checking state
      if (isSecondSerial) {
        update(state => ({
          ...state,
          serial2: { ...state.serial2, isChecking: true, formatError: null }
        }));
      } else {
        update(state => ({
          ...state,
          serial1: { ...state.serial1, isChecking: true, formatError: null }
        }));
      }

      try {
        const response = await apiService.checkSerialNumber(serialNumber, warrantyID);
        if (response.data) {
          if (isSecondSerial) {
            update(state => ({
              ...state,
              serial2: { isChecking: false, exists: false, formatError: null }
            }));
          } else {
            update(state => ({
              ...state,
              serial1: { isChecking: false, exists: false, formatError: null }
            }));
          }
        }
      } catch (e: any) {
        console.error("序號檢查失敗:", e.message);
        if (isSecondSerial) {
          update(state => ({
            ...state,
            serial2: { isChecking: false, exists: true, formatError: "無法使用的序號，請聯繫您的手術診所。" }
          }));
        } else {
          update(state => ({
            ...state,
            serial1: { isChecking: false, exists: true, formatError: "無法使用的序號，請聯繫您的手術診所。" }
          }));
        }
      }
    },

    submitForm: async (warrantyId: string) => {
      update(state => ({ ...state, isLoading: true, error: null, validationErrors: {} }));

      try {
        // Get current state for validation
        let currentState: WarrantyRegistrationState;
        subscribe(state => { currentState = state; })();
        
        // Validation
        const validationErrors: Record<string, string> = {};
        
        if (!currentState!.formData.product_serial_number.trim()) {
          validationErrors.product_serial_number = "必須填寫產品序號";
        } else if (currentState!.serial1.formatError) {
          validationErrors.product_serial_number = currentState!.serial1.formatError;
        } else if (currentState!.serial1.exists) {
          validationErrors.product_serial_number = "此序號已被註冊，請檢查輸入";
        }
        
        if (!currentState!.formData.patient_name.trim()) {
          validationErrors.patient_name = "必須填寫患者姓名";
        }

        if (!currentState!.formData.patient_id.trim()) {
          validationErrors.patient_id = "必須填寫身分證號";
        }

        if (!currentState!.formData.patient_birth_date.trim()) {
          validationErrors.patient_birth_date = "必須填寫出生年月日";
        }

        if (!currentState!.formData.patient_phone.trim()) {
          validationErrors.patient_phone = "必須填寫聯絡電話";
        }

        if (!currentState!.formData.patient_email.trim()) {
          validationErrors.patient_email = "必須填寫電子郵件";
        }

        if (!currentState!.formData.hospital_name.trim()) {
          validationErrors.hospital_name = "必須填寫手術醫院";
        }

        if (!currentState!.formData.doctor_name.trim()) {
          validationErrors.doctor_name = "必須填寫執刀醫師";
        }

        // Validate different serial numbers
        if (
          currentState!.formData.product_serial_number_2 &&
          currentState!.formData.product_serial_number === currentState!.formData.product_serial_number_2
        ) {
          validationErrors.product_serial_number_2 = "兩個序號不能相同";
        } else if (currentState!.formData.product_serial_number_2 && currentState!.serial2.formatError) {
          validationErrors.product_serial_number_2 = currentState!.serial2.formatError;
        } else if (currentState!.formData.product_serial_number_2 && currentState!.serial2.exists) {
          validationErrors.product_serial_number_2 = "此序號已被註冊，請檢查輸入";
        }

        if (Object.keys(validationErrors).length > 0) {
          update(state => ({
            ...state,
            isLoading: false,
            error: "請修正表單中的錯誤",
            validationErrors
          }));
          return false;
        }

        // Submit form
        const submitData = { ...currentState!.formData };
        if (!submitData.product_serial_number_2?.trim()) {
          delete submitData.product_serial_number_2;
        }

        const response = await apiService.fillWarranty(warrantyId, submitData);

        if (response.data) {
          notificationStore.success("保固註冊成功！確認信件將發送至您的電子信箱。");
          
          // Update status to completed
          update(state => ({
            ...state,
            isLoading: false,
            statusCheckResult: state.statusCheckResult ? { ...state.statusCheckResult, can_edit: false } : null
          }));
          return true;
        } else {
          throw new Error(response.message || response.error || "註冊失敗");
        }
      } catch (e: any) {
        const errorMessage = e.message;
        notificationStore.error(`註冊失敗: ${errorMessage}`);
        update(state => ({
          ...state,
          isLoading: false,
          error: errorMessage
        }));
        return false;
      }
    },

    reset: () => {
      set({ ...initialState });
    }
  };
}

export const warrantyRegistrationStore = createWarrantyRegistrationStore(); 