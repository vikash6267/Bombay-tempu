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

export const generateCollectionMemoPDF = (memoData, clientData, tripData) => {
  const doc = new jsPDF()

  // Company Header
  doc.setFontSize(20)
  doc.setFont("helvetica", "bold")
  doc.text(companyDetails.name, 105, 20, { align: "center" })

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(companyDetails.address, 105, 30, { align: "center" })
  doc.text(
    `Phone: ${companyDetails.phone} | Email: ${companyDetails.email}`,
    105,
    37,
    { align: "center" }
  )
  doc.text(`State: ${companyDetails.state}`, 105, 44, { align: "center" })

  // Title
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text("COLLECTION MEMO", 105, 60, { align: "center" })

  // Memo Details Box
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.5)
  doc.rect(15, 70, 180, 80)

  // Left Column
  doc.setFontSize(11)
  doc.setFont("helvetica", "normal")

  let yPos = 80
  doc.text(`Collection No: ${memoData.collectionNumber}`, 20, yPos)
  yPos += 8
  doc.text(`Date: ${formatDate(new Date(), "dd/MM/yyyy")}`, 20, yPos)
  yPos += 8
  doc.text(`Lorry No: ${memoData.lorryNumber}`, 20, yPos)
  yPos += 8
  doc.text(`From: ${memoData.from}`, 20, yPos)
  yPos += 8
  doc.text(`To: ${memoData.to}`, 20, yPos)
  yPos += 8
  doc.text(`Weight: ${memoData.weight}`, 20, yPos)
  yPos += 8
  doc.text(`Guarantee: ${memoData.guarantee || "As per LR"}`, 20, yPos)

  // Right Column
  yPos = 80
  doc.text(`Client: ${clientData.client.name}`, 110, yPos)
  yPos += 8
  doc.text(`Trip No: ${tripData.tripNumber}`, 110, yPos)
  yPos += 8
  doc.text(`Payable At: ${memoData.payableAt}`, 110, yPos)
  yPos += 8
  doc.text(`Per Day Detention: ${memoData.perDayDetention}`, 110, yPos)
  yPos += 8
  if (memoData.extraHeightLength) {
    doc.text(`Extra H&L: ${memoData.extraHeightLength}`, 110, yPos)
    yPos += 8
  }

  // Financial Details Table
  const financialData = [
    ["Freight", formatCurrency(memoData.freight)],
    ["Advance", formatCurrency(memoData.advance)],
    ["Balance", formatCurrency(memoData.balance)]
  ]

  autoTable(doc, {
    startY: 160,
    head: [["Description", "Amount"]],
    body: financialData,
    theme: "grid",
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    styles: { fontSize: 11, cellPadding: 5 },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 90, halign: "right" }
    }
  })

  // Remarks
  if (memoData.remarks) {
    doc.setFontSize(10)
    doc.text(`Remarks: ${memoData.remarks}`, 20, doc.lastAutoTable.finalY + 15)
  }

  // Footer
  doc.setFontSize(9)
  doc.text("This is a computer generated document.", 105, 280, {
    align: "center"
  })
  doc.text(
    `Generated on: ${formatDate(new Date(), "dd/MM/yyyy HH:mm")}`,
    105,
    287,
    { align: "center" }
  )

  return doc
}

export const generateBalanceMemoPDF = (memoData, clientData, tripData) => {
  const doc = new jsPDF()

  // Company Header
  doc.setFontSize(20)
  doc.setFont("helvetica", "bold")
  doc.text(companyDetails.name, 105, 20, { align: "center" })

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(companyDetails.address, 105, 30, { align: "center" })
  doc.text(
    `Phone: ${companyDetails.phone} | Email: ${companyDetails.email}`,
    105,
    37,
    { align: "center" }
  )
  doc.text(`State: ${companyDetails.state}`, 105, 44, { align: "center" })

  // Title
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text("BALANCE MEMO", 105, 60, { align: "center" })

  // Memo Details
  doc.setFontSize(11)
  doc.setFont("helvetica", "normal")

  let yPos = 80
  doc.text(`Bill No: ${memoData.billNumber}`, 20, yPos)
  doc.text(`Date: ${formatDate(new Date(), "dd/MM/yyyy")}`, 150, yPos)
  yPos += 10
  doc.text(`Client: ${clientData.client.name}`, 20, yPos)
  doc.text(`Trip No: ${tripData.tripNumber}`, 150, yPos)
  yPos += 10
  doc.text(`Vehicle: ${tripData.vehicle.registrationNumber}`, 20, yPos)
  doc.text(
    `Route: ${clientData.origin.city} to ${clientData.destination.city}`,
    150,
    yPos
  )

  // Balance Details Table
  const balanceData = [
    ["Total Amount", formatCurrency(memoData.totalAmount)],
    ["Advance Given", `(${formatCurrency(memoData.advanceGiven)})`],
    ["Expenses Added", formatCurrency(memoData.expensesAdded)],
    ["Balance Amount", formatCurrency(memoData.balanceAmount)]
  ]

  autoTable(doc, {
    startY: 110,
    head: [["Particulars", "Amount"]],
    body: balanceData,
    theme: "grid",
    headStyles: { fillColor: [46, 125, 50], textColor: 255 },
    styles: { fontSize: 12, cellPadding: 8 },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 80, halign: "right" }
    },
    didParseCell: data => {
      if (
        data.row.index === balanceData.length - 1 &&
        data.column.index === 1
      ) {
        data.cell.styles.fontStyle = "bold"
        data.cell.styles.fillColor = [255, 235, 59]
        data.cell.styles.textColor = [0, 0, 0]
      }
    }
  })

  // Payment History
  if (clientData.advances && clientData.advances.length > 0) {
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("Payment History:", 20, doc.lastAutoTable.finalY + 20)

    const paymentData = clientData.advances.map((payment, index) => [
      `Payment ${index + 1}`,
      formatDate(payment.paidAt, "dd/MM/yyyy"),
      formatCurrency(payment.amount)
    ])

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 30,
      head: [["Payment", "Date", "Amount"]],
      body: paymentData,
      theme: "striped",
      headStyles: { fillColor: [33, 150, 243], textColor: 255 },
      styles: { fontSize: 10, cellPadding: 5 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 60 },
        2: { cellWidth: 60, halign: "right" }
      }
    })
  }

  // Remarks
  if (memoData.remarks) {
    doc.setFontSize(10)
    doc.text(`Remarks: ${memoData.remarks}`, 20, doc.lastAutoTable.finalY + 15)
  }

  // Footer
  doc.setFontSize(9)
  doc.text("This is a computer generated balance memo.", 105, 280, {
    align: "center"
  })
  doc.text(
    `Generated on: ${formatDate(new Date(), "dd/MM/yyyy HH:mm")}`,
    105,
    287,
    { align: "center" }
  )

  return doc
}

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
