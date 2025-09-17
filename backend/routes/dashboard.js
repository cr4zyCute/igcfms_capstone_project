// routes/dashboard.js
import express from "express";
import db from "../db.js"; // your MySQL connection
const router = express.Router();

router.get("/summary", async (req, res) => {
  const [[users]] = await db.query("SELECT COUNT(*) as totalUsers FROM users");
  const [[funds]] = await db.query("SELECT COUNT(*) as activeFunds FROM fund_accounts WHERE is_active=1");
  const [[revenue]] = await db.query("SELECT SUM(amount) as totalRevenue FROM transactions WHERE type='Collection'");
  const [[expense]] = await db.query("SELECT SUM(amount) as totalExpense FROM transactions WHERE type='Disbursement'");
  const [[todayTx]] = await db.query("SELECT COUNT(*) as todayTransactions FROM transactions WHERE DATE(created_at)=CURDATE()");
  res.json({
    totalUsers: users.totalUsers,
    activeFunds: funds.activeFunds,
    totalRevenue: revenue.totalRevenue || 0,
    totalExpense: expense.totalExpense || 0,
    todayTransactions: todayTx.todayTransactions,
  });
});

router.get("/daily-revenue", async (req, res) => {
  const [rows] = await db.query(`
    SELECT DATE(created_at) as date, SUM(amount) as amount
    FROM transactions
    WHERE type='Collection'
    GROUP BY DATE(created_at)
    ORDER BY date DESC LIMIT 7
  `);
  res.json(rows.reverse());
});

router.get("/fund-distribution", async (req, res) => {
  const [rows] = await db.query(`
    SELECT name as name, current_balance as value
    FROM fund_accounts
    WHERE is_active=1
  `);
  res.json(rows);
});

router.get("/recent-logs", async (req, res) => {
  const [rows] = await db.query(`
    SELECT a.id, u.name as user, a.action, a.created_at
    FROM audit_logs a
    JOIN users u ON u.id = a.user_id
    ORDER BY a.created_at DESC
    LIMIT 10
  `);
  res.json(rows);
});

export default router;
