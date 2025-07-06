import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { tripsApi } from "@/lib/api"
import { Loader2, FileEdit } from "lucide-react"
import { toast } from "react-hot-toast";

const paymentOptions = ["cash", "bank", "online", "upi"]

export default function PODDetailsDialog({ show, setShow, trip }) {
  const [podGive, setPodGive] = useState(trip.podBalance)
  const [paymentType, setPaymentType] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!podGive || isNaN(Number(podGive))) {
      return toast.error("❗ Please enter a valid POD amount")
    }

    try {
      setLoading(true)
      await tripsApi.updatePodDetails(trip._id, {
        podGive: Number(podGive),
        paymentType,
        notes,
      })
      toast.success("✅ POD details updated successfully")
      setShow(false)
    } catch (err) {
      console.error(err)
      toast.error("🚨 Failed to update POD details")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={show} onOpenChange={setShow}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileEdit className="w-5 h-5" /> POD Details
          </DialogTitle>
          <DialogDescription>
            Enter POD payment details for trip <strong>#{trip?.tripNumber || trip?._id?.slice(-5)}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <Input
            type="number"
            placeholder="POD Give Amount"
            value={podGive}
            disabled
            onChange={(e) => setPodGive(e.target.value)}
          />

          <select
            className="w-full border rounded p-2"
            value={paymentType}
            onChange={(e) => setPaymentType(e.target.value)}
          >
            <option value="">Select Payment Type</option>
            {paymentOptions.map((type) => (
              <option key={type} value={type}>{type.toUpperCase()}</option>
            ))}
          </select>

          <Textarea
            placeholder="Optional notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => setShow(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
