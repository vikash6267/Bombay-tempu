"use client"

import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { formatCurrency, formatDate } from "@/lib/utils"

const companyDetails = {
  name: "Bombay Uttranchal Tempo Service",
  address:
    "Building No. C13, Gala No.01, Parasnath Complex, Dapoda, Bhiwandi, Dist. Thane 421302. (MH).",
  phone: "6375916182",
  email: "butsbwd@gmail.com",
  state: "Maharashtra"
}

export function generateCollectionMemoPDF(data) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const pageW = doc.internal.pageSize.getWidth();
  const margin = 10;
  const innerW = pageW - margin * 2;
  const centerX = pageW / 2;
  const rightX = pageW - margin;
  let y = margin + 5; // Start with some top padding
  const startY = y;

  const drawLine = () => {
    doc.line(margin, y, rightX, y);
  };

  // --- Header Section ---
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Gopiram", margin, y);
  doc.text("श्री गणेशाय नमः", centerX, y, { align: "center" });
  doc.text("Mob: 9022223698", rightX, y, { align: "right" });
  y += 6;
  doc.text("Mohit", margin, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("BUTS", centerX, y, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("6375916182", rightX, y, { align: "right" });
  y += 5;
  drawLine();

  // --- Company Title & Subtitle ---
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Bombay Uttranchal Tempo Service", centerX, y, { align: "center" });
  y += 7;
  doc.setFontSize(11);
  doc.text("Transport Contractor & Commission Agent", centerX, y, {
    align: "center",
  });
  y += 5;
  drawLine();

  // --- Services ---
  y += 5;
  doc.setFontSize(10);
  doc.text(
    "Daily Service: Delhi, Haryana, Rajasthan, Punjab, UP, UK & All Over India",
    margin,
    y
  );
  y += 5;
  doc.text(
    "Services: 1109, 1110, 407, 20ft, 22ft Open & Container etc.",
    centerX,
    y,
    { align: "center" }
  );
  y += 5;
  drawLine();

  // --- Address ---
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(
    "Add: Building No. C13, Gala No.01, Parasnath Complex,",
    centerX,
    y,
    { align: "center" }
  );
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.text("Dapoda, Bhiwandi, Dist. Thane 421302.", centerX, y, {
    align: "center",
  });
  y += 5;
  drawLine();

  // --- Collection Memo Header ---
  y += 5;
  doc.setFontSize(10);
  doc.text(`Collection No: ${data.collectionNumber || "01"}`, margin, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("COLLECTION MEMO", centerX, y, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Date: ${data.date || new Date().toLocaleDateString("en-GB")}`, rightX, y, { align: "right" });
  y += 5;
  drawLine();

  // --- Main Content ---
  y += 5;
  doc.text(`M/s. ${data.msName || ""}`, margin, y);
  y += 7;
  doc.text("Dear Sir,", margin, y);
  y += 7;
  doc.text("As Per Your Instruction We Are Sending Herewith Our", margin + 10, y);
  y += 7;
  doc.text(
    `Lorry No: ${data.lorryNumber || "________________"} For The Collection Of Your Goods To Be Despatched`,
    margin,
    y
  );
  y += 7;
  doc.text(`From: ${data.from || "________________"} To: ${data.to || "________________"}`, margin, y);
  y += 7;
  drawLine();

  // --- Details Table ---
  const col2X = centerX - 10;
  y += 6;
  doc.text(`Rate: ${data.rate || "________________"}` , margin, y);
  doc.text(`Freight: ${fmtMoneyOrBlank(data.freight)}`, col2X, y);
  y += 7;
  doc.text(`Weight: ${data.weight || "________________"}`, margin, y);
  doc.text(`Advance: ${fmtMoneyOrBlank(data.advance)}`, col2X, y);
  y += 7;
  doc.text(`Guarantee: ${data.guarantee || "________________"}` , margin, y);
  doc.text(`Balance: ${fmtMoneyOrBlank(data.balance)}`, col2X, y);
  y += 6;
  drawLine();

  // --- Footer ---
  y += 6;
  doc.text("PAN CARD No. BDJPK0529D", margin, y);
  doc.setFont("helvetica", "bold");
  doc.text("Your's Faithfully", rightX, y, { align: "right" });
  doc.setFont("helvetica", "normal");
  y += 6;
  drawLine();

  // --- Terms ---
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.text("TERMS:", margin, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("* We are not responsible for leakage, Breakage & consequent damages in Transit.", margin, y);
  y += 5;
  doc.text("* Goods carried at Owner's Risk.", margin, y);
  y += 5;
  doc.text("* Pleased check lorry engine, chases and all necessary documents.", margin, y);
  y += 5;
  drawLine();

  // --- Bank Details & Signature ---
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("HDFC - A/c. 50200006579916", margin, y);
  y += 5;
  doc.text("IFSC HDFC-0009218- Mankoli Branch", margin, y);
  y += 10;
  doc.setFont("helvetica", "normal");
  doc.text("For Bombay Uttranchal Tempo Service", rightX, y, { align: "right" });
  y += 5;
  const endY = y;
  drawLine();

  // --- Vertical Borders ---
  doc.line(margin, startY, margin, endY); // Left border
  doc.line(rightX, startY, rightX, endY); // Right border

  return doc;
}


function fmtMoneyOrBlank(n) {
  if (typeof n !== "number" || isNaN(n)) return "________"
  return ` ${n.toLocaleString("en-IN")}`
}

export const generateBalanceMemoPDF = (data) => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let y = 20;

  // Draw outer border (thick)
  doc.setLineWidth(0.8);
  doc.rect(margin, margin, pageWidth - 2 * margin, pageHeight - 2 * margin);

  // --- TITLE (Gray background) ---
  y = 25;
  doc.setFillColor(220, 220, 220);
  doc.rect(margin, y - 4, pageWidth - 2 * margin, 8, 'F');
  doc.setLineWidth(0.3);
  doc.rect(margin, y - 4, pageWidth - 2 * margin, 8);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Balance Memo", pageWidth / 2, y, { align: "center" });

  // --- COMPANY HEADER (Gray background) ---
  y += 8;
  doc.setFillColor(220, 220, 220);
  doc.rect(margin, y - 2, pageWidth - 2 * margin, 24, 'F');
  doc.rect(margin, y - 2, pageWidth - 2 * margin, 24);
  
  y += 4;
  doc.setFontSize(14);
  doc.text("BOMBAY UTTRANCHAL TEMPO SERVICE", pageWidth / 2, y, { align: "center" });

  y += 5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Address : Building No. C13, Gala No.01, Parasnath Complex, Dapoda, Bhiwandi, Dist. Thane 421302. (MH).", pageWidth / 2, y, { align: "center", maxWidth: pageWidth - 30 });

  y += 5;
  doc.setFont("helvetica", "bold");
  doc.text("PAN OF SUPPLIER:- BDJPK0529D", pageWidth / 2, y, { align: "center" });

  y += 4;
  doc.text("MOB. OF SUPPLIER:- 9022223698", pageWidth / 2, y, { align: "center" });

  // --- CUSTOMER NAME AND INVOICE NO ROW ---
  y += 6;
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  
  y += 6;
  doc.setFontSize(10);
  doc.text(`CUSTOMERNAME:-${data.customerName || ""}`, margin + 2, y);
  doc.text(`INVOICE NO :-${data.invoiceNumber || ""}`, pageWidth - margin - 55, y);

  y += 2;
  doc.line(margin, y, pageWidth - margin, y);

  // --- TABLE SECTION ---
  y += 7;
  const col1X = margin + 2;
  const col2X = margin + 50;
  const col3X = pageWidth / 2 + 10;
  const col4X = pageWidth - margin - 35;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  
  // Row 1: Vehicle No | From
  doc.text("Vehicle No", col1X, y);
  doc.text(data.vehicleNumber || "", col2X, y);
  doc.text("From", col3X, y);
  doc.text(data.from || "", col4X, y);

  y += 7;
  // Row 2: Fright | TO
  doc.text("Fright", col1X, y);
  doc.text(String(data.freight || 0), col2X, y);
  doc.text("TO", col3X, y);
  doc.text(data.to || "", col4X, y);

  y += 7;
  // Row 3: Advance
  doc.text("Advance", col1X, y);
  doc.text(String(data.advance || 0), col2X, y);

  y += 7;
  // Row 4: Detention | Unloading Charge
  doc.text("Detention", col1X, y);
  doc.text(String(data.detention || 0), col2X, y);
  doc.setFont("helvetica", "normal");
  doc.text("Unloading Charge", col2X + 25, y);

  y += 7;
  // Row 5: Total Paybal Amt.
  doc.setFont("helvetica", "bold");
  doc.text("Total Paybal Amt.", col1X, y);
  doc.text(String(data.totalPayableAmount || 0), col2X, y);

  // --- REMARK (Centered) ---
  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  if (data.remark) {
    doc.text(`Remark - ${data.remark}`, pageWidth / 2, y, { align: "center" });
  } else {
    doc.text("Remark - Dication Charge ₹1000 / Per Day", pageWidth / 2, y, { align: "center" });
  }

  // Horizontal line before bank details
  y += 4;
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);

  // --- BANK DETAILS ---
  y += 7;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("BANK NAME :", col1X, y);
  doc.setFont("helvetica", "normal");
  doc.text("HDFC Bank", col2X, y);
  doc.setFont("helvetica", "bold");
  doc.text("FOR :- Bombay Uttranchal Tempo Service", col3X + 10, y);

  y += 7;
  doc.text("A/C No :-", col1X, y);
  doc.setFont("helvetica", "normal");
  doc.text("50200006579916", col2X, y);
  doc.setFont("helvetica", "bold");
  doc.text("Authorized Sign.", col3X + 10, y);

  y += 7;
  doc.text("IFSC Code :-", col1X, y);
  doc.setFont("helvetica", "normal");
  doc.text("HDFC000928 Mankoli Branch", col2X, y);

  return doc;
};


export const generateClientStatementPDF = (clientData, tripData) => {
  const doc = new jsPDF()

  // Company Header with Logo placeholder
  doc.setFontSize(22)
  doc.setFont("helvetica", "bold")
  doc.text(companyDetails.name, 105, 25, { align: "center" })

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(companyDetails.address, 105, 35, { align: "center" })
  doc.text(
    `Phone: ${companyDetails.phone} | Email: ${companyDetails.email}`,
    105,
    42,
    { align: "center" }
  )
  doc.text(`State: ${companyDetails.state}`, 105, 49, { align: "center" })

  // Title
  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.text("CLIENT STATEMENT", 105, 65, { align: "center" })

  // Client and Trip Info
  doc.setFontSize(11)
  doc.setFont("helvetica", "normal")

  let yPos = 85
  doc.text(`Client Name: ${clientData.client.name}`, 20, yPos)
  doc.text(`Statement Date: ${formatDate(new Date(), "dd/MM/yyyy")}`, 150, yPos)
  yPos += 8
  doc.text(`Email: ${clientData.client.email}`, 20, yPos)
  doc.text(`Trip No: ${tripData.tripNumber}`, 150, yPos)
  yPos += 8
  doc.text(
    `Route: ${clientData.origin.city} to ${clientData.destination.city}`,
    20,
    yPos
  )
  doc.text(`Vehicle: ${tripData.vehicle.registrationNumber}`, 150, yPos)

  // Load Details
  yPos += 15
  doc.setFont("helvetica", "bold")
  doc.text("Load Details:", 20, yPos)
  doc.setFont("helvetica", "normal")
  yPos += 8
  doc.text(`Description: ${clientData.loadDetails.description}`, 20, yPos)
  yPos += 6
  doc.text(`Weight: ${clientData.loadDetails.weight} tons`, 20, yPos)
  doc.text(`Quantity: ${clientData.loadDetails.quantity} units`, 100, yPos)
  doc.text(`Type: ${clientData.loadDetails.loadType}`, 150, yPos)

  // Financial Summary
  const totalRate = clientData.totalRate || 0
  const paidAmount = clientData.paidAmount || 0
  const totalExpense = clientData.totalExpense || 0
  const balanceDue = totalRate - paidAmount + totalExpense

  const summaryData = [
    ["Total Rate", formatCurrency(totalRate)],
    ["Advance Paid", `(${formatCurrency(paidAmount)})`],
    ["Additional Expenses", formatCurrency(totalExpense)],
    ["Balance Due", formatCurrency(balanceDue)]
  ]

  autoTable(doc, {
    startY: yPos + 20,
    head: [["Description", "Amount"]],
    body: summaryData,
    theme: "grid",
    headStyles: { fillColor: [76, 175, 80], textColor: 255 },
    styles: { fontSize: 12, cellPadding: 8 },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 60, halign: "right" }
    },
    didParseCell: data => {
      if (data.row.index === summaryData.length - 1) {
        data.cell.styles.fontStyle = "bold"
        if (data.column.index === 1) {
          data.cell.styles.fillColor =
            balanceDue >= 0 ? [255, 193, 7] : [76, 175, 80]
        }
      }
    }
  })

  // Transaction History
  let currentY = doc.lastAutoTable.finalY + 20

  if (clientData.advances && clientData.advances.length > 0) {
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("Payment History:", 20, currentY)

    const paymentData = clientData.advances.map((payment, index) => [
      formatDate(payment.paidAt, "dd/MM/yyyy"),
      `Payment ${index + 1}`,
      formatCurrency(payment.amount),
      "Credit"
    ])

    autoTable(doc, {
      startY: currentY + 10,
      head: [["Date", "Description", "Amount", "Type"]],
      body: paymentData,
      theme: "striped",
      headStyles: { fillColor: [33, 150, 243], textColor: 255 },
      styles: { fontSize: 10, cellPadding: 5 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 80 },
        2: { cellWidth: 40, halign: "right" },
        3: { cellWidth: 30, halign: "center" }
      }
    })

    currentY = doc.lastAutoTable.finalY + 10
  }

  if (clientData.expenses && clientData.expenses.length > 0) {
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("Expense History:", 20, currentY)

    const expenseData = clientData.expenses.map((expense, index) => [
      formatDate(expense.paidAt, "dd/MM/yyyy"),
      `Expense ${index + 1}`,
      formatCurrency(expense.amount),
      "Debit"
    ])

    autoTable(doc, {
      startY: currentY + 10,
      head: [["Date", "Description", "Amount", "Type"]],
      body: expenseData,
      theme: "striped",
      headStyles: { fillColor: [244, 67, 54], textColor: 255 },
      styles: { fontSize: 10, cellPadding: 5 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 80 },
        2: { cellWidth: 40, halign: "right" },
        3: { cellWidth: 30, halign: "center" }
      }
    })
  }

  // Footer
  doc.setFontSize(9)
  doc.text("Thank you for your business!", 105, 280, { align: "center" })
  doc.text(
    `Generated on: ${formatDate(new Date(), "dd/MM/yyyy HH:mm")}`,
    105,
    287,
    { align: "center" }
  )

  return doc
}
