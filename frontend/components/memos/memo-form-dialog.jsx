"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const collectionMemoSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  amount: z.number().min(1, "Amount must be greater than 0"),
  collectionDate: z.string().min(1, "Date is required"),
  paymentMode: z.string().min(1, "Payment mode is required"),
  remarks: z.string().optional(),
});

const balanceMemoSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  balanceAmount: z.number().min(1, "Balance amount must be greater than 0"),
  dueDate: z.string().optional(),
  remarks: z.string().optional(),
});

export function MemoFormDialog({
  open,
  onClose,
  onSubmit,
  clients = [],
  type = "collection", // "collection" or "balance"
  editData = null,
  isLoading = false,
}) {
  const schema = type === "collection" ? collectionMemoSchema : balanceMemoSchema;
  
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      clientId: "",
      amount: 0,
      balanceAmount: 0,
      collectionDate: new Date().toISOString().split("T")[0],
      dueDate: "",
      paymentMode: "cash",
      remarks: "",
    },
  });

  useEffect(() => {
    if (editData) {
      form.reset({
        clientId: editData.clientId?._id || editData.clientId || "",
        amount: editData.amount || 0,
        balanceAmount: editData.balanceAmount || 0,
        collectionDate: editData.collectionDate
          ? new Date(editData.collectionDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        dueDate: editData.dueDate
          ? new Date(editData.dueDate).toISOString().split("T")[0]
          : "",
        paymentMode: editData.paymentMode || "cash",
        remarks: editData.remarks || "",
      });
    } else {
      form.reset({
        clientId: "",
        amount: 0,
        balanceAmount: 0,
        collectionDate: new Date().toISOString().split("T")[0],
        dueDate: "",
        paymentMode: "cash",
        remarks: "",
      });
    }
  }, [editData, form]);

  const handleSubmit = (data) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editData ? "Edit" : "Create"} {type === "collection" ? "Collection" : "Balance"} Memo
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Client Selection */}
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client._id} value={client._id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Amount Field */}
            {type === "collection" ? (
              <>
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Collection Amount (₹) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter amount"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="collectionDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Collection Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentMode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Mode *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select mode" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                          <SelectItem value="online">Online</SelectItem>
                          <SelectItem value="upi">UPI</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            ) : (
              <>
                <FormField
                  control={form.control}
                  name="balanceAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Balance Amount (₹) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter balance amount"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Remarks */}
            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter any remarks..."
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : editData ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
