import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import API_BASE_URL from "../../config/api";
import "./css/issuemoney.css";
import notificationService from "../../services/notificationService";
import balanceService from "../../services/balanceService";

const MoneyTransactions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fundAccounts, setFundAccounts] = useState([]);
  const [recipientAccounts, setRecipientAccounts] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  
  // Form states
  const [formData, setFormData] = useState({
    transactionType: "Disbursement", // Collection or Disbursement
    amount: "",
    recipientAccountId: "",
    referenceNo: "",
    fundAccountId: "",
    modeOfPayment: "Cash",
    chequeNumber: "",
    description: "",
    purpose: ""
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [transactionResult, setTransactionResult] = useState(null);

  const API_BASE = API_BASE_URL;
  const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    fetchInitialData();
  }, [token]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError("");

      if (!token) {
        setError("Authentication required. Please log in.");
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      // Fetch fund accounts, recipient accounts, and recent transactions
      const [fundsRes, recipientsRes, transactionsRes] = await Promise.all([
        axios.get(`${API_BASE}/fund-accounts`, { headers }),
        axios.get(`${API_BASE}/recipient-accounts`, { headers }).catch(() => ({ data: { success: true, data: [] } })),
        axios.get(`${API_BASE}/transactions`, { headers }).catch(() => ({ data: [] }))
      ]);

      // Process fund accounts
      const fundAccountsData = Array.isArray(fundsRes.data) ? fundsRes.data : (fundsRes.data?.data || []);
      
      // Process recipient accounts
      let recipientAccountsData = [];
      if (recipientsRes.data?.success && Array.isArray(recipientsRes.data.data)) {
        recipientAccountsData = recipientsRes.data.data;
      } else if (Array.isArray(recipientsRes.data)) {
        recipientAccountsData = recipientsRes.data;
      }
      
      setFundAccounts(fundAccountsData);
      setRecipientAccounts(recipientAccountsData);
      
      // Get recent transactions
      const allTransactions = transactionsRes.data || [];
      const recent = allTransactions
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);
      setRecentTransactions(recent);

    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const showMessage = (message, type = 'success') => {
    if (type === 'success') {
      setSuccess(message);
      setError("");
    } else {
      setError(message);
      setSuccess("");
    }
    setTimeout(() => {
      setSuccess("");
      setError("");
    }, 5000);
  };

  const validateForm = async () => {
    const { transactionType, amount, recipientAccountId, referenceNo, fundAccountId, modeOfPayment, chequeNumber, purpose } = formData;

    if (!amount || parseFloat(amount) <= 0) {
      showMessage("Please enter a valid amount.", 'error');
      return false;
    }
    if (!recipientAccountId) {
      showMessage("Please select a recipient account.", 'error');
      return false;
    }
    if (!referenceNo.trim()) {
      showMessage("Please enter reference number.", 'error');
      return false;
    }
    if (!fundAccountId) {
      showMessage("Please select a fund account.", 'error');
      return false;
    }
    if (!purpose.trim()) {
      showMessage("Please enter the purpose.", 'error');
      return false;
    }
    if (modeOfPayment === "Cheque" && !chequeNumber.trim()) {
      showMessage("Please enter cheque number.", 'error');
      return false;
    }

    // For disbursements, check fund balance
    if (transactionType === "Disbursement") {
      const selectedFund = fundAccounts.find(fund => fund.id === parseInt(fundAccountId));
      if (!selectedFund) {
        showMessage("Selected fund account not found.", 'error');
        return false;
      }

      const currentBalance = parseFloat(selectedFund.current_balance || 0);
      const requestedAmount = parseFloat(amount);
      
      if (requestedAmount > currentBalance) {
        showMessage(`Available: ₱${currentBalance.toLocaleString()}`, 'error');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const isValid = await validateForm();
    if (!isValid) return;
    
    setShowConfirmModal(true);
  };

  const confirmTransaction = async () => {
    setLoading(true);
    setShowConfirmModal(false);
    
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const selectedRecipient = recipientAccounts.find(r => r.id === parseInt(formData.recipientAccountId));
      const selectedFund = fundAccounts.find(f => f.id === parseInt(formData.fundAccountId));

      // Create transaction
      const transactionPayload = {
        type: formData.transactionType,
        amount: formData.transactionType === "Collection" 
          ? parseFloat(formData.amount)  // Positive for collections
          : -parseFloat(formData.amount), // Negative for disbursements
        description: formData.description.trim() || `${formData.purpose} - ${formData.transactionType} ${formData.transactionType === "Collection" ? "from" : "to"} ${selectedRecipient?.name || 'Recipient'}`,
        recipient: selectedRecipient?.name || 'Unknown Recipient',
        recipient_account_id: parseInt(formData.recipientAccountId),
        department: "General",
        category: formData.transactionType,
        reference: formData.referenceNo.trim(),
        reference_no: formData.referenceNo.trim(),
        fund_account_id: parseInt(formData.fundAccountId),
        mode_of_payment: formData.modeOfPayment,
        purpose: formData.purpose.trim(),
        cheque_number: formData.modeOfPayment === "Cheque" ? formData.chequeNumber.trim() : null,
        created_by: parseInt(userId) || 1
      };

      const transactionRes = await axios.post(`${API_BASE}/transactions`, transactionPayload, { headers });
      const transactionId = transactionRes.data.id || transactionRes.data.data?.id;

      // Update local fund accounts state to reflect balance change
      if (selectedFund) {
        const currentBalance = parseFloat(selectedFund.current_balance || 0);
        const amountChange = formData.transactionType === "Collection" 
          ? parseFloat(formData.amount)   // Add for collections
          : -parseFloat(formData.amount); // Subtract for disbursements
        const newBalance = currentBalance + amountChange;

        setFundAccounts(prevAccounts => 
          prevAccounts.map(account => 
            account.id === parseInt(formData.fundAccountId)
              ? { ...account, current_balance: newBalance }
              : account
          )
        );
      }

      setTransactionResult({
        transactionId,
        type: formData.transactionType,
        amount: formData.amount,
        recipientName: selectedRecipient?.name || 'Unknown Recipient',
        referenceNo: formData.referenceNo,
        purpose: formData.purpose,
        modeOfPayment: formData.modeOfPayment,
        fundAccount: selectedFund?.name || 'Unknown Fund'
      });

      // Reset form
      setFormData({
        transactionType: "Disbursement",
        amount: "",
        recipientAccountId: "",
        referenceNo: "",
        fundAccountId: "",
        description: "",
        modeOfPayment: "Cash",
        chequeNumber: "",
        purpose: ""
      });

      setShowSuccessModal(true);
      fetchInitialData(); // Refresh data

    } catch (err) {
      console.error("Error creating transaction:", err);
      showMessage(err.response?.data?.message || "Failed to create transaction.", 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading && (!Array.isArray(fundAccounts) || fundAccounts.length === 0)) {
    return (
      <div className="issue-money-loading">
        <div className="spinner"></div>
        <div className="loading-text">Loading transaction system...</div>
      </div>
    );
  }

  return (
    <div className="issue-money-page">
      <div className="im-header">
        <h2 className="im-title">
          <i className="fas fa-exchange-alt"></i> Money Transactions
        </h2>
        <p className="im-subtitle">
          Create collection and disbursement transactions for fund management
        </p>
      </div>

      {error && (
        <div className="error-banner">
          <i className="fas fa-exclamation-triangle"></i>
          {error}
        </div>
      )}

      {success && (
        <div className="success-banner">
          <i className="fas fa-check-circle"></i>
          {success}
        </div>
      )}

      <div className="im-content-grid">
        {/* Transaction Form */}
        <div className="disbursement-form-section">
          <div className="form-header">
            <h3><i className="fas fa-plus-circle"></i> Create New Transaction</h3>
            <button 
              type="button" 
              className="refresh-btn"
              onClick={fetchInitialData}
              disabled={loading}
              title="Refresh data"
            >
              <i className="fas fa-sync-alt"></i> Refresh
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="disbursement-form">
            <div className="form-row">
              <div className="form-group">
                <label>Transaction Type *</label>
                <select
                  value={formData.transactionType}
                  onChange={(e) => handleInputChange('transactionType', e.target.value)}
                  required
                >
                  <option value="Collection">Collection (Add Money to Fund)</option>
                  <option value="Disbursement">Disbursement (Deduct Money from Fund)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Enter amount (e.g., 1000.00)"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Recipient Account *</label>
                <select
                  value={formData.recipientAccountId}
                  onChange={(e) => handleInputChange('recipientAccountId', e.target.value)}
                  required
                >
                  <option value="">-- Select Recipient Account --</option>
                  {recipientAccounts.map((recipient) => (
                    <option key={recipient.id} value={recipient.id}>
                      {recipient.name} ({recipient.fund_code || 'N/A'}) - {recipient.contact_person}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Reference Number *</label>
                <input
                  type="text"
                  placeholder="Enter reference number"
                  value={formData.referenceNo}
                  onChange={(e) => handleInputChange('referenceNo', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Purpose *</label>
                <select
                  value={formData.purpose}
                  onChange={(e) => handleInputChange('purpose', e.target.value)}
                  required
                >
                  <option value="">-- Select Purpose --</option>
                  <option value="Salary Payment">Salary Payment</option>
                  <option value="Reimbursement">Reimbursement</option>
                  <option value="Supplier Payment">Supplier Payment</option>
                  <option value="Contractor Payment">Contractor Payment</option>
                  <option value="Utility Bills">Utility Bills</option>
                  <option value="Office Supplies">Office Supplies</option>
                  <option value="Professional Services">Professional Services</option>
                  <option value="Travel Expenses">Travel Expenses</option>
                  <option value="Equipment Purchase">Equipment Purchase</option>
                  <option value="Maintenance">Maintenance & Repairs</option>
                  <option value="Tax Collection">Tax Collection</option>
                  <option value="Permit Fees">Permit Fees</option>
                  <option value="License Fees">License Fees</option>
                  <option value="Service Fees">Service Fees</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Fund Account *</label>
                <select
                  value={formData.fundAccountId}
                  onChange={(e) => handleInputChange('fundAccountId', e.target.value)}
                  required
                >
                  <option value="">-- Select Fund Account --</option>
                  {fundAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.code}) - ₱{parseFloat(acc.current_balance || 0).toLocaleString()}
                    </option>
                  ))}
                </select>
                {formData.fundAccountId && (
                  <div className="balance-info">
                    {(() => {
                      const selectedFund = fundAccounts.find(f => f.id === parseInt(formData.fundAccountId));
                      return selectedFund ? (
                        <small className="balance-display">
                          <i className="fas fa-wallet"></i> 
                          Available: ₱{parseFloat(selectedFund.current_balance || 0).toLocaleString()}
                        </small>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Payment Mode *</label>
                <select
                  value={formData.modeOfPayment}
                  onChange={(e) => handleInputChange('modeOfPayment', e.target.value)}
                  required
                >
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
              {formData.modeOfPayment === "Cheque" && (
                <div className="form-group">
                  <label>Cheque Number *</label>
                  <input
                    type="text"
                    placeholder="Enter cheque number"
                    value={formData.chequeNumber}
                    onChange={(e) => handleInputChange('chequeNumber', e.target.value)}
                    required
                  />
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                placeholder="Enter transaction description (optional)"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows="3"
              />
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Processing...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane"></i> Create {formData.transactionType}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Recent Transactions */}
        <div className="recent-disbursements-section">
          <div className="section-header">
            <h3><i className="fas fa-history"></i> Recent Transactions</h3>
          </div>
          
          <div className="disbursements-list">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((transaction) => (
                <div key={transaction.id} className="disbursement-card">
                  <div className="disbursement-header">
                    <span className="disbursement-id">#{transaction.id}</span>
                    <span className={`disbursement-amount ${transaction.type === 'Collection' ? 'positive' : 'negative'}`}>
                      {transaction.type === 'Collection' ? '+' : '-'}₱{Math.abs(parseFloat(transaction.amount || 0)).toLocaleString()}
                    </span>
                  </div>
                  <div className="disbursement-details">
                    <div className="detail-row">
                      <span className="label">Type:</span>
                      <span className="value">{transaction.type}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Recipient:</span>
                      <span className="value">{transaction.recipient || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Purpose:</span>
                      <span className="value">{transaction.purpose || transaction.category || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Date:</span>
                      <span className="value">{new Date(transaction.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-data">
                <i className="fas fa-inbox"></i>
                <p>No recent transactions found.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>
                <i className="fas fa-question-circle"></i> 
                Confirm {formData.transactionType}
              </h4>
              <button onClick={() => setShowConfirmModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="confirmation-details">
                <div className="detail-item">
                  <label>Transaction Type:</label>
                  <span>{formData.transactionType}</span>
                </div>
                <div className="detail-item">
                  <label>Amount:</label>
                  <span>₱{parseFloat(formData.amount || 0).toLocaleString()}</span>
                </div>
                <div className="detail-item">
                  <label>Purpose:</label>
                  <span>{formData.purpose}</span>
                </div>
                <div className="detail-item">
                  <label>Fund Account:</label>
                  <span>{fundAccounts.find(f => f.id === parseInt(formData.fundAccountId))?.name || 'Unknown'}</span>
                </div>
                <div className="detail-item">
                  <label>Recipient:</label>
                  <span>{recipientAccounts.find(r => r.id === parseInt(formData.recipientAccountId))?.name || 'Unknown'}</span>
                </div>
                <div className="detail-item">
                  <label>Reference:</label>
                  <span>{formData.referenceNo}</span>
                </div>
                <div className="detail-item">
                  <label>Payment Mode:</label>
                  <span>{formData.modeOfPayment}</span>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowConfirmModal(false)} className="cancel-btn">
                Cancel
              </button>
              <button onClick={confirmTransaction} className="confirm-btn" disabled={loading}>
                {loading ? 'Processing...' : `Confirm ${formData.transactionType}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && transactionResult && (
        <div className="modal-overlay" onClick={() => setShowSuccessModal(false)}>
          <div className="modal-content success-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header success">
              <h4>
                <i className="fas fa-check-circle"></i> 
                {transactionResult.type} Created Successfully!
              </h4>
              <button onClick={() => setShowSuccessModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="success-details">
                <div className="detail-item">
                  <label>Transaction ID:</label>
                  <span>#{transactionResult.transactionId}</span>
                </div>
                <div className="detail-item">
                  <label>Type:</label>
                  <span>{transactionResult.type}</span>
                </div>
                <div className="detail-item">
                  <label>Amount:</label>
                  <span>₱{parseFloat(transactionResult.amount).toLocaleString()}</span>
                </div>
                <div className="detail-item">
                  <label>Recipient:</label>
                  <span>{transactionResult.recipientName}</span>
                </div>
                <div className="detail-item">
                  <label>Fund Account:</label>
                  <span>{transactionResult.fundAccount}</span>
                </div>
                <div className="detail-item">
                  <label>Reference:</label>
                  <span>{transactionResult.referenceNo}</span>
                </div>
                <div className="detail-item">
                  <label>Purpose:</label>
                  <span>{transactionResult.purpose}</span>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowSuccessModal(false)} className="confirm-btn">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoneyTransactions;
