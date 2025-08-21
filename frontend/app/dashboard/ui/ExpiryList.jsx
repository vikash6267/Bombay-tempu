import React, { useEffect, useState } from "react";
import { vehiclesApi } from "lib/api";

const VehicleExpiryList = () => {
  const [expiryData, setExpiryData] = useState({
    days30: [],
    days90: [],
    days180: [],
    "500km": [],
    "1000km": [],
    "2000km": [],
  });
  const [activeTab, setActiveTab] = useState("days30");
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
    if (!searchTerm) return data;
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    return data.filter(
      (item) =>
        item.vehicle.toLowerCase().includes(lowercasedSearchTerm) ||
        (item.docName &&
          item.docName.toLowerCase().includes(lowercasedSearchTerm)) ||
        (item.expiryDate &&
          new Date(item.expiryDate)
            .toLocaleDateString("en-US")
            .toLowerCase()
            .includes(lowercasedSearchTerm))
    );
  };

  const renderContent = () => {
    let dataToRender;
    let title;

    switch (activeTab) {
      case "days30":
        dataToRender = filteredData(expiryData.days30);
        title = `Expiring in 30 Days (${dataToRender.length})`;
        break;
      case "days90":
        dataToRender = filteredData(expiryData.days90);
        title = `Expiring in 90 Days (${dataToRender.length})`;
        break;
      case "days180":
        dataToRender = filteredData(expiryData.days180);
        title = `Expiring in 180 Days (${dataToRender.length})`;
        break;
      case "500km":
        dataToRender = filteredData(expiryData["500km"]);
        title = `Service Due within 500 Km (${dataToRender.length})`;
        break;
      case "1000km":
        dataToRender = filteredData(expiryData["1000km"]);
        title = `Service Due within 1000 Km (${dataToRender.length})`;
        break;
      case "2000km":
        dataToRender = filteredData(expiryData["2000km"]);
        title = `Service Due within 2000 Km (${dataToRender.length})`;
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
      <div className="flex flex-wrap border-b border-gray-200 mb-4">
        {[
          { key: "days30", label: "30 Days", count: expiryData.days30.length },
          { key: "days90", label: "90 Days", count: expiryData.days90.length },
          { key: "days180", label: "180 Days", count: expiryData.days180.length },
          { key: "500km", label: "500 Km", count: expiryData["500km"].length },
          { key: "1000km", label: "1000 Km", count: expiryData["1000km"].length },
          { key: "2000km", label: "2000 Km", count: expiryData["2000km"].length },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`py-2 px-4 text-center ${
              activeTab === tab.key
                ? "border-b-2 border-blue-500 text-blue-500 font-semibold"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
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
                {item.docName ? (
                  <p className="text-sm text-gray-500">{item.docName}</p>
                ) : (
                  <p className="text-sm text-gray-500">
                    Next Service at: {item.nextServiceAtKm} km
                  </p>
                )}
              </div>
              <div className="text-right">
                {item.expiryDate ? (
                  <>
                    <span className="text-red-600 font-bold">
                      {new Date(item.expiryDate).toLocaleDateString("en-US")}
                    </span>
                    <p className="text-xs text-gray-400">Expiry Date</p>
                  </>
                ) : (
                  <>
                    <span className="text-green-600 font-bold">
                      Remaining: {item.remainingKm} km
                    </span>
                    <p className="text-xs text-gray-400">Service Due</p>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default VehicleExpiryList;
