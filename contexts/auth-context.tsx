"use client"

import { createContext, useContext, useEffect, useState, useRef } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

type User = {
  id: number
  email: string
  full_name: string
  avatar_url?: string
  tier: string
  is_verified: boolean
  created_at: string
  updated_at: string
  initials: string
}

type AuthContextType = {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Save user data to localStorage for persistence
const saveUserToStorage = (user: User | null, token: string | null) => {
  // Check if we're in a browser environment before accessing localStorage
  if (typeof window === 'undefined') {
    return; // Not in browser, skip storage operations
  }
  
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
    if (token) {
      localStorage.setItem('token', token);
      // Also save to sessionStorage as backup
      sessionStorage.setItem('token', token);
    }
    console.log('User and token saved to storage');
  } else {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    console.log('User and token removed from storage');
  }
};

// Load user from localStorage
const loadUserFromStorage = (): User | null => {
  // Check if we're in a browser environment before accessing localStorage
  if (typeof window === 'undefined') {
    return null; // Not in browser, return null
  }
  
  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      console.log('Found stored user data');
      
      // Validate token format
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (token) {
        console.log(`Stored token length: ${token.length}`);
        if (!token.startsWith('ey')) {
          console.warn('WARNING: Stored token does not appear to be a valid JWT format');
        } else {
          console.log('Token appears to be in valid JWT format');
        }
      } else {
        console.warn('WARNING: User data found but no token available');
      }
      
      return JSON.parse(storedUser);
    }
  } catch (error) {
    console.error('Failed to parse stored user:', error);
    localStorage.removeItem('user');
  }
  return null;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Initialize with stored user data for immediate auth state
  const [user, setUser] = useState<User | null>(() => loadUserFromStorage());
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const sessionCheckTimeout = useRef<NodeJS.Timeout | null>(null);
  // Track if we've checked the session at least once
  const sessionCheckedRef = useRef<boolean>(false);

  // Internal setUser function that also updates storage
  const updateUser = (newUser: User | null, token: string | null = null) => {
    setUser(newUser);
    saveUserToStorage(newUser, token);
  };

  const checkSession = async () => {
    try {
      // Prepare headers with any stored token
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      // Check for token in storage
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log(`Session check - token found: ${token.substring(0, 10)}...`);
        console.log(`Token length: ${token.length}, format: ${token.startsWith('ey') ? 'JWT' : 'Unknown'}`);
      } else {
        console.warn('No authentication token found for session check');
      }
      
      console.log(`Checking session at ${API_URL}/api/auth/session with headers:`, Object.keys(headers));
      const response = await fetch(`${API_URL}/api/auth/session`, {
        method: "GET",
        credentials: "include",
        headers,
        cache: "no-store" // Prevent caching issues
      })

      console.log(`Session check response status: ${response.status}`);

      if (response.ok) {
        const data = await response.json()
        console.log('Session check response:', data);
        
        // Update token if a new one is provided
        if (data.token) {
          localStorage.setItem('token', data.token);
          sessionStorage.setItem('token', data.token);
          console.log("Updated token from session check");
        }
        
        if (data.isValid && data.user) {
          console.log("Valid session found, updating user");
          updateUser(data.user, data.token || token);
          scheduleNextSessionCheck();
        } else {
          console.log("Invalid session, clearing user");
          updateUser(null);
        }
      } else {
        const errorText = await response.text();
        console.error(`Session check failed with status ${response.status}:`, errorText);
        // Only clear user if we've already completed one check
        // This prevents clearing valid cached user data if the server is temporarily down
        if (sessionCheckedRef.current) {
          updateUser(null);
        }
      }
    } catch (error) {
      console.error("Session check failed:", error);
      // Only clear user if we've already completed one check
      if (sessionCheckedRef.current) {
        updateUser(null);
      }
    } finally {
      sessionCheckedRef.current = true;
      setIsLoading(false);
    }
  }

  const scheduleNextSessionCheck = () => {
    if (sessionCheckTimeout.current) {
      clearTimeout(sessionCheckTimeout.current);
    }
    
    sessionCheckTimeout.current = setTimeout(() => {
      checkSession();
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  const login = async (email: string, password: string) => {
    try {
      console.log(`Logging in to ${API_URL}/api/auth/login`);
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      })

      const responseText = await response.text()
      console.log('Login response:', responseText)

      let data
      try {
        data = JSON.parse(responseText)
      } catch (error) {
        console.error('Failed to parse login response:', error)
        throw new Error('Invalid server response')
      }

      if (response.ok && data.user) {
        console.log(`Login successful, sessionStatus: ${data.sessionStatus}`);
        
        // Log token information
        if (data.token) {
          console.log(`Received token: ${data.token.substring(0, 10)}...`);
          console.log(`Token length: ${data.token.length}, format: ${data.token.startsWith('ey') ? 'JWT' : 'Unknown'}`);
        } else {
          console.warn('No token received in login response');
        }
        
        updateUser(data.user, data.token);
        
        scheduleNextSessionCheck();
        toast({
          title: "Success",
          description: "You have been successfully logged in.",
          className: "bg-emerald-800 border-0 text-white",
        })
        router.push("/dashboard")
      } else {
        throw new Error(data.message || "Login failed")
      }
    } catch (error) {
      console.error("Login failed:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Login failed. Please check your credentials and try again.",
        variant: "destructive",
      })
    }
  }

  const logout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token') || ''}`
        }
      })
      
      // Clear user immediately for faster UI update
      updateUser(null);
      
      if (sessionCheckTimeout.current) {
        clearTimeout(sessionCheckTimeout.current);
      }
      
      toast({
        description: "You have been logged out successfully.",
      })
      
      router.push("/auth/login")
    } catch (error) {
      console.error("Logout failed:", error)
      // Still clear local user even if server logout fails
      updateUser(null);
      router.push("/auth/login");
    }
  }

  useEffect(() => {
    console.log("AuthProvider mounted, checking session...");
    // Check session on mount
    checkSession();
    
    // Setup interval for periodic session checks if user is logged in
    const intervalId = setInterval(() => {
      if (user) {
        console.log("Running periodic session check");
        checkSession();
      }
    }, 15 * 60 * 1000); // Check every 15 minutes
    
    return () => {
      // Clean up on unmount
      if (sessionCheckTimeout.current) {
        clearTimeout(sessionCheckTimeout.current);
      }
      clearInterval(intervalId);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        checkSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
} 