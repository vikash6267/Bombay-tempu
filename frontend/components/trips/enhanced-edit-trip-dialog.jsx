"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { Formik, Form, FieldArray } from "formik"
import * as Yup from "yup"
import { useQuery } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { Plus, Minus, Truck, UserPlus, Calculator, TrendingUp, TrendingDown, Edit } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import CitySelect from "./CitySelect"
import { tripsApi, usersApi, vehiclesApi } from "@/lib/api"
import { getErrorMessage } from "@/lib/utils"
import { useSelector } from "react-redux"
import { AddEditVehicleDialog } from "components/vehicles/add-vehicle-dialog"
import { AddUserDialog } from "./add-user-dialog"
import CommissionSelector from "./CommissionSelector"

const createTripValidationSchema = (selectedVehicle) => {
  const isSelfOwned = selectedVehicle?.ownershipType === "self"
  return Yup.object({
    clients: Yup.array()
      .of(
        Yup.object({
          client: Yup.string().required("Client is required"),
          loadDetails: Yup.object({
            description: Yup.string().optional(),
            weight: Yup.number(),
            quantity: Yup.number().min(1, "Quantity must be at least 1").required("Quantity is required"),
            loadType: Yup.string(),
            packagingType: Yup.string().required(),
            specialInstructions: Yup.string(),
          }),
          origin: Yup.object({
            city: Yup.string().required("Origin city is required"),
            state: Yup.string().required("Origin state is required"),
            pincode: Yup.string().required("Origin pincode is required"),
          }),
          destination: Yup.object({
            city: Yup.string().required("Destination city is required"),
            state: Yup.string().required("Destination state is required"),
            pincode: Yup.string().required("Destination pincode is required"),
          }),
          rate: Yup.number().min(1, "Rate is required").required("Rate is required"),
          commission: Yup.number().optional().default(0),
          truckHireCost: Yup.number().required("Truck Hire Cost Required").default(0),
          argestment: Yup.number().optional().default(0),
          loadDate: Yup.string().required("Load date is required"),
        }),
      )
      .min(1, "At least one client is required"),
    vehicle: Yup.string().required("Vehicle is required"),
    driver: Yup.string().optional(),
    scheduledDate: Yup.string().required("Scheduled date is required"),
    estimatedDuration: Yup.number().min(1).nullable(),
    estimatedDistance: Yup.number().min(1).nullable(),
    specialInstructions: Yup.string(),
    podBalance: isSelfOwned
      ? Yup.number().optional()
      : Yup.number().required("POD Balance is required for non-self owned vehicles"),
    rate: isSelfOwned ? Yup.number().optional() : Yup.number().required("Rate is required for non-self owned vehicles"),
    commission: isSelfOwned
      ? Yup.number().optional()
      : Yup.number().required("Commission is required for non-self owned vehicles"),
  })
}

