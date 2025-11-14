"use client";
import { forwardRef } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";

export const FleetReceipt = forwardRef(
  ({ trip, companyName = "Bombay Uttranchal Tempo Service" }, ref) => {
    // Calculate totals
    const totalClientAmount = trip.rate 
    ||   trip.clients?.reduce((sum, client) => sum + (client.truckHireCost || client.totalRate || 0), 0) ||
      0;
    const totalFleetExpenses =
      trip.fleetExpenses?.reduce((sum, expense) => sum + expense.amount, 0) ||
      0;
    const totalFleetAdvances =
      trip.fleetAdvances?.reduce((sum, advance) => sum + advance.amount, 0) ||
      0;
    const totalPaid =  totalFleetAdvances;
    const commission = trip.commission || 0;
    const totalFreightWithExpenses = totalClientAmount + totalFleetExpenses;
    const podBalance = totalFreightWithExpenses - totalPaid - trip?.podBalance - commission;

    // Combine all transactions
    const allTransactions = [
      ...(trip.fleetExpenses?.map((expense) => ({
        date: expense.createdAt,
        reference: expense.receiptNumber || expense.category,
        description: expense.reason,
        amount: expense.amount,
        type: "expense",
      })) || []),
      ...(trip.fleetAdvances?.map((advance) => ({
        date: advance.createdAt,
        reference: advance.referenceNumber || advance.recipientType,
        description: advance.reason,
        amount: advance.amount,
        type: "advance",
      })) || []),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
      <div
        ref={ref}
        className="bg-white p-8 max-w-4xl mx-auto print:p-4 print:max-w-none"
        style={{
          fontFamily: "Arial, sans-serif",
          fontSize: "14px",
          lineHeight: "1.4",
        }}
      >
        {/* Header */}
        <div className="text-center border-2 border-black p-4 mb-6 print:mb-4">
          <h1 className="text-2xl font-bold print:text-xl">{companyName}</h1>
          <p className="text-sm mt-2 print:text-xs">Fleet Receipt</p>
        </div>

        {/* Trip Details Table */}
        <table className="w-full border-collapse border border-black mb-6 print:mb-4 print:text-xs">
          <tbody>
            <tr>
              <td className="border border-black p-2 font-semibold bg-gray-100 print:bg-gray-200 w-1/6">
                Date
              </td>
              <td className="border border-black p-2 w-1/3">
                {formatDate(trip.scheduledDate, "dd/MM/yyyy")}
              </td>
              <td className="border border-black p-2 font-semibold bg-gray-100 print:bg-gray-200 w-1/6">
                Vehicle No
              </td>
              <td className="border border-black p-2 w-1/3">
                {trip.vehicle?.registrationNumber}
              </td>
            </tr>
            <tr>
              <td className="border border-black p-2 font-semibold bg-gray-100 print:bg-gray-200">
                From
              </td>
              <td className="border border-black p-2">
                {trip.origin?.city}, {trip.origin?.state}
              </td>
              <td className="border border-black p-2 font-semibold bg-gray-100 print:bg-gray-200">
                Bls Paid Date
              </td>
              <td className="border border-black p-2">
                {trip?.podDetails?.date
                  ? new Date(trip.podDetails.date).toLocaleDateString()
                  : ""}
              </td>
            </tr>
            <tr>
              <td className="border border-black p-2 font-semibold bg-gray-100 print:bg-gray-200">
                To
              </td>
              <td className="border border-black p-2">
                {trip.destination?.city}, {trip.destination?.state}
              </td>
              <td className="border border-black p-2 font-semibold bg-gray-100 print:bg-gray-200">
                Trip No
              </td>
              <td className="border border-black p-2">{trip.tripNumber}</td>
            </tr>
          </tbody>
        </table>

        {/* Client Details and Summary */}
        <table className="w-full border-collapse border border-black mb-6 print:mb-4 print:text-xs">
          <tbody>
            {/* Client Rows */}
            {trip.clients?.map((clientData, index) => (
              <tr key={index}>
                <td className="border border-black p-2 font-semibold bg-gray-100 print:bg-gray-200 w-1/6">
                  Freight
                </td>
                <td className="border border-black p-2 text-right w-1/6">
                  {formatCurrency(clientData.truckHireCost != 0 && clientData.truckHireCost  || clientData.totalRate || 0)}
                </td>
                <td className="border border-black p-2 w-1/3">
                  {clientData.client?.name}
                </td>
                <td className="border border-black p-2 font-semibold bg-gray-100 print:bg-gray-200 w-1/6">
                  {index === 0 ? "Commission" : ""}
                </td>
                <td className="border border-black p-2 text-right w-1/6">
                  {index === 0 ? formatCurrency(commission) : ""}
                </td>
              </tr>
            ))}

            {/* Empty rows for formatting */}
            {Array.from({
              length: Math.max(0, 3 - (trip.clients?.length || 0)),
            }).map((_, index) => (
              <tr key={`empty-${index}`}>
                <td className="border border-black p-2 font-semibold bg-gray-100 print:bg-gray-200">
                  Freight
                </td>
                <td className="border border-black p-2"></td>
                <td className="border border-black p-2"></td>
                <td className="border border-black p-2 font-semibold bg-gray-100 print:bg-gray-200">
                  {true ? "POD Balance" : ""}
                </td>
                <td className="border border-black p-2 text-right">
                  {true ? formatCurrency(trip.podBalance || 0) : ""}
                </td>
              </tr>
            ))}

            {/* Fleet Expenses Row */}
            {totalFleetExpenses > 0 && (
              <tr>
                <td className="border border-black p-2 font-semibold bg-gray-100 print:bg-gray-200">
                  Fleet Expenses
                </td>
                <td className="border border-black p-2 text-right">
                  {formatCurrency(totalFleetExpenses)}
                </td>
                <td className="border border-black p-2"></td>
                <td className="border border-black p-2"></td>
                <td className="border border-black p-2"></td>
              </tr>
            )}

            {/* Total Row */}
            <tr className="font-bold">
              <td className="border border-black p-2 font-semibold bg-gray-100 print:bg-gray-200">
                Total Freight
              </td>
              <td className="border border-black p-2 text-right">
                {formatCurrency(totalFreightWithExpenses)}
              </td>
              <td className="border border-black p-2"></td>
              <td className="border border-black p-2 font-semibold bg-gray-100 print:bg-gray-200">
                Balance
              </td>
              <td className="border border-black p-2 text-right text-lg print:text-base">
                {formatCurrency(podBalance)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Transaction Details */}
        <div className="mb-4">
          <h3 className="text-lg font-bold mb-2 print:text-base">
            Transaction Details
          </h3>
        </div>

        <table className="w-full border-collapse border border-black print:text-xs">
          <thead>
            <tr className="bg-gray-100 print:bg-gray-200">
              <th className="border border-black p-2 w-12">Sr No</th>
              <th className="border border-black p-2 w-20">Date</th>
              <th className="border border-black p-2 w-24">Reference</th>
              <th className="border border-black p-2">Description</th>
              <th className="border border-black p-2 w-24">Amount</th>
            </tr>
          </thead>
          <tbody>
            {allTransactions.map((transaction, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="border border-black p-2 text-center">
                  {index + 1}
                </td>
                <td className="border border-black p-2 text-center">
                  {formatDate(transaction.date, "dd/MM/yyyy")}
                </td>
                <td className="border border-black p-2">
                  {transaction.reference}
                </td>
                <td className="border border-black p-2">
                  {transaction.description}
                </td>
                <td className="border border-black p-2 text-right">
                  {formatCurrency(transaction.amount)}
                </td>
              </tr>
            ))}

            {/* Add empty rows if needed for better formatting */}
            {allTransactions.length === 0 && (
              <tr>
                <td className="border border-black p-2 text-center" colSpan={5}>
                  No transactions recorded
                </td>
              </tr>
            )}

            {/* Summary Row */}
            <tr className="bg-gray-100 print:bg-gray-200 font-bold">
              <td className="border border-black p-2 text-center" colSpan={4}>
                Total Paid
              </td>
              <td className="border border-black p-2 text-right">
                {formatCurrency(totalPaid)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Summary Section */}
        <div className="mt-6 print:mt-4 grid grid-cols-2 gap-4 print:gap-2">
          <div className="border border-black p-3 print:p-2">
            <h4 className="font-bold mb-2 print:mb-1">Summary</h4>
            <div className="space-y-1 text-sm print:text-xs">
              <div className="flex justify-between">
                <span>Base Freight:</span>
                <span>{formatCurrency(totalClientAmount)}</span>
              </div>
              {totalFleetExpenses > 0 && (
                <div className="flex justify-between">
                  <span>Fleet Expenses:</span>
                  <span>+ {formatCurrency(totalFleetExpenses)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold">
                <span>Total Freight:</span>
                <span>{formatCurrency(totalFreightWithExpenses)}</span>
              </div>
              <div className="flex justify-between">
                <span>Commission:</span>
                <span>- {formatCurrency(commission)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Paid:</span>
                <span>- {formatCurrency(totalPaid)}</span>
              </div>
              <div className="flex justify-between">
                <span>POD Balance:</span>
                <span>- {formatCurrency(trip.podBalance || 0)}</span>
              </div>
              <hr className="my-1" />
              <div className="flex justify-between font-bold">
                <span>Net Balance:</span>
                <span>{formatCurrency(podBalance)}</span>
              </div>
            </div>
          </div>

          <div className="border border-black p-3 print:p-2">
            <h4 className="font-bold mb-2 print:mb-1">Signatures</h4>
            <div className="space-y-4 print:space-y-2">
              <div>
                <div className="border-b border-black w-full h-8 print:h-6"></div>
                <p className="text-xs mt-1">Driver Signature</p>
              </div>
              <div>
                <div className="border-b border-black w-full h-8 print:h-6"></div>
                <p className="text-xs mt-1">Authorized Signature</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 print:mt-4 text-center border-t border-gray-300 pt-4 print:pt-2">
          <p className="text-sm text-gray-600 print:text-xs">
            Generated on {formatDate(new Date(), "dd/MM/yyyy HH:mm")}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            This is a computer generated receipt
          </p>
        </div>
      </div>
    );
  }
);

FleetReceipt.displayName = "FleetReceipt";
