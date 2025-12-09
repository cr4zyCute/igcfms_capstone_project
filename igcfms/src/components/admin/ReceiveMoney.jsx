import React, { useState, useEffect } from "react";
import "../../assets/admin.css";
import "./css/receivemoney.css";
import axios from "axios";
import notificationService from '../../services/notificationService';
import balanceService from '../../services/balanceService';
import { getTransactions, getReceipts } from '../../services/api';
import { broadcastFundTransaction } from '../../services/fundTransactionChannel';
import { getReceiptPrintHTML } from '../pages/print/recieptPrint';
import { printCompleteCheque } from '../pages/print/chequeSimplePrint';
import { useAuth } from "../../contexts/AuthContext";
import { useFundAccounts } from "../../hooks/useFundAccounts";
import { useRecipientAccounts } from "../../hooks/useRecipientAccounts";
import { SkeletonLine } from "../ui/LoadingSkeleton";

const ReceiveMoney = ({ isCollectingOfficer = false, currentUserId = null }) => {
  const { user } = useAuth();
  const [payerName, setPayerName] = useState("");
  const [receiptNo, setReceiptNo] = useState("");
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");
  const [modeOfPayment, setModeOfPayment] = useState("Cash");
  const [message, setMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [createdTransactions, setCreatedTransactions] = useState([]);
  const [receiptDescription, setReceiptDescription] = useState("");
  const [lastReceiptNo, setLastReceiptNo] = useState("");
  const [receiptInputRef, setReceiptInputRef] = useState(null);
  // Accept broad uppercase alphanumeric-with-hyphen receipt formats
  const RECEIPT_PATTERN = /^[A-Z0-9-]{5,50}$/;
  const [receiptSuffix, setReceiptSuffix] = useState("");

  // Simple cookie helpers for persistence across logout/refresh
  const getCookie = (name) => {
    try {
      const parts = (document.cookie || '').split('; ');
      for (const part of parts) {
        const [k, ...rest] = part.split('=');
        if (k === name) return decodeURIComponent(rest.join('='));
      }
      return null;
    } catch { return null; }
  };
  const setLastReceiptPersistent = (val) => {
    if (!val) return;
    const v = String(val).toUpperCase();
    try { localStorage.setItem('lastReceiptNo', v); } catch {}
    try { document.cookie = `igcfms_last_receipt=${encodeURIComponent(v)}; path=/; max-age=${60*60*24*180}; SameSite=Lax`; } catch {}
  };

  // Function to convert number to words
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
  
  // Multiple fund accounts support
  const [selectedFundAccounts, setSelectedFundAccounts] = useState([]);
  
  // Modal states
  const [showFundAccountModal, setShowFundAccountModal] = useState(false);
  const [fundAccountSearch, setFundAccountSearch] = useState("");
  
  // Payer dropdown states
  const [showPayerDropdown, setShowPayerDropdown] = useState(false);
  const [payerSearch, setPayerSearch] = useState("");
  const [selectedRecipientId, setSelectedRecipientId] = useState(null);

  const {
    data: fundAccountsResponse,
    isLoading: fundAccountsLoading,
    isFetching: fundAccountsFetching,
    error: fundAccountsError,
  } = useFundAccounts({ refetchInterval: false, limit: 100 });

  const {
    data: recipientAccountsResponse = [],
    isLoading: recipientAccountsLoading,
    error: recipientAccountsError,
  } = useRecipientAccounts();

  const fundAccounts = Array.isArray(fundAccountsResponse?.data)
    ? fundAccountsResponse.data
    : Array.isArray(fundAccountsResponse)
      ? fundAccountsResponse
      : [];

  const recipientAccounts = Array.isArray(recipientAccountsResponse)
    ? recipientAccountsResponse
    : Array.isArray(recipientAccountsResponse?.data)
      ? recipientAccountsResponse.data
      : [];

  const fundAccountsAreLoading = fundAccountsLoading || (fundAccountsFetching && fundAccounts.length === 0);

  useEffect(() => {
    if (fundAccountsError || recipientAccountsError) {
      console.error('Error fetching accounts:', fundAccountsError || recipientAccountsError);
    }
  }, [fundAccountsError, recipientAccountsError]);

  // Load last used receipt number – read saved first so it persists across refresh/logout,
  // then try to refresh from server if available
  useEffect(() => {
    const parseDate = (d) => {
      if (!d) return 0;
      const t = Date.parse(d);
      return Number.isNaN(t) ? 0 : t;
    };

    const isValidReceiptFormat = (val) => {
      if (!val || typeof val !== 'string') return false;
      const v = val.trim().toUpperCase();
      return RECEIPT_PATTERN.test(v);
    };

    const load = async () => {
      // 1) Read cookie first so it persists even if logout clears localStorage
      try {
        const cookieVal = getCookie('igcfms_last_receipt');
        if (isValidReceiptFormat(cookieVal)) {
          setLastReceiptNo(cookieVal.toUpperCase());
        }
      } catch {}
      // 2) Then check localStorage
      try {
        const saved = localStorage.getItem('lastReceiptNo');
        if (isValidReceiptFormat(saved)) {
          setLastReceiptNo(saved.toUpperCase());
        }
      } catch {}

      // 3) Try to fetch a fresher last value from the server
      let serverLast = null;
      try {
        const rcResp = await getReceipts();
        const receipts = Array.isArray(rcResp) ? rcResp : (rcResp?.data || rcResp?.receipts || []);
        const latestR = (receipts || []).reduce((acc, r) => {
          const no = r?.receipt_number || r?.receipt_no;
          const date = parseDate(r?.issued_at || r?.created_at);
          if (!no) return acc;
          if (!acc || date > acc.date) return { no, date };
          return acc;
        }, null);
        if (latestR && isValidReceiptFormat(latestR.no)) serverLast = latestR.no.toUpperCase();
      } catch (e) {
        // ignore
      }

      try {
        const txResp = await getTransactions();
        const txList = Array.isArray(txResp) ? txResp : (txResp?.data || txResp?.transactions || []);
        const latestTx = (txList || [])
          .filter(t => (t?.type || '').toString().toLowerCase() === 'collection')
          .reduce((acc, t) => {
            const no = t?.receipt_no;
            const date = parseDate(t?.created_at);
            if (!no) return acc;
            if (!acc || date > acc.date) return { no, date };
            return acc;
          }, null);
        if (latestTx && isValidReceiptFormat(latestTx.no)) {
          if (!serverLast) serverLast = latestTx.no.toUpperCase();
        }
      } catch (e) {
        // ignore
      }

      if (serverLast && isValidReceiptFormat(serverLast)) {
        setLastReceiptNo(serverLast);
        setLastReceiptPersistent(serverLast);
      }
    };

    load();
  }, []);

  const handlePrintReceipt = () => {
    // Get the receipt print area element
    const receiptElement = document.getElementById('officialReceiptPrint');
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

    // Get the print HTML template from the imported function
    printWindow.document.write(getReceiptPrintHTML());

    // Clone and write the receipt content
    const clonedReceipt = receiptElement.cloneNode(true);
    printWindow.document.write(clonedReceipt.outerHTML);

    // Close the document
    printWindow.document.write(`
      </body>
      </html>
    `);
    printWindow.document.close();

    // Wait for content to load then print
    printWindow.onload = function() {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }, 250);
    };
  };

  // Auto-generate receipt numbers when any input is filled
  const [referenceNo, setReferenceNo] = useState("");
  const [hasAutoGeneratedReference, setHasAutoGeneratedReference] = useState(false);

  // Function to generate reference numbers (still auto-generated)
  const ensureReferenceNumber = () => {
    if (!hasAutoGeneratedReference && !referenceNo) {
      const now = new Date();
      const year = now.getFullYear();
      const yearRandomNum = Math.floor(Math.random() * 9999).toString().padStart(4, '0');

      setReferenceNo(`COL-${year}-${yearRandomNum}`);
      setHasAutoGeneratedReference(true);
    }
  };

  // Calculate total amount from fund accounts
  const totalAmount = selectedFundAccounts.reduce((sum, acc) => {
    return sum + (parseFloat(acc.allocatedAmount) || 0);
  }, 0);

  const receiptTotal = createdTransactions.length > 0
    ? createdTransactions.reduce((sum, transaction) => {
        const value = transaction?.allocatedAmount ?? transaction?.amount;
        return sum + (parseFloat(value) || 0);
      }, 0)
    : totalAmount;

  const handleSettingsClick = () => {
    // Placeholder for future receipt settings controls
  };

  const handlePrintCheque = () => {
    const chequeAmount = parseFloat(receiptTotal) || 0;
    if (chequeAmount <= 0) {
      console.error('No amount available for cheque printing.');
      return;
    }

    const chequePayee = payerName
      || createdTransactions[0]?.payer_name
      || createdTransactions[0]?.recipient
      || 'N/A';

    const chequeReference = referenceNo
      || createdTransactions[0]?.reference
      || createdTransactions[0]?.receipt_no
      || createdTransactions[0]?.transaction_id
      || '';

    printCompleteCheque({
      date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      payeeName: chequePayee,
      amount: `₱${chequeAmount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      amountInWords: `${numberToWords(Math.round(chequeAmount))} PESOS ONLY`,
      routingNumber: chequeReference || 'N/A',
    });
  };

  // Watch for any input changes to trigger auto-generation
  useEffect(() => {
    if (totalAmount > 0 || payerName || selectedFundAccounts.length > 0 || reference || description) {
      ensureReferenceNumber();
    }
  }, [totalAmount, payerName, selectedFundAccounts.length, reference, description, hasAutoGeneratedReference, referenceNo]);

  // Validation function
  const validateForm = () => {
    const newErrors = {};
    const hasEmptyAmount = selectedFundAccounts.some(
      (acc) => !acc.allocatedAmount || parseFloat(acc.allocatedAmount) <= 0
    );
    
    if (!payerName.trim()) {
      newErrors.payerName = "Payer name is required";
      if (hasEmptyAmount) {
        newErrors.allocation = "Please allocate an amount to each fund account";
      }
    }
    
    if (!modeOfPayment) {
      newErrors.modeOfPayment = "Payment mode is required";
    }

    if (!receiptNo.trim()) {
      newErrors.receiptNo = "Receipt number is required";
    }
    
    if (selectedFundAccounts.length === 0) {
      newErrors.fundAccount = "Please select at least one fund account";
    }

    // Validate allocated amounts
    if (selectedFundAccounts.length > 0) {
      // Check if any account has no amount
      if (hasEmptyAmount) {
        newErrors.allocation = "Please allocate an amount to each fund account";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Clear specific error when user starts typing
  const clearError = (field) => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle fund account selection (add to list)
  const handleFundAccountSelect = (account) => {
    // Check if account is already selected
    const isAlreadySelected = selectedFundAccounts.some(acc => acc.id === account.id);
    if (isAlreadySelected) {
      setMessage('This fund account is already added');
      setTimeout(() => setMessage(''), 2000);
      return;
    }
    
    // Add account with default amount allocation
    setSelectedFundAccounts(prev => [...prev, { ...account, allocatedAmount: '' }]);
    setShowFundAccountModal(false);
    setFundAccountSearch('');
    clearError('fundAccount');
  };
  
  // Remove fund account from selection
  const removeFundAccount = (accountId) => {
    setSelectedFundAccounts(prev => prev.filter(acc => acc.id !== accountId));
  };
  
  // Update allocated amount for a fund account
  const updateAllocatedAmount = (accountId, amount) => {
    setSelectedFundAccounts(prev =>
      prev.map(acc =>
        acc.id === accountId ? { ...acc, allocatedAmount: amount } : acc
      )
    );
  };

  // Filter accounts based on search
  const filteredFundAccounts = fundAccounts.filter(account =>
    account.name.toLowerCase().includes(fundAccountSearch.toLowerCase()) ||
    account.code.toLowerCase().includes(fundAccountSearch.toLowerCase())
  );
  
  // Filter recipient accounts for payer dropdown
  const filteredRecipientAccounts = Array.isArray(recipientAccounts) 
    ? recipientAccounts.filter(account => {
        // If no search term, show all accounts
        if (!payerSearch || payerSearch.trim() === '') {
          return true;
        }
        
        const searchLower = payerSearch.toLowerCase();
        const nameMatch = account.name && account.name.toLowerCase().includes(searchLower);
        const codeMatch = account.fund_code && account.fund_code.toLowerCase().includes(searchLower);
        const contactMatch = account.contact_person && account.contact_person.toLowerCase().includes(searchLower);
        
        return nameMatch || codeMatch || contactMatch;
      })
    : [];

  const displayedRecipientAccounts = filteredRecipientAccounts;
  
  // Handle payer selection from recipient accounts
  const handlePayerSelect = (recipient) => {
    setPayerName(recipient.name);
    setSelectedRecipientId(recipient.id);
    setShowPayerDropdown(false);
    setPayerSearch("");
    clearError('payerName');
    ensureReferenceNumber();
  };
  
  // Get display value for payer input
  const payerDisplayValue = selectedRecipientId && !showPayerDropdown
    ? payerName
    : payerSearch || payerName;

  // Locked prefix derived from last used receipt (exclude its last character)
  const lockedPrefix = RECEIPT_PATTERN.test((lastReceiptNo || '').toUpperCase())
    ? lastReceiptNo.slice(0, -1).toUpperCase()
    : '';

  // Handle receipt number input focus - auto type last used (except last digit)
  const handleReceiptNoFocus = () => {
    const isValidLast = !!lockedPrefix;
    if (isValidLast && !receiptNo) {
      const prefix = lockedPrefix;
      setReceiptNo(prefix);
      setReceiptSuffix('');
      // place caret at the end of the auto-typed prefix
      setTimeout(() => {
        if (receiptInputRef) {
          receiptInputRef.focus();
          try { receiptInputRef.setSelectionRange(prefix.length, prefix.length); } catch {}
        }
      }, 0);
    }
  };

  // Handle receipt number input change
  const handleReceiptNoChange = (e) => {
    const value = e.target.value.toUpperCase();
    // allow only A-Z, 0-9 and hyphen
    const sanitized = value.replace(/[^A-Z0-9-]/g, '');

    if (lockedPrefix) {
      // Extract typed suffix (characters after locked prefix)
      const afterPrefix = sanitized.startsWith(lockedPrefix)
        ? sanitized.slice(lockedPrefix.length)
        : sanitized;
      const onlyAN = afterPrefix.replace(/[^A-Z0-9]/g, '');
      const lastChar = onlyAN.slice(-1); // allow only the final character
      setReceiptSuffix(lastChar);
      setReceiptNo(lockedPrefix + lastChar);
      // Keep caret at end
      requestAnimationFrame(() => {
        if (receiptInputRef) {
          const pos = (lockedPrefix + lastChar).length;
          try { receiptInputRef.setSelectionRange(pos, pos); } catch {}
        }
      });
    } else {
      setReceiptNo(sanitized);
    }
    clearError('receiptNo');
  };

  const handleReceiptNoKeyDown = (e) => {
    if (!lockedPrefix || !receiptInputRef) return;
    const input = receiptInputRef;
    const prefixLen = lockedPrefix.length;
    const selStart = input.selectionStart ?? 0;
    // Prevent moving caret into the locked prefix or deleting it
    if (
      (e.key === 'Backspace' && selStart <= prefixLen) ||
      (e.key === 'Delete' && selStart < prefixLen) ||
      (e.key.length === 1 && selStart < prefixLen) ||
      (e.key === 'ArrowLeft' && selStart <= prefixLen)
    ) {
      e.preventDefault();
      try { input.setSelectionRange(prefixLen, prefixLen); } catch {}
    }
  };

  const handleReceiptNoPaste = (e) => {
    if (!lockedPrefix) return; // allow normal paste when no locked prefix
    e.preventDefault();
    const text = (e.clipboardData.getData('text') || '').toUpperCase();
    const onlyAN = text.replace(/[^A-Z0-9]/g, '');
    const lastChar = onlyAN.slice(-1);
    setReceiptSuffix(lastChar);
    const combined = lockedPrefix + lastChar;
    setReceiptNo(combined);
    requestAnimationFrame(() => {
      if (receiptInputRef) {
        const pos = combined.length;
        try { receiptInputRef.setSelectionRange(pos, pos); } catch {}
      }
    });
  };

  // Handle receipt number blur - only validate (do not overwrite last used)
  const handleReceiptNoBlur = async () => {
    const current = receiptNo.trim();
    if (!current) return;
    const unique = await checkReceiptNoUnique(current);
    if (!unique) {
      setErrors(prev => ({ ...prev, receiptNo: 'Receipt number already exists. Please enter a unique number.' }));
    }
  };

  // Check if a receipt number is unique against receipts and transactions (client-side filter)
  const checkReceiptNoUnique = async (no) => {
    const target = (no || '').trim().toUpperCase();
    if (!target) return true;

    // 1) Check receipts table
    try {
      const rcResp = await getReceipts();
      const receipts = Array.isArray(rcResp) ? rcResp : (rcResp?.data || rcResp?.receipts || []);
      const existsInReceipts = (receipts || []).some(r => (
        (r?.receipt_number || r?.receipt_no || '')
          .toString()
          .trim()
          .toUpperCase() === target
      ));
      if (existsInReceipts) return false;
    } catch (e) {
      console.warn('Receipt uniqueness check (receipts) failed:', e?.message || e);
    }

    // 2) Check transactions list
    try {
      const txResp = await getTransactions();
      const txList = Array.isArray(txResp) ? txResp : (txResp?.data || txResp?.transactions || []);
      const existsInTx = (txList || []).some(t => (
        (t?.receipt_no || '')
          .toString()
          .trim()
          .toUpperCase() === target
      ));
      if (existsInTx) return false;
    } catch (e) {
      console.warn('Receipt uniqueness check (transactions) failed:', e?.message || e);
    }

    return true;
  };

  // Reset form
  const resetForm = () => {
    setPayerName("");
    setPayerSearch("");
    setSelectedRecipientId(null);
    setDescription("");
    setReference("");
    setModeOfPayment("Cash");
    setSelectedFundAccounts([]);
    setErrors({});
    setMessage("");
    setSuccessMessage("");
    setReceiptNo("");
    setReferenceNo("");
    setHasAutoGeneratedReference(false);
    setCreatedTransactions([]);
    setReceiptDescription("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    setLoading(true);
    setMessage("");
    setSuccessMessage("");
    
    // Ensure unique receipt number before proceeding
    const isUnique = await checkReceiptNoUnique(receiptNo.trim());
    if (!isUnique) {
      setErrors(prev => ({ ...prev, receiptNo: 'Receipt number already exists. Please enter a unique number.' }));
      setMessage('Receipt number already exists. Please enter a unique number.');
      setLoading(false);
      return;
    }
    
    // Use the payer name entered by user
    const finalPayerName = payerName.trim();
    
    try {
      const token = localStorage.getItem('token');
      
      // Create transactions for each fund account
      const transactionPromises = selectedFundAccounts.map(async (fundAccount) => {
        const transactionData = {
          type: "Collection",
          amount: parseFloat(fundAccount.allocatedAmount),
          description: description.trim() || null,
          recipient: finalPayerName,
          department: "General",
          category: "Revenue Collection",
          reference: reference.trim() || null,
          receipt_no: receiptNo.trim(),
          fund_account_id: parseInt(fundAccount.id),
          mode_of_payment: modeOfPayment,
          payer_name: finalPayerName,
          recipient_account_id: selectedRecipientId || null,
        };
        
        const response = await axios.post('/api/transactions', transactionData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        return {
          ...response.data.data,
          fundAccountName: fundAccount.name,
          fundAccountId: fundAccount.id,
          allocatedAmount: fundAccount.allocatedAmount
        };
      });

      const transactionResults = await Promise.all(transactionPromises);
      
      // If payment method is Cheque, automatically create cheque records
      if (modeOfPayment === "Cheque") {
        const chequeCreationPromises = transactionResults.map(async (result) => {
          try {
            const chequePayload = {
              transaction_id: result.id || result.transaction_id,
              payee_name: finalPayerName,
              method: 'Cheque',
              cheque_number: receiptNo.trim() || `CHQ-${Date.now()}`,
              bank_name: 'Unknown Bank',
              account_number: '',
              amount: parseFloat(result.allocatedAmount),
              issue_date: new Date().toISOString().split('T')[0],
              memo: description.trim() || null,
              fund_account_id: parseInt(result.fundAccountId)
            };

            await axios.post('/api/disbursements', chequePayload, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });

            console.log('Cheque record created automatically for transaction:', result.id);
          } catch (chequeError) {
            console.error('Failed to create cheque record:', chequeError);
            // Don't fail the entire transaction if cheque creation fails
          }
        });

        try {
          await Promise.all(chequeCreationPromises);
        } catch (chequeError) {
          console.error('Cheque creation error:', chequeError);
          // Continue with balance updates even if cheque creation fails
        }
      }
      
      // Process balance updates in parallel for better performance
      const balanceUpdatePromises = transactionResults.map(async (result) => {
        try {
          const processed = await balanceService.processTransaction('RECEIVE_MONEY', {
            fund_account_id: parseInt(result.fundAccountId),
            amount: parseFloat(result.allocatedAmount),
            payer: finalPayerName,
            fund_account_name: result.fundAccountName,
            transaction_id: result.id || result.transaction_id,
            receipt_no: result.receipt_no
          });

          broadcastFundTransaction({
            accountId: parseInt(result.fundAccountId),
            type: 'collection',
            amount: parseFloat(result.allocatedAmount),
            source: 'ReceiveMoney',
            balance: processed?.newBalance,
          });
          
          return processed;
        } catch (balanceError) {
          console.error('Balance update error:', balanceError);
          return null;
        }
      });
      
      // Wait for all balance updates to complete
      await Promise.all(balanceUpdatePromises);

      // Store created transactions and description for receipt
      setCreatedTransactions(transactionResults);
      setReceiptDescription(description); // Save description before modal opens
      // Persist last used receipt number (cookie + localStorage)
      try {
        const formatted = receiptNo.trim().toUpperCase();
        setLastReceiptNo(formatted);
        setLastReceiptPersistent(formatted);
      } catch {}
      
      // Show receipt modal
      setShowReceiptModal(true);
      
    } catch (error) {
      console.error('Error creating transaction:', error);
      setMessage(error.response?.data?.message || 'Error creating transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="receive-money-container">
      {/* Display created transactions for collecting officer */}
      {isCollectingOfficer && createdTransactions.length > 0 && (
        <div className="created-transactions-section">
          <div className="transactions-header">
            <h4><i className="fas fa-check-circle"></i> Created Transactions</h4>
            <span className="transaction-count">{createdTransactions.length}</span>
          </div>
          <div className="transactions-list">
            {createdTransactions.map((transaction, index) => (
              <div key={transaction.id || index} className="transaction-item">
                <div className="transaction-info">
                  <span className="transaction-number">#{index + 1}</span>
                  <span className="transaction-fund">{transaction.fundAccountName}</span>
                  <span className="transaction-date">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="transaction-amount">
                  ₱{parseFloat(transaction.allocatedAmount || 0).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="receive-money-form">
        

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="alert alert-success">
            <i className="fas fa-check-circle"></i>
            {successMessage}
          </div>
        )}
        {message && (
          <div className="alert alert-error">
            <i className="fas fa-exclamation-triangle"></i>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="enhanced-form">
          {/* Left Column - Receipt Information & Fund Assignment */}
          <div className="form-section left-column">
            {/* Receipt Information */}
            <div className="subsection-header">
              <h6><i className="fas fa-receipt"></i> Receipt Information</h6>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Receipt Number</label>
                <div className="receipt-input-wrapper">
                  <input
                    ref={(ref) => setReceiptInputRef(ref)}
                    type="text"
                    value={receiptNo}
                    onChange={handleReceiptNoChange}
                    onFocus={handleReceiptNoFocus}
                    onBlur={handleReceiptNoBlur}
                    placeholder={RECEIPT_PATTERN.test((lastReceiptNo||'').toUpperCase()) ? ` ${lastReceiptNo}` : "Enter receipt number"}
                    pattern="[A-Z0-9-]{5,50}"
                    title="Format: RCPT-YYYYMMDD-#### (e.g., RCPT-20251206-0001)"
                    autoComplete="off"
                    onKeyDown={handleReceiptNoKeyDown}
                    onPaste={handleReceiptNoPaste}
                    className={errors.receiptNo ? "error" : ""}
                  />
                  {(RECEIPT_PATTERN.test((lastReceiptNo||'').toUpperCase()) && (receiptNo === '' || receiptNo === lastReceiptNo.slice(0, -1))) && (
                    <span className="receipt-autocomplete-hint">
                      <span className="hint-text">{receiptNo || lastReceiptNo.slice(0, -1)}</span>
                      <span className="gray-char">{lastReceiptNo.slice(-1)}</span>
                    </span>
                  )}
                </div>
                {errors.receiptNo && <span className="error-text">{errors.receiptNo}</span>}
                
              </div>
              
              <div className="form-group">
                <label>Reference Number</label>
                <div className="input-with-tooltip">
                  <input
                    type="text"
                    value={referenceNo || "Will auto-generate when form is filled"}
                    disabled
                    className="auto-generated-field"
                  />
                  <i className="fas fa-info-circle tooltip-icon" title="Auto-generated collection reference"></i>
                </div>
              </div>
            </div>
            {/* Payer Input with Searchable Dropdown */}
            <div className="form-group">
              <label>Payor Name <span className="required">*</span></label>
              <div className="payer-searchable-select">
                <div className="payer-search-wrapper">
                  <input
                    type="text"
                    className={`payer-search-input ${errors.payerName ? "error" : ""}`}
                    placeholder="Search or enter payor name..."
                    value={payerDisplayValue}
                    onChange={(e) => {
                      setPayerSearch(e.target.value);
                      setPayerName(e.target.value);
                      if (!showPayerDropdown) {
                        setShowPayerDropdown(true);
                      }
                      if (selectedRecipientId) {
                        setSelectedRecipientId(null);
                      }
                      clearError('payerName');
                      ensureReferenceNumber();
                    }}
                    onFocus={() => {
                      setShowPayerDropdown(true);
                      if (selectedRecipientId) {
                        setPayerSearch('');
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => setShowPayerDropdown(false), 200);
                    }}
                  />
                  <i className="fas fa-search payer-search-icon"></i>
                </div>
                {showPayerDropdown && (
                  <div className="payer-dropdown">
                    <div className="payer-options">
                      {recipientAccountsLoading ? (
                        <div className="payer-option no-results">
                          <span className="no-results-text">Loading recipients...</span>
                        </div>
                      ) : displayedRecipientAccounts.length > 0 ? (
                        displayedRecipientAccounts.map((account) => (
                          <div 
                            key={account.id}
                            className={`payer-option ${selectedRecipientId === account.id ? 'selected' : ''}`}
                            onClick={() => handlePayerSelect(account)}
                          >
                            <div className="payer-option-content">
                              <span className="payer-name">{account.name}</span>
                              {account.fund_code && (
                                <span className="payer-code">({account.fund_code})</span>
                              )}
                            </div>
                            {account.contact_person && (
                              <span className="payer-contact">{account.contact_person}</span>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="payer-option no-results">
                          <span className="no-results-text">
                            {recipientAccounts.length === 0 
                              ? "No recipient accounts available" 
                              : "No matching recipients found"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {errors.payerName && <span className="error-text">{errors.payerName}</span>}
              <small className="field-hint">
                <i className="fas fa-info-circle"></i>
                Search from existing recipients or type a new name
              </small>
            </div>
            
            <div className="form-group">
              <label>Fund Accounts <span className="required">*</span></label>
              
              {/* Selected Fund Accounts List */}
              {selectedFundAccounts.length > 0 && (
                <div className="selected-fund-accounts-list">
                  {selectedFundAccounts.map((account, index) => (
                    <div key={account.id} className="fund-account-item">
                      <div className="fund-account-info">
                        <span className="fund-account-name">{account.name}</span>
                        <span className="fund-account-code">({account.code})</span>
                      </div>
                      <div className="fund-account-amount">
                        <input
                          type="number"
                          placeholder="Amount"
                          value={account.allocatedAmount}
                          onChange={(e) => updateAllocatedAmount(account.id, e.target.value)}
                          className="amount-allocation-input"
                          min="0.01"
                          step="0.01"
                        />
                        <button
                          type="button"
                          className="remove-fund-btn"
                          onClick={() => removeFundAccount(account.id)}
                          title="Remove fund account"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Add Fund Account Button */}
              <button
                type="button"
                className="add-fund-account-btn"
                onClick={() => setShowFundAccountModal(true)}
              >
                <i className="fas fa-plus-circle"></i>
                {selectedFundAccounts.length === 0 ? 'Fund Accounts' : 'Add Another Fund Account'}
              </button>
              
              {errors.fundAccount && <span className="error-text">{errors.fundAccount}</span>}
              {errors.allocation && <span className="error-text">{errors.allocation}</span>}
            </div>
          </div>

          {/* Right Column - Transaction Details */}
          <div className="form-section right-column">
            {/* Payer Information at TOP */}
         

            {/* Transaction Details */}
            <div className="subsection-header">
              <h6><i className="fas fa-coins"></i> Transaction Details</h6>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Payment Mode</label>
                <select
                  value={modeOfPayment}
                  onChange={(e) => {
                    setModeOfPayment(e.target.value);
                    clearError('modeOfPayment');
                  }}
                  className={errors.modeOfPayment ? "error" : ""}
                >
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Online Payment">Online Payment</option>
                </select>
                {errors.modeOfPayment && <span className="error-text">{errors.modeOfPayment}</span>}
              </div>
            </div>

            <div className="form-group">
              <label>Description (Optional)</label>
              <textarea
                placeholder="Enter transaction description or notes"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="3"
              />
            </div>
          </div>

          {/* Total Amount Display */}
          {selectedFundAccounts.length > 0 && (
            <div className="total-amount-display-top">
              <span className="total-label">Total Amount:</span>
              <strong className="total-value">₱{totalAmount.toFixed(2)}</strong>
            </div>
          )}

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              onClick={resetForm}
              className="btn-secondary"
              disabled={loading}
            >
              <i className="fas fa-undo"></i>
              Reset
            </button>
            
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Processing...
                </>
              ) : (
                <>
                  <i className="fas fa-plus-circle"></i>
                  Create Collection Transaction
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Fund Account Selection Modal */}
      {showFundAccountModal && (
        <div className="rm-modal-overlay" onClick={() => setShowFundAccountModal(false)}>
          <div className="rm-fund-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rm-modal-header">
              <div className="rm-header-content">
                <h3 className="rm-modal-title">FUND ACCOUNT</h3>
                <button 
                  className="rm-close-btn" 
                  onClick={() => setShowFundAccountModal(false)}
                >
                  ×
                </button>
              </div>
              <div className="rm-search-container">
                <i className="fas fa-search rm-search-icon"></i>
                <input
                  type="text"
                  className="rm-search-input"
                  placeholder="Search by account name or code..."
                  value={fundAccountSearch}
                  onChange={(e) => setFundAccountSearch(e.target.value)}
                />
              </div>
            </div>
            
            <div className="rm-modal-body">
              <div className="rm-accounts-list">
                {fundAccountsAreLoading ? (
                  <div className="rm-account-skeletons">
                    {Array.from({ length: 3 }).map((_, idx) => (
                      <div className="rm-account-card skeleton" key={`fund-skeleton-${idx}`}>
                        <div className="rm-account-main">
                          <SkeletonLine width="60%" height={20} />
                          <SkeletonLine width="24px" height={20} />
                        </div>
                        <div className="rm-account-info">
                          <SkeletonLine width="80px" height={20} />
                          <SkeletonLine width="70px" height={20} />
                        </div>
                        <div className="rm-account-balance">
                          <SkeletonLine width="90px" height={14} />
                          <SkeletonLine width="120px" height={18} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredFundAccounts.length === 0 ? (
                  <div className="rm-no-results">
                    <i className="fas fa-search"></i>
                    <p>No fund accounts found</p>
                  </div>
                ) : (
                  filteredFundAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="rm-account-card"
                      onClick={() => handleFundAccountSelect(account)}
                    >
                      <div className="rm-account-main">
                        <h4 className="rm-account-name">{account.name}</h4>
                        <i className="fas fa-chevron-right rm-chevron"></i>
                      </div>
                      <div className="rm-account-info">
                        <span className="rm-code-badge">{account.code}</span>
                        <span className="rm-type-badge">{account.account_type}</span>
                      </div>
                      <div className="rm-account-balance">
                        <span className="rm-balance-label">BALANCE:</span>
                        <span className="rm-balance-value">
                          ₱{parseFloat(account.current_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowReceiptModal(false);
            resetForm();
          }}
        >
          <div className="receipt-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="receipt-actions-bar">
              <button className="modal-close" onClick={() => {
                setShowReceiptModal(false);
                resetForm();
              }}>
                <i className="fas fa-times"></i>
              </button>
              {/* {createdTransactions.length > 0 && (
                <button className="print-btn" onClick={handlePrintCheque}>
                  <i className="fas fa-money-check-alt"></i> Print Cheque
                </button>
              )} */}
              <button className="print-btn" onClick={handlePrintReceipt}>
                <i className="fas fa-print"></i> Print
              </button>
            </div>

            <div className="receipt-print-area" id="officialReceiptPrint">
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
                    <strong>RECEIVED FROM:</strong> {payerName || 'N/A'}
                  </p>
                  <p>
                    <strong>DATE:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>

                {(() => {
                  const fundItems = (createdTransactions.length > 0
                    ? createdTransactions.map((transaction) => ({
                        name: transaction.fundAccountName,
                        amount: transaction.allocatedAmount,
                      }))
                    : selectedFundAccounts.map((account) => ({
                        name: account.name,
                        amount: account.allocatedAmount,
                      }))
                  ).filter((item) => item && item.name);

                  if (fundItems.length === 0) return null;

                  return (
                    <div className="receipt-fund-info">
                      <p className="fund-label">FUND ACCOUNTS USED:</p>
                      <div className="fund-items-grid single-column">
                        {fundItems.map((item, idx) => (
                          <div key={`${item.name}-${idx}`} className="fund-item-row">
                            <span className="fund-name">{item.name}</span>
                            <span className="fund-amount">
                              ₱{parseFloat(item.amount || 0).toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                <div className="receipt-body-spacer"></div>

                <div className="receipt-total-right">
                  <span className="total-label-bold">TOTAL:</span>
                  <span className="total-amount-bold">PHP{totalAmount.toFixed(2)}</span>
                </div>

                <div className="amount-words-bold">
                  {numberToWords(totalAmount)} PESOS ONLY
                </div>

                {receiptDescription && (
                  <div className="receipt-description-box">
                    <p className="description-label-receipt">Description:</p>
                    <p className="description-text-receipt">{receiptDescription}</p>
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
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Processing transactions...</p>
            <p className="loading-subtext">Please wait while we create your receipt</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiveMoney;
