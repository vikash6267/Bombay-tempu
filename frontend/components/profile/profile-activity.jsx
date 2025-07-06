"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"

export function ProfileActivity({ userId }) {
  const [activities, setActivities] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        // In a real app, you would fetch activities from your API
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Mock data
        const mockActivities = [
          {
            id: 1,
            type: "login",
            description: "Logged in to the system",
            timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
            ipAddress: "192.168.1.1",
            device: "Chrome on Windows",
          },
          {
            id: 2,
            type: "profile_update",
            description: "Updated profile information",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            ipAddress: "192.168.1.1",
            device: "Chrome on Windows",
          },
          {
            id: 3,
            type: "trip_created",
            description: "Created a new trip #TRP-2023-05-15",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            ipAddress: "192.168.1.1",
            device: "Chrome on Windows",
          },
          {
            id: 4,
            type: "vehicle_assigned",
            description: "Assigned vehicle #VEH-2023-001 to trip #TRP-2023-05-15",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            ipAddress: "192.168.1.1",
            device: "Chrome on Windows",
          },
          {
            id: 5,
            type: "payment_processed",
            description: "Processed payment #PAY-2023-05-14 for $1,250.00",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
            ipAddress: "192.168.1.1",
            device: "Chrome on Windows",
          },
        ]

        setActivities(mockActivities)
      } catch (error) {
        console.error("Error fetching activities:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchActivities()
  }, [userId])

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const getActivityBadge = (type) => {
    switch (type) {
      case "login":
        return <Badge className="bg-blue-500">Login</Badge>
      case "profile_update":
        return <Badge className="bg-green-500">Profile Update</Badge>
      case "trip_created":
        return <Badge className="bg-purple-500">Trip Created</Badge>
      case "vehicle_assigned":
        return <Badge className="bg-yellow-500">Vehicle Assigned</Badge>
      case "payment_processed":
        return <Badge className="bg-emerald-500">Payment Processed</Badge>
      default:
        return <Badge>Activity</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Log</CardTitle>
        <CardDescription>Recent activities and system interactions</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : activities.length === 0 ? (
          <p className="text-center text-muted-foreground">No recent activities found.</p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex flex-col space-y-2 rounded-lg border p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getActivityBadge(activity.type)}
                    <span className="font-medium">{activity.description}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{formatDate(activity.timestamp)}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  <span>IP: {activity.ipAddress}</span>
                  <span className="ml-4">Device: {activity.device}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
