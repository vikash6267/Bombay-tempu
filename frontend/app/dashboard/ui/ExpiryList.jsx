import React, { useEffect, useState } from "react";
import { vehiclesApi } from "lib/api";

const VehicleExpiryList = () => {
  const [expiryData, setExpiryData] = useState({
    days30: [],
    days90: [],
    days180: [],
  });
  const [activeTab, setActiveTab] = useState("30days");
  const [searchTerm, setSearchTerm] = useState("");

  const loadExpiries = async () => {
    try {
      const res = await vehiclesApi.getExpiries();
      if (res.success && res.data) {
        setExpiryData(res.data);
      }
    } catch (err) {
      console.error("Error fetching expiries", err);
    }
  };

  useEffect(() => {
    loadExpiries();
  }, []);

  // Filter the data based on the search term
  const filteredData = (data) => {
    if (!searchTerm) {
      return data;
    }
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    return data.filter(
      (item) =>
        item.vehicle.toLowerCase().includes(lowercasedSearchTerm) ||
        item.docName.toLowerCase().includes(lowercasedSearchTerm) ||
        new Date(item.expiryDate)
          .toLocaleDateString("en-US")
          .toLowerCase()
          .includes(lowercasedSearchTerm)
    );
  };

  const renderContent = () => {
    let dataToRender;
    let title;

    switch (activeTab) {
      case "30days":
        dataToRender = filteredData(expiryData.days30);
        title = "Expiring in 30 Days";
        break;
      case "90days":
        dataToRender = filteredData(expiryData.days90);
        title = "Expiring in 90 Days";
        break;
      case "180days":
        dataToRender = filteredData(expiryData.days180);
        title = "Expiring in 180 Days";
        break;
      default:
        dataToRender = [];
        title = "";
    }
    return <ExpirySection title={title} data={dataToRender} />;
  };

  return (
    <div className="p-4">
      {/* Search Input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by vehicle, document, or date..."
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-4">
        <button
          className={`py-2 px-4 text-center ${
            activeTab === "30days"
              ? "border-b-2 border-blue-500 text-blue-500 font-semibold"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("30days")}
        >
          Expiring in 30 Days
        </button>
        <button
          className={`py-2 px-4 text-center ${
            activeTab === "90days"
              ? "border-b-2 border-blue-500 text-blue-500 font-semibold"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("90days")}
        >
          Expiring in 90 Days
        </button>
        <button
          className={`py-2 px-4 text-center ${
            activeTab === "180days"
              ? "border-b-2 border-blue-500 text-blue-500 font-semibold"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("180days")}
        >
          Expiring in 180 Days
        </button>
      </div>
      {/* Tab Content */}
      {renderContent()}
    </div>
  );
};

// Reusable Section Component
const ExpirySection = ({ title, data }) => {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      {data.length === 0 ? (
        <p className="text-gray-500 italic">No records found for this period.</p>
      ) : (
        <ul className="divide-y divide-gray-200 border rounded-lg shadow-sm">
          {data.map((item, index) => (
            <li
              key={index}
              className="p-4 flex items-center justify-between hover:bg-gray-50"
            >
              <div>
                <p className="font-medium text-gray-800">{item.vehicle}</p>
                <p className="text-sm text-gray-500">{item.docName}</p>
              </div>
              <div className="text-right">
                <span className="text-red-600 font-bold">
                  {new Date(item.expiryDate).toLocaleDateString("en-US")}
                </span>
                <p className="text-xs text-gray-400">Expiry Date</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default VehicleExpiryList;