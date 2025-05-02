"use client"

import { TerminalIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"

type CommandOutput = {
  command: string
  output: string
}

type Note = {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

const COMMANDS = {
  help: "Available commands:\n  help     - Show this help message\n  clear    - Clear the terminal\n  whoami   - Show current user\n  date     - Show current date and time\n  echo     - Print text\n  ls       - List directory contents\n  pwd      - Show current directory\n  neofetch - Show system information\n  banner   - Show welcome banner\n  cat      - View note contents (usage: cat <note_id>)\n  notes    - List all notes\n  cd       - Change directory (usage: cd <directory>)",
  banner: `
    ██████╗ ███████╗██╗   ██╗███████╗ ███████╗
    ██╔══██╗██╔════╝██║   ██║██╔════╝ ██╔════╝
    ██║  ██║█████╗  ██║   ██║███████╗ ███████╗
    ██║  ██║██╔══╝  ██║   ██║╚════██║ ╚════██║
    ██████╔╝███████╗╚██████╔╝███████║ ███████║
    ╚═════╝ ╚══════╝ ╚═════╝ ╚══════╝ ╚══════╝
    Welcome to DEUSS Terminal v1.0.0
    Type 'help' for available commands
  `,
  neofetch: `
    OS: DEUSS Dashboard
    Host: ${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}
    Kernel: React 18.2.0
    Shell: Custom Terminal
    Resolution: ${typeof window !== 'undefined' ? window.screen.width + 'x' + window.screen.height : 'Unknown'}
    DE: Next.js
    WM: Tailwind CSS
    Theme: Dark
    Icons: Lucide
    Terminal: Custom Terminal
    CPU: JavaScript Engine
    Memory: Dynamic
    Disk: Cloud Storage
  `
}

const initialNeofetch = `
  OS: DEUSS Dashboard
  Host: localhost
  Kernel: React 18.2.0
  Shell: Custom Terminal
  Resolution: Unknown
  DE: Next.js
  WM: Tailwind CSS
  Theme: Dark
  Icons: Lucide
  Terminal: Custom Terminal
  CPU: JavaScript Engine
  Memory: Dynamic
  Disk: Cloud Storage
`

export function TerminalWidget() {
  const [command, setCommand] = useState("")
  const { user, isAuthenticated } = useAuth()
  const [displayUsername, setDisplayUsername] = useState("guest")
  const [history, setHistory] = useState<CommandOutput[]>([
    { command: "banner", output: COMMANDS.banner }
  ])
  const [notes, setNotes] = useState<Note[]>([])
  const [currentDir, setCurrentDir] = useState("/home/guest")
  const [isLoading, setIsLoading] = useState(true)
  const terminalEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sigh-ai.com'
  const [neofetchOutput, setNeofetchOutput] = useState(initialNeofetch)
  const [mounted, setMounted] = useState(false)

  // Load notes when component mounts and periodically refresh
  useEffect(() => {
    const loadNotes = async () => {
      setIsLoading(true)
      
      try {
        // Load stored user data to check auth status
        const storedUser = localStorage.getItem('user');
        const isLocallyAuthenticated = !!storedUser || isAuthenticated;
        
        if (isLocallyAuthenticated) {
          try {
            console.log(`Fetching notes from: ${API_URL}/api/notes`);
            
            const headers: Record<string, string> = {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            };
            
            // Check multiple storage locations for token
            let token = localStorage.getItem('token');
            if (!token) {
              token = sessionStorage.getItem('token');
            }
            
            // Always include token if available
            if (token) {
              headers['Authorization'] = `Bearer ${token}`;
              console.log("Using stored token for API request");
            }
            
            console.log(`API URL: ${API_URL}, Using authentication: ${!!token}`);
            
          const response = await fetch(`${API_URL}/api/notes`, {
              method: 'GET',
              credentials: "include", // Important for cookies
              headers,
              cache: 'no-store', // Prevent caching issues
            });
            
            console.log(`Notes API response status: ${response.status}`);
            
          if (response.ok) {
              const data = await response.json();
              console.log(`Notes fetched successfully, count: ${data.notes?.length || 0}`);
              setNotes(data.notes || []);
          } else {
              // Log the response for debugging
              let responseText = '';
              try {
                responseText = await response.text();
                console.warn(`Failed to fetch notes from API: ${response.status}`);
                console.warn(`Response text: ${responseText}`);
              } catch (textError) {
                console.error("Error reading response text:", textError);
              }
              
              // If API fails, try to get notes from localStorage as fallback
              loadFromLocalStorage();
            }
          } catch (fetchError) {
            console.error("Network error fetching notes:", fetchError);
            // Use localStorage as fallback
            loadFromLocalStorage();
          }
        } else {
          console.log("User not authenticated, using localStorage");
          // Not authenticated, use localStorage
          loadFromLocalStorage();
        }
      } catch (error) {
        console.error("Error in loadNotes:", error);
        // Don't show error toast as it might be annoying with auto-refresh
        setNotes([]); // Set empty array to avoid undefined errors
      } finally {
        setIsLoading(false);
      }
    }
    
    const loadFromLocalStorage = () => {
      try {
        const savedNotes = localStorage.getItem("quickNotes");
          if (savedNotes) {
            try {
            const parsedNotes = JSON.parse(savedNotes);
            if (Array.isArray(parsedNotes)) {
              setNotes(parsedNotes);
              console.log("Using localStorage notes successfully");
            } else {
              // Handle legacy format or invalid data
              console.warn("localStorage notes not in expected format");
              setNotes([]);
        }
          } catch (parseError) {
            console.error("Failed to parse localStorage notes:", parseError);
            setNotes([]);
          }
        } else {
          console.log("No notes found in localStorage");
          setNotes([]);
        }
      } catch (localStorageError) {
        console.error("Error accessing localStorage:", localStorageError);
        setNotes([]);
      }
    }

    loadNotes();
    // Refresh notes less frequently to avoid too many requests that might fail
    const interval = setInterval(loadNotes, 60000); // Change to 60 seconds instead of 30
    return () => clearInterval(interval);
  }, [isAuthenticated, API_URL]);

  // Update system info after component mounts
  useEffect(() => {
    setMounted(true)
    
    // Update username after hydration
    if (isAuthenticated && user?.email) {
      const clientUsername = user.email.split('@')[0];
      setDisplayUsername(clientUsername);
      setCurrentDir(`/home/${clientUsername}`);
    }
    
    // Update neofetch with client-side information
    if (typeof window !== 'undefined') {
      setNeofetchOutput(`
        OS: DEUSS Dashboard
        Host: ${window.location.hostname}
        Kernel: React 18.2.0
        Shell: Custom Terminal
        Resolution: ${window.screen.width}x${window.screen.height}
        DE: Next.js
        WM: Tailwind CSS
        Theme: Dark
        Icons: Lucide
        Terminal: Custom Terminal
        CPU: JavaScript Engine
        Memory: Dynamic
        Disk: Cloud Storage
      `);
    }
  }, [isAuthenticated, user]);

  // Helper to format dates robustly
  const formatDate = (date: any) => {
    const d = new Date(date);
    return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString();
  };

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Store current scroll position
    const scrollPos = mounted ? {
      top: window.scrollY,
      left: window.scrollX
    } : { top: 0, left: 0 };
    
    if (!command.trim()) return

    let output = ""

    // Command processor
    switch (command.toLowerCase()) {
      case "clear":
      case "cls":
        setHistory([])
        setCommand("")
        return
      case "help":
        output = COMMANDS.help
        break
      case "whoami":
        output = isAuthenticated ? (user?.email || "guest@localhost") : "guest@localhost"
        break
      case "date":
        output = mounted ? new Date().toLocaleString() : "Loading date..."
        break
      case "pwd":
        output = currentDir
        break
      case "neofetch":
        output = mounted ? neofetchOutput : initialNeofetch
        break
      case "banner":
        output = COMMANDS.banner
        break
      case "notes":
        if (isLoading) {
          output = "Loading notes..."
        } else if (notes.length === 0) {
          output = "No notes found. Use the Notes widget to create some notes."
        } else {
          output = "ID      Title               Last Updated\n" + 
            notes.map(note => 
              `${String(note.id).padEnd(8)} ${(note.title || 'Untitled').padEnd(20)} ${formatDate(note.updatedAt)}`
            ).join('\n')
        }
        break
      default:
        if (command.startsWith("cd ")) {
          const newDir = command.substring(3).trim()
          if (newDir === "..") {
            setCurrentDir("/home/" + displayUsername)
            output = "Changed directory to /home/" + displayUsername
          } else if (newDir === "notes") {
            setCurrentDir("/home/" + displayUsername + "/notes")
            output = "Changed directory to /home/" + displayUsername + "/notes"
          } else {
            output = `cd: ${newDir}: No such directory`
          }
        } else if (command.startsWith("cat ")) {
          if (isLoading) {
            output = "Loading notes..."
          } else {
            const noteId = command.substring(4).trim()
            const note = notes.find(n => String(n.id) === noteId)
            if (note) {
              output = `Title: ${note.title || 'Untitled'}\nLast updated: ${formatDate(note.updatedAt)}\n\n${note.content}`
            } else {
              output = `cat: ${noteId}: No such note. Use 'notes' command to see available notes.`
            }
          }
        } else if (command.startsWith("echo ")) {
          output = command.substring(5)
        } else if (command === "ls" || command === "ls -la") {
          if (currentDir === "/home/" + displayUsername + "/notes") {
            output = notes.length === 0 
              ? "No notes found."
              : notes.map(note => 
                  `-rw-r--r-- 1 ${displayUsername} ${displayUsername} ${note.content.length} ${formatDate(note.updatedAt)} ${String(note.id)}`
                ).join('\n')
          } else {
            output = `total 20
drwxr-xr-x  2 ${displayUsername} ${displayUsername} 4096 Apr 16 15:58 .
drwxr-xr-x 18 ${displayUsername} ${displayUsername} 4096 Apr 16 15:58 ..
-rw-r--r--  1 ${displayUsername} ${displayUsername}  220 Apr 16 15:58 .bash_logout
-rw-r--r--  1 ${displayUsername} ${displayUsername} 3771 Apr 16 15:58 .bashrc
-rw-r--r--  1 ${displayUsername} ${displayUsername}  807 Apr 16 15:58 .profile
drwxr-xr-x  2 ${displayUsername} ${displayUsername} 4096 Apr 16 15:58 .config
drwxr-xr-x  2 ${displayUsername} ${displayUsername} 4096 Apr 16 15:58 .local
drwxr-xr-x  2 ${displayUsername} ${displayUsername} 4096 Apr 16 15:58 notes`
          }
        } else {
          output = `Command not found: ${command}. Type 'help' for available commands.`
        }
    }

    setHistory([...history, { command, output }])
    setCommand("")
    
    // Restore scroll position after state update
    requestAnimationFrame(() => {
      window.scrollTo({
        top: scrollPos.top,
        left: scrollPos.left,
        behavior: 'auto'
      });
    });
  }

  useEffect(() => {
    if (!terminalEndRef.current) return;
    const container = terminalEndRef.current.parentElement;
    if (container && container.scrollHeight > container.clientHeight) {
      terminalEndRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, [history]);

  // Focus input on click
  const handleTerminalClick = () => {
    inputRef.current?.focus({ preventScroll: true });
  }

  return (
    <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-md font-medium flex items-center">
          <TerminalIcon className="h-4 w-4 mr-2 text-cyan-400" />
          Terminal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          className="bg-black rounded-md p-3 font-mono text-sm text-green-400 h-[300px] max-h-[300px] overflow-y-auto cursor-text"
          onClick={handleTerminalClick}
        >
          {history.map((item, index) => (
            <div key={index} className="mb-2">
              <div className="flex">
                <span className="text-cyan-400">{displayUsername}@deuss</span>
                <span className="text-white">:</span>
                <span className="text-purple-400">{currentDir}</span>
                <span className="text-white">$ </span>
                <span>{item.command}</span>
              </div>
              <div className="whitespace-pre-wrap text-slate-300">{item.output}</div>
            </div>
          ))}
          <div className="flex">
            <span className="text-cyan-400">{displayUsername}@deuss</span>
            <span className="text-white">:</span>
            <span className="text-purple-400">{currentDir}</span>
            <span className="text-white">$ </span>
            <form onSubmit={handleCommand} className="flex-1">
              <input
                ref={inputRef}
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                className="bg-transparent border-none outline-none w-full text-green-400"
                spellCheck="false"
                autoComplete="off"
              />
            </form>
          </div>
          <div ref={terminalEndRef} />
        </div>
      </CardContent>
    </Card>
  )
} 