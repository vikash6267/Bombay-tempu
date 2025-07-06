"use client"

import { useState } from "react"
import { useFormik } from "formik"
import * as Yup from "yup"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useDispatch } from "react-redux"
// import { updateUserPreferences } from "@/lib/slices/authSlice"
import toast from "react-hot-toast"

export function ProfilePreferences({ userId }) {
  const dispatch = useDispatch()
  const [isLoading, setIsLoading] = useState(false)

  const formik = useFormik({
    initialValues: {
      darkMode: false,
      language: "en",
      dashboardView: "grid",
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      autoSave: true,
    },
    validationSchema: Yup.object({
      darkMode: Yup.boolean(),
      language: Yup.string().required("Language is required"),
      dashboardView: Yup.string().required("Dashboard view is required"),
      emailNotifications: Yup.boolean(),
      smsNotifications: Yup.boolean(),
      pushNotifications: Yup.boolean(),
      autoSave: Yup.boolean(),
    }),
    onSubmit: async (values) => {
      setIsLoading(true)
      try {
        // In a real app, you would save this to your backend
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // dispatch(updateUserPreferences(values))
        toast.success("Preferences updated successfully")
      } catch (error) {
        toast.error("Failed to update preferences")
        console.error("Preferences update error:", error)
      } finally {
        setIsLoading(false)
      }
    },
  })

  const handleSwitchChange = (field) => {
    formik.setFieldValue(field, !formik.values[field])
  }

  const handleSelectChange = (field, value) => {
    formik.setFieldValue(field, value)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Preferences</CardTitle>
        <CardDescription>Customize your application experience</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={formik.handleSubmit}>
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Appearance</h3>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="darkMode">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">Enable dark mode for the application</p>
                </div>
                <Switch
                  id="darkMode"
                  checked={formik.values.darkMode}
                  onCheckedChange={() => handleSwitchChange("darkMode")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select value={formik.values.language} onValueChange={(value) => handleSelectChange("language", value)}>
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="zh">Chinese</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dashboardView">Dashboard View</Label>
                <Select
                  value={formik.values.dashboardView}
                  onValueChange={(value) => handleSelectChange("dashboardView", value)}
                >
                  <SelectTrigger id="dashboardView">
                    <SelectValue placeholder="Select dashboard view" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">Grid</SelectItem>
                    <SelectItem value="list">List</SelectItem>
                    <SelectItem value="compact">Compact</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Notifications</h3>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={formik.values.emailNotifications}
                  onCheckedChange={() => handleSwitchChange("emailNotifications")}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="smsNotifications">SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications via SMS</p>
                </div>
                <Switch
                  id="smsNotifications"
                  checked={formik.values.smsNotifications}
                  onCheckedChange={() => handleSwitchChange("smsNotifications")}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="pushNotifications">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive push notifications in browser</p>
                </div>
                <Switch
                  id="pushNotifications"
                  checked={formik.values.pushNotifications}
                  onCheckedChange={() => handleSwitchChange("pushNotifications")}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Other Settings</h3>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoSave">Auto Save</Label>
                  <p className="text-sm text-muted-foreground">Automatically save changes as you work</p>
                </div>
                <Switch
                  id="autoSave"
                  checked={formik.values.autoSave}
                  onCheckedChange={() => handleSwitchChange("autoSave")}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Preferences"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
