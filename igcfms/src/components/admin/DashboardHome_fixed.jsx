// TEMPORARY FIX - Copy this handleYearEndClosing function to replace the broken one

const handleYearEndClosing = async () => {
  setYearEndLoading(true);
  setYearEndError(null);
  setYearEndSuccess(null);
  try {
    const token = localStorage.getItem('token');
    const authHeader = `Bearer ${token}`;
    const headers = { 'Authorization': authHeader, 'Content-Type': 'application/json' };
    
    // Archive current year data to reports
    const archivePayload = {
      year: new Date().getFullYear(),
      stats: stats,
      transactions: recentTransactions,
      monthlyData: monthlyRevenue,
      departmentStats: departmentStats,
      auditLogs: auditLogs,
      archivedAt: new Date().toISOString()
    };
    
    // Send to backend to store in reports/archive
    const url = `${API_BASE}/year-end-closing`;
    const response = await axios.post(url, archivePayload, { headers });
    
    const successMsg = `Year-End Closing completed. Data for year ${new Date().getFullYear() - 1} archived to reports.`;
    setYearEndSuccess(successMsg);
    
    // Reset dashboard for new year
    setStats({
      totalUsers: 0,
      activeFunds: 0,
      totalRevenue: 0,
      totalExpense: 0,
      todayTransactions: 0,
      pendingOverrides: 0,
      totalCollections: 0,
      totalDisbursements: 0,
      netBalance: 0,
    });
    setDailyRevenue([]);
    setMonthlyRevenue([]);
    setRecentTransactions([]);
    setDepartmentStats([]);
    setAuditLogs([]);
    
    setShowYearEndModal(false);
    
    // Refresh dashboard after 2 seconds
    setTimeout(() => window.location.reload(), 2000);
  } catch (err) {
    setYearEndError(err.response?.data?.message || err.message || 'Year-End Closing failed');
  } finally {
    setYearEndLoading(false);
  }
};
