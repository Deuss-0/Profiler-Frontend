"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ExternalLink, Youtube, Instagram, Linkedin, Twitter, Github, GitBranch, Star, GitFork, GitCommit, Play, ThumbsUp, Clock, Eye } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"

type SocialProfile = {
  username: string
  displayName: string
  followers: number
  following: number
  posts: number
  profileImage: string
  bio: string
  url: string
  recentActivity?: GitHubEvent[] | YouTubeVideo[]
  apiKey?: string
}

type GitHubEvent = {
  id: string
  type: string
  repo: string
  createdAt: string
  action?: string
  description: string
}

type YouTubeVideo = {
  id: string
  title: string
  publishedAt: string
  thumbnail: string
  viewCount: string
  likeCount: string
  duration: string
}

type GithubData = {
  followers: number
  following: number
  public_repos: number
  bio: string | null
  avatar_url: string
}

type YouTubeData = {
  subscribers: number
  videoCount: number
  viewCount: number
  description: string | null
  thumbnail: string
  channelTitle: string
}

export function SocialProfiles() {
  const [profiles, setProfiles] = useState<Record<string, SocialProfile>>({})
  const [loading, setLoading] = useState(true)
  const { isAuthenticated } = useAuth()
  const { toast } = useToast()
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sigh-ai.com'
  const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY

  // Add function to fetch GitHub profile data
  const fetchGithubProfileData = async (username: string): Promise<GithubData | null> => {
    try {
      console.log(`Fetching GitHub data for ${username}`);
      const response = await fetch(`https://api.github.com/users/${username}`, {
        headers: {
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });
      
      if (!response.ok) {
        console.error(`GitHub API error: ${response.status}`);
        return null;
      }
      
      const data = await response.json();
      return {
        followers: data.followers || 0,
        following: data.following || 0,
        public_repos: data.public_repos || 0,
        bio: data.bio || null,
        avatar_url: data.avatar_url || '/placeholder.svg?height=80&width=80'
      };
    } catch (error) {
      console.error("Error fetching GitHub profile:", error);
      return null;
    }
  };

  // Add function to fetch GitHub events
  const fetchGithubEvents = async (username: string): Promise<GitHubEvent[]> => {
    try {
      console.log(`Fetching GitHub events for ${username}`);
      const response = await fetch(`https://api.github.com/users/${username}/events/public`, {
        headers: {
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });
      
      if (!response.ok) {
        console.error(`GitHub Events API error: ${response.status}`);
        return [];
      }
      
      const data = await response.json();
      return data.slice(0, 5).map((event: any) => {
        let description = '';
        
        switch (event.type) {
          case 'PushEvent':
            description = `Pushed ${event.payload.commits?.length || 0} commit(s) to ${event.repo.name}`;
            break;
          case 'CreateEvent':
            description = `Created ${event.payload.ref_type} ${event.payload.ref || ''} in ${event.repo.name}`;
            break;
          case 'PullRequestEvent':
            description = `${event.payload.action} pull request in ${event.repo.name}`;
            break;
          case 'IssuesEvent':
            description = `${event.payload.action} issue in ${event.repo.name}`;
            break;
          case 'WatchEvent':
            description = `Starred ${event.repo.name}`;
            break;
          case 'ForkEvent':
            description = `Forked ${event.repo.name}`;
            break;
          default:
            description = `${event.type.replace('Event', '')} on ${event.repo.name}`;
        }
        
        return {
          id: event.id,
          type: event.type,
          repo: event.repo.name,
          createdAt: event.created_at,
          action: event.payload?.action,
          description
        };
      });
    } catch (error) {
      console.error("Error fetching GitHub events:", error);
      return [];
    }
  };

  // Update the YouTube channel data fetching to be more robust
  const fetchYouTubeChannelData = async (username: string, apiKey?: string): Promise<YouTubeData | null> => {
    try {
      console.log(`Fetching YouTube data for ${username}`);
      
      // Use provided API key or fall back to environment variable
      const youtubeApiKey = apiKey || YOUTUBE_API_KEY;
      
      if (!youtubeApiKey) {
        console.error("YouTube API key is missing. Please provide it when connecting your YouTube profile.");
        return null;
      }

      console.log(`Using API key for YouTube channel data: ${youtubeApiKey.substring(0, 5)}...`);
      
      // Clean up the username if it contains @ or URLs
      let cleanUsername = username.trim();
      if (cleanUsername.startsWith('@')) {
        cleanUsername = cleanUsername.substring(1);
      }
      // Remove youtube.com URL parts if present
      cleanUsername = cleanUsername.replace(/https?:\/\/(www\.)?youtube\.com\/(channel\/|user\/|c\/|@)?/g, '');
      
      console.log(`Looking up YouTube channel with cleaned username: ${cleanUsername}`);
      
      // Try multiple methods to find the channel
      
      // 1. Try direct channel lookup if it looks like a channel ID
      if (cleanUsername.startsWith('UC') && cleanUsername.length > 20) {
        console.log("Input looks like a channel ID, trying direct lookup");
        const channelResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${cleanUsername}&key=${youtubeApiKey}`
        );
        
        if (channelResponse.ok) {
          const channelData = await channelResponse.json();
          if (channelData.items && channelData.items.length > 0) {
            const channel = channelData.items[0];
            const logChannelData = (channel: any) => {
              console.log(`YouTube channel found:
Title: ${channel.snippet.title}
ID: ${channel.id}
Subscribers: ${channel.statistics.subscriberCount || '0'}
Videos: ${channel.statistics.videoCount || '0'}
Thumbnail URL: ${channel.snippet.thumbnails?.medium?.url || 'none'}`);
            };
            logChannelData(channel);
            return {
              subscribers: parseInt(channel.statistics.subscriberCount || '0'),
              videoCount: parseInt(channel.statistics.videoCount || '0'),
              viewCount: parseInt(channel.statistics.viewCount || '0'),
              description: channel.snippet.description || null,
              thumbnail: channel.snippet.thumbnails.medium.url || '/placeholder.svg?height=80&width=80',
              channelTitle: channel.snippet.title || 'YouTube Channel'
            };
          } else {
            console.log("No channel found with provided ID, moving to next lookup method");
          }
        }
      }
      
      // 2. Try by username (legacy format)
      console.log("Trying lookup by username");
      const usernameResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forUsername=${cleanUsername}&key=${youtubeApiKey}`
      );
      
      if (usernameResponse.ok) {
        const usernameData = await usernameResponse.json();
        if (usernameData.items && usernameData.items.length > 0) {
          const channel = usernameData.items[0];
          const logChannelData = (channel: any) => {
            console.log(`YouTube channel found:
Title: ${channel.snippet.title}
ID: ${channel.id}
Subscribers: ${channel.statistics.subscriberCount || '0'}
Videos: ${channel.statistics.videoCount || '0'}
Thumbnail URL: ${channel.snippet.thumbnails?.medium?.url || 'none'}`);
          };
          logChannelData(channel);
          return {
            subscribers: parseInt(channel.statistics.subscriberCount || '0'),
            videoCount: parseInt(channel.statistics.videoCount || '0'),
            viewCount: parseInt(channel.statistics.viewCount || '0'),
            description: channel.snippet.description || null,
            thumbnail: channel.snippet.thumbnails.medium.url || '/placeholder.svg?height=80&width=80',
            channelTitle: channel.snippet.title || 'YouTube Channel'
          };
        }
      }
      
      // 3. Try search as a last resort - use exact match search first
      console.log("Username not found, trying search with exact channel name");
      
      // Try to find an exact channel match first
      const exactSearchResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q="@${cleanUsername}"&type=channel&maxResults=1&key=${youtubeApiKey}`
      );
      
      if (exactSearchResponse.ok) {
        const exactSearchData = await exactSearchResponse.json();
        if (exactSearchData.items && exactSearchData.items.length > 0) {
          // Get full channel data using the channel ID
          const channelId = exactSearchData.items[0].id.channelId;
          const channelResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${youtubeApiKey}`
          );
          
          if (channelResponse.ok) {
            const channelData = await channelResponse.json();
            if (channelData.items && channelData.items.length > 0) {
              const channel = channelData.items[0];
              const logChannelData = (channel: any) => {
                console.log(`YouTube channel found:
Title: ${channel.snippet.title}
ID: ${channel.id}
Subscribers: ${channel.statistics.subscriberCount || '0'}
Videos: ${channel.statistics.videoCount || '0'}
Thumbnail URL: ${channel.snippet.thumbnails?.medium?.url || 'none'}`);
              };
              logChannelData(channel);
              return {
                subscribers: parseInt(channel.statistics.subscriberCount || '0'),
                videoCount: parseInt(channel.statistics.videoCount || '0'),
                viewCount: parseInt(channel.statistics.viewCount || '0'),
                description: channel.snippet.description || null,
                thumbnail: channel.snippet.thumbnails.medium.url || '/placeholder.svg?height=80&width=80',
                channelTitle: channel.snippet.title || 'YouTube Channel'
              };
            }
          }
        }
      }
      
      // 4. Fallback to regular search
      console.log("Exact match not found, trying fuzzy search");
      const fuzzySearchResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${cleanUsername}&type=channel&maxResults=1&key=${youtubeApiKey}`
      );
      
      if (fuzzySearchResponse.ok) {
        const fuzzySearchData = await fuzzySearchResponse.json();
        if (!fuzzySearchData.items || fuzzySearchData.items.length === 0) {
          console.error("No YouTube channel found after multiple attempts");
          return null;
        }
        
        // Get full channel data using the channel ID
        const channelId = fuzzySearchData.items[0].id.channelId;
        console.log(`Found channel by search: ${fuzzySearchData.items[0].snippet.title} (${channelId})`);
        
        const channelResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${youtubeApiKey}`
        );
        
        if (!channelResponse.ok) {
          console.error(`YouTube API error: ${channelResponse.status}`);
          return null;
        }
        
        const channelData = await channelResponse.json();
        if (!channelData.items || channelData.items.length === 0) {
          return null;
        }
        
        const channel = channelData.items[0];
        const logChannelData = (channel: any) => {
          console.log(`YouTube channel found:
Title: ${channel.snippet.title}
ID: ${channel.id}
Subscribers: ${channel.statistics.subscriberCount || '0'}
Videos: ${channel.statistics.videoCount || '0'}
Thumbnail URL: ${channel.snippet.thumbnails?.medium?.url || 'none'}`);
        };
        logChannelData(channel);
        return {
          subscribers: parseInt(channel.statistics.subscriberCount || '0'),
          videoCount: parseInt(channel.statistics.videoCount || '0'),
          viewCount: parseInt(channel.statistics.viewCount || '0'),
          description: channel.snippet.description || null,
          thumbnail: channel.snippet.thumbnails.medium.url || '/placeholder.svg?height=80&width=80',
          channelTitle: channel.snippet.title || 'YouTube Channel'
        };
      } else {
        console.error(`YouTube Search API error: ${fuzzySearchResponse.status}`);
        return null;
      }
    } catch (error) {
      console.error("Error fetching YouTube channel data:", error);
      return null;
    }
  };

  // Update the YouTube videos fetch function to handle different username formats
  const fetchYouTubeVideos = async (username: string, apiKey?: string): Promise<YouTubeVideo[]> => {
    try {
      console.log(`Fetching YouTube videos for ${username}`);
      
      // Use provided API key or fall back to environment variable
      const youtubeApiKey = apiKey || YOUTUBE_API_KEY;
      
      if (!youtubeApiKey) {
        console.error("YouTube API key is missing. Please provide it when connecting your YouTube profile.");
        return [];
      }
      
      // Clean up the username if it contains @ or URLs
      let cleanUsername = username.trim();
      if (cleanUsername.startsWith('@')) {
        cleanUsername = cleanUsername.substring(1);
      }
      // Remove youtube.com URL parts if present
      cleanUsername = cleanUsername.replace(/https?:\/\/(www\.)?youtube\.com\/(channel\/|user\/|c\/|@)?/g, '');
      
      let channelId = null;
      
      // 1. If it looks like a channel ID, use it directly
      if (cleanUsername.startsWith('UC') && cleanUsername.length > 20) {
        channelId = cleanUsername;
      } else {
        // 2. Try by username (legacy format)
        const usernameResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=snippet&forUsername=${cleanUsername}&key=${youtubeApiKey}`
        );
        
        if (usernameResponse.ok) {
          const usernameData = await usernameResponse.json();
          if (usernameData.items && usernameData.items.length > 0) {
            channelId = usernameData.items[0].id;
          }
        }
        
        // 3. If no channel found by username, try search
        if (!channelId) {
          // Try exact match first
          const exactSearchResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&q="@${cleanUsername}"&type=channel&maxResults=1&key=${youtubeApiKey}`
          );
          
          if (exactSearchResponse.ok) {
            const exactSearchData = await exactSearchResponse.json();
            if (exactSearchData.items && exactSearchData.items.length > 0) {
              channelId = exactSearchData.items[0].id.channelId;
            }
          }
          
          // 4. Try fuzzy search if exact match fails
          if (!channelId) {
            const fuzzySearchResponse = await fetch(
              `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${cleanUsername}&type=channel&maxResults=1&key=${youtubeApiKey}`
            );
            
            if (fuzzySearchResponse.ok) {
              const fuzzySearchData = await fuzzySearchResponse.json();
              if (fuzzySearchData.items && fuzzySearchData.items.length > 0) {
                channelId = fuzzySearchData.items[0].id.channelId;
              }
            }
          }
        }
      }
      
      if (!channelId) {
        console.error("Could not find channel ID for the provided username");
        return [];
      }
      
      // Now get the recent videos from the channel
      const videosResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=5&order=date&type=video&key=${youtubeApiKey}`
      );
      
      if (!videosResponse.ok) {
        console.error(`YouTube Videos API error: ${videosResponse.status}`);
        return [];
      }
      
      const videosData = await videosResponse.json();
      if (!videosData.items || videosData.items.length === 0) {
        return [];
      }
      
      // Get additional video details including statistics
      const videoIds = videosData.items.map((item: any) => item.id.videoId).join(',');
      const videoDetailsResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${youtubeApiKey}`
      );
      
      if (!videoDetailsResponse.ok) {
        console.error(`YouTube Video Details API error: ${videoDetailsResponse.status}`);
        return [];
      }
      
      const videoDetailsData = await videoDetailsResponse.json();
      
      // Format the video data
      return videoDetailsData.items.map((video: any) => ({
        id: video.id,
        title: video.snippet.title,
        publishedAt: video.snippet.publishedAt,
        thumbnail: video.snippet.thumbnails.medium.url,
        viewCount: video.statistics.viewCount || '0',
        likeCount: video.statistics.likeCount || '0',
        duration: formatDuration(video.contentDetails.duration)
      }));
    } catch (error) {
      console.error("Error fetching YouTube videos:", error);
      return [];
    }
  };
  
  // Helper function to format ISO 8601 duration to readable format
  const formatDuration = (isoDuration: string): string => {
    const match = isoDuration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    
    if (!match) return "0:00";
    
    const hours = match[1] ? parseInt(match[1].slice(0, -1)) : 0;
    const minutes = match[2] ? parseInt(match[2].slice(0, -1)) : 0;
    const seconds = match[3] ? parseInt(match[3].slice(0, -1)) : 0;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  };

  // Update the GitHub profile data fetching logic
  const processGithubProfile = async (username: string) => {
    const githubData = await fetchGithubProfileData(username);
    const events = await fetchGithubEvents(username);
    
    if (githubData) {
      return {
        followers: githubData.followers,
        following: githubData.following,
        posts: githubData.public_repos,
        bio: githubData.bio || "GitHub profile - Open source contributor",
        profileImage: githubData.avatar_url,
        recentActivity: events
      };
    }
    
    return null;
  };
  
  // Update YouTube profile processing logic
  const processYouTubeProfile = async (username: string, apiKey?: string): Promise<SocialProfile | null> => {
    try {
      console.log(`Processing YouTube profile for ${username}`);
      
      // Get YouTube channel data
      const youtubeData = await fetchYouTubeChannelData(username, apiKey);
      if (!youtubeData) {
        console.error(`Failed to fetch YouTube data for ${username}`);
        return null;
      }
      
      console.log(`Successfully fetched YouTube data for ${username}:
Channel title: ${youtubeData.channelTitle}
Subscribers: ${youtubeData.subscribers}
Videos: ${youtubeData.videoCount}`);
      
      // Get recent videos
      const recentVideos = await fetchYouTubeVideos(username, apiKey);
      console.log(`Fetched ${recentVideos.length} recent videos`);
      
      // Generate proper URL based on input format
      let url = '';
      if (username.startsWith('UC')) {
        // It's a channel ID
        url = `https://youtube.com/channel/${username}`;
      } else if (username.startsWith('@')) {
        // It's a handle
        url = `https://youtube.com/${username}`;
      } else {
        // Try to make it a handle
        url = `https://youtube.com/@${username}`;
      }
      
      return {
        platform: 'youtube',
        username,
        displayName: youtubeData.channelTitle || getDisplayName('youtube', username),
        followers: youtubeData.subscribers,
        following: 0,
        posts: youtubeData.videoCount,
        bio: youtubeData.description || '',
        profileImage: youtubeData.thumbnail,
        url: url,
        recentActivity: recentVideos
      };
    } catch (error) {
      console.error(`Error processing YouTube profile:`, error);
      return null;
    }
  };

  // Add a helper function to normalize profile data from the API 
  const normalizeProfileData = (profile: any) => {
    // Make sure we have a consistent apiKey property regardless of whether
    // the data comes as api_key (from database) or apiKey (from frontend)
    return {
      ...profile,
      apiKey: profile.apiKey || profile.api_key
    };
  };

  // Update the useEffect hook to use the normalized data
  useEffect(() => {
    const fetchProfiles = async () => {
      setLoading(true);
      try {
        if (isAuthenticated) {
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
              headers['Authorization'] = `Bearer ${token}`;
            }
          }
          
          const response = await fetch(`${API_URL}/api/social-profiles`, {
            method: 'GET',
            credentials: "include",
            headers,
            cache: 'no-store'
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log(`Loaded ${data.profiles?.length || 0} social profiles`);
            
            if (data.profiles && data.profiles.length > 0) {
              const connectedProfiles = data.profiles
                .filter((profile: any) => profile.connected)
                .map(normalizeProfileData); // Normalize the profile data
                
              const profilePromises = connectedProfiles.map(async (profile: any) => {
                if (profile.platform === 'github') {
                  try {
                    return await processGithubProfile(profile.username);
                  } catch (error) {
                    console.error(`Error processing GitHub profile ${profile.username}:`, error);
                    return null;
                  }
                } else if (profile.platform === 'youtube') {
                  try {
                    // Use the normalized apiKey property
                    return await processYouTubeProfile(profile.username, profile.apiKey);
                  } catch (error) {
                    console.error(`Error processing YouTube profile ${profile.username}:`, error);
                    return null;
                  }
                }
                
                return {
                  platform: profile.platform,
                  username: profile.username,
                  displayName: getDisplayName(profile.platform, profile.username),
                  followers: 0,
            following: 0,
                  posts: 0,
                  bio: '',
                  profileImage: '/placeholder.svg?height=80&width=80',
                  url: profile.url || '',
                };
              });
              
              const processedProfiles = await Promise.all(profilePromises);
              const validProfiles = processedProfiles.filter(Boolean);
              
              const profilesMap: Record<string, SocialProfile> = {};
              validProfiles.forEach((profile) => {
                if (profile) {
                  profilesMap[profile.platform] = profile;
                }
              });
              
              setProfiles(profilesMap);
            } else {
              // Demo mode with placeholder data
              setProfiles(getDefaultProfiles());
            }
          } else {
            console.error(`Failed to load social profiles: ${response.status}`);
            // Fall back to demo profiles
            setProfiles(getDefaultProfiles());
          }
        } else {
          // Not authenticated, show demo data
          setProfiles(getDefaultProfiles());
        }
      } catch (error) {
        console.error("Failed to load social profiles:", error);
        setProfiles(getDefaultProfiles());
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfiles();
  }, [isAuthenticated, API_URL]);

  // Helper function to generate placeholder stats for different platforms
  const getPlaceholderStats = (platform: string) => {
    switch (platform) {
      case "github":
        return {
          followers: Math.floor(Math.random() * 1000) + 100,
          following: Math.floor(Math.random() * 200) + 50,
          posts: Math.floor(Math.random() * 50) + 10,
          bio: "GitHub profile - Open source contributor and code enthusiast"
        };
      case "twitter":
        return {
          followers: Math.floor(Math.random() * 5000) + 500,
          following: Math.floor(Math.random() * 1000) + 200,
          posts: Math.floor(Math.random() * 2000) + 500,
          bio: "Twitter profile - Sharing thoughts and insights on cybersecurity"
        };
      case "linkedin":
        return {
          followers: Math.floor(Math.random() * 2000) + 300,
          following: Math.floor(Math.random() * 500) + 100,
          posts: Math.floor(Math.random() * 100) + 10,
          bio: "LinkedIn profile - Cybersecurity professional and network builder"
        };
      case "youtube":
        return {
          followers: Math.floor(Math.random() * 10000) + 1000,
          following: 0,
          posts: Math.floor(Math.random() * 100) + 10,
          bio: "YouTube channel - Sharing cybersecurity tips and tutorials"
        };
      default:
        return {
          followers: 100,
          following: 50,
          posts: 10,
          bio: "Connected social profile"
        };
    }
  };
  
  // Helper function to generate display name from username
  const getDisplayName = (platform: string, username: string) => {
    // Convert username to display name format
    // e.g., "john-doe" -> "John Doe"
    const formattedName = username
      .replace(/-/g, ' ')
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
      
    // For common platforms, add suffix
    switch (platform) {
      case "github":
        return `${formattedName} (GitHub)`
      case "twitter":
        return `${formattedName} (Twitter)`
      case "linkedin":
        return `${formattedName} (LinkedIn)`
      case "youtube":
        return `${formattedName} Channel`;
      default:
        return formattedName;
    }
  };
  
  // Default profiles to show if no connected profiles
  const getDefaultProfiles = () => {
    return {
      github: {
        username: "connect-profile",
        displayName: "GitHub Profile",
        followers: 0,
        following: 0,
        posts: 0,
        profileImage: "/placeholder.svg?height=80&width=80",
        bio: "Connect your GitHub profile on the profile page to display it here.",
        url: "https://github.com",
      },
      twitter: {
        username: "connect-profile",
        displayName: "Twitter Profile",
        followers: 0,
        following: 0,
        posts: 0,
        profileImage: "/placeholder.svg?height=80&width=80",
        bio: "Connect your Twitter profile on the profile page to display it here.",
        url: "https://twitter.com",
      },
      linkedin: {
        username: "connect-profile",
        displayName: "LinkedIn Profile",
        followers: 0,
        following: 0,
        posts: 0,
        profileImage: "/placeholder.svg?height=80&width=80",
        bio: "Connect your LinkedIn profile on the profile page to display it here.",
        url: "https://linkedin.com",
      },
      youtube: {
        username: "connect-profile",
        displayName: "YouTube Channel",
        followers: 0,
        following: 0,
        posts: 0,
        profileImage: "/placeholder.svg?height=80&width=80",
        bio: "Connect your YouTube channel on the profile page to display it here.",
        url: "https://youtube.com",
      },
    };
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M"
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K"
    }
    return num.toString()
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "youtube":
        return <Youtube className="h-5 w-5 text-red-500" />
      case "instagram":
        return <Instagram className="h-5 w-5 text-pink-500" />
      case "linkedin":
        return <Linkedin className="h-5 w-5 text-blue-500" />
      case "twitter":
        return <Twitter className="h-5 w-5 text-cyan-500" />
      case "github":
        return <Github className="h-5 w-5 text-white" />
      default:
        return null
    }
  }

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "youtube":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      case "instagram":
        return "bg-pink-500/10 text-pink-500 border-pink-500/20"
      case "linkedin":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "twitter":
        return "bg-cyan-500/10 text-cyan-500 border-cyan-500/20"
      default:
        return "bg-slate-500/10 text-slate-500 border-slate-500/20"
    }
  }

  // Add function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Add function to get icon for GitHub event
  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'PushEvent':
        return <GitCommit className="h-4 w-4 text-green-400" />;
      case 'CreateEvent':
        return <GitBranch className="h-4 w-4 text-purple-400" />;
      case 'WatchEvent':
        return <Star className="h-4 w-4 text-yellow-400" />;
      case 'ForkEvent':
        return <GitFork className="h-4 w-4 text-blue-400" />;
      default:
        return <Github className="h-4 w-4 text-slate-400" />;
    }
  };

  // Add function to get icon for YouTube video
  const getVideoIcon = (statType: string) => {
    switch (statType) {
      case 'views':
        return <Eye className="h-4 w-4 text-blue-400" />;
      case 'likes':
        return <ThumbsUp className="h-4 w-4 text-green-400" />;
      case 'duration':
        return <Clock className="h-4 w-4 text-yellow-400" />;
      default:
        return <Play className="h-4 w-4 text-red-400" />;
    }
  };

  if (loading) {
    return (
      <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-sm">
        <CardContent className="p-6 flex items-center justify-center h-[200px]">
          <p className="text-slate-400">Loading social profiles...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Social Media Profiles</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="github">
          <TabsList className="grid grid-cols-4 mb-4">
            {Object.keys(profiles).map((platform) => (
              <TabsTrigger
                key={platform}
                value={platform}
                className={`data-[state=active]:${getPlatformColor(platform)}`}
              >
                <div className="flex items-center">
                  {getPlatformIcon(platform)}
                  <span className="ml-2 capitalize">{platform}</span>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(profiles).map(([platform, profile]) => (
            <TabsContent key={platform} value={platform}>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0">
                  <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-slate-700">
                    <img
                      src={profile.profileImage || "/placeholder.svg"}
                      alt={profile.displayName}
                      className="object-cover w-full h-full"
                    />
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-bold">{profile.displayName}</h3>
                      <p className="text-slate-400">@{profile.username}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 md:mt-0"
                      onClick={() => window.open(profile.url, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Visit Profile
                    </Button>
                  </div>

                  <p className="text-sm text-slate-300 mb-4">{profile.bio}</p>

                  <div className="flex space-x-4 mb-4">
                    <div className="text-center">
                      <p className="text-lg font-bold">{formatNumber(profile.followers)}</p>
                      <p className="text-xs text-slate-400">
                        {platform === "youtube" ? "Subscribers" : "Followers"}
                      </p>
                    </div>
                    {platform !== "youtube" && (
                    <div className="text-center">
                      <p className="text-lg font-bold">{formatNumber(profile.following)}</p>
                      <p className="text-xs text-slate-400">Following</p>
                    </div>
                    )}
                    <div className="text-center">
                      <p className="text-lg font-bold">{formatNumber(profile.posts)}</p>
                      <p className="text-xs text-slate-400">
                        {platform === "youtube" ? "Videos" : platform === "twitter" ? "Tweets" : platform === "github" ? "Repositories" : "Posts"}
                      </p>
                    </div>
                  </div>

                  {/* Show recent activity for GitHub */}
                  {platform === "github" && profile.recentActivity && profile.recentActivity.length > 0 && (
                    <div className="border-t border-slate-800 pt-4">
                      <h4 className="text-sm font-medium mb-2 text-slate-300">Recent Activity</h4>
                      <div className="space-y-2">
                        {(profile.recentActivity as GitHubEvent[]).map(event => (
                          <div key={event.id} className="flex items-start text-xs">
                            <div className="mr-2 mt-0.5">
                              {getEventIcon(event.type)}
                            </div>
                            <div>
                              <p className="text-slate-300">{event.description}</p>
                              <p className="text-slate-500">{formatDate(event.createdAt)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Show recent videos for YouTube */}
                  {platform === "youtube" && profile.recentActivity && profile.recentActivity.length > 0 && (
                    <div className="border-t border-slate-800 pt-4">
                      <h4 className="text-sm font-medium mb-2 text-slate-300">Recent Videos</h4>
                      <div className="space-y-4">
                        {(profile.recentActivity as YouTubeVideo[]).map(video => (
                          <div key={video.id} className="flex items-start text-xs">
                            <a 
                              href={`https://www.youtube.com/watch?v=${video.id}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-start hover:bg-slate-800/50 p-2 rounded-lg transition-colors w-full"
                            >
                              <div className="flex-shrink-0 w-24 h-14 mr-3 relative rounded overflow-hidden">
                                <img 
                                  src={video.thumbnail} 
                                  alt={video.title} 
                                  className="object-cover w-full h-full"
                                />
                                <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] px-1 rounded">
                                  {video.duration}
                                </div>
                              </div>
                              <div className="flex-1">
                                <p className="text-slate-200 font-medium line-clamp-2">{video.title}</p>
                                <div className="flex items-center mt-1 text-[10px] text-slate-400 space-x-3">
                                  <div className="flex items-center">
                                    <Eye className="h-3 w-3 mr-1" />
                                    {formatNumber(parseInt(video.viewCount))}
                                  </div>
                                  <div className="flex items-center">
                                    <ThumbsUp className="h-3 w-3 mr-1" />
                                    {formatNumber(parseInt(video.likeCount))}
                                  </div>
                                  <div className="flex items-center">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {formatDate(video.publishedAt)}
                                  </div>
                                </div>
                              </div>
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
