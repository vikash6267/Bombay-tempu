"use client"


import { ArrowUpDown, MoreHorizontal, Eye, Check, X, Download } from "lucide-react"
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
import { useState } from "react"
// import { ApprovePaymentDialog } from "./approve-payment-dialog"
// import { CancelPaymentDialog } from "./cancel-payment-dialog"

export const paymentColumns = [
  {
    accessorKey: "paymentNumber",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Payment Number
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const payment = row.original
      return (
        <div>
          <div className="font-medium">{payment.paymentNumber}</div>
          <div className="text-sm text-muted-foreground">{formatDate(payment.paymentDate, "MMM dd, yyyy")}</div>
        </div>
      )
    },
  },
  {
    accessorKey: "trip",
    header: "Trip",
    cell: ({ row }) => {
      const trip = row.original.trip
      return (
        <div>
          <div className="font-medium">{trip?.tripNumber}</div>
          <div className="text-sm text-muted-foreground">
            {/* {trip?.clients[0].origin?.city} → {trip?.clients[0].destination?.city} */}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "paymentType",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("paymentType")
      const typeLabels = {
        client_payment: "Client Payment",
        fleet_owner_payment: "Fleet Owner Payment",
        advance_payment: "Advance Payment",
        expense_reimbursement: "Expense Reimbursement",
      }
      return <Badge variant="outline">{typeLabels[type] || type}</Badge>
    },
  },
  {
    accessorKey: "paidBy",
    header: "Paid By",
    cell: ({ row }) => {
      const paidBy = row.original.paidBy
      return (
        <div className="flex items-center space-x-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={paidBy.profileImage || "/placeholder.svg"} />
            <AvatarFallback>
              {paidBy.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{paidBy.name}</div>
            <div className="text-sm text-muted-foreground">{paidBy.email}</div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "paidTo",
    header: "Paid To",
    cell: ({ row }) => {
      const paidTo = row.original.paidTo
      return (
        <div className="flex items-center space-x-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={paidTo.profileImage || "/placeholder.svg"} />
            <AvatarFallback>
              {paidTo.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{paidTo.name}</div>
            <div className="text-sm text-muted-foreground">{paidTo.email}</div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "amount",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Amount
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const payment = row.original
      return (
        <div>
          <div className="font-medium">{formatCurrency(payment.amount)}</div>
          <div className="text-sm text-muted-foreground capitalize">{payment.paymentMethod.replace("_", " ")}</div>
          {payment.commissionAmount > 0 && (
            <div className="text-sm text-muted-foreground">Commission: {formatCurrency(payment.commissionAmount)}</div>
          )}
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
    id: "actions",
    cell: ({ row }) => {
      const payment = row.original
      const router = useRouter()
      const [showApproveDialog, setShowApproveDialog] = useState(false)
      const [showCancelDialog, setShowCancelDialog] = useState(false)

      return (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => router.push(`/payments/${payment._id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="mr-2 h-4 w-4" />
                Download Receipt
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {payment.status === "pending" && (
                <>
                  <DropdownMenuItem onClick={() => setShowApproveDialog(true)} className="text-green-600">
                    <Check className="mr-2 h-4 w-4" />
                    Approve Payment
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowCancelDialog(true)} className="text-destructive">
                    <X className="mr-2 h-4 w-4" />
                    Cancel Payment
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* <ApprovePaymentDialog payment={payment} open={showApproveDialog} onOpenChange={setShowApproveDialog} /> */}

          {/* <CancelPaymentDialog payment={payment} open={showCancelDialog} onOpenChange={setShowCancelDialog} /> */}
        </>
      )
    },
  },
]
