"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { toast } from "sonner"
import { usersApi } from "lib/api"

const ClientAdjustmentPanel = ({ clientId }) => {
  const [adjustmentData, setAdjustmentData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [payAdjustment, setPayAdjustment] = useState("")

  const fetchAdjustment = async () => {
    if (!clientId) return
    try {
      setLoading(true)
      const res = await usersApi.getAdujstmetn(clientId)
      if (res.success) {
        setAdjustmentData(res)
        
      } else {
        toast({ title: "Failed to fetch", variant: "destructive" })
      }
    } catch (err) {
      console.error("Error fetching adjustment:", err)
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }


  const handlePayAdjustment = async () => {
  try {
    if (!payAdjustment || isNaN(payAdjustment)) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }

    const res = await usersApi.payAdjustment(clientId, Number(payAdjustment));
    if (res.success) {
      toast({ title: "Payment Successful", description: "Adjustment recorded." });
      fetchAdjustment(); // Refetch updated data
      setPayAdjustment("")
    } else {
      toast({ title: "Payment failed", variant: "destructive" });
    }
  } catch (err) {
    console.error("Payment error:", err);
    toast({ title: "Error", description: err.message, variant: "destructive" });
  }
};



  useEffect(() => {
    fetchAdjustment()
  }, [clientId])

  if (loading || !adjustmentData) return <p>Loading...</p>

  const { client, summary, trips } = adjustmentData

  return (
    <Card className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Client: {client.name}</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>Total Trips: {summary.totalTrips}</div>
        <div>Trips with Adjustment: {summary.totalTripsWithArgestment}</div>
        <div>Total Adjustment: ₹{summary.totalArgestment}</div>
        <div>Total Pay Adjustment: ₹{summary.totalPayArgestment}</div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="payAdjustment">Pay Adjustment (₹)</Label>
        <Input
          id="payAdjustment"
          type="number"
          value={payAdjustment}
          onChange={(e) => setPayAdjustment(e.target.value)}
        />
     <Button onClick={handlePayAdjustment}>Pay Adjustment</Button>

      </div>
      <h3 className="text-md font-medium mt-4">Trip Adjustments</h3>
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {trips.map((trip, i) => (
          <Card key={i} className="p-2">
            <CardContent className="flex justify-between items-center">
              <div>
                <div className="font-medium">{trip.tripNumber}</div>
                <div className="text-sm text-muted-foreground">
                  {trip.route} | {format(new Date(trip.loadDate), "PPP")}
                </div>
              </div>
              <div className="text-right">
                <div>Vehicle: {trip.vehicleNumber}</div>
                <div className="font-semibold text-green-600">₹{trip.argestment}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </Card>
  )
}

export default ClientAdjustmentPanel
