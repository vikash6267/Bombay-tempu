"use client"

import { Loader2, Search, Filter, Calendar, Download } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { tripsApi } from "lib/api"
import { useEffect, useState } from "react"
import { format } from "date-fns"
import jsPDF from "jspdf"
import "jspdf-autotable"

// 🔢 Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return "N/A"
  return format(new Date(dateString), "dd MMM, yyyy")
}

// 🔢 Helper function to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount || 0)
}

export default function FleetOwnerViewDialog({ open, onOpenChange, owner, loading }) {
  const [statementData, setStatementData] = useState(null)
  const [statementLoading, setStatementLoading] = useState(false)

  const [filters, setFilters] = useState({
    filterType: "all",
    startDate: "",
    endDate: "",
    search: "",
  })

  const fetchStatement = async (filterParams = filters) => {
    if (!owner?._id) return

    setStatementLoading(true)
    try {
      const queryParams = {
        fleetOwnerId: owner._id,
        filterType: filterParams.filterType,
        startDate: filterParams.startDate,
        endDate: filterParams.endDate,
        search: filterParams.search,
      }

      const res = await tripsApi.getFleetStatement(queryParams)
      setStatementData(res)
    } catch (err) {
      console.error("Error fetching fleet statement", err)
      setStatementData(null)
    } finally {
      setStatementLoading(false)
    }
  }

  useEffect(() => {
    if (open && owner?._id) {
      fetchStatement()
    }
  }, [owner, open])

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    fetchStatement(newFilters)
  }

  const resetFilters = () => {
    const resetFilters = {
      filterType: "all",
      startDate: "",
      endDate: "",
      search: "",
    }
    setFilters(resetFilters)
    fetchStatement(resetFilters)
  }

  const exportToPDF = () => {
    if (!statementData || !owner) return

    const doc = new jsPDF()

    // Simple header
    doc.setFontSize(16)
    doc.text(`Fleet Owner Statement - ${owner.name}`, 20, 20)

    doc.setFontSize(10)
    doc.text(`Phone: ${owner.phone || "N/A"}`, 20, 30)
    doc.text(`Total Advance: ${formatCurrency(owner.advanceAmount || 0)}`, 20, 35)
    doc.text(`Generated on: ${format(new Date(), "dd MMM, yyyy")}`, 20, 40)

    // Summary section
    doc.setFontSize(12)
    doc.text("Summary:", 20, 55)

    const summaryData = [
      ["Total Amount", formatCurrency(statementData.summary?.totalAmount)],
      ["Advances Paid", formatCurrency(statementData.summary?.totalAdvancesPaid)],
      ["Pending Amount", formatCurrency(statementData.summary?.totalPending)],
      ["Total POD", formatCurrency(statementData.summary?.totalPod)],
      ["POD Pending", formatCurrency(statementData.summary?.totalPodPending)],
    ]

    doc.autoTable({
      startY: 60,
      head: [["Description", "Amount"]],
      body: summaryData,
      theme: "plain",
      styles: { fontSize: 9 },
    })

    // Trips section
    if (statementData.trips?.length > 0) {
      doc.setFontSize(12)
      doc.text(`Trips (${statementData.trips.length} trips):`, 20, doc.lastAutoTable.finalY + 15)

      const tripsData = statementData.trips.map((trip) => [
        trip.tripNumber,
        formatDate(trip.scheduledDate),
        formatCurrency(trip.amount),
        formatCurrency(trip.podPending),
        formatCurrency(trip.totalPod),
        formatCurrency(trip.fleetAdvancesTotal),
      ])

      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 20,
        head: [["Trip Number", "Date", "Amount", "POD Pending", "Total POD", "Fleet Advances"]],
        body: tripsData,
        theme: "plain",
        styles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 25 },
          2: { cellWidth: 25 },
          3: { cellWidth: 25 },
          4: { cellWidth: 25 },
          5: { cellWidth: 25 },
        },
      })
    }

    // Advances section
    if (statementData.advances?.length > 0) {
      doc.setFontSize(12)
      doc.text(`Advances (${statementData.advances.length} advances):`, 20, doc.lastAutoTable.finalY + 15)

      const advancesData = statementData.advances.map((advance) => [
        formatDate(advance.advanceDate),
        advance.tripNumber,
        formatCurrency(advance.amount),
        advance.reason,
        advance.paymentType,
      ])

      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 20,
        head: [["Date", "Trip Number", "Amount", "Reason", "Payment Type"]],
        body: advancesData,
        theme: "plain",
        styles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 25 },
          2: { cellWidth: 25 },
          3: { cellWidth: 50 },
          4: { cellWidth: 25 },
        },
      })
    }

    // Save the PDF
    const fileName = `Fleet_Statement_${owner.name.replace(/\s+/g, "_")}_${format(new Date(), "dd-MM-yyyy")}.pdf`
    doc.save(fileName)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[90vw] max-h-[90vh] overflow-scroll">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Fleet Owner Statement - {owner?.name}
          </DialogTitle>
          <DialogDescription>Comprehensive statement with filtering and search capabilities</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
          </div>
        ) : (
          owner && (
            <div className="space-y-6 overflow-y-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Filters & Search
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Filter Type Dropdown */}
                    <div className="space-y-2">
                      <Label htmlFor="filterType">Filter Type</Label>
                      <Select
                        value={filters.filterType}
                        onValueChange={(value) => handleFilterChange("filterType", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select filter type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Trips</SelectItem>
                          <SelectItem value="with_pod">With POD</SelectItem>
                          <SelectItem value="without_pod">Without POD</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Search Input */}
                    <div className="space-y-2">
                      <Label htmlFor="search">Search</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="search"
                          placeholder="Trip number, driver, vehicle..."
                          value={filters.search}
                          onChange={(e) => handleFilterChange("search", e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    {/* Start Date */}
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="startDate"
                          type="date"
                          value={filters.startDate}
                          onChange={(e) => handleFilterChange("startDate", e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    {/* End Date */}
                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="endDate"
                          type="date"
                          value={filters.endDate}
                          onChange={(e) => handleFilterChange("endDate", e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" onClick={resetFilters} size="sm">
                      Reset Filters
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportToPDF}
                      disabled={!statementData || statementLoading}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Fleet Owner's Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Name</Label>
                      <p className="text-sm font-semibold">{owner.name}</p>
                    </div>
                    {/* <div>
                      <Label className="text-sm font-medium text-gray-500">Email</Label>
                      <p className="text-sm">{owner.email}</p>
                    </div> */}
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Phone</Label>
                      <p className="text-sm">{owner.phone || "N/A"}</p>
                    </div>
                    {/* <div>
                      <Label className="text-sm font-medium text-gray-500">Commission Rate</Label>
                      <Badge variant="secondary">{owner.commissionRate || "N/A"}%</Badge>
                    </div> */}
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Total Advance</Label>
                      <p className="text-sm font-semibold text-green-600">{formatCurrency(owner.advanceAmount || 0)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {statementLoading ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-600" />
                  <span className="ml-2 text-sm text-gray-600">Loading statement data...</span>
                </div>
              ) : (
                statementData && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-500">Total Amount</p>
                            <p className="text-2xl font-bold text-blue-600">
                              {formatCurrency(statementData.summary?.totalAmount)}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-500">Advances Paid</p>
                            <p className="text-2xl font-bold text-orange-600">
                              {formatCurrency(statementData.summary?.totalAdvancesPaid)}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-500">Pending Amount</p>
                            <p className="text-2xl font-bold text-red-600">
                              {formatCurrency(statementData.summary?.totalPending)}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-500">Total POD</p>
                            <p className="text-2xl font-bold text-green-600">
                              {formatCurrency(statementData.summary?.totalPod)}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-500">POD Pending</p>
                            <p className="text-2xl font-bold text-yellow-600">
                              {formatCurrency(statementData.summary?.totalPodPending)}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>Trips Statement ({statementData.trips?.length || 0} Trips)</span>
                          <Badge variant="outline">{filters.filterType}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {statementData.trips?.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Trip Number
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Scheduled Date
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Amount
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    POD Pending
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total POD
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Fleet Advances
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {statementData.trips.map((trip, index) => (
                                  <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                                      {trip.tripNumber}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {formatDate(trip.scheduledDate)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                      {formatCurrency(trip.amount)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">
                                      {formatCurrency(trip.podPending)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                                      {formatCurrency(trip.totalPod)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600">
                                      {formatCurrency(trip.fleetAdvancesTotal)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-sm text-gray-500">No trips found for the selected filters.</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Advances ({statementData.advances?.length || 0} Advances)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {statementData.advances?.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Advance Date
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Trip Number
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Amount
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Reason
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Payment Type
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {statementData.advances.map((advance, index) => (
                                  <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {formatDate(advance.advanceDate)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                                      {advance.tripNumber}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                      {formatCurrency(advance.amount)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-normal text-sm text-gray-500 max-w-xs">
                                      {advance.reason}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <Badge variant={advance.paymentType === "cash" ? "default" : "secondary"}>
                                        {advance.paymentType}
                                      </Badge>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-sm text-gray-500">No advances found for the selected filters.</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </>
                )
              )}
            </div>
          )
        )}
      </DialogContent>
    </Dialog>
  )
}
