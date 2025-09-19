import React, { useState, useEffect } from "react";
import axios from "axios";
import "./css/issuemoney.css";

const IssueMoney = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fundAccounts, setFundAccounts] = useState([]);
  const [recentDisbursements, setRecentDisbursements] = useState([]);
  
  // Form states
  const [formData, setFormData] = useState({
    amount: "",
    payeeName: "",
    referenceNo: "",
    fundAccountId: "",
    description: "",
    department: "",
    category: "",
    modeOfPayment: "Cash",
    chequeNumber: "",
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [disbursementResult, setDisbursementResult] = useState(null);

  const API_BASE = "http://localhost:8000/api";
  const token = localStorage.getItem("token");
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

      // Fetch fund accounts and recent disbursements
      const [fundsRes, transactionsRes] = await Promise.all([
        axios.get(`${API_BASE}/fund-accounts`, { headers }),
        axios.get(`${API_BASE}/transactions`, { headers })
      ]);

      setFundAccounts(fundsRes.data || []);
      
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

  const validateForm = () => {
    const { amount, payeeName, referenceNo, fundAccountId, department, category, modeOfPayment, chequeNumber } = formData;

    if (!amount || parseFloat(amount) <= 0) {
      showMessage("Please enter a valid amount.", 'error');
      return false;
    }
    if (!payeeName.trim()) {
      showMessage("Please enter payee name.", 'error');
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
    if (!department) {
      showMessage("Please select a department.", 'error');
      return false;
    }
    if (!category) {
      showMessage("Please select a category.", 'error');
      return false;
    }
    if (modeOfPayment === "Cheque" && !chequeNumber.trim()) {
      showMessage("Please enter cheque number.", 'error');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setShowConfirmModal(true);
  };

  const confirmDisbursement = async () => {
    setLoading(true);
    setShowConfirmModal(false);
    
    try {
      const headers = { Authorization: `Bearer ${token}` };

      // Create transaction
      const transactionPayload = {
        type: "Disbursement",
        amount: parseFloat(formData.amount),
        description: formData.description.trim() || `Disbursement to ${formData.payeeName}`,
        recipient: formData.payeeName.trim(),
        department: formData.department,
        category: formData.category,
        reference: formData.referenceNo.trim(),
        reference_no: formData.referenceNo.trim(),
        fund_account_id: parseInt(formData.fundAccountId),
        mode_of_payment: formData.modeOfPayment,
        created_by: parseInt(userId),
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
        payee_name: formData.payeeName.trim(),
        method: formData.modeOfPayment,
        cheque_number: formData.modeOfPayment === "Cheque" ? formData.chequeNumber.trim() : null,
      };

      await axios.post(
        `${API_BASE}/disbursements`,
        disbursementPayload,
        { headers }
      );

      setDisbursementResult({
        transactionId,
        amount: formData.amount,
        payeeName: formData.payeeName,
        referenceNo: formData.referenceNo,
        modeOfPayment: formData.modeOfPayment,
        chequeNumber: formData.chequeNumber
      });

      // Reset form
      setFormData({
        amount: "",
        payeeName: "",
        referenceNo: "",
        fundAccountId: "",
        description: "",
        department: "",
        category: "",
        modeOfPayment: "Cash",
        chequeNumber: "",
      });

      setShowSuccessModal(true);
      fetchInitialData(); // Refresh data

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
      setLoading(false);
    }
  };

  const departments = [
    "Finance", "Administration", "Operations", "HR", "IT", "Legal",
    "Procurement", "Public Works", "Health Services", "Education", 
    "Social Services", "Other"
  ];

  const categories = [
    "Salaries", "Office Supplies", "Equipment", "Utilities", "Travel",
    "Professional Services", "Maintenance", "Insurance", "Training",
    "Communications", "Rent", "Other"
  ];

  if (loading && fundAccounts.length === 0) {
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
          </div>
          
          <form onSubmit={handleSubmit} className="disbursement-form">
            <div className="form-row">
              <div className="form-group">
                <label>Payee Name *</label>
                <input
                  type="text"
                  placeholder="Enter payee name"
                  value={formData.payeeName}
                  onChange={(e) => handleInputChange('payeeName', e.target.value)}
                  required
                />
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
                <label>Amount (₱) *</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  min="0.01"
                  step="0.01"
                  required
                />
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

            <div className="form-row">
              <div className="form-group">
                <label>Department *</label>
                <select
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  required
                >
                  <option value="">-- Select Department --</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  required
                >
                  <option value="">-- Select Category --</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
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
                    {acc.name} ({acc.code}) - {acc.account_type} - ₱{parseFloat(acc.current_balance || 0).toLocaleString()}
                  </option>
                ))}
              </select>
            </div>

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
                disabled={loading}
              >
                {loading ? (
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
                  <label>Payee Name:</label>
                  <span>{formData.payeeName}</span>
                </div>
                <div className="detail-item">
                  <label>Amount:</label>
                  <span>₱{parseFloat(formData.amount || 0).toLocaleString()}</span>
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
                <div className="detail-item">
                  <label>Department:</label>
                  <span>{formData.department}</span>
                </div>
                <div className="detail-item">
                  <label>Category:</label>
                  <span>{formData.category}</span>
                </div>
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
                disabled={loading}
              >
                {loading ? (
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
                    <label>Payee:</label>
                    <span>{disbursementResult.payeeName}</span>
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
