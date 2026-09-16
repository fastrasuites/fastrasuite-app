// Scrap Types based on API documentation

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
  id: number;
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

export interface ScrapItem {
  id: string;
  scrap: string;
  product: number;
  scrap_quantity: string;
  adjusted_quantity: string;
  product_details: ProductDetails;
}

export type ScrapStatus = "draft" | "done";
export type AdjustmentType = "DAMAGE" | "LOSS";

export interface Scrap {
  url: string;
  id: string;
  adjustment_type: AdjustmentType;
  cause?: AdjustmentType;
  warehouse_location: string;
  warehouse_location_details: WarehouseLocationDetails;
  project?: number;
  project_details?: {
    id: number;
    project_code: string;
    name: string;
    status: string;
  };
  notes: string;
  status: ScrapStatus;
  is_hidden: boolean;
  scrap_items: ScrapItem[];
  items?: ScrapItem[];
  is_done: boolean;
  can_edit: boolean;
}

// Request/Response types for mutations
export interface CreateScrapRequest {
  cause: AdjustmentType;
  warehouse_location: string;
  project?: string | number;
  notes?: string;
  status?: ScrapStatus;
  is_hidden?: boolean;
  items: {
    product: number;
    scrap_quantity: string;
  }[];
}

export interface UpdateScrapRequest {
  cause?: AdjustmentType;
  warehouse_location?: string;
  notes?: string;
  status?: ScrapStatus;
  is_hidden?: boolean;
  items?: {
    id?: string;
    product: number;
    scrap_quantity: string;
  }[];
}

export interface PatchScrapRequest {
  adjustment_type?: AdjustmentType;
  warehouse_location?: string;
  notes?: string;
  status?: ScrapStatus;
  is_hidden?: boolean;
  scrap_items?: {
    id?: string;
    product: number;
    scrap_quantity: string;
  }[];
}

// Query parameters
export interface GetScrapsParams {
  adjustment_type?: AdjustmentType;
  date_created?: string;
  search?: string;
  status?: ScrapStatus;
  warehouse_location__id?: string;
}

// Toggle hidden status request
export interface ToggleHiddenStatusRequest {
  adjustment_type?: AdjustmentType;
  warehouse_location?: string;
  notes?: string;
  status?: ScrapStatus;
  is_hidden?: boolean;
  scrap_items?: {
    product: number;
    scrap_quantity: string;
  }[];
}
