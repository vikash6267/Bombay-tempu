import { useState, useEffect } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const typeOptions = [
  { value: "driver_bhatta", label: "Fuel" },
  { value: "loading_charges", label: "Loading Charges" },
  { value: "unloading_charges", label: "Unloading Charges" },
  { value: "toll", label: "Toll" },
  { value: "halting_charges", label: "Halting Charges" },
  { value: "weight_charges", label: "Weight Charges" },
  { value: "union_charges", label: "Union Charges" },
  { value: "add_new", label: "➕ Other (Add New)" },
];

const TypeSelectWithAddNew = ({ value, onChange, error }) => {
  const [customValue, setCustomValue] = useState("");

  useEffect(() => {
    const isCustom = !typeOptions.find((opt) => opt.value === value);
    if (isCustom && value) setCustomValue(value);
  }, [value]);

  const handleChange = (val) => {
    if (val === "add_new") {
      onChange("");
    } else {
      onChange(val);
      setCustomValue("");
    }
  };

  return (
    <div>
      <Label>Type</Label>
      <Select value={value && !customValue ? value : "add_new"} onValueChange={handleChange}>
        <SelectTrigger className={error ? "border-red-500" : ""}>
          <SelectValue placeholder="Select purpose" />
        </SelectTrigger>
        <SelectContent>
          {typeOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {(value === "" || customValue) && (
        <div className="mt-2">
          <Input
            placeholder="Enter custom purpose"
            value={customValue}
            onChange={(e) => {
              const val = e.target.value;
              setCustomValue(val);
              onChange(val);
            }}
          />
        </div>
      )}

      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
};

export default TypeSelectWithAddNew;
