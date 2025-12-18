"use client";

import { useEffect, useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  MapPin,
  Calendar,
} from "lucide-react";
import { api, tripsApi } from "@/lib/api";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Filter, Search, RefreshCw } from "lucide-react";

import { Switch } from "@/components/ui/switch";
import { useDispatch } from "react-redux";
import { getCitiesSuccess } from "@/lib/slices/citySlice";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LoadingAnimation from "@/components/layout/loadingAnimation";
import { EnhancedAddTripDialog } from "components/trips/add-trip-dialog";
import * as XLSX from "xlsx";

function TripStatusBadge({ status }) {
  const variants = {
    booked: "outline",
    in_progress: "secondary",
    completed: "default",
    cancelled: "destructive",
  };
  const labels = {
    booked: "Booked",
    in_progress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  return (
    <Badge variant={variants[status] || "outline"}>
      {labels[status] || status}
    </Badge>
  );
}

export default function TripsPage() {
  // Fixed filter: payment number dropdown (or All)
  const [filterType, setFilterType] = useState("all"); // all | payment_no
  const [clientPaymentNo, setClientPaymentNo] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [lowRateOnly, setLowRateOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const router = useRouter();

  const { data: citie } = useQuery({
    queryKey: ["cities"],
    queryFn: () => api.get("/cities/all"),
    onSuccess: (data) => {
      dispatch(getCitiesSuccess(data?.data?.data?.cities));
    },
  });

  // Dropdown payment numbers
  const { data: paymentNoList } = useQuery({
    queryKey: ["tripPaymentNumbers"],
    queryFn: () => tripsApi.getPaymentNumbers(),
  });

  const {
    data: trips,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "trips",
      { filterType, clientPaymentNo, searchTerm, lowRateOnly, page, limit },
    ],
    queryFn: () =>
      tripsApi.getAll({
        clientPaymentNo: filterType === "payment_no" && clientPaymentNo ? clientPaymentNo : undefined,
        search: searchTerm?.trim() || undefined,
        clientRateLt: lowRateOnly ? 20 : undefined,
        page,
        limit,
      }),
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to fetch trips");
    },
    keepPreviousData: true,
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center h-full justify-center">
          <LoadingAnimation />
        </div>
      </DashboardLayout>
    );
  }

