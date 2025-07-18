"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { DollarSign, Filter, Fuel, Truck, User, Wrench } from "lucide-react"
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { useEffect, useState } from "react"
import { vehiclesApi } from "lib/api"
import VehicleFinanceSummary from "./FinaceVechile"

export function VehicleDetailsDialog({ open, onOpenChange, vehicle }) {
  if (!vehicle) return null

  const getStatusColor = (status) => {
    const colors = {
      available: "default",
      booked: "secondary",
      maintenance: "destructive",
      inactive: "outline",
    }
    return colors[status] || "outline"
  }
  console.log("Vehicle Details:", vehicle)

  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [totalExpense, setTotalExpense] = useState(0);

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        if(!vehicle) return
        const res = await vehiclesApi.getExpenses(vehicle._id);
        console.log("Vehicle Expenses:", res);

        const allExpenses = res.expenseByDate
          ? Object.values(res.expenseByDate).flatMap((dateEntry) => dateEntry.expenses)
          : [];

        setExpenses(allExpenses);

        // ✅ Unique categories
        const uniqueCategories = Array.from(new Set(allExpenses.map((exp) => exp.category))).filter(Boolean);
        setCategories(uniqueCategories);

        setTotalExpense(res.totalExpense || 0);
      } catch (err) {
        console.error("Error fetching vehicle expenses:", err);
      }
    };

    fetchExpenses();
  }, [vehicle._id,vehicle,open]);

  // ✅ Filtered list based on dropdown
const filteredExpenses =
  selectedCategory === "__all__" || !selectedCategory
    ? expenses
    : expenses.filter((exp) => exp.category === selectedCategory);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[80vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Truck className="h-5 w-5" />
            <span>{vehicle.registrationNumber}</span>
            <Badge variant={getStatusColor(vehicle.status)}>{vehicle.status}</Badge>
          </DialogTitle>
          <DialogDescription>
            {vehicle.make} {vehicle.model} ({vehicle.year})
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Vehicle Details</TabsTrigger>
            <TabsTrigger value="loan">Loan Information</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Registration Number:</span>
                    <span className="font-medium">{vehicle.registrationNumber}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-medium">{vehicle.vehicleType}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Make & Model:</span>
                    <span className="font-medium">
                      {vehicle.make} {vehicle.model}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Year:</span>
                    <span className="font-medium">{vehicle.year}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Capacity:</span>
                    <span className="font-medium">{vehicle.capacity} tons</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fuel Type:</span>
                    <span className="font-medium flex items-center">
                      <Fuel className="h-4 w-4 mr-1" />
                      {vehicle.fuelType}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Owner Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Owner:</span>
                    <span className="font-medium flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      {vehicle.ownershipType=="self"?vehicle.selfOwnerDetails.adminId.name:vehicle.owner?.name || "N/A"}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contact:</span>
                    <span className="font-medium">{vehicle.ownershipType=="self"?vehicle.selfOwnerDetails.adminId.phone:vehicle.owner?.phone || "N/A"}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">{vehicle.ownershipType=="self"?vehicle.selfOwnerDetails.adminId.email:vehicle.owner?.email || "N/A"}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={getStatusColor(vehicle.status)}>{vehicle.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {vehicle.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{vehicle.description}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="loan" className="space-y-4">
            {vehicle.loan ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Loan Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Loan Amount:</span>
                      <span className="font-medium">₹{vehicle.loan.amount?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">EMI Amount:</span>
                      <span className="font-medium">₹{vehicle.loan.emiAmount?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tenure:</span>
                      <span className="font-medium">{vehicle.loan.tenure} months</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Provider:</span>
                      <span className="font-medium">{vehicle.loan.provider}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Start Date:</span>
                      <span className="font-medium">
                        {vehicle.loan.startDate ? new Date(vehicle.loan.startDate).toLocaleDateString() : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={vehicle.loan.status === "active" ? "default" : "secondary"}>
                        {vehicle.loan.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No loan information available for this vehicle.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

           <TabsContent value="expenses" className="space-y-4">
      {/* <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Vehicle Expenses History
          </CardTitle>
          <CardDescription>
            Total Expense: <strong>₹{totalExpense.toLocaleString()}</strong>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {categories.length > 0 && (
            <div className="flex items-center gap-4">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select onValueChange={(val) => setSelectedCategory(val)} value={selectedCategory}>
                <SelectTrigger className="w-48">
                 {selectedCategory === "__all__" || !selectedCategory ? "All Categories" : selectedCategory}

                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {filteredExpenses.length === 0 ? (
            <div className="text-center py-8">
              <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No expenses found for this category.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {filteredExpenses.map((exp, index) => (
                <li key={index} className="border p-3 rounded-md shadow-sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold capitalize">{exp.category}</p>
                      <p className="text-sm text-muted-foreground">{exp.reason || "No reason"}</p>
                      <p className="text-xs text-muted-foreground">
                        Date: {new Date(exp.paidAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right font-bold text-green-600">₹{exp.amount}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card> */}

      <VehicleFinanceSummary vehicleId={vehicle?._id}/>

    </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
