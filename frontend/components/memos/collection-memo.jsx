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
import { FileText, Upload, X, Download } from "lucide-react"
import { toast } from "react-hot-toast"
import { generateCollectionMemoPDF } from "./pdf-generetors"
import { formatDate } from "@/lib/utils"

const collectionMemoSchema = z.object({
  collectionNumber: z.string().min(1, "Collection number is required"),
  lorryNumber: z.string().min(1, "Lorry number is required"),
  from: z.string().min(1, "From location is required"),
  to: z.string().min(1, "To location is required"),
  freight: z.number().min(0, "Freight must be a positive number"),
  advance: z.number().min(0, "Advance must be a positive number"),
  balance: z.number().min(0, "Balance must be a positive number"),
  weight: z.string().optional(),
  guarantee: z.string().optional(),
  payableAt: z.string().optional(),
  extraHeightLength: z.string().optional(),
  perDayDetention: z.string().optional(),
  remarks: z.string().optional()
})

export function CollectionMemoDialog({
  open,
  onOpenChange,
  clientData,
  tripData,
  onSubmit
}) {
  const [uploadedFile, setUploadedFile] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm({
    resolver: zodResolver(collectionMemoSchema),
    defaultValues: {
      collectionNumber: `COL-${Date.now()
        .toString()
        .slice(-6)}`,
      lorryNumber: tripData?.vehicle?.registrationNumber || "",
      from: clientData?.origin?.city || "",
      to: clientData?.destination?.city || "",
      freight: clientData?.totalRate || 0,
      advance: clientData?.paidAmount || 0,
      balance: (clientData?.totalRate || 0) - (clientData?.paidAmount || 0),
      weight: `${clientData?.loadDetails?.weight || 0} tons`,
      guarantee: "",
      payableAt: clientData?.destination?.city || "",
      extraHeightLength: "",
      perDayDetention: "Rs. 500 per day",
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

  const handleSubmit = async data => {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("collectionMemo", JSON.stringify(data))
      if (uploadedFile) {
        formData.append("document", uploadedFile)
      }

      await onSubmit(formData)
      form.reset()
      setUploadedFile(null)
      onOpenChange(false)
    } catch (error) {
      console.error("Error submitting collection memo:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const downloadPDF = () => {
    const formData = form.getValues()
    const doc = generateCollectionMemoPDF(formData, clientData, tripData)
    doc.save(
      `Collection_Memo_${formData.collectionNumber}_${formatDate(
        new Date(),
        "dd-MM-yyyy"
      )}.pdf`
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-blue-800">
            <FileText className="h-5 w-5 mr-2" />
            Create Collection Memo - {clientData?.client?.name}
          </DialogTitle>
          <DialogDescription>
            Generate a collection memo for this client's shipment
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="collectionNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Collection Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter collection number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lorryNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lorry Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter lorry number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="from"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From *</FormLabel>
                    <FormControl>
                      <Input placeholder="From location" {...field} />
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
                      <Input placeholder="To location" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                          const freight = Number(e.target.value)
                          field.onChange(freight)
                          const advance = form.getValues("advance")
                          form.setValue("balance", freight - advance)
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
                          const advance = Number(e.target.value)
                          field.onChange(advance)
                          const freight = form.getValues("freight")
                          form.setValue("balance", freight - advance)
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="balance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Balance (₹) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        readOnly
                        className="bg-gray-50"
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
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter weight" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="guarantee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Guarantee</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter guarantee" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="payableAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payable At</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter payable location" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="perDayDetention"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Per Day Detention</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter detention charges" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="extraHeightLength"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Extra Height & Length</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter extra dimensions if any"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                  <label htmlFor="memo-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      Upload Collection Memo Document (Optional)
                    </span>
                    <span className="mt-1 block text-xs text-gray-500">
                      PNG, JPG, PDF up to 5MB
                    </span>
                  </label>
                  <input
                    id="memo-upload"
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
                className="bg-blue-100 text-blue-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? "Creating..." : "Create Collection Memo"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
