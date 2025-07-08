"use client"

import { useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  ArrowLeft,
  Edit,
  Save,
  X,
  FileText,
  Download,
  Users,
  Truck,
  MapPin,
  Calendar,
  Plus,
  Trash2,
  Phone,
  Mail,
  Package,
  PlusCircle,
  Receipt,
  TrendingUp,
  Wallet,
  CreditCard,
  User,
  Circle,
  CheckCircle,
  Clock,
  AlertCircle,
  MemoryStickIcon as Memo,
  ReceiptText
} from "lucide-react"
import { toast } from "react-hot-toast"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { APaymentForm } from "@/components/trips/clientLoadAdvance"
import { EPaymentForm } from "@/components/trips/clientLoadExpenses"
import AddLoadDialog from "@/components/trips/add-load-dialog"
import { tripsApi, usersApi, vehiclesApi } from "@/lib/api"
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils"
import { useSelector } from "react-redux"
import { FleetReceiptDialog } from "components/fleet-receipt-dialog"
import PODDetailsDialog from "components/trips/PODUploadDialog"
import { DriverReceiptDialog } from "components/driver-reciept-dialog"
import { CollectionMemoDialog } from "@/components/memos/collection-memo"
import { BalanceMemoDialog } from "@/components/memos/balance-memo-dialog"
import { ClientStatementGenerator } from "@/components/memos/client-statment"
import { PODStepUpload } from "@/components/memos/pod-step-upload"
import axios from "axios"
import { EnhancedEditTripDialog } from "components/trips/enhanced-edit-trip-dialog"

// Self Owner Expense Form Schema
const selfExpenseSchema = z.object({
  amount: z.number().min(1, "Amount must be greater than 0"),
  reason: z.string().min(1, "Reason is required"),
  category: z.enum([
    "fuel",
    "maintenance",
    "toll",
    "driver_payment",
    "insurance",
    "permit",
    "food",
    "other"
  ]),
  expenseFor: z.enum(
    ["driver", "vehicle"],
    "Please specify if this expense is for driver or vehicle"
  ),
  description: z.string().optional(),
  receiptNumber: z.string().optional()
})

// Self Owner Advance Payment Form Schema
const selfAdvanceSchema = z.object({
  amount: z.number().min(1, "Amount must be greater than 0"),
  reason: z.string().min(1, "Reason is required"),
  paymentFor: z.enum(
    ["driver", "vehicle"],
    "Please specify if this payment is for driver or vehicle"
  ),
  recipientName: z.string().min(1, "Recipient name is required"),
  description: z.string().optional(),
  referenceNumber: z.string().optional()
})

// Fleet Owner Expense Form Schema
const fleetExpenseSchema = z.object({
  amount: z.number().min(1, "Amount must be greater than 0"),
  reason: z.string().min(1, "Reason is required"),
  category: z.enum([
    "fuel",
    "maintenance",
    "toll",
    "driver_payment",
    "insurance",
    "permit",
    "other"
  ]),
  description: z.string().optional(),
  receiptNumber: z.string().optional()
})

// Fleet Owner Advance Payment Form Schema
const fleetAdvanceSchema = z.object({
  amount: z.number().min(1, "Amount must be greater than 0"),
  reason: z.string().min(1, "Reason is required"),
  recipientType: z.enum(["driver", "vendor", "fuel_station", "other"]),
  recipientName: z.string().min(1, "Recipient name is required"),
  description: z.string().optional(),
  referenceNumber: z.string().optional()
})

