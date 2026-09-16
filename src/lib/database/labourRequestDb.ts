import Dexie, { Table } from "dexie";
import type {
  LabourRequest,
  LabourRequestDetail,
  ProjectRequest,
  CreateLabourRequestRequest,
  UpdateLabourRequestRequest,
  PatchLabourRequestRequest,
  ApproveLabourRequest,
  RejectLabourRequest,
  CancelLabourRequest,
} from "../../api/requests/labourRequestApi";

// Sync operation types
export type SyncOperation =
  | "create"
  | "update"
  | "delete"
  | "submit"
  | "approve"
  | "reject"
  | "cancel";

export type SyncQueueItemData =
  | CreateLabourRequestRequest
  | UpdateLabourRequestRequest
  | PatchLabourRequestRequest
  | ApproveLabourRequest
  | RejectLabourRequest
  | CancelLabourRequest
  | Record<string, never>;

export interface SyncQueueItem {
  id?: number;
  operation: SyncOperation;
  labourRequestId?: number; // Server ID for existing requests, undefined for creates
  localId?: string; // Local ID for offline-created requests
  data?: SyncQueueItemData;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
  status: "pending" | "processing" | "failed" | "completed";
  error?: string;
}

// Local labour request - includes all fields from API LabourRequest plus offline metadata
export interface LocalLabourRequest {
  // Core identification
  localId: string; // Local UUID for offline identification
  id?: number; // Server ID (only present after sync)

  // Main request fields (aligned with LabourRequest)
  reference_id: string;
  request_type: string;
  module_destination: string;
  status: "draft" | "pending" | "approved" | "rejected";
  created_by: number;
  created_at: string;
  updated_at: string;

  // Detail object (aligned with LabourRequestDetail)
  detail: {
    id?: number; // Server detail ID
    date_required: string;
    number_of_workers: number;
    role_type: string;
    duration: number;
    duration_unit: "days" | "weeks" | "months" | string;
    estimated_daily_rate: string;
    projected_cost: string;
    justification_notes: string;
    created_at?: string;
    updated_at?: string;
    created_by_name?: string;
  };

  // Project request (aligned with ProjectRequest)
  project_request: {
    id?: number; // Server project request ID
    reference_id: string;
    request_type: string;
    status: "draft" | "pending" | "approved" | "rejected";
    module_destination: string;
    created_at: string;
    updated_at: string;
    project: number;
    created_by: number;
    created_by_details?: {
      id: number;
      user: {
        id: number;
        username: string;
        first_name: string;
        last_name: string;
        email: string;
      };
      role: string;
    };
  };

  // Offline metadata
  isSynced: boolean;
  lastSyncedAt?: string;
  needsSync: boolean;
}

interface Modification {
  updated_at: string;
}

export class LabourRequestDatabase extends Dexie {
  labourRequests!: Table<LocalLabourRequest>;
  syncQueue!: Table<SyncQueueItem>;

  constructor() {
    super("LabourRequestDatabase");

    this.version(1).stores({
      labourRequests:
        "&localId, id, *project_request.status, created_at, updated_at, needsSync, isSynced",
      syncQueue:
        "++id, operation, labourRequestId, localId, timestamp, retryCount, status",
    });

    // Add hooks for automatic timestamp updates
    this.labourRequests.hook("creating", (primKey, obj, trans) => {
      obj.created_at = obj.created_at || new Date().toISOString();
      obj.updated_at = obj.updated_at || new Date().toISOString();
    });
  }

  // Helper methods for labour requests
  async getPendingSyncRequests(): Promise<LocalLabourRequest[]> {
    return this.labourRequests.where("needsSync").equals(1).toArray();
  }

  async getUnsyncedQueueItems(): Promise<SyncQueueItem[]> {
    return this.syncQueue.where("status").anyOf("pending", "failed").toArray();
  }

  async markRequestAsSynced(localId: string, serverId: number): Promise<void> {
    await this.labourRequests.update(localId, {
      id: serverId,
      isSynced: true,
      needsSync: false,
      lastSyncedAt: new Date().toISOString(),
    });
  }

  async updateRequestFromServer(
    localId: string,
    serverData: LabourRequest,
  ): Promise<void> {
    await this.labourRequests.update(localId, {
      ...serverData,
      detail: serverData.detail,
      project_request: serverData.project_request,
      localId,
      isSynced: true,
      needsSync: false,
      lastSyncedAt: new Date().toISOString(),
    });
  }

