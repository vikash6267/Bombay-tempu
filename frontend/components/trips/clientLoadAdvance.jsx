import {useFormik} from "formik";
import * as Yup from "yup";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {Label} from "@/components/ui/label";
// import { Calendar } from "@/components/ui/calendar";
import {Textarea} from "@/components/ui/textarea";

const paymentSchema = Yup.object().shape({
  amount: Yup.number()
    .required("Amount is required")
    .min(0, "Amount must be positive"),
  pymentMathod: Yup.string()
    .required("Pyment Mathod is requierd")
    .oneOf(["cash", "bank_transfer", "upi", "rtgs", "neft", "imps", "cheque"]),
  paidTo: Yup.string()
    .required("Recipient is required")
    .oneOf(["driver", "admin"]),
  paidAt: Yup.date().default(() => new Date()),
  purpose: Yup.string()
    .oneOf(["fuel", "toll", "loading", "general"])
    .default("general"),
  notes: Yup.string(),
});

export function APaymentForm({handleSubmit, open, index}) {
  const formik = useFormik({
    initialValues: {
      amount: 0,
      pymentMathod: "cash",
      paidTo: "admin",
      paidAt: new Date(),
      purpose: "general",
      notes: "",
    },
    validationSchema: paymentSchema,
    onSubmit: (values) => {
        console.log(values)
      handleSubmit(values, index);
    },
  });

  return (
    <form
      onSubmit={formik.handleSubmit}
      className={`space-y-4 ${open ? "block" : "hidden"}`}>
      {/* Amount Field */}
      <div className="flex flex-row justify-between">
        <div>
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            onChange={formik.handleChange}
            value={formik.values.amount}
          />
          {formik.errors.amount && (
            <p className="text-sm text-red-500">{formik.errors.amount}</p>
          )}
        </div>
        {/* Payment Date */}
        <div>
          <Label>Payment Date</Label>
          <Input
            type="datetime-local"
            value={formik.values.paidAt}
            onChange={(date) =>
              formik.setFieldValue("paidAt", date.target.value)
            }
            className="rounded-md border"
          />
        </div>
      </div>
      <div className="flex flex-row justify-between">
        <div>
          <Label>Payment Mathod</Label>
          <Select
            onValueChange={(value) =>
              formik.setFieldValue("pymentMathod", value)
            }
            value={formik.values.pymentMathod}>
            <SelectTrigger>
              <SelectValue placeholder="Select Mathod" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              <SelectItem value="upi">UPI</SelectItem>
              <SelectItem value="cheque">Cheque</SelectItem>
              <SelectItem value="rtgs">RTGS</SelectItem>
              <SelectItem value="neft">NEFT</SelectItem>
              <SelectItem value="imps">IMPS</SelectItem>
            </SelectContent>
          </Select>
          {formik.errors.pymentMathod && (
            <p className="text-sm text-red-500">{formik.errors.pymentMathod}</p>
          )}
        </div>
      
        {/* Purpose Field */}
        <div>
          <Label>Purpose</Label>
          <Select
            onValueChange={(value) => formik.setFieldValue("purpose", value)}
            value={formik.values.purpose}>
            <SelectTrigger>
              <SelectValue placeholder="Select purpose" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fuel">Fuel</SelectItem>
              <SelectItem value="toll">Toll</SelectItem>
              <SelectItem value="loading">Loading</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Notes Field */}
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          onChange={formik.handleChange}
          value={formik.values.notes}
        />
      </div>

      <Button type="submit" className="w-full">
        Submit Payment
      </Button>
    </form>
  );
}
