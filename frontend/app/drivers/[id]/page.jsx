"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { usersApi, driverCalculationsApi, tripsApi } from "lib/api";
import { DashboardLayout } from "components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Calculator, CheckCircle, Trash, Edit, Wallet } from "lucide-react";
import { format } from "date-fns";
import { MultiTripCalculationDialog } from "../multi-trip-calculation-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMutation } from "@tanstack/react-query";
import { Input } from "components/ui/input";
import Swal from "sweetalert2";
import Link from "next/link";
import { SelfAdvanceForm } from "app/trips/view/[id]/page";
import { toast } from "react-hot-toast";

const Page = () => {
  const { id } = useParams();
  const [selectedTripIds, setSelectedTripIds] = useState([]);
  const [showCalculationDialog, setShowCalculationDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingCalculation, setEditingCalculation] = useState(null);

  ///ADVANCED
  const [openAdvance, setOpenAdvance] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [reason, setReason] = useState("");
  const [paymentType, setPaymentType] = useState("cash");
  const [selfAdvanceForm, setSelfAdvanceForm] = useState(false);
const [selfAdvanceTripId, setSelfAdvanceTripId] = useState(null);

  const [advances, setAdvances] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const fetchAdvances = async () => {
    if (openAdvance && selectedOwner?._id) {
      // ✅ FIXED
      try {
        setDetailsLoading(true);
        const res = await usersApi.getUserAdvances(selectedOwner._id); // ✅ FIXED
        setAdvances(res?.advances || []);
      } catch (error) {
        console.error("Failed to fetch advances:", error);
        toast.error("Failed to load advances");
      } finally {
        setDetailsLoading(false);
      }
    }
  };
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
          Swal.showLoading();
        },
      });
    },
    onSuccess: async () => {
      Swal.close();
      toast.success("Advance given successfully");
      setAdvanceAmount("");
      setReason("");
      fetchAdvances();
      if (selectedOwner?._id) {
        // ✅ FIXED
        const res = await usersApi.getUserAdvances(selectedOwner._id);
        setAdvances(res?.advances || []);
      }
    },
    onError: () => {
      fetchAdvances();

      Swal.close();
      toast.error("Failed to give advance");
    },
  });

  useEffect(() => {
    fetchAdvances();
  }, [openAdvance, selectedOwner]);

  // 🔹 Driver data (with trips)
  const { data: userData, isLoading } = useQuery({
    queryKey: ["user", id],
    queryFn: () => usersApi.driverDetails(id),
    enabled: !!id,
  });

  // 🔹 Driver ke purane calculations fetch karo
  const { data: calculations, refetch: refetchCalculations } = useQuery({
    queryKey: ["driver-calculations", id],
    queryFn: () => driverCalculationsApi.getByDriver(id),
    enabled: !!id,
  });

  // --- Extract already calculated trips from DB ---
  const calculatedTripIds = useMemo(() => {
    if (!calculations) return new Set();

    // Flatten and extract correct tripId from each object
    const allIds = calculations.flatMap(
      (calc) => calc.tripIds.map((t) => t.tripId || t._id || t.id) // pick correct field
    );

    return new Set(allIds.map(String)); // ensure all are strings
  }, [calculations]);
  const handleTripToggle = (tripId) => {
    setSelectedTripIds((prev) =>
      prev.includes(tripId)
        ? prev.filter((id) => id !== tripId)
        : [...prev, tripId]
    );
  };

  const handleCalculationComplete = async (tripIds) => {
    setSelectedTripIds([]);
    setShowCalculationDialog(false);
    setEditMode(false);
    setEditingCalculation(null);
    await refetchCalculations(); // ✅ Refresh calculated trips after save
  };

  const handleEditCalculation = (calculation) => {
    // Find trips for this calculation
    const calculationTrips =
      userData?.trips?.filter((trip) =>
        calculation.tripIds.includes(trip.tripId || trip.id)
      ) || [];

    setSelectedTripIds(calculation.tripIds);
    setEditMode(true);
    setEditingCalculation(calculation);
    setShowCalculationDialog(true);
  };

  const handleNewCalculation = () => {
    setEditMode(false);
    setEditingCalculation(null);
    setShowCalculationDialog(true);
  };

  // --- Trips available for new calculation ---
  const availableTripsForSelection = useMemo(() => {
    return (
      userData?.trips?.filter(
        (trip) => !calculatedTripIds.has(String(trip.tripId))
      ) || []
    );
  }, [userData, calculatedTripIds]);

  console.log(calculations, "calculations");

  // --- Selected trips details ---
  const filteredTrips = useMemo(() => {
    return (
      userData?.trips?.filter((trip) =>
        selectedTripIds.includes(trip.tripId)
      ) || []
    );
  }, [userData, selectedTripIds]);

 const handleSelfAdvanceSubmit = async (tripId,values) => {
    try {
      const res = await tripsApi.addSelfAdvance(tripId, values);
      if (res) {
        setSelfAdvanceForm(false);
       
        toast.success("Self advance payment added successfully");
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to add self advance payment");
    }
  };


  if (isLoading) return <div className="p-4">Loading...</div>;
  console.log("calculatedTripIds", Array.from(calculatedTripIds));
  console.log("userData trips", selectedOwner);

  return (
    <DashboardLayout>
      <div className="p-4 space-y-6">
        <h2 className="text-xl font-semibold">
          Driver: {userData.driver?.name}
        </h2>
        <p>Email: {userData.driver?.email}</p>
        <p>Phone: {userData.driver?.phone}</p>
        <p>Advance Amount: {userData.driver?.advanceAmount}</p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setSelectedOwner(userData.driver);
            setOpenAdvance(true);
          }}
        >
          <Wallet className="h-4 w-4 mr-1" />
          Advance
        </Button>
        {/* --- Trip selection box --- */}
        <div className="border p-4 rounded-xl bg-white shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Select Trips for Calculation</h3>
            {selectedTripIds.length > 0 && (
              <Button
                onClick={handleNewCalculation}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Calculator className="w-4 h-4" />
                Calculate ({selectedTripIds.length} trips)
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {availableTripsForSelection.map((trip) => (
  <div key={trip.tripId} className="flex items-center justify-between bg-gray-100 px-3 py-2 rounded-md mb-2">

    {/* Checkbox to select trip */}
    <label className="flex items-center space-x-2">
      <Checkbox
        checked={selectedTripIds.includes(trip.tripId)}
        onChange={() => handleTripToggle(trip.tripId)}
      />
      <div>
        <Link
          href={`/trips/view/${trip.tripId}`}
          target="_blank"
          className="text-blue-900 underline font-semibold"
        >
          {trip.tripNumber}
        </Link>
        <div className="text-xs text-gray-600">
          {trip.vehicle?.registrationNumber || "N/A"} | {format(new Date(trip.scheduledDate), "dd MMM yyyy")}
        </div>
      </div>
    </label>

    {/* + Button to open Self Advance Form */}
    <Button
      size="sm"
      variant="outline"
      onClick={() => setSelfAdvanceTripId(trip.tripId)}
    >
      ➕
    </Button>
  </div>
))}

          </div>
 {selfAdvanceTripId && (
  <SelfAdvanceForm
    handleSubmit={async (values) => {
      await handleSelfAdvanceSubmit(selfAdvanceTripId, values);
      setSelfAdvanceTripId(null); // Close form after submit
    }}
    open={true}
    onClose={() => setSelfAdvanceTripId(null)}
  />
)}
          {availableTripsForSelection.length === 0 && (
            <p className="text-gray-500 text-center py-4">
              All trips have been calculated. No trips available for selection.
            </p>
          )}
        </div>

        {/* --- Already Calculated Trips (from DB) --- */}
        {calculations?.length > 0 && (
          <div className="border p-4 rounded-xl bg-green-50 shadow-sm">
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Calculated Trips ({calculatedTripIds.size})
            </h3>

            {calculations.map((calc) => (
              <Card key={calc._id} className="mb-3">
                <CardContent className="p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      {/* <p className="font-semibold">
                        Calculation ID: {calc._id}
                      </p> */}
                      <p className="text-sm text-gray-600">
                        Trip Numbers:{" "}
                        {calc?.tripIds
                          ?.map((trip) => trip.tripNumber)
                          .join(", ")}
                      </p>
                      <p className="text-sm text-gray-600">
                        Vehicles:{" "}
                        {calc.tripIds
                          .map(
                            (trip) => trip.vehicle?.registrationNumber || "N/A"
                          )
                          .join(", ")}
                      </p>

                      <p>
                        Total KM: {calc.totalKM} | Due: ₹{calc.due}
                      </p>
                      <p className="text-xs text-gray-500">
                        Created:{" "}
                        {format(new Date(calc.createdAt), "dd MMM yyyy HH:mm")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-1 bg-transparent"
                        onClick={() => handleEditCalculation(calc)}
                      >
                        <Edit className="w-4 h-4" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex items-center gap-1"
                        onClick={async () => {
                          if (
                            confirm(
                              "Are you sure you want to delete this calculation?"
                            )
                          ) {
                            await driverCalculationsApi.delete(calc._id);
                            await refetchCalculations();
                          }
                        }}
                      >
                        <Trash className="w-4 h-4" /> Delete
                      </Button>
                    </div>
                  </div>

                  <div className="mt-2 text-sm text-gray-600">
                    Trips: {calc.tripIds.length}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* --- Trip Details (Selected for New Calculation) --- */}
        {filteredTrips.length > 0 && !editMode && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold">Selected Trip Details</h3>
            {filteredTrips.map((trip) => (
              <Card key={trip.tripId} className="bg-white">
                <CardContent className="p-4 space-y-4">
                  <div className="flex flex-col md:flex-row justify-between">
                    <div>
                      <p className="font-semibold">Trip: {trip.tripNumber}</p>
                      <p className="text-sm text-gray-600">
                        Trip ID: {trip.tripId}
                      </p>
                      <p>
                        Date:{" "}
                        {format(new Date(trip.scheduledDate), "dd MMM yyyy")}
                      </p>
                    </div>
                    {trip.vehicle && (
                      <div>
                        <p className="font-semibold">Vehicle</p>
                        <p>
                          {trip.vehicle.number} ({trip.vehicle.model})
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* --- Calculation Dialog --- */}
        <MultiTripCalculationDialog
          trips={filteredTrips}
          driver={userData?.driver}
          open={showCalculationDialog}
          onOpenChange={setShowCalculationDialog}
          onCalculationComplete={handleCalculationComplete}
          editMode={editMode}
          existingCalculation={editingCalculation}
        />
      </div>

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
              type="button"
              onClick={() =>
                giveAdvanceMutation.mutate({
                  userId: selectedOwner.id,
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
                        <td className="p-2">
                          {new Date(a.date).toLocaleDateString("en-US")}
                        </td>
                        <td
                          className={`p-2 font-medium ${
                            a.type === "credit"
                              ? "text-green-600"
                              : "text-red-600"
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
  );
};

export default Page;
