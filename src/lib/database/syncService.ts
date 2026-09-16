import { db, SyncQueueItem, SyncOperation, generateLocalId, LocalLabourRequest, transformServerToLocal, transformLocalToCreateRequest, transformLocalToUpdateRequest } from './labourRequestDb';
import {
  CreateLabourRequestRequest,
  UpdateLabourRequestRequest,
  PatchLabourRequestRequest,
  LabourRequest,
  ApproveLabourRequest,
  RejectLabourRequest,
  CancelLabourRequest,
  SubmitLabourRequestRequest
} from '../../api/requests/labourRequestApi';

class SyncService {
  private isOnline = false;
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.checkNetworkStatus();
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.startBackgroundSync();
      });
      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.stopBackgroundSync();
      });
    }
  }

  private checkNetworkStatus() {
    if (typeof navigator !== 'undefined') {
      this.isOnline = navigator.onLine;
    }
  }

  private startBackgroundSync() {
    if (this.syncInterval) return;

    // Sync every 30 seconds when online
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.performSync();
      }
    }, 30000);

    // Also sync immediately
    this.performSync();
  }

  private stopBackgroundSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  private getTenantBaseUrl(): string {
    const tenant = localStorage.getItem('tenant_schema_name') || 'default';
    const apiDomain = process.env.NEXT_PUBLIC_API_DOMAIN || "fastrasuiteapi.com.ng";
    const protocol = (apiDomain.includes("localhost") || apiDomain.includes("127.0.0.1")) ? "http" : "https";
    return `${protocol}://${tenant}.${apiDomain}`;
  }

  private getHeaders(): Headers {
    const headers = new Headers();
    headers.set('content-type', 'application/json');
    const token = localStorage.getItem('access_token');
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  }

  private async makeApiRequest<T>(url: string, options: RequestInit): Promise<T> {
    const response = await fetch(url, options);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API request failed: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  async performSync(): Promise<void> {
    if (this.isSyncing || !this.isOnline) return;

    this.isSyncing = true;
    console.log('[Sync] Starting offline sync...');

    try {
      const queueItems = await db.getUnsyncedQueueItems();
      console.log(`[Sync] Found ${queueItems.length} items to sync`);

      // Sort by timestamp to maintain order
      queueItems.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      for (const item of queueItems) {
        try {
          // Check if item can be retried
          const canRetry = await db.canRetryQueueItem(item.id!);
          if (item.status === 'failed' && !canRetry) {
            console.log(`[Sync] Skipping item ${item.id} - max retries exceeded`);
            continue;
          }

          await this.processQueueItem(item);
        } catch (error) {
          console.error(`[Sync] Failed to sync item ${item.id}:`, error);
          await db.updateQueueItemStatus(item.id!, 'failed', (error as Error).message);
        }
      }

      // Clean up completed items
      await db.cleanupCompletedQueueItems();

      console.log('[Sync] Offline sync completed');
    } catch (error) {
      console.error('[Sync] Sync process failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  private async processQueueItem(item: SyncQueueItem): Promise<void> {
    console.log(`[Sync] Processing item ${item.id}: ${item.operation} (retry ${item.retryCount})`);
    await db.updateQueueItemStatus(item.id!, 'processing');

    try {
      switch (item.operation) {
        case 'create':
          await this.syncCreateRequest(item);
          break;
        case 'update':
          await this.syncUpdateRequest(item);
          break;
        case 'delete':
          await this.syncDeleteRequest(item);
          break;
        case 'submit':
          await this.syncSubmitRequest(item);
          break;
        case 'approve':
          await this.syncApproveRequest(item);
          break;
        case 'reject':
          await this.syncRejectRequest(item);
          break;
        case 'cancel':
          await this.syncCancelRequest(item);
          break;
        default:
          throw new Error(`Unknown operation: ${item.operation}`);
      }

      await db.updateQueueItemStatus(item.id!, 'completed');
      console.log(`[Sync] Item ${item.id} completed successfully`);
    } catch (error) {
      await db.updateQueueItemStatus(item.id!, 'failed', (error as Error).message);
      console.error(`[Sync] Item ${item.id} failed:`, error);
      throw error;
    }
  }

  private async syncCreateRequest(item: SyncQueueItem): Promise<void> {
    const createData = item.data as CreateLabourRequestRequest;
    const url = `${this.getTenantBaseUrl()}/project-requests/labour-requests/`;

    const serverData: LabourRequest = await this.makeApiRequest(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(createData),
    });

    console.log(`[Sync] Create successful, server ID: ${serverData.id}`);

    // Update local data with server response
    if (item.localId) {
      const localRequest = await db.labourRequests.get(item.localId);
      if (localRequest) {
        await db.updateRequestFromServer(item.localId, serverData);
        console.log(`[Sync] Local record ${item.localId} updated with server data`);
      }
    }
  }

  private async syncUpdateRequest(item: SyncQueueItem): Promise<void> {
    if (!item.labourRequestId) return;

    const updateData = item.data as UpdateLabourRequestRequest;
    const url = `${this.getTenantBaseUrl()}/project-requests/labour-requests/${item.labourRequestId}/`;

    const serverData: LabourRequest = await this.makeApiRequest(url, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(updateData),
    });

    // Update local data
    const localRequests = await db.labourRequests.where('id').equals(item.labourRequestId).toArray();
    for (const localRequest of localRequests) {
      await db.updateRequestFromServer(localRequest.localId, serverData);
    }
  }

  private async syncDeleteRequest(item: SyncQueueItem): Promise<void> {
    if (!item.labourRequestId) return;

    const url = `${this.getTenantBaseUrl()}/project-requests/labour-requests/${item.labourRequestId}/`;

    await this.makeApiRequest(url, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    // Remove from local database
    await db.labourRequests.where('id').equals(item.labourRequestId).delete();
  }

  private async syncCancelRequest(item: SyncQueueItem): Promise<void> {
    if (!item.labourRequestId) return;

    const url = `${this.getTenantBaseUrl()}/project-requests/project-requests/${item.labourRequestId}/cancel/`;
    const data = (item.data as CancelLabourRequest) || { status: 'cancelled' };

    const serverData: LabourRequest = await this.makeApiRequest(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    // Update local data
    const localRequests = await db.labourRequests.where('id').equals(item.labourRequestId).toArray();
    for (const localRequest of localRequests) {
      await db.updateRequestFromServer(localRequest.localId, serverData);
    }
  }

  private async syncApproveRequest(item: SyncQueueItem): Promise<void> {
    if (!item.labourRequestId) return;

    const url = `${this.getTenantBaseUrl()}/project-requests/project-requests/${item.labourRequestId}/approve/`;
    const data = (item.data as ApproveLabourRequest) || { status: 'approved' };

    const serverData: LabourRequest = await this.makeApiRequest(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    // Update local data
    const localRequests = await db.labourRequests.where('id').equals(item.labourRequestId).toArray();
    for (const localRequest of localRequests) {
      await db.updateRequestFromServer(localRequest.localId, serverData);
    }
  }

  private async syncRejectRequest(item: SyncQueueItem): Promise<void> {
    if (!item.labourRequestId) return;

    const url = `${this.getTenantBaseUrl()}/project-requests/project-requests/${item.labourRequestId}/reject/`;
    const data = (item.data as RejectLabourRequest) || { status: 'rejected' };

    const serverData: LabourRequest = await this.makeApiRequest(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    // Update local data
    const localRequests = await db.labourRequests.where('id').equals(item.labourRequestId).toArray();
    for (const localRequest of localRequests) {
      await db.updateRequestFromServer(localRequest.localId, serverData);
    }
  }

  private async syncSubmitRequest(item: SyncQueueItem): Promise<void> {
    if (!item.labourRequestId) return;

    const url = `${this.getTenantBaseUrl()}/project-requests/project-requests/${item.labourRequestId}/submit/`;
    const data = (item.data as SubmitLabourRequestRequest) || {};

    const serverData: LabourRequest = await this.makeApiRequest(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    // Update local data
    const localRequests = await db.labourRequests.where('id').equals(item.labourRequestId).toArray();
    for (const localRequest of localRequests) {
      await db.updateRequestFromServer(localRequest.localId, serverData);
    }
  }

  // Public methods for manual operations
  async createRequestOffline(data: CreateLabourRequestRequest): Promise<LocalLabourRequest> {
    const localId = generateLocalId();
    const now = new Date().toISOString();
    
    const localRequest: LocalLabourRequest = {
      localId,
      reference_id: `LOCAL-${localId.slice(-8)}`,
      request_type: 'labour',
      module_destination: 'labour',
      status: 'draft',
      created_by: 0, // Will be set from auth on sync
      created_at: now,
      updated_at: now,
      detail: {
        date_required: data.date_required,
        number_of_workers: data.number_of_workers,
        role_type: data.role_type,
        duration: data.duration,
        duration_unit: data.duration_unit,
        estimated_daily_rate: data.estimated_daily_rate,
        projected_cost: (data.number_of_workers * parseFloat(data.estimated_daily_rate)).toString(),
        justification_notes: data.justification_notes || '',
      },
      project_request: {
        reference_id: `LOCAL-${localId.slice(-8)}`,
        request_type: 'labour',
        status: 'draft',
        module_destination: 'labour',
        created_at: now,
        updated_at: now,
        project: data.project,
        created_by: 0,
      },
      isSynced: false,
      needsSync: true,
    };

    await db.labourRequests.add(localRequest);
    await db.addToSyncQueue('create', data, undefined, localId);

    console.log(`[Offline] Created local request ${localId}`);
    return localRequest;
  }

  async updateRequestOffline(localId: string, data: UpdateLabourRequestRequest): Promise<void> {
    // Get existing local request
    const existing = await db.labourRequests.get(localId);
    if (!existing) {
      throw new Error(`Local request with id ${localId} not found`);
    }

    // Update detail fields if provided
    if (data.date_required !== undefined) {
      existing.detail.date_required = data.date_required;
    }
    if (data.number_of_workers !== undefined) {
      existing.detail.number_of_workers = data.number_of_workers;
    }
    if (data.role_type !== undefined) {
      existing.detail.role_type = data.role_type;
    }
    if (data.duration !== undefined) {
      existing.detail.duration = data.duration;
    }
    if (data.duration_unit !== undefined) {
      existing.detail.duration_unit = data.duration_unit;
    }
    if (data.estimated_daily_rate !== undefined) {
      existing.detail.estimated_daily_rate = data.estimated_daily_rate;
    }
    if (data.justification_notes !== undefined) {
      existing.detail.justification_notes = data.justification_notes;
    }

    // Recalculate projected cost
    existing.detail.projected_cost = (
      existing.detail.number_of_workers * parseFloat(existing.detail.estimated_daily_rate)
    ).toString();

    // Update project if provided
    if (data.project !== undefined) {
      existing.project_request.project = data.project;
    }

    // Update timestamps
    existing.updated_at = new Date().toISOString();
    existing.needsSync = true;

    await db.labourRequests.update(localId, existing);

    // Add to sync queue
    await db.addToSyncQueue('update', data, existing.id, localId);

    console.log(`[Offline] Updated local request ${localId}`);
  }

  async deleteRequestOffline(localId: string): Promise<void> {
    const existing = await db.labourRequests.get(localId);
    if (!existing) {
      throw new Error(`Local request with id ${localId} not found`);
    }

    // If request has a server ID, queue for deletion on server
    if (existing.id) {
      await db.addToSyncQueue('delete', {}, existing.id, localId);
    }

    // Remove from local database
    await db.labourRequests.delete(localId);

    console.log(`[Offline] Deleted local request ${localId}`);
  }

  async submitRequestOffline(localId: string): Promise<void> {
    const existing = await db.labourRequests.get(localId);
    if (!existing) {
      throw new Error(`Local request with id ${localId} not found`);
    }

    // Update local status
    existing.project_request.status = 'pending';
    existing.status = 'pending';
    existing.updated_at = new Date().toISOString();
    existing.needsSync = true;

    await db.labourRequests.update(localId, existing);

    // Queue for submission
    await db.addToSyncQueue('submit', {}, existing.id, localId);

    console.log(`[Offline] Submitted local request ${localId} for approval`);
  }

  async approveRequestOffline(localId: string, data: ApproveLabourRequest): Promise<void> {
    const existing = await db.labourRequests.get(localId);
    if (!existing) {
      throw new Error(`Local request with id ${localId} not found`);
    }

    // Update local status
    existing.project_request.status = 'approved';
    existing.status = 'approved';
    existing.updated_at = new Date().toISOString();
    existing.needsSync = true;

    await db.labourRequests.update(localId, existing);

    // Queue for approval
    await db.addToSyncQueue('approve', data, existing.id, localId);

    console.log(`[Offline] Approved local request ${localId}`);
  }

  async rejectRequestOffline(localId: string, data: RejectLabourRequest): Promise<void> {
    const existing = await db.labourRequests.get(localId);
    if (!existing) {
      throw new Error(`Local request with id ${localId} not found`);
    }

    // Update local status
    existing.project_request.status = 'rejected';
    existing.status = 'rejected';
    existing.updated_at = new Date().toISOString();
    existing.needsSync = true;

    await db.labourRequests.update(localId, existing);

    // Queue for rejection
    await db.addToSyncQueue('reject', data, existing.id, localId);

    console.log(`[Offline] Rejected local request ${localId}`);
  }

  async cancelRequestOffline(localId: string, data: CancelLabourRequest): Promise<void> {
    const existing = await db.labourRequests.get(localId);
    if (!existing) {
      throw new Error(`Local request with id ${localId} not found`);
    }

    // Update local status - use 'rejected' as closest match since 'cancelled' is not in API
    existing.project_request.status = 'rejected';
    existing.status = 'rejected';
    existing.updated_at = new Date().toISOString();
    existing.needsSync = true;

    await db.labourRequests.update(localId, existing);

    // Queue for cancellation
    await db.addToSyncQueue('cancel', data, existing.id, localId);

    console.log(`[Offline] Cancelled local request ${localId}`);
  }

  getSyncStatus() {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
    };
  }
}

// Export singleton instance
export const syncService = new SyncService();