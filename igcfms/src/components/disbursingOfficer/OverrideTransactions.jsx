import React, { useState, useEffect, useRef } from "react";
import TotalMiniGraph from "../analytics/OverrideTransactionsAnalystics/totalminigraph";
import RequestDistributionPieG from "../analytics/OverrideTransactionsAnalystics/RequestDistributionPieG";
import BarGraph from "../analytics/OverrideTransactionsAnalystics/bargraph";
import OverrideRequestTrendanalaytics from "../analytics/OverrideTransactionsAnalystics/OverrideRequestTrendanalaytics";
import OverrideTransactionsSL from "../ui/OverrideTransactionsSL";
import { SuccessModal, ErrorModal } from "../common/Modals/OverrideTransactionsModals";
import {
  useTransactions,
  useMyOverrideRequests,
  useCreateOverrideRequest,
  useReviewOverrideRequest
} from "../../hooks/useOverrideTransactions";
import { useDisbursingSidebarOverrideTransactionsWebSocket } from "../../hooks/useDisbursingSidebarOverrideTransactionsWebSocket";
import { useCreateReceipt } from "../../hooks/useReceipts";
import { getReceiptPrintHTML } from '../pages/print/recieptPrint';
import { useAuth } from "../../contexts/AuthContext";
import "../admin/css/overridetransactions.css";

