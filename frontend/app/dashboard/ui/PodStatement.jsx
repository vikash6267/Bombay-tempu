import React, { useEffect, useState } from "react";
import { tripsApi } from "lib/api";
import Link from "next/link";

const PodReport = () => {
  const [report, setReport] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");

  const loadPodReport = async () => {
    try {
      const res = await tripsApi.getPodReport();
      setReport(res.data);
    } catch (err) {
      console.error("Error fetching POD report:", err);
    }
  };

  useEffect(() => {
    loadPodReport();
  }, []);

  if (!report) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-500">
        Loading POD report...
      </div>
    );
  }

  const renderList = (data) => {
    if (data.length === 0) {
      return (
        <p className="text-gray-500 italic p-4">
          No records found for this status.
        </p>
      );
    }

    return (
      <ul className="divide-y divide-gray-200 border rounded-lg shadow-sm">
        {data.map((item, idx) => (
          <li
            key={idx}
            className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center hover:bg-gray-50"
          >
            <div className="mb-2 sm:mb-0">
              <p className="font-semibold text-gray-800">{item.clientName}</p>
              <p className="text-sm text-gray-500">{item.clientEmail}</p>
            </div>
            <div className="text-right">
              <span className="text-sm text-gray-600 font-medium">
               <Link href={`/trips/view/${item.tripId}`}>
                Trip: <span className="font-bold">{item.tripNumber}</span>
               </Link>
              </span>
              <p
                className={`text-sm font-semibold ${
                  item.status === "Pending" ? "text-red-600" : "text-blue-600"
                }`}
              >
                Status: {item.status}
              </p>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        📦Client  POD Status Report
      </h2>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-2 px-4 text-center text-lg font-semibold transition-colors duration-300 ${
            activeTab === "pending"
              ? "border-b-4 border-red-500 text-red-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("pending")}
        >
          Pending ({report.pending.length})
        </button>
        <button
          className={`py-2 px-4 text-center text-lg font-semibold transition-colors duration-300 ${
            activeTab === "submitted"
              ? "border-b-4 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("submitted")}
        >
          Submitted ({report.submitted.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {activeTab === "pending" && renderList(report.pending)}
        {activeTab === "submitted" && renderList(report.submitted)}
      </div>
    </div>
  );
};

export default PodReport;