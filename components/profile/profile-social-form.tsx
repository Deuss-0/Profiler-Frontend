"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Check, Github, Loader2, Twitter, Linkedin, Youtube, Key } from "lucide-react"

type SocialProfile = {
  platform: string
  username: string
  url: string
  connected: boolean
  apiKey?: string
}

export function _ProfileSocialForm() {
  const [platforms, setPlatforms] = useState<SocialProfile[]>([
    { platform: "github", username: "", url: "https://github.com/", connected: false },
    { platform: "twitter", username: "", url: "https://twitter.com/", connected: false, apiKey: "" },
    { platform: "linkedin", username: "", url: "https://linkedin.com/in/", connected: false, apiKey: "" },
    { platform: "youtube", username: "", url: "https://youtube.com/@", connected: false, apiKey: "" },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { isAuthenticated } = useAuth()
  const { toast } = useToast()
  const API_URL = process.env.NEXT_PUBLIC_API_URL

  useEffect(() => {
    const loadSocialProfiles = async () => {
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
                console.log('Attempted to refresh session before loading profiles');
                
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
            console.log(`Loading profiles with token: ${token ? token.substring(0, 10) : ''}...`);
          } else {
            console.warn('No authentication token found in storage. Authentication will likely fail.');
          }
        }
        
        console.log(`Loading social profiles from: ${API_URL}/api/social-profiles with headers:`, Object.keys(headers));
        
        const response = await fetch(`${API_URL}/api/social-profiles`, {
          method: 'GET',
          credentials: "include", // Important: includes cookies for session-based auth
          headers,
          cache: 'no-store' // Prevent caching issues
        });
        
        console.log(`Social profiles response status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json()
          console.log(`Loaded ${data.profiles?.length || 0} social profiles`);
          console.log("Profile data from server:", data.profiles);
          if (data.profiles && data.profiles.length > 0) {
            // Merge received profiles with existing state to preserve local changes
            const updatedProfiles = [...platforms];
            
            data.profiles.forEach((profile: SocialProfile) => {
              const index = updatedProfiles.findIndex(p => p.platform === profile.platform);
              if (index !== -1) {
                console.log(`Processing profile ${profile.platform}, has API key: ${!!profile.apiKey}`);
                
                updatedProfiles[index] = {
                  ...updatedProfiles[index],
                  ...profile,
                  // Preserve local username if connected is false (not yet submitted)
                  username: profile.connected ? profile.username : updatedProfiles[index].username || profile.username,
                  // Keep API key if it exists
                  apiKey: profile.apiKey || updatedProfiles[index].apiKey
                };
              }
            });
            
            setPlatforms(updatedProfiles);
          }
        } else {
          // Handle error gracefully
          const errorText = await response.text();
          console.error(`Failed to load social profiles: ${response.status}`, errorText);
          
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
                  const retryResponse = await fetch(`${API_URL}/api/social-profiles`, {
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
                      const updatedProfiles = [...platforms];
                      
                      retryData.profiles.forEach((profile: SocialProfile) => {
                        const index = updatedProfiles.findIndex(p => p.platform === profile.platform);
                        if (index !== -1) {
                          updatedProfiles[index] = {
                            ...updatedProfiles[index],
                            ...profile,
                            username: profile.connected ? profile.username : updatedProfiles[index].username || profile.username
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
        console.error("Failed to load social profiles:", error)
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
    
    loadSocialProfiles()
  }, [isAuthenticated, API_URL, toast])

  const handleInputChange = (platform: string, value: string, field: 'username' | 'apiKey' = 'username') => {
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
      case "github":
        return "GitHub"
      case "twitter":
        return "Twitter"
      case "linkedin":
        return "LinkedIn"
      case "youtube":
        return "YouTube"
      default:
        return platform
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "github":
        return <Github className="h-5 w-5" />
      case "twitter":
        return <Twitter className="h-5 w-5" />
      case "linkedin":
        return <Linkedin className="h-5 w-5" />
      case "youtube":
        return <Youtube className="h-5 w-5" />
      default:
        return null
    }
  }

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "github":
        return "text-white"
      case "twitter":
        return "text-cyan-400"
      case "linkedin":
        return "text-blue-500"
      case "youtube":
        return "text-red-500"
      default:
        return "text-white"
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

    // API key validation for platforms that require it
    if (platform === "youtube" && !platformData.apiKey) {
      toast({
        title: "Error",
        description: "Please enter a YouTube API key",
        variant: "destructive",
      })
      return
    }
    
    // Twitter API key validation
    if (platform === "twitter" && !platformData.apiKey) {
      toast({
        title: "Error",
        description: "Please enter a Twitter API bearer token",
        variant: "destructive",
      })
      return
    }
    
    // LinkedIn API key validation
    if (platform === "linkedin" && !platformData.apiKey) {
      toast({
        title: "Error",
        description: "Please enter a LinkedIn OAuth 2.0 access token",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    
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
            console.warn('Token format appears invalid, not a JWT');
          }
          headers['Authorization'] = `Bearer ${token}`;
          console.log(`Connect social - token: ${token.substring(0, 10)}...`);
        } else {
          console.warn('No authentication token found in localStorage or sessionStorage');
        }
      }

      console.log(`Connecting to ${platform} platform with headers:`, Object.keys(headers));
      console.log(`API URL: ${API_URL}/api/connect-social`);

      // Create request body based on platform
      const requestBody: Record<string, string> = {
        platform,
        username: platformData.username
      };
      
      // Add API key for platforms that need it
      if ((platform === "youtube" || platform === "twitter" || platform === "linkedin") && platformData.apiKey) {
        requestBody.apiKey = platformData.apiKey;
        console.log(`Including ${platform} API key in request: ${platformData.apiKey.substring(0, 5)}...`);
      }

      console.log(`Connecting profile with request body:`, requestBody);

      const response = await fetch(`${API_URL}/api/connect-social`, {
        method: "POST",
        headers,
        credentials: "include", // Important - includes cookies for session auth
        body: JSON.stringify(requestBody),
      });
      
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
        setPlatforms(prevPlatforms =>
          prevPlatforms.map((p) => {
            if (p.platform === platform) {
              return { ...p, connected: true }
            }
            return p
          })
        )
        
        console.log(`Successfully connected ${platform} profile. Response data:`, responseData);
        
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
      console.error(`Error connecting ${platform}:`, error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to connect to ${getPlatformLabel(platform)}. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDisconnect = async (platform: string) => {
    setIsSaving(true)
    
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
            console.warn('Token format appears invalid, not a JWT');
          }
          headers['Authorization'] = `Bearer ${token}`;
          console.log(`Disconnect social - token: ${token.substring(0, 10)}...`);
        } else {
          console.warn('No authentication token found in localStorage or sessionStorage');
        }
      }

      console.log(`Disconnecting from ${platform} platform with headers:`, Object.keys(headers));
      console.log(`API URL: ${API_URL}/api/disconnect-social`);

      const response = await fetch(`${API_URL}/api/disconnect-social`, {
        method: "POST",
        headers,
        credentials: "include", // Important - includes cookies for session auth
        body: JSON.stringify({
          platform,
        }),
      });
      
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
        setPlatforms(prevPlatforms =>
          prevPlatforms.map((p) => {
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
      console.error(`Error disconnecting ${platform}:`, error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to disconnect from ${getPlatformLabel(platform)}. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Social Profiles</CardTitle>
          <CardDescription>Connect your social media accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Please sign in to connect your social media accounts.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Social Profiles</CardTitle>
        <CardDescription>Connect your social media accounts</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
          </div>
        ) : (
          <div className="space-y-4">
            {platforms.map((profile) => (
              <div key={profile.platform} className="space-y-2">
                <Label htmlFor={`${profile.platform}-username`}>
                  <div className="flex items-center space-x-2">
                    <span className={getPlatformColor(profile.platform)}>
                      {getPlatformIcon(profile.platform)}
                    </span>
                    <span>{getPlatformLabel(profile.platform)}</span>
                  </div>
                </Label>
                <div className="flex space-x-2">
                  <Input
                    id={`${profile.platform}-username`}
                    placeholder={`Enter your ${getPlatformLabel(profile.platform)} username`}
                    value={profile.username}
                    onChange={(e) => handleInputChange(profile.platform, e.target.value)}
                    disabled={profile.connected || isSaving}
                  />
                  <Button
                    onClick={() => profile.connected ? handleDisconnect(profile.platform) : handleConnect(profile.platform)}
                    disabled={isSaving || (!profile.connected && !profile.username) || 
                             ((profile.platform === "youtube" || profile.platform === "twitter" || profile.platform === "linkedin") && 
                              !profile.connected && !profile.apiKey)}
                    className={profile.connected ? "bg-red-500 hover:bg-red-600" : ""}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : profile.connected ? (
                      "Disconnect"
                    ) : (
                      "Connect"
                    )}
                  </Button>
                </div>
                
                {/* Twitter API Key Input */}
                {profile.platform === "twitter" && !profile.connected && (
                  <div className="mt-2">
                    <Label htmlFor={`${profile.platform}-username`} className="flex items-center space-x-2 text-sm text-slate-500">
                      <Twitter className="h-3 w-3" />
                      <span>Twitter Username</span>
                    </Label>
                    <Input
                      id={`${profile.platform}-username`}
                      placeholder="Enter your Twitter username (with or without @)"
                      value={profile.username}
                      onChange={(e) => handleInputChange(profile.platform, e.target.value)}
                      disabled={profile.connected || isSaving}
                      className="mt-1"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      You can enter your username with or without the @ symbol
                    </p>
                    
                    <Label htmlFor={`${profile.platform}-apikey`} className="flex items-center space-x-2 text-sm text-slate-500 mt-4">
                      <Key className="h-3 w-3" />
                      <span>Twitter API Bearer Token (required)</span>
                    </Label>
                    <Input
                      id={`${profile.platform}-apikey`}
                      placeholder="Enter your Twitter API bearer token"
                      value={profile.apiKey || ""}
                      onChange={(e) => handleInputChange(profile.platform, e.target.value, 'apiKey')}
                      disabled={profile.connected || isSaving}
                      className="mt-1"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Get your bearer token from the <a href="https://developer.twitter.com/en/portal/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Twitter Developer Portal</a>
                    </p>
                  </div>
                )}
                
                {/* YouTube API Key Input */}
                {profile.platform === "youtube" && !profile.connected && (
                  <div className="mt-2">
                    <Label htmlFor={`${profile.platform}-username`} className="flex items-center space-x-2 text-sm text-slate-500">
                      <Youtube className="h-3 w-3" />
                      <span>YouTube Channel ID or Username</span>
                    </Label>
                    <Input
                      id={`${profile.platform}-username`}
                      placeholder="Enter your YouTube channel ID, username or @handle"
                      value={profile.username}
                      onChange={(e) => handleInputChange(profile.platform, e.target.value)}
                      disabled={profile.connected || isSaving}
                      className="mt-1"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      You can enter: your channel ID (starts with UC...), channel username, or handle (with or without @)
                    </p>
                    
                    <Label htmlFor={`${profile.platform}-apikey`} className="flex items-center space-x-2 text-sm text-slate-500 mt-4">
                      <Key className="h-3 w-3" />
                      <span>YouTube API Key (required)</span>
                    </Label>
                    <Input
                      id={`${profile.platform}-apikey`}
                      placeholder="Enter your YouTube API key"
                      value={profile.apiKey || ""}
                      onChange={(e) => handleInputChange(profile.platform, e.target.value, 'apiKey')}
                      disabled={profile.connected || isSaving}
                      className="mt-1"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Get your API key from the <a href="https://console.developers.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Google Developer Console</a>
                    </p>
                  </div>
                )}
                
                {/* LinkedIn OAuth Token Input */}
                {profile.platform === "linkedin" && !profile.connected && (
                  <div className="mt-2">
                    <Label htmlFor={`${profile.platform}-username`} className="flex items-center space-x-2 text-sm text-slate-500">
                      <Linkedin className="h-3 w-3" />
                      <span>LinkedIn Username</span>
                    </Label>
                    <Input
                      id={`${profile.platform}-username`}
                      placeholder="Enter your LinkedIn username (from linkedin.com/in/username)"
                      value={profile.username}
                      onChange={(e) => handleInputChange(profile.platform, e.target.value)}
                      disabled={profile.connected || isSaving}
                      className="mt-1"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Enter your LinkedIn username as it appears in your profile URL: linkedin.com/in/username
                    </p>
                    
                    <Label htmlFor={`${profile.platform}-apikey`} className="flex items-center space-x-2 text-sm text-slate-500 mt-4">
                      <Key className="h-3 w-3" />
                      <span>LinkedIn OAuth 2.0 Access Token (required)</span>
                    </Label>
                    <Input
                      id={`${profile.platform}-apikey`}
                      placeholder="Enter your LinkedIn OAuth 2.0 access token"
                      value={profile.apiKey || ""}
                      onChange={(e) => handleInputChange(profile.platform, e.target.value, 'apiKey')}
                      disabled={profile.connected || isSaving}
                      className="mt-1"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Get your access token from the <a href="https://www.linkedin.com/developers/apps/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">LinkedIn Developer Portal</a>. Token must have r_liteprofile or r_basicprofile permission.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 