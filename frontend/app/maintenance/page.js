"use client";

import {useState, useEffect} from "react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {DataTable} from "@/components/ui/data-table";
import {AddMaintenanceDialog} from "@/components/maintenance/add-maintenance-dialog";
import {MaintenanceFilters} from "@/components/maintenance/maintenance-filters";
import {api} from "@/lib/api";
import {toast} from "react-hot-toast";
import {Plus, Wrench, Calendar, DollarSign, AlertTriangle} from "lucide-react";
import {DashboardLayout} from "@/components/layout/dashboard-layout";

export default function MaintenancePage() {
  const [maintenance, setMaintenance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    type: "",
    vehicleId: "",
    dateFrom: "",
    dateTo: "",
  });
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    totalCost: 0,
  });

  useEffect(() => {
    fetchMaintenance();
    fetchStats();
  }, [filters]);

  const fetchMaintenance = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await api.get(`/maintenance?${params}`);
      setMaintenance(response.data.data);
    } catch (error) {
      toast.error("Failed to fetch maintenance records");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get("/maintenance/stats");
      setStats(response.data.data);
    } catch (error) {
      console.error("Failed to fetch stats");
    }
  };

  const handleMaintenanceAdded = () => {
    fetchMaintenance();
    fetchStats();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const columns = [
    {
      accessorKey: "maintenanceId",
      header: "ID",
    },
    {
      accessorKey: "vehicle.registrationNumber",
      header: "Vehicle",
      cell: ({row}) => (
        <div>
          <div className="font-medium">
            {row.original.vehicle?.registrationNumber}
          </div>
          <div className="text-sm text-gray-500">
            {row.original.vehicle?.make} {row.original.vehicle?.model}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({row}) => (
        <Badge variant="outline">
          {row.getValue("type")?.replace("_", " ").toUpperCase()}
        </Badge>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({row}) => (
        <div className="max-w-xs truncate" title={row.getValue("description")}>
          {row.getValue("description")}
        </div>
      ),
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({row}) => (
        <Badge className={getPriorityColor(row.getValue("priority"))}>
          {row.getValue("priority")?.toUpperCase()}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({row}) => (
        <Badge className={getStatusColor(row.getValue("status"))}>
          {row.getValue("status")?.replace("_", " ").toUpperCase()}
        </Badge>
      ),
    },
    {
      accessorKey: "scheduledDate",
      header: "Scheduled Date",
      cell: ({row}) => (
        <div className="text-sm">
          {new Date(row.getValue("scheduledDate")).toLocaleDateString()}
        </div>
      ),
    },
    {
      accessorKey: "cost",
      header: "Cost",
      cell: ({row}) => (
        <div className="font-medium">
          ₹{row.getValue("cost")?.toLocaleString() || 0}
        </div>
      ),
    },
    {
      accessorKey: "serviceProvider",
      header: "Service Provider",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Maintenance Management</h1>
            <p className="text-gray-600">
              Manage vehicle maintenance and service records
            </p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Maintenance
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Records
              </CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.pending}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.completed}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{stats.totalCost?.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <MaintenanceFilters
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={() =>
            setFilters({
              search: "",
              status: "",
              type: "",
              vehicleId: "",
              dateFrom: "",
              dateTo: "",
            })
          }
        />

        {/* Maintenance Table */}
        <Card>
          <CardHeader>
            <CardTitle>Maintenance Records</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={maintenance}
              loading={loading}
              searchKey="description"
              searchPlaceholder="Search maintenance records..."
            />
          </CardContent>
        </Card>

        <AddMaintenanceDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onMaintenanceAdded={handleMaintenanceAdded}
        />
      </div>
    </DashboardLayout>
  );
}
