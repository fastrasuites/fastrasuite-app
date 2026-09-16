export type Option = { value: string; label: string };

export interface InternalTransferLineItem {
  id: string;
  product: string;
  product_details: {
    product_name: string;
    unit_of_measure_details: {
      unit_symbol: string;
    };
  };
  quantity_requested: string;
}

export interface InternalTransferFormData {
  source_location: string;
  destination_location: string;
}

export interface InternalTransferSubmissionData {
  source_location: string;
  destination_location: string;
  status?: string;
  internal_transfer_items: {
    product: number;
    quantity_requested: number;
  }[];
}
