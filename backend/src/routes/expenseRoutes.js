const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expensesCtrl');
const { protect } = require('../middleware/auth');

router.use(protect)

// Create
router.post('/create', expenseController.createExpense);
router.delete("/delete/:id", expenseController.deleteExpense);

// Update
router.put('/edit/:id', expenseController.updateExpense);

// Get All
router.get('/getAll', expenseController.getAllExpenses);

module.exports = router;
