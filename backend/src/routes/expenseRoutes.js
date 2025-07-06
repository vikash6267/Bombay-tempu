const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expensesCtrl');

// Create
router.post('/create', expenseController.createExpense);

// Update
router.put('/edit/:id', expenseController.updateExpense);

// Get All
router.get('/getAll', expenseController.getAllExpenses);

module.exports = router;
