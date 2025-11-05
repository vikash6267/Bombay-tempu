import React, { useEffect, useState } from "react";
import { vehiclesApi } from "lib/api";

const VehicleExpiryList = () => {
  const [expiryData, setExpiryData] = useState({
    month1: [],
    month2: [],
    month3: [],
    expired: [],
    "500km": [],
    "1000km": [],
    "2000km": [],
  });
  const [activeTab, setActiveTab] = useState("month1");
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
      case "month1":
        dataToRender = filteredData(expiryData.month1);
        title = `Expiring in 1 Month (${dataToRender.length})`;
        break;
      case "month2":
        dataToRender = filteredData(expiryData.month2);
        title = `Expiring in 2 Months (${dataToRender.length})`;
        break;
      case "month3":
        dataToRender = filteredData(expiryData.month3);
        title = `Expiring in 3 Months (${dataToRender.length})`;
        break;
      case "expired":
        dataToRender = filteredData(expiryData.expired);
        title = `Expired (${dataToRender.length})`;
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
          { key: "month1", label: "1 Month", count: expiryData.month1.length },
          { key: "month2", label: "2 Months", count: expiryData.month2.length },
          { key: "month3", label: "3 Months", count: expiryData.month3.length },
          { key: "expired", label: "Expired", count: expiryData.expired.length },
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
