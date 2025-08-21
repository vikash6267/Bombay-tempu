"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { DollarSign, Fuel, Truck, User, FileText, AlertTriangle, Calendar, CheckCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { vehiclesApi } from "lib/api"
import VehicleFinanceSummary from "./FinaceVechile"

export function VehicleDetailsDialog({ open, onOpenChange, vehicle }) {
  const [expenses, setExpenses] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState("")
  const [totalExpense, setTotalExpense] = useState(0)


  console.log(vehicle,"vehicle")
  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        if (!vehicle) return
        const res = await vehiclesApi.getExpenses(vehicle._id)
        console.log("Vehicle Expenses:", res)

        const allExpenses = res.expenseByDate
          ? Object.values(res.expenseByDate).flatMap((dateEntry) => dateEntry.expenses)
          : []

        setExpenses(allExpenses)

        // ✅ Unique categories
        const uniqueCategories = Array.from(new Set(allExpenses.map((exp) => exp.category))).filter(Boolean)
        setCategories(uniqueCategories)

        setTotalExpense(res.totalExpense || 0)
      } catch (err) {
        console.error("Error fetching vehicle expenses:", err)
      }
    }

    fetchExpenses()
  }, [vehicle?._id, vehicle, open])

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

const calculateLoanDetails = () => {
  if (!vehicle.loanDetails || !vehicle.loanDetails.hasLoan) return null;

  const startDate = new Date(vehicle.loanDetails.loanStartDate);
  const currentDate = new Date();

  // Month difference calculation with day check
  let elapsedMonths = (currentDate.getFullYear() - startDate.getFullYear()) * 12;
  elapsedMonths += currentDate.getMonth() - startDate.getMonth();

  // Agar current day >= start day, ek aur month count kar do
  if (currentDate.getDate() >= startDate.getDate()) {
    elapsedMonths += 1;
  }

  const totalLoan = vehicle.loanDetails.loanAmount;
  const emiAmount = vehicle.loanDetails.emiAmount;
  const totalTenure = vehicle.loanDetails.loanTenure;

  // Limit elapsedMonths to totalTenure
  elapsedMonths = Math.min(elapsedMonths, totalTenure);

  const totalPaid = Math.min(elapsedMonths * emiAmount, totalLoan);
  const remainingAmount = Math.max(0, totalLoan - totalPaid);
  const remainingMonths = Math.max(0, totalTenure - elapsedMonths);
  const completionPercentage = Math.min(100, (totalPaid / totalLoan) * 100);

  return {
    elapsedMonths,
    totalPaid,
    remainingAmount,
    remainingMonths,
    completionPercentage,
  };
};


  const vehiclePapers = {
    engineNo: vehicle.papers?.engineNo || "",
    chassisNo: vehicle.papers?.chassisNo || "",
    modelName: vehicle.papers?.modelName || '',
    registrationDate: vehicle.papers?.registrationDate || "",
    fitnessDate: vehicle.papers?.fitnessDate || "",
    taxDate: vehicle.papers?.taxDate || "",
    insuranceDate: vehicle.papers?.insuranceDate || "",
    puccDate: vehicle.papers?.puccDate || "",
    permitDate: vehicle.papers?.permitDate || "",
    nationalPermitDate: vehicle.papers?.nationalPermitDate || "",
  }
