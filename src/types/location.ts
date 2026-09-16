// Location-related TypeScript type definitions for the inventory API

export interface User {
  url: string;
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface UserDetails {
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

export type LocationType = "internal" | "partner";

export interface Location {
  id: string;
  location_code: string;
  location_name: string;
  location_type: LocationType;
  address: string;
  location_manager: number;
  location_manager_details: UserDetails;
  store_keeper: number;
  store_keeper_details: UserDetails;
  contact_information: string;
  is_hidden: boolean;
}

// API Parameter Types
export interface GetLocationsParams {
  location_manager__user_id?: number;
  location_name?: string;
  location_type?: LocationType;
  search?: string;
  store_keeper__user_id?: number;
  [key: string]: string | number | boolean | undefined;
}

// Request Types
export interface CreateLocationRequest {
  location_code: string;
  location_name: string;
  location_type: LocationType;
  address: string;
  location_manager: number;
  store_keeper: number;
  contact_information?: string;
  is_hidden?: boolean;
}

export interface UpdateLocationRequest {
  id?: string;
  location_code: string;
  location_name: string;
  location_type: LocationType;
  address: string;
  location_manager: number;
  store_keeper: number;
  contact_information?: string;
  is_hidden?: boolean;
}

export interface PatchLocationRequest {
  location_code?: string;
  location_name?: string;
  location_type?: LocationType;
  address?: string;
  location_manager?: number;
  store_keeper?: number;
  contact_information?: string;
  is_hidden?: boolean;
}

export interface StockLevelItem {
  product_id: number;
  product_name: string;
  product_unit_of_measure: string;
}
