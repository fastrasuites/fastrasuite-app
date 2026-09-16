// Types for Delivery Order API

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

export interface LocationDetails {
  id: string;
  location_code: string;
  location_name: string;
  location_type: string;
  address: string;
  location_manager: number;
  location_manager_details: UserDetails;
  store_keeper: number;
  store_keeper_details: UserDetails;
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

export interface DeliveryOrderItem {
  id: number;
  unit_price: string;
  total_price: string;
  product_details: ProductDetails;
  quantity_to_deliver: number;
  date_created: string;
  delivery_order: number;
}

export interface DeliveryOrderItemAvailability extends DeliveryOrderItem {
  is_available: boolean;
}

export interface DeliveryOrder {
  id: number;
  order_unique_id: string;
  customer_name: string;
  source_location: string;
  source_location_details: LocationDetails;
  delivery_address: string;
  delivery_date: string;
  shipping_policy: string;
  return_policy: string;
  assigned_to: string;
  delivery_order_items: DeliveryOrderItem[];
  status: string;
  date_created: string;
}

export interface DeliveryOrderWithAvailability extends DeliveryOrder {
  delivery_order_items: DeliveryOrderItemAvailability[];
}

export interface DeliveryOrderConfirmed extends DeliveryOrder {
  delivery_order_items: DeliveryOrderItemAvailability[];
  status: string;
  // Assuming similar structure, but status might be updated
}
