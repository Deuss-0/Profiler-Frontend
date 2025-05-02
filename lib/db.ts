/**
 * SQLite database utility for frontend storage
 */

type BookmarkCategory = {
  id: string;
  name: string;
  icon: string;
  bookmarks?: Bookmark[];
};

type Bookmark = {
  id: string;
  title: string;
  url: string;
  color?: string;
  icon?: string;
  category_id: string;
};

class BookmarkDB {
  private static db: IDBDatabase | null = null;
  private static DB_NAME = 'bookmarks_db';
  private static DB_VERSION = 1;
  private static CATEGORIES_STORE = 'categories';
  private static BOOKMARKS_STORE = 'bookmarks';
  private static SYNC_INFO_STORE = 'sync_info';

  /**
   * Initialize the IndexedDB database
   */
  static async init(): Promise<boolean> {
    // Check if we're running in a browser environment
    if (typeof window === 'undefined') {
      console.log('Not in browser environment, IndexedDB not available');
      return false;
    }

    // Check if IndexedDB is available in this browser
    if (!window.indexedDB) {
      console.log('IndexedDB not supported in this browser');
      return false;
    }

    return new Promise((resolve) => {
      try {
        const request = window.indexedDB.open(this.DB_NAME, this.DB_VERSION);

        request.onerror = (event) => {
          console.error('Error opening IndexedDB:', event);
          resolve(false);
        };

        request.onsuccess = (event) => {
          this.db = (event.target as IDBOpenDBRequest).result;
          console.log('IndexedDB connection opened successfully');
          resolve(true);
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;

          // Create categories object store
          if (!db.objectStoreNames.contains(this.CATEGORIES_STORE)) {
            const categoriesStore = db.createObjectStore(this.CATEGORIES_STORE, { keyPath: 'id' });
            categoriesStore.createIndex('name', 'name', { unique: false });
          }

          // Create bookmarks object store
          if (!db.objectStoreNames.contains(this.BOOKMARKS_STORE)) {
            const bookmarksStore = db.createObjectStore(this.BOOKMARKS_STORE, { keyPath: 'id' });
            bookmarksStore.createIndex('category_id', 'category_id', { unique: false });
          }

          // Create sync info store for tracking last sync time
          if (!db.objectStoreNames.contains(this.SYNC_INFO_STORE)) {
            db.createObjectStore(this.SYNC_INFO_STORE, { keyPath: 'key' });
          }
        };
      } catch (error) {
        console.error('Failed to initialize IndexedDB:', error);
        resolve(false);
      }
    });
  }

