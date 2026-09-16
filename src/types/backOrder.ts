import { LocationDetails, ProductDetails, SupplierDetails } from "./incomingProduct";

export interface BackOrderItem {
  id: string;
  product: number;
  product_details: ProductDetails;
  expected_quantity: string;
  quantity_received: string;
}

export interface BackOrder {
  backorder_id: string;
  backorder_of: string;
  backorder_of_details?: {
    id: string;
    incoming_product_id: string;
    receipt_type: string;
    source_location_details: LocationDetails;
    destination_location_details: LocationDetails;
    supplier_details: SupplierDetails;
    incoming_product_items: BackOrderItem[];
  };
  backorder_items: BackOrderItem[];
  source_location: string;
  source_location_details?: LocationDetails;
  destination_location: string;
  destination_location_details?: LocationDetails;
  supplier: number;
  supplier_details?: SupplierDetails;
  status: "draft" | "validated" | "canceled";
  receipt_type: string;
  date_created: string;
  is_hidden: boolean;
}

export interface GetBackOrdersParams {
  search?: string;
  destination_location__id?: string;
  status?: string;
  backorder_of__incoming_product_id?: string;
}

export interface CreateBackOrderRequest {
  backorder_of: string;
  backorder_items: Array<{
    product: number;
    expected_quantity: string;
  }>;
  source_location: string;
  destination_location: string;
  supplier: number;
  receipt_type: string;
  status?: string;
}
