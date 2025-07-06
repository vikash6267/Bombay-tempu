"use client"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { Formik, Form, Field, ErrorMessage } from "formik"
import * as Yup from "yup"
import { useState } from "react"
import { UserPlus } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { api } from "@/lib/api"
import toast from "react-hot-toast"
import { AddUserDialog } from "components/trips/add-user-dialog"

const vehicleSchema = Yup.object().shape({
  registrationNumber: Yup.string().required("Registration number is required"),
  vehicleType: Yup.string().required("Vehicle type is required"),
  capacity: Yup.number()
    .positive()
    .required("Capacity is required"),
  fuelType: Yup.string(),
  fleetOwner: Yup.string(),
  ownershipType: Yup.string().required(),
  owner: Yup.string().optional(),
  commissionRate: Yup.number()
    .min(0)
    .max(100)
    .optional(),
  hasLoan: Yup.boolean(),
  loanAmount: Yup.number().when("hasLoan", {
    is: true,
    then: schema => schema.positive().required("Loan amount is required"),
    otherwise: schema => schema.notRequired()
  }),
  emiAmount: Yup.number().when("hasLoan", {
    is: true,
    then: schema => schema.positive().required("EMI amount is required"),
    otherwise: schema => schema.notRequired()
  }),
  loanTenure: Yup.number().when("hasLoan", {
    is: true,
    then: schema => schema.positive().required("Loan tenure is required"),
    otherwise: schema => schema.notRequired()
  }),
  loanProvider: Yup.string().when("hasLoan", {
    is: true,
    then: schema => schema.required("Loan provider is required"),
    otherwise: schema => schema.notRequired()
  })
})

