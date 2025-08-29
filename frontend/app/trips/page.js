"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CSVLink } from "react-csv";
import * as XLSX from 'xlsx';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  MapPin,
  Calendar,
} from "lucide-react";
import { api } from "@/lib/api";
import { useMemo } from "react";

import { AddTripDialog } from "@/components/trips/add-trip-dialog";
import toast from "react-hot-toast";
import { EditTripDialog } from "@/components/trips/edit-trip-dialog";
import { TripDetailsDialog } from "@/components/trips/trip-details-dialog";
import LoadingAnimation from "@/components/layout/loadingAnimation";
import { useDispatch, useSelector } from "react-redux";
import { getCitiesSuccess } from "@/lib/slices/citySlice";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EnhancedAddTripDialog } from "components/trips/add-trip-dialog";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  
  const { data: citie, refetch } = useQuery({
    queryKey: ["cities"],
    queryFn: () => api.get("/cities/all"),
    onSuccess: (data) => {
      dispatch(getCitiesSuccess(data?.data?.data?.cities));
    },
  });

  useEffect(() => {
    citie && dispatch(getCitiesSuccess(citie.data.data.cities));
  },[citie]);

  const {
    data: trips,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["trips", searchTerm],
    queryFn: () => api.get(`/trips?search=${searchTerm}`),
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to fetch trips");
    },
  });

  console.log(trips?.data?.data?.trips);
  const handleEdit = (trip) => {
    setSelectedTrip(trip);
    setShowEditDialog(true);
  };

  const handleDelete = (trip) => {
    setSelectedTrip(trip);
    setShowDeleteDialog(true);
  };

  const handleViewDetails = (trip) => {
    setSelectedTrip(trip);
    setShowDetailsDialog(true);
  };

  const confirmDelete = () => {
    if (selectedTrip) {
      deleteMutation.mutate(selectedTrip._id);
    }
  };



   const csvHeaders = [
    { label: "Trip Number", key: "TripNumber" },
    { label: "Vehicle Number", key: "VehicleNumber" },
    { label: "Client Name", key: "ClientName" },
    { label: "From", key: "From" },
    { label: "To", key: "To" },
    { label: "Rate", key: "Rate" },
    { label: "Paid", key: "Paid" },
    { label: "Pending", key: "Pending" },
    { label: "Expenses Client", key: "ExpensesClient" },
  ];

  const csvData = useMemo(() => {
    if (!trips?.data?.data?.trips) return [];

    const rows = [];
    trips.data.data.trips.forEach((trip) => {
      trip.clients.forEach((clientEntry) => {
        const client = clientEntry.client || clientEntry.CLIENT;
        rows.push({
          TripNumber: trip.tripNumber,
          VehicleNumber: trip.vehicle?.registrationNumber || "",
          ClientName: client?.name || client?.NAME || "",
          From: clientEntry.origin?.city || clientEntry.ORIGIN || "",
          To: clientEntry.destination?.city || clientEntry.DESTINATION || "",
          Rate: clientEntry.rate || 0,
          Paid: clientEntry.paidAmount || 0,
          Pending: clientEntry.dueAmount || 0,
          ExpensesClient: clientEntry.totalExpense || 0,
        });
      });
    });

    return rows;
  }, [trips]);

  // Excel Export Function with Styled Headers
  const exportToExcel = () => {
    if (!csvData || csvData.length === 0) {
      toast.error('No data to export');
      return;
    }

    // Create a new workbook
    const wb = XLSX.utils.book_new();
    
    // Create worksheet data with headers (uppercase)
    const wsData = [
      ['TRIP NUMBER', 'VEHICLE NUMBER', 'CLIENT NAME', 'FROM', 'TO', 'RATE', 'PAID', 'PENDING', 'EXPENSES CLIENT'],
      ...csvData.map(row => [
        row.TripNumber,
        row.VehicleNumber,
        row.ClientName,
        row.From,
        row.To,
        row.Rate,
        row.Paid,
        row.Pending,
        row.ExpensesClient
      ])
    ];

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Style the header row
    const headerStyle = {
      font: { bold: true, color: { rgb: "000000" }, sz: 12 }, // Black text, bold, size 12
      fill: { patternType: "solid", fgColor: { rgb: "FFFF00" } }, // Yellow background
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      }
    };

    // Apply header styling
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!ws[cellAddress]) continue;
      ws[cellAddress].s = headerStyle;
    }

    // Set column widths
    ws['!cols'] = [
      { width: 15 }, // Trip Number
      { width: 18 }, // Vehicle Number
      { width: 20 }, // Client Name
      { width: 15 }, // From
      { width: 15 }, // To
      { width: 12 }, // Rate
      { width: 12 }, // Paid
      { width: 12 }, // Pending
      { width: 15 }  // Expenses Client
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Trips Data');

    // Generate filename with current date
    const filename = `trips_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Save the file
    XLSX.writeFile(wb, filename);
    
    toast.success('Excel file exported successfully!');
  };

  const router = useRouter();
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center h-full justify-center">
          <LoadingAnimation />
        </div>
      </DashboardLayout>
    );
  }

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

        {/* Search and Filters */}

        {/* Trips Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Trips ({trips?.data?.results || 0})</CardTitle>
            <CardDescription>Complete list of your trips</CardDescription>
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
                  {/* <TableHead>Balance</TableHead> */}
                  {/* <TableHead>Actions</TableHead>
                   */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {trips?.data?.data?.trips?.map((trip) => (
                  <TableRow
                    key={trip._id}
                    onClick={() => router.push(`trips/view/${trip?._id}`)}
                  >
                    <TableCell className="font-medium">
                      <Link href={`trips/view/${trip?._id}`}>
                        {" "}
                        #{trip.tripNumber}
                      </Link>
                    </TableCell>


                      <TableCell>
                      <div className="flex items-center space-x-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {new Date(trip.scheduledDate).toLocaleDateString()}
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
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-3 w-3" />
                        <span className="text-sm">
                          {trip.clients[0].origin?.city} →{" "}
                          {trip.clients[0].destination?.city}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {trip.clients.length > 0
                        ? trip.clients
                            .map((c) => c.client?.name?.split(" ")[0])
                            .filter(Boolean)
                            .join(", ")
                        : "N/A"}
                    </TableCell>

                  
                  
                    <TableCell>
                      <TripStatusBadge status={trip.status} />
                    </TableCell>
                    {/* <TableCell className="text-destructive">
                      ₹{trip.balanceAmount?.toLocaleString()}
                    </TableCell> */}
                    <TableCell>
                      {/* <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => router.push(`trips/view/${trip?._id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(trip)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(trip)}
                            className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu> */}
                      {/* 
                      <Button
                        onClick={() => handleDelete(trip)}
                        className="" variants="">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button> */}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Dialogs */}
        <EnhancedAddTripDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onSuccess={() => queryClient.fetchQuery(["trips"])}
        />

        {selectedTrip && (
          <>
            <EditTripDialog
              open={showEditDialog}
              onOpenChange={setShowEditDialog}
              trip={selectedTrip}
            />
            <TripDetailsDialog
              open={showDetailsDialog}
              onOpenChange={setShowDetailsDialog}
              trip={selectedTrip}
            />
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Trip</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this trip? This action
                    cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={confirmDelete}
                    disabled={deleteMutation.isLoading}
                  >
                    {deleteMutation.isLoading ? "Deleting..." : "Delete Trip"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
