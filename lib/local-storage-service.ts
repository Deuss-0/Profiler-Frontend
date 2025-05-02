import { v4 as uuidv4 } from 'uuid';

/**
 * Types for bookmarks
 */
export interface Bookmark {
  id: string;
  title: string;
  url: string;
  color?: string;
  icon?: string;
  category_id: string;
}

export interface BookmarkCategory {
  id: string;
  name: string;
  icon: string;
  bookmarks?: Bookmark[];
}

const STORAGE_KEY = 'user_bookmarks';

// Check if running in browser environment
const isBrowser = typeof window !== 'undefined';

/**
 * Service to handle bookmarks using only localStorage
 */
class LocalStorageService {
  /**
   * Get all categories with their bookmarks
   */
  static getBookmarks(): { categories: BookmarkCategory[] } {
    if (!isBrowser) {
      return { categories: [] };
    }
    
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
      return { categories: [] };
    } catch (error) {
      console.error('Error loading bookmarks from localStorage:', error);
      return { categories: [] };
    }
  }

  /**
   * Save all bookmarks to localStorage
   */
  private static saveBookmarks(categories: BookmarkCategory[]): void {
    if (!isBrowser) {
      return;
    }
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ categories }));
    } catch (error) {
      console.error('Error saving bookmarks to localStorage:', error);
    }
  }

  /**
   * Add a new bookmark category
   */
  static addCategory(category: Omit<BookmarkCategory, "id">): BookmarkCategory {
    try {
      const { categories } = this.getBookmarks();
      
      const newCategory: BookmarkCategory = {
        id: uuidv4(),
        name: category.name,
        icon: category.icon,
        bookmarks: [],
      };
      
      this.saveBookmarks([...categories, newCategory]);
      return newCategory;
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  }

  /**
   * Update an existing category
   */
  static updateCategory(category: BookmarkCategory): BookmarkCategory {
    try {
      const { categories } = this.getBookmarks();
      
      const updatedCategories = categories.map(cat => 
        cat.id === category.id 
          ? { ...cat, name: category.name, icon: category.icon } 
          : cat
      );
      
      this.saveBookmarks(updatedCategories);
      return category;
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  /**
   * Delete a category and all its bookmarks
   */
  static deleteCategory(categoryId: string): void {
    try {
      const { categories } = this.getBookmarks();
      const filteredCategories = categories.filter(cat => cat.id !== categoryId);
      this.saveBookmarks(filteredCategories);
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  /**
   * Add a new bookmark
   */
  static addBookmark(bookmark: Omit<Bookmark, "id">): Bookmark {
    try {
      const { categories } = this.getBookmarks();
      
      const newBookmark: Bookmark = {
        id: uuidv4(),
        title: bookmark.title,
        url: bookmark.url.startsWith('http') ? bookmark.url : `https://${bookmark.url}`,
        category_id: bookmark.category_id,
        color: bookmark.color,
      };
      
      const updatedCategories = categories.map(category => {
        if (category.id === bookmark.category_id) {
          return {
            ...category,
            bookmarks: [...(category.bookmarks || []), newBookmark]
          };
        }
        return category;
      });
      
      this.saveBookmarks(updatedCategories);
      return newBookmark;
    } catch (error) {
      console.error('Error adding bookmark:', error);
      throw error;
    }
  }

  /**
   * Update an existing bookmark
   */
  static updateBookmark(bookmark: Bookmark): Bookmark {
    try {
      const { categories } = this.getBookmarks();
      
      const updatedCategories = categories.map(category => {
        if (category.id === bookmark.category_id) {
          return {
            ...category,
            bookmarks: (category.bookmarks || []).map(b => 
              b.id === bookmark.id ? bookmark : b
            )
          };
        }
        return category;
      });
      
      this.saveBookmarks(updatedCategories);
      return bookmark;
    } catch (error) {
      console.error('Error updating bookmark:', error);
      throw error;
    }
  }

  /**
   * Delete a bookmark
   */
  static deleteBookmark(bookmarkId: string): void {
    try {
      const { categories } = this.getBookmarks();
      
      const updatedCategories = categories.map(category => ({
        ...category,
        bookmarks: (category.bookmarks || []).filter(b => b.id !== bookmarkId)
      }));
      
      this.saveBookmarks(updatedCategories);
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      throw error;
    }
  }
}

export default LocalStorageService; 