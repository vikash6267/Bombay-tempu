import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Import your existing utility functions
// Make sure these paths are correct for your project
import { formatDate } from "./utils";

export async function generateFleetReceiptPdf(
  trip,
  companyName = "Bombay Uttranchal Tempo Service"
) {
  const doc = new jsPDF({
    orientation: "p", // portrait
    unit: "mm", // millimeters
    format: "a4", // A4 page size
  });

  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  let y = 15; // Initial Y position, leaving some top margin

  // --- Calculations ---
  const totalClientAmount =
    trip.rate || trip.clients?.reduce((sum, client) => sum + (client.totalRate || 0), 0) ||
    0;

  const totalFleetExpenses =
    trip.fleetExpenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;

  const totalFleetAdvances =
    trip.fleetAdvances?.reduce((sum, advance) => sum + advance.amount, 0) || 0;

  const allTransactions = [
    ...(trip.fleetAdvances || []).map((adv) => ({
      date: adv.date,
      reference: adv.reference,
      description: `Advance to ${trip.vehicle?.registrationNumber || "Fleet"}`,
      amount: adv.amount,
    })),
    ...(trip.fleetExpenses || []).map((exp) => ({
      date: exp.date,
      reference: exp.reference,
      description: `Expense for ${exp.reason}${
        exp.notes ? ` (${exp.notes})` : ""
      }`,
      amount: exp.amount,
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const totalPaid =  totalFleetAdvances;
  const commission = trip.commission || 0;
  const totalFreightWithExpenses = totalClientAmount + totalFleetExpenses;
  const podBalance =
    totalFreightWithExpenses - totalPaid - (trip.podBalance || 0) - commission;

  // --- Header ---
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(companyName, pageWidth / 2, y, { align: "center" });
  y += 6;

  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("Fleet Receipt", pageWidth / 2, y, { align: "center" });
  y += 4;

  // Header border
  doc.setLineWidth(0.5);
  doc.rect(15, 10, pageWidth - 30, y - 5);
  y += 8;

  // --- Trip Details Table ---
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Trip Details", 20, y);
  y += 7;

  const tripDetailsData = [
    [
      "Date",
      formatDate(trip.scheduledDate, "dd/MM/yyyy"),
      "Vehicle No",
      trip.vehicle?.registrationNumber || "N/A",
    ],
    [
      "From",
      `${trip.origin?.city || ""}, ${trip.origin?.state || ""}`,
      "Bls Paid Date",
      trip.podDetails?.date
        ? formatDate(trip.podDetails.date, "dd/MM/yyyy")
        : "N/A",
    ],
    [
      "To",
      `${trip.destination?.city || ""}, ${trip.destination?.state || ""}`,
      "Trip No",
      trip.tripNumber || "N/A",
    ],
  ];

  autoTable(doc, {
    startY: y,
    body: tripDetailsData,
    theme: "grid",
    styles: {
      fontSize: 9,
      cellPadding: 2,
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { fontStyle: "bold", fillColor: [240, 240, 240], cellWidth: 25 },
      1: { cellWidth: 45 },
      2: { fontStyle: "bold", fillColor: [240, 240, 240], cellWidth: 25 },
      3: { cellWidth: 45 },
    },
  });

  y = doc.lastAutoTable.finalY + 12;

  // --- Client Details and Summary Table ---
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Client & Freight Details", 20, y);
  y += 7;

  const clientHeaders = [
    "Freight",
    "Amount ",
    "Client Name",
    "Commission / POD Balance",
    "Amount ",
  ];

  const clientBody =
    trip.clients?.map((clientData, index) => [
      "Freight",
      `${Number(clientData.truckHireCost || 0).toFixed(2)}`,
      clientData.client?.name || "N/A",
      index === 0 ? "Commission" : "",
      index === 0 ? `${Number(commission).toFixed(2)}` : "",
    ]) || [];

  // Add POD Balance row if needed
  // Add POD Balance as its own row after all client rows
  clientBody.push([
    "Freight",
    "",
    "",
    "POD Balance",
    `${Number(trip.podBalance || 0).toFixed(2)}`,
  ]);

  // Ensure minimum 3 rows for consistent layout
  while (clientBody.length < 3) {
    clientBody.push(["Freight", "", "", "", ""]);
  }

  autoTable(doc, {
    startY: y,
    head: [clientHeaders],
    body: clientBody,
    theme: "grid",
    styles: {
      fontSize: 9,
      cellPadding: 2,
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: "bold",
    },
    columnStyles: {
      0: { fontStyle: "bold", fillColor: [240, 240, 240], cellWidth: 30 },
      1: { halign: "right", cellWidth: 25 },
      2: { cellWidth: 50 },
      3: { fontStyle: "bold", fillColor: [240, 240, 240], cellWidth: 35 },
      4: { halign: "right", cellWidth: 25 },
    },
  });

  y = doc.lastAutoTable.finalY;

  // Fleet Expenses Row (if exists)
  if (totalFleetExpenses > 0) {
    const fleetExpenseRowData = [
      [
        "Fleet Expenses",
        `${Number(totalFleetExpenses).toFixed(2)}`,
        "",
        "",
        "",
      ],
    ];

    autoTable(doc, {
      startY: y,
      body: fleetExpenseRowData,
      theme: "grid",
      styles: {
        fontSize: 9,
        cellPadding: 2,
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
        fontStyle: "bold",
      },
      columnStyles: {
        0: { fillColor: [240, 240, 240], cellWidth: 30 },
        1: { halign: "right", cellWidth: 25 },
        2: { cellWidth: 50 },
        3: { cellWidth: 35 },
        4: { cellWidth: 25 },
      },
    });

    y = doc.lastAutoTable.finalY;
  }

  // Total Row for Client & Freight Details
  const totalRowData = [
    [
      "Total Freight",
      `${Number(totalFreightWithExpenses).toFixed(2)}`,
      "",
      "Balance",
      `${Number(podBalance).toFixed(2)}`,
    ],
  ];

  autoTable(doc, {
    startY: y,
    body: totalRowData,
    theme: "grid",
    styles: {
      fontSize: 10,
      cellPadding: 2,
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
      fontStyle: "bold",
    },
    columnStyles: {
      0: { fillColor: [240, 240, 240], cellWidth: 30 },
      1: { halign: "right", cellWidth: 25 },
      2: { cellWidth: 50 },
      3: { fillColor: [240, 240, 240], cellWidth: 35 },
      4: { halign: "right", cellWidth: 25, fontSize: 11 },
    },
  });

  y = doc.lastAutoTable.finalY + 12;

  // --- Transaction Details Table ---
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Transaction Details", 20, y);
  y += 7;

  const transactionHeaders = [
    "Sr No",
    "Date",
    "Reference",
    "Description",
    "Amount ",
  ];
  const transactionBody =
    allTransactions.length > 0
      ? allTransactions.map((transaction, index) => [
          (index + 1).toString(),
          formatDate(transaction.date, "dd/MM/yyyy"),
          transaction.reference,
          transaction.description,
          `${Number(transaction.amount).toFixed(2)}`,
        ])
      : [["", "", "", "No transactions recorded", ""]];

  autoTable(doc, {
    startY: y,
    head: [transactionHeaders],
    body: transactionBody,
    theme: "grid",
    styles: {
      fontSize: 9,
      cellPadding: 2,
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      halign: "center",
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 15 },
      1: { halign: "center", cellWidth: 25 },
      2: { cellWidth: 30 },
      3: { cellWidth: 70 },
      4: { halign: "right", cellWidth: 25 },
    },
  });

  y = doc.lastAutoTable.finalY;

  // Total Paid Row
  const totalPaidData = [["Total Paid", `${Number(totalPaid).toFixed(2)}`]];

  autoTable(doc, {
    startY: y,
    body: totalPaidData,
    theme: "grid",
    styles: {
      fontSize: 10,
      cellPadding: 2,
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
      fontStyle: "bold",
    },
    columnStyles: {
      0: { fillColor: [240, 240, 240], halign: "center", cellWidth: 140 },
      1: { halign: "right", cellWidth: 25 },
    },
  });

  y = doc.lastAutoTable.finalY + 15;

  // --- Summary and Signatures ---
  const leftColumnX = 20;
  const rightColumnX = pageWidth / 2 + 10;
  const summaryStartY = y;

  // Summary Box
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Summary", leftColumnX, y);
  y += 7;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const summaryItems = [
    `Base Freight: ${Number(totalClientAmount).toFixed(2)}`,
  ];

  if (totalFleetExpenses > 0) {
    summaryItems.push(`Fleet Expenses: + ${Number(totalFleetExpenses).toFixed(2)}`);
  }

  summaryItems.push(
    `Total Freight: ${Number(totalFreightWithExpenses).toFixed(2)}`,
    `Commission: - ${Number(commission).toFixed(2)}`,
    `Total Paid: - ${Number(totalPaid).toFixed(2)}`,
    `POD Balance: - ${Number(trip.podBalance || 0).toFixed(2)}`
  );

  summaryItems.forEach((item) => {
    doc.text(item, leftColumnX, y);
    y += 4;
  });

  y += 2;
  doc.setLineWidth(0.5);
  doc.line(leftColumnX, y, leftColumnX + 80, y);
  y += 7;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`Net Balance: ${Number(podBalance).toFixed(2)}`, leftColumnX, y);

  const summaryBoxHeight = y - summaryStartY + 8;
  doc.setLineWidth(0.5);
  doc.rect(leftColumnX - 5, summaryStartY - 5, 90, summaryBoxHeight);

  // Signatures Box
  let sigY = summaryStartY;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Signatures", rightColumnX, sigY);
  sigY += 15;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  // Driver signature line
  doc.setLineWidth(0.3);
  doc.line(rightColumnX, sigY, rightColumnX + 70, sigY);
  doc.text("Driver Signature", rightColumnX, sigY + 4);
  sigY += 20;

  // Authorized signature line
  doc.line(rightColumnX, sigY, rightColumnX + 70, sigY);
  doc.text("Authorized Signature", rightColumnX, sigY + 4);
  sigY += 8;

  doc.setLineWidth(0.5);
  doc.rect(rightColumnX - 5, summaryStartY - 5, 80, summaryBoxHeight);

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    const footerText = `Generated on ${formatDate(
      new Date(),
      "dd/MM/yyyy HH:mm"
    )} | This is a computer generated receipt`;
    doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: "center" });
  }

  return doc;
}
