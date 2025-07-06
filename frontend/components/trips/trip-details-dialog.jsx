"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { MapPin, Truck, User, Calendar, DollarSign, FileText } from "lucide-react"

export function TripDetailsDialog({ trip, open, onOpenChange }) {
  if (!trip) return null

  const getStatusColor = (status) => {
    switch (status) {
      case "booked":
        return "bg-blue-100 text-blue-800"
      case "in_progress":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[80vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Trip Details - {trip.tripNumber
}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="route">Route</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Route Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <span className="font-medium">From:</span> {trip.origin.city}
                  </div>
                  <div>
                    <span className="font-medium">To:</span> {trip.destination.city}
                  </div>
                  <div>
                    <span className="font-medium">Distance:</span> {trip.distance} km
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>
                    <Badge className={`ml-2 ${getStatusColor(trip.status)}`}>
                      {trip.status.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Vehicle & Driver
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <span className="font-medium">Vehicle:</span> {trip.vehicle?.registrationNumber}
                  </div>
                  <div>
                    <span className="font-medium">Model:</span> {trip.vehicle?.make} {trip.vehicle?.model}
                  </div>
                  <div>
                    <span className="font-medium">Driver:</span> {trip.driver?.name}
                  </div>
                  <div>
                    <span className="font-medium">Contact:</span> {trip.driver?.phone}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Client Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <span className="font-medium">Client:</span> {trip.client?.name}
                  </div>
                  <div>
                    <span className="font-medium">Contact:</span> {trip.client?.phone}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span> {trip.client?.email}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <span className="font-medium">Start Date:</span> {new Date(trip.scheduledDate).toLocaleDateString()}
                  </div>
                  <div>
                    <span className="font-medium">End Date:</span>{" "}
                    {trip.endDate ? new Date(trip.endDate).toLocaleDateString() : "Pending"}
                  </div>
                  <div>
                    <span className="font-medium">Duration:</span> {trip.estimatedDuration} hours
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Load Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="font-medium">Type:</span> {trip.loadDetails?.loadType}
                  </div>
                  <div>
                    <span className="font-medium">Weight:</span> {trip.loadDetails?.weight} T
                  </div>
                  <div>
                    <span className="font-medium">Quantity:</span> {trip.loadDetails?.quantity?.toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Description:</span> {trip.loadDetails?.description}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="route" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Route Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="font-medium">{trip.origin.address},{trip.origin.city},{trip.origin.state},{trip.origin.pincode}</div>
                      <div className="text-sm text-gray-500">Starting Point</div>
                    </div>
                    <div className="text-sm text-gray-500">{new Date(trip.scheduledDate).toLocaleString()}</div>
                  </div>

                  {/* {trip.waypoints?.map((waypoint, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="flex-1">
                        <div className="font-medium">{waypoint.location}</div>
                        <div className="text-sm text-gray-500">Waypoint {index + 1}</div>
                      </div>
                      <div className="text-sm text-gray-500">{waypoint.estimatedTime}</div>
                    </div>
                  ))} */}

                  <div className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="font-medium">{trip.destination.address},{trip.destination.city},{trip.destination.state}{trip.destination.pincode}</div>
                      <div className="text-sm text-gray-500">Destination</div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {trip.endDate ? new Date(trip.endDate).toLocaleString() : "Pending"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {/* <DollarSign className="h-4 w-4" /> */}
                    Pricing Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Client Rate:</span>
                    <span className="font-medium">₹{trip.pricing?.clientRate?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fleet Owner Rate:</span>
                    <span className="font-medium">₹{trip.pricing?.fleetOwnerRate?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Commission:</span>
                    <span className="font-medium">₹{trip.pricing?.commission?.toLocaleString()}</span>
                  </div>
                  {/* <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Total Amount:</span>
                    <span className="font-bold">₹{trip.totalAmount?.toLocaleString()}</span>
                  </div> */}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Advance Paid:</span>
                    <span className="font-medium">₹{trip.advancePaid?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Balance Amount:</span>
                    <span className="font-medium">₹{trip.balanceAmount?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Status:</span>
                    <Badge
                      className={
                        trip.paymentStatus === "paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                      }
                    >
                      {trip.paymentStatus?.toUpperCase()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {trip.expenses?.map((expense, index) => (
                    <div key={index} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <div className="font-medium">{expense.type}</div>
                        <div className="text-sm text-gray-500">{expense.description}</div>
                      </div>
                      <div className="font-medium">₹{expense.amount?.toLocaleString()}</div>
                    </div>
                  )) || <div className="text-gray-500">No expenses recorded</div>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Trip Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {trip.documents.invoices?.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{doc?.name}</div>
                        <div className="text-sm text-gray-500">{doc.type}</div>
                      </div>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </div>
                  )) || <div className="text-gray-500">No documents uploaded</div>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
