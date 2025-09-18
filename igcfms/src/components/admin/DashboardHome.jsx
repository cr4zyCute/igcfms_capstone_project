import React, { useEffect, useState } from "react";
import "../admin/css/home.css";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, 
} from "recharts";

const DashboardHome = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeFunds: 0,
    totalRevenue: 0,
    totalExpense: 0,
    todayTransactions: 0,
  });
  const [dailyRevenue, setDailyRevenue] = useState([]);
  const [fundDistribution, setFundDistribution] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [topAccounts, setTopAccounts] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = "http://localhost:8000/api";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('auth_token');
        if (!token) {
          setError("No authentication token found. Please log in again.");
          setLoading(false);
          return;
        }

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        };

        // Helper to fetch and log errors
        const fetchWithLog = async (url) => {
          const res = await fetch(url, { headers });
          if (!res.ok) {
            const text = await res.text();
            console.error(`API error for ${url}:`, res.status, text);
            throw new Error(`API ${url} failed: ${res.status} ${text}`);
          }
          return res.json();
        };

        const [
          summaryData,
          revenueData,
          fundData,
          logsData,
          transactionsData
        ] = await Promise.all([
          fetchWithLog(`${API_BASE}/dashboard/summary`),
          fetchWithLog(`${API_BASE}/dashboard/daily-revenue`),
          fetchWithLog(`${API_BASE}/dashboard/fund-distribution`),
          fetchWithLog(`${API_BASE}/dashboard/recent-logs`),
          fetchWithLog(`${API_BASE}/dashboard/recent-transactions`)
        ]);

        setStats(summaryData);
        setDailyRevenue(revenueData);
        setFundDistribution(fundData);
        setAuditLogs(logsData);
        setRecentTransactions(transactionsData);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('auth_token');
        if (!token) throw new Error("No authentication token found. Please log in again.");

        const headers = { Authorization: `Bearer ${token}` };

        // Fetch Top Fund Accounts
        const accRes = await fetch(`${API_BASE}/dashboard/top-fund-accounts`, { headers });
        if (!accRes.ok) throw new Error("Failed to fetch top fund accounts");
        const accData = await accRes.json();
        setTopAccounts(accData);

        // Fetch Monthly Revenue
        const revRes = await fetch(`${API_BASE}/dashboard/monthly-revenue`, { headers });
        if (!revRes.ok) throw new Error("Failed to fetch monthly revenue");
        const revData = await revRes.json();
        setMonthlyRevenue(revData);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    fetchAnalytics();
  }, []);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AA00FF", "#FF4444"];

  if (loading) {
    return (
      <div className="admin-page grid gap-6 p-6 bg-gray-50">
        <div className="spinner-container">
          <div className="spinner"></div>
          <div className="text-xl mt-4">Loading dashboard data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page grid gap-6 p-6 bg-gray-50">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error: </strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page grid gap-6 p-6 bg-gray-50">
      <h2 className="text-2xl font-semibold mb-4">IGCFMS Admin Dashboard</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard label="Active Users" value={stats.totalUsers} icon="" />
        <StatCard label="Active Funds" value={stats.activeFunds} icon="" />
        <StatCard label="Total Revenue (₱)" value={stats.totalRevenue.toLocaleString()} icon="" />
        <StatCard label="Total Expense (₱)" value={stats.totalExpense.toLocaleString()} icon="" />
        <StatCard label="Today's Transactions" value={stats.todayTransactions} icon="" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Daily Revenue Line Chart */}
        <div className="card bg-white rounded-2xl shadow p-4">
          <h3 className="text-lg font-medium mb-2">Daily Revenue (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => [`₱${value.toLocaleString()}`, 'Amount']} />
              <Legend />
              <Line type="monotone" dataKey="amount" stroke="#0088FE" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Fund Distribution Pie Chart */}
        <div className="card bg-white rounded-2xl shadow p-4">
          <h3 className="text-lg font-medium mb-2">Fund Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                dataKey="value"
                data={fundDistribution}
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ name, value }) => `${name}: ₱${value.toLocaleString()}`}
              >
                {fundDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `₱${value.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity and Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Recent Logs */}
        <div className="card bg-white rounded-2xl shadow p-4">
          <h3 className="text-lg font-medium mb-2">Recent Activity</h3>
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left border-b bg-gray-50">
                  <th className="p-2">User</th>
                  <th className="p-2">Action</th>
                  <th className="p-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length > 0 ? (
                  auditLogs.map(log => (
                    <tr key={log.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">{log.user}</td>
                      <td className="p-2">{log.action}</td>
                      <td className="p-2 text-xs text-gray-500">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="p-4 text-center text-gray-400">
                      No recent activity
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card bg-white rounded-2xl shadow p-4">
          <h3 className="text-lg font-medium mb-2">Recent Transactions</h3>
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left border-b bg-gray-50">
                  <th className="p-2">Type</th>
                  <th className="p-2">Amount</th>
                  <th className="p-2">By</th>
                  <th className="p-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.length > 0 ? (
                  recentTransactions.map(transaction => (
                    <tr key={transaction.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          transaction.type === 'Collection' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {transaction.type}
                        </span>
                      </td>
                      <td className="p-2 font-mono">₱{transaction.amount.toLocaleString()}</td>
                      <td className="p-2">{transaction.created_by}</td>
                      <td className="p-2 text-xs text-gray-500">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="p-4 text-center text-gray-400">
                      No recent transactions
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Top Accounts and Monthly Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Top 5 Fund Accounts */}
        <div className="card bg-white rounded-2xl shadow p-4">
          <h3 className="text-lg font-medium mb-2">Top 5 Fund Accounts by Balance</h3>
          <div className="max-h-80 overflow-y-auto">
            <ul>
              {topAccounts.map(acc => (
                <li key={acc.id} className="flex justify-between py-1 border-b last:border-b-0">
                  <span>{acc.name || acc.account_name}</span>
                  <span className="font-mono">₱{Number(acc.balance).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Monthly Revenue Trend */}
        <div className="card bg-white rounded-2xl shadow p-4">
          <h3 className="text-lg font-medium mb-2">Monthly Revenue Trend</h3>
          <div className="max-h-80 overflow-y-auto">
            <ul>
              {monthlyRevenue.map(row => (
                <li key={row.month} className="flex justify-between py-1 border-b last:border-b-0">
                  <span>{row.month}</span>
                  <span className="font-mono">₱{Number(row.total).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced KPI Card Component
const StatCard = ({ label, value, icon }) => (
  <div className="card p-4 text-center bg-white rounded-2xl shadow hover:shadow-md transition-shadow">
    <div className="text-2xl mb-2">{icon}</div>
    <p className="text-gray-500 text-sm font-medium">{label}</p>
    <p className="text-2xl font-bold mt-1 text-gray-800">{value}</p>
  </div>
);

export default DashboardHome;