"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, Filter, X } from "lucide-react"
import { api } from "@/lib/api"

export function MaintenanceFilters({ filters, onFiltersChange, onClearFilters }) {
  const [localFilters, setLocalFilters] = useState(filters)
  const [vehicles, setVehicles] = useState([])

  useEffect(() => {
    fetchVehicles()
  }, [])

  const fetchVehicles = async () => {
    try {
      const response = await api.get("/vehicles")
      setVehicles(response.data.data)
    } catch (error) {
      console.error("Failed to fetch vehicles")
    }
  }

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleClearFilters = () => {
    const clearedFilters = {
      search: "",
      status: "",
      type: "",
      vehicleId: "",
      dateFrom: "",
      dateTo: "",
    }
    setLocalFilters(clearedFilters)
    onClearFilters()
  }

  const getActiveFiltersCount = () => {
    return Object.values(localFilters).filter((value) => value && value !== "").length
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
            {getActiveFiltersCount() > 0 && <Badge variant="secondary">{getActiveFiltersCount()}</Badge>}
          </div>
          {getActiveFiltersCount() > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search maintenance..."
              value={localFilters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={localFilters.status} onValueChange={(value) => handleFilterChange("status", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Maintenance Type</Label>
            <Select value={localFilters.type} onValueChange={(value) => handleFilterChange("type", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="routine">Routine Service</SelectItem>
                <SelectItem value="repair">Repair</SelectItem>
                <SelectItem value="inspection">Inspection</SelectItem>
                <SelectItem value="oil_change">Oil Change</SelectItem>
                <SelectItem value="tire_service">Tire Service</SelectItem>
                <SelectItem value="brake_service">Brake Service</SelectItem>
                <SelectItem value="engine_service">Engine Service</SelectItem>
                <SelectItem value="transmission">Transmission</SelectItem>
                <SelectItem value="electrical">Electrical</SelectItem>
                <SelectItem value="bodywork">Bodywork</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicleId">Vehicle</Label>
            <Select value={localFilters.vehicleId} onValueChange={(value) => handleFilterChange("vehicleId", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All vehicles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vehicles</SelectItem>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle._id} value={vehicle._id}>
                    {vehicle.registrationNumber} - {vehicle.make} {vehicle.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dateFrom">From Date</Label>
            <div className="relative">
              <Input
                id="dateFrom"
                type="date"
                value={localFilters.dateFrom}
                onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
              />
              <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateTo">To Date</Label>
            <div className="relative">
              <Input
                id="dateTo"
                type="date"
                value={localFilters.dateTo}
                onChange={(e) => handleFilterChange("dateTo", e.target.value)}
              />
              <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
