// src/lib/types.ts

export interface ProductFilters {
  category: string;
  subcategory: string;
  size: string;
}

export interface ProductFiltersOnchangeData {
  type: string;
  size: string;
  product_id: string;
}

export interface TypeCategorySubcategory{
  category: string;
  subcategory: string;
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