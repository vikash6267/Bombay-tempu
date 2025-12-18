"use client";
import {
  Download,
  FileText,
  Calendar,
  IndianRupee,
  User,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { UpdateClientDialog } from "components/trips/update-user-dialoag";
import { useEffect, useState } from "react";
import { usersApi } from "lib/api";

export function StatementTable({
  statement,
  clientInfo:initialClientInfo,
  totalTrips,
  totalBalance,
  tripBalances = [],
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [clientInfo, setClientInfo] = useState(initialClientInfo);
 console.log(initialClientInfo)
  const handleClientUpdate = async (updatedClient) => {
    try {
      // Fetch updated client from API
      console.log("UPDATEDATE",updatedClient.user)
      const { data } = await usersApi.getById(updatedClient.user._id ||initialClientInfo._id );
      console.log(data,"NEWDATA")
      setClientInfo(data.user || initialClientInfo); // update local state
    } catch (error) {
      console.error("Failed to fetch updated client:", error);
    }
  };


  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  console.log(clientInfo);

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const downloadStatement = () => {
    const csvContent = [
      // Header with client info
      [`Client Statement - ${clientInfo.name}`],
      [`Generated on: ${new Date().toLocaleDateString("en-IN")}`],
      [`Total Trips: ${totalTrips}`],
      [`Total Balance: ${formatCurrency(totalBalance)}`],
      [`Closing Balance: ${formatCurrency(statement.closingBalance)}`],
      [],
      // Transaction table header
      [
        "Trip Number",
        "Date",
        "Reason",
        "Type",
        "Debit",
        "Credit",
        "Notes",
        "Paid To",
      ],
      // Data rows
      ...statement.entries.map((entry) => [
        entry.tripNumber,
        formatDate(entry.date),
        entry.reason,
        entry.type,
        entry.debit || 0,
        entry.credit || 0,
        entry.notes || entry.description || "",
        entry.paidTo || "",
      ]),
      [],
      // Summary
      [
        "",
        "",
        "",
        "TOTAL",
        statement.totalDebit,
        statement.totalCredit,
        "",
        "",
      ],
      ["", "", "", "CLOSING BALANCE", "", statement.closingBalance, "", ""],
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `statement_${clientInfo.name.replace(/\s+/g, "_")}_${
        new Date().toISOString().split("T")[0]
      }.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;

    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("ACCOUNT STATEMENT", pageWidth / 2, 25, { align: "center" });

    // Client Information Section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("CLIENT INFORMATION", margin, 45);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    let yPos = 55;

    // Client details in two columns
    doc.text(`Name: ${clientInfo.name}`, margin, yPos);
    doc.text(
      `Status: ${clientInfo.active ? "Active" : "Inactive"}`,
      pageWidth / 2,
      yPos
    );
    yPos += 8;

    if (clientInfo.email) {
      doc.text(`Email: ${clientInfo.email}`, margin, yPos);
    }
    if (clientInfo.phone) {
      doc.text(`Phone: ${clientInfo.phone}`, pageWidth / 2, yPos);
    }
    yPos += 8;

    doc.text(
      `Generated on: ${new Date().toLocaleDateString(
        "en-IN"
      )} ${new Date().toLocaleTimeString("en-IN")}`,
      margin,
      yPos
    );
    yPos += 15;

    // Statement Summary Section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("STATEMENT SUMMARY", margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    // Summary in a box format
    const summaryData = [
      ["Total Trips", totalTrips.toString()],
      ["Total Credit", statement.totalCredit.toFixed(2)], // Assuming 2 decimal places for currency-like values
      ["Total Debit", statement.totalDebit.toFixed(2)],
      ["Closing Balance", statement.closingBalance.toFixed(2)],
      ["Account Balance", totalBalance.toFixed(2)],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [["Description", "Amount"]],
      body: summaryData,
      theme: "grid",
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: "bold",
      },
      bodyStyles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 60, halign: "right" },
      },
      margin: { left: margin, right: margin },
    });

    yPos = doc.lastAutoTable.finalY + 15;

    // Transaction Details Section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("TRANSACTION DETAILS", margin, yPos);
    yPos += 10;

    // Prepare transaction data for the table
    const transactionData = statement.entries.map((entry) => [
      entry.tripNumber,
      formatDate(entry.date),
      entry.reason,
      entry.type,
      entry.debit > 0 ? entry.debit.toFixed(2) : "-",
      entry.credit > 0 ? entry.credit.toFixed(2) : "-",
      entry.notes || entry.description || "-",
    ]);

    // Add totals row
    transactionData.push([
      "",
      "",
      "",
      "TOTAL",
      statement.totalDebit.toFixed(2),
      statement.totalCredit.toFixed(2),
      "",
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [
        ["Trip No.", "Date", "Reason", "Type", "Debit", "Credit", "Notes"],
      ],
      body: transactionData,
      theme: "striped",
      headStyles: {
        fillColor: [52, 152, 219],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 9,
      },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 22 },
        2: { cellWidth: 20 },
        3: { cellWidth: 18 },
        4: { cellWidth: 25, halign: "right" },
        5: { cellWidth: 25, halign: "right" },
        6: { cellWidth: 35 },
      },
      margin: { left: margin, right: margin },
      didParseCell: (data) => {
        // Highlight total row
        if (data.row.index === transactionData.length - 1) {
          data.cell.styles.fillColor = [241, 196, 15];
          data.cell.styles.fontStyle = "bold";
        }
        // Color coding for debit/credit
        if (
          data.column.index === 4 &&
          data.cell.text[0] !== "-" &&
          data.cell.text[0] !== ""
        ) {
          data.cell.styles.textColor = [231, 76, 60]; // Red for debit
        }
        if (
          data.column.index === 5 &&
          data.cell.text[0] !== "-" &&
          data.cell.text[0] !== ""
        ) {
          data.cell.styles.textColor = [39, 174, 96]; // Green for credit
        }
      },
    });

    // Footer
    const finalY = doc.lastAutoTable.finalY + 20;
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text("This is a computer-generated statement.", pageWidth / 2, finalY, {
      align: "center",
    });
    doc.text(
      `Page 1 of 1`,
      pageWidth - margin,
      doc.internal.pageSize.height - 10,
      { align: "right" }
    );

    // Save the PDF
    doc.save(
      `statement_${clientInfo.name.replace(/\s+/g, "_")}_${
        new Date().toISOString().split("T")[0]
      }.pdf`
    );
  };

  // Calculate statement statistics
  const advanceEntries = statement.entries.filter(
    (entry) => entry.type === "advance"
  );
  const expenseEntries = statement.entries.filter(
    (entry) => entry.type === "expense"
  );
  const totalAdvances = advanceEntries.reduce(
    (sum, entry) => sum + entry.credit,
    0
  );
  const totalExpenses = expenseEntries.reduce(
    (sum, entry) => sum + entry.debit,
    0
  );

  return (
    <div className="space-y-6">
      {/* Enhanced Summary Cards */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">Total Trips</p>
                <p className="text-xl font-bold">{totalTrips}</p>
                <p className="text-xs text-gray-400">
                  {tripBalances.length} with transactions
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <IndianRupee className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-500">Total Advances</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(totalAdvances)}
                </p>
                <p className="text-xs text-gray-400">
                  {advanceEntries.length} transactions
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <IndianRupee className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-500">Total Expenses</p>
                <p className="text-xl font-bold text-red-600">
                  {formatCurrency(totalExpenses)}
                </p>
                <p className="text-xs text-gray-400">
                  {expenseEntries.length} transactions
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <IndianRupee className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-500">Net Balance</p>
                <p
                  className={`text-xl font-bold ${
                    statement.closingBalance >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {formatCurrency(statement.closingBalance)}
                </p>
                <p className="text-xs text-gray-400">Closing balance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div> */}

      {/* Client Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Client Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-2">
            <Button size="sm" onClick={() => setEditOpen(true)}>
              Edit
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <User className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{clientInfo.name}</p>
              </div>
            </div>

            {clientInfo.phone && (
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{clientInfo.phone}</p>
                </div>
              </div>
            )}

            {/* Address tab sirf jab data ho */}
            {clientInfo.address &&
              Object.keys(clientInfo.address).length > 0 && (
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium">
                      {clientInfo.address.street &&
                        `${clientInfo.address.street}, `}
                      {clientInfo.address.city &&
                        `${clientInfo.address.city}, `}
                      {clientInfo.address.state &&
                        `${clientInfo.address.state}, `}
                      {clientInfo.address.pincode && clientInfo.address.pincode}
                    </p>
                  </div>
                </div>
              )}
          </div>

          <div className="mt-4">
            <Badge variant={clientInfo.active ? "default" : "secondary"}>
              {clientInfo.active ? "Active Client" : "Inactive Client"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Statement Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Transaction Statement
              </CardTitle>
              <CardDescription>
                Complete transaction history • {statement.entries.length}{" "}
                entries • Generated on {new Date().toLocaleDateString("en-IN")}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={downloadStatement}>
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button onClick={downloadPDF}>
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trip Number</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statement.entries.map((entry, index) => (
                  <TableRow
                    key={index}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <TableCell className="font-medium">
                      <Badge variant="outline">{entry.tripNumber}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="font-medium">
                            {formatDate(entry.date)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(entry.date).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize font-medium">
                        {entry.reason}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          entry.type === "advance" ? "default" : "secondary"
                        }
                        className={
                          entry.type === "advance"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {entry.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.debit > 0 ? (
                        <span className="text-red-600 font-semibold">
                          -{formatCurrency(entry.debit)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.credit > 0 ? (
                        <span className="text-green-600 font-semibold">
                          +{formatCurrency(entry.credit)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div>
                        {entry.notes || entry.description || "-"}
                        {entry.paidTo && (
                          <div className="text-xs text-gray-500 mt-1">
                            Paid to:{" "}
                            <span className="font-medium">{entry.paidTo}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {/* Summary Row */}
                <TableRow className="bg-gray-50 dark:bg-gray-800 font-semibold border-t-2">
                  <TableCell colSpan={4} className="text-right">
                    <span className="text-lg">TOTAL</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-red-600 text-lg">
                      {formatCurrency(statement.totalDebit)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-green-600 text-lg">
                      {formatCurrency(statement.totalCredit)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-semibold">
                        Net:{" "}
                        <span
                          className={
                            statement.closingBalance >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {formatCurrency(statement.closingBalance)}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {statement.entries.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No transactions found</p>
              <p className="text-sm text-gray-400">
                All transactions will appear here
              </p>
            </div>
          )}
        </CardContent>
      </Card>
        <UpdateClientDialog
              open={editOpen}
              onOpenChange={setEditOpen}
              clientData={clientInfo}
                   onSuccess={handleClientUpdate}

            />
    </div>
  );
}
