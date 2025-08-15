"use client";

import {useState} from "react";
import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import {DashboardLayout} from "@/components/layout/dashboard-layout";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Truck,
} from "lucide-react";
import {api} from "@/lib/api";
import toast from "react-hot-toast";
import {AddEditVehicleDialog} from "@/components/vehicles/add-vehicle-dialog";
import {EditVehicleDialog} from "@/components/vehicles/edit-vehicle-dialog";
import {DeleteVehicleDialog} from "@/components/vehicles/delete-vehicle-dialog";
import {VehicleDetailsDialog} from "@/components/vehicles/vehicle-details-dialog";
import LoadingAnimation from "@/components/layout/loadingAnimation";

function VehicleStatusBadge({status}) {
  const variants = {
    available: "default",
    booked: "secondary",
    maintenance: "destructive",
    inactive: "outline",
  };

  return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
}

export default function VehiclesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const queryClient = useQueryClient();

  const {
    data: vehicles,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["vehicles", searchTerm],
    queryFn: () => api.get(`/vehicles?search=${searchTerm}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/vehicles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["vehicles"]);
      toast.success("Vehicle deleted successfully");
      setShowDeleteDialog(false);
      setSelectedVehicle(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete vehicle");
    },
  });

  const handleEdit = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowEditDialog(true);
  };

  const handleDelete = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowDeleteDialog(true);
  };

  const handleViewDetails = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowDetailsDialog(true);
  };

  const confirmDelete = () => {
    if (selectedVehicle) {
      deleteMutation.mutate(selectedVehicle._id);
    }
  };
  // console.log(vehicles)
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
            <h1 className="text-3xl font-bold tracking-tight">Vehicles</h1>
            <p className="text-muted-foreground">Manage your fleet vehicles</p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Vehicle
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
            <CardDescription>
              Find vehicles by registration number, type, or status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search vehicles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vehicles Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Vehicles ({vehicles?.data?.results || 0})</CardTitle>
            <CardDescription>
              Complete list of your fleet vehicles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Registration No.</TableHead>
                  <TableHead>Type</TableHead>

                  <TableHead>Capacity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles?.data?.data?.vehicles?.map((vehicle) => (
                  <TableRow key={vehicle._id}>
                    <TableCell className="font-medium">
                      {vehicle.registrationNumber}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Truck className="h-4 w-4" />
                        <span>{vehicle.vehicleType}</span>
                      </div>
                    </TableCell>

                    <TableCell>{vehicle.capacity} tons</TableCell>
                    <TableCell>
                      <VehicleStatusBadge status={vehicle.status} />
                    </TableCell>
                    <TableCell>
                      {vehicle.ownershipType == "self"
                        ? "Self"
                        : vehicle.owner?.name || "N/A"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => handleViewDetails(vehicle)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(vehicle)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(vehicle)}
                            className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Dialogs */}
        <AddEditVehicleDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
        />

        {selectedVehicle && (
          <>
            <AddEditVehicleDialog
              open={showEditDialog}
              onOpenChange={setShowEditDialog}
              vehicle={selectedVehicle}
              mode="edit"
              
            />


            <DeleteVehicleDialog
              open={showDeleteDialog}
              onOpenChange={setShowDeleteDialog}
              vehicle={selectedVehicle}
              onConfirm={confirmDelete}
              isLoading={deleteMutation.isLoading}
            />
            <VehicleDetailsDialog
              open={showDetailsDialog}
              onOpenChange={setShowDetailsDialog}
              vehicle={selectedVehicle}
            />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
