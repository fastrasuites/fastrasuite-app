import { LocationDetails, ProductDetails } from "./incomingProduct";

export interface IncomingProductReturnItem {
  id: number;
  product: number;
  product_details?: ProductDetails;
  unit_of_measure?: number;
  unit_of_measure_details?: any;
  received_quantity: string;
  quantity_to_return: string;
}

export interface IncomingProductReturn {
  unique_id: string;
  source_document: string;
  source_document_details?: {
    incoming_product_id: string;
    supplier?: number;
    supplier_name?: string;
  };
  vendor?: string;
  returned_date: string;
  reason_for_return: string;
  status: string;
  returned_by?: any;
  returned_at?: string;
  items: IncomingProductReturnItem[];
  // Legacy compatibility fields
  email_subject?: string;
  email_body?: string;
  supplier_email?: string;
  email_attachment?: string; // URL to attachment if available
}

export interface CreateIncomingProductReturnRequest {
  source_document: string;
  date_of_return?: string; // In legacy it's returned_date
  returned_date?: string; // Legacy API support
  reason_for_return: string;
  incoming_product_return_items?: Array<{
    returned_product_item: number;
    initial_quantity: string;
    returned_quantity: string;
  }>;
  // Payload items format used in legacy:
  return_incoming_product_items?: string; // JSON stringified array of {product, quantity_received, quantity_to_be_returned}
  
  // Notification fields
  email_subject: string;
  email_body: string;
  supplier_email: string;
  email_attachment: File; // The PDF file
}
