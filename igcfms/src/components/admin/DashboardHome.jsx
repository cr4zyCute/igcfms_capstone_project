import React, { useEffect, useState } from "react";
// import "../admin/css/admin.css";
import "../admin/css/home.css";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
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

const API_BASE = "http://localhost:8000/api";
useEffect(() => {
  const fetchData = async () => {
    try {
      const summaryResponse = await fetch(`${API_BASE}/dashboard/summary`);
      if (!summaryResponse.ok) throw new Error('Summary API failed');
      const summaryData = await summaryResponse.json();
      setStats(summaryData);
      
      // Repeat for other endpoints...
      const revenueResponse = await fetch(`${API_BASE}/dashboard/daily-revenue`);
      if (!revenueResponse.ok) throw new Error('Revenue API failed');
      const revenueData = await revenueResponse.json();
      setDailyRevenue(revenueData);
      
      const fundResponse = await fetch(`${API_BASE}/dashboard/fund-distribution`);
      if (!fundResponse.ok) throw new Error('Fund API failed');
      const fundData = await fundResponse.json();
      setFundDistribution(fundData);
      
      const logsResponse = await fetch(`${API_BASE}/dashboard/recent-logs`);
      if (!logsResponse.ok) throw new Error('Logs API failed');
      const logsData = await logsResponse.json();
      setAuditLogs(logsData);
      
    } catch (err) {
      console.error("API Error:", err);
      // You might want to set some error state here to display to the user
    }
  };
  
  fetchData();
}, []);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AA00FF", "#FF4444"];

  return (
    <div className="admin-page grid gap-6 p-6 bg-gray-50">
      <h2 className="text-2xl font-semibold mb-4">IGCFMS Admin Dashboard</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard label="Users" value={stats.totalUsers} />
        <StatCard label="Active Funds" value={stats.activeFunds} />
        <StatCard label="Revenue (₱)" value={stats.totalRevenue.toLocaleString()} />
        <StatCard label="Expense (₱)" value={stats.totalExpense.toLocaleString()} />
        <StatCard label="Today's Transactions" value={stats.todayTransactions} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Daily Revenue Line Chart */}
        <div className="card bg-white rounded-2xl shadow p-4">
          <h3 className="text-lg font-medium mb-2">Daily Revenue</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
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
                label
              >
                {fundDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Logs */}
      <div className="card bg-white rounded-2xl shadow p-4 mt-6">
        <h3 className="text-lg font-medium mb-2">Recent Activity</h3>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left border-b">
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
                  <td className="p-2">{new Date(log.created_at).toLocaleString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="p-2 text-center text-gray-400">
                  No recent activity
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// KPI Card Component
const StatCard = ({ label, value }) => (
  <div className="card p-4 text-center bg-white rounded-2xl shadow">
    <p className="text-gray-500 text-sm">{label}</p>
    <p className="text-2xl font-bold mt-1">{value}</p>
  </div>
);

export default DashboardHome;
