"use client"

import { 
  StickyNote, 
  Save, 
  Trash, 
  Plus, 
  Clock,
  FileText, 
  Loader2,
  Check,
  Maximize2,
  Copy,
  Eye,
  Code,
  Download,
  Upload,
  RefreshCw
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  IconCode, 
  IconTable, 
  IconList, 
  IconHeading, 
  IconQuote, 
  IconListCheck, 
  IconFileDescription,
  IconMinimize 
} from "@tabler/icons-react"

type Note = {
  id: string
  title: string
  content: string
  createdAt: any
  updatedAt: any
  tags?: string[]
}

export function QuickNotesWidget() {
  const [currentNote, setCurrentNote] = useState<Note>({
    id: "",
    title: "",
    content: "",
    createdAt: null,
    updatedAt: null,
    tags: []
  })
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [currentTab, setCurrentTab] = useState("editor")
  const [importedFile, setImportedFile] = useState<File | null>(null)
  const [lastEditTime, setLastEditTime] = useState<number>(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()
  const { isAuthenticated } = useAuth()
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sigh-ai.com'

  // Debounce search query to prevent excessive filtering
  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current)
    }
    
    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)
    
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current)
      }
    }
  }, [searchQuery])

  useEffect(() => {
    // Load notes from API for authenticated users or localStorage for others
    const loadNotes = async () => {
      setIsLoading(true)
      
      try {
        if (isAuthenticated) {
          try {
            // Add headers with token for authentication
            const headers: Record<string, string> = {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            };
            
            // Check for token in storage
            let token = null;
            if (typeof window !== 'undefined') {
              token = localStorage.getItem('token') || sessionStorage.getItem('token');
              if (token) {
                headers['Authorization'] = `Bearer ${token}`;
              }
            }
            
            console.log(`Fetching notes from: ${API_URL}/api/notes`);
            
            const response = await fetch(`${API_URL}/api/notes`, {
              method: 'GET',
              credentials: "include",
              headers,
              cache: 'no-store' // Prevent caching issues
            })
            
            if (response.ok) {
              const data = await response.json()
              const loadedNotes = data.notes || []
              // Transform notes to ensure they have tags
              const processedNotes = loadedNotes.map((note: any) => ({
                ...note,
                tags: note.tags || []
              }))
              setNotes(processedNotes)
              
              // Set the most recent note as current if available
              if (processedNotes.length > 0) {
                setCurrentNote(processedNotes[0])
              }
            } else {
              // Get error details from response
              const errorText = await response.text();
              console.error(`API error: ${response.status}`, errorText);
              throw new Error(`API response error: ${response.status}`);
            }
          } catch (error) {
            console.error("Failed to fetch notes:", error)
            toast({
              title: "Error",
              description: "Failed to load notes. Using local storage instead.",
              variant: "destructive"
            })
            loadFromLocalStorage()
          }
        } else {
          loadFromLocalStorage()
        }
      } catch (error) {
        console.error("Error in loadNotes:", error)
        // Fallback to empty state in worst case
        setNotes([])
      } finally {
        setIsLoading(false)
      }
    }
    
    const loadFromLocalStorage = () => {
      try {
        // For non-authenticated users, use local storage
        const savedNotes = localStorage.getItem("quickNotes")
        if (savedNotes) {
          try {
            const parsedNotes = JSON.parse(savedNotes)
            if (Array.isArray(parsedNotes)) {
              // Ensure all notes have tags
              const processedNotes = parsedNotes.map(note => ({
                ...note,
                tags: note.tags || []
              }))
              setNotes(processedNotes)
              if (processedNotes.length > 0) {
                setCurrentNote(processedNotes[0])
              }
            } else {
              // Legacy format - single note as string
              const newNote = {
                id: "local-1",
                title: "Quick Note",
                content: parsedNotes,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                tags: []
              }
              setCurrentNote(newNote)
              setNotes([newNote])
            }
          } catch (e) {
            // Handle legacy format or parsing errors
            const noteContent = localStorage.getItem("quickNotes") || ""
            const newNote = {
              id: "local-1",
              title: "Quick Note",
              content: noteContent,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              tags: []
            }
            setCurrentNote(newNote)
            setNotes([newNote])
          }
        }
      } catch (error) {
        console.error("Error loading from localStorage:", error)
        // Initialize with empty state
        setNotes([])
      }
    }
    
    loadNotes()
  }, [isAuthenticated, toast, API_URL])

  useEffect(() => {
    // Set up keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only capture keyboard shortcuts if we're in fullscreen or the textarea is focused
      const isEditorFocused = document.activeElement === editorRef.current;
      
      if (isFullscreen || isEditorFocused) {
        // Ctrl/Cmd + S for save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
          e.preventDefault();
          handleSave();
        }
        
        // Ctrl/Cmd + E for toggle fullscreen
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
          e.preventDefault();
          toggleFullscreen();
        }
        
        // Ctrl/Cmd + P for toggle preview
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
          e.preventDefault();
          if (currentTab === 'editor') {
            setCurrentTab('preview');
          } else if (currentTab === 'preview') {
            setCurrentTab('editor');
          }
        }
        
        // Escape to exit fullscreen
        if (e.key === 'Escape' && isFullscreen) {
          e.preventDefault();
          setIsFullscreen(false);
        }
      }
    };
    
    // Add keyboard event listener
    window.addEventListener('keydown', handleKeyDown);
    
    // Clean up event listener when component unmounts
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen, currentTab]);

  const handleSave = async () => {
    if (!currentNote.content.trim()) {
      toast({
        title: "Empty note",
        description: "Cannot save an empty note.",
        variant: "destructive"
      })
      return
    }
    
    setIsSaving(true)
    
    try {
      if (isAuthenticated) {
        try {
          const response = await fetch(`${API_URL}/api/notes`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
              id: currentNote.id || undefined,
              title: currentNote.title || "Untitled",
              content: currentNote.content,
              tags: currentNote.tags || []
            })
          })
          
          if (response.ok) {
            const result = await response.json()
            
            // Update local state with new ID if it was a new note
            if (!currentNote.id) {
              setCurrentNote(prev => ({
                ...prev,
                id: result.noteId,
                updatedAt: new Date().toISOString()
              }))
              
              // Update notes list
              const updatedNote = {
                ...currentNote,
                id: result.noteId,
                updatedAt: new Date().toISOString()
              }
              setNotes(prevNotes => {
                // If this was an update to an existing note
                if (prevNotes.some(n => n.id === updatedNote.id)) {
                  return prevNotes.map(n => 
                    n.id === updatedNote.id ? updatedNote : n
                  ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                }
                // If this was a new note
                return [updatedNote, ...prevNotes]
              })
            } else {
              // Just update the existing note's content and timestamp
              const updatedNote = {
                ...currentNote,
                updatedAt: new Date().toISOString()
              }
              setCurrentNote(updatedNote)
              setNotes(prevNotes => 
                prevNotes.map(n => n.id === currentNote.id ? updatedNote : n)
                  .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
              )
            }
            
            toast({
              description: "Note saved successfully",
              className: "bg-emerald-800 border-0 text-white",
              icon: <Check className="h-4 w-4" />,
            })
          } else {
            // Instead of throwing immediately, get more context about the error
            const errorText = await response.text().catch(() => "Unknown error");
            console.error(`Failed to save note: ${response.status} - ${errorText}`);
            
            // Fall back to local storage
            toast({
              title: "API Error",
              description: `Couldn't save to server (${response.status}). Saving locally instead.`,
              variant: "destructive"
            });
            
            // Save to local storage as fallback
            saveToLocalStorage();
          }
        } catch (error) {
          console.error("Error saving note:", error)
          toast({
            title: "Error",
            description: "Failed to save note. Saving to local storage instead.",
            variant: "destructive"
          })
          saveToLocalStorage()
        }
      } else {
        saveToLocalStorage()
        toast({
          description: "Note saved to local storage",
          className: "bg-emerald-800 border-0 text-white",
          icon: <Check className="h-4 w-4" />,
        })
      }
    } catch (error) {
      console.error("Unhandled error during save:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const saveToLocalStorage = () => {
    try {
      // Update current note's timestamp
      const updatedNote = {
        ...currentNote,
        title: currentNote.title || "Untitled",
        updatedAt: new Date().toISOString(),
        id: currentNote.id || `local-${Date.now()}`
      }
      setCurrentNote(updatedNote)
      
      // Update notes list
      let updatedNotes
      if (notes.some(n => n.id === updatedNote.id)) {
        updatedNotes = notes.map(n => n.id === updatedNote.id ? updatedNote : n)
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      } else {
        updatedNotes = [updatedNote, ...notes]
      }
      
      setNotes(updatedNotes)
      localStorage.setItem("quickNotes", JSON.stringify(updatedNotes))
    } catch (error) {
      console.error("Error saving to localStorage:", error)
      toast({
        title: "Error",
        description: "Failed to save note to local storage",
        variant: "destructive"
      })
    }
  }

  const handleClear = async () => {
    try {
      if (currentNote.id && isAuthenticated && !currentNote.id.startsWith('local-')) {
        try {
          const response = await fetch(`${API_URL}/api/notes/${currentNote.id}`, {
            method: 'DELETE',
            credentials: 'include'
          })
          
          if (response.ok) {
            // Remove from notes list
            setNotes(prevNotes => prevNotes.filter(note => note.id !== currentNote.id))
            
            // Reset current note
            if (notes.length > 1) {
              const remainingNotes = notes.filter(note => note.id !== currentNote.id)
              setCurrentNote(remainingNotes[0])
            } else {
              setCurrentNote({
                id: "",
                title: "",
                content: "",
                createdAt: null,
                updatedAt: null,
                tags: []
              })
            }
            
            toast({
              description: "Note deleted successfully",
              className: "bg-emerald-800 border-0 text-white",
              icon: <Check className="h-4 w-4" />,
            })
          } else {
            throw new Error('Failed to delete note')
          }
        } catch (error) {
          console.error('Error deleting note:', error)
          toast({
            title: "Error",
            description: "Failed to delete note",
            variant: "destructive"
          })
        }
      } else {
        // For non-authenticated users or local notes
        if (currentNote.id) {
          setNotes(prevNotes => prevNotes.filter(note => note.id !== currentNote.id))
          localStorage.setItem("quickNotes", JSON.stringify(
            notes.filter(note => note.id !== currentNote.id)
          ))
        }
        
        // Reset current note
        if (notes.length > 1) {
          const remainingNotes = notes.filter(note => note.id !== currentNote.id)
          setCurrentNote(remainingNotes[0])
        } else {
          setCurrentNote({
            id: "",
            title: "",
            content: "",
            createdAt: null,
            updatedAt: null,
            tags: []
          })
          localStorage.removeItem("quickNotes")
        }
        
        toast({
          description: "Note cleared",
          className: "bg-emerald-800 border-0 text-white",
          icon: <Check className="h-4 w-4" />,
        })
      }
    } catch (error) {
      console.error("Unhandled error during note deletion:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while deleting the note",
        variant: "destructive"
      })
    }
  }

  const createNewNote = () => {
    setCurrentNote({
      id: "",
      title: "New Note",
      content: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: []
    })
  }

  const selectNote = (note: Note) => {
    setCurrentNote(note)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch (error) {
      console.error("Error formatting date:", error)
      return 'Invalid date'
    }
  }

  const handleTagChange = (tagInput: string) => {
    try {
      // Convert comma-separated string to array of tags
      const tags = tagInput.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag !== '')
      
      setCurrentNote({...currentNote, tags})
    } catch (error) {
      console.error("Error handling tag change:", error)
    }
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const togglePreviewMode = () => {
    setIsPreviewMode(!isPreviewMode)
  }

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    try {
      // Handle tab key for indentation
      if (e.key === 'Tab') {
        e.preventDefault()
        const textarea = e.currentTarget
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        
        const newValue = textarea.value.substring(0, start) + '  ' + textarea.value.substring(end)
        setCurrentNote({...currentNote, content: newValue})
        
        // Set cursor position after the inserted tab
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2
        }, 0)
      }
    } catch (error) {
      console.error("Error handling textarea keydown:", error)
    }
  }

  const copyToClipboard = () => {
    try {
      navigator.clipboard.writeText(currentNote.content)
      toast({
        description: "Content copied to clipboard",
        className: "bg-emerald-800 border-0 text-white",
        icon: <Check className="h-4 w-4" />,
      })
    } catch (error) {
      console.error("Error copying to clipboard:", error)
      toast({
        title: "Error",
        description: "Failed to copy content to clipboard",
        variant: "destructive"
      })
    }
  }

  const downloadNote = () => {
    try {
      const element = document.createElement('a')
      const file = new Blob([currentNote.content], {type: 'text/markdown'})
      element.href = URL.createObjectURL(file)
      element.download = `${currentNote.title || 'untitled'}.md`
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
    } catch (error) {
      console.error("Error downloading note:", error)
      toast({
        title: "Error",
        description: "Failed to download note",
        variant: "destructive"
      })
    }
  }

  const importNoteFromFile = () => {
    fileInputRef.current?.click()
  }

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0]
      if (!file) return

      setImportedFile(file)
      
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          if (event.target?.result) {
            const content = event.target.result.toString()
            
            // Extract title from filename
            let title = file.name
            if (title.endsWith('.md') || title.endsWith('.txt') || title.endsWith('.markdown')) {
              title = title.substring(0, title.lastIndexOf('.'))
            }
            
            setCurrentNote({
              ...currentNote,
              title,
              content,
              updatedAt: new Date().toISOString()
            })
            
            toast({
              description: "File imported successfully",
              className: "bg-emerald-800 border-0 text-white",
              icon: <Check className="h-4 w-4" />,
            })
          }
        } catch (innerError) {
          console.error("Error in reader onload:", innerError)
          toast({
            title: "Error",
            description: "Failed to process imported file",
            variant: "destructive"
          })
        }
      }
      
      reader.onerror = () => {
        toast({
          title: "Error",
          description: "Failed to read file",
          variant: "destructive"
        })
      }
      
      reader.readAsText(file)
      
      // Reset file input
      e.target.value = ''
    } catch (error) {
      console.error("Error importing file:", error)
      toast({
        title: "Error",
        description: "Failed to import file",
        variant: "destructive"
      })
    }
  }

  const insertTemplate = (templateType: string) => {
    try {
      let template = '';
      
      switch(templateType) {
        case 'table':
          template = '| Header 1 | Header 2 | Header 3 |\n| --- | --- | --- |\n| Row 1, Col 1 | Row 1, Col 2 | Row 1, Col 3 |\n| Row 2, Col 1 | Row 2, Col 2 | Row 2, Col 3 |';
          break;
        case 'codeblock':
          template = '```javascript\n// Your code here\nconst hello = "world";\nconsole.log(hello);\n```';
          break;
        case 'checkbox':
          template = '- [ ] Task 1\n- [ ] Task 2\n- [x] Completed Task';
          break;
        case 'frontmatter':
          template = '---\ntitle: ' + (currentNote.title || 'Untitled') + '\ndate: ' + new Date().toISOString().split('T')[0] + '\ntags: ' + (currentNote.tags?.join(', ') || '') + '\n---\n\n';
          break;
        case 'heading':
          template = '# Heading 1\n## Heading 2\n### Heading 3';
          break;
        case 'list':
          template = '- Item 1\n- Item 2\n  - Nested item\n- Item 3\n\n1. First item\n2. Second item\n3. Third item';
          break;
        case 'quote':
          template = '> This is a blockquote.\n> It can span multiple lines.';
          break;
        default:
          console.warn(`Unknown template type: ${templateType}`);
          return;
      }
      
      // Insert at cursor position or append to end
      if (editorRef.current) {
        const textarea = editorRef.current;
        const start = textarea.selectionStart || 0;
        const end = textarea.selectionEnd || 0;
        
        const newContent = textarea.value.substring(0, start) + template + textarea.value.substring(end);
        setCurrentNote({...currentNote, content: newContent});
        
        // Focus back to textarea and position cursor after the template
        setTimeout(() => {
          textarea.focus();
          const newPosition = start + template.length;
          textarea.selectionStart = newPosition;
          textarea.selectionEnd = newPosition;
        }, 50);
      } else {
        // Append to end if textarea ref not available
        setCurrentNote({...currentNote, content: (currentNote.content || '') + '\n' + template});
      }
    } catch (error) {
      console.error("Error inserting template:", error)
      toast({
        title: "Error",
        description: "Failed to insert template",
        variant: "destructive"
      })
    }
  };

  // Filter notes based on debounced search query
  const filteredNotes = notes.filter(note => {
    if (!debouncedSearchQuery) return true
    
    const searchLower = debouncedSearchQuery.toLowerCase()
    return (
      (note.title?.toLowerCase().includes(searchLower) || false) || 
      (note.content?.toLowerCase().includes(searchLower) || false) ||
      (note.tags?.some(tag => tag.toLowerCase().includes(searchLower)) || false)
    )
  })

  // Add this function to format markdown for preview
  const formatMarkdownPreview = (content: string): string => {
    if (!content) return '';
    
    // Add line breaks first
    let formatted = content.replace(/\n/g, '<br />');
    
    // Format the content with basic styling
    formatted = formatted
      // Replace headings (do before paragraphs)
      .replace(/(^|\<br \/\>)# (.*?)(\<br \/\>|$)/g, '$1<h1 class="text-2xl font-bold my-4">$2</h1>$3')
      .replace(/(^|\<br \/\>)## (.*?)(\<br \/\>|$)/g, '$1<h2 class="text-xl font-bold my-3">$2</h2>$3')
      .replace(/(^|\<br \/\>)### (.*?)(\<br \/\>|$)/g, '$1<h3 class="text-lg font-bold my-2">$2</h3>$3')
      // Replace lists
      .replace(/(^|\<br \/\>)- (.*?)(\<br \/\>|$)/g, '$1<ul class="list-disc pl-5 my-2"><li>$2</li></ul>$3')
      .replace(/(^|\<br \/\>)\d+\. (.*?)(\<br \/\>|$)/g, '$1<ol class="list-decimal pl-5 my-2"><li>$2</li></ol>$3')
      // Replace blockquotes
      .replace(/(^|\<br \/\>)> (.*?)(\<br \/\>|$)/g, '$1<blockquote class="border-l-4 border-cyan-500 pl-4 py-1 my-2 italic bg-slate-800/50">$2</blockquote>$3')
      // Replace code blocks - handle multiline with a find and replace approach
      .replace(/```([\s\S]*?)```/g, function(match) {
        const content = match.replace(/```([\s\S]*?)```/, '$1');
        const formattedContent = content.replace(/\<br \/\>/g, '\n');
        return '<pre class="bg-slate-950 p-3 my-3 rounded overflow-auto text-sm font-mono">' + formattedContent + '</pre>';
      })
      // Replace inline code (do after code blocks)
      .replace(/`([^`]+)`/g, '<code class="bg-slate-700 px-1 rounded text-sm font-mono">$1</code>')
      // Replace bold and italic
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Replace links
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-blue-400 underline" target="_blank">$1</a>')
      // Replace horizontal rules
      .replace(/(^|\<br \/\>)---(\<br \/\>|$)/g, '$1<hr class="my-4 border-slate-700" />$2')
      // Clean up any extra break tags within elements
      .replace(/<(h\d|li|blockquote)([^>]*)>(.*?)<br \/>([^<]*)<\/(h\d|li|blockquote)>/g, '<$1$2>$3$4</$5>')
      .replace(/<(pre|code)([^>]*)>(.*?)<br \/>([^<]*)<\/(pre|code)>/g, '<$1$2>$3\n$4</$5>')
      // Wrap plain text in paragraphs (that aren't already wrapped in elements)
      .replace(/(^|\<\/[^>]+\>)([^<]+)(\<[^\/]|$)/g, function(match, p1, p2, p3) {
        if (p2.trim() === '') return match;
        return p1 + '<p class="mb-2">' + p2 + '</p>' + p3;
      });
    
    return formatted;
  };

  return (
    <>
      {isFullscreen ? (
        <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full bg-gray-900 text-white" onInteractOutside={(e) => e.preventDefault()}>
            <div className="flex justify-between items-center mb-4">
              <DialogTitle className="text-xl font-bold">{currentNote.title}</DialogTitle>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setIsFullscreen(false)} 
                  className="rounded-full"
                >
                  <IconMinimize size={18} />
                </Button>
              </div>
            </div>
            
            <div className="flex space-x-2 mb-2">
              {currentNote.tags?.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">{tag}</Badge>
              ))}
            </div>
            
            <Tabs defaultValue="edit" className="w-full h-[calc(100%-4rem)]" value={currentTab} onValueChange={setCurrentTab}>
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="edit">Edit</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
              <TabsContent value="edit" className="h-[calc(100%-3rem)]">
                <div className="mb-2 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => insertTemplate('codeblock')} title="Insert Code Block">
                    <IconCode size={16} />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => insertTemplate('table')} title="Insert Table">
                    <IconTable size={16} />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => insertTemplate('list')} title="Insert List">
                    <IconList size={16} />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => insertTemplate('heading')} title="Insert Headings">
                    <IconHeading size={16} />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => insertTemplate('quote')} title="Insert Quote">
                    <IconQuote size={16} />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => insertTemplate('checkbox')} title="Insert Checkboxes">
                    <IconListCheck size={16} />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => insertTemplate('frontmatter')} title="Insert Frontmatter">
                    <IconFileDescription size={16} />
                  </Button>
                </div>
                <Textarea
                  ref={editorRef}
                  value={currentNote.content}
                  onChange={(e) => setCurrentNote({...currentNote, content: e.target.value})}
                  className="h-full min-h-[50vh] font-mono text-sm bg-gray-800 text-gray-100"
                  placeholder="Type your note here... Markdown is supported."
                  onKeyDown={handleTextareaKeyDown}
                />
              </TabsContent>
              <TabsContent value="preview" className="h-[calc(100%-3rem)]">
                <ScrollArea className="h-full max-h-[70vh] rounded-md border p-4 bg-gray-800 text-gray-100">
                  {currentNote.content ? (
                    <div 
                      className="markdown-preview" 
                      dangerouslySetInnerHTML={{ __html: formatMarkdownPreview(currentNote.content) }}
                    />
                  ) : (
                    <p className="text-muted-foreground">No content to preview</p>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      ) : (
        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium flex items-center justify-between">
              <div className="flex items-center">
                <StickyNote className="h-4 w-4 mr-2 text-cyan-400" />
                Notes
              </div>
              <div className="flex items-center space-x-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={createNewNote}
                  className="h-8 px-2 text-cyan-400 hover:text-white hover:bg-cyan-900/50"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  New
                </Button>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleFullscreen}
                        className="h-8 w-8 p-0 text-cyan-400 hover:text-white hover:bg-cyan-900/50"
                      >
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Fullscreen Mode</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
              </div>
            ) : (
              <Tabs 
                defaultValue="editor" 
                className="w-full"
                value={currentTab}
                onValueChange={setCurrentTab}
              >
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="editor">
                    <FileText className="h-4 w-4 mr-1" />
                    Editor
                  </TabsTrigger>
                  <TabsTrigger value="preview">
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </TabsTrigger>
                  <TabsTrigger value="all-notes">
                    <StickyNote className="h-4 w-4 mr-1" />
                    All Notes ({notes.length})
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="editor" className="space-y-3">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Note title"
                      value={currentNote.title}
                      onChange={(e) => setCurrentNote({...currentNote, title: e.target.value})}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={importNoteFromFile}
                            className="h-10 bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Import from File</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  
                  <Input
                    placeholder="Tags (comma-separated)"
                    value={currentNote.tags?.join(', ') || ''}
                    onChange={(e) => handleTagChange(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white"
                  />

                  <div className="relative">
                    <Textarea
                      ref={editorRef}
                      placeholder="Type your notes here using Markdown syntax..."
                      className="min-h-[150px] bg-slate-800 border-slate-700 text-white"
                      value={currentNote.content}
                      onChange={(e) => setCurrentNote({...currentNote, content: e.target.value})}
                      onKeyDown={handleTextareaKeyDown}
                    />
                    <div className="absolute bottom-2 right-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="outline" className="h-7 border-cyan-800 bg-slate-900/50 text-cyan-400 hover:bg-cyan-900/30">
                            <Plus className="h-3 w-3 mr-1" /> Insert
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-slate-900 border-slate-800">
                          <DropdownMenuItem onClick={() => insertTemplate('table')}>Insert Table</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => insertTemplate('codeblock')}>Insert Code Block</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => insertTemplate('checkbox')}>Insert Checklist</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => insertTemplate('frontmatter')}>Insert Frontmatter</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  
                  {currentNote.updatedAt && (
                    <div className="text-xs text-slate-500 flex items-center">
                      <Clock className="h-3 w-3 mr-1" /> 
                      Last updated: {formatDate(currentNote.updatedAt)}
                    </div>
                  )}
                  <div className="flex justify-end space-x-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyToClipboard}
                      className="text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white"
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadNote}
                      className="text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClear}
                      className="text-red-400 border-red-900/50 hover:bg-red-900/20 hover:text-red-300"
                      disabled={!currentNote.id || isSaving}
                    >
                      <Trash className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={handleSave} 
                      className="bg-cyan-600 hover:bg-cyan-700 text-white"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="preview" className="space-y-3">
                  <div className="bg-slate-800 rounded-md p-4 min-h-[200px] border border-slate-700 overflow-auto">
                    {currentNote.content ? 
                      <div dangerouslySetInnerHTML={{ __html: formatMarkdownPreview(currentNote.content) }} /> : 
                      <div className="text-slate-500 italic">No content to preview</div>
                    }
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      size="sm" 
                      onClick={() => setCurrentTab('editor')} 
                      className="bg-cyan-600 hover:bg-cyan-700 text-white"
                    >
                      <Code className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="all-notes">
                  <Input
                    placeholder="Search notes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="mb-3 bg-slate-800 border-slate-700 text-white"
                  />
                  
                  {filteredNotes.length === 0 ? (
                    searchQuery ? (
                      <div className="text-center py-8 text-slate-400">
                        <RefreshCw className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No matching notes found</p>
                        <Button 
                          variant="link" 
                          className="text-cyan-400 mt-1"
                          onClick={() => setSearchQuery('')}
                        >
                          Clear search
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-400">
                        <StickyNote className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No notes yet</p>
                        <Button 
                          variant="link" 
                          className="text-cyan-400 mt-1"
                          onClick={createNewNote}
                        >
                          Create your first note
                        </Button>
                      </div>
                    )
                  ) : (
                    <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
                      {filteredNotes.map((note) => (
                        <div 
                          key={note.id} 
                          className={`p-3 rounded-md cursor-pointer transition-colors ${
                            currentNote.id === note.id 
                              ? 'bg-cyan-900/30 border border-cyan-800/50' 
                              : 'bg-slate-800 hover:bg-slate-700'
                          } border-slate-700`}
                          onClick={() => selectNote(note)}
                        >
                          <div className="font-medium mb-1 flex items-center justify-between">
                            <div className="truncate">{note.title || 'Untitled'}</div>
                            <div className="text-xs text-slate-400">
                              {note.updatedAt ? new Date(note.updatedAt).toLocaleDateString() : ''}
                            </div>
                          </div>
                          <p className="text-xs text-slate-400 truncate">
                            {note.content}
                          </p>
                          {note.tags && note.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {note.tags.map((tag, index) => (
                                <span 
                                  key={index} 
                                  className="px-1.5 py-0.5 text-[10px] bg-slate-700 text-slate-300 rounded-sm"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Hidden file input for importing notes */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".md,.txt,.markdown"
        style={{ display: 'none' }}
        onChange={handleFileImport}
      />
    </>
  )
} 