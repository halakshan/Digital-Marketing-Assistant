const { db, admin } = require("../config/firebase");

/* ─────────────────────────────────────────────────────────────────────────────
   GET /api/payout/accounts
   Freelancer reads their saved payment accounts
───────────────────────────────────────────────────────────────────────────── */
const getPayoutAccounts = async (req, res) => {
  const uid = req.user.uid;
  try {
    const snap = await db.collection("freelancer_payment_accounts").doc(uid).get();
    if (!snap.exists) return res.json({ success: true, accounts: [] });
    res.json({ success: true, accounts: snap.data().accounts || [] });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch payout accounts" });
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   POST /api/payout/accounts
   Add a new payout account (bank / PayPal / etc.)
───────────────────────────────────────────────────────────────────────────── */
const addPayoutAccount = async (req, res) => {
  const uid = req.user.uid;
  const { type, bankName, branchName, accountNumber, accountHolderName,
          nic, paypalEmail, label } = req.body;

  const VALID_TYPES = ["bank_lk", "paypal"];
  if (!VALID_TYPES.includes(type)) {
    return res.status(400).json({ message: "Invalid account type" });
  }

  // Validate per type
  if (type === "bank_lk") {
    if (!bankName || !accountNumber || !accountHolderName) {
      return res.status(400).json({ message: "Bank name, account number and account holder name are required" });
    }
  }
  if (type === "paypal") {
    if (!paypalEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paypalEmail)) {
      return res.status(400).json({ message: "Valid PayPal email is required" });
    }
  }

  try {
    const docRef = db.collection("freelancer_payment_accounts").doc(uid);
    const snap   = await docRef.get();
    const existing = snap.exists ? (snap.data().accounts || []) : [];

    const newAccount = {
      id:                String(Date.now()),
      type,
      label:             label || (type === "bank_lk" ? bankName : "PayPal"),
      isPrimary:         existing.length === 0,   // first account = primary
      createdAt:         new Date().toISOString(),
      ...(type === "bank_lk" ? {
        bankName,
        branchName:   branchName   || "",
        accountNumber,
        accountHolderName,
        nic:          nic          || "",
      } : {}),
      ...(type === "paypal" ? { paypalEmail } : {}),
    };

    await docRef.set({
      uid,
      accounts:  [...existing, newAccount],
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    res.json({ success: true, account: newAccount });
  } catch (err) {
    console.error("addPayoutAccount:", err.message);
    res.status(500).json({ message: "Failed to add payout account" });
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   PUT /api/payout/accounts/:accountId/primary
   Set an account as the primary payout destination
───────────────────────────────────────────────────────────────────────────── */
const setPrimaryAccount = async (req, res) => {
  const uid = req.user.uid;
  const { accountId } = req.params;
  try {
    const docRef = db.collection("freelancer_payment_accounts").doc(uid);
    const snap   = await docRef.get();
    if (!snap.exists) return res.status(404).json({ message: "No accounts found" });

    const accounts = (snap.data().accounts || []).map(a => ({
      ...a,
      isPrimary: a.id === accountId,
    }));

    await docRef.update({ accounts, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    res.json({ success: true, accounts });
  } catch (err) {
    res.status(500).json({ message: "Failed to update primary account" });
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   DELETE /api/payout/accounts/:accountId
───────────────────────────────────────────────────────────────────────────── */
const deletePayoutAccount = async (req, res) => {
  const uid = req.user.uid;
  const { accountId } = req.params;
  try {
    const docRef = db.collection("freelancer_payment_accounts").doc(uid);
    const snap   = await docRef.get();
    if (!snap.exists) return res.status(404).json({ message: "No accounts found" });

    let accounts = (snap.data().accounts || []).filter(a => a.id !== accountId);
    // If we deleted the primary and there are others, promote first
    if (accounts.length > 0 && !accounts.some(a => a.isPrimary)) {
      accounts[0].isPrimary = true;
    }

    await docRef.update({ accounts, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    res.json({ success: true, accounts });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete account" });
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   GET /api/payout/withdrawals
   Freelancer's withdrawal history (sorted client-side — no composite index needed)
───────────────────────────────────────────────────────────────────────────── */
const getWithdrawals = async (req, res) => {
  const uid = req.user.uid;
  try {
    const snap = await db.collection("withdrawal_requests")
      .where("freelancerUid", "==", uid)
      .get();

    const withdrawals = snap.docs
      .map(d => {
        const data = d.data();
        return {
          id:          d.id,
          ...data,
          createdAt:   data.createdAt?.toDate?.()?.toISOString()   || null,
          processedAt: data.processedAt?.toDate?.()?.toISOString() || null,
          _ts:         data.createdAt?.toMillis?.() || 0,
        };
      })
      .sort((a, b) => b._ts - a._ts)
      .map(({ _ts, ...rest }) => rest);

    res.json({ success: true, withdrawals });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch withdrawals" });
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   GET /api/payout/balance
   Freelancer's balance (no composite index — filter in JS)
───────────────────────────────────────────────────────────────────────────── */
const getBalance = async (req, res) => {
  const uid = req.user.uid;
  try {
    const [paymentsSnap, withdrawalsSnap] = await Promise.all([
      db.collection("payments").where("freelancerUid", "==", uid).get(),
      db.collection("withdrawal_requests").where("freelancerUid", "==", uid).get(),
    ]);

    let escrowed  = 0;
    let released  = 0;
    let withdrawn = 0;

    paymentsSnap.docs.forEach(d => {
      const data = d.data();
      if (data.status === "escrowed") escrowed += (data.freelancerNet || 0);
      if (data.status === "released") released += (data.freelancerNet || 0);
    });

    withdrawalsSnap.docs.forEach(d => {
      const data = d.data();
      // Count pending + processing + completed as "in-flight" so available is accurate
      if (["pending","processing","completed"].includes(data.status)) {
        withdrawn += (data.amount || 0);
      }
    });

    const available = Math.max(0, released - withdrawn);

    res.json({
      success: true,
      balance: {
        escrowed:  Math.max(0, escrowed),
        available,
        withdrawn,
        total:     escrowed + released,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch balance" });
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   POST /api/payout/request
   Freelancer submits a withdrawal request
   Body: { amount, accountId? }  — if no accountId, uses primary account
───────────────────────────────────────────────────────────────────────────── */
const requestWithdrawal = async (req, res) => {
  const uid = req.user.uid;
  const { amount, accountId } = req.body;

  const amt = Number(amount);
  if (!amt || amt < 100) {
    return res.status(400).json({ message: "Minimum withdrawal is LKR 100" });
  }

  try {
    // ── 1. Get balance ──────────────────────────────────────────────────────
    const [paymentsSnap, withdrawalsSnap] = await Promise.all([
      db.collection("payments").where("freelancerUid", "==", uid).get(),
      db.collection("withdrawal_requests").where("freelancerUid", "==", uid).get(),
    ]);

    let released  = 0;
    let withdrawn = 0;
    paymentsSnap.docs.forEach(d => {
      const data = d.data();
      if (data.status === "released") released += (data.freelancerNet || 0);
    });
    withdrawalsSnap.docs.forEach(d => {
      const data = d.data();
      if (["pending","processing","completed"].includes(data.status)) {
        withdrawn += (data.amount || 0);
      }
    });
    const available = Math.max(0, released - withdrawn);

    if (amt > available) {
      return res.status(400).json({ message: `Insufficient balance. Available: LKR ${available.toLocaleString()}` });
    }

    // ── 2. Get payout account ──────────────────────────────────────────────
    const accSnap = await db.collection("freelancer_payment_accounts").doc(uid).get();
    const accounts = accSnap.exists ? (accSnap.data().accounts || []) : [];
    if (accounts.length === 0) {
      return res.status(400).json({ message: "No payment account added. Please add one first." });
    }
    const account = accountId
      ? accounts.find(a => a.id === accountId)
      : accounts.find(a => a.isPrimary) || accounts[0];

    if (!account) {
      return res.status(400).json({ message: "Payment account not found" });
    }

    // ── 3. Get freelancer name ─────────────────────────────────────────────
    const profileSnap = await db.collection("freelancer_profiles").doc(uid).get();
    const freelancerName = profileSnap.exists ? profileSnap.data().fullName || "Freelancer" : "Freelancer";

    // ── 4. Create withdrawal record (auto-completed) ───────────────────────
    const now = admin.firestore.FieldValue.serverTimestamp();
    const wdRef = db.collection("withdrawal_requests").doc();
    await wdRef.set({
      id:              wdRef.id,
      freelancerUid:   uid,
      freelancerName,
      amount:          amt,
      currency:        "LKR",
      status:          "completed",   // auto-completed — no admin needed
      accountId:       account.id,
      accountType:     account.type,
      accountLabel:    account.label,
      accountDetail:   account.type === "bank_lk"
        ? `${account.bankName} ••••${(account.accountNumber||"").slice(-4)}`
        : account.paypalEmail,
      createdAt:       now,
      processedAt:     now,
      note:            "",
    });

    // ── 5. Update freelancer totalEarnings ─────────────────────────────────
    const profileRef = db.collection("freelancer_profiles").doc(uid);
    const current    = profileSnap.exists ? (profileSnap.data().totalEarnings || 0) : 0;
    await profileRef.update({ totalEarnings: current + amt });

    // ── 6. Notify freelancer ───────────────────────────────────────────────
    await db.collection("notifications").add({
      userId:    uid,
      type:      "payment",
      title:     "Withdrawal Successful! 🎉",
      body:      `LKR ${amt.toLocaleString()} has been withdrawn to ${account.label}. Check your account within 1–3 business days.`,
      read:      false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({
      success: true,
      message: "Withdrawal successful",
      withdrawal: { id: wdRef.id, amount: amt, status: "completed", accountLabel: account.label },
    });
  } catch (err) {
    console.error("requestWithdrawal:", err.message);
    res.status(500).json({ message: "Failed to submit withdrawal request" });
  }
};

module.exports = {
  getPayoutAccounts,
  addPayoutAccount,
  setPrimaryAccount,
  deletePayoutAccount,
  getWithdrawals,
  getBalance,
  requestWithdrawal,
};
