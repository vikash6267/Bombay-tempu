import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { usersApi } from "lib/api";
import Swal from "sweetalert2";
import { formatCurrency } from "lib/utils";

export default function DriverAdvanceCard({ trip, onUpdate, type = "driver" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [deductAmount, setDeductAmount] = useState("");
console.log(trip,"OKJ*I")
const handleSubmit = async () => {
  if (!deductAmount || deductAmount <= 0) return;

  const reasonText = `Deduct from advance balance (Trip: ${trip.tripNumber})`;

  try {
    // Show loading alert
    Swal.fire({
      title: "Processing...",
      text: "Please wait",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    // API call using usersApi
    const res =
      type === "driver"
        ? await usersApi.createDeposite({
            userId: trip.driver._id,
            amount: Number(deductAmount),
            reason: reasonText,
            paymentType: "cash",
            tripId: trip._id,
          })
        : await usersApi.createDeposite({
            userId: trip?.vehicleOwner?.ownerId?._id,
            amount: Number(deductAmount),
            reason: reasonText,
            paymentType: "cash",
            tripId: trip._id,
          });

    Swal.close(); // Close loading

    if (res.success) {
      Swal.fire({
        icon: "success",
        title: "Success",
        text: res.message,
        showConfirmButton: true,
        timer: 3000, // auto close
      });
      setIsOpen(false);
      setDeductAmount("");
      // Send entry based on backend response
      onUpdate?.({
        amount: res.deductedAmount,
        reason: res.deposit.reason,
        paymentType: res.deposit.paymentType,
        date: new Date(res.deposit.date).toISOString().split("T")[0],
        description: res.deposit.reason, // ya blank agar chaho
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: res.message,
        showConfirmButton: true,
        allowOutsideClick: false, // user manually close
      });
    }
  } catch (err) {
    Swal.close();
    console.error(err);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: err?.response?.data?.message || "Something went wrong",
      showConfirmButton: true,
      allowOutsideClick: false,
    });
  }
};

  return (
    <>
      <div
        className="text-gray-600 cursor-pointer"
        onClick={() => setIsOpen(true)}
      >
        {type === "driver" ? "Driver Deposit Balance" : "Fleet Owner Advance Balance"}:{" "}
        
        {
          type === "driver" ? <>{formatCurrency(trip?.driver?.advanceAmount || 0)}</> : <>{formatCurrency(trip?.vehicleOwner?.ownerId?.advanceAmount || 0)}</>
        }
         Click To add
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {type === "driver" ? "Deduct Deposit" : "Deduct Advance"}
            </DialogTitle>
            <DialogDescription>
              Enter the amount you want to {type === "driver" ? "deduct from advanced" : "deduct from advance"} balance.
            </DialogDescription>
          </DialogHeader>

          <input
            type="number"
            placeholder="Enter amount"
            value={deductAmount}
            onChange={(e) => setDeductAmount(e.target.value)}
            className="w-full border p-2 rounded mt-4 mb-4"
          />

          <DialogFooter className="flex justify-end space-x-2">
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 rounded bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 rounded bg-blue-600 text-white"
            >
              Deduct
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
