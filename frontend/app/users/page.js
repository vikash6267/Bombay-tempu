"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { AddUserDialog } from "@/components/users/add-user-dialog"
// import { EditUserDialog } from "@/components/users/edit-user-dialog"
// import { UserFilters } from "@/components/users/user-filters"
import { api } from "@/lib/api"
import { toast } from "react-hot-toast"
import { Plus, Users, UserCheck, UserX, Shield } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [filters, setFilters] = useState({
    search: "",
    role: "",
    status: "",
    dateFrom: "",
    dateTo: "",
  })
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    admins: 0,
    clients: 0,
    drivers: 0,
    fleetOwners: 0,
  })

  useEffect(() => {
    fetchUsers()
    fetchStats()
  }, [filters])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      const response = await api.get(`/users?${params}`)
      setUsers(response.data.data.users)
    } catch (error) {
      toast.error("Failed to fetch users")
    } finally {
      setLoading(false)
    }
  }
  const fetchStats = async () => {
    try {
      const response = await api.get("/users/stats")
      // console.log(response)
      setStats(response.data.data.stats)
    } catch (error) {
      // console.log(error)
      console.error("Failed to fetch stats")
    }
  }
  // console.log(users)

  const handleUserAdded = () => {
    fetchUsers()
    fetchStats()
  }

  const handleUserUpdated = () => {
    fetchUsers()
    fetchStats()
    setShowEditDialog(false)
    setSelectedUser(null)
  }

  const handleEditUser = (user) => {
    setSelectedUser(user)
    setShowEditDialog(true)
  }

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active"
      await api.patch(`/users/${userId}/status`, { status: newStatus })
      toast.success(`User ${newStatus === "active" ? "activated" : "deactivated"} successfully`)
      fetchUsers()
      fetchStats()
    } catch (error) {
      toast.error("Failed to update user status")
    }
  }

  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800"
      case "client":
        return "bg-blue-100 text-blue-800"
      case "driver":
        return "bg-green-100 text-green-800"
      case "fleet_owner":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const columns = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue("name")}</div>
          <div className="text-sm text-gray-500">{row.original.email}</div>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <Badge className={getRoleColor(row.getValue("role"))}>
          {row.getValue("role")?.replace("_", " ").toUpperCase()}
        </Badge>
      ),
    },
    {
      accessorKey: "phone",
      header: "Phone",
    },
    // {
    //   accessorKey: "status",
    //   header: "Status",
    //   cell: ({ row }) => (
    //     <Badge className={getStatusColor(row.getValue("status"))}>{row.getValue("status")?.toUpperCase()}</Badge>
    //   ),
    // },
    {
      accessorKey: "createdAt",
      header: "Joined",
      cell: ({ row }) => <div className="text-sm">{new Date(row.getValue("createdAt")).toLocaleDateString()}</div>,
    },
    // {
    //   accessorKey: "lastLogin",
    //   header: "Last Login",
    //   cell: ({ row }) => (
    //     <div className="text-sm">
    //       {row.getValue("lastLogin") ? new Date(row.getValue("lastLogin")).toLocaleDateString() : "Never"}
    //     </div>
    //   ),
    // },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleEditUser(row.original)}>
            Edit
          </Button>
          <Button
            variant={row.original.status === "active" ? "destructive" : "default"}
            size="sm"
            onClick={() => handleToggleStatus(row.original._id, row.original.status)}
          >
            {row.original.status === "active" ? "Deactivate" : "Activate"}
          </Button>
        </div>
      ),
    },
  ]

  return (    <DashboardLayout>
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-600">Manage system users and their permissions</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Stats Cards */}
      {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.admins}</div>
          </CardContent>
        </Card>
      </div> */}

      {/* Role Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.clients}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Drivers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.drivers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Fleet Owners</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.fleetOwners}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      {/* <UserFilters
        filters={filters}
        onFiltersChange={setFilters}
        onClearFilters={() =>
          setFilters({
            search: "",
            role: "",
            status: "",
            dateFrom: "",
            dateTo: "",
          })
        }
      /> */}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={users}
            loading={loading}
            searchKey="name"
            searchPlaceholder="Search users..."
          />
        </CardContent>
      </Card>

      <AddUserDialog open={showAddDialog} onOpenChange={setShowAddDialog} onUserAdded={handleUserAdded} />

      {/* <EditUserDialog
        user={selectedUser}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onUserUpdated={handleUserUpdated}
      /> */}
    </div></DashboardLayout>
  )
}
