"use client"
import { ArrowUpDown, MoreHorizontal, Eye, Edit, MapPin, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import { getStatusColor, formatCurrency, formatDate } from "@/lib/utils"
import { useRouter } from "next/navigation"

export const tripColumns = [
  {
    accessorKey: "tripNumber",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Trip Number
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const trip = row.original
      return (
        <div>
          <div className="font-medium">{trip.tripNumber}</div>
          <div className="text-sm text-muted-foreground">{formatDate(trip.scheduledDate, "MMM dd, yyyy")}</div>
        </div>
      )
    },
  },
  {
    accessorKey: "route",
    header: "Route",
    cell: ({ row }) => {
      const trip = row.original
      return (
        <div className="flex items-center space-x-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">
              {trip.origin.city} → {trip.destination.city}
            </div>
            <div className="text-sm text-muted-foreground">
              {trip.origin.state} → {trip.destination.state}
            </div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "client",
    header: "Client",
    cell: ({ row }) => {
      const client = row.original.client
      return (
        <div className="flex items-center space-x-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={client.profileImage || "/placeholder.svg"} />
            <AvatarFallback>
              {client.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{client.name}</div>
            <div className="text-sm text-muted-foreground">{client.email}</div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "vehicle",
    header: "Vehicle",
    cell: ({ row }) => {
      const vehicle = row.original.vehicle
      return (
        <div>
          <div className="font-medium">{vehicle.registrationNumber}</div>
          <div className="text-sm text-muted-foreground">
            {vehicle.make} {vehicle.model}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "driver",
    header: "Driver",
    cell: ({ row }) => {
      const driver = row.original.driver
      return (
        <div className="flex items-center space-x-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={driver.profileImage || "/placeholder.svg"} />
            <AvatarFallback>
              {driver.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{driver.name}</div>
            <div className="text-sm text-muted-foreground">{driver.phone}</div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "loadDetails",
    header: "Load",
    cell: ({ row }) => {
      const loadDetails = row.original.loadDetails
      return (
        <div>
          <div className="font-medium">{loadDetails.description}</div>
          <div className="text-sm text-muted-foreground">
            {loadDetails.weight} tons • {loadDetails.loadType}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status")
      return <Badge className={getStatusColor(status)}>{status.replace("_", " ")}</Badge>
    },
  },
  {
    accessorKey: "pricing",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          <DollarSign className="h-4 w-4 mr-1" />
          Pricing
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const pricing = row.original.pricing
      const totalAdvance = row.original.totalAdvance || 0
      const balanceAmount = pricing.clientRate - totalAdvance

      return (
        <div>
          <div className="font-medium">{formatCurrency(pricing.clientRate)}</div>
          <div className="text-sm text-muted-foreground">Advance: {formatCurrency(totalAdvance)}</div>
          <div className="text-sm text-muted-foreground">Balance: {formatCurrency(balanceAmount)}</div>
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const trip = row.original
      const router = useRouter()

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => router.push(`/trips/${trip._id}`)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/trips/${trip._id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Trip
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push(`/trips/${trip._id}/track`)}>
              <MapPin className="mr-2 h-4 w-4" />
              Track Trip
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
