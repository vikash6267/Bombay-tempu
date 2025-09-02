"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ScrollText,
  Search,
  Filter,
  Calendar,
  User,
  Activity,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { logsApi } from "@/lib/api";

const ITEMS_PER_PAGE = 10;

const actionColors = {
  create: "bg-green-100 text-green-800",
  update: "bg-blue-100 text-blue-800",
  delete: "bg-red-100 text-red-800",
  add: "bg-purple-100 text-purple-800",
  remove: "bg-orange-100 text-orange-800",
  payment: "bg-yellow-100 text-yellow-800",
  advance: "bg-indigo-100 text-indigo-800",
  expense: "bg-pink-100 text-pink-800",
};

const severityColors = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

export default function LogsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAction, setSelectedAction] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSeverity, setSelectedSeverity] = useState("all");
  const [selectedUser, setSelectedUser] = useState("");
  const [dateRange, setDateRange] = useState({
    from: undefined,
    to: undefined,
  });

  // Fetch logs with filters
  const {
    data: logsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "logs",
      currentPage,
      searchTerm,
      selectedAction,
      selectedCategory,
      selectedSeverity,
      selectedUser,
      dateRange,
    ],
    queryFn: () =>
      logsApi.getLogs({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: searchTerm,
        action: selectedAction === "all" ? "" : selectedAction,
        category: selectedCategory === "all" ? "" : selectedCategory,
        severity: selectedSeverity === "all" ? "" : selectedSeverity,
        userId: selectedUser,
        startDate: dateRange.from,
        endDate: dateRange.to,
      }),
    keepPreviousData: true,
  });
console.log(logsData)
  const logs = logsData?.data?.logs || []; 
  const totalPages = Math.ceil((logsData?.data?.results || 0) / ITEMS_PER_PAGE);

  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (filterType, value) => {
    setCurrentPage(1);
    switch (filterType) {
      case "action":
        setSelectedAction(value);
        break;
      case "category":
        setSelectedCategory(value);
        break;
      case "severity":
        setSelectedSeverity(value);
        break;
      case "user":
        setSelectedUser(value);
        break;
      default:
        break;
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedAction("all");
    setSelectedCategory("all");
    setSelectedSeverity("all");
    setSelectedUser("");
    setDateRange({ from: undefined, to: undefined });
    setCurrentPage(1);
  };

function formatDate(dateString) {
  if (!dateString) return "N/A"; // Handle null/undefined/empty
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Invalid Date"; // Handle bad strings

  // Return in dd/mm/yyyy format
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}




  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ScrollText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Activity Logs</h1>
              <p className="text-gray-600">
                Monitor all system activities and user actions
              </p>
            </div>
          </div>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filters</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Action Filter */}
              <Select
                value={selectedAction}
                onValueChange={(value) => handleFilterChange("action", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="add">Add</SelectItem>
                  <SelectItem value="remove">Remove</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="advance">Advance</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>

              {/* Category Filter */}
              {/* <Select
                value={selectedCategory}
                onValueChange={(value) => handleFilterChange("category", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="trip">Trip</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="vehicle">Vehicle</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="advance">Advance</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="authentication">Authentication</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="pod">POD</SelectItem>
                  <SelectItem value="financial">Financial</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select> */}
<div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <DatePickerWithRange
                  date={dateRange}
                  onDateChange={setDateRange}
                  placeholder="Select date range"
                />
              </div>
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
              {/* Severity Filter */}
              {/* <Select
                value={selectedSeverity}
                onValueChange={(value) => handleFilterChange("severity", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select> */}
            </div>

            {/* Date Range and Clear Filters */}
            
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Activity Logs</CardTitle>
              <div className="text-sm text-gray-500">
                {logsData?.total || 0} total logs
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-600">
                Error loading logs. Please try again.
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No logs found matching your criteria.
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Trip No.</TableHead>
                      <TableHead>Narration</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>User</TableHead>
                      {/* <TableHead>Category</TableHead> */}
                    
                     
                    </TableRow>
                  </TableHeader>
                 <TableBody>
  {logs.map((log) => (
    <TableRow key={log._id}>
      <TableCell className="font-mono text-sm">
       {formatDate(log.createdAt)}
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
        
          <span>{log.relatedTrip?.tripNumber  || ""}</span>
        </div>
      </TableCell>

       <TableCell className="max-w-md">
        <div className="truncate" title={log.description}>
          {log.description}
        </div>
      </TableCell>
       <TableCell>
        <Badge
          className={cn(
            "capitalize",
            actionColors[log.action] || "bg-gray-100 text-gray-800"
          )}
        >
          {log.action}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4 text-gray-400" />
          <span>{log.user?.name || "System"}</span>
        </div>
      </TableCell>
     
      {/* <TableCell>
        <span className="capitalize text-sm font-medium">
          {log.category}
        </span>
      </TableCell> */}
    
     
     
    </TableRow>
  ))}
</TableBody>

                </Table>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-500">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                    {Math.min(currentPage * ITEMS_PER_PAGE, logsData?.total || 0)} of{" "}
                    {logsData?.total || 0} logs
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(
                          (page) =>
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                        )
                        .map((page, index, array) => (
                          <div key={page} className="flex items-center">
                            {index > 0 && array[index - 1] !== page - 1 && (
                              <span className="px-2 text-gray-400">...</span>
                            )}
                            <Button
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className="w-8 h-8 p-0"
                            >
                              {page}
                            </Button>
                          </div>
                        ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}