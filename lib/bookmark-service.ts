import { BookmarkDB, Bookmark, BookmarkCategory } from "@/lib/db";

class BookmarkService {
  private static apiBaseUrl = "/api";
  private static dbInitialized = false;
  // Simple in-memory store for when IndexedDB isn't available
  private static memoryStore: BookmarkCategory[] = [];

  /**
   * Initialize the bookmark system
   */
  static async initialize(): Promise<void> {
    // Try to initialize IndexedDB
    this.dbInitialized = await BookmarkDB.init();
    
    if (!this.dbInitialized) {
      console.log('Using in-memory fallback for bookmarks (will not persist on page refresh)');
    }
  }

  /**
   * Get all bookmarks from local storage and API
   */
  static async getBookmarks(): Promise<{ categories: BookmarkCategory[] }> {
    let localCategories: BookmarkCategory[] = [];
    let useLocalOnly = false;
    
    // First, ensure we have local data loaded
    if (this.dbInitialized) {
      localCategories = await BookmarkDB.getAllCategoriesWithBookmarks();
    } else {
      localCategories = this.memoryStore;
    }
    
    try {
      // Only try API if not already determined to use local data
      if (!useLocalOnly) {
        // Try to fetch from API
        const apiData = await this.fetchFromApi();
        
        if (apiData?.categories?.length) {
          // If API data exists, merge it with local data to prevent loss of local-only bookmarks
          const mergedCategories = this.mergeApiWithLocalData(apiData.categories, localCategories);
          
          // Store the merged result
          if (this.dbInitialized) {
            await this.syncMergedCategoriesToLocal(mergedCategories);
          } else {
            this.memoryStore = mergedCategories;
          }
          
          return { categories: mergedCategories };
        }
      }
    } catch (error) {
      console.log('Using local bookmark data');
      useLocalOnly = true;
    }
    
    // If we get here, we're using local data
    return { categories: localCategories };
  }

  /**
   * Merge API categories with local categories, preserving local changes
   */
  private static mergeApiWithLocalData(apiCategories: BookmarkCategory[], localCategories: BookmarkCategory[]): BookmarkCategory[] {
    const mergedCategories: BookmarkCategory[] = [];
    
    // First add all API categories
    for (const apiCat of apiCategories) {
      // Check if this category exists locally
      const localCat = localCategories.find(c => c.id === apiCat.id);
      
      if (localCat) {
        // If it exists locally, merge the bookmarks
        const mergedBookmarks = [...(apiCat.bookmarks || [])];
        
        // Add any local-only bookmarks
        if (localCat.bookmarks) {
          for (const localBookmark of localCat.bookmarks) {
            // Only add if not already in the merged list
            if (!mergedBookmarks.some(b => b.id === localBookmark.id)) {
              mergedBookmarks.push(localBookmark);
            }
          }
        }
        
        mergedCategories.push({
          ...apiCat,
          bookmarks: mergedBookmarks
        });
      } else {
        // If it doesn't exist locally, add as is
        mergedCategories.push(apiCat);
      }
    }
    
    // Then add any local-only categories
    for (const localCat of localCategories) {
      if (!mergedCategories.some(c => c.id === localCat.id)) {
        mergedCategories.push(localCat);
      }
    }
    
    return mergedCategories;
  }
  
  /**
   * Sync merged categories to local storage
   */
  private static async syncMergedCategoriesToLocal(categories: BookmarkCategory[]): Promise<void> {
    if (!this.dbInitialized) {
      this.memoryStore = categories;
      return;
    }
    
    try {
      // We don't want to delete all data first, just update/add
      for (const category of categories) {
        const bookmarks = category.bookmarks || [];
        const categoryWithoutBookmarks = { ...category };
        delete categoryWithoutBookmarks.bookmarks;
        
        // Save/update category
        await BookmarkDB.saveCategory(categoryWithoutBookmarks);
        
        // Save/update all bookmarks in this category
        for (const bookmark of bookmarks) {
          await BookmarkDB.saveBookmark(bookmark);
        }
      }
      
      // Record sync time
      await BookmarkDB.setLastSyncTime(Date.now());
    } catch (error) {
      console.error("Error syncing merged data to local:", error);
    }
  }

