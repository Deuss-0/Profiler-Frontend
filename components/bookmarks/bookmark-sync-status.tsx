"use client"

import { useBookmarkSync } from "@/hooks/use-bookmark-sync"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Cloud, CloudOff, RefreshCw, Check } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useMounted } from "@/hooks/use-mounted"

export function BookmarkSyncStatus() {
  const { pendingChanges, isOnline, isSyncing, syncChanges, lastSyncTime } = useBookmarkSync()
  const mounted = useMounted()
  
  const formatLastSync = () => {
    if (!lastSyncTime) return 'Never synced'
    
    if (!mounted) return 'Last synced'
    
    const date = new Date(lastSyncTime)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.round(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
    
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
  }
  
  // During SSR, render a minimal version to prevent hydration mismatches
  if (!mounted) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <div className="flex items-center">
          <Cloud className="h-4 w-4 text-slate-400" />
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex items-center gap-2 text-sm">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center">
              {isOnline ? (
                <Cloud className="h-4 w-4 text-green-400" />
              ) : (
                <CloudOff className="h-4 w-4 text-amber-400" />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isOnline ? 'Online - Changes will sync to server' : 'Offline - Changes saved locally'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {pendingChanges > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="bg-slate-800 text-amber-400 border-amber-500/50">
                {pendingChanges} change{pendingChanges !== 1 ? 's' : ''} pending
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>You have {pendingChanges} unsynchronized change{pendingChanges !== 1 ? 's' : ''}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      {pendingChanges === 0 && lastSyncTime !== null && lastSyncTime > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="bg-slate-800 text-green-400 border-green-500/50">
                <Check className="h-3 w-3 mr-1" />
                Synced
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Last synchronized: {formatLastSync()}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      {(pendingChanges > 0 || lastSyncTime === 0) && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8" 
          onClick={syncChanges} 
          disabled={!isOnline || isSyncing}
        >
          <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
          <span className="sr-only">Sync Bookmarks</span>
        </Button>
      )}
    </div>
  )
} 