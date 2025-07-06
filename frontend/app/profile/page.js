"use client"

import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileInfo } from "@/components/profile/profile-info"
import { ProfileActivity } from "@/components/profile/profile-activity"
import { ProfilePreferences } from "@/components/profile/profile-preferences"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(true)
  const user = useSelector((state) => state.auth.user)

  useEffect(() => {
    // Simulate loading user data
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>You need to be logged in to view your profile.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <DashboardLayout>
    <div className="container mx-auto py-6">
      <h1 className="mb-6 text-3xl font-bold">My Profile</h1>

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-3">
          <TabsTrigger value="info">Personal Information</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>
        <TabsContent value="info">
          <ProfileInfo user={user} />
        </TabsContent>
        <TabsContent value="activity">
          <ProfileActivity userId={user.id} />
        </TabsContent>
        <TabsContent value="preferences">
          <ProfilePreferences userId={user.id} />
        </TabsContent>
      </Tabs>
    </div></DashboardLayout>
  )
}
