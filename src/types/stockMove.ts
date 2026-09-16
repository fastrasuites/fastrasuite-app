import { ProductDetails } from "./stockAdjustment";

export interface StockMove {
  id: number | string;
  reference: string;
  product: number;
  product_details: any;
  quantity: string;
  unit_of_measure: number;
  unit_of_measure_details: any;
  running_balance: string;
  move_type: string;
  source_document_id: string;
  source_document_type: string;
  source_location: string;
  destination_location: string;
  project: string;
  wbs_phase: string;
  wbs_activity: string;
  moved_by: number;
  moved_by_details: any;
  date_moved: string;
  date_created: string;
  created_at?: string;
  notes?: string;
  unit_cost?: number;
  total_value?: number;
  source_location_details?: any;
  destination_location_details?: any;
}

export interface GetStockMovesParams {
  date_from?: string;
  date_to?: string;
  destination_location?: number;
  product?: number;
  source_location?: number;
  search?: string;
}
