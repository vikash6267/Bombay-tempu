"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { Plus, Search, Filter } from "lucide-react"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { usersApi } from "@/lib/api"
// import { useAuthStore } from "@/lib/auth-store"
import { useSelector } from "react-redux"

export default function FleetOwnersPage() {
  const router = useRouter()
   const {user} = useSelector((state) => state.auth);
  const [searchTerm, setSearchTerm] = useState("")

  const { data: fleetOwnersData, isLoading } = useQuery({
    queryKey: ["users", "fleet_owners"],
    queryFn: () => usersApi.getAll({ role: "fleet_owner" }),
  })

  const fleetOwners = fleetOwnersData?.data?.users || []
  const filteredFleetOwners = fleetOwners.filter(
    (owner) =>
      owner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      owner.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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
      accessorKey: "commissionRate",
      header: "Commission Rate",
      cell: ({ row }) => <span>{row.getValue("commissionRate") || "N/A"}%</span>,
    },
    {
      accessorKey: "active",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            row.getValue("active") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {row.getValue("active") ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button variant="outline" size="sm" onClick={() => router.push(`/fleet-owners/${row.original._id}`)}>
          View Details
        </Button>
      ),
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Fleet Owners</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your fleet owner partners</p>
          </div>
          {user?.role === "admin" && (
            <Button onClick={() => router.push("/fleet-owners/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Fleet Owner
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Fleet Owners</CardTitle>
            <CardDescription>A list of all registered fleet owners</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search fleet owners..."
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

            <DataTable columns={columns} data={filteredFleetOwners} loading={isLoading} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
