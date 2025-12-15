import React from 'react';
import TrendsAnalysis from '../analytics/adminanalytics/TrendsAnalysis';
import { SkeletonLine } from '../ui/LoadingSkeleton';
import { useRecentTransactions, useOverrideRequests, useChequesAndReceipts, useTodaysCollection, useTodaysDisburse, useTopFundedAccounts, useActivityByRole } from '../../hooks/useDashboardData';
import { useDashboardWebSocket } from '../../hooks/useDashboardWebSocket';
import './css/admindashboardhome.css';

const AdminDashboardHome = ({ selectedYear }) => {
  // TanStack Query hooks for real-time data - filtered by year
  const { data: recentTransactions = [], isLoading: transactionsLoading } = useRecentTransactions(selectedYear);
  const { data: overrideRequests = { pending: 0, approve: 0, reject: 0 }, isLoading: overridesLoading } = useOverrideRequests(selectedYear);
  const { data: chequesAndReceipts = { cheque: 0, receipt: 0 }, isLoading: chequesLoading } = useChequesAndReceipts(selectedYear);
  const { data: todaysCollection = { count: 0, amount: 0 }, isLoading: collectionLoading } = useTodaysCollection(selectedYear);
  const { data: todaysDisburse = { count: 0, amount: 0 }, isLoading: disburseLoading } = useTodaysDisburse(selectedYear);
  // These two are also filtered by year
  const { data: topFundedAccounts = [], isLoading: topAccountsLoading } = useTopFundedAccounts(selectedYear);
  const { data: activityByRole = [], isLoading: activityByRoleLoading } = useActivityByRole(selectedYear);

  // WebSocket for real-time updates
  useDashboardWebSocket();

  // Loading states mapped from TanStack Query
  const loadingStates = {
    transactions: transactionsLoading,
    overrides: overridesLoading,
    cheques: chequesLoading,
    collection: collectionLoading,
    disburse: disburseLoading,
    topAccounts: topAccountsLoading,
    activityByRole: activityByRoleLoading
  };

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
                ) : topFundedAccounts.length > 0 && topFundedAccounts.some(acc => acc.totalAmount > 0 || acc.transactionCount > 0) ? (
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
                  <div className="box7-empty">No data this year</div>
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
                  <div className="box8-empty">No data this year</div>
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
