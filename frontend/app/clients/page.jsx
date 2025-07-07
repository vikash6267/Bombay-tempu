"use client"

import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Truck,
  MapPin,
  IndianRupee,
  User,
  CalendarDays,
  TrendingUp,
  TrendingDown
} from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { DataTable } from "@/components/ui/data-table"
import { StatementTable } from "./clientstatment"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { usersApi } from "@/lib/api"
import { useSelector } from "react-redux"

export default function ClientsPage() {
  const router = useRouter()
  const { user } = useSelector(state => state.auth)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClient, setSelectedClient] = useState(null)
  const [clientTrips, setClientTrips] = useState([])
  const [apiResponse, setApiResponse] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoadingTrips, setIsLoadingTrips] = useState(false)

  // Filter states
  const [dateFrom, setDateFrom] = useState(null)
  const [dateTo, setDateTo] = useState(null)
  const [amountFilter, setAmountFilter] = useState("all") // all, highest, lowest
  const [showFilters, setShowFilters] = useState(false)

  const { data: clientsData, isLoading } = useQuery({
    queryKey: ["users", "clients"],
    queryFn: () => usersApi.getAll({ role: "client" })
  })

  const clients = clientsData?.data?.users || []

  const filteredClients = clients.filter(
    client =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Filter and sort trips based on date and amount filters
  const filteredAndSortedTrips = useMemo(() => {
    let filtered = [...clientTrips]

    // Date filtering
    if (dateFrom || dateTo) {
      filtered = filtered.filter(trip => {
        const tripDate = new Date(trip.tripDate)
        const fromDate = dateFrom ? new Date(dateFrom) : null
        const toDate = dateTo ? new Date(dateTo) : null

        if (fromDate && toDate) {
          return tripDate >= fromDate && tripDate <= toDate
        } else if (fromDate) {
          return tripDate >= fromDate
        } else if (toDate) {
          return tripDate <= toDate
        }
        return true
      })
    }

    // Amount filtering/sorting
    if (amountFilter === "highest") {
      filtered.sort(
        (a, b) =>
          (b.clientTripDetails?.balance || 0) -
          (a.clientTripDetails?.balance || 0)
      )
    } else if (amountFilter === "lowest") {
      filtered.sort(
        (a, b) =>
          (a.clientTripDetails?.balance || 0) -
          (b.clientTripDetails?.balance || 0)
      )
    }

    return filtered
  }, [clientTrips, dateFrom, dateTo, amountFilter])

  // Calculate summary statistics
  const tripSummary = useMemo(() => {
    const totalTrips = filteredAndSortedTrips.length
    const totalPending = filteredAndSortedTrips.reduce(
      (sum, trip) => sum + (trip.clientTripDetails?.balance || 0),
      0
    )
    const totalAdvance = filteredAndSortedTrips.reduce(
      (sum, trip) => sum + (trip.clientTripDetails?.advance || 0),
      0
    )

    return {
      totalTrips,
      totalPending,
      totalAdvance
    }
  }, [filteredAndSortedTrips])

  const handleViewDetails = async clientId => {
    try {
      setIsLoadingTrips(true)
      const res = await usersApi.userDetails(clientId)
      console.log("API Response:", res)

      const client = clients.find(c => c._id === clientId)
      setSelectedClient(client)
      setApiResponse(res)
      setClientTrips(res.tripBalances || [])
      setIsModalOpen(true)
    } catch (err) {
      console.error("Failed to fetch details", err)
    } finally {
      setIsLoadingTrips(false)
    }
  }

  const handleTripClick = tripId => {
    router.push(`/trips/view/${tripId}`)
    setIsModalOpen(false)
  }

  const clearFilters = () => {
    setDateFrom(null)
    setDateTo(null)
    setAmountFilter("all")
  }

  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    })
  }

  const formatCurrency = amount => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0
    }).format(amount)
  }

  const columns = [
    {
      accessorKey: "name",
      header: "Name"
    },
    {
      accessorKey: "email",
      header: "Email"
    },
    {
      accessorKey: "phone",
      header: "Phone"
    },
    {
      accessorKey: "active",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            row.getValue("active")
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {row.getValue("active") ? "Active" : "Inactive"}
        </span>
      )
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleViewDetails(row.original._id)}
          disabled={isLoadingTrips}
        >
          View Statement
        </Button>
      )
    }
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Clients
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your client database and statements
            </p>
          </div>
          {user?.role === "admin" && (
            <Button onClick={() => router.push("/clients/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Clients</CardTitle>
            <CardDescription>
              A list of all registered clients with statement access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
            <DataTable
              columns={columns}
              data={filteredClients}
              loading={isLoading}
            />
          </CardContent>
        </Card>

        {/* Client Statement Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className=" max-h-[95vh] overflow-y-auto min-w-[66%]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                </div>
                {selectedClient?.name} - Trip Statement
              </DialogTitle>
              <DialogDescription>
                Trip details with filtering and summary information
              </DialogDescription>
            </DialogHeader>

            {isLoadingTrips ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Loading statement details...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Total Trips</p>
                          <p className="text-2xl font-bold">
                            {tripSummary.totalTrips}
                          </p>
                        </div>
                        <Truck className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Total Pending</p>
                          <p className="text-2xl font-bold text-red-600">
                            {formatCurrency(tripSummary.totalPending)}
                          </p>
                        </div>
                        <IndianRupee className="h-8 w-8 text-red-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Total Advance</p>
                          <p className="text-2xl font-bold text-green-600">
                            {formatCurrency(tripSummary.totalAdvance)}
                          </p>
                        </div>
                        <IndianRupee className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Filters */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Filters</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        {showFilters ? "Hide" : "Show"} Filters
                      </Button>
                    </div>
                  </CardHeader>
                  {showFilters && (
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Date From */}
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            From Date
                          </label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start bg-transparent"
                              >
                                <CalendarDays className="h-4 w-4 mr-2" />
                                {dateFrom
                                  ? formatDate(dateFrom)
                                  : "Select date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <CalendarComponent
                                mode="single"
                                selected={dateFrom}
                                onSelect={setDateFrom}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        {/* Date To */}
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            To Date
                          </label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start bg-transparent"
                              >
                                <CalendarDays className="h-4 w-4 mr-2" />
                                {dateTo ? formatDate(dateTo) : "Select date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <CalendarComponent
                                mode="single"
                                selected={dateTo}
                                onSelect={setDateTo}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        {/* Amount Filter */}
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Amount Filter
                          </label>
                          <Select
                            value={amountFilter}
                            onValueChange={setAmountFilter}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Amounts</SelectItem>
                              <SelectItem value="highest">
                                <div className="flex items-center">
                                  <TrendingUp className="h-4 w-4 mr-2" />
                                  Highest First
                                </div>
                              </SelectItem>
                              <SelectItem value="lowest">
                                <div className="flex items-center">
                                  <TrendingDown className="h-4 w-4 mr-2" />
                                  Lowest First
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Clear Filters */}
                        <div className="flex items-end">
                          <Button
                            variant="outline"
                            onClick={clearFilters}
                            className="w-full bg-transparent"
                          >
                            Clear Filters
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>

                {/* Statement Card */}
                {apiResponse?.statement && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Client Statement</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <StatementTable
                        statement={apiResponse.statement}
                        clientInfo={selectedClient}
                        totalTrips={apiResponse.totalTrips || 0}
                        totalBalance={apiResponse.totalBalance || 0}
                        tripBalances={apiResponse.tripBalances || []}
                      />
                    </CardContent>
                  </Card>
                )}

                <Separator />

                {/* Trips List Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Trip Details ({filteredAndSortedTrips.length} trips)
                    {(dateFrom || dateTo || amountFilter !== "all") && (
                      <Badge variant="secondary">Filtered</Badge>
                    )}
                  </h3>

                  {filteredAndSortedTrips.length === 0 ? (
                    <Card>
                      <CardContent className="py-8">
                        <div className="text-center">
                          <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">
                            {clientTrips.length === 0
                              ? "No trips found for this client"
                              : "No trips match the selected filters"}
                          </p>
                          <p className="text-sm text-gray-400">
                            {clientTrips.length === 0
                              ? "Trip details will appear here once created"
                              : "Try adjusting your filter criteria"}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-3">
                      {filteredAndSortedTrips.map(trip => (
                        <Card
                          key={trip.tripId}
                          className="cursor-pointer hover:shadow-md transition-all hover:bg-gray-50 dark:hover:bg-gray-800 border-l-4 border-l-blue-500"
                          onClick={() => handleTripClick(trip.tripId)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-6">
                                {/* Trip Date */}
                                <div className="flex items-center space-x-2">
                                  <Calendar className="h-4 w-4 text-blue-500" />
                                  <div>
                                    <p className="text-xs text-gray-500">
                                      Trip Date
                                    </p>
                                    <p className="font-medium">
                                      {formatDate(trip.tripDate)}
                                    </p>
                                  </div>
                                </div>

                                {/* Vehicle */}
                                <div className="flex items-center space-x-2">
                                  <Truck className="h-4 w-4 text-green-500" />
                                  <div>
                                    <p className="text-xs text-gray-500">
                                      Vehicle
                                    </p>
                                    <p className="font-medium">
                                      {trip.vehicleNumber}
                                    </p>
                                  </div>
                                </div>

                                {/* Destination */}
                                <div className="flex items-center space-x-2">
                                  <MapPin className="h-4 w-4 text-red-500" />
                                  <div>
                                    <p className="text-xs text-gray-500">
                                      Destination
                                    </p>
                                    <p className="font-medium">
                                      {
                                        trip.clientTripDetails?.destination
                                          ?.city
                                      }
                                      ,{" "}
                                      {
                                        trip.clientTripDetails?.destination
                                          ?.state
                                      }
                                    </p>
                                  </div>
                                </div>

                                {/* Status */}
                                <div>
                                  <p className="text-xs text-gray-500">
                                    Status
                                  </p>
                                  <Badge
                                    variant="outline"
                                    className="capitalize"
                                  >
                                    {trip.tripStatus}
                                  </Badge>
                                </div>
                              </div>

                              {/* Balance */}
                              <div className="flex items-center space-x-2">
                                <IndianRupee className="h-4 w-4 text-orange-500" />
                                <div className="text-right">
                                  <p className="text-xs text-gray-500">
                                    Trip Balance
                                  </p>
                                  <p className="font-bold text-lg text-red-600">
                                    {formatCurrency(
                                      trip.clientTripDetails?.balance || 0
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Trip Number */}
                            <div className="mt-3 pt-3 border-t">
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Trip ID:</span>{" "}
                                {trip.tripNumber}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
