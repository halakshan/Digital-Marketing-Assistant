const express = require("express");
const router  = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getPayoutAccounts,
  addPayoutAccount,
  setPrimaryAccount,
  deletePayoutAccount,
  getWithdrawals,
  getBalance,
  requestWithdrawal,
} = require("../controllers/payoutController");

router.get("/accounts",                        protect, getPayoutAccounts);
router.post("/accounts",                       protect, addPayoutAccount);
router.put("/accounts/:accountId/primary",     protect, setPrimaryAccount);
router.delete("/accounts/:accountId",          protect, deletePayoutAccount);
router.get("/withdrawals",                     protect, getWithdrawals);
router.get("/balance",                         protect, getBalance);
router.post("/request",                        protect, requestWithdrawal);

module.exports = router;
