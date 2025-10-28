import React, { useState, useEffect } from "react";
import "../../assets/admin.css";
import "./css/receivemoney.css";
import axios from "axios";
import notificationService from '../../services/notificationService';
import balanceService from '../../services/balanceService';
import { broadcastFundTransaction } from '../../services/fundTransactionChannel';
import { getReceiptPrintHTML } from '../pages/print/recieptPrint';

const ReceiveMoney = () => {
  const [fundAccounts, setFundAccounts] = useState([]);
  const [recipientAccounts, setRecipientAccounts] = useState([]);
  const [payerName, setPayerName] = useState("");
  const [receiptNo, setReceiptNo] = useState(""); // Will be auto-generated
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

  // Fetch fund accounts and recipient accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Fetch fund accounts
        const fundResponse = await axios.get('/api/fund-accounts', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        setFundAccounts(fundResponse.data);
        
        // Fetch recipient accounts
        const recipientResponse = await axios.get('/api/recipient-accounts', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        // Ensure we set an array, handle both direct array and data property
        const recipientData = Array.isArray(recipientResponse.data) 
          ? recipientResponse.data 
          : (recipientResponse.data?.data || []);
        console.log('Fetched recipient accounts:', recipientData);
        setRecipientAccounts(recipientData);
      } catch (error) {
        console.error('Error fetching accounts:', error);
      }
    };

    fetchAccounts();
  }, []);

  const handlePrintReceipt = () => {
    // Get the receipt print area element
    const receiptElement = document.getElementById('officialReceiptPrint');
    if (!receiptElement) {
      console.error('Receipt print area not found.');
      return;
    }

    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=400,height=700');
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
  const [hasAutoGenerated, setHasAutoGenerated] = useState(false);

  // Function to generate receipt numbers
  const generateReceiptNumbers = () => {
    if (!hasAutoGenerated) {
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const randomNum = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
      const year = today.getFullYear();
      const yearRandomNum = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
      
      setReceiptNo(`RCPT-${dateStr}-${randomNum}`);
      setReferenceNo(`COL-${year}-${yearRandomNum}`);
      setHasAutoGenerated(true);
    }
  };

  // Calculate total amount from fund accounts
  const totalAmount = selectedFundAccounts.reduce((sum, acc) => {
    return sum + (parseFloat(acc.allocatedAmount) || 0);
  }, 0);

  // Watch for any input changes to trigger auto-generation
  useEffect(() => {
    if (totalAmount > 0 || payerName || selectedFundAccounts.length > 0 || reference || description) {
      generateReceiptNumbers();
    }
  }, [totalAmount, payerName, selectedFundAccounts.length, reference, description, hasAutoGenerated]);

  // Validation function
  const validateForm = () => {
    const newErrors = {};
    
    if (!payerName.trim()) {
      newErrors.payerName = "Payer name is required";
    }
    
    if (selectedFundAccounts.length === 0) {
      newErrors.fundAccount = "Please select at least one fund account";
    }
    
    // Validate allocated amounts
    if (selectedFundAccounts.length > 0) {
      // Check if any account has no amount
      const hasEmptyAmount = selectedFundAccounts.some(acc => !acc.allocatedAmount || parseFloat(acc.allocatedAmount) <= 0);
      if (hasEmptyAmount) {
        newErrors.allocation = "Please allocate an amount to each fund account";
      }
    }
    
    if (!modeOfPayment) {
      newErrors.modeOfPayment = "Payment mode is required";
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
  
  // Handle payer selection from recipient accounts
  const handlePayerSelect = (recipient) => {
    setPayerName(recipient.name);
    setSelectedRecipientId(recipient.id);
    setShowPayerDropdown(false);
    setPayerSearch("");
    clearError('payerName');
    generateReceiptNumbers();
  };
  
  // Get display value for payer input
  const payerDisplayValue = selectedRecipientId && !showPayerDropdown
    ? payerName
    : payerSearch || payerName;

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
    setHasAutoGenerated(false);
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
          fund_account_id: parseInt(fundAccount.id),
          mode_of_payment: modeOfPayment,
          payer_name: finalPayerName,
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
                <div className="input-with-tooltip">
                  <input
                    type="text"
                    value={receiptNo || "Will auto-generate when form is filled"}
                    disabled
                    className="auto-generated-field"
                  />
                  <i className="fas fa-info-circle tooltip-icon" title="Auto-generated by the system for tracking"></i>
                </div>
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
              <label>Payer Name <span className="required">*</span></label>
              <div className="payer-searchable-select">
                <div className="payer-search-wrapper">
                  <input
                    type="text"
                    className={`payer-search-input ${errors.payerName ? "error" : ""}`}
                    placeholder="Search or enter payer name..."
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
                      generateReceiptNumbers();
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
                      {filteredRecipientAccounts.length > 0 ? (
                        filteredRecipientAccounts.map((account) => (
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
                  {selectedFundAccounts.length > 0 && (
                    <div className="allocation-summary">
                      <span>Total Amount:</span>
                      <strong>
                        ₱{totalAmount.toFixed(2)}
                      </strong>
                    </div>
                  )}
                </div>
              )}
              
              {/* Add Fund Account Button */}
              <button
                type="button"
                className="add-fund-account-btn"
                onClick={() => setShowFundAccountModal(true)}
              >
                <i className="fas fa-plus-circle"></i>
                {selectedFundAccounts.length === 0 ? 'Select Fund Accounts' : 'Add Another Fund Account'}
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
        <div className="modal-overlay" onClick={() => setShowFundAccountModal(false)}>
          <div className="modal enhanced-fund-modal" onClick={(e) => e.stopPropagation()}>
            <div className="enhanced-modal-header">
              <h3>SELECT FUND ACCOUNT</h3>
              <button 
                className="enhanced-close-button" 
                onClick={() => setShowFundAccountModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="enhanced-modal-body">
              <div className="enhanced-search-bar">
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  placeholder="Search by account name or code..."
                  value={fundAccountSearch}
                  onChange={(e) => setFundAccountSearch(e.target.value)}
                />
              </div>
              
              <div className="enhanced-accounts-list">
                {filteredFundAccounts.length === 0 ? (
                  <div className="no-results">
                    <i className="fas fa-search"></i>
                    <p>No fund accounts found</p>
                  </div>
                ) : (
                  filteredFundAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="enhanced-account-card"
                      onClick={() => handleFundAccountSelect(account)}
                    >
                      <div className="enhanced-account-content">
                        <div className="enhanced-account-header">
                          <h4>{account.name}</h4>
                          <i className="fas fa-chevron-right"></i>
                        </div>
                        <div className="enhanced-account-details">
                          <span className="account-code-badge">{account.code}</span>
                          <span className="account-type-badge">{account.account_type}</span>
                        </div>
                        <div className="enhanced-account-balance">
                          <span className="balance-label">Balance:</span>
                          <span className="balance-amount">₱{parseFloat(account.balance || 0).toLocaleString()}</span>
                        </div>
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
        <div className="modal-overlay" onClick={() => {
          setShowReceiptModal(false);
          resetForm();
        }}>
          <div className="modal official-receipt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="receipt-print-area" id="officialReceiptPrint">
              {/* Receipt Header with Logos */}
              <div className="official-receipt-header">
                <div className="receipt-top-bar">
                  <span className="accountable-no">ACCOUNTABLE NO.</span>
                  <span className="receipt-type">(ORIGINAL)</span>
                </div>
                
                <div className="receipt-title-section">
                  <div className="receipt-logos">
                    <div className="logo-image left-logo">
                      <img src="/igfms_logo.png" alt="IGCFMS Logo" />
                    </div>
                    <div className="receipt-title-content">
                      <h1>OFFICIAL RECEIPT</h1>
                      <p className="system-name">Integrated Government Cash Flow Management System</p>
                      <p className="department-name">Government Financial Services Department</p>
                      <p className="contact-info">Tel: (031) 8888-0000 | Email: igcfms@gmail.com</p>
                    </div>
                    <div className="logo-image right-logo">
                      <img src="/ctu_logo.png" alt="CTU Logo" />
                    </div>
                  </div>
                </div>

                <div className="receipt-number-section">
                  <span className="receipt-label">RECEIPT NO.</span>
                  <span className="receipt-number">{createdTransactions[0]?.receipt_no || 'N/A'}</span>
                </div>
              </div>

              {/* Receipt Body */}
              <div className="official-receipt-body">
                {/* Centered Logos as Watermark */}
                <div className="receipt-center-logos">
                  <div className="center-logo-container">
                    <img src="/igfms_logo.png" alt="IGCFMS Logo" className="center-logo-image" />
                  </div>
                </div>

                {/* Payer Information */}
                <div className="receipt-payer-info" style={{ marginBottom: '20px', position: 'relative', zIndex: 1 }}>
                  <p style={{ fontSize: '12px', marginBottom: '8px' }}>
                    <strong>RECEIVED FROM:</strong> {payerName || 'N/A'}
                  </p>
                  <p style={{ fontSize: '11px', marginBottom: '5px' }}>
                    <strong>DATE:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>

                {/* Fund Account Information */}
                {createdTransactions.length > 0 && (
                  <div className="receipt-fund-info">
                    <p className="fund-label">FUND ACCOUNTS:</p>
                    <div className="fund-items-grid">
                      {createdTransactions.map((transaction, index) => (
                        <div key={index} className="fund-item">
                          <span className="fund-name">{transaction.fundAccountName}</span>
                          <span className="fund-amount">₱{parseFloat(transaction.allocatedAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty space for watermark visibility */}
                <div className="receipt-body-spacer"></div>

                {/* Total Amount - Bottom Right */}
                <div className="receipt-total-right">
                  <span className="total-label-bold">TOTAL:</span>
                  <span className="total-amount-bold">PHP{totalAmount.toFixed(2)}</span>
                </div>

                {/* Amount in Words - Bold */}
                <div className="amount-words-bold">
                  {numberToWords(totalAmount)} PESOS ONLY
                </div>

                {/* Description */}
                {receiptDescription && (
                  <div className="receipt-description-box">
                    <p className="description-label-receipt">Description:</p>
                    <p className="description-text-receipt">{receiptDescription}</p>
                  </div>
                )}

                {/* Payment Method Checkboxes */}
                <div className="payment-checkboxes">
                  <label className={modeOfPayment === 'Cash' ? 'checked' : ''}>
                    <input type="checkbox" checked={modeOfPayment === 'Cash'} readOnly />
                    <span>CASH</span>
                  </label>
                  <label className={modeOfPayment === 'Cheque' ? 'checked' : ''}>
                    <input type="checkbox" checked={modeOfPayment === 'Cheque'} readOnly />
                    <span>CHECK</span>
                  </label>
                  <label className={modeOfPayment === 'Bank Transfer' ? 'checked' : ''}>
                    <input type="checkbox" checked={modeOfPayment === 'Bank Transfer'} readOnly />
                    <span>BANK</span>
                  </label>
                </div>

                {/* Acknowledgment with underline */}
                <div className="receipt-acknowledgment-line">
                  Received the amount stated above
                </div>

                {/* Signature Line */}
                <div className="signature-area">
                  <div className="signature-line-bottom"></div>
                  <p className="signature-text">Collecting Officer</p>
                </div>
              </div>
            </div>

            {/* Modal Footer with Actions */}
            <div className="receipt-modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={handlePrintReceipt}
              >
                <i className="fas fa-print"></i>
                Print Receipt
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setShowReceiptModal(false);
                  resetForm();
                }}
              >
                <i className="fas fa-check"></i>
                Done
              </button>
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
