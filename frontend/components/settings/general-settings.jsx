"use client"

import { useState } from "react"
import { useFormik } from "formik"
import * as Yup from "yup"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDispatch, useSelector } from "react-redux"
import { updateSettings } from "@/lib/slices/uiSlice"
import toast from "react-hot-toast"

export function GeneralSettings() {
  const dispatch = useDispatch()
  const settings = useSelector((state) => state.ui.settings)
  const [isLoading, setIsLoading] = useState(false)

  const formik = useFormik({
    initialValues: {
      companyName: settings?.companyName || "Transport & Fleet Management",
      contactEmail: settings?.contactEmail || "contact@transportfleet.com",
      contactPhone: settings?.contactPhone || "+1 (555) 123-4567",
      address: settings?.address || "123 Fleet Street, Transport City, TC 12345",
      taxRate: settings?.taxRate || "10",
      currency: settings?.currency || "USD",
      dateFormat: settings?.dateFormat || "MM/DD/YYYY",
      timeZone: settings?.timeZone || "UTC-5",
    },
    validationSchema: Yup.object({
      companyName: Yup.string().required("Company name is required"),
      contactEmail: Yup.string().email("Invalid email address").required("Contact email is required"),
      contactPhone: Yup.string().required("Contact phone is required"),
      address: Yup.string().required("Address is required"),
      taxRate: Yup.number().typeError("Must be a number").required("Tax rate is required"),
      currency: Yup.string().required("Currency is required"),
      dateFormat: Yup.string().required("Date format is required"),
      timeZone: Yup.string().required("Time zone is required"),
    }),
    onSubmit: async (values) => {
      setIsLoading(true)
      try {
        // In a real app, you would save this to your backend
        dispatch(updateSettings(values))
        toast.success("Settings updated successfully")
      } catch (error) {
        toast.error("Failed to update settings")
        console.error("Settings update error:", error)
      } finally {
        setIsLoading(false)
      }
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
        <CardDescription>Configure your company information and system preferences</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="company">
          <TabsList className="mb-4">
            <TabsTrigger value="company">Company Information</TabsTrigger>
            <TabsTrigger value="system">System Preferences</TabsTrigger>
          </TabsList>
          <form onSubmit={formik.handleSubmit}>
            <TabsContent value="company" className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    placeholder="Enter company name"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.companyName}
                  />
                  {formik.touched.companyName && formik.errors.companyName ? (
                    <div className="text-sm text-red-500">{formik.errors.companyName}</div>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    name="contactEmail"
                    type="email"
                    placeholder="Enter contact email"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.contactEmail}
                  />
                  {formik.touched.contactEmail && formik.errors.contactEmail ? (
                    <div className="text-sm text-red-500">{formik.errors.contactEmail}</div>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    name="contactPhone"
                    placeholder="Enter contact phone"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.contactPhone}
                  />
                  {formik.touched.contactPhone && formik.errors.contactPhone ? (
                    <div className="text-sm text-red-500">{formik.errors.contactPhone}</div>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    placeholder="Enter company address"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.address}
                  />
                  {formik.touched.address && formik.errors.address ? (
                    <div className="text-sm text-red-500">{formik.errors.address}</div>
                  ) : null}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="system" className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    name="taxRate"
                    type="number"
                    placeholder="Enter tax rate"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.taxRate}
                  />
                  {formik.touched.taxRate && formik.errors.taxRate ? (
                    <div className="text-sm text-red-500">{formik.errors.taxRate}</div>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    name="currency"
                    placeholder="Enter currency code"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.currency}
                  />
                  {formik.touched.currency && formik.errors.currency ? (
                    <div className="text-sm text-red-500">{formik.errors.currency}</div>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Input
                    id="dateFormat"
                    name="dateFormat"
                    placeholder="Enter date format"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.dateFormat}
                  />
                  {formik.touched.dateFormat && formik.errors.dateFormat ? (
                    <div className="text-sm text-red-500">{formik.errors.dateFormat}</div>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeZone">Time Zone</Label>
                  <Input
                    id="timeZone"
                    name="timeZone"
                    placeholder="Enter time zone"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.timeZone}
                  />
                  {formik.touched.timeZone && formik.errors.timeZone ? (
                    <div className="text-sm text-red-500">{formik.errors.timeZone}</div>
                  ) : null}
                </div>
              </div>
            </TabsContent>
            <div className="mt-6 flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </form>
        </Tabs>
      </CardContent>
    </Card>
  )
}
