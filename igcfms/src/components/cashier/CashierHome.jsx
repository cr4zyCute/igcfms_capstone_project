import React, { useState, useEffect } from "react";
import axios from "axios";

const CashierHome = () => {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({
    totalCollections: 0,
    totalDisbursements: 0,
    activeFunds: 0,
    todayTransactions: 0,
    pendingOverrides: 0,
    monthlyCollections: 0,
    weeklyDisbursements: 0,
    cashBalance: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [fundAccounts, setFundAccounts] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");

        // Fetch dashboard KPIs
        const dashboardRes = await axios.get(
          "http://localhost:8000/api/transactions",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Fetch fund accounts
        const fundsRes = await axios.get(
          "http://localhost:8000/api/fund-accounts",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const transactions = dashboardRes.data || [];
        const funds = fundsRes.data || [];

        // Calculate KPIs from actual data
        const today = new Date().toDateString();
        const thisMonth = new Date().getMonth();
        const thisWeek = getWeekStart();

        const todayTransactions = transactions.filter(
          (tx) => new Date(tx.created_at).toDateString() === today
        );

        const monthlyCollections = transactions
          .filter(
            (tx) =>
              tx.type === "Collection" &&
              new Date(tx.created_at).getMonth() === thisMonth
          )
          .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);

        const weeklyDisbursements = transactions
          .filter(
            (tx) =>
              tx.type === "Disbursement" && new Date(tx.created_at) >= thisWeek
          )
          .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);

        const totalCollections = transactions
          .filter((tx) => tx.type === "Collection")
          .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);

        const totalDisbursements = transactions
          .filter((tx) => tx.type === "Disbursement")
          .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);

        const cashBalance = funds
          .filter((fund) => fund.account_type === "Asset")
          .reduce(
            (sum, fund) => sum + parseFloat(fund.current_balance || 0),
            0
          );

        setKpis({
          totalCollections,
          totalDisbursements,
          activeFunds: funds.filter((fund) => fund.is_active).length,
          todayTransactions: todayTransactions.length,
          pendingOverrides: 0, // This would need a separate API call
          monthlyCollections,
          weeklyDisbursements,
          cashBalance,
        });

        setTransactions(transactions.slice(0, 10)); // Show latest 10 transactions
        setFundAccounts(funds);
        setError("");
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data");
        setKpis({
          totalCollections: 0,
          totalDisbursements: 0,
          activeFunds: 0,
          todayTransactions: 0,
          pendingOverrides: 0,
          monthlyCollections: 0,
          weeklyDisbursements: 0,
          cashBalance: 0,
        });
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    const getWeekStart = () => {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const numDaysPastSunday = dayOfWeek === 0 ? 0 : dayOfWeek;
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - numDaysPastSunday);
      weekStart.setHours(0, 0, 0, 0);
      return weekStart;
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-black flex items-center gap-3 mb-2">
            <i className="fas fa-cash-register" /> Cashier Dashboard
          </h2>
          <p className="text-sm text-gray-600">
            Transaction processing and financial operations management
          </p>
        </div>

        {/* Loading Stats Cards */}
        <div
          className="grid gap-5 mb-8"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          }}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="bg-white border-2 border-gray-100 rounded-xl p-5 h-28 animate-pulse"
            >
              <div className="w-3/5 h-4 bg-gray-200 rounded mb-3" />
              <div className="w-4/5 h-8 bg-gray-200 rounded mb-2" />
              <div className="w-2/5 h-3 bg-gray-200 rounded" />
            </div>
          ))}
        </div>

        {/* Loading Charts */}
        <div
          className="grid gap-6 mb-8"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white border-2 border-gray-100 rounded-xl p-6"
            >
              <div className="h-72 bg-gray-50 border-2 border-gray-200 rounded-lg flex items-center justify-center animate-pulse">
                <div className="text-gray-500 text-base text-center">
                  <i className="fas fa-cash-register fa-2x block mb-2" />
                  Loading Chart...
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
          <i className="fas fa-cash-register" /> Cashier Dashboard
        </h2>
        <p className="text-sm text-gray-600">
          Monitor transactions, fund accounts, and financial operations
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3">
          <i className="fas fa-exclamation-triangle" />
          <span>{error}</span>
        </div>
      )}

      {/* Primary KPIs */}
      <div className="grid gap-5 mb-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border-2 border-gray-100 bg-white p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
            <i className="fas fa-arrow-up" />
          </div>
          <div>
            <div className="text-sm text-gray-500">Total Collections</div>
            <div className="text-2xl font-semibold">
              ₱{kpis.totalCollections.toLocaleString()}
            </div>
          </div>
        </div>
        <div className="rounded-xl border-2 border-gray-100 bg-white p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
            <i className="fas fa-arrow-down" />
          </div>
          <div>
            <div className="text-sm text-gray-500">Total Disbursements</div>
            <div className="text-2xl font-semibold">
              ₱{kpis.totalDisbursements.toLocaleString()}
            </div>
          </div>
        </div>
        <div className="rounded-xl border-2 border-gray-100 bg-white p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
            <i className="fas fa-university" />
          </div>
          <div>
            <div className="text-sm text-gray-500">Active Fund Accounts</div>
            <div className="text-2xl font-semibold">{kpis.activeFunds}</div>
          </div>
        </div>
        <div className="rounded-xl border-2 border-gray-100 bg-white p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-yellow-100 text-yellow-600 flex items-center justify-center">
            <i className="fas fa-calendar-day" />
          </div>
          <div>
            <div className="text-sm text-gray-500">Today's Transactions</div>
            <div className="text-2xl font-semibold">
              {kpis.todayTransactions}
            </div>
          </div>
        </div>
      </div>

      {/* Secondary KPIs */}
      <div className="grid gap-5 mb-8 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border-2 border-gray-100 bg-white p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
            <i className="fas fa-calendar-alt" />
          </div>
          <div>
            <div className="text-sm text-gray-500">Monthly Collections</div>
            <div className="text-2xl font-semibold">
              ₱{kpis.monthlyCollections.toLocaleString()}
            </div>
          </div>
        </div>
        <div className="rounded-xl border-2 border-gray-100 bg-white p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
            <i className="fas fa-calendar-week" />
          </div>
          <div>
            <div className="text-sm text-gray-500">Weekly Disbursements</div>
            <div className="text-2xl font-semibold">
              ₱{kpis.weeklyDisbursements.toLocaleString()}
            </div>
          </div>
        </div>
        <div className="rounded-xl border-2 border-gray-100 bg-white p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <i className="fas fa-money-bill-wave" />
          </div>
          <div>
            <div className="text-sm text-gray-500">Cash Balance</div>
            <div className="text-2xl font-semibold">
              ₱{kpis.cashBalance.toLocaleString()}
            </div>
          </div>
        </div>
        <div className="rounded-xl border-2 border-gray-100 bg-white p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
            <i className="fas fa-exclamation-circle" />
          </div>
          <div>
            <div className="text-sm text-gray-500">Pending Overrides</div>
            <div className="text-2xl font-semibold">
              {kpis.pendingOverrides}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white border-2 border-gray-100 rounded-xl overflow-hidden mb-8">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <i className="fas fa-history" /> Recent Transactions
          </h3>
          <button
            className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-gray-200 hover:bg-gray-50 text-gray-700"
            onClick={() => window.location.reload()}
          >
            <i className="fas fa-sync-alt" /> Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-gray-50 text-gray-600 text-sm">
              <tr>
                <th className="px-5 py-3 font-medium">
                  <i className="fas fa-hashtag" /> ID
                </th>
                <th className="px-5 py-3 font-medium">
                  <i className="fas fa-exchange-alt" /> Type
                </th>
                <th className="px-5 py-3 font-medium">
                  <i className="fas fa-money-bill" /> Amount
                </th>
                <th className="px-5 py-3 font-medium">
                  <i className="fas fa-user" /> Recipient
                </th>
                <th className="px-5 py-3 font-medium">
                  <i className="fas fa-building" /> Department
                </th>
                <th className="px-5 py-3 font-medium">
                  <i className="fas fa-calendar" /> Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {transactions.length > 0 ? (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">#{tx.id}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium ${
                          tx.type === "Collection"
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {tx.type === "Collection" && (
                          <i className="fas fa-arrow-up" />
                        )}
                        {tx.type === "Disbursement" && (
                          <i className="fas fa-arrow-down" />
                        )}
                        {tx.type}
                      </span>
                    </td>
                    <td
                      className={`px-5 py-3 font-semibold ${
                        tx.type === "Collection"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {tx.type === "Collection" ? "+" : "-"}₱
                      {parseFloat(tx.amount || 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-3">{tx.recipient || "N/A"}</td>
                    <td className="px-5 py-3">{tx.department || "N/A"}</td>
                    <td className="px-5 py-3">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="px-5 py-8 text-center text-gray-500"
                  >
                    <i className="fas fa-inbox mr-2" /> No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fund Accounts Summary */}
      <div className="bg-white border-2 border-gray-100 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <i className="fas fa-university" /> Fund Accounts Overview
          </h3>
        </div>
        <div className="p-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {fundAccounts.slice(0, 6).map((fund) => (
            <div
              key={fund.id}
              className="rounded-xl border-2 border-gray-100 p-5"
            >
              <div className="flex items-start justify-between mb-4">
                <h4 className="font-semibold text-gray-800">{fund.name}</h4>
                <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 border border-gray-200">
                  {fund.code}
                </span>
              </div>
              <div className="text-2xl font-semibold text-gray-900 mb-2">
                ₱{parseFloat(fund.current_balance || 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">{fund.account_type}</div>
              <div className="text-xs text-gray-500">
                {fund.department || "No Department"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CashierHome;
