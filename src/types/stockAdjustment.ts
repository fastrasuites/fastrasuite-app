// Stock Adjustment Types based on API documentation

export interface User {
  url: string;
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface LocationManagerDetails {
  url: string;
  id: number;
  user: User;
  role: string;
  phone_number: string;
  language: string;
  timezone: string;
  in_app_notifications: boolean;
  email_notifications: boolean;
  groups: string[];
}

export interface StoreKeeperDetails {
  url: string;
  id: number;
  user: User;
  role: string;
  phone_number: string;
  language: string;
  timezone: string;
  in_app_notifications: boolean;
  email_notifications: boolean;
  groups: string[];
}

export interface WarehouseLocationDetails {
  id: string;
  location_code: string;
  location_name: string;
  location_type: string;
  address: string;
  location_manager: number;
  location_manager_details: LocationManagerDetails;
  store_keeper: number;
  store_keeper_details: StoreKeeperDetails;
  contact_information: string;
  is_hidden: boolean;
}

export interface UnitOfMeasureDetails {
  url: string;
  unit_name: string;
  unit_symbol: string;
  unit_category: string;
  created_on: string;
  is_hidden: boolean;
}

export interface ProductDetails {
  url: string;
  id: number | string;
  product_name: string;
  product_description: string;
  product_category: string;
  available_product_quantity: string;
  total_quantity_purchased: string;
  unit_of_measure: number;
  created_on: string;
  updated_on: string;
  is_hidden: boolean;
  unit_of_measure_details: UnitOfMeasureDetails;
}

export interface StockAdjustmentItem {
  id: string;
  product: number;
  unit_of_measure: string;
  new_quantity: string;
  stock_adjustment: string;
  effective_quantity: string;
  current_quantity: string;
  product_details: ProductDetails;
}

export type StockAdjustmentStatus = "draft" | "done";

export interface StockAdjustment {
  url: string;
  id: string;
  adjustment_type: string;
  warehouse_location: string;
  warehouse_location_details: WarehouseLocationDetails;
  notes: string;
  reason?: string;
  status: StockAdjustmentStatus;
  is_hidden: boolean;
  stock_adjustment_items: StockAdjustmentItem[];
  is_done: boolean;
  can_edit: boolean;
}

// Request/Response types for mutations
export interface CreateStockAdjustmentRequest {
  warehouse_location: string;
  notes?: string;
  reason?: string;
  status?: StockAdjustmentStatus;
  is_hidden?: boolean;
  project?: number;
  adjustment_date?: string;
  stock_adjustment_items: {
    product: number;
    new_quantity: string;
  }[];
}

export interface UpdateStockAdjustmentRequest {
  warehouse_location?: string;
  notes?: string;
  reason?: string;
  status?: StockAdjustmentStatus;
  is_hidden?: boolean;
  stock_adjustment_items?: {
    id?: string;
    product: number;
    new_quantity: string;
  }[];
}

export interface PatchStockAdjustmentRequest {
  warehouse_location?: string;
  notes?: string;
  status?: StockAdjustmentStatus;
  is_hidden?: boolean;
  stock_adjustment_items?: {
    id?: string;
    product: number;
    new_quantity: string;
  }[];
}

// Query parameters
export interface GetStockAdjustmentsParams {
  date_created?: string;
  search?: string;
  status?: StockAdjustmentStatus;
  warehouse_location__id?: string;
}

// Toggle hidden status request
export interface ToggleHiddenStatusRequest {
  warehouse_location?: string;
  notes?: string;
  status?: StockAdjustmentStatus;
  is_hidden?: boolean;
  stock_adjustment_items?: {
    product: number;
    new_quantity: string;
  }[];
}
