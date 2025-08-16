import { get } from 'svelte/store';
import { browser } from '$app/environment';
import { authStore } from '$stores/auth'; // We will create this store next
import { config } from '$lib/env';

/**
 * Generic API response structure
 */
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
  details?: Array<{ field: string; message: string }>;
}

/**
 * Interfaces for Authentication
 */
export interface LoginRequest {
  username: string;
  password: string;
}

export interface MeResponse {
  user: User;
  expires_at: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'editor' | 'readonly';
  is_active: boolean;
  last_login_at: string;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  token: string;
  expires_at: string;
  user: User;
}

/**
 * Interfaces for Product Management
 */
export interface Product {
    id: string;
    model_number: string;
    brand: string;
    type: string;
    size: string;
    warranty_years: number;
    description: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface ProductListResponse {
    products: Product[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}

export interface ProductAllResponse {
    data: Product[];
}

export interface ProductMetadata {
    data: string[];
}

export interface ProductMetadataStruct {
  brand: string;
  type: string;
  model_number: string;
  size: string;
}

export interface ProductMetadataAllResponse {
    data: ProductMetadataStruct[];
}

export type CreateProductRequest = Omit<Product, 'id' | 'created_at' | 'updated_at' | 'is_active'> & { is_active?: boolean };
export type UpdateProductRequest = Partial<CreateProductRequest>;

/**
 * Interfaces for User Management
 */
export interface UserListResponse {
    users: User[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}
export interface CreateUserRequest {
    username: string;
    email: string;
    password?: string; // Password is optional on updates
    role: 'admin' | 'editor' | 'readonly';
    is_active: boolean;
}
export type UpdateUserRequest = Partial<CreateUserRequest>;

/**
 * Interfaces for Audit Log
 */
export interface AuditLog {
    id: string;
    user_id: string;
    action: string;
    table_name: string;
    record_id: string | null;
    old_values: Record<string, any>;
    new_values: Record<string, any>;
    ip_address: string;
    user_agent: string;
    created_at: string;
    username: string;
    email: string;
}

export interface AuditLogListResponse {
    audit_logs: AuditLog[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}

/**
 * Interfaces for Serial Management
 */
export interface Serial {
  id: string;
  serial_number: string;
  full_serial_number: string;
  product_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SerialImportItem {
  product_id: string;
  serial_number: string;
  full_serial_number: string;
}

export interface SerialBulkImportRequest {
  serials: SerialImportItem[];
}

export interface SerialImportErrorItem {
  index: number;
  product_id: string;
  serial_number: string;
  full_serial_number: string;
  error: string;
}

export interface SerialBulkImportResponse {
  success_count: number;
  failed_count: number;
  failed_items?: SerialImportErrorItem[];
}

export interface SerialCreateRequest {
  serial_number: string;
  full_serial_number: string;
  product_id: string;
}

export interface SerialUpdateRequest {
  serial_number?: string;
  full_serial_number?: string;
  product_id?: string;
}

export interface SerialListResponse {
  serials: Serial[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface SerialDetailResponse {
  id: string;
  serial_number: string;
  full_serial_number: string;
  product_id: string | null;
  product?: Product;
  created_at: string;
  updated_at: string;
}

export interface SerialStatsResponse {
  total_serials: number;
  assigned_serials: number;
  unassigned_serials: number;
  total_products: number;
}

/**
 * Interfaces for Warranty
 */
export interface WarrantyRegistration {
  product_id: string;
  product_serial_number: string;
  product_serial_number_2?: string; // 第二個植入體序號（選填，用於雙側植入手術）
  patient_name: string;
  patient_id: string;
  patient_birth_date: string;
  patient_phone: string;
  patient_email: string;
  hospital_name: string;
  doctor_name: string;
  surgery_date: string;
}

export interface WarrantyInfo {
  id: string;
  product_id: string;
  product_serial_number: string;
  product_serial_number_2?: string; // 第二個植入體序號（選填）
  patient_name: string;
  patient_id: string; // 解密後的身分證字號
  patient_birth_date: string;
  patient_phone: string; // 解密後的手機號碼
  patient_email: string;
  hospital_name: string;
  doctor_name: string;
  surgery_date: string;
  warranty_start_date: string;
  warranty_end_date: string;
  confirmation_email_sent?: boolean; // 新增：確認保固信件發送狀態
  email_sent_at?: string | null; // 新增：保固信件發送時間
  status: 'active' | 'expired' | 'cancelled';
  created_at: string;
  updated_at: string;
  model_number: string;
  brand: string;
  type: string;
  size: string;
  warranty_years: number;
  description?: string; // 新增：產品描述
  is_active?: boolean; // 新增：產品啟用狀態
}

export interface WarrantySearchResult {
  warranties: WarrantyInfo[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/**
 * Interfaces for Serial Number Check
 */
export interface SerialNumberCheckResponse {
  exists: boolean;
  message: string;
}

/**
 * Interfaces for Warranty Status Check
 */
export interface WarrantyStatusResponse {
  can_edit: boolean;
  message: string;
}

/**
 * Interfaces for Batch Create Warranty
 */
export interface BatchCreateWarrantyRequest {
  count: number;
}

export interface BatchCreateWarrantyResponse {
  count: number;
  ids: string[];
}

/**
 * Main class for handling API requests
 */
class ApiService {
  public async request<T = any>(
    endpoint: string,
    options: RequestInit = {},
    customFetch?: typeof fetch
  ): Promise<ApiResponse<T>> {
    const url = `${config.apiBaseUrl}${endpoint}`;

    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');

    const requestConfig: RequestInit = {
      ...options,
      headers,
    };

    try {
      const fetchFunction = customFetch || fetch;
      const response = await fetchFunction(url, requestConfig);
      const data = await response.json();

      if (!response.ok) {
        const apiErrorResponse = data as ApiResponse<never>;
        const errorMessage = apiErrorResponse.error || apiErrorResponse.message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      return { data: data as T };
    } catch (error) {
      if (config.debug) {
        console.error('API Error:', error);
      }
      // Re-throw the error so it can be caught by the calling function
      throw error;
    }
  }

  public async authedRequest<T = any>(
    endpoint: string,
    options: RequestInit = {},
    customFetch?: typeof fetch
  ): Promise<ApiResponse<T>> {
    const url = `${config.apiBaseUrl}${endpoint}`;

    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');

    const csrfToken = this.getCookie('csrf_token')
    if (csrfToken) {
      headers.set('X-CSRF-Token', csrfToken);
    }

    const requestConfig: RequestInit = {
      ...options,
      method: options.method || 'GET',
      headers,
      credentials: 'include',
    };

    try {
      const fetchFunction = customFetch || fetch;
      let response = await fetchFunction(url, requestConfig);
      
      if (response.status === 401) {
        const refresh = await fetchFunction(`${config.apiBaseUrl}/api/v1/auth/refresh-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        if (refresh.ok) {
          const newCsrf = this.getCookie('csrf_token');
          if (newCsrf) headers.set('X-CSRF-Token', newCsrf);
          
          response = await fetchFunction(url, requestConfig);
        } else {
          return { data: null as T };
        }
      }

      const data = await response.json();

      if (!response.ok) {
        const apiErrorResponse = data as ApiResponse<never>;
        const errorMessage = apiErrorResponse.error || apiErrorResponse.message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      return { data: data as T };
    } catch (error) {
      if (config.debug) console.error('API Error:', error);
      throw error;
    }
  }

  // Authentication methods
  async login(credentials: LoginRequest): Promise<ApiResponse<boolean>> {
    const endpoint = '/api/v1/auth/login';
    const response = await fetch(`${config.apiBaseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    if (response.ok && response.status === 200) {
      return { data: true };
    }
    return { data: false };
  }

  async logout(): Promise<ApiResponse<void>> {
    await this.request<void>('/api/v1/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    // 清除前端 cookie (csrf_token)
    document.cookie = "csrf_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

    // 清除 memory / localStorage / context 狀態（視架構決定）
    localStorage.removeItem("user");
    sessionStorage.clear();
    return {};
  }

  async getMe(): Promise<ApiResponse<MeResponse>> {
    return this.authedRequest<MeResponse>('/api/v1/auth/me');
  }

  // Product list methods (allow anonymous)
  async getProducts(params: URLSearchParams = new URLSearchParams()): Promise<ApiResponse<ProductListResponse>> {
    return this.authedRequest<ProductListResponse>(`/api/v1/products/manage?${params.toString()}`);
  }

  async getProductsAll(): Promise<ApiResponse<ProductAllResponse>> {
    return this.authedRequest<ProductAllResponse>('/api/v1/products/all');
  }

  async getProductByCondition(params: URLSearchParams = new URLSearchParams()): Promise<ApiResponse<Product>> {
    return this.request<Product>(`/api/v1/product?${params.toString()}`);
  }

  async createProduct(data: CreateProductRequest): Promise<ApiResponse<Product>> {
    return this.authedRequest<Product>('/api/v1/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProduct(id: string, data: UpdateProductRequest): Promise<ApiResponse<Product>> {
    return this.authedRequest<Product>(`/api/v1/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProduct(id: string): Promise<ApiResponse<never>> {
    return this.authedRequest(`/api/v1/products/${id}`, {
      method: 'DELETE',
    });
  }

  async getProductMetadata(params: URLSearchParams = new URLSearchParams()): Promise<ApiResponse<ProductMetadata>> {
    return this.request<ProductMetadata>(`/api/v1/products-metadata?${params.toString()}`);
  }

  async getProductMetadataAll(): Promise<ApiResponse<ProductMetadataAllResponse>> {
    return this.authedRequest<ProductMetadataAllResponse>(`/api/v1/products/metadata-all`);
  }

  // User management methods
  async getUsers(params: URLSearchParams = new URLSearchParams()): Promise<ApiResponse<UserListResponse>> {
    return this.authedRequest<UserListResponse>(`/api/v1/users?${params.toString()}`);
  }

  async createUser(data: CreateUserRequest): Promise<ApiResponse<User>> {
    return this.authedRequest<User>('/api/v1/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: string, data: Partial<CreateUserRequest>): Promise<ApiResponse<User>> {
    return this.authedRequest<User>(`/api/v1/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string): Promise<ApiResponse<never>> {
    return this.authedRequest<never>(`/api/v1/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Audit log methods
  async getAuditLogs(params: URLSearchParams = new URLSearchParams()): Promise<ApiResponse<AuditLogListResponse>> {
    return this.authedRequest<AuditLogListResponse>(`/api/v1/audit?${params.toString()}`);
  }

  async getAuditLogById(id: string): Promise<ApiResponse<AuditLog>> {
    return this.authedRequest<AuditLog>(`/api/v1/audit/${id}`);
  }

  // Warranty management methods - NEW
  async batchCreateWarranty(data: BatchCreateWarrantyRequest): Promise<ApiResponse<BatchCreateWarrantyResponse>> {
    return this.authedRequest<BatchCreateWarrantyResponse>('/api/v1/warranty/batch-create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async checkWarrantyStatus(id: string, customFetch?: typeof fetch): Promise<ApiResponse<WarrantyStatusResponse>> {
    return this.request<WarrantyStatusResponse>(`/api/v1/warranty/${id}/status`, {}, customFetch);
  }

  // anonymous methods (raised by patient)
  async fillWarranty(id: string, data: WarrantyRegistration, customFetch?: typeof fetch): Promise<ApiResponse<WarrantyInfo>> {
    return this.request<WarrantyInfo>(`/api/v1/warranty/${id}/register`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, customFetch);
  }

  async searchWarranty(params: URLSearchParams = new URLSearchParams()): Promise<ApiResponse<WarrantySearchResult>> {
    return this.authedRequest<WarrantySearchResult>(`/api/v1/warranty/search?${params.toString()}`);
  }

  async getWarrantyById(id: string): Promise<ApiResponse<WarrantyInfo>> {
    return this.authedRequest<WarrantyInfo>(`/api/v1/warranty/${id}`);
  }

  async updateWarranty(id: string, data: Partial<WarrantyInfo>): Promise<ApiResponse<WarrantyInfo>> {
    return this.authedRequest<WarrantyInfo>(`/api/v1/warranty/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async resendConfirmationEmail(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.authedRequest(`/api/v1/warranty/${id}/resend-email`, {
      method: 'POST'
    });
  }

  async checkSerialNumber(serialNumber: string, customFetch?: typeof fetch): Promise<ApiResponse<SerialNumberCheckResponse>> {
    const params = new URLSearchParams();
    params.set('serial_number', serialNumber);
    return this.request(`/api/v1/warranty/check-serial?${params.toString()}`, {}, customFetch);
  }

  async deleteWarranty(id: string): Promise<ApiResponse<never>> {
    return this.authedRequest<never>(`/api/v1/warranty/${id}`, {
      method: 'DELETE',
    });
  }

  // Serial management methods
  async getSerials(params: URLSearchParams = new URLSearchParams()): Promise<ApiResponse<SerialListResponse>> {
    return this.authedRequest<SerialListResponse>(`/api/v1/serials?${params.toString()}`);
  }

  async getSerialById(id: string): Promise<ApiResponse<Serial>> {
    return this.authedRequest<Serial>(`/api/v1/serials/${id}`);
  }

  async getSerialBySerialNumber(serialNumber: string): Promise<ApiResponse<Serial>> {
    const params = new URLSearchParams();
    params.set('serial_number', serialNumber);
    return this.authedRequest<Serial>(`/api/v1/serials/by-serial-number?${params.toString()}`);
  }

  async createSerial(data: SerialCreateRequest): Promise<ApiResponse<Serial>> {
    return this.authedRequest<Serial>('/api/v1/serials', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSerial(id: string, data: SerialUpdateRequest): Promise<ApiResponse<Serial>> {
    return this.authedRequest<Serial>(`/api/v1/serials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSerial(id: string): Promise<ApiResponse<never>> {
    return this.authedRequest<never>(`/api/v1/serials/${id}`, {
      method: 'DELETE',
    });
  }

  async bulkCreateSerials(data: SerialBulkImportRequest): Promise<ApiResponse<SerialBulkImportResponse>> {
    return this.authedRequest<SerialBulkImportResponse>('/api/v1/serials/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async checkSerialExists(serialNumber: string): Promise<ApiResponse<{ exists: boolean }>> {
    const params = new URLSearchParams();
    params.set('serial_number', serialNumber);
    return this.authedRequest<{ exists: boolean }>(`/api/v1/serials/check-exists?${params.toString()}`);
  }

  async getSerialsWithProduct(params: URLSearchParams = new URLSearchParams()): Promise<ApiResponse<SerialListResponse>> {
    return this.authedRequest<SerialListResponse>(`/api/v1/serials/with-product?${params.toString()}`);
  }

  async getSerialStats(): Promise<ApiResponse<SerialStatsResponse>> {
    return this.authedRequest<SerialStatsResponse>('/api/v1/serials/stats');
  }

  async listSerialsUsedByWarranty(params: URLSearchParams = new URLSearchParams()): Promise<ApiResponse<SerialListResponse>> {
    return this.authedRequest<SerialListResponse>(`/api/v1/serials/used-by-warranty?${params.toString()}`);
  }

  getCookie(name: string): string | null {
    const cookies = document.cookie.split("; ");
    for (const cookie of cookies) {
      const [key, val] = cookie.split("=");
      if (key === name) return decodeURIComponent(val);
    }
    return null;
  }
}

export const apiService = new ApiService(); 