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
  //   pymentMathod: Yup.string()
  //     .required("Pyment Mathod is requierd")
  //     .oneOf(["cash", "bank_transfer", "upi", "rtgs", "neft", "imps", "cheque"]),
  paidBy: Yup.string()
    .required("Recipient is required")
    .oneOf(["driver", "admin"]),
  paidAt: Yup.date().default(() => new Date()),
  type: Yup.string()
    .oneOf([
      "driver_bhatta",
      "loading_charges",
      "other",
      "union_charges",
      "weight_charges",
      "halting_charges",
      "unloading_charges",
      "toll",
    ])
    .default("other"),
  description: Yup.string(),
});

export function EPaymentForm({handleSubmit, open, index}) {
  const formik = useFormik({
    initialValues: {
      amount: 0,
      paidBy: "",
      paidAt: new Date(),
      type: "other",
      description: "",
    },
    validationSchema: paymentSchema,
    onSubmit: (values) => {
      handleSubmit(values, index);
    },
  });

  return (
    <form
      onSubmit={formik.handleSubmit}
      className={`space-y-4 ${open ? "block" : "hidden"}`}>
      {/* Amount Field */}
      <div className="flex flex-row justify-start gap-4 ">
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
        {/* </div>
      <div className="flex flex-row justify-start gap-4"> */}
        {/* 
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
        </div>*/}
        {/* Paid To Field */}
        <div>
          <Label>Paid By</Label>
          <Select
            onValueChange={(value) => formik.setFieldValue("paidBy", value)}
            value={formik.values.paidBy}>
            <SelectTrigger>
              <SelectValue placeholder="Select Payer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="driver">Driver</SelectItem>
              <SelectItem value="admin">admin</SelectItem>
            </SelectContent>
          </Select>
          {formik.errors.paidBy && (
            <p className="text-sm text-red-500">{formik.errors.paidBy}</p>
          )}
        </div>
        {/* Purpose Field */}
        <div>
          <Label>Type</Label>
          <Select
            onValueChange={(value) => formik.setFieldValue("type", value)}
            value={formik.values.type}>
            <SelectTrigger>
              <SelectValue placeholder="Select purpose" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="driver_bhatta">Fuel</SelectItem>
              <SelectItem value="loading_charges">Loading Charges</SelectItem>
              <SelectItem value="unloading_charges">
                Unloading Charges
              </SelectItem>
              <SelectItem value="toll">Toll</SelectItem>
              <SelectItem value="halting_charges">Halting Charges</SelectItem>
              <SelectItem value="weight_charges">Weight Charges</SelectItem>
              <SelectItem value="union_charges">Union Charges</SelectItem>
              <SelectItem value="other"> Other Charges</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Notes Field */}
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="notes"
          name="description"
          onChange={formik.handleChange}
          value={formik.values.description}
        />
      </div>

      <Button type="submit" className="w-full">
        Submit Payment
      </Button>
    </form>
  );
}
