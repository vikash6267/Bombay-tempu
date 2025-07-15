'use client'
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";

function CommissionSelector({ formik }) {
  const [type, setType] = useState(null);
  const [percent, setPercent] = useState("");
  const rate = parseFloat(formik.values.rate) || 0;

  useEffect(() => {
    setType("fixed");
  }, []);

  const handleTypeChange = (value) => {
    setType(value);
    formik.setFieldValue("commission", "");
    setPercent("");
  };

  const handlePercentageChange = (e) => {
    const value = e.target.value;
    setPercent(value);
    const percentNum = parseFloat(value);

    if (!isNaN(percentNum) && rate > 0) {
      const commission = (percentNum / 100) * rate;
      formik.setFieldValue("commission", commission.toFixed(2));
    } else {
      formik.setFieldValue("commission", "");
    }
  };

  if (type === null) return null;

  return (
    <div className="space-y-2">
      <Label>Commission Type *</Label>
      <Select value={type} onValueChange={handleTypeChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select commission type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="fixed">Fixed</SelectItem>
          <SelectItem value="percentage">Percentage</SelectItem>
        </SelectContent>
      </Select>

      {type === "fixed" && (
        <div>
          <Label>Commission Amount *</Label>
          <Input
            type="number"
            value={formik.values.commission}
            onChange={(e) =>
              formik.setFieldValue("commission", e.target.value)
            }
            className={formik.errors.commission ? "border-red-500" : ""}
          />
          {formik.errors.commission && (
            <p className="text-sm text-red-500 mt-1">
              {formik.errors.commission}
            </p>
          )}
        </div>
      )}

      {type === "percentage" && (
        <div>
          <Label>Commission (%) *</Label>
          <Input
            type="number"
            value={percent}
            placeholder="Enter percentage"
            onChange={handlePercentageChange}
            className={rate <= 0 ? "border-red-500" : ""}
          />
          {rate <= 0 && (
            <p className="text-sm text-red-500 mt-1">
              Rate must be greater than 0 to calculate commission
            </p>
          )}
          {percent && rate > 0 && (
            <p className="text-sm text-green-600 mt-1">
              {percent}% of ₹{rate} = ₹{formik.values.commission}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default CommissionSelector;