  /**
   * Add a new bookmark category
   */
  static async addCategory(category: Omit<BookmarkCategory, "id">): Promise<BookmarkCategory> {
    try {
      // First save to API
      const response = await fetch(`${this.apiBaseUrl}/bookmarks/category`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(category),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const newCategory: BookmarkCategory = data.category;

      // Then save to local storage
      await BookmarkDB.saveCategory(newCategory);

      return newCategory;
    } catch (error) {
      console.error("Error adding category:", error);
      
      // Fallback: Save just to local if API fails
      const newCategory: BookmarkCategory = {
        id: Date.now().toString(),
        name: category.name,
        icon: category.icon,
        bookmarks: [],
      };
      
      await BookmarkDB.saveCategory(newCategory);
      return newCategory;
    }
  }

  /**
   * Update an existing bookmark category
   */
  static async updateCategory(category: BookmarkCategory): Promise<BookmarkCategory> {
    // Always update locally first for immediate feedback
    if (this.dbInitialized) {
      await BookmarkDB.saveCategory(category);
    } 
    
    // Update in-memory store regardless of IndexedDB status
    const categoryIndex = this.memoryStore.findIndex(c => c.id === category.id);
    if (categoryIndex !== -1) {
      // Preserve the bookmarks when updating in memory
      const existingBookmarks = this.memoryStore[categoryIndex].bookmarks || [];
      this.memoryStore[categoryIndex] = {
        ...category,
        bookmarks: existingBookmarks
      };
    }
    
    // Try API in background without blocking user experience
    this.saveCategoryToApi(category).catch(() => {
      // Silent catch - we've already updated locally
    });
    
    // Return updated category immediately
    return category;
  }
  
  /**
   * Save category to API in the background
   */
  private static async saveCategoryToApi(category: BookmarkCategory): Promise<void> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/bookmarks/category`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(category),
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        const apiCategory: BookmarkCategory = data.category;
        
        // Update local category with API-provided data if needed
        if (this.dbInitialized) {
          // Preserve bookmarks from our local version
          await BookmarkDB.saveCategory(apiCategory);
        }
      }
    } catch (error) {
      // Silent failure - we already have the category saved locally
    }
  }

  /**
   * Delete a bookmark category and all its bookmarks
   */
  static async deleteCategory(categoryId: string): Promise<void> {
    // Always delete locally first for immediate feedback
    if (this.dbInitialized) {
      await BookmarkDB.deleteCategory(categoryId);
    }
    
    // Remove from in-memory store regardless of IndexedDB status
    const categoryIndex = this.memoryStore.findIndex(c => c.id === categoryId);
    if (categoryIndex !== -1) {
      this.memoryStore.splice(categoryIndex, 1);
    }
    
    // Try API in background without blocking user experience
    this.deleteCategoryFromApi(categoryId).catch(() => {
      // Silent catch - we've already deleted locally
    });
  }
  
  /**
   * Delete category from API in the background
   */
  private static async deleteCategoryFromApi(categoryId: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/bookmarks/category/${categoryId}`, {
        method: "DELETE",
        credentials: "include",
      });
      
