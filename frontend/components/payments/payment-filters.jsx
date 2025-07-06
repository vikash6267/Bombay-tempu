"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, Filter, X } from "lucide-react"
import { CardDescription } from "components/ui/card"

export function PaymentFilters({ filters, onFiltersChange, onClearFilters }) {
  const [localFilters, setLocalFilters] = useState(filters)

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
      dateFrom: "",
      dateTo: "",
      amountMin: "",
      amountMax: "",
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
        <CardDescription>Filter payments by status, type, and dates</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search payments..."
              value={localFilters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Payment Status</Label>
            <Select value={localFilters.status} onValueChange={(value) => handleFilterChange("status", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Payment Type</Label>
            <Select value={localFilters.type} onValueChange={(value) => handleFilterChange("type", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="trip_payment">Trip Payment</SelectItem>
                <SelectItem value="advance_payment">Advance Payment</SelectItem>
                <SelectItem value="fleet_payment">Fleet Payment</SelectItem>
                <SelectItem value="commission">Commission</SelectItem>
                <SelectItem value="refund">Refund</SelectItem>
                <SelectItem value="penalty">Penalty</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="method">Payment Method</Label>
            <Select value={localFilters.method} onValueChange={(value) => handleFilterChange("method", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="wallet">Digital Wallet</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

          <div className="space-y-2">
            <Label htmlFor="amountMin">Min Amount (₹)</Label>
            <Input
              id="amountMin"
              type="number"
              placeholder="0"
              value={localFilters.amountMin}
              onChange={(e) => handleFilterChange("amountMin", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amountMax">Max Amount (₹)</Label>
            <Input
              id="amountMax"
              type="number"
              placeholder="No limit"
              value={localFilters.amountMax}
              onChange={(e) => handleFilterChange("amountMax", e.target.value)}
            />
          </div>
        </div>

        {getActiveFiltersCount() > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <span className="text-sm font-medium">Active filters:</span>
            {localFilters.search && (
              <Badge variant="outline" className="gap-1">
                Search: {localFilters.search}
                <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange("search", "")} />
              </Badge>
            )}
            {localFilters.status && (
              <Badge variant="outline" className="gap-1">
                Status: {localFilters.status}
                <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange("status", "")} />
              </Badge>
            )}
            {localFilters.type && (
              <Badge variant="outline" className="gap-1">
                Type: {localFilters.type}
                <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange("type", "")} />
              </Badge>
            )}
            {localFilters.method && (
              <Badge variant="outline" className="gap-1">
                Method: {localFilters.method}
                <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange("method", "")} />
              </Badge>
            )}
            {(localFilters.dateFrom || localFilters.dateTo) && (
              <Badge variant="outline" className="gap-1">
                Date Range
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => {
                    handleFilterChange("dateFrom", "")
                    handleFilterChange("dateTo", "")
                  }}
                />
              </Badge>
            )}
            {(localFilters.amountMin || localFilters.amountMax) && (
              <Badge variant="outline" className="gap-1">
                Amount Range
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => {
                    handleFilterChange("amountMin", "")
                    handleFilterChange("amountMax", "")
                  }}
                />
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
