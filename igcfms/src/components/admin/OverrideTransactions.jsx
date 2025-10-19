import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import TotalMiniGraph from "../analytics/OverrideTransactionsAnalystics/totalminigraph";
import RequestDistributionPieG from "../analytics/OverrideTransactionsAnalystics/RequestDistributionPieG";
import BarGraph from "../analytics/OverrideTransactionsAnalystics/bargraph";
import RequestTimelineGraph from "../analytics/OverrideTransactionsAnalystics/RequestTimelineGraph";
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
  const [openActionMenu, setOpenActionMenu] = useState(null);
  const [transactionSearch, setTransactionSearch] = useState("");
  const [showTransactionDropdown, setShowTransactionDropdown] = useState(false);
  
  const transactionDropdownRef = useRef(null);

  // Filter states
  const [filters, setFilters] = useState({
    status: "all",
    dateFrom: "",
    dateTo: "",
    searchTerm: "",
    showFilterDropdown: false
  });

  const [hoveredPoint, setHoveredPoint] = useState(null);

  const API_BASE = "http://localhost:8000/api";
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchData();
  }, [token]);

  useEffect(() => {
    applyFilters();
  }, [overrideRequests, filters]);

  // Click outside handler for transaction dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (transactionDropdownRef.current && !transactionDropdownRef.current.contains(event.target)) {
        setShowTransactionDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      } else {
        // Cashier only needs transactions for creating requests
        const transactionsRes = await axios.get(`${API_BASE}/transactions`, { headers }).catch(() => ({ data: [] }));
        setTransactions(transactionsRes.data || []);

        // Get cashier's own requests
        const overrideRes = await axios.get(`${API_BASE}/override_requests/my_requests`, { headers }).catch(() => ({ data: [] }));
        const requests = overrideRes.data || [];
        setOverrideRequests(requests);
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

  // Filter transactions based on search
  const filteredTransactions = transactions.filter(tx => {
    const searchLower = transactionSearch.toLowerCase();
    return (
      tx.id?.toString().includes(searchLower) ||
      tx.type?.toLowerCase().includes(searchLower) ||
      tx.description?.toLowerCase().includes(searchLower) ||
      tx.amount?.toString().includes(searchLower)
    );
  });

  // Get selected transaction for display
  const selectedTx = transactions.find(tx => tx.id.toString() === selectedTransaction);
  const transactionDisplayValue = selectedTx && !showTransactionDropdown
    ? `#${selectedTx.id} - ${selectedTx.type} - ₱${parseFloat(selectedTx.amount || 0).toLocaleString()} - ${selectedTx.description || 'No description'}`
    : transactionSearch;

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
        <div className="ot-header-content">
          <h1 className="ot-title">
            <i className="fas fa-edit"></i> Override Transactions
          </h1>
          <div className="ot-header-actions">
            <button 
              className="ot-btn-create-override"
              onClick={() => setShowCreateModal(true)}
            >
              <i className="fas fa-plus-circle"></i>
              New Override Request
            </button>
          </div>
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

      {/* Dashboard Layout */}
      <div className="ot-dashboard-container">
        {/* Left Section - Total Requests + Status Cards */}
        <div className="ot-left-column">
          {/* Total Requests Card */}
          <div className="ot-total-card">
            <div className="ot-total-wrapper">
              <div className="ot-total-info">
                <div className="ot-card-header-inline">
                  <div className="ot-card-title">Total Requests</div>
                  <div className="ot-card-menu">
                    <i className="fas fa-ellipsis-v"></i>
                  </div>
                </div>
                <div className="ot-card-value">{overrideRequests.length}</div>
              </div>
              <div className="ot-total-graph">
                <TotalMiniGraph overrideRequests={overrideRequests} />
              </div>
            </div>
          </div>

          {/* Status Cards Row */}
          <div className="ot-status-cards-row">
            <div className="ot-status-card pending">
              <div className="ot-status-icon">
                <i className="fas fa-clock"></i>
              </div>
              <div className="ot-status-content">
                <div className="ot-status-label">Pending Review</div>
                <div className="ot-status-value">
                  {overrideRequests.filter(req => req.status === 'pending').length}
                </div>
              </div>
            </div>

            <div className="ot-status-card approved">
              <div className="ot-status-icon">
                <i className="fas fa-check"></i>
              </div>
              <div className="ot-status-content">
                <div className="ot-status-label">Approved</div>
                <div className="ot-status-value">
                  {overrideRequests.filter(req => req.status === 'approved').length}
                </div>
              </div>
            </div>

            <div className="ot-status-card rejected">
              <div className="ot-status-icon">
                <i className="fas fa-times"></i>
              </div>
              <div className="ot-status-content">
                <div className="ot-status-label">Rejected</div>
                <div className="ot-status-value">
                  {overrideRequests.filter(req => req.status === 'rejected').length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Pie Chart */}
        <div className="ot-right-column">
          <div className="ot-pie-card">
            <div className="ot-card-header">
              <div className="ot-card-title">Request Distribution</div>
            </div>
            <div className="ot-pie-chart">
              <RequestDistributionPieG overrideRequests={overrideRequests} />
            </div>
          </div>
        </div>
      </div>

      {/* Request Timeline Line Graph */}
      <RequestTimelineGraph 
        overrideRequests={overrideRequests}
        isLoading={loading}
        error={error}
      />

      {/* Override Requests Section Header */}
      <div className="section-header">
        <div className="section-title-group">
          <h3>
            <i className="fas fa-exchange-alt"></i>
            Override Requests
            <span className="section-count">({filteredRequests.length})</span>
          </h3>
        </div>
        <div className="header-controls">
          <div className="search-filter-container">
            <div className="account-search-container">
              <input
                type="text"
                placeholder="Search requests..."
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                className="account-search-input"
              />
              <i className="fas fa-search account-search-icon"></i>
            </div>
            
            <div className="filter-dropdown-container">
              <button
                className="filter-dropdown-btn"
                onClick={() => setFilters(prev => ({ ...prev, showFilterDropdown: !prev.showFilterDropdown }))}
                title="Filter requests"
              >
                <i className="fas fa-filter"></i>
                <span className="filter-label">
                  {filters.status === 'all' ? 'All Status' :
                   filters.status === 'pending' ? 'Pending' : 
                   filters.status === 'approved' ? 'Approved' : 
                   'Rejected'}
                </span>
                <i className={`fas fa-chevron-${filters.showFilterDropdown ? 'up' : 'down'} filter-arrow`}></i>
              </button>
              
              {filters.showFilterDropdown && (
                <div className="filter-dropdown-menu">
                  <button
                    className={`filter-option ${filters.status === 'all' ? 'active' : ''}`}
                    onClick={() => { handleFilterChange('status', 'all'); setFilters(prev => ({ ...prev, showFilterDropdown: false })); }}
                  >
                    <i className="fas fa-list"></i>
                    <span>All Status</span>
                    {filters.status === 'all' && <i className="fas fa-check filter-check"></i>}
                  </button>
                  <button
                    className={`filter-option ${filters.status === 'pending' ? 'active' : ''}`}
                    onClick={() => { handleFilterChange('status', 'pending'); setFilters(prev => ({ ...prev, showFilterDropdown: false })); }}
                  >
                    <i className="fas fa-clock"></i>
                    <span>Pending</span>
                    {filters.status === 'pending' && <i className="fas fa-check filter-check"></i>}
                  </button>
                  <button
                    className={`filter-option ${filters.status === 'approved' ? 'active' : ''}`}
                    onClick={() => { handleFilterChange('status', 'approved'); setFilters(prev => ({ ...prev, showFilterDropdown: false })); }}
                  >
                    <i className="fas fa-check-circle"></i>
                    <span>Approved</span>
                    {filters.status === 'approved' && <i className="fas fa-check filter-check"></i>}
                  </button>
                  <button
                    className={`filter-option ${filters.status === 'rejected' ? 'active' : ''}`}
                    onClick={() => { handleFilterChange('status', 'rejected'); setFilters(prev => ({ ...prev, showFilterDropdown: false })); }}
                  >
                    <i className="fas fa-times-circle"></i>
                    <span>Rejected</span>
                    {filters.status === 'rejected' && <i className="fas fa-check filter-check"></i>}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Override Requests Table */}
      <div className="ot-requests-section">

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
                  <tr 
                    key={request.id}
                    className={`table-row clickable-row ${openActionMenu === request.id ? 'row-active-menu' : ''}`}
                    onClick={(e) => {
                      // Don't trigger if clicking on action buttons
                      if (!e.target.closest('.action-cell')) {
                        // View details logic here
                        console.log('View request details:', request);
                      }
                    }}
                  >
                    <td>
                      <div className="cell-content">
                        <span className="request-id">#{request.id}</span>
                      </div>
                    </td>
                    <td>
                      <div className="cell-content">
                        <span className="transaction-ref">#{request.transaction_id}</span>
                      </div>
                    </td>
                    <td>
                      <div className="cell-content">
                        <span className="requester-name">{request.requested_by?.name || request.requestedBy?.name || 'N/A'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="cell-content reason-cell">
                        <span className="reason-text">{request.reason || 'No reason provided'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="cell-content changes-cell">
                        {request.changes ? (
                          <div className="changes-preview">
                            <i className="fas fa-eye"></i>
                            <span>Changes proposed</span>
                          </div>
                        ) : (
                          <span className="no-changes">No changes</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="cell-content">
                        <span className={`status-badge ${request.status}`}>
                          {request.status}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="cell-content">
                        <span className="request-date">{new Date(request.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="action-cell">
                      <div className="cell-content">
                        <div className="action-buttons-group">
                          <div className="action-menu-container">
                            <button 
                              className="action-btn-icon more-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenActionMenu(openActionMenu === request.id ? null : request.id);
                              }}
                              title="Actions"
                            >
                              <i className="fas fa-ellipsis-v"></i>
                            </button>
                            {openActionMenu === request.id && (
                              <div className="action-dropdown-menu">
                                {role === "Admin" && request.status === 'pending' && (
                                  <button 
                                    className="action-dropdown-item"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openReviewModal(request);
                                      setOpenActionMenu(null);
                                    }}
                                  >
                                    <i className="fas fa-gavel"></i>
                                    <span>Review Request</span>
                                  </button>
                                )}
                                <button 
                                  className="action-dropdown-item"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    console.log('View details:', request);
                                    setOpenActionMenu(null);
                                  }}
                                >
                                  <i className="fas fa-eye"></i>
                                  <span>View Details</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
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
        <div className="ot-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="ot-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="ot-modal-header">
              <h3><i className="fas fa-plus"></i> Create Override Request</h3>
              <button className="ot-modal-close" onClick={() => setShowCreateModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="ot-modal-body">
              <form onSubmit={handleSubmitOverride}>
                <div className="form-group full-width">
                  <label>Select Transaction *</label>
                  <div className="disbursement-searchable-select" ref={transactionDropdownRef}>
                    <div className="disbursement-search-wrapper-main">
                      <input
                        type="text"
                        className="disbursement-search-input-main"
                        placeholder="Search transactions..."
                        value={transactionDisplayValue}
                        onChange={(e) => {
                          setTransactionSearch(e.target.value);
                          if (!showTransactionDropdown) {
                            setShowTransactionDropdown(true);
                          }
                        }}
                        onFocus={() => {
                          setShowTransactionDropdown(true);
                          if (selectedTransaction) {
                            setTransactionSearch('');
                          }
                        }}
                        required
                      />
                      <i className="fas fa-search disbursement-search-icon-main"></i>
                    </div>
                    {showTransactionDropdown && (
                      <div className="disbursement-dropdown">
                        <div className="disbursement-options">
                          {filteredTransactions.length > 0 ? (
                            filteredTransactions.map((tx) => (
                              <div 
                                key={tx.id}
                                className={`disbursement-option ${selectedTransaction === tx.id.toString() ? 'selected' : ''}`}
                                onClick={() => {
                                  setSelectedTransaction(tx.id.toString());
                                  setShowTransactionDropdown(false);
                                  setTransactionSearch('');
                                }}
                              >
                                <div className="disbursement-option-content">
                                  <span className="disbursement-id">#{tx.id}</span>
                                  <span className="disbursement-recipient">{tx.type} - {tx.description || 'No description'}</span>
                                </div>
                                <span className="disbursement-amount">₱{parseFloat(tx.amount || 0).toLocaleString()}</span>
                              </div>
                            ))
                          ) : (
                            <div className="disbursement-option no-results">
                              <span>No transactions found</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-grid-2x2">
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
                </div>

                <div className="form-group full-width">
                  <label>Reason for Override</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4}
                    placeholder="Explain why this transaction needs to be overridden..."
                    required
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
        <div className="ot-modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="ot-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="ot-modal-header">
              <h3><i className="fas fa-gavel"></i> Review Override Request</h3>
              <button className="ot-modal-close" onClick={() => setShowReviewModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="ot-modal-body">
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
