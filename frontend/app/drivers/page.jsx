"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Filter } from "lucide-react";

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
import { DataTable } from "@/components/ui/data-table";
import { usersApi } from "@/lib/api";
// import { useAuthStore } from "@/lib/auth-store"
import { formatDate } from "@/lib/utils";
import { useSelector } from "react-redux";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useMutation, useQuery } from "@tanstack/react-query";

export default function DriversPage() {
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: driversData, isLoading } = useQuery({
    queryKey: ["users", "drivers"],
    queryFn: () => usersApi.getAll({ role: "driver" }),
  });

  const drivers = driversData?.data?.users || [];
  const filteredDrivers = drivers.filter(
    (driver) =>
      driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "phone",
      header: "Phone",
    },
    {
      accessorKey: "licenseNumber",
      header: "License Number",
    },
    {
      accessorKey: "licenseExpiry",
      header: "License Expiry",
      cell: ({ row }) => {
        const expiry = row.getValue("licenseExpiry");
        if (!expiry) return "N/A";
        const isExpired = new Date(expiry) < new Date();
        return (
          <span className={isExpired ? "text-red-600" : ""}>
            {formatDate(expiry, "MMM dd, yyyy")}
          </span>
        );
      },
    },
    {
      accessorKey: "active",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            row.getValue("active")
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {row.getValue("active") ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/drivers/${row.original._id}`)}
        >
          View Details
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
              Drivers
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your driver database
            </p>
          </div>
          {user?.role === "admin" && (
            <Button onClick={() => router.push("/drivers/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Driver
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Drivers</CardTitle>
            <CardDescription>A list of all registered drivers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search drivers..."
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
              data={filteredDrivers}
              loading={isLoading}
            />
          </CardContent>
        </Card>
      </div>

    
    </DashboardLayout>
  );
}
