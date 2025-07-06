const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
     required: true,
    },
    notes: {
      type: String,
      default: '',
    },
    paidAt: {
      type: Date,
      default: Date.now,
    },
   
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Expense', expenseSchema);
