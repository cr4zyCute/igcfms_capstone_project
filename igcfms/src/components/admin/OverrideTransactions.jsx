import React, { useState, useEffect, useRef } from "react";
import TotalMiniGraph from "../analytics/OverrideTransactionsAnalystics/totalminigraph";
import RequestDistributionPieG from "../analytics/OverrideTransactionsAnalystics/RequestDistributionPieG";
import BarGraph from "../analytics/OverrideTransactionsAnalystics/bargraph";
import OverrideRequestTrendanalaytics from "../analytics/OverrideTransactionsAnalystics/OverrideRequestTrendanalaytics";
import OverrideTransactionsSL from "../ui/OverrideTransactionsSL";
import { SuccessModal, ErrorModal } from "../common/Modals/OverrideTransactionsModals";
import {
  useTransactions,
  useOverrideRequests,
  useMyOverrideRequests,
  useCreateOverrideRequest,
  useReviewOverrideRequest
} from "../../hooks/useOverrideTransactions";
import "./css/overridetransactions.css";

const OverrideTransactions = ({ role = "Admin" }) => {
  // TanStack Query hooks
  const {
    data: transactions = [],
    isLoading: transactionsLoading,
    error: transactionsError
  } = useTransactions();

  const {
    data: adminOverrideRequests = [],
    isLoading: adminRequestsLoading,
    error: adminRequestsError
  } = useOverrideRequests({ enabled: role === "Admin" });

  const {
    data: myOverrideRequests = [],
    isLoading: myRequestsLoading,
    error: myRequestsError
  } = useMyOverrideRequests({ enabled: role !== "Admin" });

  const createOverrideRequestMutation = useCreateOverrideRequest();
  const reviewOverrideRequestMutation = useReviewOverrideRequest();

  // Determine which override requests to use based on role
  const overrideRequests = role === "Admin" ? adminOverrideRequests : myOverrideRequests;
  const isInitialLoading = transactionsLoading || (role === "Admin" ? adminRequestsLoading : myRequestsLoading);
  const mutationLoading = createOverrideRequestMutation.isPending || reviewOverrideRequestMutation.isPending;

  // Local state
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState("");
  const [reason, setReason] = useState("");
  const [proposedChanges, setProposedChanges] = useState({});
  const [reviewNotes, setReviewNotes] = useState("");
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    applyFilters();
    setCurrentPage(1); // Reset to first page when filters change
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

  // Handle query errors
  useEffect(() => {
    if (transactionsError) {
      setError(transactionsError.message || 'Failed to load transactions');
    }
    if (adminRequestsError) {
      setError(adminRequestsError.message || 'Failed to load override requests');
    }
    if (myRequestsError) {
      setError(myRequestsError.message || 'Failed to load your override requests');
    }
  }, [transactionsError, adminRequestsError, myRequestsError]);

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
    e.stopPropagation();
    
    if (!selectedTransaction || !reason.trim()) {
      showMessage("Please select a transaction and provide a reason.", 'error');
      return;
    }

    if (mutationLoading) return; // Prevent double submission

    const payload = {
      transaction_id: parseInt(selectedTransaction),
      reason: reason.trim(),
      changes: proposedChanges
    };

    createOverrideRequestMutation.mutate(payload, {
      onSuccess: () => {
        // Clear form fields
        setSelectedTransaction("");
        setReason("");
        setProposedChanges({});
        
        // Show success message
        showMessage("Override request submitted successfully!");
        
        // Close the modal after showing success message
        setTimeout(() => {
          setShowCreateModal(false);
        }, 2000); // Close after 2 seconds to allow user to see the success message
      },
      onError: (err) => {
        console.error("Error:", err);
        showMessage(err.response?.data?.message || "Failed to submit override request.", 'error');
      }
    });
  };

  // Admin review
  const handleReview = async (requestId, status) => {
    if (!reviewNotes.trim()) {
      showMessage("Please provide review notes.", 'error');
      return;
    }

    reviewOverrideRequestMutation.mutate(
      { requestId, status, review_notes: reviewNotes.trim() },
      {
        onSuccess: () => {
          showMessage(`Override request ${status} successfully!`);
          setReviewNotes("");
          setShowReviewModal(false);
          setSelectedRequest(null);
        },
        onError: (err) => {
          console.error(err);
          showMessage(err.response?.data?.message || "Failed to review request.", 'error');
        }
      }
    );
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

  if (isInitialLoading) {
    return <OverrideTransactionsSL />;
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

      {/* Modals */}
      <SuccessModal message={success} onClose={() => setSuccess("")} />
      <ErrorModal message={error} onClose={() => setError("")} />

      {/* Dashboard Layout */}
      <div className="ot-dashboard-container">
        {/* Left Section - Total Requests + Status Cards */}
        <div className="ot-left-column">
          {/* Total Requests Card */}
          <div className="ot-total-card">
            <div className="ot-total-wrapper">
              <div className="ot-total-info">
                <div className="ot-card-header-inline">
                  <div className="ot-card-title">
                    Total Requests
                    <i 
                      className="fas fa-info-circle" 
                      style={{ marginLeft: '8px', fontSize: '14px', color: '#6b7280', cursor: 'help' }}
                      title="Total number of override requests submitted. Measures overall transaction volume requiring manual intervention. High numbers may indicate system configuration issues or training needs."
                    ></i>
                  </div>
                  <div className="ot-card-menu">
                    <i className="fas fa-ellipsis-v"></i>
                  </div>
                </div>
                <div className="ot-card-value">{overrideRequests.length}</div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                  All override requests
                </div>
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
                <div className="ot-status-label">
                  Pending Review
                  <i 
                    className="fas fa-info-circle" 
                    style={{ marginLeft: '6px', fontSize: '12px', color: '#9ca3af', cursor: 'help' }}
                    title="Override requests awaiting review or decision. Tracks workflow backlog and review efficiency. High pending count indicates delays in decision-making and potential bottlenecks."
                  ></i>
                </div>
                <div className="ot-status-value">
                  {overrideRequests.filter(req => req.status === 'pending').length}
                </div>
                <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px' }}>
                  Awaiting decision
                </div>
              </div>
            </div>

            <div className="ot-status-card approved">
              <div className="ot-status-icon">
                <i className="fas fa-check"></i>
              </div>
              <div className="ot-status-content">
                <div className="ot-status-label">
                  Approved
                  <i 
                    className="fas fa-info-circle" 
                    style={{ marginLeft: '6px', fontSize: '12px', color: '#9ca3af', cursor: 'help' }}
                    title="Override requests approved by authorized personnel. Indicates valid and legitimate overrides. Helps audit teams monitor approval patterns and identify potential control weaknesses."
                  ></i>
                </div>
                <div className="ot-status-value">
                  {overrideRequests.filter(req => req.status === 'approved').length}
                </div>
                <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px' }}>
                  Valid overrides
                </div>
              </div>
            </div>

            <div className="ot-status-card rejected">
              <div className="ot-status-icon">
                <i className="fas fa-times"></i>
              </div>
              <div className="ot-status-content">
                <div className="ot-status-label">
                  Rejected
                  <i 
                    className="fas fa-info-circle" 
                    style={{ marginLeft: '6px', fontSize: '12px', color: '#9ca3af', cursor: 'help' }}
                    title="Override requests denied or marked invalid. Tracks invalid, unnecessary, or suspicious override attempts. High rejection rate indicates good control discipline but may point to training needs."
                  ></i>
                </div>
                <div className="ot-status-value">
                  {overrideRequests.filter(req => req.status === 'rejected').length}
                </div>
                <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px' }}>
                  Invalid requests
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

      {/* Override Request Trend Analytics */}
      <OverrideRequestTrendanalaytics 
        overrideRequests={overrideRequests}
        isLoading={isInitialLoading}
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
              {(() => {
                // Calculate pagination
                const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
                const startIndex = (currentPage - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage;
                const paginatedRequests = filteredRequests.slice(startIndex, endIndex);
                
                return paginatedRequests.length > 0 ? (
                  paginatedRequests.map((request) => (
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
                );
              })()}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {filteredRequests.length > 0 && (() => {
          const totalItems = filteredRequests.length;
          const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
          const displayStart = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
          const displayEnd = Math.min(currentPage * itemsPerPage, totalItems);
          
          return (
            <div className="ot-table-pagination">
              <div className="ot-pagination-info">
                Showing {displayStart}-{displayEnd} of {totalItems} requests
              </div>
              <div className="ot-pagination-controls">
                <button
                  type="button"
                  className="ot-pagination-button"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span className="ot-pagination-info">Page {currentPage} of {totalPages}</span>
                <button
                  type="button"
                  className="ot-pagination-button"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage >= totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Create Override Request Modal */}
      {showCreateModal && (
        <div className="ot-modal-overlay">
          <div className="ot-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="ot-modal-header">
              <h3><i className="fas fa-plus"></i> Create Override Request</h3>
              <button 
                className="ot-modal-close" 
                onClick={() => setShowCreateModal(false)}
              >
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
                    disabled={mutationLoading}
                  >
                    {mutationLoading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i> Processing...
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
                  disabled={mutationLoading}
                >
                  {mutationLoading ? (
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
                  disabled={mutationLoading}
                >
                  {mutationLoading ? (
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
