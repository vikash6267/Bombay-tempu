"use client";
import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  CalendarDays,
  DollarSign,
  TrendingUp,
  Filter,
  RefreshCw,
  Plus,
  Wallet,
  Receipt,
  Calendar,
  Trash2,
} from "lucide-react";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  parseISO,
} from "date-fns";
import { expensesApi } from "@/lib/api";
import { toast } from "sonner";
import { DashboardLayout } from "components/layout/dashboard-layout";
import { vehiclesApi } from "lib/api";

export default function ExpenseDashboard() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    type: "",
    notes: "",
    paidAt: new Date().toISOString().split("T")[0],
  });

  const [ownVehicles, setOwnVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await vehiclesApi.getAll();
        const allVehicles = res?.data?.vehicles || [];

        // Filter vehicles where ownershipType === "self"
        const ownedOnly = allVehicles.filter((v) => v.ownershipType === "self");

        setOwnVehicles(ownedOnly);
        console.log("Self-owned vehicles:", ownedOnly);
      } catch (error) {
        console.error("Error fetching vehicles:", error);
      }
    };

    fetchVehicles();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await expensesApi.getAll();
      console.log("API Response:", res);

      if (res.success) {
        setExpenses(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch expenses", err);
      toast({
        title: "Error",
        description: "Failed to fetch expenses. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExpense = async () => {
    try {
      setCreateLoading(true);

      if (!formData.amount || !formData.type || !formData.notes) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      const expenseData = {
        amount: Number.parseFloat(formData.amount),
        type: formData.type,
        notes: formData.notes,
        paidAt: new Date(formData.paidAt).toISOString(),
        ...(formData.type === "vehicle" &&
          selectedVehicleId && {
            vehicleId: selectedVehicleId,
          }),
      };

      const res = await expensesApi.create(expenseData);

      if (res.success) {
        toast({
          title: "Success",
          description: "Expense created successfully!",
        });
        setCreateModalOpen(false);
        setFormData({
          amount: "",
          type: "",
          notes: "",
          paidAt: new Date().toISOString().split("T")[0],
        });
        fetchExpenses(); // Refresh the list
      }
    } catch (err) {
      console.error("Failed to create expense", err);
      toast({
        title: "Error",
        description: "Failed to create expense. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreateLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Get unique expense types
  const expenseTypes = useMemo(() => {
    const types = [...new Set(expenses.map((expense) => expense.type))];
    return [...types.sort(), "other"];
  }, [expenses]);

  // Common expense types for the create form
  const [commonExpenseTypes, setCommonExpenseTypes] = useState([
    "vehicle",
    "office",
    "staff-room",
    "room",
    "gopiram",
    "mohit",
    "bills",
    "other",
  ]);

  // Filter expenses based on selected filters
  const filteredExpenses = useMemo(() => {
    let filtered = expenses;

    // Filter by type
    if (selectedType !== "all") {
      if (selectedType === "other") {
        const knownTypes = expenseTypes.filter((type) => type !== "other");
        filtered = filtered.filter(
          (expense) => !knownTypes.includes(expense.type)
        );
      } else {
        filtered = filtered.filter((expense) => expense.type === selectedType);
      }
    }

    // Filter by period
    if (selectedPeriod !== "all") {
      const now = new Date();
      let dateRange;

      switch (selectedPeriod) {
        case "week":
          dateRange = {
            start: startOfWeek(now),
            end: endOfWeek(now),
          };
          break;
        case "month":
          dateRange = {
            start: startOfMonth(now),
            end: endOfMonth(now),
          };
          break;
        default:
          return filtered;
      }

      filtered = filtered.filter((expense) => {
        const expenseDate = parseISO(expense.paidAt);
        return isWithinInterval(expenseDate, dateRange);
      });
    }

    return filtered.sort(
      (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime()
    );
  }, [expenses, selectedType, selectedPeriod, expenseTypes]);

  // Calculate summaries
  const summaries = useMemo(() => {
    const now = new Date();
    const weekRange = { start: startOfWeek(now), end: endOfWeek(now) };
    const monthRange = { start: startOfMonth(now), end: endOfMonth(now) };

    const weeklyExpenses = expenses.filter((expense) => {
      const expenseDate = parseISO(expense.paidAt);
      return isWithinInterval(expenseDate, weekRange);
    });

    const monthlyExpenses = expenses.filter((expense) => {
      const expenseDate = parseISO(expense.paidAt);
      return isWithinInterval(expenseDate, monthRange);
    });

    return {
      total: expenses.reduce((sum, expense) => sum + expense.amount, 0),
      weekly: weeklyExpenses.reduce((sum, expense) => sum + expense.amount, 0),
      monthly: monthlyExpenses.reduce(
        (sum, expense) => sum + expense.amount,
        0
      ),
      filtered: filteredExpenses.reduce(
        (sum, expense) => sum + expense.amount,
        0
      ),
      count: {
        total: expenses.length,
        weekly: weeklyExpenses.length,
        monthly: monthlyExpenses.length,
        filtered: filteredExpenses.length,
      },
    };
  }, [expenses, filteredExpenses]);

  // Group expenses by type for summary
  const expensesByType = useMemo(() => {
    const grouped = filteredExpenses.reduce((acc, expense) => {
      if (!acc[expense.type]) {
        acc[expense.type] = { count: 0, total: 0 };
      }
      acc[expense.type].count += 1;
      acc[expense.type].total += expense.amount;
      return acc;
    }, {});

    return Object.entries(grouped).sort(([, a], [, b]) => b.total - a.total);
  }, [filteredExpenses]);

  const handleDeleteExpense = async (id) => {
    const confirm = window.confirm(
      "Are you sure you want to delete this expense?"
    );
    if (!confirm) return;

    try {
      const res = await expensesApi.delete(id);
      console.log(res);
      if (res.success) {
        toast.success("Expense deleted.");
        setExpenses((prev) => prev.filter((e) => e._id !== id));
      } else {
        toast.error(res.message || "Delete failed.");
      }
    } catch (err) {
      toast.error("An error occurred while deleting.");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading expenses...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Expense Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Track and manage your expenses efficiently
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={fetchExpenses} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Add New Expense
                </DialogTitle>
                <DialogDescription>
                  Create a new expense entry. Fill in all the details below.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="type">Expense Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => {
                      if (value === "add_new") {
                        const newType = prompt("Enter new expense type:");
                        if (newType) {
                          const formatted = newType.trim().toLowerCase();
                          if (!commonExpenseTypes.includes(formatted)) {
                            setCommonExpenseTypes((prev) => [
                              ...prev,
                              formatted,
                            ]);
                          }
                          setFormData({ ...formData, type: formatted });
                        }
                      } else {
                        setFormData({ ...formData, type: value });
                        if (value !== "vehicle") {
                          setSelectedVehicleId(""); // clear selection if not vehicle
                        }
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select expense type" />
                    </SelectTrigger>
                    <SelectContent>
                      {commonExpenseTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}
                      <SelectItem value="add_new" className="text-blue-500">
                        ➕ Add new type
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.type === "vehicle" && (
                  <div className="grid gap-2">
                    <Label htmlFor="vehicle">Select Vehicle</Label>
                    <select
                      id="vehicle"
                      className="border rounded p-2"
                      value={selectedVehicleId}
                      onChange={(e) => setSelectedVehicleId(e.target.value)}
                    >
                      <option value="">-- Select Vehicle --</option>
                      {ownVehicles.map((vehicle) => (
                        <option key={vehicle._id} value={vehicle._id}>
                          {vehicle.registrationNumber} ({vehicle.vehicleType})
                        </option>
                      ))}
                    </select>

                    {selectedVehicleId && (
                      <p className="text-sm text-muted-foreground">
                        Selected:{" "}
                        {
                          ownVehicles.find((v) => v._id === selectedVehicleId)
                            ?.registrationNumber
                        }
                      </p>
                    )}
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add notes about this expense"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="paidAt">Date</Label>
                  <Input
                    id="paidAt"
                    type="date"
                    value={formData.paidAt}
                    onChange={(e) =>
                      setFormData({ ...formData, paidAt: e.target.value })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateExpense} disabled={createLoading}>
                  {createLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Expense
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Total Expenses
            </CardTitle>
            <div className="p-2 bg-blue-200 dark:bg-blue-800 rounded-full">
              <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              ₹{summaries.total.toLocaleString()}
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              {summaries.count.total} transactions
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
              Weekly Expenses
            </CardTitle>
            <div className="p-2 bg-green-200 dark:bg-green-800 rounded-full">
              <CalendarDays className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              ₹{summaries.weekly.toLocaleString()}
            </div>
            <p className="text-xs text-green-600 dark:text-green-400">
              {summaries.count.weekly} transactions this week
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
              Monthly Expenses
            </CardTitle>
            <div className="p-2 bg-purple-200 dark:bg-purple-800 rounded-full">
              <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              ₹{summaries.monthly.toLocaleString()}
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400">
              {summaries.count.monthly} transactions this month
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">
              Filtered Total
            </CardTitle>
            <div className="p-2 bg-orange-200 dark:bg-orange-800 rounded-full">
              <Filter className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              ₹{summaries.filtered.toLocaleString()}
            </div>
            <p className="text-xs text-orange-600 dark:text-orange-400">
              {summaries.count.filtered} filtered transactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>
            Filter expenses by type and time period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">
                Expense Type
              </label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select expense type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {expenseTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">
                Time Period
              </label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select time period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expense Summary by Type */}
      {expensesByType.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Expenses by Type
            </CardTitle>
            <CardDescription>
              Breakdown of filtered expenses by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {expensesByType.map(([type, data]) => (
                <div
                  key={type}
                  className="p-4 border rounded-xl bg-gradient-to-r from-muted/50 to-muted/30 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className="capitalize">
                      {type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {data.count} transaction{data.count !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="text-xl font-bold">
                    ₹{data.total.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expense List */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Recent Expenses
          </CardTitle>
          <CardDescription>
            {filteredExpenses.length} expense
            {filteredExpenses.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground text-lg">
                No expenses found matching your filters
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Try adjusting your filters or add a new expense
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredExpenses.map((expense) => (
                <div
                  key={expense._id}
                  className="flex items-center justify-between p-4 border rounded-xl hover:shadow-md transition-all duration-200 bg-gradient-to-r from-background to-muted/20"
                >
                  <div className="flex-1 justify-between">
                    <div className="flex items-center gap-3 mb-2">
                    
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {expense.paidAt
                          ? format(parseISO(expense.paidAt), "dd/MM/yyyy")
                          : "N/A"}
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {expense.notes}
                      </p>

                        <Badge
                        variant="outline"
                        className="capitalize font-medium"
                      >
                        {expense.type === "vehicle"
                          ? expense?.vehicleId?.registrationNumber ||
                            expense.type
                          : expense.type}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right ml-4 flex  gap-3">
                    <div className="text-xl font-bold">
                      ₹{expense.amount.toLocaleString()}
                    </div>

                    <button
                      className=" cursor-pointer p-1 rounded-full hover:bg-red-100 text-red-500"
                      onClick={() => handleDeleteExpense(expense._id)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
