import React, { useState, useEffect } from "react";
import axios from "axios";
import "./css/overridetransactions.css";

const OverrideTransactions = ({ role = "Admin" }) => {
  const [transactions, setTransactions] = useState([]);
  const [overrideRequests, setOverrideRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState("");
  const [reason, setReason] = useState("");
  const [proposedChanges, setProposedChanges] = useState({});
  const [reviewNotes, setReviewNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Filter states
  const [filters, setFilters] = useState({
    status: "all",
    dateFrom: "",
    dateTo: "",
    searchTerm: ""
  });

  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0
  });

  const API_BASE = "http://localhost:8000/api";
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchData();
  }, [token]);

  useEffect(() => {
    applyFilters();
  }, [overrideRequests, filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      if (!token) {
        setError("Authentication required. Please log in.");
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      // Fetch only what we need based on user role
      if (role === "Admin") {
        // Admin needs both transactions and override requests
        const [transactionsRes, overrideRes] = await Promise.all([
          axios.get(`${API_BASE}/transactions`, { headers }).catch(() => ({ data: [] })),
          axios.get(`${API_BASE}/override_requests`, { headers }).catch(() => ({ data: [] }))
        ]);

        setTransactions(transactionsRes.data || []);
        const requests = overrideRes.data || [];
        setOverrideRequests(requests);

        // Calculate statistics
        const totalRequests = requests.length;
        const pendingRequests = requests.filter(req => req.status === 'pending').length;
        const approvedRequests = requests.filter(req => req.status === 'approved').length;
        const rejectedRequests = requests.filter(req => req.status === 'rejected').length;

        setStats({
          totalRequests: totalRequests,
          pendingRequests: pendingRequests,
          approvedRequests: approvedRequests,
          rejectedRequests: rejectedRequests
        });
      } else {
        // Cashier only needs transactions for creating requests
        const transactionsRes = await axios.get(`${API_BASE}/transactions`, { headers }).catch(() => ({ data: [] }));
        setTransactions(transactionsRes.data || []);

        // Get cashier's own requests
        const overrideRes = await axios.get(`${API_BASE}/override_requests/my_requests`, { headers }).catch(() => ({ data: [] }));
        const requests = overrideRes.data || [];
        setOverrideRequests(requests);

        setStats({
          totalRequests: requests.length,
          pendingRequests: requests.filter(req => req.status === 'pending').length,
          approvedRequests: requests.filter(req => req.status === 'approved').length,
          rejectedRequests: requests.filter(req => req.status === 'rejected').length
        });
      }

    } catch (err) {
      console.error('Override transactions error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...overrideRequests];

    // Status filter
    if (filters.status !== "all") {
      filtered = filtered.filter(req => req.status === filters.status);
    }

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(req => 
        new Date(req.created_at) >= new Date(filters.dateFrom)
      );
    }
    if (filters.dateTo) {
      filtered = filtered.filter(req => 
        new Date(req.created_at) <= new Date(filters.dateTo + "T23:59:59")
      );
    }

    // Search term filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(req => 
        req.reason?.toLowerCase().includes(searchLower) ||
        req.transaction_id?.toString().includes(searchLower) ||
        req.id.toString().includes(searchLower)
      );
    }

    setFilteredRequests(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: "all",
      dateFrom: "",
      dateTo: "",
      searchTerm: ""
    });
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

  // Submit override request
  const handleSubmitOverride = async (e) => {
    e.preventDefault();
    
    if (!selectedTransaction || !reason.trim()) {
      showMessage("Please select a transaction and provide a reason.", 'error');
      return;
    }

    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const payload = {
        transaction_id: parseInt(selectedTransaction),
        reason: reason.trim(),
        changes: proposedChanges
      };

      await axios.post(`${API_BASE}/transactions/override`, payload, { headers });

      showMessage("Override request submitted successfully!");
      setSelectedTransaction("");
      setReason("");
      setProposedChanges({});
      setShowCreateModal(false);
      
      // Refresh data
      fetchData();
    } catch (err) {
      console.error(err);
      showMessage(err.response?.data?.message || "Failed to submit override request.", 'error');
    } finally {
      setLoading(false);
    }
  };

  // Admin review
  const handleReview = async (requestId, status) => {
    if (!reviewNotes.trim()) {
      showMessage("Please provide review notes.", 'error');
      return;
    }

    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      await axios.put(`${API_BASE}/override_requests/${requestId}/review`, {
        status,
        review_notes: reviewNotes.trim()
      }, { headers });

      showMessage(`Override request ${status} successfully!`);
      setReviewNotes("");
      setShowReviewModal(false);
      setSelectedRequest(null);
      
      // Refresh data
      fetchData();
    } catch (err) {
      console.error(err);
      showMessage(err.response?.data?.message || "Failed to review request.", 'error');
    } finally {
      setLoading(false);
    }
  };

  const openReviewModal = (request) => {
    setSelectedRequest(request);
    setShowReviewModal(true);
  };

  if (loading) {
    return (
      <div className="override-loading">
        <div className="spinner"></div>
        <div className="loading-text">Loading override transactions...</div>
      </div>
    );
  }

  return (
    <div className="override-transactions-page">
      <div className="ot-header">
        <h2 className="ot-title">
          <i className="fas fa-edit"></i> Override Transactions
        </h2>
        <div className="header-actions">
          <button 
            className="create-override-btn"
            onClick={() => setShowCreateModal(true)}
          >
            <i className="fas fa-plus"></i> New Override Request
          </button>
          <button 
            className="refresh-btn"
            onClick={fetchData}
          >
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
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

      {/* Statistics Cards */}
      <div className="ot-stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">
            <i className="fas fa-list"></i>
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Requests</div>
            <div className="stat-value">{stats.totalRequests}</div>
          </div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon">
            <i className="fas fa-clock"></i>
          </div>
          <div className="stat-content">
            <div className="stat-label">Pending Review</div>
            <div className="stat-value">{stats.pendingRequests}</div>
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon">
            <i className="fas fa-check"></i>
          </div>
          <div className="stat-content">
            <div className="stat-label">Approved</div>
            <div className="stat-value">{stats.approvedRequests}</div>
          </div>
        </div>
        <div className="stat-card danger">
          <div className="stat-icon">
            <i className="fas fa-times"></i>
          </div>
          <div className="stat-content">
            <div className="stat-label">Rejected</div>
            <div className="stat-value">{stats.rejectedRequests}</div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="ot-filters-section">
        <div className="filters-header">
          <h3><i className="fas fa-filter"></i> Filter Override Requests</h3>
          <button className="clear-filters-btn" onClick={clearFilters}>
            <i className="fas fa-times"></i> Clear Filters
          </button>
        </div>
        
        <div className="filters-grid">
          <div className="filter-group">
            <label>Status</label>
            <select 
              value={filters.status} 
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Date From</label>
            <input 
              type="date" 
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Date To</label>
            <input 
              type="date" 
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Search</label>
            <input 
              type="text" 
              placeholder="Search by reason, transaction ID..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Override Requests Table */}
      <div className="ot-requests-section">
        <div className="requests-header">
          <h3><i className="fas fa-table"></i> Override Requests</h3>
          <div className="requests-count">
            Showing {filteredRequests.length} of {overrideRequests.length} requests
          </div>
        </div>

        <div className="requests-table-container">
          <table className="requests-table">
            <thead>
              <tr>
                <th><i className="fas fa-hashtag"></i> ID</th>
                <th><i className="fas fa-exchange-alt"></i> Transaction</th>
                <th><i className="fas fa-user"></i> Requested By</th>
                <th><i className="fas fa-comment"></i> Reason</th>
                <th><i className="fas fa-edit"></i> Proposed Changes</th>
                <th><i className="fas fa-flag"></i> Status</th>
                <th><i className="fas fa-calendar"></i> Date</th>
                <th><i className="fas fa-cogs"></i> Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length > 0 ? (
                filteredRequests.map((request) => (
                  <tr key={request.id}>
                    <td>#{request.id}</td>
                    <td>
                      <div className="transaction-info">
                        <span className="transaction-id">#{request.transaction_id}</span>
                      </div>
                    </td>
                    <td>{request.requested_by?.name || request.requestedBy?.name || 'N/A'}</td>
                    <td className="reason-cell">
                      {request.reason || 'No reason provided'}
                    </td>
                    <td className="changes-cell">
                      {request.changes ? (
                        <div className="changes-preview">
                          <i className="fas fa-eye" title="View changes"></i>
                          Changes proposed
                        </div>
                      ) : (
                        'No changes'
                      )}
                    </td>
                    <td>
                      <span className={`status-badge ${request.status}`}>
                        {request.status}
                      </span>
                    </td>
                    <td>{new Date(request.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="action-buttons">
                        {role === "Admin" && request.status === 'pending' && (
                          <button 
                            className="review-btn"
                            onClick={() => openReviewModal(request)}
                            title="Review Request"
                          >
                            <i className="fas fa-gavel"></i>
                          </button>
                        )}
                        <button 
                          className="view-btn"
                          onClick={() => {/* View details */}}
                          title="View Details"
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="no-data">
                    <i className="fas fa-inbox"></i>
                    <p>No override requests found matching your criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Override Request Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-plus"></i> Create Override Request</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmitOverride}>
                <div className="form-group">
                  <label>Select Transaction</label>
                  <select
                    value={selectedTransaction}
                    onChange={(e) => setSelectedTransaction(e.target.value)}
                    required
                  >
                    <option value="">-- Select Transaction --</option>
                    {transactions.map((tx) => (
                      <option key={tx.id} value={tx.id}>
                        #{tx.id} - {tx.type} - ₱{parseFloat(tx.amount || 0).toLocaleString()} - {tx.description || 'No description'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Reason for Override</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4}
                    placeholder="Explain why this transaction needs to be overridden..."
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Proposed New Amount (Optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    onChange={(e) =>
                      setProposedChanges((prev) => ({ ...prev, amount: e.target.value }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Proposed New Description (Optional)</label>
                  <input
                    type="text"
                    placeholder="New description"
                    onChange={(e) =>
                      setProposedChanges((prev) => ({ ...prev, description: e.target.value }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Proposed New Category (Optional)</label>
                  <select
                    onChange={(e) =>
                      setProposedChanges((prev) => ({ ...prev, category: e.target.value }))
                    }
                  >
                    <option value="">-- Keep Current Category --</option>
                    <option value="Tax Collection">Tax Collection</option>
                    <option value="Permit Fees">Permit Fees</option>
                    <option value="License Fees">License Fees</option>
                    <option value="Service Fees">Service Fees</option>
                    <option value="Fines and Penalties">Fines and Penalties</option>
                    <option value="Salaries">Salaries</option>
                    <option value="Office Supplies">Office Supplies</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Proposed New Department (Optional)</label>
                  <select
                    onChange={(e) =>
                      setProposedChanges((prev) => ({ ...prev, department: e.target.value }))
                    }
                  >
                    <option value="">-- Keep Current Department --</option>
                    <option value="Finance">Finance</option>
                    <option value="Administration">Administration</option>
                    <option value="Operations">Operations</option>
                    <option value="HR">HR</option>
                    <option value="IT">IT</option>
                    <option value="Legal">Legal</option>
                    <option value="Procurement">Procurement</option>
                    <option value="Public Works">Public Works</option>
                    <option value="Health Services">Health Services</option>
                    <option value="Education">Education</option>
                    <option value="Social Services">Social Services</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="submit-btn"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i> Submitting...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane"></i> Submit Request
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedRequest && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-gavel"></i> Review Override Request</h3>
              <button className="modal-close" onClick={() => setShowReviewModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="request-details">
                <div className="detail-item">
                  <label>Request ID:</label>
                  <span>#{selectedRequest.id}</span>
                </div>
                <div className="detail-item">
                  <label>Transaction ID:</label>
                  <span>#{selectedRequest.transaction_id}</span>
                </div>
                <div className="detail-item">
                  <label>Requested By:</label>
                  <span>{selectedRequest.requested_by?.name || selectedRequest.requestedBy?.name || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>Reason:</label>
                  <span>{selectedRequest.reason}</span>
                </div>
                <div className="detail-item">
                  <label>Proposed Changes:</label>
                  <span>{selectedRequest.changes || 'No changes proposed'}</span>
                </div>
                <div className="detail-item">
                  <label>Request Date:</label>
                  <span>{new Date(selectedRequest.created_at).toLocaleString()}</span>
                </div>
              </div>

              <div className="form-group">
                <label>Review Notes</label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={4}
                  placeholder="Provide your review notes..."
                  required
                />
              </div>

              <div className="review-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowReviewModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="reject-btn"
                  onClick={() => handleReview(selectedRequest.id, 'rejected')}
                  disabled={loading}
                >
                  {loading ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : (
                    <>
                      <i className="fas fa-times"></i> Reject
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="approve-btn"
                  onClick={() => handleReview(selectedRequest.id, 'approved')}
                  disabled={loading}
                >
                  {loading ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : (
                    <>
                      <i className="fas fa-check"></i> Approve
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverrideTransactions;
