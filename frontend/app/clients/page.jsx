"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Truck,
  IndianRupee,
  User,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  Percent,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DataTable } from "@/components/ui/data-table";
import { StatementTable } from "./clientstatment";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usersApi } from "@/lib/api";
import { useSelector } from "react-redux";
import ClientAdjustmentPanel from "./ClientAdjustmentPanel";
import { AddUserDialog } from "components/trips/add-user-dialog";

export default function ClientsPage() {
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [apiResponse, setApiResponse] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingTrips, setIsLoadingTrips] = useState(false);
  const [activeTab, setActiveTab] = useState("above70");
  const [showAddClient, setShowAddClient] = useState(false);

  // Filter states
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [amountFilter, setAmountFilter] = useState("all"); // all, highest, lowest
  const [statusFilter, setStatusFilter] = useState("all"); // all, completed, booked
  const [showFilters, setShowFilters] = useState(false);

  const { data: clientsData, isLoading } = useQuery({
    queryKey: ["users", "clients"],
    queryFn: () => usersApi.getAll({ role: "client" }),
  });

  const clients = clientsData?.data?.users || [];

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get trips based on active tab
  const getCurrentTrips = () => {
    if (!apiResponse?.summaryByPercentage) return [];

    let trips = [];

    if (activeTab === "above70") {
      trips = apiResponse.summaryByPercentage.seventyOrAbove?.trips || [];
    } else if (activeTab === "below70") {
      trips = apiResponse.summaryByPercentage.belowSeventy?.trips || [];
    } else if (activeTab === "all") {
      const above = apiResponse.summaryByPercentage.seventyOrAbove?.trips || [];
      const below = apiResponse.summaryByPercentage.belowSeventy?.trips || [];
      trips = [...above, ...below];
    }

    // Sort by tripDate (oldest → newest)
    return trips.sort((a, b) => new Date(a.tripDate) - new Date(b.tripDate));
  };

  // Filter and sort trips based on filters
  const filteredAndSortedTrips = useMemo(() => {
    let filtered = [...getCurrentTrips()];

    // Date filtering
    if (dateFrom || dateTo) {
      filtered = filtered.filter((trip) => {
        const tripDate = new Date(trip.tripDate);
        const fromDate = dateFrom ? new Date(dateFrom) : null;
        const toDate = dateTo ? new Date(dateTo) : null;

        if (fromDate && toDate) {
          return tripDate >= fromDate && tripDate <= toDate;
        } else if (fromDate) {
          return tripDate >= fromDate;
        } else if (toDate) {
          return tripDate <= toDate;
        }
        return true;
      });
    }

    // Status filtering
    if (statusFilter !== "all") {
      filtered = filtered.filter((trip) => trip.tripStatus === statusFilter);
    }

    // Amount filtering/sorting
    if (amountFilter === "highest") {
      filtered.sort((a, b) => (b.total || 0) - (a.total || 0));
    } else if (amountFilter === "lowest") {
      filtered.sort((a, b) => (a.total || 0) - (b.total || 0));
    }

    return filtered;
  }, [
    getCurrentTrips(),
    dateFrom,
    dateTo,
    amountFilter,
    statusFilter,
    activeTab,
  ]);

  // Calculate summary statistics based on active tab
  const tripSummary = useMemo(() => {
    if (!apiResponse?.summaryByPercentage) {
      return {
        totalTrips: 0,
        totalAmount: 0,
        totalPaid: 0,
        pendingAmount: 0,
      };
    }

    if (activeTab === "above70") {
      const data = apiResponse.summaryByPercentage.seventyOrAbove;
      return {
        totalTrips: data?.totalTrips || 0,
        totalAmount: data?.totalAmount || 0,
        totalPaid: data?.totalPaid || 0,
        pendingAmount: (data?.totalAmount || 0) - (data?.totalPaid || 0),
      };
    } else {
      const data = apiResponse.summaryByPercentage.belowSeventy;
      return {
        totalTrips: data?.totalTrips || 0,
        totalAmount:
          data?.trips?.reduce((sum, trip) => sum + (trip.total || 0), 0) || 0,
        totalPaid: data?.totalAdvance || 0,
        pendingAmount: data?.pendingAdvanceToReach70Percent || 0,
      };
    }
  }, [apiResponse, activeTab]);

  const handleViewDetails = async (clientId) => {
    try {
      setIsLoadingTrips(true);
      const res = await usersApi.userDetails(clientId);
      console.log("API Response:", res);
      const client = clients.find((c) => c._id === clientId);
      setSelectedClient(client);
      setApiResponse(res);
      setIsModalOpen(true);
    } catch (err) {
      console.error("Failed to fetch details", err);
    } finally {
      setIsLoadingTrips(false);
    }
  };

  const handleTripClick = (tripId) => {
    router.push(`/trips/view/${tripId}`);
    setIsModalOpen(false);
  };

  const clearFilters = () => {
    setDateFrom(null);
    setDateTo(null);
    setAmountFilter("all");
    setStatusFilter("all");
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const [selectedClientId, setSelectedClientId] = useState(null);

  const columns = [
    {
      accessorKey: "name",
      header: "Name",
    },

    {
      accessorKey: "phone",
      header: "Phone",
    },
    {
      id: "adjustment-button",
      header: "Adjustment",
      cell: ({ row }) => {
        const client = row.original;
        const isOpen = selectedClientId === client._id;
        return (
          <Button
            variant={isOpen ? "destructive" : "outline"}
            size="sm"
            onClick={() => setSelectedClientId(isOpen ? null : client._id)}
          >
            {isOpen ? "Close Adjustment" : "View Adjustment"}
          </Button>
        );
      },
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
      ),
    },
  ];

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
            <Button onClick={() => setShowAddClient(true)}>
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
                  onChange={(e) => setSearchTerm(e.target.value)}
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
          <DialogContent className="max-h-[95vh] overflow-y-auto min-w-[80%]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                </div>
                {selectedClient?.name} - Trip Statement
              </DialogTitle>
              <DialogDescription>
                Trip details categorized by payment percentage with filtering
                options
              </DialogDescription>
            </DialogHeader>

            {isLoadingTrips ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Loading statement details...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Overall Summary */}
                {/* <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IndianRupee className="h-5 w-5" />
                      Overall Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Total Balance
                        </p>
                        <p className="text-2xl font-bold text-blue-600">
                          {formatCurrency(apiResponse?.totalBalance || 0)}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Total Credit
                        </p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(
                            apiResponse?.statement?.totalCredit || 0
                          )}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Total Debit
                        </p>
                        <p className="text-2xl font-bold text-red-600">
                          {formatCurrency(
                            apiResponse?.statement?.totalDebit || 0
                          )}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card> */}

                {/* Tabs for 70% Above and Below */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger
                      value="all"
                      className="flex items-center gap-2"
                    >
                      <Truck className="h-4 w-4" />
                      All (
                      {(apiResponse?.summaryByPercentage?.seventyOrAbove
                        ?.totalTrips || 0) +
                        (apiResponse?.summaryByPercentage?.belowSeventy
                          ?.totalTrips || 0)}
                      )
                    </TabsTrigger>
                    <TabsTrigger
                      value="above70"
                      className="flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      70% & Above (
                      {apiResponse?.summaryByPercentage?.seventyOrAbove
                        ?.totalTrips || 0}
                      )
                    </TabsTrigger>
                    <TabsTrigger
                      value="below70"
                      className="flex items-center gap-2"
                    >
                      <AlertCircle className="h-4 w-4" />
                      Below 70% (
                      {apiResponse?.summaryByPercentage?.belowSeventy
                        ?.totalTrips || 0}
                      )
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="above70" className="space-y-4">
                    {/* Summary Cards for 70% Above */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">
                                Total Trips
                              </p>
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
                              <p className="text-sm text-gray-600">
                                Total Amount
                              </p>
                              <p className="text-2xl font-bold">
                                {formatCurrency(tripSummary.totalAmount)}
                              </p>
                            </div>
                            <IndianRupee className="h-8 w-8 text-purple-500" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">
                                Total Paid
                              </p>
                              <p className="text-2xl font-bold text-green-600">
                                {formatCurrency(tripSummary.totalPaid)}
                              </p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-green-500" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">Remaining</p>
                              <p className="text-2xl font-bold text-orange-600">
                                {formatCurrency(tripSummary.pendingAmount)}
                              </p>
                            </div>
                            <AlertCircle className="h-8 w-8 text-orange-500" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="below70" className="space-y-4">
                    {/* Summary Cards for Below 70% */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">
                                Total Trips
                              </p>
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
                              <p className="text-sm text-gray-600">
                                Total Advance
                              </p>
                              <p className="text-2xl font-bold text-green-600">
                                {formatCurrency(tripSummary.totalPaid)}
                              </p>
                            </div>
                            <IndianRupee className="h-8 w-8 text-green-500" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">
                                70% Total Required
                              </p>
                              <p className="text-2xl font-bold text-blue-600">
                                {formatCurrency(
                                  apiResponse?.summaryByPercentage?.belowSeventy
                                    ?.seventyPercentTotal || 0
                                )}
                              </p>
                            </div>
                            <Percent className="h-8 w-8 text-blue-500" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">
                                Pending to Reach 70%
                              </p>
                              <p className="text-2xl font-bold text-red-600">
                                {formatCurrency(tripSummary.pendingAmount)}
                              </p>
                            </div>
                            <AlertCircle className="h-8 w-8 text-red-500" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="all" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* ✅ Total Trips */}
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">
                                Total Trips
                              </p>
                              <p className="text-2xl font-bold">
                                {(apiResponse?.summaryByPercentage
                                  ?.seventyOrAbove?.totalTrips || 0) +
                                  (apiResponse?.summaryByPercentage
                                    ?.belowSeventy?.totalTrips || 0)}
                              </p>
                            </div>
                            <Truck className="h-8 w-8 text-blue-500" />
                          </div>
                        </CardContent>
                      </Card>

                      {/* ✅ Total Amount */}
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">
                                Total Amount
                              </p>
                              <p className="text-2xl font-bold">
                                {formatCurrency(
                                  (apiResponse?.summaryByPercentage
                                    ?.seventyOrAbove?.totalAmount || 0) +
                                    (apiResponse?.summaryByPercentage?.belowSeventy?.trips?.reduce(
                                      (sum, t) => sum + (t.total || 0),
                                      0
                                    ) || 0)
                                )}
                              </p>
                            </div>
                            <IndianRupee className="h-8 w-8 text-purple-500" />
                          </div>
                        </CardContent>
                      </Card>

                      {/* ✅ Total Paid */}
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">
                                Total Paid
                              </p>
                              <p className="text-2xl font-bold text-green-600">
                                {formatCurrency(
                                  (apiResponse?.summaryByPercentage
                                    ?.seventyOrAbove?.totalPaid || 0) +
                                    (apiResponse?.summaryByPercentage?.belowSeventy?.trips?.reduce(
                                      (sum, t) => sum + (t.paid || 0),
                                      0
                                    ) || 0)
                                )}
                              </p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-green-500" />
                          </div>
                        </CardContent>
                      </Card>

                      {/* ✅ Pending */}
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">Pending</p>
                              <p className="text-2xl font-bold text-orange-600">
                                {formatCurrency(
                                  (apiResponse?.summaryByPercentage
                                    ?.seventyOrAbove?.totalAmount || 0) -
                                    (apiResponse?.summaryByPercentage
                                      ?.seventyOrAbove?.totalPaid || 0) +
                                    (apiResponse?.summaryByPercentage?.belowSeventy?.trips?.reduce(
                                      (sum, t) =>
                                        sum + ((t.total || 0) - (t.paid || 0)),
                                      0
                                    ) || 0)
                                )}
                              </p>
                            </div>
                            <AlertCircle className="h-8 w-8 text-orange-500" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>

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
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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

                        {/* Status Filter */}
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Status Filter
                          </label>
                          <Select
                            value={statusFilter}
                            onValueChange={setStatusFilter}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Status</SelectItem>
                              <SelectItem value="completed">
                                Completed
                              </SelectItem>
                              <SelectItem value="booked">Booked</SelectItem>
                            </SelectContent>
                          </Select>
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
                      <CardTitle>Payment Statement</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <StatementTable
                        statement={apiResponse.statement}
                        clientInfo={selectedClient}
                        totalBalance={apiResponse.totalBalance || 0}
                        
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
                    {(dateFrom ||
                      dateTo ||
                      amountFilter !== "all" ||
                      statusFilter !== "all") && (
                      <Badge variant="secondary">Filtered</Badge>
                    )}
                  </h3>

                  {filteredAndSortedTrips.length === 0 ? (
                    <Card>
                      <CardContent className="py-8">
                        <div className="text-center">
                          <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">
                            {getCurrentTrips().length === 0
                              ? `No trips found in the ${
                                  activeTab === "above70"
                                    ? "70% & Above"
                                    : "Below 70%"
                                } category`
                              : "No trips match the selected filters"}
                          </p>
                          <p className="text-sm text-gray-400">
                            {getCurrentTrips().length === 0
                              ? "Trip details will appear here once available"
                              : "Try adjusting your filter criteria"}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-3">
                      {filteredAndSortedTrips.map((trip) => (
                        <Card
                          key={trip.tripId}
                          className={`cursor-pointer hover:shadow-md transition-all hover:bg-gray-50 dark:hover:bg-gray-800 border-l-4 ${
                            activeTab === "above70"
                              ? "border-l-green-500"
                              : "border-l-red-500"
                          }`}
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

                                {/* Payment Percentage */}
                                <div>
                                  <p className="text-xs text-gray-500">
                                    Payment %
                                  </p>
                                  <Badge
                                    variant={
                                      trip.percentagePaid >= 70
                                        ? "default"
                                        : "destructive"
                                    }
                                    className="font-bold"
                                  >
                                    {trip.percentagePaid.toFixed(1)}%
                                  </Badge>
                                </div>
                              </div>

                              {/* Amount Details */}
                              <div className="flex items-center space-x-4">
                                <div className="text-right">
                                  <p className="text-xs text-gray-500">
                                    Total Amount
                                  </p>
                                  <p className="font-bold text-lg">
                                    {formatCurrency(trip.total || 0)}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-gray-500">Paid</p>
                                  <p className="font-bold text-lg text-green-600">
                                    {formatCurrency(trip.paid || 0)}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-gray-500">
                                    {activeTab === "above70"
                                      ? "Remaining"
                                      : "Need for 70%"}
                                  </p>
                                  <p className="font-bold text-lg text-red-600">
                                    {activeTab === "above70" ? (
                                      <>
                                        {formatCurrency(
                                          trip.remainingAfterSeventy || 0
                                        )}
                                      </>
                                    ) : (
                                      <>
                                        {formatCurrency(
                                          trip.remainingToReach70Percent || 0
                                        )}
                                      </>
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Trip Number */}
                            <div className="mt-3 pt-3 border-t">
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">
                                  Trip Number:
                                </span>{" "}
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

        {/* Client Adjustment Panel Dialog */}
        {selectedClientId && (
          <Dialog
            open={!!selectedClientId}
            onOpenChange={(isOpen) => !isOpen && setSelectedClientId(null)}
          >
            <DialogContent className="max-h-[95vh] overflow-y-auto min-w-[66%]">
              <DialogHeader>
                <DialogTitle>Client Adjustment</DialogTitle>
                <DialogDescription>
                  Manage financial adjustments for this client.
                </DialogDescription>
              </DialogHeader>
              <ClientAdjustmentPanel clientId={selectedClientId} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <AddUserDialog
        open={showAddClient}
        onOpenChange={setShowAddClient}
        userType="client"
        onSuccess={() => handleUserAdded("client")}
      />
    </DashboardLayout>
  );
}
