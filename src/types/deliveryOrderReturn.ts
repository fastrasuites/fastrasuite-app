// Types for Delivery Order Return API

import { LocationDetails, ProductDetails } from "./deiveryOrder"; // Note: there's a typo in the filename, but using as is

export interface DeliveryOrderReturnItem {
  returned_product_item: number;
  returned_product_item_details?: ProductDetails; // Optional for display
  initial_quantity: number;
  returned_quantity: number;
  product_details?: ProductDetails; // Optional for display
}

export interface DeliveryOrderReturn {
  id: number;
  unique_record_id: string;
  source_document: number;
  date_of_return: string;
  source_location: string;
  return_warehouse_location: string;
  return_warehouse_location_details: LocationDetails;
  reason_for_return: string;
  delivery_order_return_items: DeliveryOrderReturnItem[];
  status?: string; // Assuming it might have status like delivery order
  date_created?: string;
}

export interface DeliveryOrderReturnPayload {
  source_document: number;
  date_of_return: string;
  source_location: string;
  return_warehouse_location: string;
  reason_for_return: string;
  delivery_order_return_items: Omit<
    DeliveryOrderReturnItem,
    "product_details"
  >[];
}

export interface DeliveryOrderOption {
  id: number;
  order_unique_id: string;
  delivery_address: string;
  source_location_details: LocationDetails;
  delivery_order_items: Array<{
    id: number;
    product_details: ProductDetails;
    quantity_to_deliver: number;
  }>;
}
