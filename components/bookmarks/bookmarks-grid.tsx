"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookmarkItem } from "./bookmark-item"
import { ShieldAlert, Code, BookOpen, Newspaper, Wrench, Briefcase, Gamepad2, Plus, Edit, Trash2, Check, X, Bookmark as BookmarkIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Bookmark, BookmarkCategory } from "@/lib/local-storage-service"
import { getDefaultBookmarks, COLORS } from "@/lib/default-bookmarks"
import { createPortal } from "react-dom"
import { v4 as uuidv4 } from 'uuid'
import { useBookmarkSync } from "@/hooks/use-bookmark-sync"
import { BookmarkSyncStatus } from "./bookmark-sync-status"
import { cn } from "@/lib/utils"

// Icon mapping for categories
const ICON_MAP: Record<string, React.ReactNode> = {
  "shield-alert": <ShieldAlert className="h-4 w-4" />,
  "code": <Code className="h-4 w-4" />,
  "book-open": <BookOpen className="h-4 w-4" />,
  "newspaper": <Newspaper className="h-4 w-4" />,
  "wrench": <Wrench className="h-4 w-4" />,
  "briefcase": <Briefcase className="h-4 w-4" />,
  "gamepad": <Gamepad2 className="h-4 w-4" />,
  "bookmark": <BookmarkIcon className="h-4 w-4" />,
}

// Interface for API responses
interface BookmarksApiResponse {
  categories: BookmarkCategory[];
  bookmarks: Bookmark[];
}

// Helper function to check if API request failed due to auth issues
function isAuthError(error: any): boolean {
  return error?.response?.status === 401 || error?.response?.status === 403;
}

