"use client"

import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { Formik, Form, Field, ErrorMessage } from "formik"
import * as Yup from "yup"
import { useState } from "react"
import { UserPlus, Calculator } from "lucide-react"
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
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { api } from "@/lib/api"
import toast from "react-hot-toast"
import { AddUserDialog } from "components/trips/add-user-dialog"

const vehicleSchema = Yup.object().shape({
  registrationNumber: Yup.string().required("Registration number is required"),
  vehicleType: Yup.string().required("Vehicle type is required"),
  capacity: Yup.number().positive().required("Capacity is required"),
  fuelType: Yup.string(),
  fleetOwner: Yup.string(),
  ownershipType: Yup.string().required(),
  owner: Yup.string().optional(),
  commissionRate: Yup.number().min(0).max(100).optional(),
  hasLoan: Yup.boolean(),
  loanAmount: Yup.number().when("hasLoan", {
    is: true,
    then: (schema) => schema.positive().required("Loan amount is required"),
    otherwise: (schema) => schema.notRequired(),
  }),
  emiAmount: Yup.number().when("hasLoan", {
    is: true,
    then: (schema) => schema.positive().required("EMI amount is required"),
    otherwise: (schema) => schema.notRequired(),
  }),
  loanTenure: Yup.number().when("hasLoan", {
    is: true,
    then: (schema) => schema.positive().required("Loan tenure is required"),
    otherwise: (schema) => schema.notRequired(),
  }),
  loanProvider: Yup.string().when("hasLoan", {
    is: true,
    then: (schema) => schema.required("Loan provider is required"),
    otherwise: (schema) => schema.notRequired(),
  }),
})

