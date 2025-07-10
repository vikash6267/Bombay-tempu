"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { usersApi } from "lib/api";
import { DashboardLayout } from "components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";

const Page = () => {
  const { id } = useParams();
  const [selectedTripIds, setSelectedTripIds] = useState([]);

  const { data: userData, isLoading } = useQuery({
    queryKey: ["user", id],
    queryFn: () => usersApi.driverDetails(id),
    enabled: !!id,
  });

  useEffect(() => {
    if (userData) {
      console.log("Fetched user data:", userData);
    }
  }, [userData]);

  const handleTripToggle = (tripId) => {
    setSelectedTripIds((prev) =>
      prev.includes(tripId)
        ? prev.filter((id) => id !== tripId)
        : [...prev, tripId]
    );
  };

  const filteredTrips = useMemo(() => {
    return userData?.trips?.filter((trip) =>
      selectedTripIds.includes(trip.tripId)
    );
  }, [userData, selectedTripIds]);

  if (isLoading) return <div className="p-4">Loading...</div>;

  return (
    <DashboardLayout>
      <div className="p-4 space-y-6">
        <h2 className="text-xl font-semibold">Driver: {userData.driver?.name}</h2>
        <p>Email: {userData.driver?.email}</p>
        <p>Phone: {userData.driver?.phone}</p>

        <div className="border p-4 rounded-xl bg-white shadow-sm">
          <h3 className="text-lg font-bold mb-2">Select Trips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {userData.trips.map((trip) => (
              <label
                key={trip.tripId}
                className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-md cursor-pointer"
              >
                <Checkbox
  checked={selectedTripIds.includes(trip.tripId)}
  onChange={() => handleTripToggle(trip.tripId)}
  label={trip.tripNumber}
/>

                <span>{trip.tripNumber} ({format(new Date(trip.scheduledDate), "dd MMM yyyy")})</span>
              </label>
            ))}
          </div>
        </div>

        {filteredTrips.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold">Trip Details</h3>
            {filteredTrips.map((trip) => (
              <Card key={trip.tripId} className="bg-white">
                <CardContent className="p-4 space-y-4">
                  <div className="flex flex-col md:flex-row justify-between">
                    <div>
                      <p className="font-semibold">Trip: {trip.tripNumber}</p>
                      <p>Date: {format(new Date(trip.scheduledDate), "dd MMM yyyy")}</p>
                    </div>
                    {trip.vehicle && (
                      <div>
                        <p className="font-semibold">Vehicle</p>
                        <p>{trip.vehicle.number} ({trip.vehicle.model})</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-bold mb-2">Self Advances</h4>
                      {trip.selfAdvances.length > 0 ? (
                        <ul className="space-y-2">
                          {trip.selfAdvances.map((adv, i) => (
                            <li
                              key={i}
                              className="bg-green-50 p-2 rounded-md border"
                            >
                              <p>Amount: ₹{adv.amount}</p>
                              <p>Reason: {adv.reason}</p>
                              <p>Date: {format(new Date(adv.paidAt), "dd MMM yyyy")}</p>
                              {adv.description && <p>Description: {adv.description}</p>}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500">No advances</p>
                      )}
                    </div>

                    <div>
                      <h4 className="font-bold mb-2">Self Expenses</h4>
                      {trip.selfExpenses.length > 0 ? (
                        <ul className="space-y-2">
                          {trip.selfExpenses.map((exp, i) => (
                            <li
                              key={i}
                              className="bg-red-50 p-2 rounded-md border"
                            >
                              <p>Amount: ₹{exp.amount}</p>
                              <p>Reason: {exp.reason}</p>
                              <p>Category: {exp.category}</p>
                              <p>Date: {format(new Date(exp.paidAt), "dd MMM yyyy")}</p>
                              {exp.description && <p>Description: {exp.description}</p>}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500">No expenses</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Page;