const fetchAllTripsForExport = async () => {
  const response = await api.get(`/trips?limit=2000`);
  return response.data?.data?.trips || [];
};


  

  // Excel Export Function with Styled Headers
 const exportToExcel = async () => {
  try {
    toast.loading("Preparing Excel export...");

    // ✅ Refetch all trips (max 2000)
    const freshTrips = await fetchAllTripsForExport();

    if (!freshTrips || freshTrips.length === 0) {
      toast.dismiss();
      toast.error("No trips available for export");
      return;
    }

    // Transform data
    const csvData = [];
    freshTrips.forEach((trip) => {
      trip.clients.forEach((clientEntry) => {
        const client = clientEntry.client || clientEntry.CLIENT;

        const formattedDate = clientEntry.loadDate
          ? new Date(clientEntry.loadDate).toLocaleDateString("en-IN")
          : "";

        // Calculate totals
        const clientAdvancePaid = clientEntry.paidAmount || 0;
        const clientBalance = clientEntry.dueAmount || 0;
        const clientFright = clientEntry.rate || 0;
        
        // Truck calculations
        const truckPaidAdvance = trip.totalFleetAdvance || 0;
        const truckBalance = (trip.vehicleOwnerAmount || 0) - truckPaidAdvance;
        
        // POD status
        const podStatus = clientEntry.podManage?.status || trip.podManage?.status || "pending";
        const podSubmitDate = clientEntry.podManage?.date || trip.podManage?.date || "";
        const podRemark = podStatus === "pod_submitted" || podStatus === "settled" ? "Submitted" : "Pending";

        csvData.push({
          Date: formattedDate,
          VehicleNo: trip.vehicle?.registrationNumber || "",
          From: clientEntry.origin?.city || "",
          To: clientEntry.destination?.city || "",
          ClientFright: clientFright,
          ApnaFright: trip.commission || 0,
          TruckHireCost: trip.vehicleOwnerAmount || 0,
          Adjustments: clientEntry.argestment || 0,
          ClientAdvancePaid: clientAdvancePaid,
          ClientBalance: clientBalance,
          TruckPaidAdvance: truckPaidAdvance,
          TruckBalance: truckBalance,
          TruckBalancePaidDate: trip.podDetails?.date ? new Date(trip.podDetails.date).toLocaleDateString("en-IN") : "",
          BalanceRemark: trip.podDetails?.notes || "",
          PodSubmit: podRemark,
          PodSubmitDate: podSubmitDate ? new Date(podSubmitDate).toLocaleDateString("en-IN") : "",
          PodRemark: podRemark,
        });
      });
    });

    // ✅ Create Excel
    const wb = XLSX.utils.book_new();
    const wsData = [
      [
        "Date",
        "Gaadi No",
        "From",
        "To",
        "Client Fright",
        "Apna Fright",
        "Truck Hire Cost",
        "Adjustments",
        "Client Advance Paid",
        "Client Balance",
        "Truck Paid Advance",
        "Truck Balance",
        "Truck Balance Paid Date",
        "Balance Remark",
        "POD Submit",
        "POD Submit Date",
        "POD Remark",
      ],
      ...csvData.map((r) => [
        r.Date,
        r.VehicleNo,
        r.From,
        r.To,
        r.ClientFright,
        r.ApnaFright,
        r.TruckHireCost,
        r.Adjustments,
        r.ClientAdvancePaid,
        r.ClientBalance,
        r.TruckPaidAdvance,
        r.TruckBalance,
        r.TruckBalancePaidDate,
        r.BalanceRemark,
        r.PodSubmit,
        r.PodSubmitDate,
        r.PodRemark,
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Style header
    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
      fill: { patternType: "solid", fgColor: { rgb: "4472C4" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
    };

    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c });
      if (ws[cellAddress]) ws[cellAddress].s = headerStyle;
    }

    ws["!cols"] = [
      { width: 12 },  // Date
      { width: 15 },  // Gaadi No
      { width: 12 },  // From
      { width: 12 },  // To
      { width: 14 },  // Client Fright
      { width: 12 },  // Apna Fright
      { width: 15 },  // Truck Hire Cost
      { width: 12 },  // Adjustments
      { width: 16 },  // Client Advance Paid
      { width: 14 },  // Client Balance
      { width: 16 },  // Truck Paid Advance
      { width: 14 },  // Truck Balance
      { width: 18 },  // Truck Balance Paid Date
      { width: 15 },  // Balance Remark
      { width: 12 },  // POD Submit
      { width: 15 },  // POD Submit Date
      { width: 12 },  // POD Remark
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Trips Data");

    const filename = `trips_export_${new Date()
      .toISOString()
      .split("T")[0]}.xlsx`;

    XLSX.writeFile(wb, filename);

    toast.dismiss();
    toast.success(`Excel exported successfully (${freshTrips.length} trips)!`);
  } catch (error) {
    toast.dismiss();
    toast.error("Failed to export Excel");
    console.error("Export error:", error);
  }
};
console.log(trips)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Trips</h1>
            <p className="text-muted-foreground">
              Manage your transportation trips
            </p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Trip
          </Button>
           <div className="flex gap-2">
             {/* CSV Export Button */}
            {/* <CSVLink
              data={csvData}
              filename={`trips_export_${new Date().toISOString()}.csv`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Export CSV
            </CSVLink> */}
            
            {/* Excel Export Button */}
            <Button
              onClick={exportToExcel}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Export Excel
            </Button>
          </div>
        </div>

        {/* Filters */}
       <Card className="border border-gray-200 shadow-sm rounded-2xl">
  <CardHeader className="pb-3">
    <div className="flex items-center justify-between">
      <div>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Filter className="h-4 w-4 text-blue-600" />
          Filters
        </CardTitle>
        <CardDescription className="text-sm text-gray-500">
          Refine and search trips easily
        </CardDescription>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-1"
        onClick={() => {
          setSearchDraft("");
          setSearchTerm("");
          setLowRateOnly(false);
          setPage(1);
        }}
      >
        <RefreshCw className="h-4 w-4" />
        Reset
      </Button>
    </div>
  </CardHeader>

  <CardContent>
    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 items-end">
      
      {/* 🔍 Search Field */}
      <div className="col-span-2">
        <label className="text-sm font-medium text-gray-700">Search</label>
        <div className="relative mt-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            className="pl-9"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setSearchTerm(searchDraft.trim());
                setPage(1);
              }
            }}
            placeholder="Trip no, Vehicle no, Client name"
          />
        </div>
      </div>

      {/* 🔘 Low Rate Filter */}
      <div className="flex flex-col justify-center space-y-2 mt-1">
        <label className="text-sm font-medium text-gray-700">Rate Filter</label>
        <div className="flex items-center space-x-3 p-2 border rounded-lg bg-gray-50">
          <Switch
            checked={lowRateOnly}
            onCheckedChange={(val) => {
              setLowRateOnly(val);
              setPage(1);
            }}
          />
          <span className="text-sm text-gray-800">Show Only Client No Fix Ammount</span>
        </div>
      </div>

      {/* 🔘 Search Button */}
      <div className="flex flex-col justify-end mt-1">
        <Button
          onClick={() => {
            setSearchTerm(searchDraft.trim());
            setPage(1);
          }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Search className="h-4 w-4 mr-1" />
          Apply Filters
        </Button>
      </div>
    </div>
  </CardContent>
</Card>


        {/* Trips Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              All Trips ({trips?.results || 0})
            </CardTitle>
            <CardDescription>
              Total: {trips?.total ?? 0} • Page {trips?.currentPage ?? 1} of {trips?.totalPages ?? 1}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trip Number</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {trips?.data?.trips?.map((trip) => {
                  // 🔥 highlight condition: any client’s rate < 20
                  const hasLowRate = trip.clients?.some(
                    (c) => Number(c.rate) < 20
                  );

                  return (
                    <TableRow
                      key={trip._id}
                      onClick={() => router.push(`/trips/view/${trip?._id}`)}
                      className={
                        hasLowRate
                          ? "bg-red-100 hover:bg-red-200 transition-colors cursor-pointer"
                          : "hover:bg-gray-50 cursor-pointer"
                      }
                    >
                      <TableCell className="font-medium">
                        <Link href={`/trips/view/${trip?._id}`}>
                          #{trip.tripNumber}
                        </Link>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center space-x-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {new Date(
                              trip.scheduledDate
                            ).toLocaleDateString("en-IN")}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">
                            {trip.vehicle?.registrationNumber}
                          </div>
                          <div className="text-muted-foreground">
                            {trip.driver?.name}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center space-x-2 text-sm">
                          <MapPin className="h-3 w-3" />
                          <span>
                            {trip.clients?.[0]?.origin?.city || "—"} →{" "}
                            {trip.clients?.[0]?.destination?.city || "—"}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        {trip.clients?.map((c) => (
                          <div
                            key={c._id}
                            className={`text-sm ${
                              Number(c.rate) < 20
                                ? "text-red-600 font-semibold" // highlight low-rate clients
                                : ""
                            }`}
                          >
                            {c.client?.name} ({c.rate})
                          </div>
                        ))}
                      </TableCell>

                      <TableCell>
                        <TripStatusBadge status={trip.status} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Pagination Controls - clickable numbers */}
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {(trips?.results || 0)} of {trips?.total || 0}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={(trips?.currentPage || 1) <= 1}
                >
                  Prev
                </Button>
                {Array.from({ length: trips?.totalPages || 1 }, (_, i) => i + 1)
                  .slice(
                    Math.max(0, (page - 1) - 2),
                    Math.max(0, (page - 1) - 2) + 5
                  )
                  .map((p) => (
                    <Button
                      key={p}
                      variant={p === (trips?.currentPage || page) ? "default" : "outline"}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </Button>
                  ))}
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={(trips?.currentPage || 1) >= (trips?.totalPages || 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <EnhancedAddTripDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onSuccess={() => queryClient.fetchQuery(["trips"])}
        />
      </div>
    </DashboardLayout>
  );
}