export function AddEditVehicleDialog({ open, onOpenChange, vehicle = null, mode = "add", onSuccess }) {
  const queryClient = useQueryClient()
  const [ownershipType, setOwnershipType] = useState("self")
  const [showAddFleetOwner, setShowAddFleetOwner] = useState(false)
  const isEditMode = mode === "edit" && vehicle

  const { data: fleetOwners, refetch: refetchFleetOwners } = useQuery({
    queryKey: ["fleet-owners"],
    queryFn: () => api.get("/users?role=fleet_owner"),
    enabled: open,
  })

  const addMutation = useMutation({
    mutationFn: (data) => api.post("/vehicles", data),
    onSuccess: () => {
      queryClient.invalidateQueries(["vehicles"])
      toast.success("Vehicle added successfully")
      onSuccess?.()
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to add vehicle")
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data) => api.patch(`/vehicles/${vehicle?._id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["vehicles"])
      toast.success("Vehicle updated successfully")
      onSuccess?.()
      // onOpenChange(false)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update vehicle")
    },
  })

   

  const calculateLoanDetails = (loanAmount, emiAmount, loanTenure, loanStartDate) => {
    if (!loanAmount || !emiAmount || !loanTenure || !loanStartDate) {
      return null
    }

    const startDate = new Date(loanStartDate)
    const currentDate = new Date()

    const elapsedMonths = Math.max(
      0,
      (currentDate.getFullYear() - startDate.getFullYear()) * 12 + (currentDate.getMonth() - startDate.getMonth()),
    )

    const totalPaid = Math.min(elapsedMonths * Number.parseFloat(emiAmount), Number.parseFloat(loanAmount))
    const remainingAmount = Math.max(0, Number.parseFloat(loanAmount) - totalPaid)
    const remainingMonths = Math.max(0, Number.parseInt(loanTenure) - elapsedMonths)
    const completionPercentage = (totalPaid / Number.parseFloat(loanAmount)) * 100

    return {
      elapsedMonths,
      totalPaid,
      remainingAmount,
      remainingMonths,
      completionPercentage: Math.min(100, completionPercentage),
    }
  }

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

      if (isEditMode) {
        await updateMutation.mutateAsync(vehicleData)
      } else {
        await addMutation.mutateAsync(vehicleData)
      }

      if (!isEditMode) {
        resetForm()
      }
    } catch (error) {
      console.error(`Failed to ${isEditMode ? "update" : "add"} vehicle:`, error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleFleetOwnerAdded = () => {
    refetchFleetOwners()
  }

  const loanDetails = (values) =>
    calculateLoanDetails(values.loanAmount, values.emiAmount, values.loanTenure, values.loanStartDate)

  const initialValues = {
    registrationNumber: vehicle?.registrationNumber || "",
    vehicleType: vehicle?.vehicleType || "",
    capacity: vehicle?.capacity || "",
    fuelType: vehicle?.fuelType || "",
    ownershipType: vehicle?.ownershipType || "self",
    owner: vehicle?.owner?._id || "",
    commissionRate: vehicle?.commissionRate || "",
    description: vehicle?.description || "",
    hasLoan: vehicle?.loanDetails?.hasLoan || false,
    loanAmount: vehicle?.loanDetails?.loanAmount || "",
    emiAmount: vehicle?.loanDetails?.emiAmount || "",
    loanTenure: vehicle?.loanDetails?.loanTenure || "",
    loanProvider: vehicle?.loanDetails?.loanProvider || "",
    loanStartDate: vehicle?.loanDetails?.loanStartDate
      ? new Date(vehicle.loanDetails.loanStartDate).toISOString().split("T")[0]
      : "",
    engineNumber: vehicle?.papers?.engineNo || "",
    chassisNumber: vehicle?.papers?.chassisNo || "",
    modelName: vehicle?.papers?.modelName || "",
    registrationDate: vehicle?.papers?.registrationDate
      ? new Date(vehicle.papers.registrationDate).toISOString().split("T")[0]
      : "",
    fitnessDate: vehicle?.papers?.fitnessDate ? new Date(vehicle.papers.fitnessDate).toISOString().split("T")[0] : "",
    taxDate: vehicle?.papers?.taxDate ? new Date(vehicle.papers.taxDate).toISOString().split("T")[0] : "",
    insuranceDate: vehicle?.papers?.insuranceDate
      ? new Date(vehicle.papers.insuranceDate).toISOString().split("T")[0]
      : "",
    puccDate: vehicle?.papers?.puccDate ? new Date(vehicle.papers.puccDate).toISOString().split("T")[0] : "",
    permitDate: vehicle?.papers?.permitDate ? new Date(vehicle.papers.permitDate).toISOString().split("T")[0] : "",
    nationalPermitDate: vehicle?.papers?.nationalPermitDate
      ? new Date(vehicle.papers.nationalPermitDate).toISOString().split("T")[0]
      : "",
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="min-w-[80vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit Vehicle" : "Add New Vehicle"}</DialogTitle>
            <DialogDescription>
              {isEditMode ? "Update vehicle information" : "Add a new vehicle to your fleet"}
            </DialogDescription>
          </DialogHeader>

          <Formik
            initialValues={initialValues}
            validationSchema={vehicleSchema}
            onSubmit={handleSubmit}
            enableReinitialize={true}
          >
            {({ isSubmitting, errors, touched, setFieldValue, values }) => {
              return (
                <Form>
                  <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="basic">Basic Details</TabsTrigger>
                      <TabsTrigger value="loan">Loan Details</TabsTrigger>
                      <TabsTrigger value="papers">Papers</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="registrationNumber">Registration Number *</Label>
                          <Field name="registrationNumber">
                            {({ field }) => (
                              <Input
                                {...field}
                                id="registrationNumber"
                                placeholder="e.g., MH12AB1234"
                                className={
                                  errors.registrationNumber && touched.registrationNumber ? "border-red-500" : ""
                                }
                              />
                            )}
                          </Field>
                          <ErrorMessage name="registrationNumber" component="p" className="text-sm text-red-500" />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="vehicleType">Vehicle Type *</Label>
                          <Select
                            onValueChange={(value) => setFieldValue("vehicleType", value)}
                            value={values.vehicleType}
                          >
                            <SelectTrigger
                              className={errors.vehicleType && touched.vehicleType ? "border-red-500" : ""}
                            >
                              <SelectValue placeholder="Select vehicle type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="truck">Truck</SelectItem>
                              <SelectItem value="mini_truck">Mini Truck / LCV</SelectItem>
                              <SelectItem value="container">Container</SelectItem>
                              <SelectItem value="closed_container">Closed Container</SelectItem>
                              <SelectItem value="open_body">Open Body Truck</SelectItem>
                              <SelectItem value="trailer">Trailer</SelectItem>
                              <SelectItem value="tipper">Tipper</SelectItem>
                              <SelectItem value="tanker">Tanker</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <ErrorMessage name="vehicleType" component="p" className="text-sm text-red-500" />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="ownershipType">Ownership Type *</Label>
                          <Select
                            onValueChange={(value) => {
                              setFieldValue("ownershipType", value)
                              setOwnershipType(value)
                            }}
                            value={values.ownershipType}
                          >
                            <SelectTrigger className={errors.ownershipType ? "border-destructive" : ""}>
                              <SelectValue placeholder="Select ownership type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="self">Self Owned (Admin)</SelectItem>
                              <SelectItem value="fleet_owner">Fleet Owner</SelectItem>
                            </SelectContent>
                          </Select>
                          {errors.ownershipType && (
                            <p className="text-sm text-destructive mt-1">{errors.ownershipType}</p>
                          )}
                        </div>

                        {ownershipType === "fleet_owner" && (
                          <div className="space-y-2">
                            <Label htmlFor="owner">Fleet Owner *</Label>
                            <Select
                              onValueChange={(value) => {
                                if (value === "add_new") {
                                  setShowAddFleetOwner(true)
                                  return
                                }
                                setFieldValue("owner", value)
                              }}
                              value={values.owner}
                            >
                              <SelectTrigger className={errors.owner && touched.owner ? "border-red-500" : ""}>
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
                                {fleetOwners?.data?.data?.users?.map((owner) => (
                                  <SelectItem key={owner._id} value={owner._id}>
                                    <div className="flex flex-col">
                                      <span>{owner.name}</span>
                                      <span className="text-sm text-gray-500">{owner.email}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <ErrorMessage name="owner" component="p" className="text-sm text-red-500" />
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
                                className={errors.capacity && touched.capacity ? "border-red-500" : ""}
                              />
                            )}
                          </Field>
                          <ErrorMessage name="capacity" component="p" className="text-sm text-red-500" />
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
                              onChange={(e) => setFieldValue("hasLoan", e.target.checked)}
                              className="rounded border-gray-300"
                            />
                          )}
                        </Field>
                        <Label htmlFor="hasLoan">This vehicle has a loan</Label>
                      </div>

                      {values.hasLoan && (
                        <>
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
                                    className={errors.loanAmount && touched.loanAmount ? "border-red-500" : ""}
                                  />
                                )}
                              </Field>
                              <ErrorMessage name="loanAmount" component="p" className="text-sm text-red-500" />
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
                                    className={errors.emiAmount && touched.emiAmount ? "border-red-500" : ""}
                                  />
                                )}
                              </Field>
                              <ErrorMessage name="emiAmount" component="p" className="text-sm text-red-500" />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="loanTenure">Loan Tenure (months) *</Label>
                              <Field name="loanTenure">
                                {({ field }) => (
                                  <Input
                                    {...field}
                                    id="loanTenure"
                                    type="number"
                                    placeholder="e.g., 60"
                                    className={errors.loanTenure && touched.loanTenure ? "border-red-500" : ""}
                                  />
                                )}
                              </Field>
                              <ErrorMessage name="loanTenure" component="p" className="text-sm text-red-500" />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="loanProvider">Loan Provider *</Label>
                              <Field name="loanProvider">
                                {({ field }) => (
                                  <Input
                                    {...field}
                                    id="loanProvider"
                                    placeholder="e.g., SBI, HDFC Bank"
                                    className={errors.loanProvider && touched.loanProvider ? "border-red-500" : ""}
                                  />
                                )}
                              </Field>
                              <ErrorMessage name="loanProvider" component="p" className="text-sm text-red-500" />
                            </div>

                            <div className="space-y-2 col-span-2">
                              <Label htmlFor="loanStartDate">Loan Start Date</Label>
                              <Field name="loanStartDate">
                                {({ field }) => <Input {...field} id="loanStartDate" type="date" />}
                              </Field>
                            </div>
                          </div>

                          {loanDetails(values) && (
                            <Card className="mt-4">
                              <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                  <Calculator className="h-5 w-5" />
                                  Loan Calculator
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                                    <p className="text-sm text-gray-600">Elapsed Months</p>
                                    <p className="text-xl font-bold text-blue-600">
                                      {loanDetails(values).elapsedMonths}
                                    </p>
                                  </div>
                                  <div className="text-center p-3 bg-green-50 rounded-lg">
                                    <p className="text-sm text-gray-600">Total Paid</p>
                                    <p className="text-xl font-bold text-green-600">
                                      ₹{loanDetails(values).totalPaid.toLocaleString("en-IN")}
                                    </p>
                                  </div>
                                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                                    <p className="text-sm text-gray-600">Remaining Amount</p>
                                    <p className="text-xl font-bold text-orange-600">
                                      ₹{loanDetails(values).remainingAmount.toLocaleString("en-IN")}
                                    </p>
                                  </div>
                                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                                    <p className="text-sm text-gray-600">Remaining Months</p>
                                    <p className="text-xl font-bold text-purple-600">
                                      {loanDetails(values).remainingMonths}
                                    </p>
                                  </div>
                                </div>
                                <div className="mt-4">
                                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                                    <span>Loan Progress</span>
                                    <span>{loanDetails(values).completionPercentage.toFixed(1)}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                                      style={{ width: `${loanDetails(values).completionPercentage}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </>
                      )}
                    </TabsContent>

                    <TabsContent value="papers" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="engineNumber">Engine Number</Label>
                          <Field name="engineNumber">
                            {({ field }) => <Input {...field} id="engineNumber" placeholder="e.g., ENG123456789" />}
                          </Field>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="chassisNumber">Chassis Number</Label>
                          <Field name="chassisNumber">
                            {({ field }) => <Input {...field} id="chassisNumber" placeholder="e.g., CHS987654321" />}
                          </Field>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="modelName">Model Name</Label>
                          <Field name="modelName">
                            {({ field }) => <Input {...field} id="modelName" placeholder="e.g., Tata LPT 1613" />}
                          </Field>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="registrationDate">Registration Date</Label>
                          <Field name="registrationDate">
                            {({ field }) => <Input {...field} id="registrationDate" type="date" />}
                          </Field>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="fitnessDate">Fitness Date</Label>
                          <Field name="fitnessDate">
                            {({ field }) => <Input {...field} id="fitnessDate" type="date" />}
                          </Field>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="taxDate">Tax Date</Label>
                          <Field name="taxDate">{({ field }) => <Input {...field} id="taxDate" type="date" />}</Field>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="insuranceDate">Insurance Date</Label>
                          <Field name="insuranceDate">
                            {({ field }) => <Input {...field} id="insuranceDate" type="date" />}
                          </Field>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="puccDate">PUCC Date</Label>
                          <Field name="puccDate">{({ field }) => <Input {...field} id="puccDate" type="date" />}</Field>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="permitDate">Permit Date</Label>
                          <Field name="permitDate">
                            {({ field }) => <Input {...field} id="permitDate" type="date" />}
                          </Field>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="nationalPermitDate">National Permit Date</Label>
                          <Field name="nationalPermitDate">
                            {({ field }) => <Input {...field} id="nationalPermitDate" type="date" />}
                          </Field>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <DialogFooter className="mt-6">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting || addMutation.isPending || updateMutation.isPending}>
                      {isSubmitting || addMutation.isPending || updateMutation.isPending
                        ? isEditMode
                          ? "Updating..."
                          : "Adding..."
                        : isEditMode
                          ? "Update Vehicle"
                          : "Add Vehicle"}
                    </Button>
                  </DialogFooter>
                </Form>
              )
            }}
          </Formik>
        </DialogContent>
      </Dialog>

      <AddUserDialog
        open={showAddFleetOwner}
        onOpenChange={setShowAddFleetOwner}
        userType="fleet_owner"
        onSuccess={handleFleetOwnerAdded}
      />
    </>
  )
}
