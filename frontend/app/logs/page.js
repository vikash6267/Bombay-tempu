"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { logsApi } from "@/lib/api";

const ITEMS_PER_PAGE = 10;

const actionColors = {
  advance: "bg-indigo-100 text-indigo-800",
  expense: "bg-pink-100 text-pink-800",
  payment: "bg-yellow-100 text-yellow-800",
  create: "bg-green-100 text-green-800",
  update: "bg-blue-100 text-blue-800",
  delete: "bg-red-100 text-red-800",
  add: "bg-purple-100 text-purple-800",
  remove: "bg-orange-100 text-orange-800",
};

function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
}

export default function LogsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({ from: undefined, to: undefined });
  const [actionFilter, setActionFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");

  const { data: logsData, isLoading, error, refetch } = useQuery({
    queryKey: ["logs", currentPage, searchTerm, dateRange, actionFilter, sortOrder],
    queryFn: () =>
      logsApi.getLogs({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: searchTerm,
        startDate: dateRange.from,
        endDate: dateRange.to,
        action: actionFilter,
        sort: sortOrder === "desc" ? "-createdAt" : "createdAt",
      }),
    keepPreviousData: true,
  });

  const logs = logsData?.data?.logs || [];
  const total = logsData?.data?.total || 0;
  const results = logsData?.data?.results || 0;
  const totalPages = logsData?.data?.totalPages || Math.ceil(total / ITEMS_PER_PAGE) || 0;
  
  console.log('📊 Pagination Debug:', { 
    total, 
    results,
    totalPages, 
    currentPage, 
    logsLength: logs.length,
    shouldShowPagination: !isLoading && totalPages > 1,
    rawData: logsData?.data 
  });

  // calculate closing balances
  let runningBalance = 0;
  const processedLogs = logs.map((log) => {
    let deposit = 0;
    let withdraw = 0;

    if (log.action === "advance") deposit = log.details?.amount || 0;
    if (log.action === "expense") withdraw = log.details?.amount || 0;

    runningBalance = runningBalance + deposit - withdraw;

    return {
      ...log,
      deposit,
      withdraw,
      closingBalance: runningBalance,
    };
  });

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
              <h1 className="text-3xl font-bold text-gray-900">
                Trip Ledger Summary
              </h1>
              <p className="text-gray-600">
                Advance, Expenses & Closing Balances ({total} records)
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
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Trip number, description..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Action Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Action Type</label>
                <select
                  value={actionFilter}
                  onChange={(e) => {
                    setActionFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Actions</option>
                  <option value="advance">Advance</option>
                  <option value="expense">Expense</option>
                  <option value="payment">Payment</option>
                  <option value="create">Create</option>
                  <option value="update">Update</option>
                  <option value="delete">Delete</option>
                </select>
              </div>

              {/* Sort Order */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Sort By Date</label>
                <select
                  value={sortOrder}
                  onChange={(e) => {
                    setSortOrder(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
            </div>

            {/* Date Range Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {/* Start Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <Input
                  type="date"
                  value={dateRange.from ? new Date(dateRange.from).toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    setDateRange(prev => ({
                      ...prev,
                      from: e.target.value ? new Date(e.target.value) : undefined
                    }));
                    setCurrentPage(1);
                  }}
                  className="w-full"
                />
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <Input
                  type="date"
                  value={dateRange.to ? new Date(dateRange.to).toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    setDateRange(prev => ({
                      ...prev,
                      to: e.target.value ? new Date(e.target.value) : undefined
                    }));
                    setCurrentPage(1);
                  }}
                  className="w-full"
                />
              </div>
            </div>

            {/* Clear Filters */}
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setDateRange({ from: undefined, to: undefined });
                  setActionFilter("");
                  setSortOrder("desc");
                  setCurrentPage(1);
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Ledger Records</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-6">Loading...</div>
            ) : error ? (
              <div className="text-center text-red-600">
                Error loading data.
              </div>
            ) : processedLogs.length === 0 ? (
              <div className="text-center text-gray-500 py-6">
                No records found.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Trip No.</TableHead>
                    <TableHead>Narration</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead className="text-right">Withdrawal Amt</TableHead>
                    <TableHead className="text-right">Credit Amt</TableHead>
                    <TableHead>User Name</TableHead>
                    {/* <TableHead className="text-right">Closing Balance</TableHead> */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedLogs.map((log) => (
                    <TableRow key={log._id}>
                      <TableCell>{formatDate(log.createdAt)}</TableCell>
                      <TableCell>{log.relatedTrip?.tripNumber || "-"}</TableCell>
                      <TableCell className="truncate max-w-xs">
                        {log.details?.reason || log.description || "-"}
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
                      <TableCell className="text-right">
                        {log.withdraw > 0 ? `₹${log.withdraw.toLocaleString()}` : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {log.deposit > 0 ? `₹${log.deposit.toLocaleString()}` : "-"}
                      </TableCell>
                      <TableCell>{log.user?.name || "System"}</TableCell>
                      {/* <TableCell className="text-right font-semibold">
                        ₹{log.closingBalance.toLocaleString()}
                      </TableCell> */}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Pagination - Always show if data exists */}
            {!isLoading && logs.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-4 border-t gap-4">
                <div className="text-sm text-gray-600">
                  {totalPages > 1 ? (
                    <>Page {currentPage} of {totalPages} | Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                    {Math.min(currentPage * ITEMS_PER_PAGE, total)} of {total} records</>
                  ) : (
                    <>Showing {logs.length} of {total} records</>
                  )}
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    >
                      First
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className="min-w-[40px]"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      Last
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}