console.log(vehicle,"vehicleMODEL")
  const getDocumentAlerts = () => {
    const alerts = []
    const currentDate = new Date()
    const thirtyDaysFromNow = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000)

    const documents = [
      { name: "Fitness Certificate", date: vehiclePapers.fitnessDate, type: "fitness" },
      { name: "Tax", date: vehiclePapers.taxDate, type: "tax" },
      { name: "Insurance", date: vehiclePapers.insuranceDate, type: "insurance" },
      { name: "PUCC", date: vehiclePapers.puccDate, type: "pucc" },
      { name: "Permit", date: vehiclePapers.permitDate, type: "permit" },
      { name: "National Permit", date: vehiclePapers.nationalPermitDate, type: "nationalPermit" },
    ]

    documents.forEach((doc) => {
      const docDate = new Date(doc.date)
      const daysUntilExpiry = Math.ceil((docDate - currentDate) / (1000 * 60 * 60 * 24))

      if (daysUntilExpiry < 0) {
        alerts.push({
          type: "expired",
          title: `${doc.name} Expired`,
          description: `Expired ${Math.abs(daysUntilExpiry)} days ago`,
          severity: "high",
        })
      } else if (daysUntilExpiry <= 30) {
        alerts.push({
          type: "expiring",
          title: `${doc.name} Expiring Soon`,
          description: `Expires in ${daysUntilExpiry} days`,
          severity: daysUntilExpiry <= 7 ? "high" : "medium",
        })
      }
    })

    return alerts
  }

  console.log("Vehicle Details:", vehicle)

  const loanDetails = calculateLoanDetails()
  const documentAlerts = getDocumentAlerts()

  console.log(vehicle, "vehicle")

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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="details">Vehicle Details</TabsTrigger>
            <TabsTrigger value="loan">Loan Information</TabsTrigger>
            <TabsTrigger value="papers">Papers</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
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
                    <span className="text-muted-foreground">Curent Km:</span>
                    <span className="font-medium">{vehicle?.currentKilometers}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Next Service Km:</span>
                    <span className="font-medium">{vehicle?.nextServiceAtKm}</span>
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
                      {vehicle.ownershipType == "self"
                        ? vehicle.selfOwnerDetails.adminId.name
                        : vehicle.owner?.name || "N/A"}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contact:</span>
                    <span className="font-medium">
                      {vehicle.ownershipType == "self"
                        ? vehicle.selfOwnerDetails.adminId.phone
                        : vehicle.owner?.phone || "N/A"}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">
                      {vehicle.ownershipType == "self"
                        ? vehicle.selfOwnerDetails.adminId.email
                        : vehicle.owner?.email || "N/A"}
                    </span>
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
            {vehicle.loanDetails?.hasLoan ? (
              <div className="space-y-4">
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
                        <span className="font-medium">₹{vehicle.loanDetails.loanAmount?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">EMI Amount:</span>
                        <span className="font-medium">₹{vehicle.loanDetails.emiAmount?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tenure:</span>
                        <span className="font-medium">{vehicle.loanDetails.loanTenure} months</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Provider:</span>
                        <span className="font-medium">{vehicle.loanDetails.loanProvider}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Start Date:</span>
                        <span className="font-medium">
                          {vehicle.loanDetails.loanStartDate
                            ? new Date(vehicle.loanDetails.loanStartDate).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant={vehicle.loanDetails.loanStatus === "active" ? "default" : "secondary"}>
                          {vehicle.loanDetails.loanStatus}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {loanDetails && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <Calendar className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                          <p className="text-sm text-muted-foreground">Elapsed Months</p>
                          <p className="text-2xl font-bold">{loanDetails.elapsedMonths}</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                          <p className="text-sm text-muted-foreground">Total Paid</p>
                          <p className="text-2xl font-bold">₹{loanDetails.totalPaid.toLocaleString()}</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <DollarSign className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                          <p className="text-sm text-muted-foreground">Remaining Amount</p>
                          <p className="text-2xl font-bold">₹{loanDetails.remainingAmount.toLocaleString()}</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <Calendar className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                          <p className="text-sm text-muted-foreground">Remaining Months</p>
                          <p className="text-2xl font-bold">{loanDetails.remainingMonths}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {loanDetails && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Loan Progress</CardTitle>
                      <CardDescription>{loanDetails.completionPercentage.toFixed(1)}% completed</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Progress value={loanDetails.completionPercentage} className="h-3" />
                      <div className="flex justify-between text-sm text-muted-foreground mt-2">
                        <span>₹0</span>
                        <span>₹{vehicle.loanDetails.loanAmount.toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No loan information available for this vehicle.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="papers" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Vehicle Identification
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Engine Number:</span>
                    <span className="font-medium">{vehiclePapers.engineNo}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Chassis Number:</span>
                    <span className="font-medium">{vehiclePapers.chassisNo}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Model Name:</span>
                    <span className="font-medium">{vehiclePapers.modelName}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Registration Date:</span>
                    <span className="font-medium">{new Date(vehiclePapers.registrationDate).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Document Expiry Dates
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fitness Certificate:</span>
                    <span className="font-medium">{new Date(vehiclePapers.fitnessDate).toLocaleDateString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax:</span>
                    <span className="font-medium">{new Date(vehiclePapers.taxDate).toLocaleDateString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Insurance:</span>
                    <span className="font-medium">{new Date(vehiclePapers.insuranceDate).toLocaleDateString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">PUCC:</span>
                    <span className="font-medium">{new Date(vehiclePapers.puccDate).toLocaleDateString()}</span>
                  </div>

                     <div className="grid grid-cols-1  gap-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Permit Date:</span>
                      <span className="font-medium">{new Date(vehiclePapers.permitDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">National Permit:</span>
                      <span className="font-medium">
                        {new Date(vehiclePapers.nationalPermitDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Permits
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
               
                </CardContent>
              </Card> */}
            </div>
          </TabsContent>

          <TabsContent value="expenses" className="space-y-4">
            <VehicleFinanceSummary vehicleId={vehicle?._id} />
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Document Alerts
                </CardTitle>
                <CardDescription>
                  {documentAlerts.length === 0
                    ? "All documents are up to date"
                    : `${documentAlerts.length} alert(s) require attention`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {documentAlerts.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                    <p className="text-muted-foreground">All vehicle documents are current and valid.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {documentAlerts.map((alert, index) => (
                      <Alert key={index} variant={alert.severity === "high" ? "destructive" : "default"}>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>{alert.title}</AlertTitle>
                        <AlertDescription>{alert.description}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
