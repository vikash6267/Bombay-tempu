"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Plus, Filter, Download, CreditCard } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { paymentColumns } from "@/components/payments/payment-columns"
import { PaymentFilters } from "@/components/payments/payment-filters"
import { AddPaymentDialog } from "@/components/payments/add-payment-dialog"
import { paymentsApi } from "@/lib/api"
// import { useAuthStore } from "@/lib/auth-store"
import { formatCurrency } from "@/lib/utils"
import { useSelector } from "react-redux"


export default function PaymentsPage() {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [filters, setFilters] = useState({})
   const { user } = useSelector((state) => state.auth)

  const {
    data: paymentsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["payments", filters],
    queryFn: () => paymentsApi.getAll(filters),
  })

  const payments = paymentsData?.data?.payments || []

  const handleAddPayment = () => {
    setShowAddDialog(false)
    refetch()
  }

  const canAddPayment = user?.role === "admin"

  // Calculate summary stats
  const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const pendingAmount = payments
    .filter((payment) => payment.status === "pending")
    .reduce((sum, payment) => sum + payment.amount, 0)
  const completedAmount = payments
    .filter((payment) => payment.status === "completed")
    .reduce((sum, payment) => sum + payment.amount, 0)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Payments</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Manage all payment transactions</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            {canAddPayment && (
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Payment
              </Button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CreditCard className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalAmount)}</div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{formatCurrency(pendingAmount)}</div>
              <p className="text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{formatCurrency(completedAmount)}</div>
              <p className="text-sm text-muted-foreground">Completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">{payments.length}</div>
              <p className="text-sm text-muted-foreground">Total Transactions</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
       
            <PaymentFilters filters={filters} onFiltersChange={setFilters} />
        

        {/* Payments Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Payments</CardTitle>
            <CardDescription>
              {payments.length} payment{payments.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="loading-spinner h-8 w-8" />
              </div>
            ) : (
              <DataTable
                columns={paymentColumns}
                data={payments}
                searchKey="paymentNumber"
                searchPlaceholder="Search by payment number..."
              />
            )}
          </CardContent>
        </Card>

        {/* Add Payment Dialog */}
        <AddPaymentDialog open={showAddDialog} onOpenChange={setShowAddDialog} onSuccess={handleAddPayment} />
      </div>
    </DashboardLayout>
  )
}
