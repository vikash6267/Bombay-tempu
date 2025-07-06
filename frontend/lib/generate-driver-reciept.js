import { jsPDF } from "jspdf"

export async function generateDriverReceiptPdf(
  trip,
  kmData = { oldKM: 0, newKM: 0, rate: 19.5, pichla: 0 },
  companyDetails = {
    name: "Bombay Uttranchal Tempo Service",
    address:
      "Building No. C13, Gala No.01, Parasnath Complex, Dapoda, Bhiwandi, Dist. Thane 421302. (MH).",
    phone: "6375916182",
    email: "butsbwd@gmail.com",
    state: "Maharashtra"
  }
) {
  const doc = new jsPDF({
    orientation: "p",
    unit: "mm",
    format: "a4"
  })

  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  let y = 20

  // Main border around entire document
  doc.setLineWidth(1)
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20)

  // Calculate totals
  const totalAdvance =
    trip.selfAdvances?.reduce((sum, a) => sum + a.amount, 0) || 0
  const totalExpenses =
    trip.selfExpenses?.reduce((sum, e) => sum + e.amount, 0) || 0
  const totalKM = kmData.newKM - kmData.oldKM
  const kmValue = totalKM * kmData.rate
  const totalEarnings = kmValue + totalExpenses + kmData.pichla
  const finalAmount = totalEarnings - totalAdvance

  // Company Header
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text(companyDetails.name, pageWidth / 2, y, { align: "center" })
  y += 8

  // Company Details
  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.text(`Address : ${companyDetails.address}`, 15, y)
  y += 5
  doc.text(`Phone No.: ${companyDetails.phone}`, 15, y)
  y += 5
  doc.text(`Email ID: ${companyDetails.email}`, 15, y)
  y += 5
  doc.text(`State: ${companyDetails.state}`, 15, y)

  // BUTS Logo - Create oval background
  doc.setFillColor(100, 149, 237) // Blue color
  doc.ellipse(pageWidth - 25, y - 10, 15, 8, "F")
  doc.setTextColor(255, 255, 255) // White text
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text("BUTS", pageWidth - 25, y - 7, { align: "center" })
  doc.setTextColor(0, 0, 0) // Reset to black

  y += 15

  // Vehicle and Driver Info Box
  doc.setLineWidth(0.5)
  doc.rect(15, y, pageWidth - 30, 15)

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(`Vehicle No :-`, 20, y + 5)
  doc.text(`${trip?.vehicle?.registrationNumber || "HR57A0956"}`, 55, y + 5)
  doc.text(`Driver Name :-`, 120, y + 5)
  doc.text(`${trip?.driver?.name || "Ajay"}`, 155, y + 5)
  doc.text(`Date :-`, 20, y + 10)
  doc.text(`${new Date().toLocaleDateString("en-GB")}`, 35, y + 10)
  doc.text(`Dr.Contact No`, 120, y + 10)

  y += 20

  // Table Headers
  const tableStartY = y
  const leftTableX = 15
  const rightTableX = pageWidth / 2 + 2
  const tableWidth = (pageWidth - 34) / 2
  const rowHeight = 6

  // Left Table Header (Advances)
  doc.setLineWidth(0.3)
  doc.rect(leftTableX, y, tableWidth, rowHeight)
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")

  // Header cells with vertical lines
  doc.line(leftTableX + 15, y, leftTableX + 15, y + rowHeight) // Sr No
  doc.line(leftTableX + 35, y, leftTableX + 35, y + rowHeight) // Date
  doc.line(leftTableX + 55, y, leftTableX + 55, y + rowHeight) // Amount

  doc.text("Sr No", leftTableX + 7, y + 4, { align: "center" })
  doc.text("Date", leftTableX + 25, y + 4, { align: "center" })
  doc.text("Amount", leftTableX + 45, y + 4, { align: "center" })
  doc.text("Method", leftTableX + 65, y + 4, { align: "center" })

  // Right Table Header (Expenses)
  doc.rect(rightTableX, y, tableWidth, rowHeight)
  doc.line(rightTableX + 15, y, rightTableX + 15, y + rowHeight) // Sr No
  doc.line(rightTableX + 35, y, rightTableX + 35, y + rowHeight) // Amount

  doc.text("Sr No", rightTableX + 7, y + 4, { align: "center" })
  doc.text("Amount", rightTableX + 25, y + 4, { align: "center" })
  doc.text("Remark", rightTableX + 55, y + 4, { align: "center" })

  y += rowHeight

  // Table Data
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)

  // Left side data (Advances)
  for (let i = 0; i < 10; i++) {
    doc.rect(leftTableX, y, tableWidth, rowHeight)
    doc.line(leftTableX + 15, y, leftTableX + 15, y + rowHeight)
    doc.line(leftTableX + 35, y, leftTableX + 35, y + rowHeight)
    doc.line(leftTableX + 55, y, leftTableX + 55, y + rowHeight)

    if (i < trip.selfAdvances?.length) {
      const advance = trip.selfAdvances[i]
      doc.text((i + 1).toString(), leftTableX + 7, y + 4, { align: "center" })
      doc.text(
        advance.paidAt?.slice(8, 10) +
          "/" +
          advance.paidAt?.slice(5, 7) +
          "/" +
          advance.paidAt?.slice(0, 4) || "",
        leftTableX + 25,
        y + 4,
        { align: "center" }
      )
      doc.text(advance.amount.toString(), leftTableX + 50, y + 4, {
        align: "right"
      })
      doc.text("A/c", leftTableX + 65, y + 4, { align: "center" })
    } else {
      doc.text((i + 1).toString(), leftTableX + 7, y + 4, { align: "center" })
    }
    y += rowHeight
  }

  // Reset y for right table
  y = tableStartY + rowHeight

  // Right side data (Expenses)
  for (let i = 0; i < 10; i++) {
    doc.rect(rightTableX, y, tableWidth, rowHeight)
    doc.line(rightTableX + 15, y, rightTableX + 15, y + rowHeight)
    doc.line(rightTableX + 35, y, rightTableX + 35, y + rowHeight)

    if (i < trip.selfExpenses?.length) {
      const expense = trip.selfExpenses[i]
      doc.text((i + 1).toString(), rightTableX + 7, y + 4, { align: "center" })
      doc.text(expense.amount.toString(), rightTableX + 30, y + 4, {
        align: "right"
      })
      doc.text(
        expense.category || expense.reason || "",
        rightTableX + 40,
        y + 4
      )
    } else {
      doc.text((i + 1).toString(), rightTableX + 7, y + 4, { align: "center" })
    }
    y += rowHeight
  }

  y = tableStartY + rowHeight + 10 * rowHeight

  // Total rows
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.rect(leftTableX, y, tableWidth, 8)
  doc.rect(rightTableX, y, tableWidth, 8)
  doc.text("Total", leftTableX + 5, y + 5)
  doc.text(totalAdvance.toString(), leftTableX + tableWidth - 5, y + 5, {
    align: "right"
  })
  doc.text("Total", rightTableX + 5, y + 5)
  doc.text(totalExpenses.toString(), rightTableX + tableWidth - 5, y + 5, {
    align: "right"
  })

  y += 15

  // KM Calculation Section
  doc.setLineWidth(0.5)
  doc.rect(15, y, pageWidth - 30, 50)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)

  // Left column
  doc.text(`New KM :-`, 20, y + 8)
  doc.text(kmData.newKM.toString(), 80, y + 8, { align: "right" })

  doc.text(`Old KM`, 20, y + 15)
  doc.text(kmData.oldKM.toString(), 80, y + 15, { align: "right" })

  doc.text(`Total KM`, 20, y + 22)
  doc.text(totalKM.toString(), 80, y + 22, { align: "right" })

  doc.text(`KM ${kmData.rate}`, 20, y + 29)
  doc.text(kmValue.toFixed(0), 80, y + 29, { align: "right" })

  doc.text(`Kharcha`, 20, y + 36)
  doc.text(totalExpenses.toString(), 80, y + 36, { align: "right" })

  // Right column
  doc.text(`Pichla`, 120, y + 8)
  doc.text(kmData.pichla.toString(), 180, y + 8, { align: "right" })

  doc.text(`Total`, 120, y + 15)
  doc.text(totalEarnings.toFixed(0), 180, y + 15, { align: "right" })

  doc.text(`Advance`, 120, y + 22)
  doc.text(totalAdvance.toString(), 180, y + 22, { align: "right" })

  // Final Trip amount with thick border
  doc.setLineWidth(1)
  doc.rect(115, y + 30, 70, 15)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.text(`Trip`, 120, y + 40)
  doc.text(finalAmount.toFixed(0), 180, y + 40, { align: "right" })

  return doc
}

export function downloadPDF(doc, filename = "driver-receipt.pdf") {
  doc.save(filename)
}
