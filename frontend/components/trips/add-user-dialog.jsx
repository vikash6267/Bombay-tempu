"use client"
import { Formik, Form, Field, ErrorMessage } from "formik"
import * as Yup from "yup"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { User, Mail, Phone, Lock } from "lucide-react"

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

const userSchema = Yup.object().shape({
  name: Yup.string().required("Name is required"),
  email: Yup.string()
    .email("Invalid email")
    .required("Email is required"),
  phone: Yup.string().required("Phone is required"),
  role: Yup.string().required("Role is required")
})

export function AddUserDialog({ open, onOpenChange, userType, onSuccess }) {
  const queryClient = useQueryClient()

  const addMutation = useMutation({
    mutationFn: data => usersApi.create(data),
    onSuccess: response => {
      // Invalidate relevant queries
      queryClient.invalidateQueries([
        "users",
        userType === "fleet_owner" ? "fleet_owner" : userType
      ])
      queryClient.invalidateQueries(["users"])

      toast.success(`${getUserTypeLabel(userType)} added successfully`)
      onSuccess?.(response.data)
      onOpenChange(false)
    },
    onError: error => {
      toast.error(
        error.response?.data?.message ||
          `Failed to add ${getUserTypeLabel(userType)}`
      )
    }
  })

  const getUserTypeLabel = type => {
    switch (type) {
      case "driver":
        return "Driver"
      case "client":
        return "Client"
      case "fleet_owner":
        return "Fleet Owner"
      default:
        return "User"
    }
  }

  const timestamp = Date.now()
  const getInitialValues = () => ({
    name: "",
    email: `noreply${timestamp}@gmail.com`,  // <-- change domain as needed
    phone: "",
    password: "12345678",
    role: userType
  })

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      await addMutation.mutateAsync(values)
      resetForm()
    } catch (error) {
      console.error(`Failed to add ${userType}:`, error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Add New {getUserTypeLabel(userType)}
          </DialogTitle>
          <DialogDescription>
            Create a new {getUserTypeLabel(userType).toLowerCase()} account with
            default password.
          </DialogDescription>
        </DialogHeader>

        <Formik
          initialValues={getInitialValues()}
          validationSchema={userSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, errors, touched, setFieldValue, values }) => (
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
                        className={`pl-10 ${
                          errors.name && touched.name ? "border-red-500" : ""
                        }`}
                      />
                    )}
                  </Field>
                </div>
                <ErrorMessage
                  name="name"
                  component="p"
                  className="text-sm text-red-500"
                />
              </div>

              {/* <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Field name="email">
                    {({ field }) => (
                      <Input
                        {...field}
                        id="email"
                        type="email"
                        placeholder="Enter email address"
                        className={`pl-10 ${
                          errors.email && touched.email ? "border-red-500" : ""
                        }`}
                      />
                    )}
                  </Field>
                </div>
                <ErrorMessage
                  name="email"
                  component="p"
                  className="text-sm text-red-500"
                />
              </div> */}

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
                        className={`pl-10 ${
                          errors.phone && touched.phone ? "border-red-500" : ""
                        }`}
                      />
                    )}
                  </Field>
                </div>
                <ErrorMessage
                  name="phone"
                  component="p"
                  className="text-sm text-red-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Default Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="text"
                    value="12345678"
                    disabled
                    className="pl-10 bg-muted"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Default password will be set to "12345678"
                </p>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || addMutation.isPending}
                >
                  {isSubmitting || addMutation.isPending
                    ? "Adding..."
                    : `Add ${getUserTypeLabel(userType)}`}
                </Button>
              </DialogFooter>
            </Form>
          )}
        </Formik>
      </DialogContent>
    </Dialog>
  )
}
