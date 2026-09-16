// Multi-Location API Types

export interface MultiLocationStatusRequest {
  is_activated: boolean;
}

export interface MultiLocationStatusResponse {
  url: string;
  is_activated: boolean;
}
