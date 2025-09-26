import React, { useState, useEffect } from "react";
import "../../assets/admin.css";
import "./css/fundsaccount.css";
import notificationService from "../../services/notificationService";
import balanceService from "../../services/balanceService";
import MiniLineGraph from './MiniLineGraph'; // Import the new graph component
import {
  getFundAccounts,
  createFundAccount,
  getFundAccount,
  updateFundAccount,
  deleteFundAccount,
} from "../../services/api";

const FundsAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showEditAccount, setShowEditAccount] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAccountId, setDeletingAccountId] = useState(null);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showMessagePopup, setShowMessagePopup] = useState(false);
  const [messagePopup, setMessagePopup] = useState({ type: '', message: '' });

  const [newAccount, setNewAccount] = useState({
    name: "",
    code: "",
    description: "",
    initial_balance: 0,
    account_type: "Revenue",
  });

  const [editAccount, setEditAccount] = useState({});
  const [accountGraphData, setAccountGraphData] = useState({});
  const [openMenuId, setOpenMenuId] = useState(null); // State for dropdown menu
  const [searchTerm, setSearchTerm] = useState(''); // State for transaction search

  const openDeleteModal = (accountId) => {
    setDeletingAccountId(accountId);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setDeletingAccountId(null);
    setShowDeleteModal(false);
  };

  const toggleMenu = (e, accountId) => {
    e.stopPropagation();
    setOpenMenuId(prevId => (prevId === accountId ? null : accountId));
  };

  useEffect(() => {
    fetchAccounts();
    //loadAccounts();
    
    // Set up real-time balance updates
    const handleBalanceUpdate = ({ fundAccountId, newBalance, latestTransaction }) => {
      setAccounts(prevAccounts =>
        prevAccounts.map(account =>
          account.id === fundAccountId
            ? { ...account, current_balance: newBalance, latest_transaction: latestTransaction }
            : account
        )
      );

      // Update graph data
      if (latestTransaction) {
        setAccountGraphData(prevData => {
          const existingData = prevData[fundAccountId] || [];
          const newDataPoint = {
            date: new Date().toISOString(),
            balance: newBalance,
            amount: latestTransaction.amount,
            type: latestTransaction.type,
          };
          return {
            ...prevData,
            [fundAccountId]: [...existingData, newDataPoint].slice(-20), // Keep last 20 points
          };
        });
      }
    };

    balanceService.addBalanceListener(handleBalanceUpdate);

    return () => {
      balanceService.removeBalanceListener(handleBalanceUpdate);
    };
  }, []);

  // Function to show popup messages
  const showPopupMessage = (type, message) => {
    setMessagePopup({ type, message });
    setShowMessagePopup(true);
    // Auto hide after 3 seconds
    setTimeout(() => {
      setShowMessagePopup(false);
    }, 3000);
  };

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await getFundAccounts();
      console.log('📊 Fund accounts API response:', response);
      
      setAccounts(response.map(acc => ({ ...acc, latest_transaction: null })));

      // Initialize graph data with proper error handling
      const initialGraphData = {};
      
      // Also try to fetch transactions for each account if not included
      const accountsWithTransactions = await Promise.all(
        response.map(async (account) => {
          console.log(`📈 Processing graph data for account ${account.id}:`, account);
          
          let transactions = account.transactions;
          
          // Check if account has transactions
          if (transactions && Array.isArray(transactions) && transactions.length > 0) {
            console.log(`✅ Found ${transactions.length} transactions for account ${account.id}`);
          } else {
            console.log(`⚠️ No transactions in account data for ${account.id}, trying to fetch separately...`);
            
            // Try to fetch transactions separately
            try {
              const token = localStorage.getItem('token');
              const txResponse = await fetch(`http://localhost:8000/api/transactions?fund_account_id=${account.id}`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (txResponse.ok) {
                const txData = await txResponse.json();
                transactions = Array.isArray(txData) ? txData : (txData?.data || []);
                console.log(`📊 Fetched ${transactions.length} transactions separately for account ${account.id}`);
              }
            } catch (txError) {
              console.warn(`⚠️ Failed to fetch transactions for account ${account.id}:`, txError);
              transactions = [];
            }
          }
          
          // Create graph data
          if (transactions && Array.isArray(transactions) && transactions.length > 0) {
            initialGraphData[account.id] = transactions.map(t => ({
              date: t.created_at,
              balance: t.balance_after_transaction || account.current_balance,
              amount: parseFloat(t.amount) || 0,
              type: t.type || 'Unknown',
            })).slice(-20); // Last 20 transactions
          } else {
            console.log(`⚠️ Creating sample data for account ${account.id}`);
            
            // Create sample data point if no transactions exist
            initialGraphData[account.id] = [{
              date: new Date().toISOString(),
              balance: parseFloat(account.current_balance) || 0,
              amount: parseFloat(account.current_balance) || 0,
              type: 'Initial Balance'
            }];
          }
          
          console.log(`📊 Graph data for account ${account.id}:`, initialGraphData[account.id]);
          
          return { ...account, transactions };
        })
      );
      
      console.log('📊 Final graph data:', initialGraphData);
      setAccountGraphData(initialGraphData);

      setError("");
    } catch (err) {
      setError("Failed to fetch fund accounts. Please try again.");
      console.error("❌ Error fetching accounts:", err);
    } finally {
      setLoading(false);
    }
  };

  // Extract a readable error message from API errors
  const extractErrorMessage = (err) => {
    const fallback = "Request failed. Please try again.";
    if (!err) return fallback;
    const data = err.response?.data;
    if (typeof data === 'string') return data;
    if (data?.message) return data.message;
    if (data?.errors) {
      const firstKey = Object.keys(data.errors)[0];
      if (firstKey && Array.isArray(data.errors[firstKey]) && data.errors[firstKey].length) {
        return data.errors[firstKey][0];
      }
    }
    return err.message || fallback;
  };

  const fetchAccountTransactions = async (accountId) => {
    try {
      setTransactionsLoading(true);
      
      // Try multiple API endpoints to get transactions
      console.log(`📊 Fetching transactions for account ${accountId}...`);
      
      // First try: Get specific fund account details
      const response = await getFundAccount(accountId);
      console.log(`📊 getFundAccount(${accountId}) response:`, response);

      // The backend show() now returns the full account with 'transactions' and computed 'current_balance'
      const accountData = Array.isArray(response)
        ? { transactions: response }
        : (response?.data || response);

      console.log(`📊 Processed account data:`, accountData);

      // Update selectedAccount with fresh data if available
      if (accountData && accountData.id) {
        setSelectedAccount(accountData);
      }

      let related = accountData?.transactions || [];
      console.log(`📊 Found ${related.length} transactions in account data`);

      // If no transactions in account data, try fetching from transactions API directly
      if (related.length === 0) {
        try {
          console.log(`🔄 No transactions in account data, trying direct API call...`);
          const token = localStorage.getItem('token');
          const transactionsResponse = await fetch(`http://localhost:8000/api/transactions?fund_account_id=${accountId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (transactionsResponse.ok) {
            const transactionsData = await transactionsResponse.json();
            console.log(`📊 Direct transactions API response:`, transactionsData);
            
            related = Array.isArray(transactionsData) ? transactionsData : 
                     (transactionsData?.data || transactionsData?.transactions || []);
            console.log(`📊 Found ${related.length} transactions from direct API`);
          }
        } catch (directApiError) {
          console.warn(`⚠️ Direct transactions API failed:`, directApiError);
        }
      }

      setTransactions(Array.isArray(related) ? related : []);
      
      // Update graph data for this specific account
      if (related.length > 0) {
        console.log(`📈 Updating graph data for account ${accountId} with ${related.length} transactions`);
        
        const graphData = related.map(t => ({
          date: t.created_at,
          balance: t.balance_after_transaction || accountData.current_balance,
          amount: parseFloat(t.amount) || 0,
          type: t.type || 'Unknown',
        })).slice(-20);
        
        setAccountGraphData(prevData => ({
          ...prevData,
          [accountId]: graphData
        }));
        
        console.log(`📊 Updated graph data for account ${accountId}:`, graphData);
      } else {
        console.log(`⚠️ Still no transactions found for account ${accountId} after all attempts`);
        console.log(`🔍 Account data structure:`, Object.keys(accountData || {}));
        console.log(`🔍 Available properties:`, accountData);
      }
    } catch (err) {
      console.error("❌ Error fetching transactions:", err);
      console.error("❌ Error details:", err.response?.data);
      setTransactions([]);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();

    console.log("Sending new account:", newAccount); // DEBUG

    try {
      setLoading(true);
      // Basic client-side validation to avoid server roundtrip
      if (!newAccount.name?.trim()) {
        throw new Error('Account name is required');
      }
      if (!newAccount.account_type) {
        throw new Error('Account type is required');
      }
      const ib = Number(newAccount.initial_balance);
      if (Number.isNaN(ib) || ib < 0) {
        throw new Error('Initial balance must be a non-negative number');
      }
      const createdAccount = await createFundAccount({
        ...newAccount,
        initial_balance: Number(newAccount.initial_balance) || 0,
      });
      
      // Send notification for new fund account
      await notificationService.notifyTransaction('FUND_ACCOUNT_CREATED', {
        name: newAccount.name,
        balance: newAccount.initial_balance,
        fund_account_id: createdAccount.id || createdAccount.data?.id
      });
      
      showPopupMessage("success", "Fund account created successfully!");
      setNewAccount({
        name: "",
        code: "",
        description: "",
        initial_balance: 0,
        department: "",
      });
      setShowAddAccount(false);
      fetchAccounts();
    } catch (err) {
      const msg = extractErrorMessage(err);
      showPopupMessage("error", msg || "Failed to create fund account. Please try again.");
      console.error("Error creating account:", err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSelect = async (account) => {
    setSelectedAccount(account);
    await fetchAccountTransactions(account.id);
    setShowTransactionHistory(true);
  };

  const handleEditAccount = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      // Client-side checks
      if (!editAccount.name?.trim()) {
        throw new Error('Account name is required');
      }
      if (!editAccount.code?.trim()) {
        throw new Error('Account code is required');
      }
      if (!editAccount.account_type) {
        throw new Error('Account type is required');
      }
      const ib = Number(editAccount.initial_balance);
      if (Number.isNaN(ib) || ib < 0) {
        throw new Error('Initial balance must be a non-negative number');
      }
      await updateFundAccount(editAccount.id, {
      name: editAccount.name,
      code: editAccount.code,
      description: editAccount.description,
      initial_balance: Number(editAccount.initial_balance),
      account_type: editAccount.account_type,
    });
        showPopupMessage("success", "Fund account updated successfully!");
        setShowEditAccount(false);
        fetchAccounts(); // refresh the list
        setSelectedAccount(null);
    } catch (err) {
      const msg = extractErrorMessage(err);
      showPopupMessage("error", msg || "Failed to update fund account. Please try again.");
      console.error("Error updating account:", err);
    } finally {
      setLoading(false);
    }
  };

const handleDeleteAccount = async (accountId) => {
  try {
    setLoading(true);
    const response = await deleteFundAccount(accountId); // API call

    showPopupMessage("success", response.message || "Fund account has transactions successfully deleted!");

    // Remove the deactivated account from state so UI updates instantly
    setAccounts(accounts.filter(acc => acc.id !== accountId));

    // Deselect if it was selected
    if (selectedAccount?.id === accountId) setSelectedAccount(null);

  } catch (err) {
    showPopupMessage("error", "Failed to deactivate fund account. Please try again.");
    console.error("Error deleting account:", err.response?.data || err);
  } finally {
    setLoading(false);
  }
};



  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner" aria-label="Loading fund accounts" />
      </div>
    );
  }

  return (
    <div className="funds-accounts">
      <div className="section-header">
        <div>
          <h3><i className="fas fa-university"></i> Fund Accounts Management</h3>
          <p></p>
        </div>
        <button
          className="btn btn-primary add-account-btn"
          onClick={() => setShowAddAccount(true)}
          disabled={loading}
        >   
          <i className="fas fa-plus"></i>
          Add New Account
        </button>
      </div>


      {showAddAccount && (
        <div className="modal-overlay" onClick={() => setShowAddAccount(false)}>
          <div className="modal wide create-account-modal" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="modal-header">
              <h4><i className="fas fa-plus-circle"></i> Create New Fund Account</h4>
              <button 
                type="button" 
                onClick={() => setShowAddAccount(false)}
                className="close-button"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddAccount} className="enhanced-form">
              {/* Account Information Section */}
              <div className="form-section">
                <div className="section-header">
                  <h5><i className="fas fa-info-circle"></i> Account Information</h5>
                </div>
                
                {/* Two Column Layout: Account Name | Account Code */}
                <div className="form-row">
                  <div className="form-group">
                    <label>Account Name</label>
                    <input
                      type="text"
                      value={newAccount.name}
                      onChange={(e) =>
                        setNewAccount({ ...newAccount, name: e.target.value })
                      }
                      placeholder="Enter account name"
                      required
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Account Code</label>
                    <input
                      type="text"
                      value="Auto-generated"
                      disabled
                      className="auto-generated-field"
                    />
                  </div>
                </div>

                {/* Two Column Layout: Account Type | Initial Balance */}
                <div className="form-row">
                  <div className="form-group">
                    <label>Account Type</label>
                    <select
                      value={newAccount.account_type}
                      onChange={(e) => setNewAccount({ ...newAccount, account_type: e.target.value })}
                      disabled={loading}
                      required
                    >
                      <option value="">Select Type</option>
                      <option value="Revenue">Revenue</option>
                      <option value="Expense">Expense</option>
                      <option value="Asset">Asset</option>
                      <option value="Liability">Liability</option>
                      <option value="Equity">Equity</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Initial Balance</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newAccount.initial_balance}
                      onChange={(e) => {
                        const value = e.target.value;
                        setNewAccount({
                          ...newAccount,
                          initial_balance: value === "" ? "" : parseFloat(value),
                        });
                      }}
                      placeholder="0.00"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Description Section - Compact */}
              <div className="form-section compact">
                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea
                    value={newAccount.description}
                    onChange={(e) =>
                      setNewAccount({
                        ...newAccount,
                        description: e.target.value,
                      })
                    }
                    placeholder="Enter a detailed description of this account's purpose"
                    disabled={loading}
                    rows="1"
                  />
                </div>
              </div>

              {/* Actions Section */}
              <div className="form-actions enhanced-actions">
                <button
                  type="button"
                  onClick={() => setShowAddAccount(false)}
                  disabled={loading}
                  className="btn-cancel"
                >
                  <i className="fas fa-times"></i>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="btn-create"
                >
                  <i className="fas fa-plus"></i>
                  {loading ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditAccount && (
        <div className="modal-overlay" onClick={() => setShowEditAccount(false)}>
          <div className="modal wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4><i className="fas fa-edit"></i> Edit Fund Account</h4>
              <button type="button" onClick={() => setShowEditAccount(false)} className="close-button">×</button>
            </div>
            <form onSubmit={handleEditAccount} className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Account Name</label>
                  <input
                    type="text"
                    value={editAccount.name}
                    onChange={(e) =>
                      setEditAccount({ ...editAccount, name: e.target.value })
                    }
                    required
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label>Account Type</label>
                  <select
                    value={editAccount.account_type || ''}
                    onChange={(e) => setEditAccount({ ...editAccount, account_type: e.target.value })}
                    disabled={loading}
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="Revenue">Revenue</option>
                    <option value="Expense">Expense</option>
                    <option value="Asset">Asset</option>
                    <option value="Liability">Liability</option>
                    <option value="Equity">Equity</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Account Code</label>
                  <input
                    type="text"
                    value={editAccount.code}
                    onChange={(e) =>
                      setEditAccount({ ...editAccount, code: e.target.value })
                    }
                    required
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label>Current Balance (Read-only)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editAccount.initial_balance}
                    readOnly
                    disabled
                    style={{
                      backgroundColor: '#f5f5f5',
                      color: '#666666',
                      cursor: 'not-allowed'
                    }}
                  />
                  <small style={{ color: '#666666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    This shows the current balance and cannot be edited
                  </small>
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={editAccount.description}
                  onChange={(e) =>
                    setEditAccount({
                      ...editAccount,
                      description: e.target.value,
                    })
                  }
                  disabled={loading}
                />
              </div>
              
              <div className="form-actions">
                {/* <button
                  type="button"
                  onClick={() => setShowEditAccount(false)}
                  disabled={loading}
                >
                  <i className="fas fa-times"></i> Cancel
                </button> */}
                <button type="submit" disabled={loading}>
                  {loading ? "Updating..." : <><i className="fas fa-save"></i> Update Account</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4><i className="fas fa-exclamation-triangle"></i> Confirm Deletion</h4>
              <button onClick={closeDeleteModal} className="close-button">×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this fund account? This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button onClick={closeDeleteModal} className="btn btn-secondary">Cancel</button>
              <button 
                onClick={async () => {
                  await handleDeleteAccount(deletingAccountId);
                  closeDeleteModal();
                }}
                className="btn btn-danger"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="accounts-overview">
        <h4><i className="fas fa-credit-card"></i> Fund Accounts ({accounts.length})</h4>
        <div className="account-cards">
          {accounts.map((account) => {
            const latestTransaction = account.latest_transaction;
            return (
              <div key={account.id} className="account-card-new" onClick={() => openMenuId && setOpenMenuId(null)}>
                <div className="card-header">
                  <div className="card-title">
                    <div className="title-line">
                      <h5>{account.name}</h5>
                      <p className="account-code">{account.code}</p>
                    </div>
                    <span>Created: {new Date(account.created_at).toLocaleString()}</span>
                  </div>
                  <div className="card-menu">
                    <i className="fas fa-wallet"></i>
                    <button className="menu-btn" onClick={(e) => toggleMenu(e, account.id)}>
                      <i className="fas fa-ellipsis-v"></i>
                    </button>
                    {openMenuId === account.id && (
                      <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAccount(account);
                            setShowEditAccount(true);
                            setEditAccount({ 
                              ...account, 
                              initial_balance: account.current_balance // Set initial balance to current balance
                            });
                            setOpenMenuId(null);
                          }}
                        >
                          <i className="fas fa-edit"></i> Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteModal(account.id);
                            setOpenMenuId(null);
                          }}
                        >
                          <i className="fas fa-trash"></i> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="card-balance">
                  <h2>₱{account.current_balance?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}</h2>
                </div>

                <div className="card-graph">
                  <MiniLineGraph 
                    data={accountGraphData[account.id] || []} 
                    accountId={account.id}
                    accountName={account.name}
                  />
                </div>

                <div className="card-actions-new">
                  {(() => {
                    // Get the latest transaction for this account - real-time data
                    let displayTransaction = null;
                    
                    // First try to get from the transactions array (same as history modal)
                    if (transactions && transactions.length > 0) {
                      // Get all transactions for this account and sort by date (newest first)
                      const accountTransactions = transactions
                        .filter(t => t.fund_account_id === account.id)
                        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                      
                      if (accountTransactions.length > 0) {
                        displayTransaction = accountTransactions[0]; // Get the most recent
                        console.log('🎯 Latest transaction from history data:', displayTransaction);
                        console.log('📅 Transaction date:', displayTransaction.created_at);
                      }
                    }
                    
                    // Fallback to graph data if no transaction history available
                    if (!displayTransaction) {
                      const graphTransactions = accountGraphData[account.id] || [];
                      if (graphTransactions.length > 0) {
                        // Sort graph data by date too
                        const sortedGraphData = graphTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
                        displayTransaction = sortedGraphData[0];
                        console.log('📊 Latest transaction from graph data:', displayTransaction);
                      }
                    }
                    
                    // Debug: Log the transaction data to see what fields are available
                    if (displayTransaction) {
                      console.log('🔍 Final latest transaction:', displayTransaction);
                      console.log('👤 Payer name:', displayTransaction.payer_name);
                      console.log('👤 Recipient:', displayTransaction.recipient);
                      console.log('💰 Amount:', displayTransaction.amount);
                      console.log('📝 Type:', displayTransaction.type);
                    }
                    
                    return displayTransaction ? (
                      <div className="latest-transaction-card">
                        <div className="transaction-header">
                          <span className="transaction-pill">LATEST TRANSACTION</span>
                        </div>
                        
                        <div className="single-line-details">
                          <span className="payee-text">
                            {displayTransaction.type === "Collection" 
                              ? (displayTransaction.payer_name || displayTransaction.recipient || 'Unknown Payer')
                              : (displayTransaction.recipient || displayTransaction.payer_name || 'Unknown Payee')
                            }
                          </span>
                          
                          <span className="type-pill">{displayTransaction.type}</span>
                          
                          <span className={`amount-text ${displayTransaction.type === 'Collection' ? 'positive' : 'negative'}`}>
                            {displayTransaction.type === 'Collection' ? '+' : '-'}₱{(displayTransaction.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        
                        <button 
                          className="view-all-button"
                          onClick={() => handleAccountSelect(account)}
                        >
                          <i className="fas fa-list"></i> View All Transactions
                        </button>
                      </div>
                    ) : (
                      <div className="latest-transaction-preview">
                        <div className="transaction-preview-header">
                          <span className="preview-label">No Transactions Yet</span>
                          <span className="preview-amount" style={{ color: '#666' }}>
                            ₱0.00
                          </span>
                        </div>
                        <div className="transaction-preview-details">
                          <div className="preview-row">
                            <span className="preview-field">Status:</span>
                            <span className="preview-value">No activity</span>
                          </div>
                        </div>
                        <button 
                          className="view-all-btn"
                          onClick={() => handleAccountSelect(account)}
                        >
                          <i className="fas fa-plus"></i> Add First Transaction
                        </button>
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>
        
        {accounts.length === 0 && (
          <div className="empty-state">
            <h4>No Fund Accounts Found</h4>
            <p>Create your first fund account to get started with financial management.</p>
          </div>
        )}
      </div>

      {/* Transaction History Popup */}
      {showTransactionHistory && selectedAccount && (
        <div className="modal-overlay" onClick={() => setShowTransactionHistory(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1200px', width: '95vw' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h4><i className="fas fa-history"></i> Transaction History: {selectedAccount.name}</h4>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      padding: '8px 35px 8px 12px',
                      border: '2px solid #e5e5e5',
                      borderRadius: '6px',
                      fontSize: '13px',
                      width: '200px',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#000000'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e5e5'}
                  />
                  <i className="fas fa-search" style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#666',
                    fontSize: '12px'
                  }}></i>
                </div>
                <button 
                  className="btn btn-secondary"
                  onClick={() => fetchAccountTransactions(selectedAccount.id)}
                  disabled={transactionsLoading}
                  style={{ padding: '8px 16px', fontSize: '12px' }}
                >
                  <i className="fas fa-sync-alt"></i> Refresh
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowTransactionHistory(false)}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    fontSize: '24px', 
                    cursor: 'pointer',
                    color: '#666666',
                    padding: '4px'
                  }}
                >
                  ×
                </button>
              </div>
            </div>
            
            <div style={{ 
              background: '#f8f9fa', 
              padding: '20px', 
              borderRadius: '12px', 
              marginBottom: '25px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#666666', marginBottom: '5px' }}>Account Code</div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#000000' }}>{selectedAccount.code}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#666666', marginBottom: '5px' }}>Current Balance</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#16a34a' }}>₱{selectedAccount.current_balance?.toLocaleString() || "0.00"}</div>
              </div>
              
            </div>
            
            <div style={{ minHeight: '400px', maxHeight: '400px', overflowY: 'auto' }}>
              {transactionsLoading ? (
                <div className="spinner-container">
                  <div className="spinner" aria-label="Loading transactions" />
                </div>
              ) : (() => {
                // Filter transactions based on search term
                const filteredTransactions = transactions.filter(transaction => {
                  if (!searchTerm) return true;
                  
                  const searchLower = searchTerm.toLowerCase();
                  return (
                    transaction.description?.toLowerCase().includes(searchLower) ||
                    transaction.type?.toLowerCase().includes(searchLower) ||
                    transaction.recipient?.toLowerCase().includes(searchLower) ||
                    transaction.payer_name?.toLowerCase().includes(searchLower) ||
                    transaction.reference?.toLowerCase().includes(searchLower) ||
                    transaction.reference_no?.toLowerCase().includes(searchLower) ||
                    transaction.receipt_no?.toLowerCase().includes(searchLower) ||
                    transaction.amount?.toString().includes(searchTerm) ||
                    new Date(transaction.created_at).toLocaleDateString().includes(searchTerm)
                  );
                });
                
                return filteredTransactions.length > 0 ? (
                <table style={{ marginTop: '0' }}>
                  <thead>
                    <tr>
                      <th><i className="fas fa-calendar"></i> Date</th>
                      <th><i className="fas fa-file-text"></i> Description</th>
                      <th><i className="fas fa-user"></i> Payee/Payer</th>
                      <th><i className="fas fa-exchange-alt"></i> Type</th>
                      <th><i className="fas fa-money-bill"></i> Amount</th>
                      <th><i className="fas fa-hashtag"></i> Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td>
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </td>
                        <td>{transaction.description}</td>
                        <td>
                          <span style={{ 
                            fontSize: '13px', 
                            color: transaction.type === "Collection" ? '#22c55e' : '#ef4444',
                            fontWeight: '500'
                          }}>
                            {transaction.type === "Collection" 
                              ? (transaction.payer_name || transaction.recipient || 'Unknown Payer')
                              : (transaction.recipient || transaction.payer_name || 'Unknown Payee')
                            }
                          </span>
                        </td>
                        <td>
                          <span
                            className={`transaction-type ${transaction.type?.toLowerCase()}`}
                          >
                            {transaction.type === "Collection" && <i className="fas fa-arrow-up"></i>}
                            {transaction.type === "Disbursement" && <i className="fas fa-arrow-down"></i>}
                            {transaction.type}
                          </span>
                        </td>
                        <td
                          className={
                            transaction.type === "Collection"
                              ? "text-success"
                              : "text-danger"
                          }
                        >
                          {transaction.type === "Collection" ? "+" : "-"}₱
                          {Number(Math.abs(transaction.amount || 0)).toLocaleString()}
                        </td>
                        <td>
                          {transaction.reference ||
                            transaction.reference_no ||
                            transaction.receipt_no ||
                            'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                ) : (
                  <div className="empty-state" style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '350px',
                    textAlign: 'center'
                  }}>
                    <i className={`fas ${searchTerm ? 'fa-search' : 'fa-inbox'}`} style={{ 
                      fontSize: '48px', 
                      color: '#e5e5e5', 
                      marginBottom: '16px' 
                    }}></i>
                    <h4 style={{ margin: '0 0 8px 0', color: '#666' }}>
                      {searchTerm ? 'No Matching Transactions' : 'No Transactions Found'}
                    </h4>
                    <p style={{ margin: '0', color: '#999', fontSize: '14px' }}>
                      {searchTerm ? `No transactions match "${searchTerm}"` : 'This account has no transaction history yet.'}
                    </p>
                    {searchTerm && (
                      <button 
                        onClick={() => setSearchTerm('')}
                        style={{
                          marginTop: '12px',
                          padding: '6px 12px',
                          background: '#f0f0f0',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Clear Search
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Message Popup */}
      {showMessagePopup && (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
          <div 
            className="modal" 
            style={{ 
              maxWidth: '400px', 
              textAlign: 'center',
              animation: 'slideIn 0.3s ease'
            }}
          >
            <div style={{ marginBottom: '20px' }}>
              {messagePopup.type === 'success' ? (
                <div style={{ fontSize: '48px', color: '#16a34a', marginBottom: '15px' }}>
                  <i className="fas fa-check-circle"></i>
                </div>
              ) : (
                <div style={{ fontSize: '48px', color: '#dc2626', marginBottom: '15px' }}>
                  <i className="fas fa-exclamation-circle"></i>
                </div>
              )}
              <h4 style={{ 
                color: messagePopup.type === 'success' ? '#16a34a' : '#dc2626',
                marginBottom: '10px'
              }}>
                {messagePopup.type === 'success' ? 'Success!' : 'Error!'}
              </h4>
              <p style={{ color: '#333333', fontSize: '16px', lineHeight: '1.5' }}>
                {messagePopup.message}
              </p>
            </div>
            <button 
              className="btn btn-primary"
              onClick={() => setShowMessagePopup(false)}
              style={{ minWidth: '100px' }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FundsAccounts;
