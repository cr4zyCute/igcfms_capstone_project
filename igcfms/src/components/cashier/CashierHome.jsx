import React, { useState, useEffect } from "react";
import "./css/cashierdashboard.css";

const CashierHome = () => {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({
    totalCollections: 0,
    totalDisbursements: 0,
    activeFunds: 0,
    todayTransactions: 0,
  });
  const [transactions, setTransactions] = useState([]);

useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/cashier/dashboard');
      const data = await res.json();
      setKpis(data.kpis);
      setTransactions(data.transactions);
    } catch (err) {
      // Optionally handle error
      setKpis({
        totalCollections: 0,
        totalDisbursements: 0,
        activeFunds: 0,
        todayTransactions: 0,
      });
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);

  if (loading) {
    return (
      <div className="cashier-spinner-container">
        <div className="cashier-spinner"></div>
        <div className="cashier-loading-text">Loading cashier dashboard...</div>
      </div>
    );
  }

  return (
    <div className="cashier-page">
      <h2 className="cashier-title">Cashier Dashboard</h2>
      <div className="cashier-kpi-row">
        <div className="cashier-kpi-card">
          <div className="kpi-label">Total Collections</div>
          <div className="kpi-value">₱{kpis.totalCollections.toLocaleString()}</div>
        </div>
        <div className="cashier-kpi-card">
          <div className="kpi-label">Total Disbursements</div>
          <div className="kpi-value">₱{kpis.totalDisbursements.toLocaleString()}</div>
        </div>
        <div className="cashier-kpi-card">
          <div className="kpi-label">Active Funds</div>
          <div className="kpi-value">{kpis.activeFunds}</div>
        </div>
        <div className="cashier-kpi-card">
          <div className="kpi-label">Today's Transactions</div>
          <div className="kpi-value">{kpis.todayTransactions}</div>
        </div>
      </div>

      <div className="cashier-table-card">
        <h3>Recent Transactions</h3>
        <table className="cashier-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Amount</th>
              <th>By</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length > 0 ? (
              transactions.map((tx) => (
                <tr key={tx.id}>
                  <td>
                    <span className={`tx-type ${tx.type === "Collection" ? "collection" : "disbursement"}`}>
                      {tx.type}
                    </span>
                  </td>
                  <td>₱{tx.amount.toLocaleString()}</td>
                  <td>{tx.by}</td>
                  <td>{tx.date}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="no-tx">No transactions found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CashierHome;