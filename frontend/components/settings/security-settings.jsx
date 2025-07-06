"use client"

import { useState } from "react"
import { useFormik } from "formik"
import * as Yup from "yup"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useDispatch } from "react-redux"
import { updateSecuritySettings } from "@/lib/slices/authSlice"
import toast from "react-hot-toast"

export function SecuritySettings() {
  const dispatch = useDispatch()
  const [isLoading, setIsLoading] = useState(false)

  const formik = useFormik({
    initialValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      twoFactorAuth: false,
      sessionTimeout: "30",
    },
    validationSchema: Yup.object({
      currentPassword: Yup.string().required("Current password is required"),
      newPassword: Yup.string()
        .min(8, "Password must be at least 8 characters")
        .matches(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
        )
        .required("New password is required"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("newPassword"), null], "Passwords must match")
        .required("Confirm password is required"),
      twoFactorAuth: Yup.boolean(),
      sessionTimeout: Yup.number().typeError("Must be a number").required("Session timeout is required"),
    }),
    onSubmit: async (values) => {
      setIsLoading(true)
      try {
        // In a real app, you would save this to your backend
        dispatch(updateSecuritySettings(values))
        toast.success("Security settings updated successfully")
        formik.resetForm()
      } catch (error) {
        toast.error("Failed to update security settings")
        console.error("Security settings update error:", error)
      } finally {
        setIsLoading(false)
      }
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Settings</CardTitle>
        <CardDescription>Update your password and security preferences</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={formik.handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                placeholder="Enter your current password"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.currentPassword}
              />
              {formik.touched.currentPassword && formik.errors.currentPassword ? (
                <div className="text-sm text-red-500">{formik.errors.currentPassword}</div>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                placeholder="Enter your new password"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.newPassword}
              />
              {formik.touched.newPassword && formik.errors.newPassword ? (
                <div className="text-sm text-red-500">{formik.errors.newPassword}</div>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your new password"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.confirmPassword}
              />
              {formik.touched.confirmPassword && formik.errors.confirmPassword ? (
                <div className="text-sm text-red-500">{formik.errors.confirmPassword}</div>
              ) : null}
            </div>
            <div className="flex items-center justify-between pt-4">
              <div className="space-y-0.5">
                <Label htmlFor="twoFactorAuth">Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">Enable two-factor authentication for added security</p>
              </div>
              <Switch
                id="twoFactorAuth"
                checked={formik.values.twoFactorAuth}
                onCheckedChange={(checked) => formik.setFieldValue("twoFactorAuth", checked)}
              />
            </div>
            <div className="space-y-2 pt-4">
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Input
                id="sessionTimeout"
                name="sessionTimeout"
                type="number"
                placeholder="Enter session timeout in minutes"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.sessionTimeout}
              />
              {formik.touched.sessionTimeout && formik.errors.sessionTimeout ? (
                <div className="text-sm text-red-500">{formik.errors.sessionTimeout}</div>
              ) : null}
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Security Settings"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
