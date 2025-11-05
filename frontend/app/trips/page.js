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
import { api } from "@/lib/api";
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
  const [searchTerm, setSearchTerm] = useState("");
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
        </div>

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
                </TableRow>
              </TableHeader>

              <TableBody>
                {trips?.data?.data?.trips?.map((trip) => {
                  // 🔥 highlight condition: any client’s rate < 20
                  const hasLowRate = trip.clients?.some(
                    (c) => Number(c.rate) < 20
                  );

                  return (
                    <TableRow
                      key={trip._id}
                      onClick={() => router.push(`trips/view/${trip?._id}`)}
                      className={
                        hasLowRate
                          ? "bg-red-100 hover:bg-red-200 transition-colors cursor-pointer"
                          : "hover:bg-gray-50 cursor-pointer"
                      }
                    >
                      <TableCell className="font-medium">
                        <Link href={`trips/view/${trip?._id}`}>
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
