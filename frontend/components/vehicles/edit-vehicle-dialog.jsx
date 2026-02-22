"use client"

import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { Formik, Form, Field, ErrorMessage } from "formik"
import * as Yup from "yup"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/api"
import toast from "react-hot-toast"

const vehicleSchema = Yup.object().shape({
  registrationNumber: Yup.string().required("Registration number is required"),
  vehicleType: Yup.string().required("Vehicle type is required"),
  make: Yup.string().required("Make is required"),
  model: Yup.string().required("Model is required"),
  year: Yup.number().min(1990).max(new Date().getFullYear()).required("Year is required"),
  capacity: Yup.number().positive().required("Capacity is required"),
  fuelType: Yup.string().required("Fuel type is required"),
  status: Yup.string().required("Status is required"),
})

export function EditVehicleDialog({ open, onOpenChange, vehicle }) {
  const queryClient = useQueryClient()

  const { data: fleetOwners } = useQuery({
    queryKey: ["fleet-owners"],
    queryFn: () => api.get("/users?role=fleet_owner"),
    enabled: open,
  })

  const updateMutation = useMutation({
    mutationFn: (data) => api.put(`/vehicles/${vehicle._id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["vehicles"])
      toast.success("Vehicle updated successfully")
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update vehicle")
    },
  })

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      await updateMutation.mutateAsync(values)
    } catch (error) {
      console.error("Failed to update vehicle:", error)
    } finally {
      setSubmitting(false)
    }
  }

  if (!vehicle) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[80vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Vehicle</DialogTitle>
          <DialogDescription>Update vehicle information</DialogDescription>
        </DialogHeader>

        <Formik
          initialValues={{
            registrationNumber: vehicle.registrationNumber || "",
            vehicleType: vehicle.vehicleType || "",
            make: vehicle.make || "",
            model: vehicle.model || "",
            year: vehicle.year || new Date().getFullYear(),
            capacity: vehicle.capacity || "",
            fuelType: vehicle.fuelType || "",
            fleetOwner: vehicle.owner?._id || "",
            status: vehicle.status || "available",
            description: vehicle.description || "",
          }}
          validationSchema={vehicleSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, errors, touched, setFieldValue, values }) => (
            <Form>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="registrationNumber">Registration Number *</Label>
                    <Field name="registrationNumber">
                      {({ field }) => (
                        <Input
                          {...field}
                          id="registrationNumber"
                          className={errors.registrationNumber && touched.registrationNumber ? "border-red-500" : ""}
                        />
                      )}
                    </Field>
                    <ErrorMessage name="registrationNumber" component="p" className="text-sm text-red-500" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Vehicle Type *</Label>
                    <Select onValueChange={(value) => setFieldValue("vehicleType", value)} value={values.vehicleType}>
                      <SelectTrigger className={errors.vehicleType && touched.vehicleType ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select vehicle type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="truck">Truck</SelectItem>
                        <SelectItem value="tempo">Tempo</SelectItem>
                        <SelectItem value="trailer">Trailer</SelectItem>
                        <SelectItem value="pickup">Pickup</SelectItem>
                        <SelectItem value="van">Van</SelectItem>
                      </SelectContent>
                    </Select>
                    <ErrorMessage name="type" component="p" className="text-sm text-red-500" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="make">Make *</Label>
                    <Field name="make">
                      {({ field }) => (
                        <Input {...field} id="make" className={errors.make && touched.make ? "border-red-500" : ""} />
                      )}
                    </Field>
                    <ErrorMessage name="make" component="p" className="text-sm text-red-500" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="model">Model *</Label>
                    <Field name="model">
                      {({ field }) => (
                        <Input
                          {...field}
                          id="model"
                          className={errors.model && touched.model ? "border-red-500" : ""}
                        />
                      )}
                    </Field>
                    <ErrorMessage name="model" component="p" className="text-sm text-red-500" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="year">Year *</Label>
                    <Field name="year">
                      {({ field }) => (
                        <Input
                          {...field}
                          id="year"
                          type="number"
                          min="1990"
                          max={new Date().getFullYear()}
                          className={errors.year && touched.year ? "border-red-500" : ""}
                        />
                      )}
                    </Field>
                    <ErrorMessage name="year" component="p" className="text-sm text-red-500" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacity (tons) *</Label>
                    <Field name="capacity">
                      {({ field }) => (
                        <Input
                          {...field}
                          id="capacity"
                          type="number"
                          step="0.1"
                          className={errors.capacity && touched.capacity ? "border-red-500" : ""}
                        />
                      )}
                    </Field>
                    <ErrorMessage name="capacity" component="p" className="text-sm text-red-500" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fuelType">Fuel Type *</Label>
                    <Select onValueChange={(value) => setFieldValue("fuelType", value)} value={values.fuelType}>
                      <SelectTrigger className={errors.fuelType && touched.fuelType ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select fuel type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="diesel">Diesel</SelectItem>
                        <SelectItem value="petrol">Petrol</SelectItem>
                        <SelectItem value="cng">CNG</SelectItem>
                        <SelectItem value="electric">Electric</SelectItem>
                      </SelectContent>
                    </Select>
                    <ErrorMessage name="fuelType" component="p" className="text-sm text-red-500" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fleetOwner">Ownership Type *</Label>
                    <Select onValueChange={(value) => setFieldValue("fleetOwner", value)} value={values.fleetOwner}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select owner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Self Owned</SelectItem>
                        {fleetOwners?.data?.users?.map((owner) => (
                          <SelectItem key={owner._id} value={owner._id}>
                            {owner.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    <Select onValueChange={(value) => setFieldValue("status", value)} value={values.status}>
                      <SelectTrigger className={errors.status && touched.status ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="booked">Booked</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <ErrorMessage name="status" component="p" className="text-sm text-red-500" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Field name="description">
                    {({ field }) => (
                      <Textarea {...field} id="description" placeholder="Additional vehicle details..." rows={3} />
                    )}
                  </Field>
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || updateMutation.isLoading}>
                  {isSubmitting || updateMutation.isLoading ? "Updating..." : "Update Vehicle"}
                </Button>
              </DialogFooter>
            </Form>
          )}
        </Formik>
      </DialogContent>
    </Dialog>
  )
}