  async addToSyncQueue(
    operation: SyncOperation,
    data: SyncQueueItemData,
    labourRequestId?: number,
    localId?: string,
  ): Promise<number> {
    const queueItem: Omit<SyncQueueItem, "id"> = {
      operation,
      labourRequestId,
      localId,
      data,
      timestamp: new Date(),
      retryCount: 0,
      maxRetries: 3,
      status: "pending",
    };

    return this.syncQueue.add(queueItem as SyncQueueItem);
  }

  async updateQueueItemStatus(
    queueId: number,
    status: SyncQueueItem["status"],
    error?: string,
  ): Promise<void> {
    const update: Partial<SyncQueueItem> = { status };
    if (error) update.error = error;
    if (status === "failed") {
      const item = await this.syncQueue.get(queueId);
      update.retryCount = (item?.retryCount || 0) + 1;
    }

    await this.syncQueue.update(queueId, update);
  }

  async cleanupCompletedQueueItems(): Promise<void> {
    await this.syncQueue.where("status").equals("completed").delete();
  }

  async getFailedQueueItems(): Promise<SyncQueueItem[]> {
    return this.syncQueue
      .where("status")
      .equals("failed")
      .and((item) => item.retryCount >= item.maxRetries)
      .toArray();
  }

  async canRetryQueueItem(queueId: number): Promise<boolean> {
    const item = await this.syncQueue.get(queueId);
    if (!item) return false;
    return item.retryCount < item.maxRetries;
  }
}

// Create and export a singleton instance
export const db = new LabourRequestDatabase();

// Initialize the database
export const initDatabase = async (): Promise<void> => {
  try {
    await db.open();
    console.log("Labour Request Database initialized");
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
  }
};

// Helper function to generate local IDs
export const generateLocalId = (): string => {
  return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Transform a server LabourRequest to LocalLabourRequest format
 * Used when receiving data from the API to store locally
 */
export const transformServerToLocal = (
  serverData: LabourRequest,
): LocalLabourRequest => {
  return {
    localId: `server_${serverData.id}`,
    id: serverData.id,
    reference_id: serverData.reference_id,
    request_type: serverData.request_type,
    module_destination: serverData.module_destination,
    status: serverData.status,
    created_by: serverData.created_by,
    created_at: serverData.created_at,
    updated_at: serverData.updated_at,
    detail: {
      id: serverData.detail.id,
      date_required: serverData.detail.date_required,
      number_of_workers: serverData.detail.number_of_workers,
      role_type: serverData.detail.role_type,
      duration: serverData.detail.duration,
      duration_unit: serverData.detail.duration_unit,
      estimated_daily_rate: serverData.detail.estimated_daily_rate,
      projected_cost: serverData.detail.projected_cost,
      justification_notes: serverData.detail.justification_notes,
      created_at: serverData.detail.created_at,
      updated_at: serverData.detail.updated_at,
      created_by_name: serverData.detail.created_by_name,
    },
    project_request: {
      id: serverData.project_request?.id,
      reference_id: serverData.project_request?.reference_id,
      request_type: serverData.project_request?.request_type,
      status: serverData.project_request?.status,
      module_destination: serverData.project_request?.module_destination,
      created_at: serverData.project_request?.created_at,
      updated_at: serverData.project_request?.updated_at,
      project: serverData.project_request?.project,
      created_by: serverData.project_request?.created_by,
      created_by_details: serverData.project_request?.created_by_details,
    } as any,
    isSynced: true,
    needsSync: false,
    lastSyncedAt: new Date().toISOString(),
  };
};

/**
 * Transform LocalLabourRequest to format expected by create API
 * Used when syncing offline-created requests
 */
export const transformLocalToCreateRequest = (
  localData: LocalLabourRequest,
): CreateLabourRequestRequest => {
  return {
    project: localData.project_request.project,
    date_required: localData.detail.date_required,
    number_of_workers: localData.detail.number_of_workers,
    role_type: localData.detail.role_type,
    duration: localData.detail.duration,
    duration_unit: localData.detail.duration_unit,
    estimated_daily_rate: localData.detail.estimated_daily_rate,
    justification_notes: localData.detail.justification_notes,
  };
};

/**
 * Transform LocalLabourRequest to format expected by update/patch API
 * Used when syncing offline-updated requests
 */
export const transformLocalToUpdateRequest = (
  localData: LocalLabourRequest,
): UpdateLabourRequestRequest => {
  return {
    project: localData.project_request.project,
    date_required: localData.detail.date_required,
    number_of_workers: localData.detail.number_of_workers,
    role_type: localData.detail.role_type,
    duration: localData.detail.duration,
    duration_unit: localData.detail.duration_unit,
    estimated_daily_rate: localData.detail.estimated_daily_rate,
    justification_notes: localData.detail.justification_notes,
  };
};