export function AddVehicleDialog({ open, onOpenChange, onSuccess }) {
  const queryClient = useQueryClient()
  const [ownershipType, setOwnershipType] = useState("self")
  const [showAddFleetOwner, setShowAddFleetOwner] = useState(false)

  const { data: fleetOwners, refetch: refetchFleetOwners } = useQuery({
    queryKey: ["fleet-owners"],
    queryFn: () => api.get("/users?role=fleet_owner"),
    enabled: open
  })

  const addMutation = useMutation({
    mutationFn: data => api.post("/vehicles", data),
    onSuccess: () => {
      queryClient.invalidateQueries(["vehicles"])
      toast.success("Vehicle added successfully")
      onSuccess?.()
      onOpenChange(false)
    },
    onError: error => {
      toast.error(error.response?.data?.message || "Failed to add vehicle")
    }
  })

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const vehicleData = { ...values }

      if (!values.hasLoan) {
        delete vehicleData.loanAmount
        delete vehicleData.emiAmount
        delete vehicleData.loanTenure
        delete vehicleData.loanProvider
        delete vehicleData.loanStartDate
      }

      await addMutation.mutateAsync(vehicleData)
      resetForm()
    } catch (error) {
      console.error("Failed to add vehicle:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleFleetOwnerAdded = () => {
    refetchFleetOwners()
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="min-w-[80vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Vehicle</DialogTitle>
            <DialogDescription>
              Add a new vehicle to your fleet
            </DialogDescription>
          </DialogHeader>

          <Formik
            initialValues={{
              registrationNumber: "",
              vehicleType: "",
              capacity: "",
              fuelType: "",
              ownershipType: "self",
              owner: "",
              commissionRate: "",
              description: "",
              hasLoan: false,
              loanAmount: "",
              emiAmount: "",
              loanTenure: "",
              loanProvider: "",
              loanStartDate: ""
            }}
            validationSchema={vehicleSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, errors, touched, setFieldValue, values }) => (
              <Form>
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="basic">Basic Details</TabsTrigger>
                    <TabsTrigger value="loan">Loan Details</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="registrationNumber">
                          Registration Number *
                        </Label>
                        <Field name="registrationNumber">
                          {({ field }) => (
                            <Input
                              {...field}
                              id="registrationNumber"
                              placeholder="e.g., MH12AB1234"
                              className={
                                errors.registrationNumber &&
                                touched.registrationNumber
                                  ? "border-red-500"
                                  : ""
                              }
                            />
                          )}
                        </Field>
                        <ErrorMessage
                          name="registrationNumber"
                          component="p"
                          className="text-sm text-red-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="vehicleType">Vehicle Type *</Label>
                        <Select
                          onValueChange={value =>
                            setFieldValue("vehicleType", value)
                          }
                          value={values.vehicleType}
                        >
                          <SelectTrigger
                            className={
                              errors.vehicleType && touched.vehicleType
                                ? "border-red-500"
                                : ""
                            }
                          >
                            <SelectValue placeholder="Select vehicle type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="truck">Truck</SelectItem>
                            <SelectItem value="mini_truck">
                              Mini Truck / LCV
                            </SelectItem>
                            <SelectItem value="container">Container</SelectItem>
                            <SelectItem value="closed_container">
                              Closed Container
                            </SelectItem>
                            <SelectItem value="open_body">
                              Open Body Truck
                            </SelectItem>
                            <SelectItem value="trailer">Trailer</SelectItem>
                            <SelectItem value="tipper">Tipper</SelectItem>
                            <SelectItem value="tanker">Tanker</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <ErrorMessage
                          name="vehicleType"
                          component="p"
                          className="text-sm text-red-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="ownershipType">Ownership Type *</Label>
                        <Select
                          onValueChange={value => {
                            setFieldValue("ownershipType", value)
                            setOwnershipType(value)
                          }}
                          value={values.ownershipType}
                        >
                          <SelectTrigger
                            className={
                              errors.ownershipType ? "border-destructive" : ""
                            }
                          >
                            <SelectValue placeholder="Select ownership type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="self">
                              Self Owned (Admin)
                            </SelectItem>
                            <SelectItem value="fleet_owner">
                              Fleet Owner
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.ownershipType && (
                          <p className="text-sm text-destructive mt-1">
                            {errors.ownershipType}
                          </p>
                        )}
                      </div>

                      {ownershipType === "fleet_owner" && (
                        <div className="space-y-2">
                          <Label htmlFor="owner">Fleet Owner *</Label>
                          <Select
                            onValueChange={value => {
                              if (value === "add_new") {
                                setShowAddFleetOwner(true)
                                return
                              }
                              setFieldValue("owner", value)
                            }}
                            value={values.owner}
                          >
                            <SelectTrigger
                              className={
                                errors.owner && touched.owner
                                  ? "border-red-500"
                                  : ""
                              }
                            >
                              <SelectValue placeholder="Select fleet owner" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="add_new">
                                <div className="flex items-center gap-2 text-primary font-medium">
                                  <UserPlus className="h-4 w-4" />
                                  Add New Fleet Owner
                                </div>
                              </SelectItem>
                              <Separator className="my-1" />
                              {fleetOwners?.data?.data?.users?.map(owner => (
                                <SelectItem key={owner._id} value={owner._id}>
                                  <div className="flex flex-col">
                                    <span>{owner.name}</span>
                                    <span className="text-sm text-gray-500">
                                      {owner.email}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <ErrorMessage
                            name="owner"
                            component="p"
                            className="text-sm text-red-500"
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="capacity">Capacity (tons) *</Label>
                        <Field name="capacity">
                          {({ field }) => (
                            <Input
                              {...field}
                              id="capacity"
                              type="number"
                              step="0.1"
                              placeholder="e.g., 3.5"
                              className={
                                errors.capacity && touched.capacity
                                  ? "border-red-500"
                                  : ""
                              }
                            />
                          )}
                        </Field>
                        <ErrorMessage
                          name="capacity"
                          component="p"
                          className="text-sm text-red-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Field name="description">
                        {({ field }) => (
                          <Textarea
                            {...field}
                            id="description"
                            placeholder="Additional vehicle details..."
                            rows={3}
                          />
                        )}
                      </Field>
                    </div>
                  </TabsContent>

                  <TabsContent value="loan" className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Field name="hasLoan">
                        {({ field }) => (
                          <input
                            {...field}
                            id="hasLoan"
                            type="checkbox"
                            checked={values.hasLoan}
                            onChange={e =>
                              setFieldValue("hasLoan", e.target.checked)
                            }
                            className="rounded border-gray-300"
                          />
                        )}
                      </Field>
                      <Label htmlFor="hasLoan">This vehicle has a loan</Label>
                    </div>

                    {values.hasLoan && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="loanAmount">Loan Amount *</Label>
                          <Field name="loanAmount">
                            {({ field }) => (
                              <Input
                                {...field}
                                id="loanAmount"
                                type="number"
                                placeholder="e.g., 500000"
                                className={
                                  errors.loanAmount && touched.loanAmount
                                    ? "border-red-500"
                                    : ""
                                }
                              />
                            )}
                          </Field>
                          <ErrorMessage
                            name="loanAmount"
                            component="p"
                            className="text-sm text-red-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="emiAmount">EMI Amount *</Label>
                          <Field name="emiAmount">
                            {({ field }) => (
                              <Input
                                {...field}
                                id="emiAmount"
                                type="number"
                                placeholder="e.g., 15000"
                                className={
                                  errors.emiAmount && touched.emiAmount
                                    ? "border-red-500"
                                    : ""
                                }
                              />
                            )}
                          </Field>
                          <ErrorMessage
                            name="emiAmount"
                            component="p"
                            className="text-sm text-red-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="loanTenure">
                            Loan Tenure (months) *
                          </Label>
                          <Field name="loanTenure">
                            {({ field }) => (
                              <Input
                                {...field}
                                id="loanTenure"
                                type="number"
                                placeholder="e.g., 60"
                                className={
                                  errors.loanTenure && touched.loanTenure
                                    ? "border-red-500"
                                    : ""
                                }
                              />
                            )}
                          </Field>
                          <ErrorMessage
                            name="loanTenure"
                            component="p"
                            className="text-sm text-red-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="loanProvider">Loan Provider *</Label>
                          <Field name="loanProvider">
                            {({ field }) => (
                              <Input
                                {...field}
                                id="loanProvider"
                                placeholder="e.g., SBI, HDFC Bank"
                                className={
                                  errors.loanProvider && touched.loanProvider
                                    ? "border-red-500"
                                    : ""
                                }
                              />
                            )}
                          </Field>
                          <ErrorMessage
                            name="loanProvider"
                            component="p"
                            className="text-sm text-red-500"
                          />
                        </div>

                        <div className="space-y-2 col-span-2">
                          <Label htmlFor="loanStartDate">Loan Start Date</Label>
                          <Field name="loanStartDate">
                            {({ field }) => (
                              <Input
                                {...field}
                                id="loanStartDate"
                                type="date"
                              />
                            )}
                          </Field>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                <DialogFooter className="mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || addMutation.isPending}
                  >
                    {isSubmitting || addMutation.isPending
                      ? "Adding..."
                      : "Add Vehicle"}
                  </Button>
                </DialogFooter>
              </Form>
            )}
          </Formik>
        </DialogContent>
      </Dialog>

      {/* Add Fleet Owner Dialog */}
      <AddUserDialog
        open={showAddFleetOwner}
        onOpenChange={setShowAddFleetOwner}
        userType="fleet_owner"
        onSuccess={handleFleetOwnerAdded}
      />
    </>
  )
}
