  import React, { useEffect, useState } from "react";
  import { tripsApi } from "lib/api";
  import Link from "next/link";

  const PodReport = () => {
    const [report, setReport] = useState(null);
    const [activeTab, setActiveTab] = useState("pending");
    const [search, setSearch] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

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

    // ✅ Filter Logic
    const filterData = (data) => {
      return data.filter((item) => {
        const searchLower = search.toLowerCase();

        const matchSearch =
          item.tripNumber?.toLowerCase().includes(searchLower) ||
          item.vehicleNumber?.toLowerCase().includes(searchLower) ||
          item.clientName?.toLowerCase().includes(searchLower) ||
          item.clientEmail?.toLowerCase().includes(searchLower) ||
          item.from?.toLowerCase().includes(searchLower) || // from city
          item.to?.toLowerCase().includes(searchLower); // to city

        const tripDate = new Date(item.tripDate);

        const matchStart =
          startDate ? tripDate >= new Date(startDate) : true;

        const matchEnd =
          endDate ? tripDate <= new Date(endDate + "T23:59:59") : true;

        return matchSearch && matchStart && matchEnd;
      });
    };

    const renderList = (data) => {
      const filtered = filterData(data);
      if (filtered.length === 0) {
        return (
          <p className="text-gray-500 italic p-4">
            No records found for this filter.
          </p>
        );
      }

      return (
        <ul className="divide-y divide-gray-200 border rounded-lg shadow-sm">
          {filtered.map((item, idx) => (
            <li
              key={idx}
              className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center hover:bg-gray-50"
            >
              <div className="mb-2 sm:mb-0">
                <p className="font-semibold text-gray-800">{item.clientName}</p>
                <p className="text-sm text-gray-500">{item.clientEmail}</p>
                <p className="text-sm text-gray-600">
                  {item.from} → {item.to}
                </p>
                <p className="text-sm text-gray-500">
                  Vehicle: {item.vehicleNumber}
                </p>
              </div>
              <div className="text-right">
                <span className="text-sm text-gray-600 font-medium">
                  <Link href={`/trips/view/${item.tripId}`}>
                    Trip: <span className="font-bold">{item.tripNumber}</span>
                  </Link>
                </span>
                <p className="text-xs text-gray-500">
                  Date: {new Date(item.tripDate).toLocaleDateString()}
                </p>
                <p
                  className={`text-sm font-semibold ${
                    item.status === "started" || item.status === "complete"
                      ? "text-red-600"
                      : "text-blue-600"
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
          📦 Client POD Status Report
        </h2>

        {/* ✅ Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-2">
          <input
            type="text"
            placeholder="Search trip/client/vehicle/from/to..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border px-3 py-2 rounded-md w-full sm:w-1/2"
          />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border px-3 py-2 rounded-md"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border px-3 py-2 rounded-md"
          />
        </div>
        {/* 🔽 Hint Text */}
        <p className="text-xs text-gray-500 mb-6">
          You can search by <span className="font-semibold">Trip Number</span>,{" "}
          <span className="font-semibold">Vehicle Number</span>,{" "}
          <span className="font-semibold">Client Name</span>,{" "}
          <span className="font-semibold">Client Email</span>,{" "}
          <span className="font-semibold">From City</span>,{" "}
          <span className="font-semibold">To City</span>,{" "}
          <span className="font-semibold">Start Date</span> and{" "}
          <span className="font-semibold">End Date</span>.
        </p>

        {/* Tabs */}
       {/* Tabs */}
<div className="flex border-b border-gray-200 mb-6">
  <button
    className={`py-2 px-4 text-center text-lg font-semibold transition-colors duration-300 ${
      activeTab === "pending"
        ? "border-b-4 border-red-500 text-red-600"
        : "text-gray-500 hover:text-gray-700"
    }`}
    onClick={() => setActiveTab("pending")}
  >
    Pending ({filterData(report.pending).length})
  </button>
  <button
    className={`py-2 px-4 text-center text-lg font-semibold transition-colors duration-300 ${
      activeTab === "submitted"
        ? "border-b-4 border-blue-500 text-blue-600"
        : "text-gray-500 hover:text-gray-700"
    }`}
    onClick={() => setActiveTab("submitted")}
  >
    Submitted ({filterData(report.submitted).length})
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
