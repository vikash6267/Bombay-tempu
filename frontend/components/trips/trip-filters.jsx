"use client"

import { useQuery } from "@tanstack/react-query"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"
import { usersApi, vehiclesApi } from "@/lib/api"
import { useAuthStore } from "@/lib/auth-store"


export function TripFilters({ filters, onFiltersChange }) {
  const { user } = useAuthStore()

  const { data: clientsData } = useQuery({
    queryKey: ["users", { role: "client" }],
    queryFn: () => usersApi.getAll({ role: "client" }),
    enabled: user?.role === "admin" || user?.role === "fleet_owner",
  })

  const { data: vehiclesData } = useQuery({
    queryKey: ["vehicles"],
    queryFn: () => vehiclesApi.getAll(),
    enabled: user?.role === "admin" || user?.role === "fleet_owner",
  })

  const { data: driversData } = useQuery({
    queryKey: ["users", { role: "driver" }],
    queryFn: () => usersApi.getAll({ role: "driver" }),
    enabled: user?.role === "admin" || user?.role === "fleet_owner",
  })

  const clients = clientsData?.data?.users || []
  const vehicles = vehiclesData?.data?.vehicles || []
  const drivers = driversData?.data?.users || []

  const updateFilter = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    })
  }

  const clearFilters = () => {
    onFiltersChange({})
  }

  const hasActiveFilters = Object.values(filters).some((value) => value !== undefined && value !== "")

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <Label className="text-sm font-medium">Status</Label>
          <Select value={filters.status || "all"} onValueChange={(value) => updateFilter("status", value || undefined)}>
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="booked">Booked</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="billed">Billed</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(user?.role === "admin" || user?.role === "fleet_owner") && (
          <div>
            <Label className="text-sm font-medium">Client</Label>
            <Select
              value={filters.client || "all"}
              onValueChange={(value) => updateFilter("client", value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All clients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All clients</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client._id} value={client._id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {(user?.role === "admin" || user?.role === "fleet_owner") && (
          <div>
            <Label className="text-sm font-medium">Vehicle</Label>
            <Select
              value={filters.vehicle || "all"}
              onValueChange={(value) => updateFilter("vehicle", value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All vehicles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All vehicles</SelectItem>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle._id} value={vehicle._id}>
                    {vehicle.registrationNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {(user?.role === "admin" || user?.role === "fleet_owner") && (
          <div>
            <Label className="text-sm font-medium">Driver</Label>
            <Select
              value={filters.driver || "all"}
              onValueChange={(value) => updateFilter("driver", value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All drivers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All drivers</SelectItem>
                {drivers.map((driver) => (
                  <SelectItem key={driver._id} value={driver._id}>
                    {driver.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium">Start Date</Label>
          <Input
            type="date"
            value={filters.startDate || ""}
            onChange={(e) => updateFilter("startDate", e.target.value || undefined)}
          />
        </div>

        <div>
          <Label className="text-sm font-medium">End Date</Label>
          <Input
            type="date"
            value={filters.endDate || ""}
            onChange={(e) => updateFilter("endDate", e.target.value || undefined)}
          />
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  )
}