const getInitialValues = (editingTrip = null) => {
  if (editingTrip) {
    // Format dates for datetime-local input
    const formatDateForInput = (dateString) => {
      if (!dateString) return ""
      const date = new Date(dateString)
      return date.toISOString().slice(0, 16)
    }

    return {
      clients: editingTrip.clients?.map((client) => ({
        client: typeof client.client === "object" ? client.client._id : client.client,
        loadDetails: {
          description: client.loadDetails?.description || "NA",
          weight: client.loadDetails?.weight || 0,
          quantity: client.loadDetails?.quantity || 1,
          loadType: client.loadDetails?.loadType || "general",
          packagingType: client.loadDetails?.packagingType || "boxes",
          specialInstructions: client.loadDetails?.specialInstructions || "",
        },
        rate: client.rate || 0,
        commission: client.commission || 0,
        truckHireCost: client.truckHireCost || 0,
        argestment: client.argestment || 0,
        origin: {
          city: client.origin?.city || "",
          state: client.origin?.state || "",
          pincode: client.origin?.pincode || "",
        },
        destination: {
          city: client.destination?.city || "",
          state: client.destination?.state || "",
          pincode: client.destination?.pincode || "",
        },
        contactPerson: {
          loading: {
            name: client.contactPerson?.loading?.name || "",
            phone: client.contactPerson?.loading?.phone || "",
          },
          unloading: {
            name: client.contactPerson?.unloading?.name || "",
            phone: client.contactPerson?.unloading?.phone || "",
          },
        },
        loadDate: formatDateForInput(client.loadDate),
      })) || [
        {
          client: "",
          loadDetails: {
            description: "NA",
            weight: 0,
            quantity: 1,
            loadType: "general",
            packagingType: "boxes",
            specialInstructions: "",
          },
          rate: 0,
          commission: 0,
          truckHireCost: 0,
          argestment: 0,
          origin: { city: "", state: "", pincode: "" },
          destination: { city: "", state: "", pincode: "" },
          contactPerson: {
            loading: { name: "", phone: "" },
            unloading: { name: "", phone: "" },
          },
          loadDate: new Date().toISOString().slice(0, 16),
        },
      ],
      vehicle: typeof editingTrip.vehicle === "object" ? editingTrip.vehicle._id : editingTrip.vehicle || "",
      driver: typeof editingTrip.driver === "object" ? editingTrip.driver._id : editingTrip.driver || "",
      origin: {
        address: editingTrip.origin?.address || "",
        city: editingTrip.origin?.city || "",
        state: editingTrip.origin?.state || "",
        pincode: editingTrip.origin?.pincode || "",
      },
      destination: {
        address: editingTrip.destination?.address || "",
        city: editingTrip.destination?.city || "",
        state: editingTrip.destination?.state || "",
        pincode: editingTrip.destination?.pincode || "",
      },
      scheduledDate: formatDateForInput(editingTrip.scheduledDate),
      estimatedDuration: editingTrip.estimatedDuration || undefined,
      estimatedDistance: editingTrip.estimatedDistance || undefined,
      specialInstructions: editingTrip.specialInstructions || "",
      podBalance: editingTrip.podBalance || 0,
      rate: editingTrip.rate || 0,
      commission: editingTrip.commission || 0,
    }
  }

  // Default values for new trip
  return {
    clients: [
      {
        client: "",
        loadDetails: {
          description: "NA",
          weight: 0,
          quantity: 1,
          loadType: "general",
          packagingType: "boxes",
          specialInstructions: "",
        },
        rate: 0,
        commission: 0,
        truckHireCost: 0,
        argestment: 0,
        origin: { city: "", state: "", pincode: "" },
        destination: { city: "", state: "", pincode: "" },
        contactPerson: {
          loading: { name: "", phone: "" },
          unloading: { name: "", phone: "" },
        },
        loadDate: new Date().toISOString().slice(0, 16),
      },
    ],
    vehicle: "",
    driver: "",
    origin: {
      address: "",
      city: "",
      state: "",
      pincode: "",
    },
    destination: {
      address: "",
      city: "",
      state: "",
      pincode: "",
    },
    scheduledDate: "",
    estimatedDuration: undefined,
    estimatedDistance: undefined,
    specialInstructions: "",
    podBalance: 0,
    rate: 0,
    commission: 0,
  }
}

const defaultOptions = [
  { value: "boxes", label: "Boxes" },
  { value: "bags", label: "Bags" },
  { value: "loose", label: "Loose" },
  { value: "pallets", label: "Pallets" },
  { value: "containers", label: "Containers" },
  { value: "add_new", label: "➕ Add New" },
]

const PackagingTypeSelect = ({ value, onChange, error }) => {
  const [customValue, setCustomValue] = useState("")

  useEffect(() => {
    if (!defaultOptions.find((opt) => opt.value === value)) {
      setCustomValue(value || "")
    }
  }, [value])

  const handleChange = (val) => {
    if (val === "add_new") {
      onChange("")
    } else {
      onChange(val)
      setCustomValue("")
    }
  }

  return (
    <div>
      <Label>Packaging *</Label>
      <Select value={value && !customValue ? value : "add_new"} onValueChange={handleChange}>
        <SelectTrigger className={error ? "border-red-500" : ""}>
          <SelectValue placeholder="Select packaging" />
        </SelectTrigger>
        <SelectContent>
          {defaultOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value === "" || customValue ? (
        <div className="mt-2">
          <Input
            placeholder="Enter custom packaging type"
            value={customValue}
            onChange={(e) => {
              const val = e.target.value
              setCustomValue(val)
              onChange(val)
            }}
          />
        </div>
      ) : null}
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  )
}

