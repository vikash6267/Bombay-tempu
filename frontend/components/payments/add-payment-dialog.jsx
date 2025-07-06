"use client";

import {useState, useEffect} from "react";
import {useFormik} from "formik";
import * as Yup from "yup";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {api} from "@/lib/api";
import {toast} from "react-hot-toast";

const validationSchema = Yup.object({
  paymentType: Yup.string().required("Payment type is required"),
  amount: Yup.number()
    .positive("Amount must be positive")
    .required("Amount is required"),
  paymentMethod: Yup.string().required("Payment Method is required"),
  status: Yup.string().required("Payment status is required"),
  paidBy: Yup.string().required("Payer is required"),
  paidTo: Yup.string().required("Payee is required"),
});

export function AddPaymentDialog({
  open,
  onOpenChange,
  onSuccess,
  tripId = null,
}) {
  const [loading, setLoading] = useState(false);
  const [trips, setTrips] = useState([]);
  const [users, setUsers] = useState([]);

  const formik = useFormik({
    initialValues: {
      paymentType: "",
      amount: "",
      paymentMethod: "",
      status: "pending",
      paidBy: "",
      paidTo: "",
      trip: tripId || "",
      transactionId: "",
      description: "",
      dueDate: "",
      paidDate: "",
      reference: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        console.log(values);
        await api.post("/payments", values);
        toast.success("Payment added successfully!");
        onSuccess();
        onOpenChange(false);
        formik.resetForm();
      } catch (error) {
        console.log(error);
        toast.error(error.response?.data?.message || "Failed to add payment");
      } finally {
        setLoading(false);
      }
    },
  });

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  const fetchData = async () => {
    try {
      const [tripsRes, usersRes] = await Promise.all([
        api.get("/trips"),
        api.get("/users"),
      ]);

      setTrips(tripsRes.data.data.trips);
      setUsers(usersRes.data.data.users);
    } catch (error) {
      toast.error("Failed to fetch data");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[80vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Payment</DialogTitle>
        </DialogHeader>

        <form onSubmit={formik.handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentType">Payment Type *</Label>
                <Select
                  value={formik.values.paymentType}
                  onValueChange={(value) =>
                    formik.setFieldValue("paymentType", value)
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trip_payment">Trip Payment</SelectItem>
                    <SelectItem value="advance_payment">
                      Advance Payment
                    </SelectItem>
                    <SelectItem value="fleet_payment">Fleet Payment</SelectItem>
                    <SelectItem value="commission">Commission</SelectItem>
                    <SelectItem value="refund">Refund</SelectItem>
                    <SelectItem value="penalty">Penalty</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="fuel">Fuel</SelectItem>
                    <SelectItem value="toll">Toll</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {formik.touched.paymentType && formik.errors.paymentType && (
                  <p className="text-sm text-red-500">
                    {formik.errors.paymentType}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹) *</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  value={formik.values.amount}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Enter amount"
                />
                {formik.touched.amount && formik.errors.amount && (
                  <p className="text-sm text-red-500">{formik.errors.amount}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method *</Label>
                <Select
                  value={formik.values.paymentMethod}
                  onValueChange={(value) =>
                    formik.setFieldValue("paymentMethod", value)
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="wallet">Digital Wallet</SelectItem>
                    <SelectItem value="rtgs">RTGS</SelectItem>
                    <SelectItem value="neft">NEFT</SelectItem>
                    <SelectItem value="imps">IMPS</SelectItem>
                  </SelectContent>
                </Select>
                {formik.touched.paymentMethod &&
                  formik.errors.paymentMethod && (
                    <p className="text-sm text-red-500">
                      {formik.errors.paymentMethod}
                    </p>
                  )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Payment Status *</Label>
                <Select
                  value={formik.values.status}
                  onValueChange={(value) =>
                    formik.setFieldValue("status", value)
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    {/* <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem> */}
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
                {formik.touched.status && formik.errors.status && (
                  <p className="text-sm text-red-500">{formik.errors.status}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="paidBy">Paid By *</Label>
                <Select
                  value={formik.values.paidBy}
                  onValueChange={(value) =>
                    formik.setFieldValue("paidBy", value)
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payer" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user._id} value={user._id}>
                        {user.name} ({user.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formik.touched.paidBy && formik.errors.paidBy && (
                  <p className="text-sm text-red-500">{formik.errors.paidBy}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="paidTo">Paid To *</Label>
                <Select
                  value={formik.values.paidTo}
                  onValueChange={(value) =>
                    formik.setFieldValue("paidTo", value)
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payee" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user._id} value={user._id}>
                        {user.name} ({user.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formik.touched.paidTo && formik.errors.paidTo && (
                  <p className="text-sm text-red-500">{formik.errors.paidTo}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="trip">Related Trip *</Label>
                <Select
                  value={formik.values.trip}
                  onValueChange={(value) =>
                    formik.setFieldValue("trip", value)
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select trip" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no_trip">No Trip</SelectItem>
                    {trips.map((trip) => (
                      <SelectItem key={trip._id} value={trip._id}>
                        {trip.tripNumber} - {trip?.clients[0].origin.city} to
                        {trip?.clients[0].destination.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transactionId">Transaction ID</Label>
                <Input
                  id="transactionId"
                  name="transactionId"
                  value={formik.values.transactionId}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Enter transaction ID"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  value={formik.values.dueDate}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paidDate">Paid Date</Label>
                <Input
                  id="paidDate"
                  name="paidDate"
                  type="date"
                  value={formik.values.paidDate}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference">Reference Number</Label>
                <Input
                  id="reference"
                  name="reference"
                  value={formik.values.reference}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Enter reference number"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formik.values.description}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Enter payment description"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Payment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
