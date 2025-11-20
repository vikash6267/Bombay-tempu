"use client"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form"
import { Receipt, Upload, X, Download } from "lucide-react"
import { toast } from "react-hot-toast"
import { formatCurrency, formatDate } from "@/lib/utils"
import { generateBalanceMemoPDF } from "./pdf-generetors"

const balanceMemoSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  vehicleNumber: z.string().min(1, "Vehicle number is required"),
  from: z.string().min(1, "From location is required"),
  to: z.string().min(1, "To location is required"),
  freight: z.number().min(0, "Freight must be positive"),
  advance: z.number().min(0, "Advance must be positive"),
  detention: z.number().min(0, "Detention must be positive"),
  unloadingCharge: z.number().min(0, "Unloading charge must be positive"),
  totalPayableAmount: z.number().min(0, "Total payable amount must be positive"),
  remark: z.string().optional()
})

export function BalanceMemoDialog({
  open,
  onOpenChange,
  clientData,
  tripData,
  onSubmit,
  editData = null
}) {
  const [uploadedFile, setUploadedFile] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
console.log(tripData,"tripdata")
console.log(clientData,"clientData")
  const totalRate = clientData?.totalRate || 0
  const paidAmount = clientData?.paidAmount || 0
  const totalExpense = clientData?.totalExpense || 0
  const balanceDue = totalRate - paidAmount + totalExpense

  const form = useForm({
    resolver: zodResolver(balanceMemoSchema),
    defaultValues: editData ? {
      customerName: editData.customerName || "",
      invoiceNumber: editData.invoiceNumber || "",
      vehicleNumber: editData.vehicleNumber || "",
      from: editData.from || "",
      to: editData.to || "",
      freight: editData.freight || 0,
      advance: editData.advance || 0,
      detention: editData.detention || 0,
      unloadingCharge: editData.unloadingCharge || 0,
      totalPayableAmount: editData.totalPayableAmount || 0,
      remark: editData.remark || ""
    } : {
      customerName: clientData?.client?.name || "",
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      vehicleNumber: tripData?.vehicle?.registrationNumber || "",
      from: clientData?.origin?.city || "",
      to: clientData?.destination?.city || "",
      freight: totalRate || 0,
      advance: paidAmount || 0,
      detention: 0,
      unloadingCharge: totalExpense || 0,
      totalPayableAmount: balanceDue || 0,
      remark: ""
    }
  })

  // Reset form when clientData or tripData changes
  useEffect(() => {
    if (editData) {
      // If editing, populate with existing data
      form.reset({
        customerName: editData.customerName || "",
        invoiceNumber: editData.invoiceNumber || "",
        vehicleNumber: editData.vehicleNumber || "",
        from: editData.from || "",
        to: editData.to || "",
        freight: editData.freight || 0,
        advance: editData.advance || 0,
        detention: editData.detention || 0,
        unloadingCharge: editData.unloadingCharge || 0,
        totalPayableAmount: editData.totalPayableAmount || 0,
        remark: editData.remark || ""
      })
    } else if (clientData && tripData) {
      // If creating new, populate with client/trip data
      const totalRate = clientData?.totalRate || 0
      const paidAmount = clientData?.paidAmount || 0
      const totalExpense = clientData?.totalExpense || 0
      const balanceDue = totalRate - paidAmount + totalExpense

      form.reset({
        customerName: clientData?.client?.name || "",
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
        vehicleNumber: tripData?.vehicle?.registrationNumber || "",
        from: clientData?.origin?.city || "",
        to: clientData?.destination?.city || "",
        freight: totalRate || 0,
        advance: paidAmount || 0,
        detention: 0,
        unloadingCharge: totalExpense || 0,
        totalPayableAmount: balanceDue || 0,
        remark: ""
      })
    }
  }, [clientData, tripData, editData, form])

  const handleFileUpload = event => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size should be less than 5MB")
        return
      }
      setUploadedFile(file)
      toast.success("File uploaded successfully")
    }
  }

  const calculateTotalPayable = () => {
    const freight = form.getValues("freight") || 0
    const advance = form.getValues("advance") || 0
    const detention = form.getValues("detention") || 0
    const unloadingCharge = form.getValues("unloadingCharge") || 0
    
    // Total Payable = Freight - Advance + Detention + Unloading Charge
    const totalPayable = freight - advance + detention + unloadingCharge
    form.setValue("totalPayableAmount", totalPayable)
  }

  const handleSubmit = async data => {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("balanceMemo", JSON.stringify(data))
      if (uploadedFile) {
        formData.append("document", uploadedFile)
      }

      await onSubmit(formData)
      form.reset()
      setUploadedFile(null)
      onOpenChange(false)
    } catch (error) {
      console.error("Error submitting balance memo:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const downloadPDF = () => {
    const formData = form.getValues()

    console.log(formData)
    
    const doc = generateBalanceMemoPDF(formData, clientData, tripData)
    doc.save(
      `Balance_Memo_${formData.billNumber}_${formatDate(
        new Date(),
        "dd-MM-yyyy"
      )}.pdf`
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-green-800">
            <Receipt className="h-5 w-5 mr-2" />
            Create Balance Memo - {clientData?.client?.name}
          </DialogTitle>
          <DialogDescription>
            Generate a balance memo showing payment status for this client
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            {/* Customer Name and Invoice Number */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter customer name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="invoiceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter invoice number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Vehicle Number */}
            <FormField
              control={form.control}
              name="vehicleNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle Number *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter vehicle number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* From and To */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="from"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From *</FormLabel>
                    <FormControl>
                      <Input placeholder="Origin city" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To *</FormLabel>
                    <FormControl>
                      <Input placeholder="Destination city" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Freight and Advance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="freight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Freight (₹) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={e => {
                          field.onChange(Number(e.target.value))
                          calculateTotalPayable()
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="advance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Advance (₹) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={e => {
                          field.onChange(Number(e.target.value))
                          calculateTotalPayable()
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Detention and Unloading Charge */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="detention"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detention (₹) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={e => {
                          field.onChange(Number(e.target.value))
                          calculateTotalPayable()
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unloadingCharge"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unloading Charge (₹) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={e => {
                          field.onChange(Number(e.target.value))
                          calculateTotalPayable()
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Total Payable Amount (Read-only, Auto-calculated) */}
            <FormField
              control={form.control}
              name="totalPayableAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Payable Amount (₹)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      readOnly
                      className="bg-green-50 font-bold text-lg text-green-700"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="remark"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remark / Dication Charge</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Dication Charge ₹1000 / Per Day"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* File Upload Section */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-2">
                  <label
                    htmlFor="balance-memo-upload"
                    className="cursor-pointer"
                  >
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      Upload Balance Memo Document (Optional)
                    </span>
                    <span className="mt-1 block text-xs text-gray-500">
                      PNG, JPG, PDF up to 5MB
                    </span>
                  </label>
                  <input
                    id="balance-memo-upload"
                    type="file"
                    className="hidden"
                    accept=".png,.jpg,.jpeg,.pdf"
                    onChange={handleFileUpload}
                  />
                </div>
              </div>
              {uploadedFile && (
                <div className="mt-2 flex items-center justify-between bg-green-50 p-2 rounded">
                  <span className="text-sm text-green-800">
                    {uploadedFile.name}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setUploadedFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={downloadPDF}
                className="bg-green-100 text-green-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? "Creating..." : "Create Balance Memo"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
