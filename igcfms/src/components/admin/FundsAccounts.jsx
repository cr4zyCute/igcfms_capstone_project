import React, { useState, useEffect } from "react";
import "../../assets/admin.css";
import "./css/fundsaccount.css";
import notificationService from "../../services/notificationService";
import balanceService from "../../services/balanceService";
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
    department: "",
  });

  const [editAccount, setEditAccount] = useState({});

  useEffect(() => {
    fetchAccounts();
    //loadAccounts();
    
    // Set up real-time balance updates
    const handleBalanceUpdate = ({ fundAccountId, newBalance, oldBalance }) => {
      setAccounts(prevAccounts => 
        prevAccounts.map(account => 
          account.id === fundAccountId 
            ? { ...account, current_balance: newBalance }
            : account
        )
      );
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
      setAccounts(response);
      setError("");
    } catch (err) {
      setError("Failed to fetch fund accounts. Please try again.");
      console.error("Error fetching accounts:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccountTransactions = async (accountId) => {
    try {
      setTransactionsLoading(true);
      const response = await getFundAccount(accountId);

      setTransactions(response);
    } catch (err) {
      console.error("Error fetching transactions:", err);
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
        account_type: "Revenue",
        department: "",
      });
      setShowAddAccount(false);
      fetchAccounts();
    } catch (err) {
      showPopupMessage("error", "Failed to create fund account. Please try again.");
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
      await updateFundAccount(editAccount.id, {
      name: editAccount.name,
      code: editAccount.code,
      description: editAccount.description,
      initial_balance: Number(editAccount.initial_balance),
      account_type: editAccount.account_type,
      department: editAccount.department,
    });
        showPopupMessage("success", "Fund account updated successfully!");
        setShowEditAccount(false);
        fetchAccounts(); // refresh the list
        setSelectedAccount(null);
    } catch (err) {
      showPopupMessage("error", "Failed to update fund account. Please try again.");
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
          className="btn btn-primary"
          onClick={() => setShowAddAccount(true)}
          disabled={loading}
        >   
          <i className="fas fa-plus"></i>
          Add New Account
        </button>
      </div>


      {showAddAccount && (
        <div className="modal-overlay" onClick={() => setShowAddAccount(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h4><i className="fas fa-plus-circle"></i> Create New Fund Account</h4>
              <button 
                type="button" 
                onClick={() => setShowAddAccount(false)}
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
            <form onSubmit={handleAddAccount}>
              <div className="form-group">
                <label>Account Name</label>
                <input
                  type="text"
                  value={newAccount.name}
                  onChange={(e) =>
                    setNewAccount({ ...newAccount, name: e.target.value })
                  }
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>Account Code</label>
                <input
                  type="text"
                  value="Auto-generated based on account type"
                  disabled
                  style={{ 
                    backgroundColor: '#f5f5f5', 
                    color: '#666',
                    fontStyle: 'italic'
                  }}
                />
                <small style={{ color: '#666', fontSize: '12px' }}>
                  Account code will be automatically generated (e.g., REV001, EXP002)
                </small>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newAccount.description}
                  onChange={(e) =>
                    setNewAccount({
                      ...newAccount,
                      description: e.target.value,
                    })
                  }
                  disabled={loading}
                />
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
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>Account Type</label>
                <select
                  value={newAccount.account_type}
                  onChange={(e) =>
                    setNewAccount({
                      ...newAccount,
                      account_type: e.target.value,
                    })
                  }
                  disabled={loading}
                >
                  <option value="Revenue">Revenue</option>
                  <option value="Expense">Expense</option>
                  <option value="Asset">Asset</option>
                  <option value="Liability">Liability</option>
                  <option value="Equity">Equity</option>
                </select>
              </div>
              <div className="form-group">
                <label>Department</label>
                {/* <select
                  value={newAccount.department}
                  onChange={(e) =>
                    setNewAccount({ ...newAccount, department: e.target.value })
                  }
                  disabled={loading}
                >
                  <option value="">Select Department</option>
                  <option value="Finance">Finance</option>
                  <option value="Administration">Administration</option>
                  <option value="Operations">Operations</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Legal">Legal</option>
                  <option value="Procurement">Procurement</option>
                  <option value="Public Works">Public Works</option>
                  <option value="Health Services">Health Services</option>
                  <option value="Education">Education</option>
                  <option value="Social Services">Social Services</option>
                  <option value="Revenue">Revenue</option>
                </select> */}
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setShowAddAccount(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditAccount && (
        <div className="modal-overlay" onClick={() => setShowEditAccount(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h4><i className="fas fa-edit"></i> Edit Fund Account</h4>
              <button 
                type="button" 
                onClick={() => setShowEditAccount(false)}
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
            <form onSubmit={handleEditAccount}>
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
              <div className="form-group">
                <label>Initial Balance</label>
                <input
                  type="number"
                  step="0.01"
                  value={editAccount.initial_balance}
                  onChange={(e) => {
                    const value = e.target.value;
                    setEditAccount({
                      ...editAccount,
                      initial_balance: value === "" ? "" : parseFloat(value),
                    });
                  }}
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>Account Type</label>
                <select
                  value={editAccount.account_type}
                  onChange={(e) =>
                    setEditAccount({
                      ...editAccount,
                      account_type: e.target.value,
                    })
                  }
                  disabled={loading}
                >
                  <option value="Revenue">Revenue</option>
                  <option value="Expense">Expense</option>
                  <option value="Asset">Asset</option>
                  <option value="Liability">Liability</option>
                  <option value="Equity">Equity</option>
                </select>
              </div>
              <div className="form-group">
                <label>Department</label>
                {/* <select
                  value={editAccount.department}
                  onChange={(e) =>
                    setEditAccount({ ...editAccount, department: e.target.value })
                  }
                  disabled={loading}
                >
                  <option value="">Select Department</option>
                  <option value="Finance">Finance</option>
                  <option value="Administration">Administration</option>
                  <option value="Operations">Operations</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Legal">Legal</option>
                  <option value="Procurement">Procurement</option>
                  <option value="Public Works">Public Works</option>
                  <option value="Health Services">Health Services</option>
                  <option value="Education">Education</option>
                  <option value="Social Services">Social Services</option>
                  <option value="Revenue">Revenue</option>
                </select> */}
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setShowEditAccount(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button type="submit" disabled={loading}>
                  {loading ? "Updating..." : "Update Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="accounts-overview">
        <h4><i className="fas fa-credit-card"></i> Fund Accounts ({accounts.length})</h4>
        <div className="account-cards">
          {accounts.map((account) => (
            <div
              key={account.id}
              className={`account-card ${
                selectedAccount?.id === account.id ? "selected" : ""
              }`}
              onClick={() => handleAccountSelect(account)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <h5>{account.name}</h5>
                <div style={{ fontSize: '20px', color: '#666666' }}>
                  {account.account_type === 'Revenue' && <i className="fas fa-arrow-up"></i>}
                  {account.account_type === 'Expense' && <i className="fas fa-arrow-down"></i>}
                  {account.account_type === 'Asset' && <i className="fas fa-building"></i>}
                  {account.account_type === 'Liability' && <i className="fas fa-exclamation-triangle"></i>}
                  {account.account_type === 'Equity' && <i className="fas fa-balance-scale"></i>}
                </div>
              </div>
              <p className="code">CODE: {account.code}</p>
              <p className="balance">
                ₱{account.current_balance?.toLocaleString() || "0.00"}
              </p>
              <p className="type">
                <i className="fas fa-tag"></i> {account.account_type}
              </p>
              <p className="department">
                <i className="fas fa-building"></i> {account.department || 'No Department'}
              </p>
              <div className="account-actions">
                <button
                  className="btn btn-sm btn-warning"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedAccount(account);
                    setShowEditAccount(true);
                    setEditAccount({ ...account });
                  }}
                >
                  <i className="fas fa-edit"></i> Edit
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (
                      window.confirm(
                        "Are you sure you want to delete this fund account?"
                      )
                    ) {
                      await handleDeleteAccount(account.id);
                    }
                  }}
                >
                  <i className="fas fa-trash"></i> Delete
                </button>
              </div>
            </div>
          ))}
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
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h4><i className="fas fa-history"></i> Transaction History: {selectedAccount.name}</h4>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#666666', marginBottom: '5px' }}>Account Type</div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#000000' }}>{selectedAccount.account_type}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#666666', marginBottom: '5px' }}>Department</div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#000000' }}>{selectedAccount.department || 'No Department'}</div>
              </div>
            </div>
            
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {transactionsLoading ? (
                <div className="spinner-container">
                  <div className="spinner" aria-label="Loading transactions" />
                </div>
              ) : transactions.length > 0 ? (
                <table style={{ marginTop: '0' }}>
                  <thead>
                    <tr>
                      <th><i className="fas fa-calendar"></i> Date</th>
                      <th><i className="fas fa-file-text"></i> Description</th>
                      <th><i className="fas fa-exchange-alt"></i> Type</th>
                      <th><i className="fas fa-money-bill"></i> Amount</th>
                      <th><i className="fas fa-hashtag"></i> Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td>
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </td>
                        <td>{transaction.description}</td>
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
                          {transaction.amount?.toLocaleString()}
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
                <div className="empty-state">
                  <h4>No Transactions Found</h4>
                  <p>This account has no transaction history yet.</p>
                </div>
              )}
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
