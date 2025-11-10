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
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
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

  const { data: logsData, isLoading, error, refetch } = useQuery({
    queryKey: ["logs", currentPage, searchTerm, dateRange],
    queryFn: () =>
      logsApi.getLogs({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: searchTerm,
        startDate: dateRange.from,
        endDate: dateRange.to,
      }),
    keepPreviousData: true,
  });

  const logs = logsData?.data?.logs || [];
  const totalPages = Math.ceil((logsData?.data?.results || 0) / ITEMS_PER_PAGE);

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
                Advance, Expenses & Closing Balances
              </p>
            </div>
          </div>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

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
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}