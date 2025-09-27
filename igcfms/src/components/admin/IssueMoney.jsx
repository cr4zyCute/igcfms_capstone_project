import React, { useState, useEffect } from "react";
import axios from "axios";
import "./css/issuemoney.css";
import notificationService from "../../services/notificationService";
import balanceService from "../../services/balanceService";
import { broadcastFundTransaction } from "../../services/fundTransactionChannel";

const IssueMoney = () => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fundAccounts, setFundAccounts] = useState([]);
  const [recipientAccounts, setRecipientAccounts] = useState([]);
  const [recentDisbursements, setRecentDisbursements] = useState([]);
  
  // Form states
  const [formData, setFormData] = useState({
    amount: "",
    recipientAccountId: "",
    payeeName: "", // Manual payee name input
    referenceNo: "", // Will be auto-generated
    fundAccountId: "",
    modeOfPayment: "Cash",
    chequeNumber: "",
    description: "",
    purpose: ""
  });

  // Generate reference number function (moved up for initialization)
  const generateReferenceNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const timestamp = now.getTime().toString().slice(-4);
    
    const prefix = "DISB";
    return `${prefix}-${year}${month}${day}-${timestamp}`;
  };

  // Auto-generate reference number when component loads
  useEffect(() => {
    const autoRefNo = generateReferenceNumber();
    setFormData(prev => ({
      ...prev,
      referenceNo: autoRefNo
    }));
  }, []);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [disbursementResult, setDisbursementResult] = useState(null);

  const API_BASE = "http://localhost:8000/api";
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  const normalizeAmount = (value) => {
    const parsed = Number.parseFloat(value);
    if (Number.isNaN(parsed)) return 0;
    return Math.round(parsed * 100) / 100;
  };

  useEffect(() => {
    fetchInitialData();
  }, [token]);

  const fetchInitialData = async ({ showLoader = true } = {}) => {
    try {
      if (showLoader) setLoading(true);
      setError("");

      if (!token) {
        setError("Authentication required. Please log in.");
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      // Fetch fund accounts, recipient accounts, and recent disbursements
      const [fundsRes, recipientsRes, transactionsRes] = await Promise.all([
        axios.get(`${API_BASE}/fund-accounts`, { headers }),
        axios.get(`${API_BASE}/recipient-accounts?status=active`, { headers }).then(response => {
          return response;
        }).catch((err) => {


        }),
        axios.get(`${API_BASE}/transactions`, { headers })
      ]);

      // Ensure data is always an array
      const fundAccountsData = Array.isArray(fundsRes.data) ? fundsRes.data : (fundsRes.data?.data || []);
      
      // Handle recipient accounts response format with detailed logging
      let recipientAccountsData = [];
  
      
      if (recipientsRes.data?.success && Array.isArray(recipientsRes.data.data)) {
        recipientAccountsData = recipientsRes.data.data;
        
      } else if (Array.isArray(recipientsRes.data)) {
        recipientAccountsData = recipientsRes.data;
       
      } else if (recipientsRes.data?.data && Array.isArray(recipientsRes.data.data)) {
        recipientAccountsData = recipientsRes.data.data;
        
      } else {
       
      }

      setFundAccounts(fundAccountsData);
      setRecipientAccounts(recipientAccountsData);
      
      // Filter recent disbursements
      const allTransactions = transactionsRes.data || [];
      const disbursements = allTransactions
        .filter(tx => tx.type === 'Disbursement')
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);
      setRecentDisbursements(disbursements);

    } catch (err) {
      console.error('Issue money error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load data');
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };


  // Handle recipient account selection with auto-fill
  const handleRecipientAccountSelect = (recipientAccountId) => {
    if (!recipientAccountId) {
      // Clear all auto-filled fields when no recipient is selected
      setFormData(prev => ({
        ...prev,
        recipientAccountId: '',
        payeeName: ''
      }));
      return;
    }

    const selectedRecipient = recipientAccounts.find(recipient => recipient.id === parseInt(recipientAccountId));
    
    if (selectedRecipient) {
      console.log('Selected recipient account:', selectedRecipient);
      
      // Auto-fill form fields based on selected recipient account
      setFormData(prev => ({
        ...prev,
        recipientAccountId: recipientAccountId,
        payeeName: selectedRecipient.name || '', // Auto-fill payee name
        // You can extend this to auto-fill more fields if available in recipient data:
        // address: selectedRecipient.address || prev.address,
        // phone: selectedRecipient.phone || prev.phone,
        // etc.
      }));
      
      // Clear any previous errors
      setError('');
      
      // Show success message for auto-fill with more details
      const message = ` Auto-filled: ${selectedRecipient.name} (${selectedRecipient.fund_code})`;
      showMessage(message, 'success');
      
      console.log('Auto-filled form data:', {
        recipientId: recipientAccountId,
        payeeName: selectedRecipient.name,
        fundCode: selectedRecipient.fund_code,
        contactPerson: selectedRecipient.contact_person
      });
    } else {
      // Handle case where recipient ID doesn't match any account
      setFormData(prev => ({
        ...prev,
        recipientAccountId: recipientAccountId,
        payeeName: ''
      }));
      
      showMessage('Recipient account not found. Please select a valid account.', 'error');
    }
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
    const { amount, recipientAccountId, payeeName, referenceNo, fundAccountId, modeOfPayment, chequeNumber, purpose } = formData;

    const requestedAmount = normalizeAmount(amount);

    if (!amount || requestedAmount <= 0) {
      showMessage("Please enter a valid amount.", 'error');
      return false;
    }
    if (!recipientAccountId && !payeeName.trim()) {
      showMessage("Please either select a recipient account or enter a payee name.", 'error');
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
      showMessage("Please enter the purpose of payment.", 'error');
      return false;
    }
    if (modeOfPayment === "Cheque" && !chequeNumber.trim()) {
      showMessage("Please enter cheque number.", 'error');
      return false;
    }

    // Check fund balance using the loaded fund accounts data
    try {
      const selectedFund = Array.isArray(fundAccounts) 
        ? fundAccounts.find(fund => fund.id === parseInt(fundAccountId))
        : null;
        
      if (!selectedFund) {
        showMessage("Selected fund account not found. Please refresh and try again.", 'error');
        return false;
      }

      // Use the current_balance from the fund account data
      const currentBalance = normalizeAmount(selectedFund.current_balance || 0);
      
      console.log('Fund Balance Check:', {
        fundName: selectedFund.name,
        currentBalance,
        requestedAmount,
        sufficient: currentBalance >= requestedAmount
      });

      if (requestedAmount > currentBalance) {
        showMessage(`Insufficient funds. Available balance: ₱${currentBalance.toLocaleString()} in ${selectedFund.name}`, 'error');
        return false;
      }

      // Also try to get the latest balance from the service as a backup check
      try {
        const serviceBalance = await balanceService.getFundBalance(parseInt(fundAccountId));
        const latestBalance = normalizeAmount(serviceBalance || 0);
        
        // Use the higher of the two balances (in case of sync issues)
        const actualBalance = Math.max(currentBalance, latestBalance);
        
        if (requestedAmount > actualBalance) {
          showMessage(`Insufficient funds. Available balance: ₱${actualBalance.toLocaleString()} in ${selectedFund.name}`, 'error');
          return false;
        }
      } catch (serviceError) {
        console.warn('Balance service check failed, using fund account data:', serviceError);

      }
      
    } catch (error) {
      console.error('Balance validation error:', error);
      showMessage("Error checking fund balance. Please try again.", 'error');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const isValid = await validateForm();
    if (!isValid) return;
    
    setShowConfirmModal(true);
  };

  const confirmDisbursement = async () => {
    setSubmitting(true);
    setShowConfirmModal(false);
    
    try {
      const headers = { Authorization: `Bearer ${token}` };

      // Get recipient account details with safety checks
      const selectedRecipient = Array.isArray(recipientAccounts) 
        ? recipientAccounts.find(recipient => recipient.id === parseInt(formData.recipientAccountId))
        : null;
      const selectedFund = Array.isArray(fundAccounts) 
        ? fundAccounts.find(fund => fund.id === parseInt(formData.fundAccountId))
        : null;

      // Determine the payee name (manual input takes priority over selected recipient)
      const payeeName = formData.payeeName.trim() || selectedRecipient?.name || 'Unknown Recipient';
      const transactionDescription = formData.description.trim() || `${formData.purpose} - Disbursement to ${payeeName}`;

      const normalizedAmount = normalizeAmount(formData.amount);
      if (normalizedAmount <= 0) {
        showMessage("Please enter a valid amount.", 'error');
        setLoading(false);
        return;
      }

      // Create transaction with enhanced audit trail
      const transactionPayload = {
        type: "Disbursement",
        amount: normalizedAmount, // Always send positive amount, backend handles sign
        description: transactionDescription,
        recipient: payeeName,
        payer_name: "System", // For disbursements, use "System" as payer
        recipient_account_id: formData.recipientAccountId ? parseInt(formData.recipientAccountId) : null,
        department: "General", // Default value since field is required
        category: "Disbursement", // Default value since field is required
        reference: formData.referenceNo.trim(),
        fund_account_id: parseInt(formData.fundAccountId),
        mode_of_payment: formData.modeOfPayment,
        cheque_number: formData.modeOfPayment === "Cheque" ? formData.chequeNumber.trim() : null,
        purpose: formData.purpose.trim(),
        issued_by: parseInt(userId),
        receipt_no: formData.referenceNo.trim(), // Use reference number as receipt number
        reference_no: formData.referenceNo.trim(), // Same as reference number for consistency
        audit_trail: {
          action: "MONEY_ISSUED",
          fund_account: selectedFund?.name || `Fund #${formData.fundAccountId}`,
          recipient_account: selectedRecipient?.name || `Recipient #${formData.recipientAccountId}`,
          amount: normalizedAmount,
          purpose: formData.purpose.trim(),
          payment_method: formData.modeOfPayment,
          reference: formData.referenceNo.trim(),
          timestamp: new Date().toISOString(),
          user_id: parseInt(userId)
        }
      };

      const transactionRes = await axios.post(
        `${API_BASE}/transactions`,
        transactionPayload,
        { headers }
      );

      const transactionId = transactionRes.data.id || transactionRes.data.data?.id;

      // Create disbursement record
      const disbursementPayload = {
        transaction_id: transactionId,
        payee_name: payeeName,
        recipient_account_id: formData.recipientAccountId ? parseInt(formData.recipientAccountId) : null,
        method: formData.modeOfPayment,
        purpose: formData.purpose.trim(),
        cheque_number: formData.modeOfPayment === "Cheque" ? formData.chequeNumber.trim() : null,
        fund_account_id: parseInt(formData.fundAccountId),
        issued_by: parseInt(userId),
      };

      await axios.post(
        `${API_BASE}/disbursements`,
        disbursementPayload,
        { headers }
      );

      // selectedFund already declared above
      
      // Process transaction and update balance
      const currentBalance = parseFloat(selectedFund?.current_balance || 0);
      const amountToDeduct = normalizedAmount;
      const newBalance = normalizeAmount(currentBalance - amountToDeduct);
      
      console.log('Processing balance update:', {
        fund_account_id: parseInt(formData.fundAccountId),
        amount: amountToDeduct,
        current_balance_before: currentBalance,
        new_balance_calculated: newBalance,
        operation: 'SUBTRACT (ISSUE_MONEY)'
      });
      
      try {
        // Try balance service first
        const balanceUpdateResult = await balanceService.processTransaction('ISSUE_MONEY', {
          fund_account_id: parseInt(formData.fundAccountId),
          amount: amountToDeduct,
          recipient: selectedRecipient?.name || 'Unknown Recipient',
          fund_account_name: selectedFund?.name || `Fund Account #${formData.fundAccountId}`,
          transaction_id: transactionId,
          payee_name: selectedRecipient?.name || 'Unknown Recipient',
          purpose: formData.purpose.trim()
        });
        
        console.log('Balance service update completed:', balanceUpdateResult);
        
        // Update local fund accounts state
        setFundAccounts(prevAccounts => 
          prevAccounts.map(account => 
            account.id === parseInt(formData.fundAccountId)
              ? { ...account, current_balance: balanceUpdateResult.newBalance }
              : account
          )
        );

        broadcastFundTransaction({
          accountId: parseInt(formData.fundAccountId),
          type: 'disbursement',
          amount: amountToDeduct,
          source: 'IssueMoney',
          balance: balanceUpdateResult?.newBalance,
        });
        
      } catch (balanceError) {
        console.error('Balance service failed, trying direct update:', balanceError);
        
        // Fallback: Direct API call to update fund account balance
        try {
          await axios.put(
            `${API_BASE}/fund-accounts/${formData.fundAccountId}`,
            { current_balance: newBalance },
            { headers }
          );
          
          console.log('Direct balance update successful:', {
            old_balance: currentBalance,
            new_balance: newBalance,
            amount_deducted: amountToDeduct
          });
          
          // Update local state
          setFundAccounts(prevAccounts => 
            prevAccounts.map(account => 
              account.id === parseInt(formData.fundAccountId)
                ? { ...account, current_balance: newBalance }
                : account
            )
          );

          broadcastFundTransaction({
            accountId: parseInt(formData.fundAccountId),
            type: 'disbursement',
            amount: amountToDeduct,
            source: 'IssueMoney',
            balance: newBalance,
          });
          
        } catch (directUpdateError) {
          console.error('Direct balance update also failed:', directUpdateError);
          showMessage('Transaction created but balance update failed. Please refresh the page.', 'error');
        }
      }

      setDisbursementResult({
        transactionId,
        amount: normalizedAmount,
        recipientName: payeeName,
        recipientAccount: selectedRecipient?.fund_code || 'N/A',
        referenceNo: formData.referenceNo,
        purpose: formData.purpose,
        modeOfPayment: formData.modeOfPayment,
        chequeNumber: formData.chequeNumber,
        fundAccount: selectedFund?.name || 'Unknown Fund'
      });

      // Reset form with new auto-generated reference number
      const newRefNo = generateReferenceNumber();
      setFormData({
        amount: "",
        recipientAccountId: "",
        payeeName: "",
        referenceNo: newRefNo,
        fundAccountId: "",
        description: "",
        modeOfPayment: "Cash",
        chequeNumber: "",
        purpose: "",
      });

      setShowSuccessModal(true);
      fetchInitialData({ showLoader: false }); // Refresh data without blocking UI spinner

    } catch (err) {
      console.error("Error creating disbursement:", err);
      if (err.response?.status === 422 && err.response.data?.errors) {
        const errorMessages = Object.values(err.response.data.errors)
          .flat()
          .join(", ");
        showMessage(`Validation error: ${errorMessages}`, 'error');
      } else {
        showMessage(err.response?.data?.message || "Failed to create disbursement.", 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Department and category removed as requested - using default values in backend

  if (loading && (!Array.isArray(fundAccounts) || fundAccounts.length === 0)) {
    return (
      <div className="issue-money-loading">
        <div className="spinner"></div>
        <div className="loading-text">Loading disbursement system...</div>
      </div>
    );
  }

  return (
    <div className="issue-money-page">
      <div className="im-header">
        <h2 className="im-title">
          <i className="fas fa-money-check-alt"></i> Issue Money / Disbursement
        </h2>
        <p className="im-subtitle">
          Create disbursement transactions for payments and fund transfers
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
        {/* Disbursement Form */}
        <div className="disbursement-form-section">
          <div className="form-header">
            <h3><i className="fas fa-plus-circle"></i> Create New Disbursement</h3>
            <button 
              type="button" 
              className="refresh-btn"
              onClick={() => fetchInitialData()}
              disabled={loading}
              title="Refresh fund balances"
            >
              <i className="fas fa-sync-alt"></i> Refresh
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="disbursement-form">
            <div className="form-row">
              <div className="form-group">
                <label>Recipient Account</label>
                <select
                  value={formData.recipientAccountId}
                  onChange={(e) => handleRecipientAccountSelect(e.target.value)}
                >
                  <option value="">-- Select Recipient Account ({recipientAccounts.length} available) --</option>
                  {Array.isArray(recipientAccounts) && recipientAccounts.length > 0 ? (
                    recipientAccounts.map((recipient) => (
                      <option key={recipient.id} value={recipient.id}>
                        {recipient.name} ({recipient.fund_code}) - {recipient.contact_person}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No recipient accounts available</option>
                  )}
                </select>
                <small className="field-hint">
                  <i className="fas fa-info-circle"></i> 
                  Selecting a recipient account will auto-fill the payee name.
                </small>
              </div>
              <div className="form-group">
                <label>Payee Name {formData.recipientAccountId && formData.payeeName && <span style={{color: '#28a745', fontSize: '12px'}}>(Auto-filled)</span>}</label>
                <input
                  type="text"
                  placeholder={formData.recipientAccountId ? "Auto-filled from recipient account" : "Enter payee name"}
                  value={formData.payeeName}
                  onChange={(e) => handleInputChange('payeeName', e.target.value)}
                  style={formData.recipientAccountId && formData.payeeName ? {
                    backgroundColor: '#f8f9fa',
                    borderColor: '#28a745',
                    color: '#495057'
                  } : {}}
                />
                <small className="field-hint">
                  <i className="fas fa-info-circle"></i> 
                  {formData.recipientAccountId 
                    ? "Auto-filled from the selected account. You can modify if needed."
                    : "Enter the payee name if no recipient account is selected."}
                </small>
              </div>
            </div>

            <div className="form-group">
              <label>Reference Number * <span style={{color: '#28a745', fontSize: '12px'}}>(Auto-generated)</span></label>
              <input
                type="text"
                placeholder="Auto-generated reference number"
                value={formData.referenceNo}
                readOnly
                style={{
                  backgroundColor: '#f8f9fa',
                  borderColor: '#28a745',
                  color: '#495057'
                }}
              />
              <small className="field-hint">
                <i className="fas fa-info-circle"></i> 
                Reference number is automatically generated for each disbursement.
              </small>
            </div>

            <div className="form-row">
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
              <div className="form-group">
                <label>Purpose of Payment *</label>
                <select
                  value={formData.purpose}
                  onChange={(e) => handleInputChange('purpose', e.target.value)}
                  required
                >
                  <option value="">-- Select Purpose --</option>
                  <option value="Salary">Salary Payment</option>
                  <option value="Reimbursement">Reimbursement</option>
                  <option value="Supplier Payment">Supplier Payment</option>
                  <option value="Contractor Payment">Contractor Payment</option>
                  <option value="Utility Bills">Utility Bills</option>
                  <option value="Office Supplies">Office Supplies</option>
                  <option value="Professional Services">Professional Services</option>
                  <option value="Travel Expenses">Travel Expenses</option>
                  <option value="Equipment Purchase">Equipment Purchase</option>
                  <option value="Maintenance">Maintenance & Repairs</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Fund Account (Source) *</label>
                <select
                  value={formData.fundAccountId}
                  onChange={(e) => handleInputChange('fundAccountId', e.target.value)}
                  required
                >
                  <option value="">-- Select Fund Account --</option>
                  {Array.isArray(fundAccounts) && fundAccounts.length > 0 ? (
                    fundAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.code}) - ₱{parseFloat(acc.current_balance || 0).toLocaleString()}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No fund accounts available</option>
                  )}
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

            {/* Fund Account selection moved above with Purpose */}

            <div className="form-group">
              <label>Description</label>
              <textarea
                placeholder="Enter disbursement description (optional)"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows="3"
              />
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="submit-btn"
                disabled={loading || submitting}
              >
                {submitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Processing...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane"></i> Create Disbursement
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Recent Disbursements */}
        <div className="recent-disbursements-section">
          <div className="section-header">
            <h3><i className="fas fa-history"></i> Recent Disbursements</h3>
          </div>
          
          <div className="disbursements-list">
            {recentDisbursements.length > 0 ? (
              recentDisbursements.map((disbursement) => (
                <div key={disbursement.id} className="disbursement-card">
                  <div className="disbursement-header">
                    <span className="disbursement-id">#{disbursement.id}</span>
                    <span className="disbursement-amount">₱{parseFloat(disbursement.amount || 0).toLocaleString()}</span>
                  </div>
                  <div className="disbursement-details">
                    <div className="detail-row">
                      <span className="label">Payee:</span>
                      <span className="value">{disbursement.recipient || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Department:</span>
                      <span className="value">{disbursement.department || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Mode:</span>
                      <span className="value">{disbursement.mode_of_payment || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Date:</span>
                      <span className="value">{new Date(disbursement.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-data">
                <i className="fas fa-inbox"></i>
                <p>No recent disbursements found.</p>
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
              <h3><i className="fas fa-question-circle"></i> Confirm Disbursement</h3>
              <button className="modal-close" onClick={() => setShowConfirmModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="confirmation-details">
                <div className="detail-item">
                  <label>Recipient Account:</label>
                  <span>{Array.isArray(recipientAccounts) ? recipientAccounts.find(r => r.id === parseInt(formData.recipientAccountId))?.name || 'Unknown' : 'Loading...'}</span>
                </div>
                {formData.payeeName && (
                  <div className="detail-item">
                    <label>Payee Name:</label>
                    <span>{formData.payeeName}</span>
                  </div>
                )}
                <div className="detail-item">
                  <label>Fund Account (Source):</label>
                  <span>{Array.isArray(fundAccounts) ? fundAccounts.find(f => f.id === parseInt(formData.fundAccountId))?.name || 'Unknown' : 'Loading...'}</span>
                </div>
                <div className="detail-item">
                  <label>Amount:</label>
                  <span>₱{Math.abs(parseFloat(formData.amount || 0)).toLocaleString()}</span>
                </div>
                <div className="detail-item">
                  <label>Purpose:</label>
                  <span>{formData.purpose}</span>
                </div>
                <div className="detail-item">
                  <label>Reference Number:</label>
                  <span>{formData.referenceNo}</span>
                </div>
                <div className="detail-item">
                  <label>Payment Mode:</label>
                  <span>{formData.modeOfPayment}</span>
                </div>
                {formData.modeOfPayment === "Cheque" && (
                  <div className="detail-item">
                    <label>Cheque Number:</label>
                    <span>{formData.chequeNumber}</span>
                  </div>
                )}
              </div>
              <p className="confirmation-message">
                Are you sure you want to create this disbursement?
              </p>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="confirm-btn"
                onClick={confirmDisbursement}
                disabled={submitting}
              >
                {submitting ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <>
                    <i className="fas fa-check"></i> Confirm
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && disbursementResult && (
        <div className="modal-overlay" onClick={() => setShowSuccessModal(false)}>
          <div className="modal-content success" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-check-circle"></i> Disbursement Created Successfully</h3>
              <button className="modal-close" onClick={() => setShowSuccessModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="success-details">
                <div className="success-icon">
                  <i className="fas fa-check-circle"></i>
                </div>
                <h4>Disbursement Completed</h4>
                <div className="result-details">
                  <div className="detail-item">
                    <label>Transaction ID:</label>
                    <span>#{disbursementResult.transactionId}</span>
                  </div>
                  <div className="detail-item">
                    <label>Amount:</label>
                    <span>₱{parseFloat(disbursementResult.amount).toLocaleString()}</span>
                  </div>
                  <div className="detail-item">
                    <label>Recipient:</label>
                    <span>{disbursementResult.recipientName}</span>
                  </div>
                  <div className="detail-item">
                    <label>Recipient Account:</label>
                    <span>{disbursementResult.recipientAccount}</span>
                  </div>
                  <div className="detail-item">
                    <label>Fund Account:</label>
                    <span>{disbursementResult.fundAccount}</span>
                  </div>
                  <div className="detail-item">
                    <label>Purpose:</label>
                    <span>{disbursementResult.purpose}</span>
                  </div>
                  <div className="detail-item">
                    <label>Reference:</label>
                    <span>{disbursementResult.referenceNo}</span>
                  </div>
                  <div className="detail-item">
                    <label>Payment Mode:</label>
                    <span>{disbursementResult.modeOfPayment}</span>
                  </div>
                  {disbursementResult.modeOfPayment === "Cheque" && (
                    <div className="detail-item">
                      <label>Cheque Number:</label>
                      <span>{disbursementResult.chequeNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="close-btn"
                onClick={() => setShowSuccessModal(false)}
              >
                <i className="fas fa-times"></i> Close
              </button>
              <button
                type="button"
                className="print-btn"
                onClick={() => window.print()}
              >
                <i className="fas fa-print"></i> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueMoney;
