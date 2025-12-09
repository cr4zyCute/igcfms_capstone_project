import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import API_BASE_URL from '../../config/api';
import TrendsAnalysis from '../analytics/adminanalytics/TrendsAnalysis';
import AdminDashboardHomeSkeleton from '../ui/adminDashboardHomeSL';
import { SkeletonLine } from '../ui/LoadingSkeleton';
import './css/admindashboardhome.css';

const AdminDashboardHome = ({ selectedYear }) => {
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [overrideRequests, setOverrideRequests] = useState({
    pending: 0,
    approve: 0,
    reject: 0
  });
  const [chequesAndReceipts, setChequesAndReceipts] = useState({
    cheque: 0,
    receipt: 0
  });
  const [todaysCollection, setTodaysCollection] = useState({
    count: 0,
    amount: 0
  });
  const [todaysDisburse, setTodaysDisburse] = useState({
    count: 0,
    amount: 0
  });
  const [topFundedAccounts, setTopFundedAccounts] = useState([]);
  const [activityByRole, setActivityByRole] = useState([]);
  
  // Individual loading states for better UX
  const [loadingStates, setLoadingStates] = useState({
    transactions: true,
    overrides: true,
    cheques: true,
    collection: true,
    disburse: true,
    topAccounts: true,
    activityByRole: true
  });

  // Don't show full skeleton - let individual cards show their loading states
  
  const wsRef = useRef(null);
  const updateTimeoutsRef = useRef({});

  const dashboardCards = [
    { id: 1, color: 'card-1' },
    { id: 2, color: 'card-2' },
    { id: 3, color: 'card-3' },
    { id: 4, color: 'card-4' },
    { id: 5, color: 'card-5' },
    { id: 6, color: 'card-6' },
    { id: 7, color: 'card-7' },
    { id: 8, color: 'card-8' },
    { id: 9, color: 'card-9' }
  ];

  // Debounced update handler to prevent excessive re-renders
  const debouncedUpdate = useCallback((updateType) => {
    if (updateTimeoutsRef.current[updateType]) {
      clearTimeout(updateTimeoutsRef.current[updateType]);
    }

    updateTimeoutsRef.current[updateType] = setTimeout(() => {
      if (updateType === 'transaction') {
        fetchRecentTransactions();
        fetchTodaysCollection();
        fetchTodaysDisburse();
        fetchTopFundedAccounts();
      } else if (updateType === 'override') {
        fetchOverrideRequests();
      } else if (updateType === 'cheque') {
        fetchChequesAndReceipts();
      }
    }, 300); // Debounce by 300ms
  }, []);

  useEffect(() => {
    // Fetch all data in parallel on mount
    Promise.all([
      fetchRecentTransactions(),
      fetchOverrideRequests(),
      fetchChequesAndReceipts(),
      fetchTodaysCollection(),
      fetchTodaysDisburse(),
      fetchTopFundedAccounts(),
      fetchActivityByRole()
    ]).catch(error => console.error('Error fetching dashboard data:', error));

    // Set up WebSocket connection for real-time updates
    const initWebSocket = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
          console.log('WebSocket connected');
          // Send authentication token
          const token = localStorage.getItem('token');
          wsRef.current.send(JSON.stringify({ type: 'auth', token }));
        };

        wsRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            // Handle different message types with debouncing
            if (data.type === 'transaction_update') {
              debouncedUpdate('transaction');
            } else if (data.type === 'override_update') {
              debouncedUpdate('override');
            } else if (data.type === 'cheque_update' || data.type === 'receipt_update') {
              debouncedUpdate('cheque');
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        wsRef.current.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

        wsRef.current.onclose = () => {
          console.log('WebSocket disconnected, attempting to reconnect...');
          // Attempt to reconnect after 3 seconds
          setTimeout(initWebSocket, 3000);
        };
      } catch (error) {
        console.error('WebSocket initialization error:', error);
      }
    };

    initWebSocket();

    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      // Clear all pending timeouts
      Object.values(updateTimeoutsRef.current).forEach(timeout => clearTimeout(timeout));
    };
  }, [debouncedUpdate]);

  const fetchRecentTransactions = async () => {
    try {
      setLoadingStates(prev => ({ ...prev, transactions: true }));
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const response = await axios.get(`${API_BASE_URL}/transactions`, {
        params: { limit: 10 },
        headers
      });

      const transactions = Array.isArray(response.data) ? response.data : response.data.data || [];
      setRecentTransactions(transactions.slice(0, 10));
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
      setRecentTransactions([]);
    } finally {
      setLoadingStates(prev => ({ ...prev, transactions: false }));
    }
  };

  const fetchOverrideRequests = async () => {
    try {
      setLoadingStates(prev => ({ ...prev, overrides: true }));
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const response = await axios.get(`${API_BASE_URL}/override_requests`, {
        headers
      });

      const requests = Array.isArray(response.data) ? response.data : response.data.data || [];
      
      // Count by status (case-insensitive)
      const counts = {
        pending: requests.filter(r => r.status && r.status.toLowerCase() === 'pending').length,
        approve: requests.filter(r => r.status && r.status.toLowerCase() === 'approved').length,
        reject: requests.filter(r => r.status && r.status.toLowerCase() === 'rejected').length
      };

      setOverrideRequests(counts);
    } catch (error) {
      console.error('Error fetching override requests:', error);
      setOverrideRequests({ pending: 0, approve: 0, reject: 0 });
    } finally {
      setLoadingStates(prev => ({ ...prev, overrides: false }));
    }
  };

  const fetchChequesAndReceipts = async () => {
    try {
      setLoadingStates(prev => ({ ...prev, cheques: true }));
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      let chequeCount = 0;
      let receiptCount = 0;

      // Fetch receipts and cheques in parallel
      try {
        const [receiptResponse, chequeResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/receipts`, { headers }),
          axios.get(`${API_BASE_URL}/cheques`, { headers })
        ]);
        
        const receipts = Array.isArray(receiptResponse.data) ? receiptResponse.data : receiptResponse.data.data || [];
        const cheques = Array.isArray(chequeResponse.data) ? chequeResponse.data : chequeResponse.data.data || [];
        
        receiptCount = receipts.length;
        chequeCount = cheques.length;
      } catch (error) {
        console.error('Error fetching cheques/receipts:', error);
      }

      setChequesAndReceipts({
        cheque: chequeCount,
        receipt: receiptCount
      });
    } catch (error) {
      console.error('Error in fetchChequesAndReceipts:', error);
      setChequesAndReceipts({ cheque: 0, receipt: 0 });
    } finally {
      setLoadingStates(prev => ({ ...prev, cheques: false }));
    }
  };

  const fetchTodaysCollection = async () => {
    try {
      setLoadingStates(prev => ({ ...prev, collection: true }));
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const response = await axios.get(`${API_BASE_URL}/transactions`, {
        headers
      });

      const transactions = Array.isArray(response.data) ? response.data : response.data.data || [];

      // Get today's date
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Filter for today's collections only
      const todayCollections = transactions.filter(t => {
        const transactionDate = new Date(t.created_at);
        transactionDate.setHours(0, 0, 0, 0);
        return t.type === 'Collection' && transactionDate.getTime() === today.getTime();
      });

      // Calculate total amount
      const totalAmount = todayCollections.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

      setTodaysCollection({
        count: todayCollections.length,
        amount: totalAmount
      });
    } catch (error) {
      console.error('Error fetching today\'s collection:', error);
      setTodaysCollection({ count: 0, amount: 0 });
    } finally {
      setLoadingStates(prev => ({ ...prev, collection: false }));
    }
  };

  const fetchTodaysDisburse = async () => {
    try {
      setLoadingStates(prev => ({ ...prev, disburse: true }));
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const response = await axios.get(`${API_BASE_URL}/transactions`, {
        headers
      });

      const transactions = Array.isArray(response.data) ? response.data : response.data.data || [];

      // Get today's date
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Filter for today's disbursements only
      const todayDisbursements = transactions.filter(t => {
        const transactionDate = new Date(t.created_at);
        transactionDate.setHours(0, 0, 0, 0);
        return t.type === 'Disbursement' && transactionDate.getTime() === today.getTime();
      });

      // Calculate total amount
      const totalAmount = todayDisbursements.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

      setTodaysDisburse({
        count: todayDisbursements.length,
        amount: totalAmount
      });
    } catch (error) {
      console.error('Error fetching today\'s disbursement:', error);
      setTodaysDisburse({ count: 0, amount: 0 });
    } finally {
      setLoadingStates(prev => ({ ...prev, disburse: false }));
    }
  };

  const fetchTopFundedAccounts = async () => {
    try {
      setLoadingStates(prev => ({ ...prev, topAccounts: true }));
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // Fetch both fund accounts and transactions in parallel
      const [accountsResponse, transactionsResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/fund-accounts`, { headers }),
        axios.get(`${API_BASE_URL}/transactions`, { headers })
      ]);

      // Extract fund accounts from response
      let fundAccounts = Array.isArray(accountsResponse.data) ? accountsResponse.data : [];
      
      // Extract transactions from response
      const transactions = Array.isArray(transactionsResponse.data) ? transactionsResponse.data : transactionsResponse.data.data || [];

      console.log(`📊 Found ${fundAccounts.length} fund accounts`);
      console.log(`📊 Found ${transactions.length} transactions`);

      // Count transactions per fund account
      const transactionCounts = {};
      transactions.forEach(t => {
        const accountId = t.fund_account_id;
        if (accountId) {
          transactionCounts[accountId] = (transactionCounts[accountId] || 0) + 1;
        }
      });

      console.log('Transaction counts by account:', transactionCounts);

      // Sort by current_balance (descending) and get top 4
      const topAccounts = fundAccounts
        .sort((a, b) => parseFloat(b.current_balance || 0) - parseFloat(a.current_balance || 0))
        .slice(0, 4)
        .map(account => ({
          id: account.id,
          name: account.name || `Account ${account.id}`,
          totalAmount: parseFloat(account.current_balance || 0),
          transactionCount: transactionCounts[account.id] || 0
        }));

      console.log('✅ Top 4 funded accounts:', topAccounts);
      setTopFundedAccounts(topAccounts);
    } catch (error) {
      console.error('❌ Error fetching top funded accounts:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error message:', error.message);
      setTopFundedAccounts([]);
    } finally {
      setLoadingStates(prev => ({ ...prev, topAccounts: false }));
    }
  };

  const fetchActivityByRole = async () => {
    try {
      setLoadingStates(prev => ({ ...prev, activityByRole: true }));
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // Fetch activity logs instead of transactions
      const response = await axios.get(`${API_BASE_URL}/activity-logs/recent`, {
        params: { limit: 500 },
        headers
      });

      const activities = Array.isArray(response.data) ? response.data : response.data.data || [];

      // Group activities by user role
      const roleMap = {};
      activities.forEach(activity => {
        const role = activity.user?.role || activity.role;
        // Only include activities with a valid role (skip Unknown/null/undefined)
        if (role && role.toLowerCase() !== 'unknown') {
          if (!roleMap[role]) {
            roleMap[role] = 0;
          }
          roleMap[role] += 1;
        }
      });

      // Convert to array and sort by count (descending)
      const roleData = Object.entries(roleMap)
        .map(([role, count]) => ({
          role,
          count,
          percentage: 0
        }))
        .sort((a, b) => b.count - a.count);

      // Calculate percentages based on max count
      const maxCount = roleData.length > 0 ? roleData[0].count : 1;
      roleData.forEach(item => {
        item.percentage = Math.round((item.count / maxCount) * 100);
      });

      setActivityByRole(roleData);
    } catch (error) {
      console.error('Error fetching activity by role:', error);
      setActivityByRole([]);
    } finally {
      setLoadingStates(prev => ({ ...prev, activityByRole: false }));
    }
  };

  return (
    <div className="admin-dashboard-home">
      <div className="dashboard-grid">
        {dashboardCards.map((card) => (
          <div
            key={card.id}
            className={`dashboard-card ${card.color}`}
          >
            {card.id === 1 && (
              <div className="box1-content">
                <div className="box1-header">
                  <span className="box1-label">Todays Collection</span>
                  <span className="box1-count">{todaysCollection.count}</span>
                </div>
                <div className="box1-amount-section">
                  <span className="box1-currency">₱</span>
                  <span className="box1-amount">{todaysCollection.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="box1-footer">
                  <span className="box1-footer-label">Total Amount</span>
                </div>
              </div>
            )}
            {card.id === 2 && (
              <div className="box2-content">
                <div className="box2-header">
                  <span className="box2-label">Todays Disburse</span>
                  <span className="box2-count">{todaysDisburse.count}</span>
                </div>
                <div className="box2-amount-section">
                  <span className="box2-currency">₱</span>
                  <span className="box2-amount">{todaysDisburse.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="box2-footer">
                  <span className="box2-footer-label">Total Amount</span>
                </div>
              </div>
            )}
            {card.id === 3 && (
              <TrendsAnalysis selectedYear={selectedYear} />
            )}
            {card.id === 4 && (
              <div className="box4-content">
                <h3 className="box4-title">Override Request</h3>
                <div className="box4-stats">
                  <div className="box4-stat-item">
                    <span className="box4-stat-label">Pendin</span>
                    <span className="box4-stat-value">{overrideRequests.pending}</span>
                  </div>
                  <div className="box4-divider"></div>
                  <div className="box4-stat-item">
                    <span className="box4-stat-label">Approve</span>
                    <span className="box4-stat-value">{overrideRequests.approve}</span>
                  </div>
                  <div className="box4-divider"></div>
                  <div className="box4-stat-item">
                    <span className="box4-stat-label">Reject</span>
                    <span className="box4-stat-value">{overrideRequests.reject}</span>
                  </div>
                </div>
              </div>
            )}
            {card.id === 5 && (
              <div className="box5-content">
                <div className="box5-stats">
                  <div className="box5-stat-item">
                    <span className="box5-stat-label">Total Cheque</span>
                    <span className="box5-stat-value">{chequesAndReceipts.cheque}</span>
                  </div>
                  <div className="box5-divider"></div>
                  <div className="box5-stat-item">
                    <span className="box5-stat-label">Total Reciept</span>
                    <span className="box5-stat-value">{chequesAndReceipts.receipt}</span>
                  </div>
                </div>
              </div>
            )}
            {card.id === 6 && (
              <div className="box6-content">
                <div className="box6-header">
                  <div className="box6-title-wrapper">
                    <i className="fas fa-history box6-icon"></i>
                    <h3 className="box6-title">10 Recent Transactions</h3>
                  </div>
                </div>
                {loadingStates.transactions ? (
                  <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', overflowY: 'auto' }}>
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '8px', padding: '6px 0', borderBottom: '1px solid #f0f0f0' }}>
                          <div style={{ flex: 0.3 }}><SkeletonLine width="40px" height={11} /></div>
                          <div style={{ flex: 0.4 }}><SkeletonLine width="60px" height={11} /></div>
                          <div style={{ flex: 0.5 }}><SkeletonLine width="70px" height={11} /></div>
                          <div style={{ flex: 0.4 }}><SkeletonLine width="60px" height={11} /></div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <SkeletonLine width="80px" height={12} />
                              <SkeletonLine width="60px" height={10} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : recentTransactions.length > 0 ? (
                  <div className="box6-table-wrapper">
                    <table className="box6-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Date</th>
                          <th>Type</th>
                          <th>Amount</th>
                          <th>Creator By</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentTransactions.map((transaction) => {
                          const creator = transaction.creator;
                          const creatorName = creator?.name || 'N/A';
                          const creatorRole = creator?.role || '';
                          return (
                            <tr key={transaction.id}>
                              <td>#{transaction.id}</td>
                              <td>{new Date(transaction.created_at).toLocaleDateString()}</td>
                              <td>
                                <span className={`badge ${transaction.type?.toLowerCase()}`}>
                                  {transaction.type}
                                </span>
                              </td>
                              <td className={`amount ${transaction.type === 'Collection' ? 'pos' : 'neg'}`}>
                                {transaction.type === 'Collection' ? '+' : '-'}₱{parseFloat(transaction.amount || 0).toLocaleString()}
                              </td>
                              <td className="creator">
                                <div className="creator-info">
                                  <div className="creator-name">{creatorName}</div>
                                  <div className="creator-role">{creatorRole}</div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="box6-empty">No transactions found</div>
                )}
              </div>
            )}
            {card.id === 7 && (
              <div className="box7-content">
                <div className="box7-header">
                  <h3 className="box7-title">Top 4 Funded Accounts</h3>
                </div>
                {loadingStates.topAccounts ? (
                  <div className="box7-accounts-grid">
                    {Array.from({ length: 4 }).map((_, idx) => (
                      <div key={idx} className="box7-account-card" style={{ opacity: 0.7 }}>
                        <div style={{ width: '32px', height: '32px', background: '#e0e0e0', borderRadius: '50%', marginBottom: '8px' }}></div>
                        <div className="box7-account-info">
                          <SkeletonLine width="80px" height={11} />
                          <SkeletonLine width="100px" height={14} style={{ marginTop: '6px' }} />
                          <SkeletonLine width="70px" height={10} style={{ marginTop: '6px' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : topFundedAccounts.length > 0 ? (
                  <div className="box7-accounts-grid">
                    {topFundedAccounts.map((account, index) => (
                      <div key={account.id} className="box7-account-card">
                        <div className="box7-account-rank">{index + 1}</div>
                        <div className="box7-account-info">
                          <div className="box7-account-name">{account.name}</div>
                          <div className="box7-account-amount">₱{account.totalAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                          <div className="box7-account-count">{account.transactionCount} transactions</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="box7-empty">No accounts found</div>
                )}
              </div>
            )}
            {card.id === 8 && (
              <div className="box8-content">
                <div className="box8-header">
                  <i className="fas fa-users box8-icon"></i>
                  <h3 className="box8-title">Activity by Role</h3>
                </div>
                {loadingStates.activityByRole ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, paddingRight: '3px' }}>
                    {Array.from({ length: 4 }).map((_, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '85px 1fr 35px', alignItems: 'center', gap: '6px', padding: '4px 0', boxSizing: 'border-box' }}>
                        <SkeletonLine width="70px" height={10} />
                        <div style={{ height: '10px', background: '#e0e0e0', borderRadius: '5px', overflow: 'hidden' }}>
                          <SkeletonLine height="100%" style={{ borderRadius: '0' }} />
                        </div>
                        <SkeletonLine width="25px" height={10} />
                      </div>
                    ))}
                  </div>
                ) : activityByRole.length > 0 ? (
                  <>
                    <div className="box8-roles-list">
                      {activityByRole.map((item) => (
                        <div key={item.role} className="box8-role-item">
                          <span className="box8-role-name">{item.role}</span>
                          <div className="box8-bar-container">
                            <div className="box8-bar" style={{ width: `${item.percentage}%` }}></div>
                          </div>
                          <span className="box8-role-count">{item.count}</span>
                        </div>
                      ))}
                    </div>
                    <div className="box8-summary">
                      <div className="box8-summary-item">
                        <span className="box8-summary-label">Total Activities</span>
                        <span className="box8-summary-value">
                          {activityByRole.reduce((sum, item) => sum + item.count, 0)}
                        </span>
                      </div>
                      <div className="box8-summary-divider"></div>
                      <div className="box8-summary-item">
                        <span className="box8-summary-label">Most Active</span>
                        <span className="box8-summary-value">
                          {activityByRole.length > 0 ? activityByRole[0].role : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="box8-empty">No activity data</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboardHome;
