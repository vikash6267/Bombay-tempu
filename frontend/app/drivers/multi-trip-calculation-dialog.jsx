"use client"
import { useRef, useState, useEffect } from "react"
import { useReactToPrint } from "react-to-print"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Printer, Save, Calculator, Download, Edit } from "lucide-react"
import { format } from "date-fns"
import { driverCalculationsApi } from "lib/api"
import { generateDriverReceiptPdf } from "lib/generate-driver-reciept"

export function MultiTripCalculationDialog({
  trips,
  driver,
  open,
  onOpenChange,
  onCalculationComplete,
  editMode = false,
  existingCalculation = null,
}) {
  const receiptRef = useRef()
console.log(existingCalculation,"existingCalculation")
  // State for calculations
  const [oldKM, setOldKM] = useState(0)
  const [newKM, setNewKM] = useState(0)
  const [perKMRate, setPerKMRate] = useState(19.5)
  const [pichla, setPichla] = useState(0)
  const [isCalculated, setIsCalculated] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [originalTrips, setOriginalTrips] = useState([])
  const [editModeExpenses, setEditModeExpenses] = useState(0)
  const [editModeAdvances, setEditModeAdvances] = useState(0)
  const [serviceKm, setServiceKm] = useState(0)

  useEffect(() => {
    if (editMode && existingCalculation) {
      setOldKM(existingCalculation.oldKM || 0)
      setNewKM(existingCalculation.newKM || 0)
      setPerKMRate(existingCalculation.perKMRate || 19.5)
      setPichla(existingCalculation.pichla || 0)
      setIsCalculated(true)
      setIsEditing(false)

      setEditModeExpenses(existingCalculation.totalExpenses || 0)
      setEditModeAdvances(existingCalculation.totalAdvances || 0)
      setOriginalTrips(trips) // Store original trips for display
    } else {
      // Reset for new calculation
      setOldKM(0)
      setNewKM(0)
      setPerKMRate(19.5)
      setPichla(0)
      setIsCalculated(false)
      setIsEditing(false)
      setOriginalTrips([])
      setEditModeExpenses(0)
      setEditModeAdvances(0)
    }
  }, [editMode, existingCalculation, open, trips])

  const totalExpenses =
    editMode && existingCalculation
      ? editModeExpenses
      : trips.reduce((sum, trip) => sum + (trip.selfExpenses?.reduce((expSum, e) => expSum + e.amount, 0) || 0), 0)

  const totalAdvances =
    editMode && existingCalculation
      ? editModeAdvances
      : trips.reduce((sum, trip) => sum + (trip.selfAdvances?.reduce((advSum, a) => advSum + a.amount, 0) || 0), 0)

  // KM Calculations
  const totalKM = newKM - oldKM
  const kmValue = totalKM * perKMRate
  const total = kmValue + totalExpenses + Number(pichla)
  const due = total - totalAdvances

  const handleCalculate = () => {
    if (oldKM >= newKM) {
      alert("New KM should be greater than Old KM")
      return
    }
    setIsCalculated(true)
    setIsEditing(false)
  }

  const handleSaveCalculation = async () => {
    if (!isCalculated) {
      alert("Please calculate first before saving")
      return
    }

    const calculationData = {
      driverId: driver?.id,
      tripIds: trips.map((trip) => trip.tripId || trip.id),
      oldKM,
      newKM,
      perKMRate,
      pichla,
      totalKM,
      kmValue,
      totalExpenses,
      totalAdvances,
      total,
      due,
      nextSeriveKM:serviceKm,
      createdAt: editMode ? existingCalculation?.createdAt : new Date(),
      originalTripData: editMode ? existingCalculation?.originalTripData : trips,
    }

    try {
      let res
      if (editMode && existingCalculation) {
        res = await driverCalculationsApi.update(existingCalculation._id, calculationData)
        alert("Calculation updated successfully!")
      } else {
        res = await driverCalculationsApi.create(calculationData)
        alert("Calculation saved successfully!")
      }

      onCalculationComplete(res)
    } catch (error) {
      console.error(error)
      alert("Error saving calculation")
    }
  }

  const handleEditToggle = () => {
    setIsEditing(!isEditing)
    if (!isEditing) {
      setIsCalculated(false) // Allow recalculation when editing
    }
  }


 const handleDownloadPDF = async () => {
  if (!isCalculated) {
    alert("Please calculate first before downloading PDF")
    return
  }

  const mainTrip = trips.length > 0 ? trips : existingCalculation.tripIds
console.log(mainTrip,"MAINTRIPS")
  try {
    const pdf = await generateDriverReceiptPdf(mainTrip, driver, {
      oldKM,
      newKM,
      rate: perKMRate,
      pichla,
    })

    pdf.save(
      `Multi-Trip-Statement-${mainTrip.length}-trips-${new Date()
        .toISOString()
        .slice(0, 10)}.pdf`
    )
  } catch (error) {
    console.error("Error generating PDF:", error)
    alert("पीडीएफ जनरेट करते समय त्रुटि हुई। कृपया पुनः प्रयास करें।")
  }
}


  // Handle print functionality
  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: `Multi-Trip-Statement-${trips.length}-trips`,
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
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-4">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-gray-800">
              {editMode ? "Edit" : "New"} Multi-Trip Calculation ({trips.length} trips)
              <div className="text-sm font-normal text-gray-600 mt-1">
                Trip IDs: {trips.map((trip) => trip.tripId || trip.id).join(", ")}
              </div>
            </DialogTitle>
            <div className="flex gap-2">
              {editMode && isCalculated && !isEditing && (
                <Button
                  onClick={handleEditToggle}
                  size="sm"
                  className="flex items-center gap-1 bg-orange-600 hover:bg-orange-700"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
              )}
              {isCalculated && (
                <>
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
                  <Button
                    onClick={handleSaveCalculation}
                    size="sm"
                    className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
                  >
                    <Save className="w-4 h-4" />
                    {editMode ? "Update" : "Save"} Calculation
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <div ref={receiptRef} className="bg-white text-gray-800 text-sm">
          {/* Header */}
          <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-1">MULTI-TRIP STATEMENT</h1>
            <p className="text-gray-600">Date: {new Date().toLocaleDateString("en-IN")}</p>
            <p className="text-gray-600">Total Trips: {trips.length || existingCalculation?.tripIds?.length}</p>
<p className="text-gray-600 text-xs">
    Trip IDs: {(trips?.length && trips.length > 0
      ? trips
      : existingCalculation?.tripIds || []
    )
      .map((trip) => trip?.tripNumber)
      .join(", ")}
  </p>          </div>

          {/* Driver Info */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-2 border-b border-gray-300 pb-1">Driver Details</h3>
            <p>
              <span className="font-medium">Name:</span> {driver?.name || "N/A"}
            </p>
            <p>
              <span className="font-medium">Phone:</span> {driver?.phone || "N/A"}
            </p>
          </div>

          {/* Trip Summary */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-3 border-b border-gray-400 pb-1">Trip Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {trips.map((trip) => (
                <div key={trip.tripId || trip.id} className="bg-gray-50 p-2 rounded text-xs">
                  <p className="font-medium">{trip.tripNumber}</p>
                  <p className="text-gray-500">ID: {trip.tripId || trip.id}</p>
                  <p>{format(new Date(trip.scheduledDate), "dd MMM yyyy")}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Combined Advances */}
        {/* Combined Advance Payments */}
<div className="mb-6">
  <h3 className="font-semibold text-gray-700 mb-3 border-b border-gray-400 pb-1">
    Combined Advance Payments
  </h3>
  <table className="w-full border border-gray-300 text-sm">
    <thead>
      <tr className="bg-gray-100">
        <th className="border border-gray-300 p-2 text-left font-medium">Trip</th>
        <th className="border border-gray-300 p-2 text-left font-medium">Date</th>
        <th className="border border-gray-300 p-2 text-right font-medium">Amount (₹)</th>
        <th className="border border-gray-300 p-2 text-left font-medium">Reason</th>
      </tr>
    </thead>
    <tbody>
      {(trips?.length && trips.length > 0
        ? trips
        : existingCalculation?.tripIds || []
      ).flatMap((trip) =>
        trip.selfAdvances?.map((adv, i) => (
          <tr key={`${trip._id || trip.id}-${i}`} className="hover:bg-gray-50">
            <td className="border border-gray-300 p-2">{trip.tripNumber}</td>
            <td className="border border-gray-300 p-2">
              {adv.paidAt
                ? new Date(adv.paidAt).toLocaleDateString("en-US")
                : "N/A"}
            </td>
            <td className="border border-gray-300 p-2 text-right">
              {adv.amount?.toFixed(2) || "0.00"}
            </td>
            <td className="border border-gray-300 p-2">{adv.reason || "N/A"}</td>
          </tr>
        )) || []
      )}

      {(trips?.length && trips.every((t) => !t.selfAdvances?.length)) ||
      (!trips?.length &&
        existingCalculation?.tripIds?.every((t) => !t.selfAdvances?.length)) ? (
        <tr>
          <td
            colSpan="4"
            className="border border-gray-300 p-4 text-center text-gray-500"
          >
            No advance payments recorded
          </td>
        </tr>
      ) : null}
    </tbody>
  </table>
  <div className="text-right mt-2">
    <span className="font-semibold">
      Total Advances: ₹
      {(totalAdvances || existingCalculation?.totalAdvances || 0).toFixed(2)}
    </span>
  </div>
</div>

{/* Combined Expenses */}
<div className="mb-6">
  <h3 className="font-semibold text-gray-700 mb-3 border-b border-gray-400 pb-1">
    Combined Expenses
  </h3>
  <table className="w-full border border-gray-300 text-sm">
    <thead>
      <tr className="bg-gray-100">
        <th className="border border-gray-300 p-2 text-left font-medium">Trip</th>
        <th className="border border-gray-300 p-2 text-left font-medium">Date</th>
        <th className="border border-gray-300 p-2 text-right font-medium">Amount (₹)</th>
        <th className="border border-gray-300 p-2 text-left font-medium">Category</th>
      </tr>
    </thead>
    <tbody>
      {(trips?.length && trips.length > 0
        ? trips
        : existingCalculation?.tripIds || []
      ).flatMap((trip) =>
        trip.selfExpenses?.map((exp, i) => (
          <tr key={`${trip._id || trip.id}-${i}`} className="hover:bg-gray-50">
            <td className="border border-gray-300 p-2">{trip.tripNumber}</td>
            <td className="border border-gray-300 p-2">
              {exp.paidAt
                ? new Date(exp.paidAt).toLocaleDateString("en-US")
                : "N/A"}
            </td>
            <td className="border border-gray-300 p-2 text-right">
              {exp.amount?.toFixed(2) || "0.00"}
            </td>
            <td className="border border-gray-300 p-2">{exp.category || "N/A"}</td>
          </tr>
        )) || []
      )}

      {(trips?.length && trips.every((t) => !t.selfExpenses?.length)) ||
      (!trips?.length &&
        existingCalculation?.tripIds?.every((t) => !t.selfExpenses?.length)) ? (
        <tr>
          <td
            colSpan="4"
            className="border border-gray-300 p-4 text-center text-gray-500"
          >
            No expenses recorded
          </td>
        </tr>
      ) : null}
    </tbody>
  </table>
  <div className="text-right mt-2">
    <span className="font-semibold">
      Total Expenses: ₹
      {(totalExpenses || existingCalculation?.totalExpenses || 0).toFixed(2)}
    </span>
  </div>
</div>


          {/* KM Calculation */}
          <div className="mb-6 border border-gray-300 p-4">
            <h3 className="font-semibold text-gray-700 mb-4 border-b border-gray-400 pb-1">Kilometer Calculation</h3>
            <div className="space-y-3 mb-4">
              <div className="flex items-center">
                <label className="w-32 text-sm font-medium text-gray-700">Old KM:</label>
                <input
                  type="number"
                  value={oldKM}
                  onChange={(e) => setOldKM(+e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1 w-32 text-sm focus:border-gray-500 focus:outline-none"
                  // disabled={isCalculated && !isEditing}
                />
              </div>
              <div className="flex items-center">
                <label className="w-32 text-sm font-medium text-gray-700">New KM:</label>
                <input
                  type="number"
                  value={newKM}
                  onChange={(e) => setNewKM(+e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1 w-32 text-sm focus:border-gray-500 focus:outline-none"
                  // disabled={isCalculated && !isEditing}
                />
              </div>
              <div className="flex items-center">
                <label className="w-32 text-sm font-medium text-gray-700">Rate per KM:</label>
                <input
                  type="number"
                  step="0.1"
                  value={perKMRate}
                  onChange={(e) => setPerKMRate(+e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1 w-32 text-sm focus:border-gray-500 focus:outline-none"
                  // disabled={isCalculated && !isEditing}
                />
              </div>
              <div className="flex items-center">
                <label className="w-32 text-sm font-medium text-gray-700">Previous Balance:</label>
                <input
                  type="number"
                  value={pichla}
                  onChange={(e) => setPichla(+e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1 w-32 text-sm focus:border-gray-500 focus:outline-none"
                  placeholder="0"
                  // disabled={isCalculated && !isEditing}
                />
                <span className="ml-2 text-xs text-gray-500">(use negative for debit)</span>
              </div>


                 <div className="flex items-center">
                <label className="w-32 text-sm font-medium text-gray-700">Next Service KM:</label>
                <input
                  type="number"
                  value={serviceKm}
                  onChange={(e) => setServiceKm(+e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1 w-32 text-sm focus:border-gray-500 focus:outline-none"
                  placeholder="0"
                  // disabled={isCalculated && !isEditing}
                />
               
              </div>
            </div>

            {(!isCalculated || isEditing) && (
              <Button onClick={handleCalculate} className="mb-4 flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                <Calculator className="w-4 h-4" />
                {isEditing ? "Recalculate" : "Calculate"}
              </Button>
            )}

            {isCalculated && (
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
            )}
          </div>

          {/* Final Summary - Only show after calculation */}
          {isCalculated && (
            <div className="border-2 border-gray-800 p-4">
              <h3 className="font-bold text-gray-800 mb-4 text-center text-lg">FINAL SETTLEMENT</h3>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>KM Value:</span>
                  <span>₹{kmValue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Expenses:</span>
                  <span>₹{totalExpenses.toFixed(2)}</span>
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
                  <span>Less: Total Advances:</span>
                  <span>₹{totalAdvances.toFixed(2)}</span>
                </div>
              </div>
              <div className={`text-xl font-bold ${due < 0 ? "text-red-600" : "text-black"}`}>
                Net Amount: ₹{due.toFixed(2)}
              </div>
              <div className="text-sm mt-1">
                {due > 0 && "(To be paid to Driver)"}
                {due < 0 && "(To be paid by Driver)"}
                {due === 0 && "(No outstanding balance)"}
              </div>
            </div>
          )}

          {/* Footer */}
          {isCalculated && (
            <div className="text-center mt-6 pt-4 border-t border-gray-300">
              <p className="text-xs text-gray-500">
                This is a computer-generated multi-trip statement. Generated on {new Date().toLocaleString("en-IN")}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
