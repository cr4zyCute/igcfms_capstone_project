import React, { useState, useEffect, useRef } from "react";
import axios from 'axios';
import API_BASE_URL from '../../config/api';
import * as XLSX from "xlsx";
import { generateOverridePDF } from '../reports/export/pdf/overrrideExport';
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
import { useCreateReceipt } from "../../hooks/useReceipts";
import { getReceiptPrintHTML } from '../pages/print/recieptPrint.jsx';
import { useAuth } from "../../contexts/AuthContext";
import "./css/overridetransactions.css";

const OverrideTransactions = ({ role = "Admin", filterByUserId = null, hideKpiDashboard = false }) => {
  const { user } = useAuth();
  
  // TanStack Query hooks
  const {
    data: transactions = [],
    isLoading: transactionsLoading,
    error: transactionsError
  } = useTransactions();

  const {
    data: allOverrideRequests = [],
    isLoading: allRequestsLoading,
    error: allRequestsError
  } = useOverrideRequests({ enabled: true });

  const createOverrideRequestMutation = useCreateOverrideRequest();
  const reviewOverrideRequestMutation = useReviewOverrideRequest();
  const createReceiptMutation = useCreateReceipt();

  // Filter override requests by user if filterByUserId is provided
  let overrideRequests = allOverrideRequests;
  if (filterByUserId) {
    const userIdInt = parseInt(filterByUserId);
    overrideRequests = allOverrideRequests.filter(request => {
      const matches = 
        request.created_by === userIdInt || 
        request.user_id === userIdInt ||
        request.creator_id === userIdInt ||
        (request.creator && request.creator.id === userIdInt);
      
      return matches;
    });
  }

  const isInitialLoading = transactionsLoading || allRequestsLoading;
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

  // PDF Preview and Export state
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [pdfFileName, setPdfFileName] = useState("");
  const [showExportDropdown, setShowExportDropdown] = useState(false);

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
    if (allRequestsError) {
      setError(allRequestsError.message || 'Failed to load override requests');
    }
  }, [transactionsError, allRequestsError]);

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
      if (aDate && bDate) return bDate - aDate; // newest to oldest
      if (aDate && !bDate) return -1;
      if (!aDate && bDate) return 1;
      // Fallback: by id desc
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

  // PDF Export Handler
  const handleExportPdf = () => {
    if (!filteredRequests.length) {
      showMessage("No requests to export", 'error');
      setShowExportDropdown(false);
      return;
    }

    try {
      const { blob, filename } = generateOverridePDF({
        overrideRequests: filteredRequests,
        filters: {
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          status: filters.status
        }
      });

      const url = URL.createObjectURL(blob);
      setPdfPreviewUrl(url);
      setPdfFileName(filename);
      setShowPDFPreview(true);
      setShowExportDropdown(false);
    } catch (e) {
      console.error('Error generating PDF:', e);
      showMessage('Error generating PDF. Please try again.', 'error');
    }
  };

  // Download PDF from preview
  const downloadPDFFromPreview = () => {
    if (!pdfPreviewUrl) return;
    const link = document.createElement('a');
    link.href = pdfPreviewUrl;
    link.download = pdfFileName || 'override_requests.pdf';
    link.click();
  };

  // Close PDF preview
  const closePDFPreview = () => {
    if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    setShowPDFPreview(false);
    setPdfPreviewUrl(null);
    setPdfFileName('');
  };

  // Excel Export Handler
  const handleExportExcel = () => {
    if (!filteredRequests.length) {
      showMessage("No requests to export", 'error');
      setShowExportDropdown(false);
      return;
    }

    try {
      const excelData = filteredRequests.map((req) => ({
        'ID': req.id,
        'Transaction': req.transaction_id,
        'Requested By': req.requested_by?.name || 'N/A',
        'Reason': req.reason || 'N/A',
        'Status': req.status || 'N/A',
        'Date': new Date(req.created_at).toLocaleDateString(),
      }));

      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Override Requests');

      ws['!cols'] = [
        { wch: 10 },
        { wch: 15 },
        { wch: 20 },
        { wch: 30 },
        { wch: 12 },
        { wch: 15 }
      ];

      const fileName = `override_requests_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      setShowExportDropdown(false);
      showMessage('Excel file downloaded successfully!');
    } catch (e) {
      console.error('Error generating Excel:', e);
      showMessage('Error generating Excel. Please try again.', 'error');
    }
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
        onSuccess: (data) => {
          showMessage(`Override request ${status} successfully!`);

          // If approved, prompt for manual receipt creation
          try {
            let appliedTxId = null;
            const changesRaw = data?.changes;
            const changes = typeof changesRaw === 'string' ? JSON.parse(changesRaw || '{}') : (changesRaw || {});
            appliedTxId = changes?.applied_transaction_id ?? changes?.appliedTransactionId ?? data?.applied_transaction_id ?? data?.appliedTransactionId ?? null;

            console.log('Override response data:', data);
            console.log('Parsed changes:', changes);
            console.log('Applied Transaction ID:', appliedTxId);

            if (status === 'approved' && appliedTxId) {
              setManualReceiptTxId(appliedTxId);
              const defaultPayer = selectedRequest?.transaction?.recipient || '';
              setManualPayerName(defaultPayer);
              
              // Populate receipt data even if transaction list doesn't contain the ID
              const toNum = (v) => {
                if (v === null || v === undefined) return 0;
                const cleaned = String(v).replace(/[^0-9.-]/g, '').trim();
                const n = parseFloat(cleaned);
                return Number.isFinite(n) ? n : 0;
              };
              const transaction = transactions.find(tx => tx.id === appliedTxId);
              const fallbackTx = selectedRequest?.transaction || {};
              const fundAccountsSource = (
                transaction?.fund_accounts ??
                fallbackTx?.fund_accounts ??
                (transaction?.fund_account ? [transaction.fund_account] : []) ??
                (fallbackTx?.fund_account ? [fallbackTx.fund_account] : [])
              );
              const fundAccounts = Array.isArray(fundAccountsSource) ? fundAccountsSource : [fundAccountsSource];
              
              // Prefer approved/new amount from changes, then API response, then transaction values
              const approvedAmount = toNum(changes?.amount ?? data?.amount ?? data?.approved_amount ?? fallbackTx?.amount ?? transaction?.amount ?? 0);
              
              console.log('Computed approved amount:', approvedAmount);
              console.log('Fallback tx amount:', fallbackTx?.amount, 'Transaction amount:', transaction?.amount);
              
              setReceiptData({
                fundAccounts: (fundAccounts && fundAccounts.length > 0)
                  ? fundAccounts.map(fa => ({
                      name: fa?.name || fa?.fund_name || 'N/A',
                      amount: fa?.amount ?? fa?.allocated_amount ?? approvedAmount
                    }))
                  : [],
                totalAmount: approvedAmount,
                description: fallbackTx?.description || fallbackTx?.remarks || transaction?.description || transaction?.remarks || ''
              });
              
              // Auto-create receipt record in IssueReceipt with approved amount
              try {
                const receiptPayload = {
                  transaction_id: appliedTxId,
                  receipt_no: `OVR-${Date.now()}`, // Auto-generate receipt number
                  payment_method: transaction?.mode_of_payment || 'Cash',
                  amount: approvedAmount,
                  payer_name: defaultPayer,
                  description: `Override: ${(fallbackTx?.description || fallbackTx?.remarks || transaction?.description || transaction?.remarks || '')}`
                };
                
                console.log('Creating receipt with payload:', receiptPayload);
                
                createReceiptMutation.mutate(receiptPayload, {
                  onSuccess: () => {
                    console.log('Receipt record created for override transaction:', appliedTxId, 'with amount:', approvedAmount);
                  },
                  onError: (err) => {
                    console.error('Failed to create receipt record:', err);
                  }
                });
              } catch (receiptError) {
                console.error('Error creating receipt record:', receiptError);
              }
              
              setShowManualReceiptModal(true);
            }
          } catch (e) {
            // Fallback: just close if parsing fails
          }

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

  const handleCreateManualReceipt = async (e) => {
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

    // Instead of saving, print the receipt
    await handlePrintReceipt();
  };

  const handlePrintReceipt = async () => {
    // Get the receipt print area element
    const receiptElement = document.getElementById('overrideReceiptPrint');
    if (!receiptElement) {
      console.error('Receipt print area not found.');
      return;
    }

    // Create a new window for printing - Receipt size (4 x 8.6 inches)
    const printWindow = window.open('', '_blank', 'width=384,height=825');
    if (!printWindow) {
      console.error('Unable to open print window.');
      return;
    }

    // Compose receipt markup explicitly to avoid cloning issues from hidden element
    const toNumber = (val) => {
      if (val === null || val === undefined) return 0;
      const cleaned = String(val).replace(/,/g, '').trim();
      const n = parseFloat(cleaned);
      return Number.isFinite(n) ? n : 0;
    };
    const formatAmount = (val) => toNumber(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    let selectedTxForPrint = transactions.find(tx => tx.id === manualReceiptTxId || String(tx.id) === String(manualReceiptTxId));
    let funds = (receiptData && receiptData.fundAccounts) ? receiptData.fundAccounts : [];
    try { console.log('[Print] Selected Tx from cache:', selectedTxForPrint); } catch {}
    try { console.log('[Print] ReceiptData funds:', receiptData?.fundAccounts); } catch {}
    let fundsSum = funds.reduce((sum, fa) => sum + toNumber(fa?.amount ?? fa?.allocated_amount ?? 0), 0);
    let totalAmountNum = toNumber(receiptData?.totalAmount);
    if (totalAmountNum <= 0) totalAmountNum = fundsSum;
    if (totalAmountNum <= 0) totalAmountNum = toNumber(selectedTxForPrint?.amount);

    // If still zero and we have a transaction id, fetch transaction details directly
    if ((totalAmountNum <= 0 || !Number.isFinite(totalAmountNum)) && manualReceiptTxId) {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        // No GET /transactions/{id} endpoint; fetch all then find
        const res = await axios.get(`${API_BASE_URL}/transactions`, { headers });
        const list = Array.isArray(res?.data) ? res.data : [];
        const tx = list.find(t => String(t.id) === String(manualReceiptTxId));
        if (tx) {
          selectedTxForPrint = tx;
          const fetchedFunds = tx.fund_accounts ? (Array.isArray(tx.fund_accounts) ? tx.fund_accounts : [tx.fund_accounts]) : [];
          if (!funds || funds.length === 0) {
            funds = fetchedFunds.map(fa => ({ name: fa?.name || fa?.fund_name || 'N/A', amount: fa?.amount ?? fa?.allocated_amount ?? 0 }));
            fundsSum = funds.reduce((sum, fa) => sum + toNumber(fa?.amount ?? 0), 0);
          }
          const fetchedAmount = toNumber(tx.amount ?? tx.total_amount ?? 0);
          if (fetchedAmount > 0) {
            totalAmountNum = fetchedAmount;
          } else if (fundsSum > 0) {
            totalAmountNum = fundsSum;
          }
        }
      } catch (fetchErr) {
        console.error('Failed to fetch transaction for print:', fetchErr);
      }
    }

    // If still no funds listed, resolve via transaction's fund_account relation or fund_account_id
    if ((!funds || funds.length === 0) && selectedTxForPrint) {
      let faName = selectedTxForPrint?.fund_account?.name 
        || selectedTxForPrint?.fundAccount?.name 
        || selectedTxForPrint?.fund_name 
        || null;
      if (!faName && selectedTxForPrint?.fund_account_id) {
        try {
          const token = localStorage.getItem('token');
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          const faRes = await axios.get(`${API_BASE_URL}/fund-accounts/${selectedTxForPrint.fund_account_id}`, { headers });
          faName = faRes?.data?.name || faRes?.data?.fund_name || faName;
        } catch (e) {
          console.warn('Failed to fetch fund account by id for print:', e);
        }
      }
      const amt = Math.abs(toNumber(selectedTxForPrint?.amount ?? totalAmountNum));
      funds = [{ name: faName || 'Fund Account', amount: amt }];
      fundsSum = funds.reduce((sum, fa) => sum + toNumber(fa?.amount ?? 0), 0);
      if (totalAmountNum <= 0 && fundsSum > 0) {
        totalAmountNum = fundsSum;
      } else if (totalAmountNum <= 0) {
        totalAmountNum = amt;
      }
    }

    // If still zero, fall back to selectedRequest data (changes.amount or transaction.amount)
    if ((totalAmountNum <= 0 || !Number.isFinite(totalAmountNum)) && selectedRequest) {
      try {
        const changesRaw = selectedRequest?.changes;
        const changesObj = typeof changesRaw === 'string' ? JSON.parse(changesRaw || '{}') : (changesRaw || {});
        const srAmount = toNumber(changesObj?.amount ?? selectedRequest?.amount ?? selectedRequest?.transaction?.amount ?? 0);
        if (srAmount > 0) totalAmountNum = srAmount;
        if ((!funds || funds.length === 0) && selectedRequest?.transaction?.fund_accounts) {
          const srFundsSrc = Array.isArray(selectedRequest.transaction.fund_accounts) ? selectedRequest.transaction.fund_accounts : [selectedRequest.transaction.fund_accounts];
          funds = srFundsSrc.map(fa => ({ name: fa?.name || fa?.fund_name || 'N/A', amount: fa?.amount ?? fa?.allocated_amount ?? 0 }));
        }
      } catch (_) {}
    }

    // Final fallback: if no funds yet, build one from any available source and total
    if (!funds || funds.length === 0) {
      let faName = selectedTxForPrint?.fund_account?.name
        || selectedTxForPrint?.fundAccount?.name
        || selectedRequest?.transaction?.fund_account?.name
        || null;
      if (!faName) {
        const faId = selectedTxForPrint?.fund_account_id || selectedRequest?.transaction?.fund_account_id;
        if (faId) {
          try {
            const token = localStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const faRes = await axios.get(`${API_BASE_URL}/fund-accounts/${faId}`, { headers });
            faName = faRes?.data?.name || faRes?.data?.fund_name || faName;
          } catch (e) {
            // ignore
          }
        }
      }
      const fallbackAmt = Math.abs(toNumber(totalAmountNum || selectedTxForPrint?.amount || selectedRequest?.transaction?.amount || 0));
      funds = [{ name: faName || 'Fund Account', amount: fallbackAmt }];
    }

    // Normalize to positive for display
    totalAmountNum = Math.abs(toNumber(totalAmountNum));
    try { console.log('[Print] Funds to render:', funds, 'Total:', totalAmountNum); } catch {}
    const fundsHTML = funds.map((account, idx) => `
        <div class="fund-item-row">
          <span class="fund-name">${account?.name || 'N/A'}</span>
          <span class="fund-amount">₱${formatAmount(account?.amount || account?.allocated_amount || 0)}</span>
        </div>
    `).join('');

    const bodyMarkup = `
      <div class="receipt-print-area" id="overrideReceiptPrintPrint">
        <div class="official-receipt-header">
          <div class="receipt-title-section">
            <div class="receipt-logos">
              <div class="logo-image left-logo" aria-hidden="true"></div>
              <div class="receipt-title-content"></div>
              <div class="logo-image right-logo" aria-hidden="true"></div>
            </div>
          </div>
        </div>

        <div class="official-receipt-body">
          <div class="receipt-center-logos" aria-hidden="true">
            <div class="center-logo-image"></div>
          </div>

          <div class="receipt-payer-info">
            <p><strong>RECEIVED FROM:</strong> ${manualPayerName || 'N/A'}</p>
            <p><strong>DATE:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p><strong>TRANSACTION ID:</strong> #${manualReceiptTxId || 'N/A'}</p>
          </div>

          <div class="receipt-fund-info">
            <p class="fund-label">FUND ACCOUNTS USED:</p>
            <div class="fund-items-grid single-column">
              ${fundsHTML}
            </div>
          </div>

          <div class="receipt-body-spacer"></div>

          <div class="receipt-total-right">
            <span class="total-label-bold">TOTAL:</span>
            <span class="total-amount-bold">PHP${formatAmount(totalAmountNum)}</span>
          </div>
          <div class="amount-words-bold">${numberToWords(totalAmountNum)} PESOS ONLY</div>

          ${(user && (user.name || user.role)) ? `
          <div class="receipt-issued-by">
            <p class="issued-by-name">${user?.name || 'N/A'}${user?.role ? ` • ${user.role}` : ''}</p>
          </div>` : ''}
        </div>
      </div>`;

    // Compose the full HTML in a single write to avoid timing issues
    const fullHTML = `${getReceiptPrintHTML()}${bodyMarkup}\n</body>\n</html>`;
    printWindow.document.open();
    printWindow.document.write(fullHTML);
    printWindow.document.close();

    const finalizeAndClose = () => {
      setTimeout(() => {
        try {
          printWindow.focus();
          printWindow.print();
        } catch (e) {
          console.error('Print error:', e);
        } finally {
          printWindow.close();
          // Close modal after printing
          setShowManualReceiptModal(false);
          setManualReceiptNo("");
          setManualPayerName("");
          setManualReceiptTxId(null);
          setReceiptData(null);
        }
      }, 250);
    };

    if (printWindow.document.readyState === 'complete') {
      finalizeAndClose();
    } else {
      printWindow.addEventListener('load', finalizeAndClose);
      printWindow.document.addEventListener('DOMContentLoaded', finalizeAndClose);
    }

    // Fallback: if popup renders blank (popup blockers or Brave quirks), print via hidden iframe
    setTimeout(() => {
      try {
        const body = printWindow && printWindow.document && printWindow.document.body;
        const blank = !body || (!body.textContent?.trim() && body.children.length === 0);
        if (blank) {
          // Use hidden iframe in same window
          const iframe = document.createElement('iframe');
          iframe.style.position = 'fixed';
          iframe.style.right = '0';
          iframe.style.bottom = '0';
          iframe.style.width = '0';
          iframe.style.height = '0';
          iframe.style.border = '0';
          document.body.appendChild(iframe);

          const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
          iframeDoc.open();
          iframeDoc.write(fullHTML);
          iframeDoc.close();

          const printFromIframe = () => {
            try {
              (iframe.contentWindow || iframe).focus();
              (iframe.contentWindow || iframe).print();
            } catch (e) {
              console.error('Iframe print error:', e);
            } finally {
              setTimeout(() => {
                document.body.removeChild(iframe);
                // Close modal after printing
                setShowManualReceiptModal(false);
                setManualReceiptNo("");
                setManualPayerName("");
                setManualReceiptTxId(null);
                setReceiptData(null);
              }, 250);
            }
          };

          if (iframeDoc.readyState === 'complete') {
            printFromIframe();
          } else {
            iframe.addEventListener('load', printFromIframe);
            iframeDoc.addEventListener('DOMContentLoaded', printFromIframe);
          }

          try { printWindow && printWindow.close(); } catch {}
        }
      } catch (e) {
        console.warn('Popup print failed, attempting iframe fallback...', e);
      }
    }, 1200);
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
      {!hideKpiDashboard && (
        <>
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
        </>
      )}

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

      {/* Hidden Receipt Print Area - Professional Receipt Format */}
      <div className="receipt-print-area" id="overrideReceiptPrint" style={{ display: 'none' }}>
        <div className="official-receipt-header">
          <div className="receipt-title-section">
            <div className="receipt-logos">
              <div className="logo-image left-logo" aria-hidden="true"></div>
              <div className="receipt-title-content"></div>
              <div className="logo-image right-logo" aria-hidden="true"></div>
            </div>
          </div>
        </div>

        <div className="official-receipt-body">
          <div className="receipt-center-logos" aria-hidden="true">
            <div className="center-logo-image"></div>
          </div>

          <div className="receipt-payer-info">
            <p>
              <strong>RECEIVED FROM:</strong> {manualPayerName || 'N/A'}
            </p>
            <p>
              <strong>DATE:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <p>
              <strong>TRANSACTION ID:</strong> #{manualReceiptTxId || 'N/A'}
            </p>
          </div>

          {receiptData && receiptData.fundAccounts && receiptData.fundAccounts.length > 0 && (
            <div className="receipt-fund-info">
              <p className="fund-label">FUND ACCOUNTS USED:</p>
              <div className="fund-items-grid">
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

          {false && receiptData && receiptData.description && (
            <div className="receipt-description-box"></div>
          )}

          {(user?.name || user?.role) && (
            <div className="receipt-issued-by">
              <p className="issued-by-name">
                {user?.name || 'N/A'}
                {user?.role ? ` • ${user.role}` : ''}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Override Requests Table */}
      <div className="ot-requests-section">
        {/* Table Header with Filters and Export */}
        <div className="ot-table-header">
          {/* Left: Title and Count */}
          <div className="ot-header-title">
            <i className="fas fa-exchange-alt"></i>
            <span className="ot-title-text">Override Requests</span>
            <span className="ot-title-count">({filteredRequests.length})</span>
          </div>

          {/* Center: Search Box */}
          <div className="ot-search-container">
            <input
              type="text"
              placeholder="Search receipts..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              className="ot-search-input"
            />
            <i className="fas fa-search ot-search-icon"></i>
          </div>

          {/* Right: Date Filters, Status Filter, Export */}
          <div className="ot-header-controls">
            <div className="ot-date-filter-group">
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="ot-date-input"
                title="From Date"
              />
              <span className="ot-date-separator">to</span>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="ot-date-input"
                title="To Date"
              />
            </div>

            <div className="ot-filter-dropdown-container">
              <button
                className="ot-filter-btn"
                onClick={() => setFilters(prev => ({ ...prev, showFilterDropdown: !prev.showFilterDropdown }))}
                title="Filter by status"
              >
                <i className="fas fa-filter"></i>
                <span>
                  {filters.status === 'all' ? 'All Status' :
                   filters.status === 'pending' ? 'Pending' : 
                   filters.status === 'approved' ? 'Approved' : 
                   'Rejected'}
                </span>
                <i className={`fas fa-chevron-${filters.showFilterDropdown ? 'up' : 'down'}`}></i>
              </button>
              
              {filters.showFilterDropdown && (
                <div className="ot-filter-menu">
                  <button
                    className={`ot-filter-option ${filters.status === 'all' ? 'active' : ''}`}
                    onClick={() => { handleFilterChange('status', 'all'); setFilters(prev => ({ ...prev, showFilterDropdown: false })); }}
                  >
                    <i className="fas fa-list"></i>
                    <span>All Status</span>
                    {filters.status === 'all' && <i className="fas fa-check"></i>}
                  </button>
                  <button
                    className={`ot-filter-option ${filters.status === 'pending' ? 'active' : ''}`}
                    onClick={() => { handleFilterChange('status', 'pending'); setFilters(prev => ({ ...prev, showFilterDropdown: false })); }}
                  >
                    <i className="fas fa-clock"></i>
                    <span>Pending</span>
                    {filters.status === 'pending' && <i className="fas fa-check"></i>}
                  </button>
                  <button
                    className={`ot-filter-option ${filters.status === 'approved' ? 'active' : ''}`}
                    onClick={() => { handleFilterChange('status', 'approved'); setFilters(prev => ({ ...prev, showFilterDropdown: false })); }}
                  >
                    <i className="fas fa-check-circle"></i>
                    <span>Approved</span>
                    {filters.status === 'approved' && <i className="fas fa-check"></i>}
                  </button>
                  <button
                    className={`ot-filter-option ${filters.status === 'rejected' ? 'active' : ''}`}
                    onClick={() => { handleFilterChange('status', 'rejected'); setFilters(prev => ({ ...prev, showFilterDropdown: false })); }}
                  >
                    <i className="fas fa-times-circle"></i>
                    <span>Rejected</span>
                    {filters.status === 'rejected' && <i className="fas fa-check"></i>}
                  </button>
                </div>
              )}
            </div>

            <div className="ot-export-dropdown-container">
              <button
                className="ot-export-btn"
                onClick={() => setShowExportDropdown(prev => !prev)}
                title="Export options"
              >
                <i className="fas fa-download"></i>
              </button>
              {showExportDropdown && (
                <div className="ot-export-menu">
                  <button
                    className="ot-export-option"
                    onClick={handleExportPdf}
                  >
                    <i className="fas fa-file-pdf"></i>
                    <span>Download PDF</span>
                  </button>
                  <button
                    className="ot-export-option"
                    onClick={handleExportExcel}
                  >
                    <i className="fas fa-file-excel"></i>
                    <span>Download Excel</span>
                  </button>
                </div>
              )}
            </div>
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
                        // Open review modal for pending requests (Admin only)
                        if (role === "Admin" && request.status === 'pending') {
                          openReviewModal(request);
                        } else {
                          // Open details modal for all other cases
                          setSelectedRequest(request);
                          setShowDetailsModal(true);
                        }
                      }
                    }}
                    style={{ cursor: 'pointer' }}
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
                        <div className="requester-info">
                          <span className="requester-name">{request.requested_by?.name || request.requestedBy?.name || 'N/A'}</span>
                          {(request.requested_by?.role || request.requestedBy?.role) && (
                            <span className="requester-role">{request.requested_by?.role || request.requestedBy?.role}</span>
                          )}
                        </div>
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
                  </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="no-data">
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

                  {/* <div className="form-group">
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
                  </div> */}

                  {/* <div className="form-group">
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
                  </div> */}
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

      {/* Review Modal - Only for Admin */}
      {showReviewModal && selectedRequest && role === "Admin" && (
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
                {(() => {
                  // Look up the transaction from the transactions array using transaction_id
                  const linkedTransaction = transactions.find(tx => tx.id === selectedRequest.transaction_id);
                  const txData = linkedTransaction || selectedRequest.transaction || {};
                  
                  return (
                    <>
                      <div className="detail-item">
                        <label>Recipient Account:</label>
                        <span>{txData?.recipient || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <label>Transaction ID:</label>
                        <span>#{selectedRequest.transaction_id}</span>
                      </div>
                      <div className="detail-item">
                        <label>Requested By:</label>
                        <span>
                          {selectedRequest.requested_by?.name || selectedRequest.requestedBy?.name || 'N/A'}
                          {(selectedRequest.requested_by?.role || selectedRequest.requestedBy?.role) && 
                            ` (${selectedRequest.requested_by?.role || selectedRequest.requestedBy?.role})`
                          }
                        </span>
                      </div>
                      <div className="detail-item">
                        <label>Fund Account:</label>
                        <span>
                          {txData?.fund_account?.name || 
                           txData?.fund_accounts?.[0]?.name ||
                           txData?.fund_name ||
                           'N/A'}
                        </span>
                      </div>
                      <div className="detail-item">
                        <label>Old Amount:</label>
                        <span>
                          ₱{parseFloat(txData?.amount || 0).toLocaleString('en-PH', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </span>
                      </div>
                      <div className="detail-item">
                        <label>Proposed Amount:</label>
                        <span>
                          {(() => {
                            const changes = typeof selectedRequest.changes === 'string' 
                              ? JSON.parse(selectedRequest.changes || '{}') 
                              : (selectedRequest.changes || {});
                            const proposedAmount = changes.amount || txData?.amount;
                            return `₱${parseFloat(proposedAmount || 0).toLocaleString('en-PH', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}`;
                          })()}
                        </span>
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
                    </>
                  );
                })()}
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

      {/* Details Modal for Approved/Rejected Requests */}
      {showDetailsModal && selectedRequest && (
        <div className="ot-modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="ot-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="ot-modal-header">
              <h3>
                <i className={`fas ${selectedRequest.status === 'approved' ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                {' '}Request {selectedRequest.status === 'approved' ? 'Approved' : 'Rejected'}
              </h3>
              <button className="ot-modal-close" onClick={() => setShowDetailsModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="ot-modal-body">
              <div className="request-details">
                {(() => {
                  // Look up the transaction from the transactions array using transaction_id
                  const linkedTransaction = transactions.find(tx => tx.id === selectedRequest.transaction_id);
                  const txData = linkedTransaction || selectedRequest.transaction || {};
                  
                  return (
                    <>
                      <div className="detail-item">
                        <label><i className="fas fa-exchange-alt"></i> Transaction ID:</label>
                        <span>#{selectedRequest.transaction_id}</span>
                      </div>
                      <div className="detail-item">
                        <label><i className="fas fa-user"></i> Requested By:</label>
                        <span>
                          {selectedRequest.requested_by?.name || selectedRequest.requestedBy?.name || 'N/A'}
                          {(selectedRequest.requested_by?.role || selectedRequest.requestedBy?.role) && 
                            ` (${selectedRequest.requested_by?.role || selectedRequest.requestedBy?.role})`
                          }
                        </span>
                      </div>
                      <div className="detail-item">
                        <label><i className="fas fa-building"></i> Recipient Account:</label>
                        <span>{txData?.recipient || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <label><i className="fas fa-piggy-bank"></i> Fund Account:</label>
                        <span>
                          {txData?.fund_account?.name || 
                           txData?.fund_accounts?.[0]?.name ||
                           txData?.fund_name ||
                           'N/A'}
                        </span>
                      </div>
                      <div className="detail-item">
                        <label><i className="fas fa-money-bill-wave"></i> Old Amount:</label>
                        <span>
                          ₱{parseFloat(txData?.amount || 0).toLocaleString('en-PH', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </span>
                      </div>
                      <div className="detail-item">
                        <label><i className="fas fa-arrow-right"></i> New Amount:</label>
                        <span>
                          {(() => {
                            const changes = typeof selectedRequest.changes === 'string' 
                              ? JSON.parse(selectedRequest.changes || '{}') 
                              : (selectedRequest.changes || {});
                            const proposedAmount = changes.amount || txData?.amount;
                            return `₱${parseFloat(proposedAmount || 0).toLocaleString('en-PH', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}`;
                          })()}
                        </span>
                      </div>
                      <div className="detail-item">
                        <label><i className="fas fa-calendar"></i> Request Date:</label>
                        <span>{new Date(selectedRequest.created_at).toLocaleString()}</span>
                      </div>
                      <div className="detail-item">
                        <label><i className="fas fa-comment"></i> Reason for Override:</label>
                        <span>{selectedRequest.reason || 'No reason provided'}</span>
                      </div>
                    </>
                  );
                })()}
                
                {/* Review Information */}
                <div className="detail-item" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
                  <label>
                    <i className={`fas ${selectedRequest.status === 'approved' ? 'fa-check' : 'fa-times'}`}></i>
                    {' '}Status:
                  </label>
                  <span className={`status-badge ${selectedRequest.status}`}>
                    {selectedRequest.status.toUpperCase()}
                  </span>
                </div>
                
                {selectedRequest.reviewed_by && (
                  <div className="detail-item">
                    <label><i className="fas fa-user-shield"></i> Reviewed By:</label>
                    <span>{selectedRequest.reviewed_by?.name || selectedRequest.reviewedBy?.name || 'N/A'}</span>
                  </div>
                )}
                
                {selectedRequest.reviewed_at && (
                  <div className="detail-item">
                    <label><i className="fas fa-clock"></i> Review Date:</label>
                    <span>{new Date(selectedRequest.reviewed_at).toLocaleString()}</span>
                  </div>
                )}
                
                {selectedRequest.review_notes && (
                  <div className="detail-item" style={{ 
                    backgroundColor: selectedRequest.status === 'approved' ? '#f0fdf4' : '#fef2f2',
                    padding: '12px',
                    borderRadius: '8px',
                    border: `1px solid ${selectedRequest.status === 'approved' ? '#86efac' : '#fca5a5'}`
                  }}>
                    <label>
                      <i className="fas fa-sticky-note"></i>
                      {' '}{selectedRequest.status === 'approved' ? 'Approval' : 'Rejection'} Notes:
                    </label>
                    <span style={{ display: 'block', marginTop: '8px', fontStyle: 'italic' }}>
                      "{selectedRequest.review_notes}"
                    </span>
                  </div>
                )}
              </div>

              {/* <div className="form-actions" style={{ marginTop: '20px' }}>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowDetailsModal(false)}
                  style={{ width: '100%' }}
                >
                  <i className="fas fa-times"></i> Close
                </button>
              </div> */}
            </div>
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      {showPDFPreview && pdfPreviewUrl && (
        <div 
          className="pdf-preview-modal-overlay" 
          onClick={closePDFPreview}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div 
            className="pdf-preview-modal" 
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '80vw', height: '85vh', background: '#fff', borderRadius: '10px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            <div 
              className="pdf-preview-header" 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                       padding: '12px 16px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}
            >
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#111827' }}>
                Override Requests PDF Preview
              </h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <button 
                  type="button" 
                  onClick={downloadPDFFromPreview}
                  style={{ padding: '8px 12px', border: '1px solid #111827', borderRadius: 6, background: '#111827', color: '#fff', cursor: 'pointer' }}
                >
                  <i className="fas fa-download"></i> Download
                </button>
                <button 
                  type="button" 
                  onClick={closePDFPreview}
                  style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', color: '#111827', cursor: 'pointer' }}
                >
                  <i className="fas fa-times"></i> Close
                </button>
              </div>
            </div>
            <div className="pdf-preview-body" style={{ flex: 1, background: '#11182710' }}>
              <iframe
                title="Override Requests PDF Preview"
                src={pdfPreviewUrl}
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverrideTransactions;
