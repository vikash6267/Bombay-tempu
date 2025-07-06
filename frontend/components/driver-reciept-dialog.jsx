"use client";

import { useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";
import { generateDriverReceiptPdf } from "lib/generate-driver-reciept";

export function DriverReceiptDialog({ trip, open, onOpenChange }) {
  const receiptRef = useRef();

  // State for calculations
  const [oldKM, setOldKM] = useState(0);
  const [newKM, setNewKM] = useState(0);
  const [perKMRate, setPerKMRate] = useState(19.5);
  const [pichla, setPichla] = useState(0);

  console.log(trip);

  // Calculations
  const totalKM = newKM - oldKM;
  const kmValue = totalKM * perKMRate;
  const expenses =
    trip.selfExpenses?.reduce((sum, e) => sum + e.amount, 0) || 0;
  const advance = trip.selfAdvances?.reduce((sum, a) => sum + a.amount, 0) || 0;
  const total = kmValue + expenses + Number(pichla);
  const due = total - advance;

  // Handle print functionality
  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: "Driver Receipt",
    pageStyle: `
      @page {
        size: A4;
        margin: 10mm;
      }
      body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    `,
  });

  // Handle PDF download functionality
  const handleDownloadPDF = async () => {
    try {
      const pdf = await generateDriverReceiptPdf(trip, {
        oldKM,
        newKM,
        rate: perKMRate,
        pichla,
      }); // नई यूटिलिटी फंक्शन को कॉल करें
      pdf.save(`Fleet-Receipt-${trip.tripNumber}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("पीडीएफ जनरेट करते समय त्रुटि हुई। कृपया पुनः प्रयास करें।");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-4">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-gray-800">
              Driver Trip Statement
            </DialogTitle>
            <div className="flex gap-2">
              <Button
                onClick={handlePrint}
                size="sm"
                className="flex items-center gap-1 bg-gray-700 hover:bg-gray-800"
              >
                <Printer className="w-4 h-4" />
                Print
              </Button>
              <Button
                onClick={handleDownloadPDF}
                size="sm"
                className="flex items-center gap-1 bg-gray-700 hover:bg-gray-800"
              >
                <Download className="w-4 h-4" />
                PDF
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div ref={receiptRef} className="bg-white text-gray-800 text-sm">
          {/* Header */}
          <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-1">
              TRIP STATEMENT
            </h1>
            <p className="text-gray-600">
              Date: {new Date().toLocaleDateString("en-IN")}
            </p>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2 border-b border-gray-300 pb-1">
                Driver Details
              </h3>
              <p>
                <span className="font-medium">Name:</span>{" "}
                {trip?.driver?.name || "N/A"}
              </p>
              <p>
                <span className="font-medium">ID:</span>{" "}
                {trip?.driver?.id || "N/A"}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2 border-b border-gray-300 pb-1">
                Vehicle Details
              </h3>
              <p>
                <span className="font-medium">Registration:</span>{" "}
                {trip?.vehicle?.registrationNumber || "N/A"}
              </p>
              <p>
                <span className="font-medium">Model:</span>{" "}
                {trip?.vehicle?.model || "N/A"}
              </p>
            </div>
          </div>

          {/* Advance Payments */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-3 border-b border-gray-400 pb-1">
              Advance Payments
            </h3>
            <table className="w-full border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left font-medium">
                    Date
                  </th>
                  <th className="border border-gray-300 p-2 text-right font-medium">
                    Amount (₹)
                  </th>
                  <th className="border border-gray-300 p-2 text-left font-medium">
                    Reason
                  </th>
                </tr>
              </thead>
              <tbody>
                {trip.selfAdvances?.length > 0 ? (
                  trip.selfAdvances.map((a, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-2">
                        {a.paidAt?.slice(0, 10) || "N/A"}
                      </td>
                      <td className="border border-gray-300 p-2 text-right">
                        {a.amount?.toFixed(2) || "0.00"}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {a.reason || "N/A"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="3"
                      className="border border-gray-300 p-4 text-center text-gray-500"
                    >
                      No advance payments recorded
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="text-right mt-2">
              <span className="font-semibold">
                Total Advance: ₹{advance.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Expenses */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-3 border-b border-gray-400 pb-1">
              Expenses
            </h3>
            <table className="w-full border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left font-medium">
                    Date
                  </th>
                  <th className="border border-gray-300 p-2 text-right font-medium">
                    Amount (₹)
                  </th>
                  <th className="border border-gray-300 p-2 text-left font-medium">
                    Category
                  </th>
                </tr>
              </thead>
              <tbody>
                {trip.selfExpenses?.length > 0 ? (
                  trip.selfExpenses.map((e, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-2">
                        {e.paidAt?.slice(0, 10) || "N/A"}
                      </td>
                      <td className="border border-gray-300 p-2 text-right">
                        {e.amount?.toFixed(2) || "0.00"}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {e.category || "N/A"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="3"
                      className="border border-gray-300 p-4 text-center text-gray-500"
                    >
                      No expenses recorded
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="text-right mt-2">
              <span className="font-semibold">
                Total Expenses: ₹{expenses.toFixed(2)}
              </span>
            </div>
          </div>

          {/* KM Calculation - Stacked Vertically */}
          <div className="mb-6 border border-gray-300 p-4">
            <h3 className="font-semibold text-gray-700 mb-4 border-b border-gray-400 pb-1">
              Kilometer Calculation
            </h3>

            <div className="space-y-3 mb-4">
              <div className="flex items-center">
                <label className="w-32 text-sm font-medium text-gray-700">
                  Old KM:
                </label>
                <input
                  type="number"
                  value={oldKM}
                  onChange={(e) => setOldKM(+e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1 w-32 text-sm focus:border-gray-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center">
                <label className="w-32 text-sm font-medium text-gray-700">
                  New KM:
                </label>
                <input
                  type="number"
                  value={newKM}
                  onChange={(e) => setNewKM(+e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1 w-32 text-sm focus:border-gray-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center">
                <label className="w-32 text-sm font-medium text-gray-700">
                  Rate per KM:
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={perKMRate}
                  onChange={(e) => setPerKMRate(+e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1 w-32 text-sm focus:border-gray-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Total KM Run:</span>
                <span className="font-semibold">{totalKM} KM</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">KM Value:</span>
                <span className="font-semibold">₹{kmValue.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center">
                <label className="w-32 text-sm font-medium text-gray-700">
                  Previous Balance:
                </label>
                <input
                  type="number"
                  value={pichla}
                  onChange={(e) => setPichla(+e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1 w-32 text-sm focus:border-gray-500 focus:outline-none"
                  placeholder="0"
                />
                <span className="ml-2 text-xs text-gray-500">
                  (use negative for debit)
                </span>
              </div>
            </div>
          </div>

          {/* Final Summary */}
          <div className="border-2 border-gray-800 p-4">
            <h3 className="font-bold text-gray-800 mb-4 text-center text-lg">
              FINAL SETTLEMENT
            </h3>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span>KM Value:</span>
                <span>₹{kmValue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Expenses:</span>
                <span>₹{expenses.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Previous Balance:</span>
                <span>₹{pichla.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-400 pt-2 font-semibold">
                <span>Total Earnings:</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Less: Advance Paid:</span>
                <span>₹{advance.toFixed(2)}</span>
              </div>
            </div>

            <div
              className={`text-xl font-bold ${
                due < 0 ? "text-red-600" : "text-black"
              }`}
            >
              Net Amount: ₹{due.toFixed(2)}
            </div>

            <div className="text-sm mt-1">
              {due > 0 && "(To be paid to Driver)"}
              {due < 0 && "(To be paid by Driver)"}
              {due === 0 && "(No outstanding balance)"}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-6 pt-4 border-t border-gray-300">
            <p className="text-xs text-gray-500">
              This is a computer-generated statement. Generated on{" "}
              {new Date().toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
