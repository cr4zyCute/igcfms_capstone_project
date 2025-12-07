import React, { memo } from 'react';
import MiniLineGraph from '../../assets/analytics/MiniLineGraph';

const AccountCard = memo(({ 
  account, 
  onEdit, 
  onDelete, 
  onViewTransactions, 
  openMenuId, 
  onToggleMenu,
  globalMaxAmount 
}) => {
  console.log(`🎴 AccountCard rendered for ${account.name}:`, {
    graphDataLength: account.graphData?.length || 0,
    graphData: account.graphData,
    transactionCount: account.transactionCount
  });
  
  // If account is loading, show skeleton
  if (account.isLoading) {
    return (
      <div className="account-card-new skeleton-loading">
        <div className="card-header">
          <div className="card-header-left">
            <div className="skeleton-line skeleton-title"></div>
            <div className="skeleton-line skeleton-date"></div>
          </div>
          <div className="card-header-center">
            <div className="skeleton-line skeleton-code"></div>
          </div>
          <div className="card-header-right">
            <div className="skeleton-circle"></div>
          </div>
        </div>

        <div className="card-balance">
          <div className="skeleton-line skeleton-balance"></div>
          <div className="skeleton-line skeleton-transactions"></div>
        </div>

        <div className="card-graph">
          <div className="skeleton-graph"></div>
        </div>

        <div className="card-actions-new">
          <div className="skeleton-line skeleton-action"></div>
          <div className="skeleton-line skeleton-button"></div>
        </div>
      </div>
    );
  }

  const handleMenuToggle = (e) => {
    e.stopPropagation();
    onToggleMenu(account.id);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(account);
    onToggleMenu(null);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(account.id);
    onToggleMenu(null);
  };

  const handleViewTransactions = () => {
    onViewTransactions(account);
  };

  // Get latest transaction from graph data - properly sorted by date
  const latestTransaction = account.graphData && account.graphData.length > 0 
    ? account.graphData
        .filter(tx => tx.type !== 'INITIAL_BALANCE') // Filter out initial balance transactions
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0] // Sort by date descending and get first
    : null;

  return (
    <div
      className="account-card-new"
      onClick={() => openMenuId && onToggleMenu(null)}
    >
      <div className="card-header">
        <div className="card-header-left">
          <h5 className="card-title-text">{account.name}</h5>
          <span className="card-created-date">
            Created: {new Date(account.created_at).toLocaleString()}
          </span>
        </div>
        <div className="card-header-center">
          <span className="account-code">{account.code}</span>
        </div>
        <div className="card-header-right">
          <div className="card-menu">
            <button className="menu-btn" onClick={handleMenuToggle}>
              <i className="fas fa-ellipsis-v"></i>
            </button>
            {openMenuId === account.id && (
              <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
                <button onClick={handleEdit}>
                  <i className="fas fa-edit"></i> Edit
                </button>
                <button onClick={handleDelete}>
                  <i className="fas fa-trash"></i> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card-balance">
        <h2>
          ₱
          {account.current_balance?.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }) || '0.00'}
        </h2>
        <p className="transaction-count-label">
          {account.transactionCount || 0} transactions
        </p>
      </div>

      <div className="card-graph">
        <MiniLineGraph
          data={account.graphData || []}
          accountId={account.id}
          accountName={account.name}
          globalMaxAmount={globalMaxAmount}
        />
      </div>

      <div className="card-actions-new">
        {latestTransaction ? (
          <div className="latest-transaction-card">
            <div className="transaction-header">
              <span className="transaction-pill">LATEST TRANSACTION</span>
            </div>

            <div className="single-line-details">
              <span className="payee-text">
                {latestTransaction.type === 'Collection'
                  ? latestTransaction.payer_name ||
                    latestTransaction.recipient ||
                    'Unknown Payer'
                  : latestTransaction.recipient ||
                    latestTransaction.payer_name ||
                    'Unknown Payee'}
              </span>

              <span className="type-pill">{latestTransaction.type}</span>

              <span
                className={`amount-text ${
                  latestTransaction.type === 'Collection' ? 'positive' : 'negative'
                }`}
              >
                {latestTransaction.type === 'Collection' ? '+' : ''}₱
                {(latestTransaction.amount || 0).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>

            <button
              className="view-all-button"
              onClick={handleViewTransactions}
            >
              <i className="fas fa-list"></i> View All Transactions
            </button>
          </div>
        ) : (
          <div className="latest-transaction-preview">
            <div className="transaction-preview-header">
              <span className="preview-label">No Transactions Yet</span>
            </div>
            <div className="transaction-preview-details">
              <div className="preview-row">
                <span className="preview-field">Status:</span>
                <span className="preview-value">No activity</span>
              </div>
            </div>
            <button
              className="view-all-btn"
              onClick={handleViewTransactions}
            >
              No history of transaction
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

AccountCard.displayName = 'AccountCard';

export default AccountCard;
