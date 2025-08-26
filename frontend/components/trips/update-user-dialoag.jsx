"use client"
import { Formik, Form, Field, ErrorMessage } from "formik"
import * as Yup from "yup"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { User, Phone, Lock, MapPin } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { usersApi } from "@/lib/api"

// Validation schema (same as before)
const getUserSchema = () => Yup.object().shape({
  name: Yup.string().required("Name is required"),
  phone: Yup.string().required("Phone is required"),
  address: Yup.object().shape({
    street: Yup.string().optional(),
    city: Yup.string().optional(),
    state: Yup.string().optional(),
    pincode: Yup.string().optional().matches(/^\d{6}$/, "Pincode must be 6 digits")
  })
})

export function UpdateClientDialog({ open, onOpenChange, clientData, onSuccess }) {
  const queryClient = useQueryClient()

  const updateMutation = useMutation({
    mutationFn: data => usersApi.update(clientData._id, data), // assuming API is like usersApi.update(id, data)
    onSuccess: response => {
      queryClient.invalidateQueries(["users", "client"])
      toast.success("Client updated successfully")
      onSuccess?.(response.data)
      onOpenChange(false)
    },
    onError: error => {
      toast.error(error.response?.data?.message || "Failed to update client")
    }
  })

  const initialValues = clientData
    ? {
        name: clientData.name || "",
        phone: clientData.phone || "",
        address: {
          street: clientData.address?.street || "",
          city: clientData.address?.city || "",
          state: clientData.address?.state || "",
          pincode: clientData.address?.pincode || ""
        }
      }
    : {
        name: "",
        phone: "",
        address: {
          street: "",
          city: "",
          state: "",
          pincode: ""
        }
      }

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      await updateMutation.mutateAsync(values)
    } catch (error) {
      console.error("Failed to update client:", error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] h-[90vh] overflow-scroll">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Update Client
          </DialogTitle>
          <DialogDescription>
            Update client details here.
          </DialogDescription>
        </DialogHeader>

        <Formik
          initialValues={initialValues}
          validationSchema={getUserSchema()}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ isSubmitting, errors, touched }) => (
            <Form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Field name="name">
                    {({ field }) => (
                      <Input
                        {...field}
                        id="name"
                        placeholder="Enter full name"
                        className={`pl-10 ${errors.name && touched.name ? "border-red-500" : ""}`}
                      />
                    )}
                  </Field>
                </div>
                <ErrorMessage name="name" component="p" className="text-sm text-red-500" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Field name="phone">
                    {({ field }) => (
                      <Input
                        {...field}
                        id="phone"
                        placeholder="Enter phone number"
                        className={`pl-10 ${errors.phone && touched.phone ? "border-red-500" : ""}`}
                      />
                    )}
                  </Field>
                </div>
                <ErrorMessage name="phone" component="p" className="text-sm text-red-500" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address.street">Street</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Field name="address.street">
                    {({ field }) => <Input {...field} id="address.street" placeholder="Street Address" className="pl-10" />}
                  </Field>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address.city">City</Label>
                  <Field name="address.city">
                    {({ field }) => <Input {...field} id="address.city" placeholder="City" />}
                  </Field>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address.state">State</Label>
                  <Field name="address.state">
                    {({ field }) => <Input {...field} id="address.state" placeholder="State" />}
                  </Field>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address.pincode">Pincode</Label>
                <Field name="address.pincode">
                  {({ field }) => <Input {...field} id="address.pincode" placeholder="Pincode" />}
                </Field>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || updateMutation.isPending}>
                  {isSubmitting || updateMutation.isPending ? "Updating..." : "Update Client"}
                </Button>
              </DialogFooter>
            </Form>
          )}
        </Formik>
      </DialogContent>
    </Dialog>
  )
}
