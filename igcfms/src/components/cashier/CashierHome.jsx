import React, { useState, useEffect, useMemo } from "react";
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
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");

        // Fetch dashboard KPIs
        const dashboardRes = await axios.get(
          "/api/transactions",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Fetch fund accounts
        const fundsRes = await axios.get(
          "/api/fund-accounts",
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

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter and search transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Filter by type
    if (filterType !== "All") {
      filtered = filtered.filter((tx) => tx.type === filterType);
    }

    // Search by recipient, department, or ID
    if (searchTerm) {
      filtered = filtered.filter(
        (tx) =>
          tx.recipient?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.id?.toString().includes(searchTerm)
      );
    }

    return filtered;
  }, [transactions, filterType, searchTerm]);

  // Pagination
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredTransactions.slice(startIndex, endIndex);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      window.location.reload();
    } finally {
      setRefreshing(false);
    }
  };

  // Format time
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Calculate net flow
  const netFlow = kpis.totalCollections - kpis.totalDisbursements;

  if (loading) {
    return (
      <div className="p-6 bg-white min-h-screen">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-black flex items-center gap-3 mb-2">
            <i className="fas fa-cash-register" /> Cashier Dashboard
          </h2>
          <p className="text-sm text-gray-700">
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
              className="bg-white border-2 border-black rounded-lg p-5 h-28 animate-pulse"
            >
              <div className="w-3/5 h-4 bg-gray-300 rounded mb-3" />
              <div className="w-4/5 h-8 bg-gray-400 rounded mb-2" />
              <div className="w-2/5 h-3 bg-gray-300 rounded" />
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
              className="bg-white border-2 border-black rounded-lg p-6"
            >
              <div className="h-72 bg-gray-100 border-2 border-gray-400 rounded-lg flex items-center justify-center animate-pulse">
                <div className="text-gray-700 text-base text-center">
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
    <div className="p-6 bg-white min-h-screen">
      {/* Enhanced Header with Clock */}
      <div className="mb-6 pb-4 border-b-2 border-black">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-black flex items-center gap-3">
              <i className="fas fa-cash-register" /> Cashier Dashboard
            </h2>
            <p className="text-sm text-gray-700 mt-2">
              Monitor transactions, fund accounts, and financial operations
            </p>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-3xl font-bold text-black tabular-nums">
              {formatTime(currentTime)}
            </div>
            <div className="text-sm text-gray-700 font-semibold mt-1">
              {formatDate(currentTime)}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border-2 border-black bg-gray-100 text-black px-4 py-3">
          <i className="fas fa-exclamation-triangle" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Primary KPIs */}
      <div className="grid gap-5 mb-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border-2 border-black bg-white p-5 flex items-center gap-4 hover:bg-black hover:text-white transition-all duration-300 group">
          <div className="h-12 w-12 rounded-lg bg-black text-white flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all duration-300">
            <i className="fas fa-arrow-up" />
          </div>
          <div>
            <div className="text-sm text-gray-700 group-hover:text-gray-300">Total Collections</div>
            <div className="text-2xl font-bold text-black group-hover:text-white">
              ₱{kpis.totalCollections.toLocaleString()}
            </div>
          </div>
        </div>
        <div className="rounded-lg border-2 border-black bg-white p-5 flex items-center gap-4 hover:bg-black hover:text-white transition-all duration-300 group">
          <div className="h-12 w-12 rounded-lg bg-black text-white flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all duration-300">
            <i className="fas fa-arrow-down" />
          </div>
          <div>
            <div className="text-sm text-gray-700 group-hover:text-gray-300">Total Disbursements</div>
            <div className="text-2xl font-bold text-black group-hover:text-white">
              ₱{kpis.totalDisbursements.toLocaleString()}
            </div>
          </div>
        </div>
        <div className="rounded-lg border-2 border-black bg-white p-5 flex items-center gap-4 hover:bg-black hover:text-white transition-all duration-300 group">
          <div className="h-12 w-12 rounded-lg bg-black text-white flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all duration-300">
            <i className="fas fa-university" />
          </div>
          <div>
            <div className="text-sm text-gray-700 group-hover:text-gray-300">Active Fund Accounts</div>
            <div className="text-2xl font-bold text-black group-hover:text-white">{kpis.activeFunds}</div>
          </div>
        </div>
        <div className="rounded-lg border-2 border-black bg-white p-5 flex items-center gap-4 hover:bg-black hover:text-white transition-all duration-300 group">
          <div className="h-12 w-12 rounded-lg bg-black text-white flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all duration-300">
            <i className="fas fa-calendar-day" />
          </div>
          <div>
            <div className="text-sm text-gray-700 group-hover:text-gray-300">Today's Transactions</div>
            <div className="text-2xl font-bold text-black group-hover:text-white">
              {kpis.todayTransactions}
            </div>
          </div>
        </div>
      </div>

      {/* Net Flow Summary */}
      <div className="mb-6 p-5 rounded-lg border-2 border-black bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600 font-semibold mb-1">Net Cash Flow</div>
            <div className={`text-3xl font-black ${
              netFlow >= 0 ? 'text-black' : 'text-gray-700'
            }`}>
              {netFlow >= 0 ? '+' : ''}₱{netFlow.toLocaleString()}
            </div>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="text-center">
              <div className="text-gray-600 font-semibold">Collections</div>
              <div className="text-lg font-bold text-black">₱{kpis.totalCollections.toLocaleString()}</div>
            </div>
            <div className="h-12 w-px bg-black"></div>
            <div className="text-center">
              <div className="text-gray-600 font-semibold">Disbursements</div>
              <div className="text-lg font-bold text-black">₱{kpis.totalDisbursements.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary KPIs */}
      <div className="grid gap-5 mb-8 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border-2 border-gray-400 bg-gray-50 p-5 flex items-center gap-4 hover:border-black hover:bg-gray-200 transition-all duration-300 group">
          <div className="h-12 w-12 rounded-lg bg-gray-800 text-white flex items-center justify-center group-hover:bg-black transition-all duration-300">
            <i className="fas fa-calendar-alt" />
          </div>
          <div>
            <div className="text-sm text-gray-600">Monthly Collections</div>
            <div className="text-2xl font-bold text-black">
              ₱{kpis.monthlyCollections.toLocaleString()}
            </div>
          </div>
        </div>
        <div className="rounded-lg border-2 border-gray-400 bg-gray-50 p-5 flex items-center gap-4 hover:border-black hover:bg-gray-200 transition-all duration-300 group">
          <div className="h-12 w-12 rounded-lg bg-gray-800 text-white flex items-center justify-center group-hover:bg-black transition-all duration-300">
            <i className="fas fa-calendar-week" />
          </div>
          <div>
            <div className="text-sm text-gray-600">Weekly Disbursements</div>
            <div className="text-2xl font-bold text-black">
              ₱{kpis.weeklyDisbursements.toLocaleString()}
            </div>
          </div>
        </div>
        <div className="rounded-lg border-2 border-gray-400 bg-gray-50 p-5 flex items-center gap-4 hover:border-black hover:bg-gray-200 transition-all duration-300 group">
          <div className="h-12 w-12 rounded-lg bg-gray-800 text-white flex items-center justify-center group-hover:bg-black transition-all duration-300">
            <i className="fas fa-money-bill-wave" />
          </div>
          <div>
            <div className="text-sm text-gray-600">Cash Balance</div>
            <div className="text-2xl font-bold text-black">
              ₱{kpis.cashBalance.toLocaleString()}
            </div>
          </div>
        </div>
        <div className="rounded-lg border-2 border-gray-400 bg-gray-50 p-5 flex items-center gap-4 hover:border-black hover:bg-gray-200 transition-all duration-300 group">
          <div className="h-12 w-12 rounded-lg bg-gray-800 text-white flex items-center justify-center group-hover:bg-black transition-all duration-300">
            <i className="fas fa-exclamation-circle" />
          </div>
          <div>
            <div className="text-sm text-gray-600">Pending Overrides</div>
            <div className="text-2xl font-bold text-black">
              {kpis.pendingOverrides}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white border-2 border-black rounded-lg overflow-hidden mb-8 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-5 py-4 border-b-2 border-black bg-black text-white">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <i className="fas fa-history" /> Recent Transactions ({filteredTransactions.length})
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 pr-3 py-2 text-sm rounded-md border-2 border-white bg-black text-white placeholder-gray-400 focus:bg-white focus:text-black transition-all duration-300 w-48"
              />
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-white" />
            </div>
            {/* Filter */}
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-sm rounded-md border-2 border-white bg-black text-white font-semibold hover:bg-white hover:text-black transition-all duration-300"
            >
              <option value="All">All Types</option>
              <option value="Collection">Collections</option>
              <option value="Disbursement">Disbursements</option>
            </select>
            {/* Refresh */}
            <button
              className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border-2 border-white hover:bg-white hover:text-black text-white font-semibold transition-all duration-300 disabled:opacity-50"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <i className={`fas fa-sync-alt ${refreshing ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-gray-200 text-black text-sm border-b-2 border-black">
              <tr>
                <th className="px-5 py-3 font-bold">
                  <i className="fas fa-hashtag" /> ID
                </th>
                <th className="px-5 py-3 font-bold">
                  <i className="fas fa-exchange-alt" /> Type
                </th>
                <th className="px-5 py-3 font-bold">
                  <i className="fas fa-money-bill" /> Amount
                </th>
                <th className="px-5 py-3 font-bold">
                  <i className="fas fa-user" /> Recipient
                </th>
                <th className="px-5 py-3 font-bold">
                  <i className="fas fa-building" /> Department
                </th>
                <th className="px-5 py-3 font-bold">
                  <i className="fas fa-calendar" /> Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300 text-sm">
              {paginatedTransactions.length > 0 ? (
                paginatedTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-100 transition-colors duration-200">
                    <td className="px-5 py-3 font-semibold">#{tx.id}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-bold border-2 ${
                          tx.type === "Collection"
                            ? "bg-white text-black border-black"
                            : "bg-black text-white border-black"
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
                      className="px-5 py-3 font-bold text-black"
                    >
                      {tx.type === "Collection" ? "+" : "-"}₱
                      {parseFloat(tx.amount || 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-gray-800">{tx.recipient || "N/A"}</td>
                    <td className="px-5 py-3 text-gray-800">{tx.department || "N/A"}</td>
                    <td className="px-5 py-3 text-gray-800">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="px-5 py-8 text-center text-gray-600"
                  >
                    <i className="fas fa-inbox text-4xl block mb-3" />
                    <p className="font-bold">No transactions found.</p>
                    {(searchTerm || filterType !== "All") && (
                      <button
                        onClick={() => {
                          setSearchTerm("");
                          setFilterType("All");
                          setCurrentPage(1);
                        }}
                        className="mt-3 px-4 py-2 bg-black text-white rounded-md font-semibold hover:bg-gray-800 transition-all"
                      >
                        Clear Filters
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t-2 border-black bg-gray-50 flex items-center justify-between">
            <div className="text-sm text-gray-700 font-semibold">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} transactions
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border-2 border-black rounded-md font-bold text-sm hover:bg-black hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <i className="fas fa-chevron-left" /> Prev
              </button>
              <div className="flex gap-1">
                {[...Array(totalPages)].map((_, idx) => {
                  const page = idx + 1;
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 border-2 rounded-md font-bold text-sm transition-all ${
                          currentPage === page
                            ? 'bg-black text-white border-black'
                            : 'border-black hover:bg-black hover:text-white'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page} className="px-2 py-1">...</span>;
                  }
                  return null;
                })}
              </div>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border-2 border-black rounded-md font-bold text-sm hover:bg-black hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next <i className="fas fa-chevron-right" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Fund Accounts Summary */}
      <div className="bg-white border-2 border-black rounded-lg overflow-hidden shadow-lg">
        <div className="px-5 py-4 border-b-2 border-black bg-black text-white">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <i className="fas fa-university" /> Fund Accounts Overview
          </h3>
        </div>
        <div className="p-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {fundAccounts.slice(0, 6).map((fund) => (
            <div
              key={fund.id}
              className="rounded-lg border-2 border-black p-5 hover:bg-black hover:text-white transition-all duration-300 group"
            >
              <div className="flex items-start justify-between mb-4">
                <h4 className="font-bold text-black group-hover:text-white">{fund.name}</h4>
                <span className="text-xs px-2 py-1 rounded bg-black text-white border-2 border-black group-hover:bg-white group-hover:text-black font-semibold">
                  {fund.code}
                </span>
              </div>
              <div className="text-2xl font-bold text-black group-hover:text-white mb-2">
                ₱{parseFloat(fund.current_balance || 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-700 group-hover:text-gray-300 font-semibold">{fund.account_type}</div>
              <div className="text-xs text-gray-600 group-hover:text-gray-400">
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
