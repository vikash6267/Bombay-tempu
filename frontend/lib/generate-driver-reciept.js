import { jsPDF } from "jspdf"

export async function generateDriverReceiptPdf(
  trips,
  driver,
  kmData = { oldKM: 0, newKM: 0, rate: 19.5, pichla: 0 },
  companyDetails = {
    name: "Bombay Uttranchal Tempo Service",
    address: "Building No.C13, Gala No.01, Parasnath Complex, Dapoda,",
    address2: "Dapoda, Bhiwandi, Dist. Thane 421302 (MH)",
    phone: "6375916182",
    ownerName: "Mohit Choudhary"
  }
) {
  const doc = new jsPDF({
    orientation: "p",
    unit: "mm",
    format: "a4"
  })

  const pageWidth = doc.internal.pageSize.width
  const margin = 15
  const tableWidth = pageWidth - 2 * margin
  const rightX = pageWidth - margin
  const centerX = pageWidth / 2
  let y = 18

  // Calculate totals
  const totalAdvance = trips.reduce(
    (sum, trip) =>
      sum + (trip.selfAdvances?.reduce((advSum, a) => advSum + a.amount, 0) || 0),
    0
  )
  const totalExpenses = trips.reduce(
    (sum, trip) =>
      sum + (trip.selfExpenses?.reduce((expSum, e) => expSum + e.amount, 0) || 0),
    0
  )

  const allAdvances = trips.flatMap(
    trip => trip.selfAdvances?.map(adv => ({ ...adv, tripNumber: trip.tripNumber })) || []
  )
  const allExpenses = trips.flatMap(
    trip => trip.selfExpenses?.map(exp => ({ ...exp, tripNumber: trip.tripNumber })) || []
  )

  const totalFreight = trips.reduce((sum, trip) => {
    const clientRate = trip.clients?.[0]?.rate || trip.rate || 0
    return sum + clientRate
  }, 0)

  const commission = Math.round(totalFreight * 0.06)
  const balancePOD = 0
  const totalPaid = totalAdvance
  const finalAmountToPay = totalFreight - totalExpenses - commission - balancePOD - totalPaid

  // ========== TOP HORIZONTAL LINE ==========
  doc.setLineWidth(1)
  doc.line(margin, y, rightX, y)
  y += 8

  // ========== OWNER NAME (LEFT) & MOB (RIGHT) ==========
  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.text(companyDetails.ownerName, margin, y)
  doc.text("MOB : " + companyDetails.phone, rightX, y, { align: "right" })

  y += 10

  // ========== COMPANY NAME (BIG, CENTER) ==========
  doc.setFontSize(24)
  doc.setFont("helvetica", "bold")
  doc.text(companyDetails.name, centerX, y, { align: "center" })

  y += 8

  // ========== ADDRESS LINE 1 ==========
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text(companyDetails.address, centerX, y, { align: "center" })
  
  y += 5
  
  // ========== ADDRESS LINE 2 ==========
  doc.text(companyDetails.address2, centerX, y, { align: "center" })

  y += 12

  // ========== DRIVER HEADER (BLUE BAR) ==========
  doc.setFillColor(100, 149, 237) // Cornflower blue like image
  doc.rect(margin, y, tableWidth, 7, "F")
  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(0, 100, 0) // Dark green text
  doc.text("Driver", centerX, y + 5, { align: "center" })
  doc.setTextColor(0, 0, 0)

  y += 9

  // ========== DRIVER DETAILS ROW ==========
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text("Driver Name : ", margin, y)
  doc.setFont("helvetica", "normal")
  doc.text(driver?.name || "N/A", margin + 28, y)

  doc.setFont("helvetica", "bold")
  doc.text("Vehicle No : ", rightX - 55, y)
  doc.setFont("helvetica", "normal")
  doc.text(trips[0]?.vehicle?.registrationNumber || "N/A", rightX - 30, y)

  y += 5

  doc.setFont("helvetica", "bold")
  doc.text("Mob No : ", margin, y)
  doc.setFont("helvetica", "normal")
  doc.text(driver?.phone || "N/A", margin + 18, y)

  doc.setFont("helvetica", "bold")
  doc.text("Trip No : ", rightX - 55, y)
  doc.setFont("helvetica", "normal")
  const tripNo = trips[0]?.tripNumber || "N/A"
  doc.text(tripNo, rightX - 35, y)

  y += 8

  // ========== TRIPS TABLE ==========
  const rowH = 6
  
  // Header row (blue)
  doc.setFillColor(100, 149, 237)
  doc.rect(margin, y, tableWidth, rowH, "F")
  doc.setLineWidth(0.3)
  doc.rect(margin, y, tableWidth, rowH)
  
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(0, 0, 0)
  
  // Column positions
  const c1 = margin + 2
  const c2 = margin + 25
  const c3 = margin + 80
  const c4 = margin + 110
  const c5 = margin + 145
  
  doc.text("Date", c1, y + 4)
  doc.text("Client Name", c2, y + 4)
  doc.text("Fight", c3, y + 4)
  doc.text("From", c4, y + 4)
  doc.text("To", c5, y + 4)
  
  y += rowH

  // Data rows
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  
  for (let i = 0; i < 3; i++) {
    doc.rect(margin, y, tableWidth, rowH)
    const trip = trips[i]
    if (trip) {
      const dt = trip.scheduledDate ? new Date(trip.scheduledDate).toLocaleDateString("en-GB", {day:"numeric", month:"numeric", year:"2-digit"}) : ""
      const client = trip.clients?.[0]?.client?.name || ""
      const freight = trip.clients?.[0]?.rate || trip.rate || ""
      const from = trip.origin?.city || trip.origin || ""
      const to = trip.destination?.city || trip.destination || ""
      
      doc.text(dt, c1, y + 4)
      doc.text(String(client).substring(0, 28), c2, y + 4)
      doc.text(String(freight), c3, y + 4)
      doc.text(String(from).substring(0, 15), c4, y + 4)
      doc.text(String(to).substring(0, 15), c5, y + 4)
    }
    y += rowH
  }

  // Total row
  doc.setFont("helvetica", "bold")
  doc.text("Total", c3 - 15, y + 4)
  doc.text(String(totalFreight), c3 + 10, y + 4)
  y += rowH + 2

  // ========== EXPANCES HEADER ==========
  doc.setFillColor(100, 149, 237)
  doc.rect(margin, y, tableWidth, rowH, "F")
  doc.rect(margin, y, tableWidth, rowH)
  doc.setFont("helvetica", "bold")
  doc.text("Expances", centerX, y + 4, { align: "center" })
  y += rowH

  // Expense table header
  doc.setFillColor(100, 149, 237)
  doc.rect(margin, y, tableWidth, rowH, "F")
  doc.rect(margin, y, tableWidth, rowH)
  doc.text("Date", c1, y + 4)
  doc.text("Expance Resions", c2 + 20, y + 4)
  doc.text("Amount", c4, y + 4)
  y += rowH

  // Expense rows
  doc.setFont("helvetica", "normal")
  for (let i = 0; i < 2; i++) {
    doc.rect(margin, y, tableWidth, rowH)
    const exp = allExpenses[i]
    if (exp) {
      const dt = exp.paidAt ? new Date(exp.paidAt).toLocaleDateString("en-GB") : ""
      doc.text(dt, c1, y + 4)
      doc.text(String(exp.category || exp.reason || exp.type || "").substring(0, 25), c2 + 20, y + 4)
      doc.text(String(exp.amount || 0), c4, y + 4)
    }
    y += rowH
  }

  // Expense total
  doc.setFont("helvetica", "bold")
  doc.text("Total", c4 - 20, y + 4)
  doc.text(String(totalExpenses), c4 + 10, y + 4)
  y += rowH + 2

  // ========== TRANSACTION DETAILS HEADER ==========
  doc.setFillColor(100, 149, 237)
  doc.rect(margin, y, tableWidth, rowH, "F")
  doc.rect(margin, y, tableWidth, rowH)
  doc.setFont("helvetica", "bold")
  doc.text("Transaction Details", centerX, y + 4, { align: "center" })
  y += rowH

  // Transaction table header
  doc.setFillColor(100, 149, 237)
  doc.rect(margin, y, tableWidth, rowH, "F")
  doc.rect(margin, y, tableWidth, rowH)
  
  const t1 = margin + 5
  const t2 = margin + 30
  const t3 = margin + 65
  const t4 = margin + 100
  const t5 = margin + 145
  
  doc.text("Sr.No", t1, y + 4)
  doc.text("Date", t2, y + 4)
  doc.text("Method", t3, y + 4)
  doc.text("Reference", t4, y + 4)
  doc.text("Amount", t5, y + 4)
  y += rowH

  // Transaction rows
  doc.setFont("helvetica", "normal")
  for (let i = 0; i < 3; i++) {
    doc.rect(margin, y, tableWidth, rowH)
    const adv = allAdvances[i]
    doc.text(String(i + 1) + ".", t1 + 3, y + 4)
    if (adv) {
      const dt = adv.paidAt ? new Date(adv.paidAt).toLocaleDateString("en-GB", {day:"numeric", month:"numeric", year:"2-digit"}) : ""
      doc.text(dt, t2, y + 4)
      doc.text(adv.paymentMethod || "Cash", t3, y + 4)
      doc.text(String(adv.reason || adv.notes || "").substring(0, 18), t4, y + 4)
      doc.text(String(adv.amount || 0), t5, y + 4)
    }
    y += rowH
  }

  // Transaction total
  doc.setFont("helvetica", "bold")
  doc.text("Total", t5 - 20, y + 4)
  doc.text(String(totalAdvance), t5 + 10, y + 4)
  y += rowH + 12

  // ========== FINAL SUMMARY ==========
  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.text("Final Summary", margin, y)
  y += 7

  doc.setFontSize(10)
  const lx = margin
  const vx = margin + 48

  doc.setFont("helvetica", "normal")
  doc.text("Total Fright / Expance", lx, y)
  doc.text(String(totalFreight), vx, y)
  y += 5

  doc.text("Expance", lx, y)
  doc.text(String(totalExpenses), vx, y)
  y += 5

  doc.text("Commission", lx, y)
  doc.text(String(commission), vx, y)
  y += 5

  doc.text("Blance POD", lx, y)
  doc.text(String(balancePOD), vx, y)
  y += 5

  doc.text("Total Paid", lx, y)
  doc.text(String(totalPaid), vx, y)
  y += 5

  doc.setFont("helvetica", "bold")
  doc.text("Final Amount", lx, y)
  doc.text(String(finalAmountToPay), vx, y)

  // Authorized Signature (right side)
  doc.setFont("helvetica", "italic")
  doc.setFontSize(10)
  doc.text("Authorized Signature", rightX - 40, y - 5)

  return doc
}

export function downloadPDF(doc, filename = "driver-receipt.pdf") {
  doc.save(filename)
}
