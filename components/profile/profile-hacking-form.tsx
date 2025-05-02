"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Check, Link, Loader2, Lock } from "lucide-react"

type HackingProfile = {
  platform: string
  username: string
  apiKey?: string
  connected: boolean
}

export function ProfileHackingForm() {
  const [platforms, setPlatforms] = useState<HackingProfile[]>([
    { platform: "hackthebox", username: "", apiKey: "", connected: false },
    { platform: "tryhackme", username: "", apiKey: undefined, connected: false },
    { platform: "vulnhub", username: "", apiKey: undefined, connected: false },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { isAuthenticated } = useAuth()
  const { toast } = useToast()
  const API_URL = process.env.NEXT_PUBLIC_API_URL

  useEffect(() => {
    const loadHackingProfiles = async () => {
      if (!isAuthenticated) return
      
      setIsLoading(true)
      
      try {
        // Create headers with token authentication
        const headers: Record<string, string> = {
          "Accept": "application/json",
          "Content-Type": "application/json",
        };
        
        // Add authentication token if available
        let token = null;
        if (typeof window !== 'undefined') {
          token = localStorage.getItem('token') || sessionStorage.getItem('token');
          if (token) {
            // Ensure token format is correct
            if (!token.startsWith('ey')) {
              console.warn('WARNING: Token does not appear to be in valid JWT format');
              // Try to resolve by checking session - force a session check
              try {
                await fetch(`${API_URL}/api/auth/session`, {
                  method: 'GET',
                  credentials: 'include',
                  cache: 'no-store'
                });
                console.log('Attempted to refresh session before loading hacking profiles');
                
                // Try getting token again after session refresh
                token = localStorage.getItem('token') || sessionStorage.getItem('token');
                if (token && token.startsWith('ey')) {
                  console.log('Retrieved valid token after session refresh');
                }
              } catch (_) {
                console.error('Failed to refresh session:', e);
              }
            }
            
            headers['Authorization'] = `Bearer ${token}`;
            console.log(`Loading hacking profiles with token: ${token ? token.substring(0, 10) : ''}...`);
          } else {
            console.warn('No authentication token found in storage. Authentication will likely fail.');
          }
        }
        
        console.log(`Loading hacking profiles from: ${API_URL}/api/hacking-profiles with headers:`, Object.keys(headers));
        
        const response = await fetch(`${API_URL}/api/hacking-profiles`, {
          method: 'GET',
          credentials: "include", // Important: includes cookies for session-based auth
          headers,
          cache: 'no-store' // Prevent caching issues
        });
        
        console.log(`Hacking profiles response status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json()
          console.log(`Loaded ${data.profiles?.length || 0} hacking profiles`);
          if (data.profiles && data.profiles.length > 0) {
            // Merge received profiles with existing state to preserve local changes
            const updatedProfiles = [...platforms];
            
            data.profiles.forEach((profile: HackingProfile) => {
              const index = updatedProfiles.findIndex(p => p.platform === profile.platform);
              if (index !== -1) {
                updatedProfiles[index] = {
                  ...updatedProfiles[index],
                  ...profile,
                  // Preserve local username/apiKey if connected is false (not yet submitted)
                  username: profile.connected ? profile.username : updatedProfiles[index].username || profile.username,
                  apiKey: profile.connected ? profile.apiKey : updatedProfiles[index].apiKey || profile.apiKey
                };
              }
            });
            
            setPlatforms(updatedProfiles);
          }
        } else {
          // Handle error gracefully
          const errorText = await response.text();
          console.error(`Failed to load hacking profiles: ${response.status}`, errorText);
          
          // If unauthorized, try to refresh the session and retry once
          if (response.status === 401) {
            console.log('Authentication error - attempting to refresh session and retry');
            try {
              // Force a session check to refresh authentication
              const sessionResponse = await fetch(`${API_URL}/api/auth/session`, {
                method: 'GET',
                credentials: 'include',
                cache: 'no-store'
              });
              
              if (sessionResponse.ok) {
                console.log('Session refreshed successfully, retrying profile load');
                
                // Get updated token
                const updatedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
                if (updatedToken) {
                  headers['Authorization'] = `Bearer ${updatedToken}`;
                  
                  // Retry the request with new token
                  const retryResponse = await fetch(`${API_URL}/api/hacking-profiles`, {
                    method: 'GET',
                    credentials: "include",
                    headers,
                    cache: 'no-store'
                  });
                  
                  console.log(`Retry response status: ${retryResponse.status}`);
                  
                  if (retryResponse.ok) {
                    const retryData = await retryResponse.json();
                    console.log(`Retry successful, loaded ${retryData.profiles?.length || 0} profiles`);
                    
                    if (retryData.profiles && retryData.profiles.length > 0) {
                      // Merge received profiles with existing state to preserve local changes
                      const updatedProfiles = [...platforms];
                      
                      retryData.profiles.forEach((profile: HackingProfile) => {
                        const index = updatedProfiles.findIndex(p => p.platform === profile.platform);
                        if (index !== -1) {
                          updatedProfiles[index] = {
                            ...updatedProfiles[index],
                            ...profile,
                            // Preserve local username/apiKey if connected is false (not yet submitted)
                            username: profile.connected ? profile.username : updatedProfiles[index].username || profile.username,
                            apiKey: profile.connected ? profile.apiKey : updatedProfiles[index].apiKey || profile.apiKey
                          };
                        }
                      });
                      
                      setPlatforms(updatedProfiles);
                      return; // Exit early as we've handled the retry
                    }
                  } else {
                    const retryErrorText = await retryResponse.text();
                    console.error(`Retry also failed: ${retryResponse.status}`, retryErrorText);
                  }
                }
              }
            } catch (retryError) {
              console.error('Error during authentication retry:', retryError);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load hacking profiles:", error)
        // Only show toast for network errors, not for API errors
        if (error instanceof Error && error.message.includes('fetch')) {
        toast({
            title: "Network Error",
            description: "Failed to connect to the server. Please check your connection.",
          variant: "destructive",
        })
        }
      } finally {
        setIsLoading(false)
      }
    }
    
    loadHackingProfiles()
  }, [isAuthenticated, API_URL, toast])

  const handleInputChange = (platform: string, field: string, value: string) => {
    setPlatforms(prevPlatforms => 
      prevPlatforms.map((p) => {
        if (p.platform === platform) {
          return { ...p, [field]: value }
        }
        return p
      })
    )
  }

  const getPlatformLabel = (platform: string) => {
    switch (platform) {
      case "hackthebox":
        return "HackTheBox"
      case "tryhackme":
        return "TryHackMe"
      case "vulnhub":
        return "VulnHub"
      default:
        return platform
    }
  }

  const handleConnect = async (platform: string) => {
    const platformData = platforms.find((p) => p.platform === platform)
    if (!platformData || !platformData.username) {
      toast({
        title: "Error",
        description: "Please enter a username",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    
    try {
      // Create headers with token authentication
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      // Add authentication token if available
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
          console.log(`Token found: ${token.substring(0, 10)}...`);
        } else {
          console.warn('No authentication token found in localStorage or sessionStorage');
        }
      }
      
      console.log(`Connecting to ${platform} platform with headers:`, Object.keys(headers));
      console.log(`API URL: ${API_URL}/api/connect-platform`);
      
      // Create request body based on platform
      const requestBody: any = {
        platform,
        username: platformData.username,
      };
      
      // Only include API key for platforms that need it (not TryHackMe)
      if (platform !== 'tryhackme' && platformData.apiKey) {
        requestBody.apiKey = platformData.apiKey;
      }
      
      console.log(`Sending request for ${platform} with username: ${platformData.username}, API key required: ${platform !== 'tryhackme'}`);
      
      const response = await fetch(`${API_URL}/api/connect-platform`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify(requestBody),
      })
      
      // Get response text regardless of status code
      const responseText = await response.text();
      let responseData;
      
      // Try to parse as JSON, but don't fail if it's not valid JSON
      try {
        responseData = JSON.parse(responseText);
      } catch (_) {
        console.warn('Response was not valid JSON:', responseText);
        responseData = { message: 'Received invalid response from server' };
      }
      
      if (response.ok) {
        // Update platform status
        setPlatforms(
          platforms.map((p) => {
            if (p.platform === platform) {
              return { ...p, connected: true }
            }
            return p
          })
        )
        
        toast({
          description: `Connected to ${getPlatformLabel(platform)}`,
          className: "bg-emerald-800 border-0 text-white",
          icon: <Check className="h-4 w-4" />,
        })
      } else {
        const errorMessage = responseData?.message || `Failed to connect to ${getPlatformLabel(platform)} (${response.status})`;
        console.error(`Error response: ${response.status}`, errorMessage);
        
        // Don't throw, just show the toast with the error message
        toast({
          title: "Connection Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(`Error connecting ${platform}:`, error);
      
      toast({
        title: "Connection Error",
        description: error instanceof Error ? error.message : `Failed to connect to ${getPlatformLabel(platform)}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  const handleDisconnect = async (platform: string) => {
    setIsSaving(true)
    
    try {
      // Create headers with token authentication
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      // Add authentication token if available
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }
      
      console.log(`Disconnecting from ${platform} platform...`);
      
      const response = await fetch(`${API_URL}/api/disconnect-platform`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          platform,
        }),
      })
      
      // Get response text regardless of status code
      const responseText = await response.text();
      let responseData;
      
      // Try to parse as JSON, but don't fail if it's not valid JSON
      try {
        responseData = JSON.parse(responseText);
      } catch (_) {
        console.warn('Response was not valid JSON:', responseText);
        responseData = { message: 'Received invalid response from server' };
      }
      
      if (response.ok) {
        // Update platform status
        setPlatforms(
          platforms.map((p) => {
            if (p.platform === platform) {
              return { ...p, connected: false }
            }
            return p
          })
        )
        
        toast({
          description: `Disconnected from ${getPlatformLabel(platform)}`,
          className: "bg-emerald-800 border-0 text-white",
          icon: <Check className="h-4 w-4" />,
        })
      } else {
        const errorMessage = responseData?.message || `Failed to disconnect from ${getPlatformLabel(platform)} (${response.status})`;
        console.error(`Error response: ${response.status}`, errorMessage);
        
        // Don't throw, just show the toast with the error message
        toast({
          title: "Disconnection Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(`Error disconnecting ${platform}:`, error);
      
      toast({
        title: "Disconnection Error",
        description: error instanceof Error ? error.message : `Failed to disconnect from ${getPlatformLabel(platform)}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hacking Profiles</CardTitle>
          <CardDescription>Connect your hacking platform accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Please sign in to connect your hacking platform accounts.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hacking Profiles</CardTitle>
        <CardDescription>Connect your hacking platform accounts</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
          </div>
        ) : (
          <div className="space-y-4">
            {platforms.map((platform) => (
              <div key={platform.platform} className="space-y-2">
                <Label htmlFor={`${platform.platform}-username`}>
                  {getPlatformLabel(platform.platform)}
                  {platform.platform === "tryhackme" && (
                    <span className="ml-2 text-xs text-slate-500">
                      (Only username required)
                    </span>
                  )}
                  {(platform.platform === "hackthebox" || platform.platform === "vulnhub") && (
                    <span className="ml-2 text-xs text-amber-500 font-semibold">
                      (Coming Soon)
                    </span>
                  )}
                </Label>
                <div className="flex space-x-2">
                  <Input
                    id={`${platform.platform}-username`}
                    placeholder={`Enter your ${getPlatformLabel(platform.platform)} username`}
                    value={platform.username}
                    onChange={(e) => handleInputChange(platform.platform, "username", e.target.value)}
                    disabled={platform.connected || isSaving || platform.platform === "hackthebox" || platform.platform === "vulnhub"}
                  />
                  {platform.platform === "hackthebox" && (
                    <Input
                      id={`${platform.platform}-apikey`}
                      placeholder="API Key (required)"
                      value={platform.apiKey || ""}
                      onChange={(e) => handleInputChange(platform.platform, "apiKey", e.target.value)}
                      disabled={platform.connected || isSaving || true}
                    />
                  )}
                  <Button
                    onClick={() => platform.connected ? handleDisconnect(platform.platform) : handleConnect(platform.platform)}
                    disabled={isSaving || (!platform.connected && !platform.username) || platform.platform === "hackthebox" || platform.platform === "vulnhub"}
                    className={platform.connected ? "bg-red-500 hover:bg-red-600" : ""}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : platform.connected ? (
                      "Disconnect"
                    ) : platform.platform === "hackthebox" || platform.platform === "vulnhub" ? (
                      <><Lock className="h-4 w-4 mr-2" />Coming Soon</>
                    ) : (
                      "Connect"
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 