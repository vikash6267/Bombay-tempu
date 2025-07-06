const express = require("express")
const paymentController = require("../controllers/paymentController")
const { protect, restrictTo } = require("../middleware/auth")
const upload = require("../middleware/upload")

const router = express.Router()

// Protect all routes
router.use(protect)

/**
 * @swagger
 * /payments:
 *   get:
 *     summary: Get all payments
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, failed, cancelled]
 *       - in: query
 *         name: paymentType
 *         schema:
 *           type: string
 *           enum: [client_payment, fleet_owner_payment, advance_payment, expense_reimbursement]
 *       - in: query
 *         name: trip
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of payments retrieved successfully
 *   post:
 *     summary: Create a new payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Payment'
 *     responses:
 *       201:
 *         description: Payment created successfully
 */
router.route("/").get(paymentController.getAllPayments).post(restrictTo("admin"), paymentController.createPayment)

/**
 * @swagger
 * /payments/stats:
 *   get:
 *     summary: Get payment statistics
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment statistics retrieved successfully
 */
router.get("/stats", restrictTo("admin"), paymentController.getPaymentStats)

/**
 * @swagger
 * /payments/outstanding:
 *   get:
 *     summary: Get outstanding payments
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Outstanding payments retrieved successfully
 */
router.get("/outstanding", restrictTo("admin"), paymentController.getOutstandingPayments)

/**
 * @swagger
 * /payments/my-payments:
 *   get:
 *     summary: Get current user's payments
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User payments retrieved successfully
 */
router.get("/my-payments", paymentController.getMyPayments)

/**
 * @swagger
 * /payments/{id}:
 *   get:
 *     summary: Get payment by ID
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment retrieved successfully
 */
router
  .route("/:id")
  .get(paymentController.getPayment)
  .patch(restrictTo("admin"), paymentController.updatePayment)
  .delete(restrictTo("admin"), paymentController.deletePayment)

/**
 * @swagger
 * /payments/{id}/approve:
 *   patch:
 *     summary: Approve payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment approved successfully
 */
router.patch("/:id/approve", restrictTo("admin"), paymentController.approvePayment)

/**
 * @swagger
 * /payments/{id}/cancel:
 *   patch:
 *     summary: Cancel payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment cancelled successfully
 */
router.patch("/:id/cancel", restrictTo("admin"), paymentController.cancelPayment)

/**
 * @swagger
 * /payments/{id}/documents:
 *   post:
 *     summary: Upload payment documents
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               documentType:
 *                 type: string
 *                 enum: [receipt, invoice, bank_slip]
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Document uploaded successfully
 */
router.post("/:id/documents", upload.single("file"), paymentController.uploadDocument)

module.exports = router
