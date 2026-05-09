const express = require("express");
const router  = express.Router();
const { protect }   = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");
const {
  listWithdrawals,
  updateWithdrawal,
  getAdminStats,
  setAdmin,
} = require("../controllers/adminController");

// All admin routes require auth + admin role
router.use(protect, adminOnly);

router.get("/stats",                   getAdminStats);
router.get("/withdrawals",             listWithdrawals);
router.patch("/withdrawals/:id",       updateWithdrawal);
router.post("/set-admin",              setAdmin);

module.exports = router;
