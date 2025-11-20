const express = require("express");
const memoController = require("../controllers/memoController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Protect all routes
router.use(protect);

// Collection Memos
router.post("/:tripId/collection-memos", memoController.createCollectionMemo);
router.get("/:tripId/collection-memos", memoController.getAllCollectionMemos);
router.put("/:tripId/collection-memos/:memoId", memoController.updateCollectionMemo);
router.delete("/:tripId/collection-memos/:memoId", memoController.deleteCollectionMemo);

// Balance Memos
router.post("/:tripId/balance-memos", memoController.createBalanceMemo);
router.get("/:tripId/balance-memos", memoController.getAllBalanceMemos);
router.put("/:tripId/balance-memos/:memoId", memoController.updateBalanceMemo);
router.delete("/:tripId/balance-memos/:memoId", memoController.deleteBalanceMemo);

module.exports = router;
