"use client"

import { useEffect, useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { Plus, Search, Filter, Wallet, Loader2 } from "lucide-react"
import { useSelector } from "react-redux"
import { toast } from "sonner"
import Swal from "sweetalert2"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { usersApi } from "@/lib/api"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function FleetOwnersPage() {
  const { user } = useSelector((state) => state.auth)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedOwner, setSelectedOwner] = useState(null)
  const [openDetails, setOpenDetails] = useState(false)
  const [openAdvance, setOpenAdvance] = useState(false)

  const [advanceAmount, setAdvanceAmount] = useState("")
  const [reason, setReason] = useState("")
  const [paymentType, setPaymentType] = useState("cash")

  const [advances, setAdvances] = useState([])
  const [detailsLoading, setDetailsLoading] = useState(false)

  useEffect(() => {
    if (!selectedOwner?._id || !openAdvance) return
    const fetchAdvances = async () => {
      try {
        const res = await usersApi.getUserAdvances(selectedOwner._id)
        console.log(res?.advances,"DATAVNCED")
        setAdvances(res?.advances || [])
      } catch (error) {
        console.error("Error fetching advances:", error)
      }
    }
    fetchAdvances()
  }, [selectedOwner, openAdvance])

  const { data: fleetOwnersData, isLoading } = useQuery({
    queryKey: ["users", "fleet_owners"],
    queryFn: () => usersApi.getAll({ role: "fleet_owner" }),
  })

  const giveAdvanceMutation = useMutation({
    mutationFn: (payload) => usersApi.giveAdvance(payload),
    onMutate: () => {
      Swal.fire({
        title: "Giving Advance...",
        html: `
          <div style="display: flex; justify-content: center; align-items: center; padding: 20px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
             viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
             class="lucide lucide-loader-2"
             style="animation: spin 1s linear infinite;">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
            </svg>
          </div>
          <style>
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          </style>
        `,
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading()
        },
      })
    },
    onSuccess: async () => {
      Swal.close()
      toast.success("Advance given successfully")
      setAdvanceAmount("")
      setReason("")
      if (selectedOwner?._id) {
        const res = await usersApi.getUserAdvances(selectedOwner._id)
        setAdvances(res?.advances || [])
      }
    },
    onError: () => {
      Swal.close()
      toast.error("Failed to give advance")
    },
  })

  const fleetOwners = fleetOwnersData?.data?.users || []
  const filteredFleetOwners = fleetOwners.filter(
    (owner) =>
      owner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      owner.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const columns = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "phone", header: "Phone" },
    {
      accessorKey: "commissionRate",
      header: "Commission Rate",
      cell: ({ row }) => <span>{row.getValue("commissionRate") || "N/A"}%</span>,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setDetailsLoading(true)
              setSelectedOwner(row.original)
              setOpenDetails(true)
              // simulate API delay if needed
              setTimeout(() => setDetailsLoading(false), 800)
            }}
          >
            View
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSelectedOwner(row.original)
              setOpenAdvance(true)
            }}
          >
            <Wallet className="h-4 w-4 mr-1" />
            Advance
          </Button>
        </div>
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

            <DataTable
              columns={columns}
              data={filteredFleetOwners}
              loading={isLoading}
              loaderIcon={<Loader2 className="animate-spin h-5 w-5 text-gray-500" />}
            />
          </CardContent>
        </Card>
      </div>

      {/* View Details Dialog */}
      <Dialog open={openDetails} onOpenChange={setOpenDetails}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Fleet Owner Details</DialogTitle>
            <DialogDescription>Details of {selectedOwner?.name}</DialogDescription>
          </DialogHeader>
          {detailsLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
            </div>
          ) : (
            selectedOwner && (
              <div className="space-y-3">
                <p><strong>Name:</strong> {selectedOwner.name}</p>
                <p><strong>Email:</strong> {selectedOwner.email}</p>
                <p><strong>Phone:</strong> {selectedOwner.phone || "N/A"}</p>
                <p><strong>Commission Rate:</strong> {selectedOwner.commissionRate || "N/A"}%</p>
                <p><strong>Total Advance:</strong> {selectedOwner.advanceAmount || "0"}</p>
              </div>
            )
          )}
        </DialogContent>
      </Dialog>

      {/* Advance Dialog */}
      <Dialog open={openAdvance} onOpenChange={setOpenAdvance}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Advances for {selectedOwner?.name}</DialogTitle>
            <DialogDescription>
              Manage and view all advances given to this fleet owner
            </DialogDescription>
          </DialogHeader>

          {/* Add Advance Form */}
          <div className="space-y-3 mb-4">
            <Input
              type="number"
              placeholder="Amount"
              value={advanceAmount}
              onChange={(e) => setAdvanceAmount(e.target.value)}
            />
            <Input
              placeholder="Reason / Notes"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <select
              className="border rounded p-2 w-full"
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
            >
              <option value="cash">Cash</option>
              <option value="bank">Bank</option>
              <option value="upi">UPI</option>
            </select>

            <Button
              className="w-full"
              onClick={() =>
                giveAdvanceMutation.mutate({
                  userId: selectedOwner._id,
                  amount: Number(advanceAmount),
                  reason,
                  paymentType,
                })
              }
              disabled={giveAdvanceMutation.isLoading}
            >
              {giveAdvanceMutation.isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {giveAdvanceMutation.isLoading ? "Saving..." : "Give Advance"}
            </Button>
          </div>

          {/* Advance History Table */}
       <div>
  <h3 className="font-semibold mb-2">Advance History</h3>
  {advances.length === 0 ? (
    <p className="text-gray-500">No advances yet.</p>
  ) : (
    <div className="max-h-60 overflow-y-auto border rounded-lg">
      <table className="w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Date</th>
            <th className="p-2 text-left">Amount</th>
            <th className="p-2 text-left">Reason</th>
            <th className="p-2 text-left">Payment Type</th>
            <th className="p-2 text-left">Paid By</th>
          </tr>
        </thead>
        <tbody>
          {advances.map((a) => (
            <tr key={a._id} className="border-b">
              <td className="p-2">{new Date(a.date).toLocaleDateString("en-US")}</td>
              <td
                className={`p-2 font-medium ${
                  a.type === "credit" ? "text-green-600" : "text-red-600"
                }`}
              >
                {a.type === "credit" ? "+" : "-"}₹{a.amount}
              </td>
              <td className="p-2">{a.reason}</td>
              <td className="p-2">{a.paymentType}</td>
              <td className="p-2">{a.paidBy}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>

        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
