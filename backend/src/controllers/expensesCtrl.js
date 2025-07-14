const Expense = require('../models/Expenses');

// ✅ Create Expense
exports.createExpense = async (req, res) => {
  try {
    const { amount, type, notes, paidAt } = req.body;

    if (!amount || !type) {
      return res.status(400).json({ success: false, message: 'Amount and Type are required.' });
    }

    const expense = await Expense.create({
      amount,
      type,
      notes,
      paidAt,
    });

    res.status(201).json({
      success: true,
      message: 'Expense created successfully.',
      data: expense,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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

    res.status(200).json({
      success: true,
      message: "Expense deleted successfully.",
      data: deleted,
    });
  } catch (error) {
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
