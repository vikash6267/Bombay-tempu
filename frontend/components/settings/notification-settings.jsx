"use client"

import { useState } from "react"
import { useFormik } from "formik"
import * as Yup from "yup"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useDispatch, useSelector } from "react-redux"
import { updateNotificationSettings } from "@/lib/slices/uiSlice"
import toast from "react-hot-toast"

export function NotificationSettings() {
  const dispatch = useDispatch()
  const notificationSettings = useSelector((state) => state.ui.notificationSettings)
  const [isLoading, setIsLoading] = useState(false)

  const formik = useFormik({
    initialValues: {
      emailNotifications: notificationSettings?.emailNotifications ?? true,
      tripUpdates: notificationSettings?.tripUpdates ?? true,
      maintenanceAlerts: notificationSettings?.maintenanceAlerts ?? true,
      paymentReminders: notificationSettings?.paymentReminders ?? true,
      systemAnnouncements: notificationSettings?.systemAnnouncements ?? true,
      lowFuelAlerts: notificationSettings?.lowFuelAlerts ?? true,
      driverAssignments: notificationSettings?.driverAssignments ?? true,
      reportGeneration: notificationSettings?.reportGeneration ?? false,
    },
    validationSchema: Yup.object({
      emailNotifications: Yup.boolean(),
      tripUpdates: Yup.boolean(),
      maintenanceAlerts: Yup.boolean(),
      paymentReminders: Yup.boolean(),
      systemAnnouncements: Yup.boolean(),
      lowFuelAlerts: Yup.boolean(),
      driverAssignments: Yup.boolean(),
      reportGeneration: Yup.boolean(),
    }),
    onSubmit: async (values) => {
      setIsLoading(true)
      try {
        // In a real app, you would save this to your backend
        dispatch(updateNotificationSettings(values))
        toast.success("Notification settings updated successfully")
      } catch (error) {
        toast.error("Failed to update notification settings")
        console.error("Notification settings update error:", error)
      } finally {
        setIsLoading(false)
      }
    },
  })

  const handleSwitchChange = (field) => {
    formik.setFieldValue(field, !formik.values[field])
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
        <CardDescription>Configure which notifications you want to receive</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={formik.handleSubmit}>
          <div className="space-y-4">
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
                <Label htmlFor="tripUpdates">Trip Updates</Label>
                <p className="text-sm text-muted-foreground">Get notified about trip status changes</p>
              </div>
              <Switch
                id="tripUpdates"
                checked={formik.values.tripUpdates}
                onCheckedChange={() => handleSwitchChange("tripUpdates")}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="maintenanceAlerts">Maintenance Alerts</Label>
                <p className="text-sm text-muted-foreground">Receive alerts for scheduled maintenance</p>
              </div>
              <Switch
                id="maintenanceAlerts"
                checked={formik.values.maintenanceAlerts}
                onCheckedChange={() => handleSwitchChange("maintenanceAlerts")}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="paymentReminders">Payment Reminders</Label>
                <p className="text-sm text-muted-foreground">Get reminders about upcoming and overdue payments</p>
              </div>
              <Switch
                id="paymentReminders"
                checked={formik.values.paymentReminders}
                onCheckedChange={() => handleSwitchChange("paymentReminders")}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="systemAnnouncements">System Announcements</Label>
                <p className="text-sm text-muted-foreground">Receive important system announcements</p>
              </div>
              <Switch
                id="systemAnnouncements"
                checked={formik.values.systemAnnouncements}
                onCheckedChange={() => handleSwitchChange("systemAnnouncements")}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="lowFuelAlerts">Low Fuel Alerts</Label>
                <p className="text-sm text-muted-foreground">Get alerts when vehicles are low on fuel</p>
              </div>
              <Switch
                id="lowFuelAlerts"
                checked={formik.values.lowFuelAlerts}
                onCheckedChange={() => handleSwitchChange("lowFuelAlerts")}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="driverAssignments">Driver Assignments</Label>
                <p className="text-sm text-muted-foreground">Get notified about new driver assignments</p>
              </div>
              <Switch
                id="driverAssignments"
                checked={formik.values.driverAssignments}
                onCheckedChange={() => handleSwitchChange("driverAssignments")}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="reportGeneration">Report Generation</Label>
                <p className="text-sm text-muted-foreground">Get notified when reports are generated</p>
              </div>
              <Switch
                id="reportGeneration"
                checked={formik.values.reportGeneration}
                onCheckedChange={() => handleSwitchChange("reportGeneration")}
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
