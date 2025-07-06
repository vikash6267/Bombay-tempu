"use client"
import { useState } from "react"
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
  billNumber: z.string().min(1, "Bill number is required"),
  totalAmount: z.number().min(0, "Total amount must be positive"),
  advanceGiven: z.number().min(0, "Advance given must be positive"),
  expensesAdded: z.number().min(0, "Expenses added must be positive"),
  balanceAmount: z.number(),
  remarks: z.string().optional()
})

export function BalanceMemoDialog({
  open,
  onOpenChange,
  clientData,
  tripData,
  onSubmit
}) {
  const [uploadedFile, setUploadedFile] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const totalRate = clientData?.totalRate || 0
  const paidAmount = clientData?.paidAmount || 0
  const totalExpense = clientData?.totalExpense || 0
  const balanceDue = totalRate - paidAmount + totalExpense

  const form = useForm({
    resolver: zodResolver(balanceMemoSchema),
    defaultValues: {
      billNumber: `BILL-${Date.now()
        .toString()
        .slice(-6)}`,
      totalAmount: totalRate,
      advanceGiven: paidAmount,
      expensesAdded: totalExpense,
      balanceAmount: balanceDue,
      remarks: ""
    }
  })

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

  const calculateBalance = () => {
    const total = form.getValues("totalAmount")
    const advance = form.getValues("advanceGiven")
    const expenses = form.getValues("expensesAdded")
    const balance = total - advance + expenses
    form.setValue("balanceAmount", balance)
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
            <FormField
              control={form.control}
              name="billNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bill Number *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter bill number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Current Balance Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-3">
                Current Balance Summary
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Rate:</span>
                  <span className="font-semibold ml-2">
                    {formatCurrency(totalRate)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Advance Paid:</span>
                  <span className="font-semibold ml-2 text-blue-600">
                    {formatCurrency(paidAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Expenses Added:</span>
                  <span className="font-semibold ml-2 text-red-600">
                    {formatCurrency(totalExpense)}
                  </span>
                </div>
                <div className="col-span-2 border-t pt-2">
                  <span className="text-gray-600">Balance Due:</span>
                  <span
                    className={`font-bold ml-2 text-lg ${
                      balanceDue >= 0 ? "text-orange-600" : "text-green-600"
                    }`}
                  >
                    {formatCurrency(balanceDue)}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="totalAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Amount (₹) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={e => {
                          field.onChange(Number(e.target.value))
                          calculateBalance()
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="advanceGiven"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Advance Given (₹) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={e => {
                          field.onChange(Number(e.target.value))
                          calculateBalance()
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="expensesAdded"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expenses Added (₹) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={e => {
                          field.onChange(Number(e.target.value))
                          calculateBalance()
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="balanceAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Balance Amount (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        readOnly
                        className="bg-gray-50 font-semibold"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter any additional remarks"
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
