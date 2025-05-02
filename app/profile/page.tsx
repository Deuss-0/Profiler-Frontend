"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { Separator } from "@/components/ui/separator"
import { ProfileHackingForm } from "@/components/profile/profile-hacking-form"
import { ProfileSocialForm } from "@/components/profile/profile-social-form"
import { Check, Home, Loader2, UserCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading, checkSession } = useAuth()
  const [isUpdating, setIsUpdating] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    bio: "",
    country: "",
    avatar: "",
  })
  const { toast } = useToast()
  const router = useRouter()
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sigh-ai.com'

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/")
      toast({
        title: "Authentication required",
        description: "Please sign in to access your profile.",
        variant: "destructive",
      })
    }

    if (user) {
      setFormData({
        fullName: user.fullName || "",
        email: user.email || "",
        bio: localStorage.getItem("userBio") || "",
        country: localStorage.getItem("userCountry") || "",
        avatar: user.avatar || "",
      })
    }
  }, [isLoading, isAuthenticated, router, user, toast])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleProfileUpdate = async () => {
    setIsUpdating(true)
    try {
      // Store bio and country in localStorage for demo purposes
      localStorage.setItem("userBio", formData.bio)
      localStorage.setItem("userCountry", formData.country)

      // Create headers with token authentication
      const headers: Record<string, string> = {
        "Accept": "application/json",
        "Content-Type": "application/json",
      };
      
      // Add authentication token if available
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      // Call the API to update the profile
      const response = await fetch(`${API_URL}/api/account`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          country: formData.country,
        }),
      })

      // Get response text regardless of status code
      const responseText = await response.text();
      let responseData;
      
      // Try to parse as JSON, but don't fail if it's not valid JSON
      try {
        responseData = JSON.parse(responseText);
      } catch (error) {
        console.warn('Response was not valid JSON:', responseText);
        responseData = { message: 'Received invalid response from server' };
      }

      if (response.ok) {
        // Refresh the session to get updated user data
        await checkSession()
        toast({
          description: "Profile updated successfully",
          className: "bg-emerald-800 border-0 text-white",
          icon: <Check className="h-4 w-4" />,
        })
      } else {
        const errorMessage = responseData?.message || `Failed to update profile (${response.status})`;
        console.error(`Error response: ${response.status}`, errorMessage);
        
        // Don't throw, just show the toast with the error message
        toast({
          title: "Update Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
        <h1 className="text-3xl font-bold text-white mb-2">Profile Settings</h1>
        <p className="text-slate-400">Manage your account settings and connected platforms</p>
        </div>
        <Link href="/">
          <Button className="bg-cyan-600 hover:bg-cyan-700">
            <Home className="mr-2 h-4 w-4" />
            Home
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-8 bg-slate-900">
          <TabsTrigger value="general" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
            General
          </TabsTrigger>
          <TabsTrigger value="hacking" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
            Hacking Platforms
          </TabsTrigger>
          <TabsTrigger value="social" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
            Social Profiles
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="grid gap-8 md:grid-cols-2">
            <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    placeholder="Your full name"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    placeholder="Your email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                  <p className="text-xs text-slate-500">Email cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    name="country"
                    placeholder="Your country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    placeholder="Tell us a bit about yourself"
                    value={formData.bio}
                    onChange={handleInputChange}
                    className="bg-slate-800 border-slate-700 text-white h-24"
                  />
                </div>

                <Button 
                  className="w-full bg-cyan-600 hover:bg-cyan-700 mt-4" 
                  onClick={handleProfileUpdate}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Profile"
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Avatar</CardTitle>
                <CardDescription>Manage your profile picture</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <Avatar className="h-32 w-32">
                    <AvatarImage src={user?.avatar} alt={user?.username} />
                    <AvatarFallback className="bg-cyan-800 text-cyan-100 text-xl">
                      {user?.username?.slice(0, 2).toUpperCase() || <UserCircle className="h-12 w-12" />}
                    </AvatarFallback>
                  </Avatar>

                  <div className="text-center">
                    <p className="text-lg font-medium">{user?.fullName || user?.username}</p>
                    <p className="text-sm text-slate-400">{user?.email}</p>
                  </div>

                  <Separator className="bg-slate-800" />

                  <div className="w-full space-y-2">
                    <Label htmlFor="avatar">Upload New Avatar</Label>
                    <Input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                    <p className="text-xs text-slate-500">Maximum file size: 2MB</p>
                  </div>

                  <div className="flex space-x-2 w-full">
                    <Button 
                      variant="outline" 
                      className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
                    >
                      Cancel
                    </Button>
                    <Button className="w-full bg-cyan-600 hover:bg-cyan-700">
                      Upload
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="hacking">
          <ProfileHackingForm />
        </TabsContent>

        <TabsContent value="social">
          <ProfileSocialForm />
        </TabsContent>
      </Tabs>
    </div>
  )
} 