// Self Owner Expense Form Component
function SelfExpenseForm({ handleSubmit, open, onClose }) {
  const form = useForm({
    resolver: zodResolver(selfExpenseSchema),
    defaultValues: {
      amount: 0,
      reason: "",
      category: "fuel",
      expenseFor: "vehicle",
      description: "",
      receiptNumber: ""
    }
  })

  const onSubmit = data => {
    handleSubmit(data)
    form.reset()
  }

  if (!open) return null

  return (
    <Card className="mt-4 border-l-4 border-l-red-500">
      <CardHeader className="bg-red-50">
        <CardTitle className="text-lg flex items-center text-red-800">
          <Receipt className="h-5 w-5 mr-2" />
          Add Self Owner Expense
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter amount"
                        {...field}
                        onChange={e => field.onChange(Number(e.target.value))}
                        className="focus:ring-red-500 focus:border-red-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expenseFor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expense For</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="focus:ring-red-500 focus:border-red-500">
                          <SelectValue placeholder="Select expense type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="driver">👨‍💼 Driver</SelectItem>
                        <SelectItem value="vehicle">🚛 Vehicle</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="focus:ring-red-500 focus:border-red-500">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="fuel">⛽ Fuel</SelectItem>
                        <SelectItem value="maintenance">
                          🔧 Maintenance
                        </SelectItem>
                        <SelectItem value="toll">🛣️ Toll</SelectItem>
                        <SelectItem value="driver_payment">
                          👨‍💼 Driver Payment
                        </SelectItem>
                        <SelectItem value="insurance">🛡️ Insurance</SelectItem>
                        <SelectItem value="permit">📋 Permit</SelectItem>
                        <SelectItem value="food">🍽️ Food</SelectItem>
                        <SelectItem value="other">📝 Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="receiptNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Receipt Number (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter receipt/bill number"
                        {...field}
                        className="focus:ring-red-500 focus:border-red-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter reason for expense"
                      {...field}
                      className="focus:ring-red-500 focus:border-red-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional details about the expense"
                      {...field}
                      className="focus:ring-red-500 focus:border-red-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="bg-red-600 hover:bg-red-700">
                Add Expense
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

// Self Owner Advance Payment Form Component
function SelfAdvanceForm({ handleSubmit, open, onClose }) {
  const form = useForm({
    resolver: zodResolver(selfAdvanceSchema),
    defaultValues: {
      amount: 0,
      reason: "",
      paymentFor: "driver",
      recipientName: "",
      description: "",
      referenceNumber: ""
    }
  })

  const onSubmit = data => {
    handleSubmit(data)
    form.reset()
  }

  if (!open) return null

  return (
    <Card className="mt-4 border-l-4 border-l-green-500">
      <CardHeader className="bg-green-50">
        <CardTitle className="text-lg flex items-center text-green-800">
          <CreditCard className="h-5 w-5 mr-2" />
          Add Self Owner Advance Payment
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter amount"
                        {...field}
                        onChange={e => field.onChange(Number(e.target.value))}
                        className="focus:ring-green-500 focus:border-green-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentFor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment For</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="focus:ring-green-500 focus:border-green-500">
                          <SelectValue placeholder="Select payment type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="driver">👨‍💼 Driver</SelectItem>
                        <SelectItem value="vehicle">🚛 Vehicle</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="recipientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter recipient name"
                        {...field}
                        className="focus:ring-green-500 focus:border-green-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="referenceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference Number (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter reference/transaction number"
                        {...field}
                        className="focus:ring-green-500 focus:border-green-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter reason for advance payment"
                      {...field}
                      className="focus:ring-green-500 focus:border-green-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional details about the advance payment"
                      {...field}
                      className="focus:ring-green-500 focus:border-green-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                Add Advance Payment
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

// Fleet Owner Expense Form Component
function FleetExpenseForm({ handleSubmit, open, onClose }) {
  const form = useForm({
    resolver: zodResolver(fleetExpenseSchema),
    defaultValues: {
      amount: 0,
      reason: "",
      category: "fuel",
      description: "",
      receiptNumber: ""
    }
  })

  const onSubmit = data => {
    handleSubmit(data)
    form.reset()
  }

  if (!open) return null

  return (
    <Card className="mt-4 border-l-4 border-l-red-500">
      <CardHeader className="bg-red-50">
        <CardTitle className="text-lg flex items-center text-red-800">
          <Receipt className="h-5 w-5 mr-2" />
          Add Fleet Owner Expense
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter amount"
                        {...field}
                        onChange={e => field.onChange(Number(e.target.value))}
                        className="focus:ring-red-500 focus:border-red-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="focus:ring-red-500 focus:border-red-500">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="fuel">⛽ Fuel</SelectItem>
                        <SelectItem value="maintenance">
                          🔧 Maintenance
                        </SelectItem>
                        <SelectItem value="toll">🛣️ Toll</SelectItem>
                        <SelectItem value="driver_payment">
                          👨‍💼 Driver Payment
                        </SelectItem>
                        <SelectItem value="insurance">🛡️ Insurance</SelectItem>
                        <SelectItem value="permit">📋 Permit</SelectItem>
                        <SelectItem value="other">📝 Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter reason for expense"
                      {...field}
                      className="focus:ring-red-500 focus:border-red-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional details about the expense"
                      {...field}
                      className="focus:ring-red-500 focus:border-red-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="receiptNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Receipt Number (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter receipt/bill number"
                      {...field}
                      className="focus:ring-red-500 focus:border-red-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="bg-red-600 hover:bg-red-700">
                Add Expense
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

// Fleet Owner Advance Payment Form Component
function FleetAdvanceForm({ handleSubmit, open, onClose }) {
  const form = useForm({
    resolver: zodResolver(fleetAdvanceSchema),
    defaultValues: {
      amount: 0,
      reason: "",
      recipientType: "driver",
      recipientName: "",
      description: "",
      referenceNumber: ""
    }
  })

  const onSubmit = data => {
    handleSubmit(data)
    form.reset()
  }

  if (!open) return null

  return (
    <Card className="mt-4 border-l-4 border-l-green-500">
      <CardHeader className="bg-green-50">
        <CardTitle className="text-lg flex items-center text-green-800">
          <CreditCard className="h-5 w-5 mr-2" />
          Add Fleet Owner Advance Payment
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter amount"
                        {...field}
                        onChange={e => field.onChange(Number(e.target.value))}
                        className="focus:ring-green-500 focus:border-green-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recipientType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="focus:ring-green-500 focus:border-green-500">
                          <SelectValue placeholder="Select recipient type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="driver">👨‍💼 Driver</SelectItem>
                        <SelectItem value="vendor">🏪 Vendor</SelectItem>
                        <SelectItem value="fuel_station">
                          ⛽ Fuel Station
                        </SelectItem>
                        <SelectItem value="other">📝 Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="recipientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter recipient name"
                        {...field}
                        className="focus:ring-green-500 focus:border-green-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="referenceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference Number (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter reference/transaction number"
                        {...field}
                        className="focus:ring-green-500 focus:border-green-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter reason for advance payment"
                      {...field}
                      className="focus:ring-green-500 focus:border-green-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional details about the advance payment"
                      {...field}
                      className="focus:ring-green-500 focus:border-green-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                Add Advance Payment
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

const tripSchema = z.object({
  clients: z.array(
    z.object({
      client: z.string().min(1, "Client is required"),
      loadDetails: z.object({
        description: z.string().min(1, "Description is required"),
        weight: z.number().min(0.1, "Weight must be greater than 0"),
        quantity: z.number().min(1, "Quantity must be at least 1"),
        loadType: z.enum([
          "general",
          "fragile",
          "hazardous",
          "perishable",
          "liquid"
        ]),
        packagingType: z.enum([
          "boxes",
          "bags",
          "loose",
          "pallets",
          "containers"
        ]),
        specialInstructions: z.string().optional()
      }),
      rate: z.number().min(1, "Rate must be greater than 0"),
      contactPerson: z
        .object({
          loading: z
            .object({
              name: z.string().optional(),
              phone: z.string().optional()
            })
            .optional(),
          unloading: z
            .object({
              name: z.string().optional(),
              phone: z.string().optional()
            })
            .optional()
        })
        .optional()
    })
  ),
  vehicle: z.string().min(1, "Vehicle is required"),
  driver: z.string().min(1, "Driver is required"),
  origin: z.object({
    address: z.string().min(1, "Origin address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    pincode: z.string().min(1, "Pincode is required")
  }),
  destination: z.object({
    address: z.string().min(1, "Destination address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    pincode: z.string().min(1, "Pincode is required")
  }),
  scheduledDate: z.string().min(1, "Scheduled date is required"),
  estimatedDuration: z.number().optional(),
  estimatedDistance: z.number().optional(),
  specialInstructions: z.string().optional()
})

export default function TripDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useSelector(state => state.auth)
  const queryClient = useQueryClient()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showPODDialog, setShowPODDialog] = useState(false)
  const [advancePay, setAdvancePay] = useState(false)
  const [expensesPay, setExpensesPay] = useState(false)
  const [fleetExpenseForm, setFleetExpenseForm] = useState(false)
  const [fleetAdvanceForm, setFleetAdvanceForm] = useState(false)
  const [selfExpenseForm, setSelfExpenseForm] = useState(false)
  const [selfAdvanceForm, setSelfAdvanceForm] = useState(false)
  const [selectedTrip, setSelectedTrip] = useState(null)
  const [addLoad, setAddLoad] = useState(false)
  const [showReceiptDialog, setShowReceiptDialog] = useState(false)
  const [showDriverReceiptDialog, setShowDriverReceiptDialog] = useState(false)
  const [isUpdatingPOD, setIsUpdatingPOD] = useState(false)
  const [showCollectionMemoDialog, setShowCollectionMemoDialog] = useState(
    false
  )
  const [showBalanceMemoDialog, setShowBalanceMemoDialog] = useState(false)
  const [selectedClientForMemo, setSelectedClientForMemo] = useState(null)
  const [showEditDialog, setShowEditDialog] = useState(false) // New state for edit dialog

  const handleEdit = () => {
    setShowEditDialog(true) // Open edit dialog instead of inline editing
  }

  const handleEditSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["trip", params.id] })
    setShowEditDialog(false)
    toast.success("Trip updated successfully!")
  }


  const form = useForm({
    resolver: zodResolver(tripSchema)
  })

  const {
    fields: clientFields,
    append: appendClient,
    remove: removeClient
  } = useFieldArray({
    control: form.control,
    name: "clients"
  })

  // Queries
  const { data: tripData, isLoading } = useQuery({
    queryKey: ["trip", params.id],
    queryFn: () => tripsApi.getById(params.id)
  })

  const { data: clientsData } = useQuery({
    queryKey: ["users", "clients"],
    queryFn: () => usersApi.getAll({ role: "client" })
  })

  const { data: vehiclesData } = useQuery({
    queryKey: ["vehicles"],
    queryFn: () => vehiclesApi.getAll({ status: "available" })
  })

  const { data: driversData } = useQuery({
    queryKey: ["users", "drivers"],
    queryFn: () => usersApi.getAll({ role: "driver" })
  })

  // Mutations
  const updateTripMutation = useMutation({
    mutationFn: data => tripsApi.update(params.id, data),
    onSuccess: () => {
      toast.success("Trip updated successfully")
      setIsEditing(false)
      queryClient.invalidateQueries({ queryKey: ["trip", params.id] })
    },
    onError: error => {
      toast.error(error.response?.data?.message || "Failed to update trip")
    }
  })

  const trip = tripData?.data?.trip
  const clients = clientsData?.data?.users || []
  const vehicles = vehiclesData?.data?.vehicles || []
  const drivers = driversData?.data?.users || []

  // Initialize form when trip data is loaded
  useEffect(() => {
    if (trip && !isEditing) {
      form.reset({
        clients: trip.clients || [],
        vehicle: trip.vehicle?._id,
        driver: trip.driver?._id,
        origin: trip.origin,
        destination: trip.destination,
        scheduledDate: new Date(trip.scheduledDate).toISOString().slice(0, 16),
        estimatedDuration: trip.estimatedDuration,
        estimatedDistance: trip.estimatedDistance,
        specialInstructions: trip.specialInstructions
      })
    }
  }, [trip, isEditing, form])

  const deleteMutation = useMutation({
    mutationFn: id => tripsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["trips"])
      toast.success("Trip deleted successfully")
      setShowDeleteDialog(false)
      setSelectedTrip(null)
      router.push("/trips")
    },
    onError: error => {
      toast.error(error.response?.data?.message || "Failed to delete trip")
    }
  })

  const onSubmit = data => {
    updateTripMutation.mutate(data)
  }

  // const handleEdit = () => {
  //   setIsEditing(true)
  //   if (trip) {
  //     form.reset({
  //       clients: trip.clients || [],
  //       vehicle: trip.vehicle._id,
  //       driver: trip.driver._id,
  //       origin: trip.origin,
  //       destination: trip.destination,
  //       scheduledDate: new Date(trip.scheduledDate).toISOString().slice(0, 16),
  //       estimatedDuration: trip.estimatedDuration,
  //       estimatedDistance: trip.estimatedDistance,
  //       specialInstructions: trip.specialInstructions
  //     })
  //   }
  // }

  const handleCancelEdit = () => {
    setIsEditing(false)
    form.reset()
  }

  const handleASubmit = async (values, index) => {
    const data = { ...values, index: index }
    try {
      const res = await tripsApi.addAdvance(params.id, data)

      res && setAdvancePay(false)
      toast.success("Payment added successfully")
      queryClient.invalidateQueries({ queryKey: ["trip", params.id] })
    } catch (error) {
      console.log(error)
      toast.error("Failed to add payment")
    }
  }





  const handleDeleteAdvance = async (tripId, clientIndex, advanceIndex) => {
    if (!window.confirm("Are you sure you want to delete this advance payment?")) return;

    try {



      const res = await tripsApi.deleteAdvance(params.id, {
        clientIndex,
        advanceIndex,
      });

      queryClient.invalidateQueries({ queryKey: ["trip", params.id] })

      // ✅ Optional: Show toast or refresh data
      console.log("Deleted successfully:", res.data);
      toast.success("Advance payment deleted");



    } catch (err) {
      console.error(err);
      toast.error("Failed to delete advance");
    }
  };




  const handleDeleteExpense = async (tripId, clientIndex, expenseIndex) => {
  if (!window.confirm("Are you sure you want to delete this expense?")) return;

  try {
        const res = await tripsApi.deleteExpense(params.id, {
        clientIndex,
        expenseIndex,
      });

      queryClient.invalidateQueries({ queryKey: ["trip", params.id] })


    toast.success("Expense deleted successfully");
  
  } catch (err) {
    console.error(err);
    toast.error("Failed to delete expense");
  }
};

  const handleESubmit = async (values, index) => {
    const data = { ...values, index: index }
    try {
      const res = await tripsApi.addExpense(params.id, data)

      res && setExpensesPay(false)
      toast.success("Expenses added successfully")
      queryClient.invalidateQueries({ queryKey: ["trip", params.id] })
    } catch (error) {
      console.log(error)
      toast.error("Failed to add expenses")
    }
  }

  // Fleet Owner Expense Handler
  const handleFleetExpenseSubmit = async values => {
    try {
      const res = await tripsApi.addFleetExpense(params.id, values)
      if (res) {
        setFleetExpenseForm(false)
        queryClient.invalidateQueries({ queryKey: ["trip", params.id] })
        toast.success("Fleet expense added successfully")
      }
    } catch (error) {
      console.log(error)
      toast.error("Failed to add fleet expense")
    }
  }

  // Fleet Owner Advance Payment Handler
  const handleFleetAdvanceSubmit = async values => {
    try {
      const res = await tripsApi.addFleetAdvance(params.id, values)
      if (res) {
        setFleetAdvanceForm(false)
        queryClient.invalidateQueries({ queryKey: ["trip", params.id] })
        toast.success("Fleet advance payment added successfully")
      }
    } catch (error) {
      console.log(error)
      toast.error("Failed to add fleet advance payment")
    }
  }







  const handleDeleteFleetAdvance = async (advanceIndex) => {
  if (!window.confirm("Are you sure you want to delete this advance?")) return;

  try {
   
      const res = await tripsApi.deleteFleetAdvance(params.id, {advanceIndex})

    toast.success("Fleet advance deleted");
      queryClient.invalidateQueries({ queryKey: ["trip", params.id] })

  } catch (error) {
    toast.error(
      error.response?.data?.message || "Failed to delete advance"
    );
  }
};

const handleDeleteSelfExpense = async (expenseIndex) => {
  const confirmed = window.confirm("Are you sure you want to delete this self expense?");
  if (!confirmed) return;

  try {
 
      const res = await tripsApi.deleteSelfExpense(params.id, {expenseIndex})

    toast.success("Expense deleted");
      queryClient.invalidateQueries({ queryKey: ["trip", params.id] })

  } catch (err) {
    toast.error(err.response?.data?.message || "Failed to delete self expense");
  }
};

  // Self Owner Expense Handler
  const handleSelfExpenseSubmit = async values => {
    try {
      const res = await tripsApi.addSelfExpense(params.id, values)
      if (res) {
        setSelfExpenseForm(false)
        queryClient.invalidateQueries({ queryKey: ["trip", params.id] })
        toast.success("Self expense added successfully")
      }
    } catch (error) {
      console.log(error)
      toast.error("Failed to add self expense")
    }
  }

  // Self Owner Advance Payment Handler
  const handleSelfAdvanceSubmit = async values => {
    try {
      const res = await tripsApi.addSelfAdvance(params.id, values)
      if (res) {
        setSelfAdvanceForm(false)
        queryClient.invalidateQueries({ queryKey: ["trip", params.id] })
        toast.success("Self advance payment added successfully")
      }
    } catch (error) {
      console.log(error)
      toast.error("Failed to add self advance payment")
    }
  }

  // Collection Memo Handler
  const handleCollectionMemoSubmit = async formData => {
    try {
      const res = await tripsApi.addCollectionMemo(
        params.id,
        selectedClientForMemo._id,
        formData
      )
      if (res) {
        setShowCollectionMemoDialog(false)
        setSelectedClientForMemo(null)
        queryClient.invalidateQueries({ queryKey: ["trip", params.id] })
        toast.success("Collection memo created successfully")
      }
    } catch (error) {
      console.log(error)
      toast.error("Failed to create collection memo")
    }
  }

  // Balance Memo Handler
  const handleBalanceMemoSubmit = async formData => {
    try {
      const res = await tripsApi.addBalanceMemo(
        params.id,
        selectedClientForMemo._id,
        formData
      )
      if (res) {
        setShowBalanceMemoDialog(false)
        setSelectedClientForMemo(null)
        queryClient.invalidateQueries({ queryKey: ["trip", params.id] })
        toast.success("Balance memo created successfully")
      }
    } catch (error) {
      console.log(error)
      toast.error("Failed to create balance memo")
    }
  }

  const steps = [
    { key: "started", label: "Trip Started", icon: "🚛", color: "blue" },
    { key: "complete", label: "Trip Completed", icon: "✅", color: "green" },
    { key: "pod_received", label: "POD Received", icon: "📄", color: "orange" },
    {
      key: "pod_submitted",
      label: "POD Submitted",
      icon: "📤",
      color: "purple"
    },
    { key: "settled", label: "Settled", icon: "💰", color: "emerald" }
  ]

  const [currentIndex, setCurrentIndex] = useState(-1)

  useEffect(() => {
    if (trip?.podManage?.status) {
      const index = steps.findIndex(s => s.key === trip.podManage.status)
      setCurrentIndex(index)
    }
  }, [trip])

  const handleStepClick = async () => {
    const nextStep = steps[currentIndex + 1]
    if (!nextStep) {
      toast.error("Trip is already at the final step")
      return
    }

    setIsUpdatingPOD(true)

    try {
      const toastId = toast.loading(`Updating to: ${nextStep.label}...`)

      const data = await tripsApi.updatePodStatus(trip._id, {
        status: nextStep.key
      })

      if (data.success) {
        // Update local state immediately for better UX
        setCurrentIndex(currentIndex + 1)

        // Refresh the trip data
        queryClient.invalidateQueries({ queryKey: ["trip", params.id] })

        toast.dismiss(toastId)
        toast.success(`✅ POD status updated to: ${nextStep.label}`)
      } else {
        toast.dismiss(toastId)
        toast.error("Failed to update POD status")
      }
    } catch (error) {
      console.error("Error updating POD status:", error)
      toast.error("Something went wrong while updating POD status")
    } finally {
      setIsUpdatingPOD(false)
    }
  }


  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
  const token = localStorage?.getItem("token");

  // POD Step Document Upload Handler
  const handlePODStepUpload = async (file, stepKey) => {
    try {
      const formData = new FormData();
      formData.append("file", file);        // 👈 👈 Important: Field name should be "file"
      formData.append("stepKey", stepKey);  // 👈 Optional field agar extra data bhejna ho
      console.log(file)
      const res = await axios.post(
        `${API_BASE_URL}/trips/${params.id}/podDocument`,  // 👈 Trip ID ke hisab se URL
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",  // 👈 VERY IMPORTANT
            Authorization: token ? `Bearer ${token}` : "",

          },
        }
      );

      console.log("Upload success:", res.data);
    } catch (error) {
      console.error("Upload failed:", error);
    }
  }

  const handleDelete = () => {
    setShowDeleteDialog(true)
  }

  if (isLoading || !trip) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    )
  }

  if (!trip) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Trip not found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            The requested trip could not be found.
          </p>
          <Button onClick={() => router.push("/trips")} className="mt-4">
            Back to Trips
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  const canEdit = user?.role === "admin"
  const canManagePOD = user?.role === "admin" || user?.role === "driver"
  const isFleetOwner =
    user?.role === "fleet_owner" || trip.vehicle.ownershipType !== "self"
  const isSelfOwner = trip.vehicle.ownershipType === "self"
  const totalWeight =
    trip.clients?.reduce((sum, client) => sum + client.loadDetails.weight, 0) ||
    0

  // Fleet Owner Calculations
  const totalFleetExpenses =
    trip.fleetExpenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0
  const totalFleetAdvances =
    trip.fleetAdvances?.reduce((sum, advance) => sum + advance.amount, 0) || 0
  const totalFleetCosts = totalFleetExpenses + totalFleetAdvances

  // Self Owner Calculations
  const totalSelfExpenses =
    trip.selfExpenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0
  const totalSelfAdvances =
    trip.selfAdvances?.reduce((sum, advance) => sum + advance.amount, 0) || 0
  const totalSelfCosts = totalSelfExpenses + totalSelfAdvances

  const totalRevenue = trip.totalClientAmount || 0
  const netProfit =
    totalRevenue - (isFleetOwner ? totalFleetCosts : totalSelfCosts)








  const tripRate = trip.rate || 0
  const totalGivenToFleetOwner = totalFleetExpenses + totalFleetAdvances
  const commission = trip.commission || 0
  const podBalance = trip.podBalance || 0

  const finalAmount = tripRate - totalGivenToFleetOwner - commission - podBalance



  const getCategoryColor = category => {
    const colors = {
      fuel: "bg-blue-100 text-blue-800",
      maintenance: "bg-orange-100 text-orange-800",
      toll: "bg-green-100 text-green-800",
      driver_payment: "bg-purple-100 text-purple-800",
      insurance: "bg-red-100 text-red-800",
      permit: "bg-yellow-100 text-yellow-800",
      food: "bg-pink-100 text-pink-800",
      other: "bg-gray-100 text-gray-800"
    }
    return colors[category] || colors.other
  }

  const getCategoryIcon = category => {
    const icons = {
      fuel: "⛽",
      maintenance: "🔧",
      toll: "🛣️",
      driver_payment: "👨‍💼",
      insurance: "🛡️",
      permit: "📋",
      food: "🍽️",
      other: "📝"
    }
    return icons[category] || "📝"
  }

  const getRecipientColor = type => {
    const colors = {
      driver: "bg-blue-100 text-blue-800",
      vendor: "bg-green-100 text-green-800",
      fuel_station: "bg-orange-100 text-orange-800",
      vehicle: "bg-purple-100 text-purple-800",
      other: "bg-gray-100 text-gray-800"
    }
    return colors[type] || colors.other
  }

  const getExpenseForIcon = expenseFor => {
    return expenseFor === "driver" ? "👨‍💼" : "🚛"
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/trips")}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Trips
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {trip.tripNumber}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {trip.clients?.[0]?.origin?.city || "N/A"} →{" "}
                {trip.clients?.[0]?.destination?.city || "N/A"}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {!isEditing && canEdit && (
              <Button
                onClick={handleEdit}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Trip
              </Button>
            )}
            {isEditing && (
              <>
                <Button variant="outline" onClick={handleCancelEdit}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={updateTripMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateTripMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </>
            )}
            {!isSelfOwner && canManagePOD && (
              <Button
                onClick={() => setShowPODDialog(true)}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <FileText className="h-4 w-4 mr-2" />
                Manage POD
              </Button>
            )}
            <Button variant="outline" className="hover:bg-gray-50">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={handleDelete}
              variant="destructive"
              className="hover:bg-red-700"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        {/* Status and Quick Info */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <Badge className={getStatusColor(trip.status)}>
                    {trip.status.replace("_", " ")}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {trip.clients?.length || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Clients</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">
                {totalWeight.toFixed(1)} tons
              </div>
              <p className="text-sm text-muted-foreground">Total Weight</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(trip.rate || 0)} / {" "}
                {formatCurrency(trip.totalClientAmount || 0)}
              </div>
              <p className="text-sm text-muted-foreground">Total Amount / Total clients</p>
            </CardContent>
          </Card>
        </div>

        {!isEditing && (
          <>
            {/* Vehicle and Driver */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Truck className="h-4 w-4 mr-2" />
                    Vehicle & Driver
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 flex flex-row gap-4 justify-start">
                  <div>
                    <div className="text-sm text-muted-foreground">Vehicle</div>
                    <div className="font-medium">
                      {trip.vehicle.registrationNumber}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <Badge
                        className={
                          isSelfOwner
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-100 text-blue-800"
                        }
                      >
                        {isSelfOwner ? "Self Owned" : "Fleet Owner"}
                      </Badge>{" "}
                      • {trip.vehicle.capacity} tons
                    </div>
                  </div>

                  {trip?.driver && (
                    <div className="flex items-center space-x-3">
                      <Avatar className="hover:scale-105 transition-transform">
                        <AvatarImage
                          src={trip?.driver?.profileImage || "/placeholder.svg"}
                        />
                        <AvatarFallback className="bg-blue-100 text-blue-800">
                          {trip?.driver?.name
                            .split(" ")
                            .map(n => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{trip.driver.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {trip.driver.phone}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Route Information */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Trip Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Separator />

                  {!isSelfOwner && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {/* Trip Amount Card */}
                      <div className="flex flex-col justify-between p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out border border-red-200">
                        <div className="text-sm font-semibold text-red-700 mb-1">
                          Trip Amount
                        </div>
                        <div className="text-2xl font-extrabold text-red-800">
                          ₹{trip?.rate?.toLocaleString() || 0}
                        </div>
                      </div>

                      {/* Commission Card */}
                      <div className="flex flex-col justify-between p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out border border-blue-200">
                        <div className="text-sm font-semibold text-blue-700 mb-1">
                          Commission
                        </div>
                        <div className="text-2xl font-extrabold text-blue-800">
                          ₹{trip?.commission?.toLocaleString() || 0}
                        </div>
                      </div>

                      {/* POD Balance Card */}
                      <div className="flex flex-col justify-between p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out  border border-green-200">
                        <div className="text-sm font-semibold text-green-700 mb-1">
                          POD Balance
                        </div>
                        <div className="text-2xl font-extrabold text-green-800">
                          ₹{trip?.podBalance?.toLocaleString() || 0}
                        </div>
                      </div>
                      <div className="flex flex-col justify-between p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out  border border-green-200">
                        <div className="text-sm font-semibold text-green-700 mb-1">
                          Total Argestment
                        </div>
                        <div className="text-2xl font-extrabold text-green-800">
  
                          ₹{ trip.clients?.reduce((sum, c) => sum + (Number(c?.argestment || c?.adjustment) || 0), 0)}
                        </div>
                      </div>

                      {/* Total Profile Section - Styled as a prominent card */}
                 {(() => {
  const totalClientRevenue = trip.clients?.reduce((sum, c) => sum + (Number(c?.rate) || 0), 0);
  const totalAdjustments = trip.clients?.reduce((sum, c) => sum + (Number(c?.argestment || c?.adjustment) || 0), 0);
  const tripRate = Number(trip?.rate) || 0;
  const commission = Number(trip?.commission) || 0;

  const overallProfit = totalClientRevenue - tripRate - totalAdjustments + commission;

  return (
    <div className="col-span-1 md:col-span-2 p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-lg border border-green-200 flex items-center justify-between mt-4">
      <div className="text-md font-semibold text-green-700">
        Overall Trip Profit/Loss:
      </div>
      <div className={`text-2xl font-extrabold ${overallProfit >= 0 ? 'text-green-800' : 'text-red-800'}`}>
        {overallProfit >= 0 ? '+' : '-'}₹{Math.abs(overallProfit).toLocaleString()}
      </div>
    </div>
  );
})()}

                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Scheduled Date
                      </div>
                      <div className="font-medium">
                        {formatDate(trip.scheduledDate, "MMM dd, yyyy HH:mm")}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Estimated Distance
                      </div>
                      <div className="font-medium">
                        {trip.estimatedDistance || "N/A"} km
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>



            {/* Self Owner Expenses & Advances Section - Only show for self-owned vehicles */}
            {isSelfOwner && (
              <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <User className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <CardTitle className="text-green-800 text-xl">
                          Self Owner Financial Tracking
                        </CardTitle>
                        <CardDescription className="text-green-600">
                          Manage your own vehicle expenses and advances
                        </CardDescription>
                      </div>
                      <Badge className="bg-green-100 text-green-800 px-3 py-1">
                        Self Owned
                      </Badge>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => setSelfExpenseForm(!selfExpenseForm)}
                        className="bg-red-600 hover:bg-red-700 shadow-md"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Expense
                      </Button>
                    
                      <Button
                        onClick={() => setShowDriverReceiptDialog(true)}
                        className="bg-blue-600 hover:bg-blue-700 shadow-md"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Receipt
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Self Owner Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card className="bg-gradient-to-r from-green-100 to-green-200 hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-5 w-5 text-green-600" />
                          <div>
                            <div className="text-sm text-green-700 font-medium">
                              Trip Revenue
                            </div>
                            <div className="text-xl font-bold text-green-800">
                              {formatCurrency(totalRevenue)}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-red-100 to-red-200 hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <Wallet className="h-5 w-5 text-red-600" />
                          <div>
                            <div className="text-sm text-red-700 font-medium">
                              Total Expenses
                            </div>
                            <div className="text-xl font-bold text-red-800">
                              {formatCurrency(totalSelfExpenses)}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-purple-100 to-purple-200 hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <CreditCard className="h-5 w-5 text-purple-600" />
                          <div>
                            <div className="text-sm text-purple-700 font-medium">
                              Total Advances
                            </div>
                            <div className="text-xl font-bold text-purple-800">
                              {formatCurrency(totalSelfAdvances)}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card
                      className={`bg-gradient-to-r hover:shadow-md transition-shadow ${netProfit >= 0
                          ? "from-blue-100 to-blue-200"
                          : "from-orange-100 to-orange-200"
                        }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <TrendingUp
                            className={`h-5 w-5 ${netProfit >= 0
                                ? "text-blue-600"
                                : "text-orange-600"
                              }`}
                          />
                          <div>
                            <div
                              className={`text-sm font-medium ${netProfit >= 0
                                  ? "text-blue-700"
                                  : "text-orange-700"
                                }`}
                            >
                              Net Profit
                            </div>
                            <div
                              className={`text-xl font-bold ${netProfit >= 0
                                  ? "text-blue-800"
                                  : "text-orange-800"
                                }`}
                            >
                              {formatCurrency(netProfit)}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Forms */}
                  <SelfExpenseForm
                    handleSubmit={handleSelfExpenseSubmit}
                    open={selfExpenseForm}
                    onClose={() => setSelfExpenseForm(false)}
                  />

                  <SelfAdvanceForm
                    handleSubmit={handleSelfAdvanceSubmit}
                    open={selfAdvanceForm}
                    onClose={() => setSelfAdvanceForm(false)}
                  />

                  {/* Tabs for Expenses and Advances */}
                  <Tabs defaultValue="expenses" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger
                        value="expenses"
                        className="flex items-center space-x-2"
                      >
                        <Receipt className="h-4 w-4" />
                        <span>Expenses ({trip.selfExpenses?.length || 0})</span>
                      </TabsTrigger>
                    
                    </TabsList>

                    <TabsContent value="expenses">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center border-b pb-2">
                          <h4 className="font-medium text-gray-700">
                            Expense Details
                          </h4>
                          <p className="font-semibold text-red-600">
                            Total: {formatCurrency(totalSelfExpenses)}
                          </p>
                        </div>

                        {trip.selfExpenses && trip.selfExpenses.length > 0 ? (
                          <div className="space-y-3">
                            {trip.selfExpenses.map((expense, index) => (
                              <div
                                key={index}
                                className="flex justify-between items-start p-4 bg-white rounded-lg border hover:shadow-md transition-shadow"
                              >
                                <div className="flex items-start space-x-3">
                                  <div className="text-2xl">
                                    {getCategoryIcon(expense.category)}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <Badge
                                        className={getCategoryColor(
                                          expense.category
                                        )}
                                      >
                                        {expense.category.replace("_", " ")}
                                      </Badge>
                                      <Badge
                                        className={getRecipientColor(
                                          expense.expenseFor
                                        )}
                                      >
                                        {getExpenseForIcon(expense.expenseFor)}{" "}
                                        {expense.expenseFor}
                                      </Badge>
                                      <span className="text-sm text-gray-500">
                                        {formatDate(
                                          expense.createdAt,
                                          "MMM dd, yyyy HH:mm"
                                        )}
                                      </span>
                                    </div>
                                    <div className="font-medium text-gray-900 mb-1">
                                      {expense.reason}
                                    </div>
                                    {expense.description && (
                                      <div className="text-sm text-gray-600 mb-1">
                                        {expense.description}
                                      </div>
                                    )}
                                    {expense.receiptNumber && (
                                      <div className="text-xs text-blue-600">
                                        Receipt: {expense.receiptNumber}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              <div className="text-right">
  <div className="text-lg font-bold text-red-600">
    {formatCurrency(expense.amount)}
  </div>
  <button
    onClick={() => handleDeleteSelfExpense(index)}
    className="text-red-500 text-sm mt-2 hover:underline"
  >
    Delete
  </button>
</div>

                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <Receipt className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                            <p>No expenses recorded yet</p>
                            <p className="text-sm">
                              Click "Add Expense" to start tracking your costs
                            </p>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                  
                  </Tabs>
                </CardContent>
              </Card>
            )}

            {/* Fleet Owner Expenses & Advances Section - Only show for fleet owners */}
            {isFleetOwner && !isSelfOwner && (
              <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Receipt className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-blue-800 text-xl">
                          Fleet Owner Financial Tracking
                        </CardTitle>
                        <CardDescription className="text-blue-600">
                          Manage fleet vehicle expenses and advances
                        </CardDescription>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800 px-3 py-1">
                        Fleet Owner
                      </Badge>
                    </div>
                    <div className="flex space-x-2">
                      {/* <Button
                        onClick={() => setFleetExpenseForm(!fleetExpenseForm)}
                        className="bg-red-600 hover:bg-red-700 shadow-md"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Expense
                      </Button> */}
                      <Button
                        onClick={() => setFleetAdvanceForm(!fleetAdvanceForm)}
                        className="bg-green-600 hover:bg-green-700 shadow-md"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Advance
                      </Button>
                      <Button
                        onClick={() => setShowReceiptDialog(true)}
                        className="bg-blue-600 hover:bg-blue-700 shadow-md"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Receipt
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Fleet Owner Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3  gap-4 mb-6">
                    <Card className="bg-gradient-to-r from-green-100 to-green-200 hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-5 w-5 text-green-600" />
                          <div>
                            <div className="text-sm text-green-700 font-medium">
                              Total Fleet Owner
                            </div>
                            <div className="text-xl font-bold text-green-800">
                              {formatCurrency(tripRate)}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* <Card className="bg-gradient-to-r from-red-100 to-red-200 hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <Wallet className="h-5 w-5 text-red-600" />
                          <div>
                            <div className="text-sm text-red-700 font-medium">
                              Total Expenses
                            </div>
                            <div className="text-xl font-bold text-red-800">
                              {formatCurrency(totalFleetExpenses)}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card> */}

                    <Card className="bg-gradient-to-r from-purple-100 to-purple-200 hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <CreditCard className="h-5 w-5 text-purple-600" />
                          <div>
                            <div className="text-sm text-purple-700 font-medium">
                              Total Advances
                            </div>
                            <div className="text-xl font-bold text-purple-800">
                              {formatCurrency(totalFleetAdvances)}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card
                      className={`bg-gradient-to-r hover:shadow-md transition-shadow ${netProfit >= 0
                          ? "from-blue-100 to-blue-200"
                          : "from-orange-100 to-orange-200"
                        }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <TrendingUp
                            className={`h-5 w-5 ${netProfit >= 0
                                ? "text-blue-600"
                                : "text-orange-600"
                              }`}
                          />
                          <div>
                            <div
                              className={`text-sm font-medium ${netProfit >= 0
                                  ? "text-blue-700"
                                  : "text-orange-700"
                                }`}
                            >
                              Pending Fleet Owner
                            </div>
                            <div
                              className={`text-xl font-bold ${netProfit >= 0
                                  ? "text-blue-800"
                                  : "text-orange-800"
                                }`}
                            >
                              {formatCurrency(finalAmount)}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Forms */}
                  <FleetExpenseForm
                    handleSubmit={handleFleetExpenseSubmit}
                    open={fleetExpenseForm}
                    onClose={() => setFleetExpenseForm(false)}
                  />

                  <FleetAdvanceForm
                    handleSubmit={handleFleetAdvanceSubmit}
                    open={fleetAdvanceForm}
                    onClose={() => setFleetAdvanceForm(false)}
                  />

                  {/* Tabs for Expenses and Advances */}
                  <Tabs defaultValue="expenses" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-1">
                      {/* <TabsTrigger
                        value="expenses"
                        className="flex items-center space-x-2"
                      >
                        <Receipt className="h-4 w-4" />
                        <span>
                          Expenses ({trip.fleetExpenses?.length || 0})
                        </span>
                      </TabsTrigger> */}
                      <TabsTrigger
                        value="advances"
                        className="flex items-center space-x-2"
                      >
                        <CreditCard className="h-4 w-4" />
                        <span>
                          Advances ({trip.fleetAdvances?.length || 0})
                        </span>
                      </TabsTrigger>
                    </TabsList>

                   
                    <TabsContent value="advances">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center border-b pb-2">
                          <h4 className="font-medium text-gray-700">
                            Advance Payment Details
                          </h4>
                          <p className="font-semibold text-purple-600">
                            Total: {formatCurrency(totalFleetAdvances)}
                          </p>
                        </div>

                        {trip.fleetAdvances && trip.fleetAdvances.length > 0 ? (
                          <div className="space-y-3">
                            {trip.fleetAdvances.map((advance, index) => (
                              <div
                                key={index}
                                className="flex justify-between items-start p-4 bg-white rounded-lg border hover:shadow-md transition-shadow"
                              >
                                <div className="flex items-start space-x-3">
                                  <div className="text-2xl">💰</div>
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <Badge
                                        className={getRecipientColor(
                                          advance.recipientType
                                        )}
                                      >
                                        {advance.recipientType.replace(
                                          "_",
                                          " "
                                        )}
                                      </Badge>
                                      <span className="text-sm text-gray-500">
                                        {formatDate(
                                          advance.createdAt,
                                          "MMM dd, yyyy HH:mm"
                                        )}
                                      </span>
                                    </div>
                                    <div className="font-medium text-gray-900 mb-1">
                                      {advance.reason}
                                    </div>
                                    <div className="text-sm text-gray-600 mb-1">
                                      To: {advance.recipientName}
                                    </div>
                                    {advance.description && (
                                      <div className="text-sm text-gray-600 mb-1">
                                        {advance.description}
                                      </div>
                                    )}
                                    {advance.referenceNumber && (
                                      <div className="text-xs text-blue-600">
                                        Ref: {advance.referenceNumber}
                                      </div>
                                    )}
                                  </div>
                                </div>
                           <div className="text-right">
  <div className="text-lg font-bold text-purple-600">
    {formatCurrency(advance.amount)}
  </div>
  <button
    onClick={() => handleDeleteFleetAdvance(index)}
    className="text-red-500 text-sm mt-2 hover:underline cursor-pointer"
  >
    Delete
  </button>
</div>

                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <CreditCard className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                            <p>No advance payments recorded yet</p>
                            <p className="text-sm">
                              Click "Add Advance" to start tracking your advance
                              payments
                            </p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}

            {/* Clients and Load Details */}
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex flex-row justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center text-xl">
                      <Users className="h-5 w-5 mr-2" />
                      Clients & Load Details
                    </CardTitle>
                    <CardDescription>
                      Individual client details and their respective loads
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => setAddLoad(prev => !prev)}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Load
                  </Button>
                  <AddLoadDialog
                    open={addLoad}
                    onOpenChange={() => setAddLoad(prev => !prev)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <Tabs
                  defaultValue={trip.clients?.[0]?._id || "default"}
                  className="space-y-4"
                >
                  <TabsList
                    className="grid w-full"
                    style={{
                      gridTemplateColumns: `repeat(${trip.clients?.length ||
                        1}, minmax(0, 1fr))`
                    }}
                  >
                    {trip.clients?.map((clientData, index) => (
                      <TabsTrigger
                        key={clientData._id}
                        value={clientData._id}
                        className="text-sm"
                      >
                        {clientData.client?.name || "Unknown Client"}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {trip.clients?.map((clientData, index) => (
                    <TabsContent key={clientData._id} value={clientData._id}>
                      <div className="border rounded-lg p-6 bg-gradient-to-r from-gray-50 to-white">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center space-x-4">
                            <Avatar className="w-12 h-12">
                              <AvatarImage
                                src={
                                  clientData.client.profileImage ||
                                  "/placeholder.svg" ||
                                  "/placeholder.svg"
                                }
                              />
                              <AvatarFallback className="bg-blue-100 text-blue-800 text-lg">
                                {clientData.client.name
                                  .split(" ")
                                  .map(n => n[0])
                                  .join("")
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-semibold text-lg">
                                {clientData.client.name}
                              </div>
                              <div className="text-sm text-muted-foreground flex items-center">
                                <Mail className="h-3 w-3 mr-1" />
                                {clientData.client.email}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-row items-center gap-3 text-lg font-medium">
                            <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg">
                              {clientData.origin.city}
                            </div>
                            <div className="text-gray-400">→</div>
                            <div className="px-3 py-1 bg-green-100 text-green-800 rounded-lg">
                              {clientData.destination.city}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="space-y-2 font-medium">
                              <div className="text-lg">
                                Total Rate:{" "}
                                <span className="text-green-600 font-bold">
                                  {formatCurrency(clientData.totalRate ?? 0)}
                                </span>
                              </div>
                              <div className="text-sm">
                                Total Truck Hire Cost:{" "}
                                <span className="text-green-600 font-bold">
                                  {formatCurrency(clientData.truckHireCost ?? 0)}
                                </span>
                              </div>
                              <div className="text-sm">
                                Profite  client rate - truck cost:{" "}
                                <span className="text-green-600 font-bold">
                                  {formatCurrency(Math.abs(clientData.truckHireCost - clientData.totalRate))}
                                </span>
                              </div>
                              <div className="text-sm">
                                Paid:{" "}
                                <span className="text-blue-600 font-semibold">
                                  {formatCurrency(clientData.paidAmount ?? 0)}
                                </span>
                              </div>
                              <div className="text-sm">
                                Expenses:{" "}
                                <span className="text-red-600 font-semibold">
                                  {formatCurrency(clientData.totalExpense ?? 0)}
                                </span>
                              </div>
                              <div className="text-lg border-t pt-2">
                                <span className="text-gray-600">Due: </span>
                                <span className="text-orange-600 font-bold">
                                  {formatCurrency(
                                    (clientData.totalRate ?? 0) -
                                    (clientData.paidAmount ?? 0) +
                                    (clientData.totalExpense ?? 0)
                                  )}
                                </span>
                              </div>
                            </div>

                            <Badge
                              variant={
                                clientData.invoiceGenerated
                                  ? "default"
                                  : "secondary"
                              }
                              className="mt-2"
                            >
                              {clientData.invoiceGenerated
                                ? "✅ Invoice Generated"
                                : "⏳ Pending Invoice"}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                          <div className="p-3 bg-white rounded-lg shadow-sm">
                            <div className="text-sm text-muted-foreground flex items-center mb-1">
                              <Package className="h-3 w-3 mr-1" />
                              Load Description
                            </div>
                            <div className="font-medium">
                              {clientData.loadDetails.description}
                            </div>
                          </div>
                          <div className="p-3 bg-white rounded-lg shadow-sm">
                            <div className="text-sm text-muted-foreground mb-1">
                              Weight & Quantity
                            </div>
                            <div className="font-medium">
                              {clientData.loadDetails.weight} tons •{" "}
                              {clientData.loadDetails.quantity} units
                            </div>
                          </div>
                          <div className="p-3 bg-white rounded-lg shadow-sm">
                            <div className="text-sm text-muted-foreground mb-1">
                              Type & Packaging
                            </div>
                            <div className="font-medium">
                              {clientData.loadDetails.loadType} •{" "}
                              {clientData.loadDetails.packagingType}
                            </div>
                          </div>
                          <div className="p-3 bg-white rounded-lg shadow-sm">
                            <div className="text-sm text-muted-foreground mb-1">
                              Status
                            </div>
                            <Badge className="font-medium">
                              {clientData.status}
                            </Badge>
                          </div>
                        </div>

                        {clientData.loadDetails.specialInstructions && (
                          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="text-sm text-yellow-800 font-medium mb-1">
                              Special Instructions
                            </div>
                            <div className="text-sm text-yellow-700">
                              {clientData.loadDetails.specialInstructions}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Memo Management Section */}
                      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Collection Memo Section */}
                        <Card className="border-blue-200 bg-blue-50">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-blue-800 text-lg flex items-center">
                                <Memo className="h-5 w-5 mr-2" />
                                Collection Memos
                              </CardTitle>
                              <Button
                                onClick={() => {
                                  setSelectedClientForMemo(clientData)
                                  setShowCollectionMemoDialog(true)
                                }}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Create
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {clientData.collectionMemos &&
                              clientData.collectionMemos.length > 0 ? (
                              <div className="space-y-2">
                                {clientData.collectionMemos.map(
                                  (memo, memoIndex) => (
                                    <div
                                      key={memoIndex}
                                      className="p-3 bg-white rounded-lg border shadow-sm"
                                    >
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <div className="font-medium text-blue-800">
                                            #{memo.collectionNumber}
                                          </div>
                                          <div className="text-sm text-gray-600">
                                            Freight:{" "}
                                            {formatCurrency(memo.freight)}
                                          </div>
                                          <div className="text-sm text-gray-600">
                                            Balance:{" "}
                                            {formatCurrency(memo.balance)}
                                          </div>
                                        </div>
                                        {memo.documentUrl && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              window.open(
                                                memo.documentUrl,
                                                "_blank"
                                              )
                                            }
                                          >
                                            <FileText className="h-4 w-4" />
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>
                            ) : (
                              <div className="text-center py-4 text-gray-500">
                                <Memo className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                <p className="text-sm">
                                  No collection memos yet
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {/* Balance Memo Section */}
                        <Card className="border-green-200 bg-green-50">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-green-800 text-lg flex items-center">
                                <ReceiptText className="h-5 w-5 mr-2" />
                                Balance Memos
                              </CardTitle>
                              <Button
                                onClick={() => {
                                  setSelectedClientForMemo(clientData)
                                  setShowBalanceMemoDialog(true)
                                }}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Create
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {clientData.balanceMemos &&
                              clientData.balanceMemos.length > 0 ? (
                              <div className="space-y-2">
                                {clientData.balanceMemos.map(
                                  (memo, memoIndex) => (
                                    <div
                                      key={memoIndex}
                                      className="p-3 bg-white rounded-lg border shadow-sm"
                                    >
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <div className="font-medium text-green-800">
                                            Bill #{memo.billNumber}
                                          </div>
                                          <div className="text-sm text-gray-600">
                                            Total:{" "}
                                            {formatCurrency(memo.totalAmount)}
                                          </div>
                                          <div className="text-sm text-gray-600">
                                            Balance:{" "}
                                            {formatCurrency(memo.balanceAmount)}
                                          </div>
                                        </div>
                                        {memo.documentUrl && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              window.open(
                                                memo.documentUrl,
                                                "_blank"
                                              )
                                            }
                                          >
                                            <FileText className="h-4 w-4" />
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>
                            ) : (
                              <div className="text-center py-4 text-gray-500">
                                <ReceiptText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                <p className="text-sm">No balance memos yet</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>

                      {/* Client Statement Generator */}
                      <ClientStatementGenerator
                        clientData={clientData}
                        tripData={trip}
                      />

                      {/* Payments Section */}
                      <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex justify-between items-center border-b border-green-200 pb-3 mb-4">
                          <h4 className="font-semibold text-green-800 flex items-center">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Payments Received
                          </h4>
                          <p className="font-bold text-green-700 text-lg">
                            {formatCurrency(
                              clientData.advances?.reduce(
                                (sum, item) => sum + item.amount,
                                0
                              ) || 0
                            )}
                          </p>
                        </div>

                        <div className="space-y-2 mb-4">
                          {clientData.advances?.map((item, advanceIndex) => (
                            <div
                              key={advanceIndex}
                              className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    Payment #{advanceIndex + 1}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {formatDate(item.paidAt, "MMM dd, yyyy HH:mm")}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center space-x-2">
                                <p className="font-semibold text-green-600">
                                  {formatCurrency(item.amount)}
                                </p>

                                {/* 🗑 Delete Button */}
                                <button
                                  onClick={() => handleDeleteAdvance(params.id, index, advanceIndex)}
                                  className="text-red-500 hover:text-red-700 text-xs cursor pointer"
                                  title="Delete Advance"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>


                        <Button
                          variant="outline"
                          className="w-full border-green-300 text-green-700 hover:bg-green-100"
                          onClick={() => setAdvancePay(prev => !prev)}
                        >
                          <PlusCircle className="w-4 h-4 mr-2" />
                          {advancePay ? "Cancel" : "Add Payment"}
                        </Button>
                        <APaymentForm
                          handleSubmit={handleASubmit}
                          open={advancePay}
                          index={index}
                        />
                      </div>

                      {/* Expenses Section */}
                      <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex justify-between items-center border-b border-red-200 pb-3 mb-4">
                          <h4 className="font-semibold text-red-800 flex items-center">
                            <Wallet className="h-4 w-4 mr-2" />
                            Client Expenses
                          </h4>
                          <p className="font-bold text-red-700 text-lg">
                            {formatCurrency(
                              clientData.expenses?.reduce(
                                (sum, item) => sum + item.amount,
                                0
                              ) || 0
                            )}
                          </p>
                        </div>

                 <div className="space-y-2 mb-4">
  {clientData.expenses?.map((item, expenseIndex) => (
    <div
      key={expenseIndex}
      className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center space-x-3">
        <div className="w-3 h-3 rounded-full bg-red-500"></div>
        <div>
          <p className="text-sm font-medium text-gray-900">
            Expense #{expenseIndex + 1}
          </p>
          <p className="text-xs text-gray-500">
            {formatDate(item.paidAt, "MMM dd, yyyy HH:mm")}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <p className="font-semibold text-red-600">
          {formatCurrency(item.amount)}
        </p>

        {/* 🗑 Delete Button */}
        <button
          onClick={() =>
            handleDeleteExpense(params.id, index, expenseIndex)
          }
          className="text-red-500 hover:text-red-700 text-xs cursor-pointer"
          title="Delete Expense"
        >
    Remove
        </button>
      </div>
    </div>
  ))}
</div>


                        <Button
                          variant="outline"
                          className="w-full border-red-300 text-red-700 hover:bg-red-100"
                          onClick={() => setExpensesPay(prev => !prev)}
                        >
                          <PlusCircle className="w-4 h-4 mr-2" />
                          {expensesPay ? "Cancel" : "Add Expense"}
                        </Button>
                        <EPaymentForm
                          handleSubmit={handleESubmit}
                          open={expensesPay}
                          index={index}
                        />
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>

            {/* Special Instructions */}
            {trip.specialInstructions && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2 text-orange-600" />
                    Special Instructions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-orange-800">
                      {trip.specialInstructions}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}




        {/* Enhanced POD Management Section */}
        <Card className="border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <FileText className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <CardTitle className="text-indigo-800 text-xl">
                    POD Management System
                  </CardTitle>
                  <CardDescription className="text-indigo-600">
                    Track your Proof of Delivery status in real-time
                  </CardDescription>
                </div>
                <Badge className="bg-indigo-100 text-indigo-800 px-3 py-1 text-sm font-medium">
                  {trip?.podManage?.status
                    ?.replace("_", " ")
                    .toUpperCase() || "NOT STARTED"}
                </Badge>
              </div>
              {canManagePOD && (
                <Button
                  onClick={() => setShowPODDialog(true)}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Manage POD
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Progress Steps with Enhanced Design */}
            <div className="relative">
              {/* Background Progress Line */}
              <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 rounded-full">
                <div
                  className="h-full bg-gradient-to-r from-green-400 via-blue-500 to-indigo-600 rounded-full transition-all duration-1000 ease-in-out shadow-sm"
                  style={{
                    width: `${((currentIndex + 1) / steps.length) * 100}%`
                  }}
                />
              </div>

              {/* Steps */}
              <div className="relative flex justify-between">
                {steps.map((step, index) => {
                  const isDone = index < currentIndex
                  const isCurrent = index === currentIndex
                  const isNext = index === currentIndex + 1
                  const isPending = index > currentIndex

                  return (
                    <div
                      key={step.key}
                      className="flex flex-col items-center space-y-3 relative"
                    >
                      {/* Step Circle with Enhanced Design */}
                      <div
                        className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 transform hover:scale-110 shadow-lg ${isDone
                            ? "bg-gradient-to-r from-green-400 to-green-600 text-white shadow-green-200"
                            : isCurrent
                              ? "bg-gradient-to-r from-indigo-400 to-indigo-600 text-white shadow-indigo-200 animate-pulse"
                              : isNext
                                ? "bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-700 border-2 border-yellow-300 shadow-yellow-100"
                                : "bg-gray-200 text-gray-400 shadow-gray-100"
                          }`}
                      >
                        {isDone ? (
                          <CheckCircle className="w-6 h-6" />
                        ) : isCurrent ? (
                          <div className="flex items-center justify-center">
                            <Clock className="w-5 h-5 animate-spin" />
                          </div>
                        ) : isNext ? (
                          <AlertCircle className="w-5 h-5" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}

                        {/* Pulse animation for current step */}
                        {isCurrent && (
                          <div className="absolute inset-0 rounded-full bg-indigo-400 animate-ping opacity-30" />
                        )}
                      </div>

                      {/* Step Label with Enhanced Typography */}
                      <div className="text-center max-w-24">
                        <div
                          className={`text-sm font-semibold transition-colors duration-300 ${isDone
                              ? "text-green-700"
                              : isCurrent
                                ? "text-indigo-700"
                                : isNext
                                  ? "text-yellow-700"
                                  : "text-gray-500"
                            }`}
                        >
                          {step.label}
                        </div>

                        {/* Emoji indicator */}
                        <div className="text-lg mt-1">{step.icon}</div>

                        {/* Timestamp for completed/current steps */}
                        {(isDone || isCurrent) && trip.podManage?.date && (
                          <div className="text-xs text-gray-500 mt-2 bg-white px-2 py-1 rounded-full shadow-sm">
                            {formatDate(
                              trip.podManage.date,
                              "MMM dd, HH:mm"
                            )}
                          </div>
                        )}
                      </div>

                      {/* Optional Document Upload for each step */}
                      {(isDone || isCurrent) && (
                        <PODStepUpload
                          stepName={step.label}
                          onUpload={file =>
                            handlePODStepUpload(file, step.key)
                          }
                          existingDocument={
                            trip.podManage?.stepDocuments?.[step.key]
                          }
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Enhanced Action Section */}
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  {/* Current Status Info */}
                  <div className="text-center">
                    <div className="text-sm text-gray-600 font-medium">
                      Current Status
                    </div>
                    <div className="text-lg font-bold text-gray-900 mt-1">
                      {steps[currentIndex]?.label || "Not Started"}
                    </div>
                  </div>

                  {/* Progress Percentage with Circular Progress */}
                  <div className="text-center">
                    <div className="relative w-16 h-16">
                      <svg
                        className="w-16 h-16 transform -rotate-90"
                        viewBox="0 0 64 64"
                      >
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                          className="text-gray-200"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 28}`}
                          strokeDashoffset={`${2 *
                            Math.PI *
                            28 *
                            (1 - (currentIndex + 1) / steps.length)}`}
                          className="text-indigo-600 transition-all duration-1000 ease-in-out"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-bold text-indigo-600">
                          {Math.round(
                            ((currentIndex + 1) / steps.length) * 100
                          )}
                          %
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Complete
                    </div>
                  </div>

                  {/* Next Step Info */}
                  {currentIndex < steps.length - 1 && (
                    <div className="text-center">
                      <div className="text-sm text-gray-600 font-medium">
                        Next Step
                      </div>
                      <div className="text-md font-semibold text-indigo-600 mt-1">
                        {steps[currentIndex + 1]?.label}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-3">
                  {canManagePOD && currentIndex < steps.length - 1 && (
                    <Button
                      onClick={handleStepClick}
                      disabled={isUpdatingPOD}
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-md px-6 py-2"
                    >
                      {isUpdatingPOD ? (
                        <>
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>Advance to: {steps[currentIndex + 1]?.label}</>
                      )}
                    </Button>
                  )}

                  {currentIndex === steps.length - 1 && (
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-green-100 text-green-800 px-4 py-2 text-sm font-medium">
                        ✅ Trip Completed Successfully
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* POD Document Preview with Enhanced Design */}
            {trip?.podManage?.document?.url && (
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-indigo-600" />
                    POD Document
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open(trip.podManage.document.url, "_blank")
                    }
                    className="hover:bg-indigo-50 hover:border-indigo-300"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    View Full Size
                  </Button>
                </div>
                <div className="flex justify-center">
                  <img
                    src={`${trip.podManage.document.url ||
                      "/placeholder.svg"}`}
                    alt="POD Document"
                    className="max-w-xs rounded-lg border shadow-md hover:shadow-lg transition-shadow cursor-pointer transform hover:scale-105"
                    onClick={() =>
                      window.open(trip.podManage.document.url, "_blank")
                    }
                  />
                </div>
              </div>
            )}

            {/* Additional POD Information with Enhanced Cards */}
            {trip?.podManage && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl shadow-sm border border-blue-200">
                  <div className="text-sm text-blue-600 font-semibold flex items-center">
                    <FileText className="h-4 w-4 mr-1" />
                    POD Number
                  </div>
                  <div className="text-lg font-bold text-blue-900 mt-1">
                    {trip.podManage.podNumber || "Not assigned"}
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl shadow-sm border border-green-200">
                  <div className="text-sm text-green-600 font-semibold flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Received Date
                  </div>
                  <div className="text-lg font-bold text-green-900 mt-1">
                    {trip.podManage.receivedDate
                      ? formatDate(
                        trip.podManage.receivedDate,
                        "MMM dd, yyyy"
                      )
                      : "Pending"}
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl shadow-sm border border-purple-200">
                  <div className="text-sm text-purple-600 font-semibold flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Submitted Date
                  </div>
                  <div className="text-lg font-bold text-purple-900 mt-1">
                    {trip.podManage.submittedDate
                      ? formatDate(
                        trip.podManage.submittedDate,
                        "MMM dd, yyyy"
                      )
                      : "Pending"}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* POD Upload Dialog */}
        <PODDetailsDialog
          show={showPODDialog}
          setShow={setShowPODDialog}
          trip={trip}
        />
        <FleetReceiptDialog
          trip={trip}
          open={showReceiptDialog}
          onOpenChange={setShowReceiptDialog}
        />
        <DriverReceiptDialog
          trip={trip}
          open={showDriverReceiptDialog}
          onOpenChange={setShowDriverReceiptDialog}
        />

        {/* Collection Memo Dialog */}
        <CollectionMemoDialog
          open={showCollectionMemoDialog}
          onOpenChange={setShowCollectionMemoDialog}
          clientData={selectedClientForMemo}
          tripData={trip}
          onSubmit={handleCollectionMemoSubmit}
        />

        {/* Balance Memo Dialog */}
        <BalanceMemoDialog
          open={showBalanceMemoDialog}
          onOpenChange={setShowBalanceMemoDialog}
          clientData={selectedClientForMemo}
          tripData={trip}
          onSubmit={handleBalanceMemoSubmit}
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              Delete Trip
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this trip? This action cannot be
              undone and will permanently remove all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate(params.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Trip"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <EnhancedEditTripDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={handleEditSuccess}
        tripData={trip}
      />
    </DashboardLayout>
  )
}
