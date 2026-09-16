export interface AuditTrail {
  id: number;
  action: string;
  module: string;
  description: string;
  actor: number;
  actor_details?: string | {
    id?: number;
    name?: string;
    email?: string;
    username?: string;
    first_name?: string;
    last_name?: string;
  } | null;
  tenant: number;
  content_type: number;
  object_id: string;
  old_values: string | Record<string, any> | null;
  new_values: string | Record<string, any> | null;
  metadata: string | Record<string, any> | null;
  ip_address: string;
  created_at: string;
}

export interface AuditTrailParams {
  ordering?: string;
  search?: string;
  module?: string;
  action?: string;
  page?: number;
  page_size?: number;
}
