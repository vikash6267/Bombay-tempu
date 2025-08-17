"use client";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { usersApi, driverCalculationsApi } from "lib/api";
import { DashboardLayout } from "components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Calculator, CheckCircle, Trash, Edit } from "lucide-react";
import { format } from "date-fns";
import { MultiTripCalculationDialog } from "../multi-trip-calculation-dialog";

const Page = () => {
  const { id } = useParams();
  const [selectedTripIds, setSelectedTripIds] = useState([]);
  const [showCalculationDialog, setShowCalculationDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingCalculation, setEditingCalculation] = useState(null);

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

  if (isLoading) return <div className="p-4">Loading...</div>;
  console.log("calculatedTripIds", Array.from(calculatedTripIds));
  console.log(
    "userData trips",
    availableTripsForSelection
  );

  return (
    <DashboardLayout>
      <div className="p-4 space-y-6">
        <h2 className="text-xl font-semibold">
          Driver: {userData.driver?.name}
        </h2>
        <p>Email: {userData.driver?.email}</p>
        <p>Phone: {userData.driver?.phone}</p>

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
              <label
                key={trip.tripId}
                className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-md cursor-pointer"
              >
                <Checkbox
                  checked={selectedTripIds.includes(trip.tripId)}
                  onChange={() => handleTripToggle(trip.tripId)}
                />
                <div className="flex flex-col">
                  <span>{trip.tripNumber}</span>
                  <span>{trip?.vehicle?.registrationNumber}</span>
                  <span className="text-xs">
                    ({format(new Date(trip.scheduledDate), "dd MMM yyyy")})
                  </span>
                </div>
              </label>
            ))}
          </div>

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
          Vehicles: {calc.tripIds.map(trip => trip.vehicle?.registrationNumber || "N/A").join(", ")}
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
    </DashboardLayout>
  );
};

export default Page;
