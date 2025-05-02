import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { bookmarkSyncService } from '@/lib/bookmark-sync-service';
import { Bookmark, BookmarkCategory } from '@/lib/local-storage-service';

/**
 * Hook for using bookmark sync service
 */
export function useBookmarkSync() {
  const { toast } = useToast();
  const [pendingChanges, setPendingChanges] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Update state from service
  const refreshState = useCallback(() => {
    if (bookmarkSyncService) {
      setPendingChanges(bookmarkSyncService.getPendingChangesCount());
      setIsOnline(bookmarkSyncService.isOnline());
      setLastSyncTime(bookmarkSyncService.getLastSyncTime());
    }
  }, []);

  // Initialize state on mount
  useEffect(() => {
    if (!bookmarkSyncService) return;
    
    // Get initial sync state
    setLastSyncTime(bookmarkSyncService.getLastSyncTime());
    setIsOnline(bookmarkSyncService.isOnline());
    
    // Set up event listeners for online/offline
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Track a bookmark change
  const trackBookmarkChange = useCallback((
    type: 'add' | 'update' | 'delete',
    bookmark?: Bookmark
  ) => {
    if (!bookmarkSyncService) return;
    
    bookmarkSyncService.trackChange(type, 'bookmark', bookmark);
    refreshState();
  }, [refreshState]);

  // Track a category change
  const trackCategoryChange = useCallback((
    type: 'add' | 'update' | 'delete',
    category?: BookmarkCategory
  ) => {
    if (!bookmarkSyncService) return;
    
    bookmarkSyncService.trackChange(type, 'category', category);
    refreshState();
  }, [refreshState]);

  // Manually trigger sync
  const syncChanges = useCallback(async () => {
    if (!bookmarkSyncService || isSyncing) return false;
    
    setIsSyncing(true);
    try {
      const result = await bookmarkSyncService.syncPendingChanges();
      refreshState();
      
      if (result) {
        toast({
          title: "Sync successful",
          description: "Your bookmarks have been synchronized with the server.",
        });
      } else if (pendingChanges > 0) {
        toast({
          title: "Sync failed",
          description: "Some changes could not be synchronized. Will try again later.",
          variant: "destructive",
        });
      }
      
      return result;
    } catch (error) {
      console.error("Error syncing changes:", error);
      toast({
        title: "Sync error",
        description: "There was an error synchronizing your bookmarks.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, pendingChanges, refreshState, toast]);

  const formatLastSyncTime = () => {
    if (!lastSyncTime) return 'Never';
    
    // Format the time nicely
    const date = new Date(lastSyncTime);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return {
    pendingChanges,
    isOnline,
    lastSyncTime,
    isSyncing,
    trackBookmarkChange,
    trackCategoryChange,
    syncChanges,
    formatLastSyncTime,
  };
}

export default useBookmarkSync; 