const Expense = require('../models/Expenses');
const Vehicle = require('../models/Vehicle');
const ActivityLog = require('../models/ActivityLog');

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
 await ActivityLog.create({
        user: req.user._id,
        action: 'expense',
        category: 'EXPENSE',
        description: `Created expense of ${amount} for ${type} - ${vehicleUpdateResult.registrationNumber} (${notes})`,
        details: {
          expenseId: expense._id,
          amount,
          type,
          notes,
          vehicleId
        },
        severity: 'INFO'
      });
}else{
 await ActivityLog.create({
        user: req.user._id,
        action: 'expense',
        category: 'EXPENSE',
        description: `Created expense of ${amount} for ${type}`,
        details: {
          expenseId: expense._id,
          amount,
          type,
          notes,
          vehicleId
        },
        severity: 'INFO'
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

    // Log the activity (if user is authenticated)
    if (req.user && req.user._id) {
      await ActivityLog.create({
        user: req.user._id,
        action: 'DELETE',
        category: 'EXPENSE',
        description: `Deleted expense of ${deleted.amount} for ${deleted.type}`,
        details: {
          expenseId: deleted._id,
          amount: deleted.amount,
          type: deleted.type,
          notes: deleted.notes
        },
        severity: 'WARNING'
      });
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

    // Log the activity (if user is authenticated)
    if (req.user && req.user._id) {
      await ActivityLog.create({
        user: req.user._id,
        action: 'UPDATE',
        category: 'EXPENSE',
        description: `Updated expense of ${amount} for ${type}`,
        details: {
          expenseId: updatedExpense._id,
          amount,
          type,
          notes
        },
        severity: 'INFO'
      });
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
    const expenses = await Expense.find()
      .populate("vehicleId", "registrationNumber") // populate only registrationNumber
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      total: expenses.length,
      data: expenses,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

