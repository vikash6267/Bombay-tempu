"use client"
import { useEffect, useRef, useState } from "react"
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form"
import { FileText, Download } from "lucide-react"
import { generateCollectionMemoPDF } from "./pdf-generetors"
import { CollectionMemo } from "./Format"


const collectionMemoSchema = z.object({
  collectionNumber: z.string().min(1, "Collection number is required"),
  date: z.string().min(1, "Date is required"),
  msName: z.string().min(1, "Party name (M/s.) is required"),
  lorryNumber: z.string().min(1, "Lorry number is required"),
  from: z.string().min(1, "From location is required"),
  to: z.string().min(1, "To location is required"),
  rate: z.string().min(1, "Rate is required"),
  freight: z.number().min(0, "Freight must be a positive number"),
  advance: z.number().min(0, "Advance must be a positive number"),
  balance: z.number().min(0, "Balance must be a positive number"),
  weight: z.string().min(1, "Weight is required"),
  guarantee: z.string().optional()
})

export function CollectionMemoDialog({
  open,
  onOpenChange,
  clientData,
  tripData,
  onSubmit,
  editData = null
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const todayStr = new Date().toLocaleDateString("en-GB") // dd/mm/yyyy
  const memoRef = useRef(null)

  const form = useForm({
    resolver: zodResolver(collectionMemoSchema),
    defaultValues: {
      collectionNumber: tripData?.tripNumber || `01`,
      date: todayStr,
      msName: "",
      lorryNumber: "",
      from: "",
      to: "",
      rate: "",
      freight: 0,
      advance: 0,
      balance: 0,
      weight: "",
      guarantee: ""
    }
  })

  useEffect(() => {
    if (editData) {
      // If editing, populate with existing data
      form.reset({
        collectionNumber: editData.collectionNumber || "01",
        date: editData.date || todayStr,
        msName: editData.msName || "",
        lorryNumber: editData.lorryNumber || "",
        from: editData.from || "",
        to: editData.to || "",
        rate: editData.rate || "",
        freight: editData.freight || 0,
        advance: editData.advance || 0,
        balance: editData.balance || 0,
        weight: editData.weight || "",
        guarantee: editData.guarantee || ""
      })
    } else if (clientData || tripData) {
      // If creating new, populate with client/trip data
      const totalRate = Number(clientData?.totalRate || 0)
      const paid = Number(clientData?.paidAmount || 0)
      const bal = Math.max(totalRate - paid, 0)

      form.reset({
        collectionNumber: tripData?.tripNumber || `01`,
        date: todayStr,
        msName: clientData?.client?.name || "",
        lorryNumber: tripData?.vehicle?.registrationNumber || "",
        from: clientData?.origin?.city || "",
        to: clientData?.destination?.city || "",
        rate: totalRate ? `₹ ${totalRate.toLocaleString("en-IN")}` : "",
        freight: totalRate || 0,
        advance: paid || 0,
        balance: bal,
        weight:
          typeof clientData?.loadDetails?.weight !== "undefined"
            ? `${clientData?.loadDetails?.weight} tons`
            : "",
        guarantee: ""
      })
    }
  }, [clientData, tripData, editData, form, todayStr])

  const handleSubmit = async data => {
    if (!onSubmit) {
      return
    }
    setIsSubmitting(true)
    try {
      const fd = new FormData()
      fd.append("collectionMemo", JSON.stringify(data))
      await onSubmit(fd)
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const downloadPDF = async () => {
    if (isDownloading) return
    setIsDownloading(true)
    try {
      const data = form.getValues()
      const doc = generateCollectionMemoPDF(data)
      const safeDate = (data.date || "").replace(/[/\\:?*"<>|]/g, "-")
      doc.save(`Collection_Memo_${data.collectionNumber}_${safeDate}.pdf`)
    } finally {
      setIsDownloading(false)
    }
  }

  // Watch form values for real-time preview update
  const formValues = form.watch()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>

           <div className="rounded border bg-white p-2">
        <CollectionMemo ref={memoRef} data={formValues}   />

        <Button
        onClick={() => memoRef.current?.download("collection-memo.pdf")}
        className="mt-4"
      >
        Download PDF
      </Button>
      </div>
          <DialogTitle className="flex items-center text-blue-800">
            <FileText className="h-5 w-5 mr-2" />
            Create Collection Memo{" "}
            {clientData?.client?.name ? `- ${clientData.client.name}` : ""}
          </DialogTitle>
          <DialogDescription>
            Generate a collection memo exactly as per the provided HTML format.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="collectionNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Collection No*</FormLabel>
                    <FormControl>
                      <Input placeholder="01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date*</FormLabel>
                    <FormControl>
                      <Input placeholder="dd/mm/yyyy" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="msName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>M/s.*</FormLabel>
                    <FormControl>
                      <Input placeholder="Party / Company name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="lorryNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lorry No*</FormLabel>
                    <FormControl>
                      <Input placeholder="Vehicle number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="from"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From*</FormLabel>
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
                      <FormLabel>To*</FormLabel>
                      <FormControl>
                        <Input placeholder="Destination city" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rate*</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., ₹ 25,000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="freight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Freight (₹)*</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={e => {
                          const freight = Number(e.target.value || 0)
                          field.onChange(freight)
                          const advance = form.getValues("advance")
                          form.setValue(
                            "balance",
                            Math.max(freight - advance, 0)
                          )
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
                    <FormLabel>Advance (₹)*</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={e => {
                          const advance = Number(e.target.value || 0)
                          field.onChange(advance)
                          const freight = form.getValues("freight")
                          form.setValue(
                            "balance",
                            Math.max(freight - advance, 0)
                          )
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="balance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Balance (₹)*</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        readOnly
                        className="bg-gray-50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight*</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 10 tons" {...field} />
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
                      <Input placeholder="Optional" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              {/* <Button
                type="button"
                variant="outline"
                onClick={downloadPDF}
                disabled={isDownloading}
                className="bg-blue-100 text-blue-700"
              >
                <Download className="h-4 w-4 mr-2" />
                {isDownloading ? "Downloading..." : "Download PDF"}
              </Button> */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? "Saving..." : "Save Memo"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