  /**
   * Save a bookmark category to IndexedDB
   */
  static async saveCategory(category: BookmarkCategory): Promise<string> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      try {
        const transaction = this.db.transaction([this.CATEGORIES_STORE], 'readwrite');
        const store = transaction.objectStore(this.CATEGORIES_STORE);
        
        // Generate ID if needed
        if (!category.id) {
          category.id = Date.now().toString();
        }
        
        const request = store.put(category);
        
        request.onsuccess = () => {
          resolve(category.id);
        };
        
        request.onerror = (event) => {
          reject(event);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Save a bookmark to IndexedDB
   */
  static async saveBookmark(bookmark: Bookmark): Promise<string> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      try {
        const transaction = this.db.transaction([this.BOOKMARKS_STORE], 'readwrite');
        const store = transaction.objectStore(this.BOOKMARKS_STORE);
        
        // Generate ID if needed
        if (!bookmark.id) {
          bookmark.id = Date.now().toString();
        }
        
        const request = store.put(bookmark);
        
        request.onsuccess = () => {
          resolve(bookmark.id);
        };
        
        request.onerror = (event) => {
          reject(event);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get all categories with their bookmarks
   */
  static async getAllCategoriesWithBookmarks(): Promise<BookmarkCategory[]> {
    if (!this.db) {
      await this.init();
    }

    return new Promise(async (resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      try {
        // First get all categories
        const categories = await this.getAllCategories();
        
        // Then get all bookmarks
        const bookmarks = await this.getAllBookmarks();
        
        // Group bookmarks by category
        const categoriesWithBookmarks = categories.map(category => ({
          ...category,
          bookmarks: bookmarks.filter(bookmark => bookmark.category_id === category.id)
        }));
        
        resolve(categoriesWithBookmarks);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get all categories
   */
  static async getAllCategories(): Promise<BookmarkCategory[]> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      try {
        const transaction = this.db.transaction([this.CATEGORIES_STORE], 'readonly');
        const store = transaction.objectStore(this.CATEGORIES_STORE);
        const request = store.getAll();
        
        request.onsuccess = () => {
          resolve(request.result);
        };
        
        request.onerror = (event) => {
          reject(event);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get all bookmarks
   */
  static async getAllBookmarks(): Promise<Bookmark[]> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      try {
        const transaction = this.db.transaction([this.BOOKMARKS_STORE], 'readonly');
        const store = transaction.objectStore(this.BOOKMARKS_STORE);
        const request = store.getAll();
        
        request.onsuccess = () => {
          resolve(request.result);
        };
        
        request.onerror = (event) => {
          reject(event);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Delete a category and all its bookmarks
   */
  static async deleteCategory(categoryId: string): Promise<boolean> {
    if (!this.db) {
      await this.init();
    }

    return new Promise(async (resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      try {
        // First delete all bookmarks in this category
        const bookmarks = await this.getAllBookmarks();
        const categoryBookmarks = bookmarks.filter(b => b.category_id === categoryId);
        
        for (const bookmark of categoryBookmarks) {
          await this.deleteBookmark(bookmark.id);
        }
        
        // Then delete the category
        const transaction = this.db.transaction([this.CATEGORIES_STORE], 'readwrite');
        const store = transaction.objectStore(this.CATEGORIES_STORE);
        const request = store.delete(categoryId);
        
        request.onsuccess = () => {
          resolve(true);
        };
        
        request.onerror = (event) => {
          reject(event);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Delete a bookmark
   */
  static async deleteBookmark(bookmarkId: string): Promise<boolean> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      try {
        const transaction = this.db.transaction([this.BOOKMARKS_STORE], 'readwrite');
        const store = transaction.objectStore(this.BOOKMARKS_STORE);
        const request = store.delete(bookmarkId);
        
        request.onsuccess = () => {
          resolve(true);
        };
        
        request.onerror = (event) => {
          reject(event);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Set the last sync time
   */
  static async setLastSyncTime(timestamp: number): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      try {
        const transaction = this.db.transaction([this.SYNC_INFO_STORE], 'readwrite');
        const store = transaction.objectStore(this.SYNC_INFO_STORE);
        
        const request = store.put({
          key: 'lastSync',
          timestamp
        });
        
        request.onsuccess = () => {
          resolve();
        };
        
        request.onerror = (event) => {
          reject(event);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get the last sync time
   */
  static async getLastSyncTime(): Promise<number> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      try {
        const transaction = this.db.transaction([this.SYNC_INFO_STORE], 'readonly');
        const store = transaction.objectStore(this.SYNC_INFO_STORE);
        const request = store.get('lastSync');
        
        request.onsuccess = () => {
          resolve(request.result?.timestamp || 0);
        };
        
        request.onerror = (event) => {
          reject(event);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Clear all data (for testing or logout)
   */
  static async clearAll(): Promise<boolean> {
    if (!this.db) {
      await this.init();
    }

    return new Promise(async (resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      try {
        // Clear categories
        const catTransaction = this.db.transaction([this.CATEGORIES_STORE], 'readwrite');
        const catStore = catTransaction.objectStore(this.CATEGORIES_STORE);
        const catRequest = catStore.clear();
        
        // Clear bookmarks
        const bookTransaction = this.db.transaction([this.BOOKMARKS_STORE], 'readwrite');
        const bookStore = bookTransaction.objectStore(this.BOOKMARKS_STORE);
        const bookRequest = bookStore.clear();
        
        // Clear sync info
        const syncTransaction = this.db.transaction([this.SYNC_INFO_STORE], 'readwrite');
        const syncStore = syncTransaction.objectStore(this.SYNC_INFO_STORE);
        const syncRequest = syncStore.clear();
        
        // Wait for all to complete
        catRequest.onsuccess = () => {
          bookRequest.onsuccess = () => {
            syncRequest.onsuccess = () => {
              resolve(true);
            };
          };
        };
        
        catRequest.onerror = bookRequest.onerror = syncRequest.onerror = (event) => {
          reject(event);
        };
      } catch (error) {
        reject(error);
      }
    });
  }
}

export { BookmarkDB, type BookmarkCategory, type Bookmark }; 