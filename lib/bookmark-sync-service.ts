import { Bookmark, BookmarkCategory } from "./local-storage-service";

interface PendingChange {
  id: string;
  type: 'add' | 'update' | 'delete';
  entityType: 'bookmark' | 'category';
  data?: Bookmark | BookmarkCategory;
  timestamp: number;
}

interface SyncState {
  lastSyncTime: number;
  pendingChanges: PendingChange[];
  isOnline: boolean;
}

const SYNC_STORAGE_KEY = 'bookmark_sync_state';
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

class BookmarkSyncService {
  private syncState: SyncState;
  
  constructor() {
    this.syncState = this.loadSyncState();
    this.setupOnlineStatusListener();
  }
  
  /**
   * Load the sync state from localStorage
   */
  private loadSyncState(): SyncState {
    if (typeof window === 'undefined') {
      return { lastSyncTime: 0, pendingChanges: [], isOnline: true };
    }
    
    try {
      const storedState = localStorage.getItem(SYNC_STORAGE_KEY);
      if (storedState) {
        return JSON.parse(storedState);
      }
    } catch (error) {
      console.error('Error loading sync state:', error);
    }
    
    return { lastSyncTime: 0, pendingChanges: [], isOnline: navigator.onLine };
  }
  
  /**
   * Save the sync state to localStorage
   */
  private saveSyncState(): void {
    if (typeof window === 'undefined') {
      return;
    }
    
    try {
      localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(this.syncState));
    } catch (error) {
      console.error('Error saving sync state:', error);
    }
  }
  
  /**
   * Setup listener for online/offline status changes
   */
  private setupOnlineStatusListener(): void {
    if (typeof window === 'undefined') {
      return;
    }
    
    window.addEventListener('online', () => {
      this.syncState.isOnline = true;
      this.saveSyncState();
      this.syncPendingChanges();
    });
    
    window.addEventListener('offline', () => {
      this.syncState.isOnline = false;
      this.saveSyncState();
    });
  }
  
  /**
   * Track a change to be synchronized later
   */
  trackChange(
    type: 'add' | 'update' | 'delete',
    entityType: 'bookmark' | 'category',
    data?: Bookmark | BookmarkCategory
  ): void {
    const change: PendingChange = {
      id: data?.id || `temp_${Date.now()}`,
      type,
      entityType,
      data,
      timestamp: Date.now(),
    };
    
    // Add to pending changes
    this.syncState.pendingChanges.push(change);
    this.saveSyncState();
    
    // If online, attempt to sync immediately
    if (this.syncState.isOnline) {
      this.syncPendingChanges();
    }
  }
  
  /**
   * Attempt to synchronize all pending changes with the server
   */
  async syncPendingChanges(): Promise<boolean> {
    if (!this.syncState.isOnline || this.syncState.pendingChanges.length === 0) {
      return false;
    }
    
    // Sort changes by timestamp (oldest first)
    const sortedChanges = [...this.syncState.pendingChanges].sort((a, b) => a.timestamp - b.timestamp);
    let hasErrors = false;
    
    for (const change of sortedChanges) {
      try {
        await this.processChange(change);
        
        // Remove processed change on success
        this.syncState.pendingChanges = this.syncState.pendingChanges.filter(c => c.id !== change.id);
        this.saveSyncState();
      } catch (error) {
        console.error(`Error syncing change ${change.id}:`, error);
        hasErrors = true;
        
        // Check if it's a 404 error for a deletion operation
        if ((error as Error).message?.includes('API error: 404') && change.type === 'delete') {
          console.log(`Item with ID ${change.id} not found on server - removing from sync queue`);
          // Remove the failed deletion from pending changes since it doesn't exist on server anyway
          this.syncState.pendingChanges = this.syncState.pendingChanges.filter(c => c.id !== change.id);
          this.saveSyncState();
        }
        
        // Continue with other changes instead of stopping on first error
        continue;
      }
    }
    
    // Update last sync time
    this.syncState.lastSyncTime = Date.now();
    this.saveSyncState();
    return !hasErrors;
  }
  
  /**
   * Check if an ID is likely a temporary (client-generated) ID
   */
  private isTemporaryId(id: string | number): boolean {
    if (!id) return false;
    
    const strId = String(id);
    
    // Consider an ID temporary if:
    // 1. It's longer than 10 characters (most DB IDs are smaller)
    // 2. It starts with 'temp_'
    // 3. It's a timestamp (13 digits starting with 1 or 2)
    return strId.length > 10 || 
           strId.startsWith('temp_') || 
           (strId.length === 13 && (strId.startsWith('1') || strId.startsWith('2')));
  }
  
  /**
   * Process a single change
   */
  private async processChange(change: PendingChange): Promise<void> {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
    let endpoint: string;
    let method: string;
    let body: any = null;
    
    // Check if this is a temporary ID that shouldn't be sent to the server
    const isTemp = this.isTemporaryId(change.id);
    const isDataTemp = change.data?.id ? this.isTemporaryId(change.data.id) : false;
    
    console.log(`Processing ${change.type} operation for ${change.entityType} with ID ${change.id}${isTemp ? ' (temporary)' : ''}`);
    
    if (change.entityType === 'bookmark') {
      endpoint = '/api/bookmarks';
      
      if (change.type === 'add' || change.type === 'update') {
        method = change.type === 'add' ? 'POST' : 'PUT';
        if (change.type === 'update' && change.data?.id) {
          if (isDataTemp) {
            // Use POST for new bookmark with temporary ID
            endpoint = '/api/bookmarks';
            method = 'POST';
            console.log(`Converting update to create for temporary bookmark ID: ${change.data.id}`);
          } else {
            // Use PUT for existing bookmark with database ID
            endpoint = `/api/bookmarks/${change.data.id}`;
            method = 'PUT';
          }
        }
        body = change.data;
      } else { // delete
        method = 'DELETE';
        
        // Skip API call for temporary IDs since they don't exist on the server
        if (isTemp) {
          console.log(`Skipping API delete for temporary bookmark ID: ${change.id}`);
          return Promise.resolve(); // Return successfully without making API call
        }
        
        endpoint = `/api/bookmarks/${change.id}`;
      }
    } else { // category
      endpoint = '/api/bookmarks/category';
      
      if (change.type === 'add' || change.type === 'update') {
        method = 'POST'; // Always use POST for both add and update
        body = change.data;
      } else { // delete
        method = 'DELETE';
        
        // Skip API call for temporary IDs since they don't exist on the server
        if (isTemp) {
          console.log(`Skipping API delete for temporary category ID: ${change.id}`);
          return Promise.resolve(); // Return successfully without making API call
        }
        
        endpoint = `/api/bookmarks/category/${change.id}`;
      }
    }
    
    console.log(`Sync service making ${method} request to: ${apiBase}${endpoint}`);
    
    try {
      const response = await fetch(`${apiBase}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: body ? JSON.stringify(body) : undefined,
      });
      
      if (!response.ok) {
        // Special handling for 404 errors on DELETE operations
        if (response.status === 404 && method === 'DELETE') {
          console.log(`Item doesn't exist on server, considering delete successful`);
          return; // Treat as success since the item is already gone
        }
        
        throw new Error(`API error: ${response.status}`);
      }
      
      // For non-GET requests that don't return JSON, just return
      if (method !== 'GET' && response.headers.get('content-length') === '0') {
        return;
      }
      
      try {
        return await response.json();
      } catch (jsonError) {
        console.warn('Could not parse JSON response:', jsonError);
        return; // Return void if JSON parsing fails
      }
    } catch (fetchError) {
      console.error('Fetch error in processChange:', fetchError);
      throw fetchError; // Re-throw for proper error handling
    }
  }
  
  /**
   * Get the current number of pending changes
   */
  getPendingChangesCount(): number {
    return this.syncState.pendingChanges.length;
  }
  
  /**
   * Check if there are any pending changes
   */
  hasPendingChanges(): boolean {
    return this.syncState.pendingChanges.length > 0;
  }
  
  /**
   * Check if the device is currently online
   */
  isOnline(): boolean {
    return this.syncState.isOnline;
  }
  
  /**
   * Get the timestamp of the last successful sync
   */
  getLastSyncTime(): number {
    return this.syncState.lastSyncTime;
  }
}

// Create singleton instance
const bookmarkSyncService = typeof window !== 'undefined' 
  ? new BookmarkSyncService() 
  : null;

export { bookmarkSyncService };
export default bookmarkSyncService; 