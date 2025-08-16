// src/lib/types.ts

export interface ProductFilters {
  brand: string;
  type: string;
  model_number: string;
  size: string;
  active: string;
}

export interface ProductFilterProps {
  filters: ProductFilters;
  presetBrand?: string;
  getAllMetadata?: boolean;
}

// Serial related types
export interface Serial {
  id: string;
  serial_number: string;
  full_serial_number: string;
  product_id: string | null;
  created_at: string;
  updated_at: string;
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