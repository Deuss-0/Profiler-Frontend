"use client"

import { useState } from "react"
import { ExternalLink, Edit, Trash2, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Bookmark } from "@/lib/local-storage-service"
import { useToast } from "@/components/ui/use-toast"
import { useBookmarkSync } from "@/hooks/use-bookmark-sync"

type BookmarkProps = {
  bookmark: Bookmark;
  onBookmarkUpdated?: (bookmark: Bookmark) => void;
  onBookmarkDeleted?: (bookmarkId: string) => void;
}

export function BookmarkItem({ bookmark, onBookmarkUpdated, onBookmarkDeleted }: BookmarkProps) {
  const { toast } = useToast();
  const { isOnline, trackBookmarkChange } = useBookmarkSync();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteConfirm, setIsDeleteConfirm] = useState(false);
  const [editedBookmark, setEditedBookmark] = useState<Bookmark>({...bookmark});
  const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => {
    if (!isEditing && !isDeleteConfirm) {
      window.open(bookmark.url, "_blank");
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setIsDeleteConfirm(false);
  };

  /**
   * Check if an ID is likely a temporary (client-generated) ID
   */
  const isTemporaryId = (id: string | number): boolean => {
    if (!id) return false;
    
    const strId = String(id);
    
    // Consider an ID temporary if:
    // 1. It's longer than 10 characters (most DB IDs are smaller)
    // 2. It starts with 'temp_'
    // 3. It's a timestamp (13 digits starting with 1 or 2)
    return strId.length > 10 || 
           strId.startsWith('temp_') || 
           (strId.length === 13 && (strId.startsWith('1') || strId.startsWith('2')));
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isDeleteConfirm) {
      setIsLoading(true);
      try {
        // Check if the bookmark has a temporary ID (client-generated)
        const bookmarkIsTemporary = isTemporaryId(bookmark.id);
        
        console.log(`Deleting bookmark: ${bookmark.title} (ID: ${bookmark.id}${bookmarkIsTemporary ? ' - temporary' : ''})`);
        
        // Always notify parent component to update UI immediately
        onBookmarkDeleted?.(bookmark.id);
        
        // Track bookmark deletion for syncing (only if it's not temporary or if we're offline)
        if (!bookmarkIsTemporary || !isOnline) {
          trackBookmarkChange('delete', bookmark);
        }
        
        // Only call the API if online and not a temporary ID
        if (isOnline && !bookmarkIsTemporary) {
          try {
            console.log(`Sending DELETE request to ${API_URL}/api/bookmarks/${bookmark.id}`);
            const response = await fetch(`${API_URL}/api/bookmarks/${bookmark.id}`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
            });
            
            if (!response.ok) {
              // For 404 errors, just log it but don't throw (item already gone)
              if (response.status === 404) {
                console.log(`Bookmark ${bookmark.id} not found on server (404) - already deleted`);
              } else {
                throw new Error(`API error: ${response.status}`);
              }
            } else {
              console.log(`Successfully deleted bookmark ${bookmark.id} from server`);
            }
          } catch (apiError) {
            console.error("API error during deletion:", apiError);
            // Only show an error toast for non-404 errors when online
            if (!(apiError instanceof Error && apiError.message.includes('404'))) {
              toast({
                title: "Error on server",
                description: "Bookmark was removed locally but there was a server error",
                variant: "destructive",
              });
            }
          }
        } else if (bookmarkIsTemporary) {
          console.log(`Skipping API delete for temporary bookmark ID: ${bookmark.id}`);
        }
        
        // Always show success toast since the bookmark was removed locally
        toast({
          title: "Bookmark deleted",
          description: `${bookmark.title} has been removed from your bookmarks.`,
        });
      } catch (error) {
        console.error("Error deleting bookmark:", error);
        toast({
          title: "Error deleting bookmark",
          description: isOnline 
            ? "Please try again later" 
            : "Bookmark deleted locally and will sync when online",
          variant: isOnline ? "destructive" : "default",
        });
      } finally {
        setIsLoading(false);
        setIsDeleteConfirm(false);
      }
    } else {
      setIsDeleteConfirm(true);
      setIsEditing(false);
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!editedBookmark.title || !editedBookmark.url) {
      toast({
        title: "Validation error",
        description: "Title and URL are required",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      // Format URL if necessary
      if (!editedBookmark.url.startsWith('http')) {
        editedBookmark.url = `https://${editedBookmark.url}`;
      }
      
      // Clone the bookmark to avoid reference issues
      const updatedBookmark = {
        ...editedBookmark,
        url: editedBookmark.url.startsWith('http') ? editedBookmark.url : `https://${editedBookmark.url}`
      };
      
      // First update local state for immediate UI update
      onBookmarkUpdated?.(updatedBookmark);

      // Track bookmark update for syncing
      trackBookmarkChange('update', updatedBookmark);
      
      if (isOnline) {
        // For debugging
        console.log("Updating bookmark:", JSON.stringify({
          id: updatedBookmark.id,
          title: updatedBookmark.title,
          url: updatedBookmark.url,
          category_id: updatedBookmark.category_id,
          color: updatedBookmark.color
        }));
        
        // Check if ID is temporary (client-generated) - large timestamp-based IDs
        const isTemporaryId = String(updatedBookmark.id).length > 10;
        
        // Prepare request data
        const bookmarkData = {
          title: updatedBookmark.title,
          url: updatedBookmark.url,
          category_id: updatedBookmark.category_id,
          color: updatedBookmark.color
        };
        
        let response;
        
        if (isTemporaryId) {
          // Create new bookmark with POST to /api/bookmarks
          console.log("Using POST for temporary ID:", updatedBookmark.id);
          response = await fetch(`${API_URL}/api/bookmarks`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(bookmarkData),
          });
        } else {
          // Update existing bookmark with PUT to /api/bookmarks/:id
          console.log("Using PUT for database ID:", updatedBookmark.id);
          response = await fetch(`${API_URL}/api/bookmarks/${updatedBookmark.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(bookmarkData),
          });
        }
        
        if (!response.ok) {
          let errorMsg = `API error: ${response.status}`;
          try {
            const errorData = await response.json();
            console.error("Server returned error:", errorData);
            errorMsg = errorData.error || errorData.message || errorMsg;
          } catch (_) {
            console.error("Failed to parse error response");
          }
          throw new Error(errorMsg);
        }
        
        // Get the server response
        const data = await response.json();
        console.log("Server response:", data);
        
        // If server returned updated bookmark, use its data
        if (data.bookmark) {
          const serverBookmark = {
            ...data.bookmark,
            id: String(data.bookmark.id),
            category_id: String(data.bookmark.category_id)
          };
          onBookmarkUpdated?.(serverBookmark);
        }
      }
      
      setIsEditing(false);
      
      toast({
        title: "Bookmark updated",
        description: `${editedBookmark.title} has been updated.`,
      });
    } catch (error) {
      console.error("Error updating bookmark:", error);
      toast({
        title: "Error updating bookmark",
        description: isOnline 
          ? "There was an error updating the bookmark on the server"
          : "Bookmark updated locally and will sync when online",
        variant: isOnline ? "destructive" : "default",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
    setIsDeleteConfirm(false);
    setEditedBookmark({...bookmark}); // Reset edited data
  };

  // Extract domain for favicon
  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch (_) {
      return url;
    }
  };

  const domain = getDomain(bookmark.url);
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

  if (isEditing) {
    return (
      <div className="flex flex-col p-4 bg-slate-800 rounded-xl border border-slate-700 space-y-3">
        <Input
          value={editedBookmark.title}
          onChange={(e) => setEditedBookmark({...editedBookmark, title: e.target.value})}
          placeholder="Title"
          className="bg-slate-700 border-slate-600"
        />
        <Input
          value={editedBookmark.url}
          onChange={(e) => setEditedBookmark({...editedBookmark, url: e.target.value})}
          placeholder="URL"
          className="bg-slate-700 border-slate-600"
        />
        <div className="flex justify-between space-x-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCancel}
            className="bg-slate-700 hover:bg-slate-600 border-slate-600 flex-1"
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSave}
            disabled={isLoading}
            className="bg-slate-700 hover:bg-slate-600 border-slate-600 text-green-400 hover:text-green-300 flex-1"
          >
            <Check className="h-4 w-4 mr-1" />
            Save
          </Button>
        </div>
      </div>
    );
  }

  if (isDeleteConfirm) {
    return (
      <div className="flex flex-col items-center justify-center p-4 bg-slate-800 rounded-xl border border-slate-700 h-full">
        <p className="text-sm text-center mb-3">Delete this bookmark?</p>
        <div className="flex justify-between space-x-2 w-full">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCancel}
            className="bg-slate-700 hover:bg-slate-600 border-slate-600 flex-1"
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleDelete}
            disabled={isLoading}
            className="flex-1"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center justify-center p-4 bg-slate-800/50 hover:bg-slate-800 rounded-xl cursor-pointer transition-all duration-200 border border-slate-700/50 hover:border-slate-700 group relative"
      onClick={handleClick}
    >
      <div
        className={`w-12 h-12 rounded-full ${bookmark.color || "bg-slate-700"} flex items-center justify-center mb-3`}
      >
        {bookmark.icon ? (
          <img src={bookmark.icon || "/placeholder.svg"} alt={bookmark.title} className="w-6 h-6" />
        ) : (
          <img src={faviconUrl || "/placeholder.svg"} alt={bookmark.title} className="w-6 h-6" />
        )}
      </div>
      <p className="text-sm font-medium text-center line-clamp-1">{bookmark.title}</p>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-2">
        <ExternalLink className="h-4 w-4 text-slate-400" />
      </div>
      
      {/* Edit and delete actions */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 bg-slate-700/70 hover:bg-slate-600/90"
          onClick={handleEdit}
        >
          <Edit className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 bg-slate-700/70 hover:bg-red-600/90"
          onClick={(e) => {
            e.stopPropagation();
            setIsDeleteConfirm(true);
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