export function BookmarksGrid() {
  const { toast } = useToast()
  const { isOnline, trackBookmarkChange, trackCategoryChange } = useBookmarkSync()
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<BookmarkCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  const [isAddBookmarkOpen, setIsAddBookmarkOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  const [isDeleteCategoryOpen, setIsDeleteCategoryOpen] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  
  const [newBookmark, setNewBookmark] = useState<{
    title: string;
    url: string;
    category_id: string;
    color?: string;
  }>({
    title: "",
    url: "",
    category_id: "",
    color: `bg-${COLORS[Math.floor(Math.random() * COLORS.length)]}-500`,
  });

  const [newCategory, setNewCategory] = useState<{
    id?: string;
    name: string;
    icon: string;
  }>({
    name: "",
    icon: "wrench",
  });

  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);

  // Load bookmarks on component mount
  useEffect(() => {
    fetchBookmarks();
  }, [toast]);

  // Function to fetch bookmarks from the API
  const fetchBookmarks = async () => {
    try {
      setIsLoading(true);
      
      // Try to fetch from the API
      // Use a relative URL for better base URL handling across environments
      const apiUrl = API_URL ? `${API_URL}/api/bookmarks` : '/api/bookmarks';
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include' // Include cookies for authentication
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data: BookmarksApiResponse = await response.json();
      
      // Ensure all IDs are treated as strings in the frontend for consistency
      const normalizedCategories = data.categories.map(category => ({
        ...category,
        id: String(category.id),
        bookmarks: (category.bookmarks || []).map(bookmark => ({
          ...bookmark,
          id: String(bookmark.id),
          category_id: String(bookmark.category_id)
        }))
      }));
      
      // Set the categories and active category
      if (normalizedCategories && normalizedCategories.length > 0) {
        setCategories(normalizedCategories);
        setActiveCategory(normalizedCategories[0].id);
        
        // Store in local storage for offline use
        localStorage.setItem('user_bookmarks', JSON.stringify({ categories: normalizedCategories }));
      } else {
        // If no categories were returned, use default ones (this shouldn't happen with the new backend)
        handleNoCategories();
      }
      
    } catch (error) {
      console.error("Error loading bookmarks:", error);
      
      // If it's an auth error, we might be offline or not logged in
      // For a better UX, fall back to localStorage in this case
      if (isAuthError(error)) {
        toast({
          title: "Not connected to server",
          description: "Using local storage for bookmarks instead.",
          variant: "destructive",
        });
        // Fall back to local storage
        handleNoCategories();
      } else {
        toast({
          title: "Error loading bookmarks",
          description: "There was a problem loading your bookmarks.",
          variant: "destructive",
        });
        handleNoCategories();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle case when no categories exist
  const handleNoCategories = () => {
    try {
      // First check if we have bookmarks in localStorage
      const localData = localStorage.getItem('user_bookmarks');
      if (localData) {
        const parsed = JSON.parse(localData);
        if (parsed.categories && parsed.categories.length > 0) {
          setCategories(parsed.categories);
          setActiveCategory(parsed.categories[0].id);
          return;
        }
      }
      
      // If no local data, use default bookmarks
      const defaultCategories = getDefaultBookmarks();
      setCategories(defaultCategories);
      setActiveCategory(defaultCategories[0].id);
      
      // Save default categories to localStorage for future offline use
      localStorage.setItem('user_bookmarks', JSON.stringify({ categories: defaultCategories }));
    } catch (error) {
      console.error("Error handling local categories:", error);
      // Last resort - use default bookmarks without saving to localStorage
      const defaultCategories = getDefaultBookmarks();
      setCategories(defaultCategories);
      setActiveCategory(defaultCategories[0].id);
    }
  };

  const handleAddBookmark = async () => {
    if (!newBookmark.title || !newBookmark.url || !newBookmark.category_id) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Format URL if necessary
      const formattedUrl = newBookmark.url.startsWith('http') 
        ? newBookmark.url 
        : `https://${newBookmark.url}`;
      
      // Create a local bookmark version to use in case API fails
      const localBookmark: Bookmark = {
        id: Date.now().toString(), // Temporary ID
        title: newBookmark.title,
        url: formattedUrl,
        category_id: newBookmark.category_id,
        color: newBookmark.color,
      };
      
      // Update UI immediately for better UX
      setCategories(prev => {
        return prev.map(category => {
          if (category.id === newBookmark.category_id) {
            return {
              ...category,
              bookmarks: [...(category.bookmarks || []), localBookmark]
            };
          }
          return category;
        });
      });
      
      // Track the bookmark change for syncing
      trackBookmarkChange('add', localBookmark);
      
      if (isOnline) {
        // Send to API
        const apiUrl = API_URL ? `${API_URL}/api/bookmarks` : '/api/bookmarks';
        
        console.log("Sending bookmark with category_id:", newBookmark.category_id, "Type:", typeof newBookmark.category_id);
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            title: newBookmark.title,
            url: formattedUrl,
            category_id: newBookmark.category_id,
            color: newBookmark.color,
          }),
        });
        
        if (!response.ok) {
          // Try to get a more detailed error message
          let errorDetail = 'Unknown error';
          try {
            const errorResponse = await response.json();
            errorDetail = errorResponse.message || errorResponse.error || 'Unknown error';
          } catch (e) {
            // If parsing fails, just use the status code
          }
          
          throw new Error(`API error: ${response.status} - ${errorDetail}`);
        }
        
        const responseData = await response.json();
        
        // Update the categories state with the server-generated ID
        setCategories(prev => {
          return prev.map(category => {
            if (category.id === newBookmark.category_id) {
              return {
                ...category,
                bookmarks: (category.bookmarks || []).map(b => 
                  b.id === localBookmark.id ? {...responseData.bookmark, id: String(responseData.bookmark.id), category_id: String(responseData.bookmark.category_id)} : b
                )
              };
            }
            return category;
          });
        });
      }
      
      // Save to localStorage
      localStorage.setItem('user_bookmarks', JSON.stringify({ categories }));

      setNewBookmark({
        title: "",
        url: "",
        category_id: newBookmark.category_id,
        color: `bg-${COLORS[Math.floor(Math.random() * COLORS.length)]}-500`,
      });

      setIsAddBookmarkOpen(false);

      toast({
        title: "Bookmark added",
        description: `${newBookmark.title} has been added to your bookmarks.`,
      });
    } catch (error) {
      console.error("Error adding bookmark:", error);
      toast({
        title: "Error adding bookmark",
        description: error instanceof Error ? error.message : "Bookmark saved locally, but couldn't connect to server.",
        variant: "destructive",
      });
      
      // Save to localStorage even if API fails
      localStorage.setItem('user_bookmarks', JSON.stringify({ categories }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name) {
      toast({
        title: "Error",
        description: "Please enter a category name",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Create local category with temporary ID (timestamp-based)
      const tempId = Date.now().toString();
      const localCategory: BookmarkCategory = {
        id: tempId,
        name: newCategory.name,
        icon: newCategory.icon,
        bookmarks: []
      };
      
      // Update UI immediately for better UX
      setCategories(prev => [...prev, localCategory]);
      setActiveCategory(localCategory.id);
      
      // Track the category change for syncing
      trackCategoryChange('add', localCategory);
      
      if (isOnline) {
        // Send to API - don't include the temporary ID field when creating
        const apiUrl = API_URL ? `${API_URL}/api/bookmarks/category` : '/api/bookmarks/category';
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            name: newCategory.name,
            icon: newCategory.icon,
          }),
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const responseData = await response.json();
        const serverCategory = responseData.category;
        
        // Convert IDs to strings for frontend consistency
        const normalizedServerCategory = {
          ...serverCategory,
          id: String(serverCategory.id),
          bookmarks: []
        };
        
        // Update with server-generated ID
        setCategories(prev => 
          prev.map(cat => 
            cat.id === tempId 
              ? normalizedServerCategory 
              : cat
          )
        );
        setActiveCategory(normalizedServerCategory.id);
      }
      
      // Save to localStorage
      localStorage.setItem('user_bookmarks', JSON.stringify({ categories }));
      
      setNewCategory({
        name: "",
        icon: "wrench",
      });
      
      setIsAddCategoryOpen(false);

      toast({
        title: "Category added",
        description: `${newCategory.name} has been added to your categories.`,
      });
    } catch (error) {
      console.error("Error adding category:", error);
      toast({
        title: "Error adding category",
        description: "Category saved locally, but couldn't connect to server.",
        variant: "destructive",
      });
      
      // Save to localStorage even if API fails
      localStorage.setItem('user_bookmarks', JSON.stringify({ categories }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCategory = async () => {
    if (!newCategory.id || !newCategory.name) {
      toast({
        title: "Error",
        description: "Category ID and name are required",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Update locally first for better UX
      setCategories(prev => 
        prev.map(cat => {
          if (cat.id === newCategory.id) {
            return { ...cat, name: newCategory.name, icon: newCategory.icon };
          }
          return cat;
        })
      );
      
      const updatedCategory = {
        id: newCategory.id,
        name: newCategory.name,
        icon: newCategory.icon,
      };
      
      // Track the category change for syncing
      trackCategoryChange('update', updatedCategory);
      
      if (isOnline) {
        // Check if this is a temporary ID (timestamp-based ID from frontend)
        const isTemporaryId = String(newCategory.id).length > 10;
        
        if (isTemporaryId) {
          console.log("Detected temporary ID for category, creating new category instead:", newCategory.id);
          
          // Create a new category instead of trying to update a non-existent one
          const apiUrl = API_URL ? `${API_URL}/api/bookmarks/category` : '/api/bookmarks/category';
          const response = await fetch(apiUrl, {
            method: 'POST', // Create new instead of update
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              name: newCategory.name,
              icon: newCategory.icon,
            }),
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `API error: ${response.status}`;
            try {
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.message || errorData.error || errorMessage;
            } catch (_) {
              // If parsing fails, use the error text if available
              if (errorText) {
                errorMessage = errorText;
              }
            }
            throw new Error(errorMessage);
          }
          
          const responseData = await response.json();
          
          // Update the category with server-generated ID
          if (responseData.category) {
            const serverCategory = responseData.category;
            
            // Replace the temporary ID category with the new server-generated one
            setCategories(prev => prev.map(cat => {
              if (cat.id === newCategory.id) {
                return {
                  ...cat,
                  id: String(serverCategory.id),
                  name: serverCategory.name,
                  icon: serverCategory.icon
                };
              }
              return cat;
            }));
            
            // Update active category if needed
            if (activeCategory === newCategory.id) {
              setActiveCategory(String(serverCategory.id));
            }
          }
        } else {
          // Regular update for an existing category with a valid ID
          const apiUrl = API_URL ? `${API_URL}/api/bookmarks/category` : '/api/bookmarks/category';
          
          // Ensure the ID is properly formatted as a string
          const categoryId = String(newCategory.id);
          
          const response = await fetch(apiUrl, {
            method: 'POST', // Changed from PUT to POST to match API expectations
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              id: categoryId,
              name: newCategory.name,
              icon: newCategory.icon,
            }),
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `API error: ${response.status}`;
            try {
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.message || errorData.error || errorMessage;
            } catch (_) {
              // If parsing fails, use the error text if available
              if (errorText) {
                errorMessage = errorText;
              }
            }
            throw new Error(errorMessage);
          }

          const responseData = await response.json();
          if (responseData.category) {
            // Update with server response data
            setCategories(prev => prev.map(cat => {
              if (cat.id === categoryId) {
                return {
                  ...cat,
                  name: responseData.category.name,
                  icon: responseData.category.icon
                };
              }
              return cat;
            }));
          }
        }
      }
      
      // Save to localStorage
      localStorage.setItem('user_bookmarks', JSON.stringify({ categories }));
      
      setNewCategory({
        name: "",
        icon: "wrench",
      });
      
      setIsEditCategoryOpen(false);

      toast({
        title: "Category updated",
        description: `${newCategory.name} has been updated.`,
      });
    } catch (error) {
      console.error("Error updating category:", error);
      // Show error toast with the specific error message
      toast({
        title: "Error updating category",
        description: error instanceof Error ? error.message : "Failed to update category. Please try again.",
        variant: "destructive",
      });
      
      // Save to localStorage even if API fails
      localStorage.setItem('user_bookmarks', JSON.stringify({ categories }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!newCategory.id) {
      return;
    }

    setIsLoading(true);
    try {
      // Delete locally first for better UX
      setCategories(prev => prev.filter(cat => cat.id !== newCategory.id));
      setActiveCategory(categories[0]?.id || null);
      
      // Track the category deletion for syncing
      trackCategoryChange('delete', { id: newCategory.id, name: '', icon: '' });
      
      if (isOnline) {
        // Check if this is a temporary ID (timestamp-based)
        const isTemporaryId = String(newCategory.id).length > 10;
        
        if (!isTemporaryId) {
          // Only send delete request to server for real database IDs, not temporary ones
          const apiUrl = API_URL ? `${API_URL}/api/bookmarks/category/${newCategory.id}` : `/api/bookmarks/category/${newCategory.id}`;
          const response = await fetch(apiUrl, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          });
          
          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }
        } else {
          console.log("Skipping server delete for temporary category ID:", newCategory.id);
        }
      }
      
      // Save to localStorage
      localStorage.setItem('user_bookmarks', JSON.stringify({ categories: categories.filter(cat => cat.id !== newCategory.id) }));
      
      setNewCategory({
        name: "",
        icon: "wrench",
      });
      
      setIsDeleteCategoryOpen(false);

      toast({
        title: "Category deleted",
        description: "The category and all its bookmarks have been removed.",
      });
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({
        title: "Error deleting category",
        description: "Category deleted locally, but couldn't connect to server.",
        variant: "destructive",
      });
      
      // Save to localStorage even if API fails
      localStorage.setItem('user_bookmarks', JSON.stringify({ categories: categories.filter(cat => cat.id !== newCategory.id) }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookmarkUpdated = (updatedBookmark: Bookmark) => {
    const newCategories = categories.map(category => {
      if (category.id === updatedBookmark.category_id) {
        return {
          ...category,
          bookmarks: (category.bookmarks || []).map(bookmark => 
            bookmark.id === updatedBookmark.id ? updatedBookmark : bookmark
          )
        };
      }
      return category;
    });
    
    setCategories(newCategories);
    localStorage.setItem('user_bookmarks', JSON.stringify({ categories: newCategories }));
    
    // Track the bookmark update for syncing
    trackBookmarkChange('update', updatedBookmark);
  };

  const handleBookmarkDeleted = (bookmarkId: string) => {
    const newCategories = categories.map(category => ({
      ...category,
      bookmarks: (category.bookmarks || []).filter(bookmark => bookmark.id !== bookmarkId)
    }));
    
    setCategories(newCategories);
    localStorage.setItem('user_bookmarks', JSON.stringify({ categories: newCategories }));
    
    // Track the bookmark deletion for syncing
    trackBookmarkChange('delete', { id: bookmarkId, title: '', url: '', category_id: '' });
  };

  // New function to check if scrolling indicators should be shown
  const checkScrollIndicators = () => {
    if (!tabsContainerRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = tabsContainerRef.current;
    
    // Show left scroll if we've scrolled at least 20px
    setShowLeftScroll(scrollLeft > 20);
    
    // Show right scroll if there's more content to scroll to
    // Add a buffer to avoid edge cases where the scroll is very close to the end
    setShowRightScroll(scrollWidth - scrollLeft - clientWidth > 20);
  };

  // Add a scroll handler to update indicator state
  useEffect(() => {
    const container = tabsContainerRef.current;
    if (!container) return;
    
    // Initial check after a short delay to ensure DOM is properly rendered
    setTimeout(checkScrollIndicators, 100);
    
    // Add scroll listener
    container.addEventListener('scroll', checkScrollIndicators);
    
    // Add resize listener since container width can change
    window.addEventListener('resize', checkScrollIndicators);
    
    return () => {
      container.removeEventListener('scroll', checkScrollIndicators);
      window.removeEventListener('resize', checkScrollIndicators);
    };
  }, [categories]); // Update when categories change
  
  // Scroll functions
  const scrollLeft = () => {
    if (!tabsContainerRef.current) return;
    // Use a fixed scroll amount for consistent movement
    tabsContainerRef.current.scrollBy({ left: -100, behavior: 'smooth' });
    // Force check scroll indicators after scrolling
    setTimeout(checkScrollIndicators, 300);
  };
  
  const scrollRight = () => {
    if (!tabsContainerRef.current) return;
    // Use a fixed scroll amount for consistent movement
    tabsContainerRef.current.scrollBy({ left: 100, behavior: 'smooth' });
    // Force check scroll indicators after scrolling
    setTimeout(checkScrollIndicators, 300);
  };

  // Get the icon for a category
  const getCategoryIcon = (iconName: string) => {
    return ICON_MAP[iconName] || <Wrench className="h-4 w-4" />;
  };

  return (
    <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-sm relative">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-medium">Bookmarks</CardTitle>
        <div className="flex items-center space-x-2">
          <BookmarkSyncStatus />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsAddCategoryOpen(true);
              setIsAddBookmarkOpen(false);
              setIsEditCategoryOpen(false);
              setIsDeleteCategoryOpen(false);
            }}
            className="bg-slate-800 hover:bg-slate-700 text-white border-slate-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Category
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsAddBookmarkOpen(true);
              setIsAddCategoryOpen(false);
              setIsEditCategoryOpen(false);
              setIsDeleteCategoryOpen(false);
              
              // Default to active category
              if (activeCategory) {
                setNewBookmark(prev => ({
                  ...prev,
                  category_id: activeCategory
                }));
              }
            }}
            className="bg-slate-800 hover:bg-slate-700 text-white border-slate-700"
            disabled={categories.length === 0}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Bookmark
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pb-4 px-3">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-slate-400"></div>
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400">
            <p>No bookmarks yet. Add your first category to get started.</p>
          </div>
        ) : (
          <Tabs value={activeCategory || categories[0].id} onValueChange={setActiveCategory}>
            <div className="flex items-center relative mb-3">
              <div className="relative flex-1 overflow-hidden pr-[85px]">
                {/* Left scroll button */}
                {showLeftScroll && (
                  <button 
                    onClick={scrollLeft}
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 w-6 h-6 flex items-center justify-center rounded-full bg-slate-800 text-white shadow hover:bg-slate-700"
                    aria-label="Scroll left"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                )}
                
                {/* Tab Container */}
                <div 
                  ref={tabsContainerRef}
                  className="overflow-x-auto scrollbar-hide pb-1 px-8 w-full"
                >
                  <div className="flex gap-1">
                    {categories.map((category) => (
                      <button 
                        key={category.id} 
                        onClick={() => setActiveCategory(category.id)}
                        className={`px-3 py-1.5 bg-slate-800 text-sm rounded-md whitespace-nowrap hover:bg-slate-700 flex items-center ${activeCategory === category.id ? 'bg-slate-700 text-white' : 'text-slate-300'}`}
                      >
                        <span className="flex items-center">
                          {getCategoryIcon(category.icon)}
                          <span className="ml-1.5">{category.name}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Right scroll button */}
                {showRightScroll && (
                  <button 
                    onClick={scrollRight}
                    className="absolute right-[85px] top-1/2 transform -translate-y-1/2 z-10 w-6 h-6 flex items-center justify-center rounded-full bg-slate-800 text-white shadow hover:bg-slate-700"
                    aria-label="Scroll right"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>

              {activeCategory && (
                <div className="flex items-center ml-2 min-w-[70px]">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const category = categories.find(c => c.id === activeCategory);
                      if (category) {
                        setNewCategory({
                          id: category.id,
                          name: category.name,
                          icon: category.icon,
                        });
                        setIsEditCategoryOpen(true);
                        setIsAddBookmarkOpen(false);
                        setIsAddCategoryOpen(false);
                        setIsDeleteCategoryOpen(false);
                      }
                    }}
                    className="h-7 w-7 bg-slate-800 hover:bg-slate-700"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const category = categories.find(c => c.id === activeCategory);
                      if (category) {
                        setNewCategory({
                          id: category.id,
                          name: category.name,
                          icon: category.icon,
                        });
                        setIsDeleteCategoryOpen(true);
                        setIsAddBookmarkOpen(false);
                        setIsAddCategoryOpen(false);
                        setIsEditCategoryOpen(false);
                      }
                    }}
                    className="h-7 w-7 bg-slate-800 hover:bg-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>

            {categories.map((category) => (
              <TabsContent key={category.id} value={category.id}>
                {category.bookmarks && category.bookmarks.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
                    {category.bookmarks.map((bookmark) => (
                      <BookmarkItem 
                        key={bookmark.id} 
                        bookmark={bookmark} 
                        onBookmarkUpdated={handleBookmarkUpdated}
                        onBookmarkDeleted={handleBookmarkDeleted}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                    <p>No bookmarks in this category yet.</p>
                    <Button
                      variant="link"
                      onClick={() => {
                        setIsAddBookmarkOpen(true);
                        setNewBookmark(prev => ({
                          ...prev,
                          category_id: category.id
                        }));
                      }}
                      className="mt-2"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Bookmark
                    </Button>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>

      {/* Add Bookmark Dialog */}
      {isAddBookmarkOpen && (
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            <div className="fixed inset-0 bg-black/80" onClick={() => setIsAddBookmarkOpen(false)}></div>
            <div className="relative bg-slate-900 border border-slate-800 rounded-lg w-full max-w-md p-6 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Add New Bookmark</h2>
                <button onClick={() => setIsAddBookmarkOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bookmark-title">Title</Label>
                  <Input
                    id="bookmark-title"
                    value={newBookmark.title}
                    onChange={(e) => setNewBookmark({ ...newBookmark, title: e.target.value })}
                    placeholder="Enter bookmark title"
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bookmark-url">URL</Label>
                  <Input
                    id="bookmark-url"
                    value={newBookmark.url}
                    onChange={(e) => setNewBookmark({ ...newBookmark, url: e.target.value })}
                    placeholder="https://example.com"
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bookmark-category">Category</Label>
                  <select
                    id="bookmark-category"
                    value={newBookmark.category_id}
                    onChange={(e) => setNewBookmark({ ...newBookmark, category_id: e.target.value })}
                    className="w-full p-2 rounded-md bg-slate-800 border-slate-700 text-white"
                  >
                    <option value="" disabled>Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-full bg-${color}-500 border-2 ${
                          newBookmark.color === `bg-${color}-500` ? "border-white" : "border-transparent"
                        }`}
                        onClick={() => setNewBookmark({ ...newBookmark, color: `bg-${color}-500` })}
                      />
                    ))}
                  </div>
                </div>
                <div className="pt-6 pb-2 flex justify-end">
                  <Button
                    onClick={handleAddBookmark}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoading ? (
                      <div className="animate-spin h-4 w-4 border-2 border-t-transparent rounded-full mr-2"></div>
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Add Bookmark
                  </Button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      )}

      {/* Add Category Dialog */}
      {isAddCategoryOpen && (
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            <div className="fixed inset-0 bg-black/80" onClick={() => setIsAddCategoryOpen(false)}></div>
            <div className="relative bg-slate-900 border border-slate-800 rounded-lg w-full max-w-md p-6 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Add New Category</h2>
                <button onClick={() => setIsAddCategoryOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category-name">Name</Label>
                  <Input
                    id="category-name"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    placeholder="Enter category name"
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category-icon">Icon</Label>
                  <select
                    id="category-icon"
                    value={newCategory.icon}
                    onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                    className="w-full p-2 rounded-md bg-slate-800 border-slate-700 text-white"
                  >
                    <option value="shield-alert">Security</option>
                    <option value="code">Code</option>
                    <option value="book-open">Learning</option>
                    <option value="newspaper">News</option>
                    <option value="wrench">Tools</option>
                    <option value="briefcase">Work</option>
                    <option value="gamepad">Games</option>
                  </select>
                </div>
                <div className="pt-4 flex justify-end">
                  <Button
                    onClick={handleAddCategory}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoading ? (
                      <div className="animate-spin h-4 w-4 border-2 border-t-transparent rounded-full mr-2"></div>
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Add Category
                  </Button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      )}

      {/* Edit Category Dialog */}
      {isEditCategoryOpen && (
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            <div className="fixed inset-0 bg-black/80" onClick={() => setIsEditCategoryOpen(false)}></div>
            <div className="relative bg-slate-900 border border-slate-800 rounded-lg w-full max-w-md p-6 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Edit Category</h2>
                <button onClick={() => setIsEditCategoryOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-category-name">Name</Label>
                  <Input
                    id="edit-category-name"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    placeholder="Enter category name"
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-category-icon">Icon</Label>
                  <select
                    id="edit-category-icon"
                    value={newCategory.icon}
                    onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                    className="w-full p-2 rounded-md bg-slate-800 border-slate-700 text-white"
                  >
                    <option value="shield-alert">Security</option>
                    <option value="code">Code</option>
                    <option value="book-open">Learning</option>
                    <option value="newspaper">News</option>
                    <option value="wrench">Tools</option>
                    <option value="briefcase">Work</option>
                    <option value="gamepad">Games</option>
                  </select>
                </div>
                <div className="pt-4 flex justify-end">
                  <Button
                    onClick={handleEditCategory}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoading ? (
                      <div className="animate-spin h-4 w-4 border-2 border-t-transparent rounded-full mr-2"></div>
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      )}

      {/* Delete Category Confirmation */}
      {isDeleteCategoryOpen && (
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            <div className="fixed inset-0 bg-black/80" onClick={() => setIsDeleteCategoryOpen(false)}></div>
            <div className="relative bg-slate-900 border border-slate-800 rounded-lg w-full max-w-md p-6 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Delete Category</h2>
                <button onClick={() => setIsDeleteCategoryOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <p className="text-slate-300">
                  Are you sure you want to delete <span className="font-bold">{newCategory.name}</span>? This will also delete all bookmarks in this category.
                </p>
                <div className="pt-4 flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsDeleteCategoryOpen(false)}
                    className="bg-slate-800 hover:bg-slate-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteCategory}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="animate-spin h-4 w-4 border-2 border-t-transparent rounded-full mr-2"></div>
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      )}
    </Card>
  )
}