// Calculation Summary Component
const CalculationSummary = ({ clients, overallRate, isSelfOwned, overallTripCommission }) => {
  const calculations = useMemo(() => {
    let totalClientRevenue = 0
    let totalTruckHireExpenses = 0
    let totalAdjustments = 0

    const parsedOverallTripCommission = Number(overallTripCommission) || 0

    const clientBreakdown = clients.map((client) => {
      const clientRate = Number(client.rate) || 0
      const truckHireCost = Number(client.truckHireCost) || 0
      const argestment = Number(client.argestment) || 0

      totalClientRevenue += clientRate
      totalTruckHireExpenses += truckHireCost
      totalAdjustments += argestment

      const pendingAmount = clientRate - truckHireCost - argestment
      const profit = pendingAmount

      return {
        clientRate,
        truckHireCost,
        argestment,
        pendingAmount,
        profit,
      }
    })

    let overallTripProfit = 0
    if (isSelfOwned) {
      overallTripProfit = totalClientRevenue - totalTruckHireExpenses - totalAdjustments + parsedOverallTripCommission
    } else {
      const parsedOverallRate = Number(overallRate) || 0
      overallTripProfit = totalClientRevenue - parsedOverallRate - totalAdjustments + parsedOverallTripCommission
    }

    return {
      clientBreakdown,
      totalClientRevenue,
      totalTruckHireExpenses,
      totalAdjustments,
      overallTripProfit,
      parsedOverallTripCommission,
    }
  }, [clients, overallRate, isSelfOwned, overallTripCommission])

  return (
    <Card className="border-2 border-blue-200 bg-blue-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-700">
          <Calculator className="h-5 w-5" />
          Profit & Loss Calculation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Individual Client Calculations */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-gray-700">Individual Client Profit/Loss Breakdown:</h4>
          {calculations.clientBreakdown.map((client, index) => (
            <div key={index} className="flex flex-wrap items-center justify-between p-2 bg-white rounded border">
              <span className="text-sm font-medium">Client #{index + 1}</span>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span>Rate: ₹{client.clientRate.toLocaleString()}</span>
                <span>Hire Cost: ₹{client.truckHireCost.toLocaleString()}</span>
                <span>Adjustment: ₹{client.argestment.toLocaleString()}</span>
                <span>Pending Amt: ₹{client.pendingAmount.toLocaleString()}</span>
                <div
                  className={`flex items-center gap-1 font-medium ${
                    client.profit >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {client.profit >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {client.profit >= 0 ? "+" : ""}₹{client.profit.toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
        <Separator />
        {/* Summary Totals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-green-100 rounded-lg">
            <div className="text-sm text-green-700 font-medium">Total Client Revenue</div>
            <div className="text-xl font-bold text-green-800">₹{calculations.totalClientRevenue.toLocaleString()}</div>
          </div>
          <div className="text-center p-3 bg-red-100 rounded-lg">
            <div className="text-sm text-red-700 font-medium">Total Costs (Hire + Adjustment)</div>
            <div className="text-xl font-bold text-red-800">
              ₹{(calculations.totalTruckHireExpenses + calculations.totalAdjustments).toLocaleString()}
            </div>
          </div>
          <div
            className={`text-center p-3 rounded-lg ${
              calculations.overallTripProfit >= 0 ? "bg-blue-100" : "bg-orange-100"
            }`}
          >
            <div
              className={`text-sm font-medium ${
                calculations.overallTripProfit >= 0 ? "text-blue-700" : "text-orange-700"
              }`}
            >
              Overall Trip Profit/Loss
            </div>
            <div
              className={`text-xl font-bold flex items-center justify-center gap-1 ${
                calculations.overallTripProfit >= 0 ? "text-blue-800" : "text-orange-800"
              }`}
            >
              {calculations.overallTripProfit >= 0 ? (
                <TrendingUp className="h-5 w-5" />
              ) : (
                <TrendingDown className="h-5 w-5" />
              )}
              {calculations.overallTripProfit >= 0 ? "+" : ""}₹{calculations.overallTripProfit.toLocaleString()}
            </div>
          </div>
        </div>
        {/* Detailed Calculation Explanation */}
        {isSelfOwned ? (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
            <strong>Calculation for Self-Owned Vehicle:</strong> <br />
            Total Client Revenue (₹
            {calculations.totalClientRevenue.toLocaleString()}) - Total Truck Hire Costs (₹
            {calculations.totalTruckHireExpenses.toLocaleString()}) - Total Adjustments (₹
            {calculations.totalAdjustments.toLocaleString()}) + Overall Trip Commission (₹
            {calculations.parsedOverallTripCommission.toLocaleString()}) ={" "}
            <span className="font-bold">₹{calculations.overallTripProfit.toLocaleString()}</span>
          </div>
        ) : (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
            <strong>Calculation for Hired Vehicle:</strong> <br />
            Total Client Revenue (₹
            {calculations.totalClientRevenue.toLocaleString()}) - Overall Trip Rate (paid to fleet owner: ₹
            {Number(overallRate).toLocaleString()}) + Overall Trip Commission (from fleet owner: ₹
            {calculations.parsedOverallTripCommission.toLocaleString()}) ={" "}
            <span className="font-bold">₹{calculations.overallTripProfit.toLocaleString()}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function EnhancedAddEditTripDialog({ open, onOpenChange, onSuccess, editingTrip = null, isEditing = false }) {
  const [isLoading, setIsLoading] = useState(false)
  const [showAddClient, setShowAddClient] = useState(false)
  const [showAddDriver, setShowAddDriver] = useState(false)
  const [showAddVehicle, setShowAddVehicle] = useState(false)
  const { user } = useSelector((state) => state.auth)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSelfOwned, setIsSelfOwned] = useState(false)

  // Optimized queries with proper caching
  const {
    data: clientsData,
    isLoading: loadingClients,
    refetch: refetchClients,
  } = useQuery({
    queryKey: ["users", "clients"],
    queryFn: () => usersApi.getAll({ role: "client" }),
    enabled: user?.role === "admin" && open,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  })

  const {
    data: vehiclesData,
    isLoading: loadingVehicles,
    refetch: refetchVehicles,
  } = useQuery({
    queryKey: ["vehicles", "available"],
    queryFn: () => vehiclesApi.getAll({ status: "available" }),
    enabled: open,
    staleTime: 2 * 60 * 1000,
  })

  const {
    data: driversData,
    isLoading: loadingDrivers,
    refetch: refetchDrivers,
  } = useQuery({
    queryKey: ["users", "drivers"],
    queryFn: () => usersApi.getAll({ role: "driver" }),
    enabled: open,
    staleTime: 5 * 60 * 1000,
  })

  // Memoized data processing
  const clients = useMemo(() => clientsData?.data?.users || [], [clientsData])
  const vehicles = useMemo(() => vehiclesData?.data?.vehicles || [], [vehiclesData])
  const drivers = useMemo(() => driversData?.data?.users || [], [driversData])

  const filteredVehicles = vehicles.filter((vehicle) =>
    vehicle.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredDrivers = drivers.filter(
    (driver) => driver.name.toLowerCase().includes(searchQuery.toLowerCase()) || driver.phone.includes(searchQuery),
  )

  const handleSubmit = useCallback(
    async (values, { resetForm }) => {
      setIsLoading(true)
      try {
        const selectedVehicle = vehicles.find((v) => v._id === values.vehicle)
        const submitValues = { ...values }

        if (selectedVehicle?.ownershipType === "self") {
          submitValues.rate = 0
          submitValues.commission = 0
          submitValues.podBalance = 0
        }

        let response
        if (isEditing && editingTrip?._id) {
          response = await tripsApi.update(editingTrip._id, submitValues)
          toast.success("Trip updated successfully!")
        } else {
          response = await tripsApi.create(submitValues)
          toast.success("Trip created successfully!")
        }

        if (response.status === "success") {
          resetForm()
          onSuccess()
          onOpenChange(false)
        }
      } catch (error) {
        toast.error(getErrorMessage(error))
      } finally {
        setIsLoading(false)
      }
    },
    [onSuccess, onOpenChange, vehicles, isEditing, editingTrip],
  )

  const handleUserAdded = (userType) => {
    if (userType === "client") {
      refetchClients()
    } else if (userType === "driver") {
      refetchDrivers()
    }
  }

  const handleVehicleAdded = () => {
    refetchVehicles()
  }

  // Get initial values based on editing mode
  const initialValues = useMemo(() => getInitialValues(editingTrip), [editingTrip])

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="min-w-[80vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              {isEditing ? <Edit className="h-5 w-5 mr-2" /> : <Truck className="h-5 w-5 mr-2" />}
              {isEditing ? "Edit Trip" : "Create New Trip"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update trip details and client information."
                : "Create a new trip with multiple clients and load details."}
            </DialogDescription>
          </DialogHeader>

          <Formik
            initialValues={initialValues}
            validationSchema={(values) => {
              const selectedVehicle = vehicles.find((v) => v._id === values?.vehicle)
              return createTripValidationSchema(selectedVehicle)
            }}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {(formik) => {
              const selectedVehicle = vehicles.find((v) => v._id === formik.values.vehicle)
              useEffect(() => {
                setIsSelfOwned(selectedVehicle?.ownershipType === "self")
              }, [selectedVehicle])

              useEffect(() => {
                if (!isSelfOwned) {
                  const totalClientRate = formik.values.clients.reduce(
                    (sum, client) => sum + (Number(client.truckHireCost) || 0),
                    0,
                  )
                  formik.setFieldValue("rate", totalClientRate)
                }
              }, [formik.values.clients, isSelfOwned, formik.setFieldValue])

              return (
                <Form className="space-y-6">
                  {/* Trip Details */}
                  <Card>
                    <CardHeader>
                      <div className="flex flex-row items-center gap-2">
                        <CardTitle>Trip Details</CardTitle>
                        <Badge variant="secondary">{formik.values.clients.length} Client(s)</Badge>
                        {isEditing && (
                          <Badge variant="outline" className="bg-blue-50">
                            Editing Mode
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Vehicle *</Label>
                          <Select
                            onValueChange={(value) => {
                              if (value === "add_new") {
                                setShowAddVehicle(true)
                                return
                              }
                              formik.setFieldValue("vehicle", value)
                              const newVehicle = vehicles.find((v) => v._id === value)
                              if (newVehicle?.ownershipType === "self") {
                                formik.setFieldValue("rate", 0)
                                formik.setFieldValue("commission", 0)
                                formik.setFieldValue("podBalance", 0)
                              }
                            }}
                            value={formik.values.vehicle}
                          >
                            <SelectTrigger className={formik.errors.vehicle ? "border-red-500" : ""}>
                              <SelectValue placeholder={loadingVehicles ? "Loading..." : "Select vehicle"} />
                            </SelectTrigger>
                            <SelectContent>
                              <div className="px-2 py-1">
                                <Input
                                  placeholder="Search vehicle by registration number..."
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  className="w-full"
                                />
                              </div>
                              <Separator className="my-1" />
                              <SelectItem value="add_new">
                                <div className="flex items-center gap-2 text-primary font-medium">
                                  <Plus className="h-4 w-4" />
                                  Add New Vehicle
                                </div>
                              </SelectItem>
                              <Separator className="my-1" />
                              {filteredVehicles.length > 0 ? (
                                filteredVehicles.map((vehicle) => (
                                  <SelectItem key={vehicle._id} value={vehicle._id}>
                                    <div className="flex items-center justify-between w-full">
                                      <span>{vehicle.registrationNumber}</span>
                                      <span
                                        className={
                                          vehicle.status == "available"
                                            ? "bg-green-500 h-2 w-2 rounded-full ml-2"
                                            : "bg-primary h-2 w-2 rounded-full ml-2"
                                        }
                                      ></span>
                                      <Badge variant="outline" className="mx-2">
                                        {vehicle?.ownershipType == "self" ? "Own" : vehicle.owner.name}
                                      </Badge>
                                    </div>
                                  </SelectItem>
                                ))
                              ) : (
                                <div className="px-4 py-2 text-center text-gray-500">No vehicles found.</div>
                              )}
                            </SelectContent>
                          </Select>
                          {formik.errors.vehicle && (
                            <p className="text-sm text-red-500 mt-1">{formik.errors.vehicle}</p>
                          )}
                        </div>

                        {isSelfOwned && (
                          <div>
                            <Label>Driver *</Label>
                            <Select
                              value={formik.values.driver}
                              onValueChange={(value) => {
                                if (value === "add_new") {
                                  setShowAddDriver(true)
                                  return
                                }
                                formik.setFieldValue("driver", value)
                              }}
                            >
                              <SelectTrigger className={formik.errors.driver ? "border-red-500" : ""}>
                                <SelectValue placeholder={loadingDrivers ? "Loading..." : "Select driver"} />
                              </SelectTrigger>
                              <SelectContent>
                                <div className="px-2 py-1">
                                  <Input
                                    placeholder="Search driver by name or phone..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full"
                                  />
                                </div>
                                <Separator className="my-1" />
                                <SelectItem value="add_new">
                                  <div className="flex items-center gap-2 text-primary font-medium">
                                    <UserPlus className="h-4 w-4" />
                                    Add New Driver
                                  </div>
                                </SelectItem>
                                <Separator className="my-1" />
                                {filteredDrivers.length > 0 ? (
                                  filteredDrivers.map((driver) => (
                                    <SelectItem key={driver._id} value={driver._id}>
                                      {driver.name} ({driver.phone})
                                    </SelectItem>
                                  ))
                                ) : (
                                  <div className="px-4 py-2 text-center text-gray-500">No drivers found.</div>
                                )}
                              </SelectContent>
                            </Select>
                            {formik.errors.driver && (
                              <p className="text-sm text-red-500 mt-1">{formik.errors.driver}</p>
                            )}
                          </div>
                        )}

                        <div>
                          <Label>Scheduled Date *</Label>
                          <Input
                            type="datetime-local"
                            value={formik.values.scheduledDate}
                            onChange={(e) => formik.setFieldValue("scheduledDate", e.target.value)}
                            className={formik.errors.scheduledDate ? "border-red-500" : ""}
                          />
                          {formik.errors.scheduledDate && (
                            <p className="text-sm text-red-500 mt-1">{formik.errors.scheduledDate}</p>
                          )}
                        </div>

                        {!isSelfOwned && (
                          <>
                            <div>
                              <Label>Overall Trip Rate (₹)</Label>
                              <Input
                                type="number"
                                value={formik.values.rate}
                                onChange={(e) => formik.setFieldValue("rate", e.target.value)}
                                className={formik.errors.rate ? "border-red-500" : ""}
                                placeholder="Fleet owner payment"
                              />
                              <p className="text-xs text-muted-foreground mt-1">Amount to pay fleet owner</p>
                              {formik.errors.rate && <p className="text-sm text-red-500 mt-1">{formik.errors.rate}</p>}
                            </div>
                            <CommissionSelector formik={formik} />
                            <div>
                              <Label>POD Balance *</Label>
                              <Input
                                type="number"
                                value={formik.values.podBalance}
                                onChange={(e) => formik.setFieldValue("podBalance", e.target.value)}
                                className={formik.errors.podBalance ? "border-red-500" : ""}
                              />
                              {formik.errors.podBalance && (
                                <p className="text-sm text-red-500 mt-1">{formik.errors.podBalance}</p>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>

                    <CardContent>
                      <FieldArray name="clients">
                        {({ push, remove }) => (
                          <div className="space-y-6">
                            {formik.values.clients.map((_, index) => {
                              const clientErrors = formik.errors.clients?.[index] || {}
                              return (
                                <Card key={index} className="border-l-4 border-l-blue-500">
                                  <CardHeader>
                                    <div className="flex items-center justify-between">
                                      <CardTitle className="text-lg">Client #{index + 1}</CardTitle>
                                      {formik.values.clients.length > 1 && (
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => remove(index)}
                                          className="text-red-600 hover:text-red-700"
                                        >
                                          <Minus className="h-4 w-4 mr-1" />
                                          Remove
                                        </Button>
                                      )}
                                    </div>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    {/* Client Selection */}
                                    <div className="flex flex-row justify-between">
                                      <div>
                                        <Label>Client *</Label>
                                        <Select
                                          value={formik.values.clients[index].client}
                                          onValueChange={(value) => {
                                            if (value === "add_new") {
                                              setShowAddClient(true)
                                              return
                                            }
                                            formik.setFieldValue(`clients.${index}.client`, value)
                                          }}
                                        >
                                          <SelectTrigger className={clientErrors?.client ? "border-red-500" : ""}>
                                            <SelectValue
                                              placeholder={loadingClients ? "Loading..." : "Select client"}
                                            />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <div className="px-2 py-1">
                                              <Input
                                                placeholder="Search client by name or email..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full"
                                              />
                                            </div>
                                            <Separator className="my-1" />
                                            <SelectItem value="add_new">
                                              <div className="flex items-center gap-2 text-primary font-medium">
                                                <UserPlus className="h-4 w-4" />
                                                Add New Client
                                              </div>
                                            </SelectItem>
                                            <Separator className="my-1" />
                                            {filteredClients.length > 0 ? (
                                              filteredClients.map((client) => (
                                                <SelectItem key={client._id} value={client._id}>
                                                  <div className="flex flex-col">
                                                    <span>{client.name}</span>
                                                  </div>
                                                </SelectItem>
                                              ))
                                            ) : (
                                              <div className="px-4 py-2 text-center text-gray-500">
                                                No clients found.
                                              </div>
                                            )}
                                          </SelectContent>
                                        </Select>
                                        {clientErrors?.client && (
                                          <p className="text-sm text-red-500 mt-1">{clientErrors.client}</p>
                                        )}
                                      </div>
                                      <div>
                                        <Label>Load Date *</Label>
                                        <Input
                                          type="datetime-local"
                                          value={formik.values?.clients[index]?.loadDate}
                                          onChange={(e) =>
                                            formik.setFieldValue(`clients.${index}.loadDate`, e.target.value)
                                          }
                                          className={
                                            formik.errors.clients && formik.errors?.clients[index]?.loadDate
                                              ? "border-red-500"
                                              : ""
                                          }
                                        />
                                        {formik.errors.clients && formik.errors.clients[index]?.loadDate && (
                                          <p className="text-sm text-red-500 mt-1">
                                            {formik.errors.clients[index].loadDate}
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    {/* Origin and Destination */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      <div className="space-y-4">
                                        <h4 className="font-medium text-green-600">Origin (Pickup)</h4>
                                        <CitySelect
                                          label="City"
                                          required
                                          value={
                                            formik.values.clients[index].origin?.city
                                              ? {
                                                  city: formik.values.clients[index].origin.city,
                                                  state: formik.values.clients[index].origin.state,
                                                  pincode: formik.values.clients[index].origin.pincode,
                                                }
                                              : null
                                          }
                                          onChange={(city) => {
                                            if (city) {
                                              formik.setFieldValue(`clients.${index}.origin.city`, city.city)
                                              formik.setFieldValue(`clients.${index}.origin.state`, city.state)
                                              formik.setFieldValue(`clients.${index}.origin.pincode`, city.pincode)
                                            }
                                          }}
                                          placeholder="Search pickup city"
                                        />
                                      </div>
                                      <div className="space-y-4">
                                        <h4 className="font-medium text-red-600">Destination (Drop-off)</h4>
                                        <CitySelect
                                          label="City"
                                          required
                                          value={
                                            formik.values.clients[index].destination?.city
                                              ? {
                                                  city: formik.values.clients[index].destination.city,
                                                  state: formik.values.clients[index].destination.state,
                                                  pincode: formik.values.clients[index].destination.pincode,
                                                }
                                              : null
                                          }
                                          onChange={(city) => {
                                            if (city) {
                                              formik.setFieldValue(`clients.${index}.destination.city`, city.city)
                                              formik.setFieldValue(`clients.${index}.destination.state`, city.state)
                                              formik.setFieldValue(`clients.${index}.destination.pincode`, city.pincode)
                                            }
                                          }}
                                          placeholder="Search destination city"
                                        />
                                      </div>
                                    </div>

                                    {/* Load Details */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                        <Label>Client Rate (₹) *</Label>
                                        <Input
                                          type="number"
                                          value={formik.values.clients[index].rate}
                                          onChange={(e) =>
                                            formik.setFieldValue(`clients.${index}.rate`, Number(e.target.value))
                                          }
                                          placeholder="0"
                                          className={clientErrors?.rate ? "border-red-500" : ""}
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">Amount client will pay</p>
                                        {clientErrors?.rate && (
                                          <p className="text-sm text-red-500 mt-1">{clientErrors.rate}</p>
                                        )}
                                      </div>

                                      {!isSelfOwned && (
                                        <div>
                                          <Label>Truck Hire Cost (₹) *</Label>
                                          <Input
                                            type="number"
                                            value={formik.values.clients[index].truckHireCost}
                                            onChange={(e) =>
                                              formik.setFieldValue(
                                                `clients.${index}.truckHireCost`,
                                                Number(e.target.value),
                                              )
                                            }
                                            placeholder="0"
                                            className={clientErrors?.truckHireCost ? "border-red-500" : ""}
                                          />
                                          <p className="text-xs text-muted-foreground mt-1">
                                            Cost to hire truck for this client
                                          </p>
                                          {clientErrors?.truckHireCost && (
                                            <p className="text-sm text-red-500 mt-1">{clientErrors.truckHireCost}</p>
                                          )}
                                        </div>
                                      )}

                                      <div>
                                        <Label>Argestment</Label>
                                        <Input
                                          type="number"
                                          value={formik.values.clients[index].argestment}
                                          onChange={(e) =>
                                            formik.setFieldValue(`clients.${index}.argestment`, Number(e.target.value))
                                          }
                                          placeholder="0"
                                          className={clientErrors?.argestment ? "border-red-500" : ""}
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">Argestment</p>
                                        {clientErrors?.argestment && (
                                          <p className="text-sm text-red-500 mt-1">{clientErrors.argestment}</p>
                                        )}
                                      </div>

                                      <div>
                                        {clientErrors?.loadDetails?.weight && (
                                          <p className="text-sm text-red-500 mt-1">{clientErrors.loadDetails.weight}</p>
                                        )}
                                      </div>

                                      <div>
                                        <Label>Quantity *</Label>
                                        <Input
                                          type="number"
                                          value={formik.values.clients[index].loadDetails.quantity}
                                          onChange={(e) =>
                                            formik.setFieldValue(
                                              `clients.${index}.loadDetails.quantity`,
                                              Number(e.target.value),
                                            )
                                          }
                                          placeholder="1"
                                          className={clientErrors?.loadDetails?.quantity ? "border-red-500" : ""}
                                        />
                                        {clientErrors?.loadDetails?.quantity && (
                                          <p className="text-sm text-red-500 mt-1">
                                            {clientErrors.loadDetails.quantity}
                                          </p>
                                        )}
                                      </div>

                                      <PackagingTypeSelect
                                        value={formik.values.clients[index].loadDetails.packagingType}
                                        onChange={(value) =>
                                          formik.setFieldValue(`clients.${index}.loadDetails.packagingType`, value)
                                        }
                                        error={clientErrors?.loadDetails?.packagingType}
                                      />

                                      <div className="md:col-span-2">
                                        <Label>Special Instructions</Label>
                                        <Textarea
                                          value={formik.values.clients[index].loadDetails.specialInstructions}
                                          onChange={(e) =>
                                            formik.setFieldValue(
                                              `clients.${index}.loadDetails.specialInstructions`,
                                              e.target.value,
                                            )
                                          }
                                          placeholder="Any special handling instructions"
                                          rows={2}
                                        />
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              )
                            })}

                            <Button
                              type="button"
                              variant="outline"
                              onClick={() =>
                                push({
                                  client: "",
                                  loadDetails: {
                                    description: "NA",
                                    weight: 0,
                                    quantity: 1,
                                    loadType: "general",
                                    packagingType: "boxes",
                                    specialInstructions: "",
                                  },
                                  rate: 0,
                                  commission: 0,
                                  truckHireCost: 0,
                                  argestment: 0,
                                  origin: { city: "", state: "", pincode: "" },
                                  destination: { city: "", state: "", pincode: "" },
                                  contactPerson: {
                                    loading: { name: "", phone: "" },
                                    unloading: { name: "", phone: "" },
                                  },
                                  loadDate: new Date().toISOString().slice(0, 16),
                                })
                              }
                              className="w-full"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Another Client
                            </Button>
                          </div>
                        )}
                      </FieldArray>
                    </CardContent>
                  </Card>

                  {/* Calculation Summary */}
                  {formik.values.clients.some((client) => client.rate > 0 || client.truckHireCost > 0) && (
                    <CalculationSummary
                      clients={formik.values.clients}
                      overallRate={formik.values.rate}
                      isSelfOwned={isSelfOwned}
                      overallTripCommission={formik.values.commission}
                    />
                  )}

                  {/* Special Instructions */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Additional Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div>
                        <Label>Special Instructions</Label>
                        <Textarea
                          value={formik.values.specialInstructions}
                          onChange={(e) => formik.setFieldValue("specialInstructions", e.target.value)}
                          placeholder="Any additional instructions for this trip"
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Form Actions */}
                  <div className="flex justify-end space-x-3 pt-6 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        formik.resetForm()
                        onOpenChange(false)
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading
                        ? isEditing
                          ? "Updating..."
                          : "Creating..."
                        : isEditing
                          ? "Update Trip"
                          : "Create Trip"}
                    </Button>
                  </div>
                </Form>
              )
            }}
          </Formik>
        </DialogContent>
      </Dialog>

      {/* Add User Dialogs */}
      <AddUserDialog
        open={showAddClient}
        onOpenChange={setShowAddClient}
        userType="client"
        onSuccess={() => handleUserAdded("client")}
      />
      <AddUserDialog
        open={showAddDriver}
        onOpenChange={setShowAddDriver}
        userType="driver"
        onSuccess={() => handleUserAdded("driver")}
      />
      <AddEditVehicleDialog open={showAddVehicle} onOpenChange={setShowAddVehicle} onSuccess={handleVehicleAdded} />
    </>
  )
}
