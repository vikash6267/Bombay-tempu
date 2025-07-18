import React, { useEffect, useState } from "react";
import axios from "axios";
import { vehiclesApi } from "lib/api";

const VehicleFinanceSummary = ({ vehicleId }) => {
  const [month, setMonth] = useState(""); // e.g., "2025-07"
  const [financeData, setFinanceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFinance = async () => {
  if (!vehicleId) return;
  try {
    setLoading(true);

    const res = await vehiclesApi.getFinace(
      vehicleId,
      month ? { month } : {}
    );

    console.log("Finance Response:", res);

    if (res.success) {
      setFinanceData(res);         // ✅ res already contains all needed data
      setError(null);              // ✅ clear previous error
    } else {
      setError("Finance fetch failed.");
    }

  } catch (err) {
    console.error("Error fetching finance:", err);
    setError("Failed to load vehicle finance.");
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchFinance();
  }, [vehicleId, month]);

  const handleMonthChange = (e) => {
    const value = e.target.value;
    setMonth(value);
  };

  return (
    <div className="p-4 border rounded-md shadow bg-white space-y-4">
      <h2 className="text-lg font-semibold">Vehicle Finance Summary</h2>

      {/* Month Selector */}
      <div className="mb-2">
        <label className="text-sm font-medium mr-2">Select Month:</label>
        <input
          type="month"
          value={month}
          onChange={handleMonthChange}
          className="border rounded px-2 py-1 text-sm"
        />
        <button
          onClick={() => setMonth("")}
          className="ml-2 text-blue-500 text-sm underline"
        >
          View All
        </button>
      </div>

      {loading ? (
        <p>Loading data...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : financeData ? (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-100 p-4 rounded">
              <h3 className="font-medium text-green-800">Total Income</h3>
              <p className="text-xl font-bold text-green-900">
                ₹{financeData.totalIncome}
              </p>
            </div>
            <div className="bg-red-100 p-4 rounded">
              <h3 className="font-medium text-red-800">Total Expense</h3>
              <p className="text-xl font-bold text-red-900">
                ₹{financeData.totalExpense}
              </p>
            </div>
          </div>

          {/* Income Details */}
          <div>
            <h4 className="font-semibold mt-4 mb-2">Income Details</h4>
            {financeData.incomeDetails.length ? (
              <ul className="space-y-1 text-sm">
                {financeData.incomeDetails.map((item) => (
                  <li
                    key={item.tripId}
                    className="p-2 rounded bg-green-50 border flex justify-between"
                  >
                    <span>
                      <strong>{item.tripNumber}</strong> —{" "}
                      {new Date(item.date).toLocaleDateString("en-US")}
                    </span>
                    <span className="font-semibold">₹{item.amount}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No income records.</p>
            )}
          </div>

          {/* Expense Details */}
          <div>
            <h4 className="font-semibold mt-4 mb-2">Expense Details</h4>
            {financeData.expenseDetails.length ? (
              <ul className="space-y-1 text-sm">
                {financeData.expenseDetails.map((item) => (
                  <li
                    key={item._id}
                    className="p-2 rounded bg-red-50 border flex justify-between"
                  >
                    <span>
                      <strong>{item.reason || "N/A"}</strong> —{" "}
                      {new Date(item.paidAt).toLocaleDateString("en-US")}
                    </span>
                    <span className="font-semibold">₹{item.amount}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No expense records.</p>
            )}
          </div>
        </>
      ) : (
        <p>No data found.</p>
      )}
    </div>
  );
};

export default VehicleFinanceSummary;
