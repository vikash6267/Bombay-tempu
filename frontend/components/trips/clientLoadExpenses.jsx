import { useFormik } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import TypeSelectWithAddNew from "./TypeSelecteIWthAddNew"; // 👈 import it

const paymentSchema = Yup.object().shape({
  amount: Yup.number()
    .required("Amount is required")
    .min(0, "Amount must be positive"),
  paidBy: Yup.string()
    .required("Recipient is required")
    .oneOf(["driver", "admin"]),
  paidAt: Yup.date().default(() => new Date()),
  type: Yup.string()
    .required("Purpose is required")
    .min(2, "Type must be valid"),
  description: Yup.string(),
});

export function EPaymentForm({ handleSubmit, open, index }) {
  const formik = useFormik({
    initialValues: {
      amount: 0,
      paidBy: "",
      paidAt: new Date().toISOString().slice(0, 16), // formatted for datetime-local
      type: "",
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
      <div className="flex flex-row justify-start gap-4">
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
            onChange={(e) =>
              formik.setFieldValue("paidAt", e.target.value)
            }
            className="rounded-md border"
          />
        </div>

        {/* Paid To Field */}
        <div>
          <Label>Paid By</Label>
          <Select
            onValueChange={(value) =>
              formik.setFieldValue("paidBy", value)
            }
            value={formik.values.paidBy}>
            <SelectTrigger>
              <SelectValue placeholder="Select Payer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="driver">Driver</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          {formik.errors.paidBy && (
            <p className="text-sm text-red-500">{formik.errors.paidBy}</p>
          )}
        </div>

        {/* Type Field with Add New */}
        <div>
          <TypeSelectWithAddNew
            value={formik.values.type}
            onChange={(value) =>
              formik.setFieldValue("type", value)
            }
            error={formik.errors.type}
          />
        </div>
      </div>

      {/* Notes Field */}
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
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
