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