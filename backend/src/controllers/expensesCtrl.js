const Expense = require('../models/Expenses');
const Vehicle = require('../models/Vehicle');

// ✅ Create Expense
exports.createExpense = async (req, res) => {
  try {
    const { amount, type, notes, paidAt, vehicleId } = req.body;

    console.log(req.body)
    if (!amount || !type) {
      return res
        .status(400)
        .json({ success: false, message: "Amount and Type are required." });
    }

    // Step 1: Create global expense
    const expense = await Expense.create({
      amount,
      type,
      notes,
      paidAt,
      vehicleId: vehicleId || undefined,
    });

    // Step 2: If it's a vehicle expense, save it in vehicle model too
    if (type === "vehicle" && vehicleId) {
  const vehicleUpdateResult = await Vehicle.findByIdAndUpdate(vehicleId, {
    $push: {
      vehicleExpenseHistoryMain: {
        amount,
        reason: notes,
        category: "fuel",
        expenseFor: "vehicle",
        description: "",
        paidAt,
      },
    },
  });

}


    res.status(201).json({
      success: true,
      message: "Expense created successfully.",
      data: expense,
    });
  } catch (error) {
    console.log(error)
    res
      .status(500)
      .json({ success: false, message: "Server error: " + error.message });
  }
};


exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Expense.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Expense not found or already deleted.",
      });
    }

    console.log("Deleted Expense:", deleted);

    // DEBUG: Check if it's a vehicle expense
    if (deleted.type === "vehicle" && deleted.vehicleId) {
      console.log("Attempting to remove from vehicleExpenseHistoryMain");

      const pullResult = await Vehicle.findByIdAndUpdate(
        deleted.vehicleId,
        {
          $pull: {
            vehicleExpenseHistoryMain: {
              amount: deleted.amount,
              reason: deleted.notes,
              paidAt: deleted.paidAt,
            },
          },
        },
        { new: true }
      );

      console.log("Vehicle after pull:", pullResult);
    } else {
      console.log("Not a vehicle expense or vehicleId missing.");
    }

    res.status(200).json({
      success: true,
      message: "Expense deleted successfully.",
      data: deleted,
    });
  } catch (error) {
    console.error("Delete expense error:", error);
    res.status(500).json({
      success: false,
      message: "Server error: " + error.message,
    });
  }
};



// ✅ Update Expense
exports.updateExpense = async (req, res) => {
  try {
    const expenseId = req.params.id;
    const { amount, type, notes, paidAt } = req.body;

    const updatedExpense = await Expense.findByIdAndUpdate(
      expenseId,
      {
        amount,
        type,
        notes,
        paidAt,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedExpense) {
      return res.status(404).json({ success: false, message: 'Expense not found.' });
    }

    res.json({
      success: true,
      message: 'Expense updated successfully.',
      data: updatedExpense,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get All Expenses
exports.getAllExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      total: expenses.length,
      data: expenses,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