      // We don't need to do anything else on success
      // The category is already deleted locally
    } catch (error) {
      // Silent failure - we've already deleted locally
    }
  }

  /**
   * Add a new bookmark
   */
  static async addBookmark(bookmark: AddBookmarkData): Promise<Bookmark> {
    // First create local bookmark for immediate feedback
    const localBookmark: Bookmark = {
      id: Date.now().toString(),
      title: bookmark.title,
      url: bookmark.url.startsWith('http') ? bookmark.url : `https://${bookmark.url}`,
      color: bookmark.color || "",
      category_id: bookmark.category_id
    };
    
    // Always save to local storage first
    if (this.dbInitialized) {
      await BookmarkDB.addBookmark(localBookmark);
    } 
    
    // Update in-memory store regardless of IndexedDB status
    const category = this.memoryStore.find(c => c.id === bookmark.category_id);
    if (category) {
      if (!category.bookmarks) {
        category.bookmarks = [];
      }
      category.bookmarks.push(localBookmark);
    }
    
    // Try API in background without blocking user experience
    this.saveBookmarkToApi(localBookmark).catch(() => {
      // Silent catch - we already have local bookmark saved
    });
    
    // Return the local bookmark immediately
    return localBookmark;
  }
  
  /**
   * Save bookmark to API in the background
   */
  private static async saveBookmarkToApi(bookmark: Bookmark): Promise<void> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/bookmarks`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookmark),
      });

      if (response.ok) {
        const apiBookmark = await response.json();
        
        // Update local bookmark with API-provided data if needed
        if (this.dbInitialized) {
          await BookmarkDB.updateBookmark({
            ...bookmark, 
            ...apiBookmark
          });
        }
      }
    } catch (error) {
      // Silent failure - we already have the bookmark saved locally
    }
  }

  /**
   * Update a bookmark
   */
  static async updateBookmark(bookmark: Bookmark): Promise<Bookmark> {
    try {
      // First update in API
      const response = await fetch(`${this.apiBaseUrl}/bookmarks/${bookmark.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookmark),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const updatedBookmark: Bookmark = data.bookmark;

      // Then update in local storage
      if (this.dbInitialized) {
        await BookmarkDB.updateBookmark(updatedBookmark);
      } else {
        // Update in-memory store
        const categoryIndex = this.memoryStore.findIndex(c => c.id === bookmark.categoryId);
        if (categoryIndex !== -1 && this.memoryStore[categoryIndex].bookmarks) {
          const bookmarkIndex = this.memoryStore[categoryIndex].bookmarks!.findIndex(b => b.id === bookmark.id);
          if (bookmarkIndex !== -1) {
            this.memoryStore[categoryIndex].bookmarks![bookmarkIndex] = updatedBookmark;
          }
        }
      }

      return updatedBookmark;
    } catch (error) {
      console.error("Error updating bookmark:", error);
      
      // Fallback: Update just local if API fails
      if (this.dbInitialized) {
        await BookmarkDB.updateBookmark(bookmark);
      } else {
        // Update in-memory store
        const categoryIndex = this.memoryStore.findIndex(c => c.id === bookmark.categoryId);
        if (categoryIndex !== -1 && this.memoryStore[categoryIndex].bookmarks) {
          const bookmarkIndex = this.memoryStore[categoryIndex].bookmarks!.findIndex(b => b.id === bookmark.id);
          if (bookmarkIndex !== -1) {
            this.memoryStore[categoryIndex].bookmarks![bookmarkIndex] = bookmark;
          }
        }
      }
      return bookmark;
    }
  }

  /**
   * Delete a bookmark
   */
  static async deleteBookmark(bookmarkId: string): Promise<void> {
    // Always delete locally first for immediate feedback
    if (this.dbInitialized) {
      await BookmarkDB.deleteBookmark(bookmarkId);
    }
    
    // Remove from in-memory store regardless of IndexedDB status
    for (const category of this.memoryStore) {
      if (category.bookmarks) {
        const bookmarkIndex = category.bookmarks.findIndex(b => b.id === bookmarkId);
        if (bookmarkIndex !== -1) {
          category.bookmarks.splice(bookmarkIndex, 1);
          break; // Found and removed the bookmark, no need to continue searching
        }
      }
    }
    
    // Try API in background without blocking user experience
    this.deleteBookmarkFromApi(bookmarkId).catch(() => {
      // Silent catch - we've already deleted locally
    });
  }
  
  /**
   * Delete bookmark from API in the background
   */
  private static async deleteBookmarkFromApi(bookmarkId: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/bookmarks/${bookmarkId}`, {
        method: "DELETE",
        credentials: "include",
      });
      
      // We don't need to do anything else on success
      // The bookmark is already deleted locally
    } catch (error) {
      // Silent failure - we've already deleted locally
    }
  }

  /**
   * Fetch bookmarks from API
   */
  private static async fetchFromApi(): Promise<{ categories: BookmarkCategory[] }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/bookmarks`, {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 404) {
          // Not authenticated or endpoint not found, return empty data
          console.log(`API returned ${response.status} status. Using local data instead.`);
          return { categories: [] };
        }
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching from API:", error);
      return { categories: [] };
    }
  }

  /**
   * Sync data from API to local storage
   */
  private static async syncFromApiToLocal(categories: BookmarkCategory[]): Promise<void> {
    try {
      if (!this.dbInitialized) {
        // Just update the in-memory store if IndexedDB isn't available
        this.memoryStore = categories;
        return;
      }
      
      // First clear all local data
      await BookmarkDB.clearAll();
      
      // Then save categories
      for (const category of categories) {
        const bookmarks = category.bookmarks || [];
        delete category.bookmarks;
        
        await BookmarkDB.saveCategory(category);
        
        // Save bookmarks
        for (const bookmark of bookmarks) {
          await BookmarkDB.saveBookmark(bookmark);
        }
      }
      
      // Record sync time
      await BookmarkDB.setLastSyncTime(Date.now());
    } catch (error) {
      console.error("Error syncing from API to local:", error);
    }
  }
}

export default BookmarkService; 