const DisbursingSidebarOverrideTransactions = () => {
  const { user } = useAuth();
  
  // Initialize WebSocket for real-time updates
  useDisbursingSidebarOverrideTransactionsWebSocket();
  
  // TanStack Query hooks - use myOverrideRequests to get only user's requests
  const {
    data: transactions = [],
    isLoading: transactionsLoading,
    error: transactionsError
  } = useTransactions();

  const {
    data: overrideRequests = [],
    isLoading: myRequestsLoading,
    error: myRequestsError
  } = useMyOverrideRequests({ enabled: true });

  const createOverrideRequestMutation = useCreateOverrideRequest();
  const reviewOverrideRequestMutation = useReviewOverrideRequest();
  const createReceiptMutation = useCreateReceipt();

  const isInitialLoading = transactionsLoading || myRequestsLoading;
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
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [openActionMenu, setOpenActionMenu] = useState(null);
  const [transactionSearch, setTransactionSearch] = useState("");
  const [showTransactionDropdown, setShowTransactionDropdown] = useState(false);
  
  const transactionDropdownRef = useRef(null);

  // Manual Receipt Modal state
  const [showManualReceiptModal, setShowManualReceiptModal] = useState(false);
  const [manualReceiptTxId, setManualReceiptTxId] = useState(null);
  const [manualReceiptNo, setManualReceiptNo] = useState("");
  const [manualPayerName, setManualPayerName] = useState("");
  const [manualReceiptError, setManualReceiptError] = useState("");
  const [receiptData, setReceiptData] = useState(null);

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
    setCurrentPage(1);
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
    if (myRequestsError) {
      setError(myRequestsError.message || 'Failed to load your override requests');
    }
  }, [transactionsError, myRequestsError]);

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
    // Default sort: latest first
    filtered.sort((a, b) => {
      const aDate = a?.created_at ? new Date(a.created_at) : null;
      const bDate = b?.created_at ? new Date(b.created_at) : null;
      if (aDate && bDate) return bDate - aDate;
      if (aDate && !bDate) return -1;
      if (!aDate && bDate) return 1;
      return (b?.id || 0) - (a?.id || 0);
    });

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

    if (mutationLoading) return;

    const payload = {
      transaction_id: parseInt(selectedTransaction),
      reason: reason.trim(),
      changes: proposedChanges
    };

    createOverrideRequestMutation.mutate(payload, {
      onSuccess: () => {
        setSelectedTransaction("");
        setReason("");
        setProposedChanges({});
        showMessage("Override request submitted successfully!");
        setTimeout(() => {
          setShowCreateModal(false);
        }, 2000);
      },
      onError: (err) => {
        console.error("Error:", err);
        showMessage(err.response?.data?.message || "Failed to submit override request.", 'error');
      }
    });
  };

  // Number to words conversion
  const numberToWords = (num) => {
    const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
    const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
    const teens = ['TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
    
    if (num === 0) return 'ZERO';
    
    const convertHundreds = (n) => {
      if (n === 0) return '';
      if (n < 10) return ones[n];
      if (n >= 10 && n < 20) return teens[n - 10];
      if (n >= 20 && n < 100) {
        return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
      }
      if (n >= 100) {
        return ones[Math.floor(n / 100)] + ' HUNDRED' + (n % 100 !== 0 ? ' ' + convertHundreds(n % 100) : '');
      }
    };

    const convertThousands = (n) => {
      if (n < 1000) return convertHundreds(n);
      if (n < 1000000) {
        return convertHundreds(Math.floor(n / 1000)) + ' THOUSAND' + (n % 1000 !== 0 ? ' ' + convertHundreds(n % 1000) : '');
      }
      return convertHundreds(Math.floor(n / 1000000)) + ' MILLION' + (n % 1000000 !== 0 ? ' ' + convertThousands(n % 1000000) : '');
    };
    
    return convertThousands(Math.floor(num)).trim();
  };

  const handleCreateManualReceipt = (e) => {
    e.preventDefault();
    setManualReceiptError("");
    if (!manualReceiptTxId) {
      setManualReceiptError('Missing transaction ID for receipt.');
      return;
    }
    if (!manualReceiptNo.trim()) {
      setManualReceiptError('Receipt number is required.');
      return;
    }
    if (!manualPayerName.trim()) {
      setManualReceiptError('Payer name is required.');
      return;
    }

    handlePrintReceipt();
  };

  const handlePrintReceipt = () => {
    const receiptElement = document.getElementById('overrideReceiptPrint');
    if (!receiptElement) {
      console.error('Receipt print area not found.');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=384,height=825');
    if (!printWindow) {
      console.error('Unable to open print window.');
      return;
    }

    printWindow.document.write(getReceiptPrintHTML());

    const clonedReceipt = receiptElement.cloneNode(true);
    printWindow.document.write(clonedReceipt.outerHTML);

    printWindow.document.write(`
      </body>
      </html>
    `);
    printWindow.document.close();

    printWindow.onload = function() {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
        setShowManualReceiptModal(false);
        setManualReceiptNo("");
        setManualPayerName("");
        setManualReceiptTxId(null);
        setReceiptData(null);
      }, 250);
    };
  };

  const openReviewModal = (request) => {
    setSelectedRequest(request);
    setShowReviewModal(true);
  };

  // Filter transactions based on search, type (Disbursement only), and created by current user
  const filteredTransactions = transactions.filter(tx => {
    const searchLower = transactionSearch.toLowerCase();
    const matchesSearch = (
      tx.id?.toString().includes(searchLower) ||
      tx.type?.toLowerCase().includes(searchLower) ||
      tx.description?.toLowerCase().includes(searchLower) ||
      tx.amount?.toString().includes(searchLower)
    );
    
    // Only show Disbursement transactions created by the current user
    const isDisbursementByUser = tx.type === 'Disbursement' && tx.created_by === user?.id;
    
    return matchesSearch && isDisbursementByUser;
  });

  // Get selected transaction for display
  const selectedTx = transactions.find(tx => tx.id.toString() === selectedTransaction);
  const transactionDisplayValue = selectedTx && !showTransactionDropdown
    ? `#${selectedTx.id} - ${selectedTx.type} - ₱${parseFloat(selectedTx.amount || 0).toLocaleString()} - ${selectedTx.description || 'No description'}`
    : transactionSearch;

  if (isInitialLoading) {
    return <OverrideTransactionsSL />;
  }

  // Pagination
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

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
                    <label>Proposed New Amount </label>
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

      {/* Override Requests Section Header */}
      <div className="section-header">
        <div className="section-title-group">
          <h3>
            <i className="fas fa-exchange-alt"></i>
            My Override Requests
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

      {/* Manual Receipt Creation Modal */}
      {showManualReceiptModal && (
        <div className="ot-modal-overlay" onClick={() => setShowManualReceiptModal(false)}>
          <div className="ot-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="ot-modal-header">
              <h3><i className="fas fa-receipt"></i> Create Receipt for Override</h3>
              <button className="ot-modal-close" onClick={() => setShowManualReceiptModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="ot-modal-body">
              {manualReceiptError && (
                <div className="alert alert-error" style={{ marginBottom: '12px' }}>
                  <i className="fas fa-exclamation-triangle"></i>
                  {manualReceiptError}
                </div>
              )}
              <form onSubmit={handleCreateManualReceipt}>
                <div className="form-grid-2x2">
                  <div className="form-group">
                    <label>Transaction ID</label>
                    <input type="text" value={`#${manualReceiptTxId || ''}`} disabled />
                  </div>
                  <div className="form-group">
                    <label>Receipt Number</label>
                    <input
                      type="text"
                      value={manualReceiptNo}
                      onChange={(e) => setManualReceiptNo(e.target.value.toUpperCase())}
                      placeholder="Enter receipt number"
                      autoFocus
                    />
                  </div>
                  <div className="form-group">
                    <label>Payer Name</label>
                    <input
                      type="text"
                      value={manualPayerName}
                      onChange={(e) => setManualPayerName(e.target.value)}
                      placeholder="Enter payer name"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="cancel-btn" onClick={() => setShowManualReceiptModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="approve-btn">
                    <i className="fas fa-print"></i> Print Receipt
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Receipt Print Area */}
      <div className="receipt-print-area" id="overrideReceiptPrint" style={{ display: 'none' }}>
        <div className="official-receipt-header">
          <div className="receipt-title-section">
            <div className="receipt-logos">
              <div className="logo-image left-logo" aria-hidden="true"></div>
              <div className="receipt-title-content" aria-hidden="true"></div>
              <div className="logo-image right-logo" aria-hidden="true"></div>
            </div>
          </div>
        </div>

        <div className="official-receipt-body">
          <div className="receipt-center-logos" aria-hidden="true">
            <div className="center-logo-container"></div>
          </div>

          <div className="receipt-payer-info">
            <p>
              <strong>RECEIPT NO:</strong> {manualReceiptNo || 'N/A'}
            </p>
            <p>
              <strong>RECEIVED FROM:</strong> {manualPayerName || 'N/A'}
            </p>
            <p>
              <strong>DATE:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {receiptData && receiptData.fundAccounts && receiptData.fundAccounts.length > 0 && (
            <div className="receipt-fund-info">
              <p className="fund-label">FUND ACCOUNTS USED:</p>
              <div className="fund-items-grid single-column">
                {receiptData.fundAccounts.map((account, idx) => (
                  <div key={`${account.name}-${idx}`} className="fund-item-row">
                    <span className="fund-name">{account.name}</span>
                    <span className="fund-amount">
                      ₱{parseFloat(account.amount || 0).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="receipt-body-spacer"></div>

          {receiptData && receiptData.totalAmount && (
            <>
              <div className="receipt-total-right">
                <span className="total-label-bold">TOTAL:</span>
                <span className="total-amount-bold">PHP{receiptData.totalAmount.toFixed(2)}</span>
              </div>

              <div className="amount-words-bold">
                {numberToWords(receiptData.totalAmount)} PESOS ONLY
              </div>
            </>
          )}

          {receiptData && receiptData.description && (
            <div className="receipt-description-box">
              <p className="description-label-receipt">Description:</p>
              <p className="description-text-receipt">{receiptData.description}</p>
            </div>
          )}

          {(user?.name || user?.role) && (
            <div className="receipt-issued-by">
              <p className="issued-by-name">
                {user?.name || 'N/A'}
                {/* {user?.role ? ` • ${user.role}` : ''} */}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Override Requests Table */}
      <div className="ot-requests-section">
        <div className="ot-table-wrapper">
          <table className="ot-table">
            <thead>
              <tr>
                <th className="ot-col-id">#</th>
                <th className="ot-col-transaction">TRANSACTION</th>
                <th className="ot-col-reason">REASON</th>
                <th className="ot-col-changes">PROPOSED CHANGES</th>
                <th className="ot-col-status">STATUS</th>
                <th className="ot-col-date">DATE</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRequests.length > 0 ? (
                paginatedRequests.map((request) => (
                  <tr key={request.id} className={`ot-row ot-status-${request.status}`}>
                    <td className="ot-col-id">#{request.id}</td>
                    <td className="ot-col-transaction">#{request.transaction_id}</td>
                    <td className="ot-col-reason">{request.reason || 'N/A'}</td>
                    <td className="ot-col-changes">
                      <i className="fas fa-info-circle"></i> Changes proposed
                    </td>
                    <td className="ot-col-status">
                      <span className={`ot-status-badge ot-status-${request.status}`}>
                        {request.status?.charAt(0).toUpperCase() + request.status?.slice(1)}
                      </span>
                    </td>
                    <td className="ot-col-date">
                      {new Date(request.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                      })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="ot-empty-message">
                    No override requests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="ot-pagination">
            <button
              className="ot-pagination-btn"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <i className="fas fa-chevron-left"></i> Previous
            </button>
            <span className="ot-pagination-info">
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="ot-pagination-btn"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DisbursingSidebarOverrideTransactions;