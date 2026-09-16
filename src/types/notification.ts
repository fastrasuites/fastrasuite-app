export interface AppNotification {
  id: number;
  module: string;
  module_display: string;
  event: string;
  title: string;
  message: string;
  actor_name: string;
  action_url: string;
  object_id: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface GetNotificationsParams {
  ordering?: string;
  search?: string;
  is_read?: boolean | string;
  module?: string;
  [key: string]: string | number | boolean | undefined;
}
