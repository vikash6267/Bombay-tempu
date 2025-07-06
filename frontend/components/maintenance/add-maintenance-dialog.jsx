"use client"

import { useState, useEffect } from "react"
import { useFormik } from "formik"
import * as Yup from "yup"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/lib/api"
import { toast } from "react-hot-toast"

const validationSchema = Yup.object({
  vehicleId: Yup.string().required("Vehicle is required"),
  type: Yup.string().required("Maintenance type is required"),
  description: Yup.string().required("Description is required"),
  scheduledDate: Yup.date().required("Scheduled date is required"),
  priority: Yup.string().required("Priority is required"),
  serviceProvider: Yup.string().required("Service provider is required"),
})

export function AddMaintenanceDialog({ open, onOpenChange, onMaintenanceAdded }) {
  const [loading, setLoading] = useState(false)
  const [vehicles, setVehicles] = useState([])

  const formik = useFormik({
    initialValues: {
      vehicleId: "",
      type: "",
      description: "",
      scheduledDate: "",
      priority: "medium",
      status: "scheduled",
      serviceProvider: "",
      estimatedCost: "",
      actualCost: "",
      notes: "",
      mileage: "",
      nextServiceDate: "",
      partsReplaced: "",
      warrantyInfo: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true)
      try {
        await api.post("/maintenance", values)
        toast.success("Maintenance record added successfully!")
        onMaintenanceAdded()
        onOpenChange(false)
        formik.resetForm()
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to add maintenance record")
      } finally {
        setLoading(false)
      }
    },
  })

  useEffect(() => {
    if (open) {
      fetchVehicles()
    }
  }, [open])

  const fetchVehicles = async () => {
    try {
      const response = await api.get("/vehicles")
      setVehicles(response.data.data)
    } catch (error) {
      toast.error("Failed to fetch vehicles")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Maintenance Record</DialogTitle>
        </DialogHeader>

        <form onSubmit={formik.handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicleId">Vehicle *</Label>
                <Select
                  value={formik.values.vehicleId}
                  onValueChange={(value) => formik.setFieldValue("vehicleId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle._id} value={vehicle._id}>
                        {vehicle.registrationNumber} - {vehicle.make} {vehicle.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formik.touched.vehicleId && formik.errors.vehicleId && (
                  <p className="text-sm text-red-500">{formik.errors.vehicleId}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Maintenance Type *</Label>
                <Select value={formik.values.type} onValueChange={(value) => formik.setFieldValue("type", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="routine">Routine Service</SelectItem>
                    <SelectItem value="repair">Repair</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                    <SelectItem value="oil_change">Oil Change</SelectItem>
                    <SelectItem value="tire_service">Tire Service</SelectItem>
                    <SelectItem value="brake_service">Brake Service</SelectItem>
                    <SelectItem value="engine_service">Engine Service</SelectItem>
                    <SelectItem value="transmission">Transmission</SelectItem>
                    <SelectItem value="electrical">Electrical</SelectItem>
                    <SelectItem value="bodywork">Bodywork</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
                {formik.touched.type && formik.errors.type && (
                  <p className="text-sm text-red-500">{formik.errors.type}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority *</Label>
                <Select
                  value={formik.values.priority}
                  onValueChange={(value) => formik.setFieldValue("priority", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                {formik.touched.priority && formik.errors.priority && (
                  <p className="text-sm text-red-500">{formik.errors.priority}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formik.values.status} onValueChange={(value) => formik.setFieldValue("status", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduledDate">Scheduled Date *</Label>
                <Input
                  id="scheduledDate"
                  name="scheduledDate"
                  type="date"
                  value={formik.values.scheduledDate}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.scheduledDate && formik.errors.scheduledDate && (
                  <p className="text-sm text-red-500">{formik.errors.scheduledDate}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceProvider">Service Provider *</Label>
                <Input
                  id="serviceProvider"
                  name="serviceProvider"
                  value={formik.values.serviceProvider}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Enter service provider name"
                />
                {formik.touched.serviceProvider && formik.errors.serviceProvider && (
                  <p className="text-sm text-red-500">{formik.errors.serviceProvider}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formik.values.description}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Describe the maintenance work"
                  rows={3}
                />
                {formik.touched.description && formik.errors.description && (
                  <p className="text-sm text-red-500">{formik.errors.description}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cost & Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimatedCost">Estimated Cost (₹)</Label>
                <Input
                  id="estimatedCost"
                  name="estimatedCost"
                  type="number"
                  value={formik.values.estimatedCost}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Enter estimated cost"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="actualCost">Actual Cost (₹)</Label>
                <Input
                  id="actualCost"
                  name="actualCost"
                  type="number"
                  value={formik.values.actualCost}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Enter actual cost"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mileage">Current Mileage (km)</Label>
                <Input
                  id="mileage"
                  name="mileage"
                  type="number"
                  value={formik.values.mileage}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Enter current mileage"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nextServiceDate">Next Service Date</Label>
                <Input
                  id="nextServiceDate"
                  name="nextServiceDate"
                  type="date"
                  value={formik.values.nextServiceDate}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="partsReplaced">Parts Replaced</Label>
                <Textarea
                  id="partsReplaced"
                  name="partsReplaced"
                  value={formik.values.partsReplaced}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="List parts that were replaced"
                  rows={2}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="warrantyInfo">Warranty Information</Label>
                <Textarea
                  id="warrantyInfo"
                  name="warrantyInfo"
                  value={formik.values.warrantyInfo}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Enter warranty details"
                  rows={2}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formik.values.notes}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Add any additional notes"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Maintenance"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
