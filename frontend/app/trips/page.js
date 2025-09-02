"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Calendar, Search, Plus } from "lucide-react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import LoadingAnimation from "@/components/layout/loadingAnimation";
import Link from "next/link";
import { EnhancedAddTripDialog } from "components/trips/add-trip-dialog";
import { useRouter } from "next/navigation";

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
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["trips", searchTerm, page, limit],
    queryFn: () =>
      api.get(`/trips?search=${searchTerm}&page=${page}&limit=${limit}`),
    keepPreviousData: true,
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to fetch trips");
    },
  });

  const trips = data?.data?.data?.trips || [];
  const totalPages = data?.data?.totalPages || 1;

  const selfTrips = trips.filter(
    (trip) => trip.vehicle?.ownershipType === "self"
  );
  const fleetTrips = trips.filter(
    (trip) => trip.vehicle?.ownershipType === "fleet_owner"
  );

  const renderTripsTable = (tripList) => (
    <>
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
          {tripList.length > 0 ? (
            tripList.map((trip) => (
              <TableRow
                key={trip._id}
                onClick={() => router.push(`trips/view/${trip._id}`)}
                className="cursor-pointer hover:bg-muted/50"
              >
                <TableCell className="font-medium">
                  <Link href={`trips/view/${trip._id}`}>#{trip.tripNumber}</Link>
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
                      {trip.clients[0]?.origin?.city} →{" "}
                      {trip.clients[0]?.destination?.city}
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
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center text-muted-foreground"
              >
                No trips found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-4">
        <Button
          variant="outline"
          disabled={page === 1}
          onClick={() => setPage((p) => Math.max(p - 1, 1))}
        >
          Previous
        </Button>
        <span>
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          disabled={page === totalPages}
          onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
        >
          Next
        </Button>
      </div>
    </>
  );

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

        {/* Search */}
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search by Trip Number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
          {/* <Button
            onClick={() => {
              setPage(1);
              queryClient.invalidateQueries(["trips", searchTerm, page, limit]);
            }}
          >
            <Search className="mr-2 h-4 w-4" /> Search
          </Button> */}
        </div>

        {/* Tabs */}
        {isLoading ? (
          <div className="flex items-center h-full justify-center">
            <LoadingAnimation />
          </div>
        ) : (
          <Tabs defaultValue="self" className="w-full">
            <TabsList>
              <TabsTrigger value="self">
                Self Trips ({selfTrips.length})
              </TabsTrigger>
              <TabsTrigger value="fleet">
                Fleet Owner Trips ({fleetTrips.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="self">
              <Card>
                <CardHeader>
                  <CardTitle>Self Trips</CardTitle>
                  <CardDescription>
                    Trips where vehicle ownership is self
                  </CardDescription>
                </CardHeader>
                <CardContent>{renderTripsTable(selfTrips)}</CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="fleet">
              <Card>
                <CardHeader>
                  <CardTitle>Fleet Owner Trips</CardTitle>
                  <CardDescription>
                    Trips where vehicle ownership is fleet owner
                  </CardDescription>
                </CardHeader>
                <CardContent>{renderTripsTable(fleetTrips)}</CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Add Trip Dialog */}
        <EnhancedAddTripDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onSuccess={() => queryClient.invalidateQueries(["trips"])}
        />
      </div>
    </DashboardLayout>
  );
}
