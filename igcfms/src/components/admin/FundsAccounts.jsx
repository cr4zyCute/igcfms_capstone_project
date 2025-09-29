import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { subscribeToFundTransactions } from '../../services/fundTransactionChannel';
import { useFundAccounts, useCreateFundAccount, useUpdateFundAccount, useDeleteFundAccount, FUND_ACCOUNTS_KEYS } from '../../hooks/useFundAccounts';
import { useAccountTransactions } from '../../hooks/useAccountTransactions';
import { useQueryClient } from '@tanstack/react-query';
import { SkeletonSectionHeader, SkeletonAccountGrid, SkeletonTransactionTable } from '../ui/LoadingSkeleton';
import { exportFundAccountsPDF, exportTransactionHistoryPDF } from '../reports/FundsaccountreportGenerator';
import notificationService from "../../services/notificationService";
import balanceService from "../../services/balanceService";
import AccountCard from '../ui/AccountCard';
import QueryErrorFallback from '../common/QueryErrorBoundary';
import "../../assets/admin.css";
import "./css/fundsaccount.css";


const FundsAccounts = () => {
  // UI State
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showEditAccount, setShowEditAccount] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAccountId, setDeletingAccountId] = useState(null);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [showMessagePopup, setShowMessagePopup] = useState(false);
  const [messagePopup, setMessagePopup] = useState({ type: '', message: '' });
  
  // Search and pagination state
  const [accountSearchTerm, setAccountSearchTerm] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionPage, setTransactionPage] = useState(1);
  
  // Filter state
  const [filterBy, setFilterBy] = useState('newest'); // Default filter
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showExportReportDropdown, setShowExportReportDropdown] = useState(false);
  
  // React Query client for manual cache updates
  const queryClient = useQueryClient();
  
  // React Query hooks
  const { 
    data: accountsData, 
    isLoading: accountsLoading, 
    error: accountsError,
    refetch: refetchAccounts 
  } = useFundAccounts({ 
    search: '', // Remove search from API call - do client-side filtering instead
    page: currentPage,
    limit: 20 
  });
  
  const {
    data: transactionsData,
    isLoading: transactionsLoading,
    error: transactionsError
  } = useAccountTransactions(selectedAccount?.id, {
    enabled: !!selectedAccount?.id && showTransactionHistory,
    search: '', // Remove search from API call - do client-side filtering instead
    page: transactionPage,
    limit: 50
  });
  
  // Mutations
  const createAccountMutation = useCreateFundAccount();
  const updateAccountMutation = useUpdateFundAccount();
  const deleteAccountMutation = useDeleteFundAccount();

  // Form state - memoized initial state
  const initialAccountState = useMemo(() => ({
    name: '',
    code: '',
    description: '',
    initial_balance: 0,
    account_type: 'Revenue',
  }), []);
  
  const [newAccount, setNewAccount] = useState(initialAccountState);
  
  const [editAccount, setEditAccount] = useState({});
  const [openMenuId, setOpenMenuId] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showTransactionPreview, setShowTransactionPreview] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  
  // Derived data - memoized to prevent unnecessary re-renders
  const accounts = useMemo(() => accountsData?.data || [], [accountsData?.data]);
  const transactions = useMemo(() => transactionsData?.data || [], [transactionsData?.data]);
  const loading = accountsLoading;
  
  // Memoized filtered and sorted accounts
  const filteredAccounts = useMemo(() => {
    let filtered = accounts;
    
    // Apply search filter
    if (accountSearchTerm) {
      const searchLower = accountSearchTerm.toLowerCase();
      filtered = accounts.filter(account => 
        account.name?.toLowerCase().includes(searchLower) ||
        account.code?.toLowerCase().includes(searchLower) ||
        account.account_type?.toLowerCase().includes(searchLower) ||
        account.department?.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply sorting based on filter
    const sorted = [...filtered].sort((a, b) => {
      switch (filterBy) {
        case 'biggest':
          return (b.current_balance || 0) - (a.current_balance || 0);
        case 'lowest-transactions':
          return (a.transactionCount || 0) - (b.transactionCount || 0);
        case 'highest-transactions':
          return (b.transactionCount || 0) - (a.transactionCount || 0);
        case 'newest':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'oldest':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'account-type':
          return (a.account_type || '').localeCompare(b.account_type || '');
        default:
          return 0;
      }
    });
    
    return sorted;
  }, [accounts, accountSearchTerm, filterBy]);
  
  // Memoized filtered transactions for client-side search
  const filteredTransactions = useMemo(() => {
    if (!searchTerm) return transactions;
    
    const searchLower = searchTerm.toLowerCase();
    return transactions.filter(transaction => 
      transaction.description?.toLowerCase().includes(searchLower) ||
      transaction.payer_name?.toLowerCase().includes(searchLower) ||
      transaction.recipient?.toLowerCase().includes(searchLower) ||
      transaction.type?.toLowerCase().includes(searchLower) ||
      transaction.reference?.toLowerCase().includes(searchLower) ||
      transaction.reference_no?.toLowerCase().includes(searchLower) ||
      transaction.receipt_no?.toLowerCase().includes(searchLower)
    );
  }, [transactions, searchTerm]);
  
  // Calculate global max amount for graphs
  const globalMaxAmount = useMemo(() => {
    if (!accounts.length) return 0;
    return accounts.reduce((max, account) => {
      const accountMax = (account.graphData || []).reduce(
        (accMax, point) => Math.max(accMax, Math.abs(point.amount || 0)),
        0
      );
      return Math.max(max, accountMax);
    }, 0);
  }, [accounts]);

  const openDeleteModal = (accountId) => {
    setDeletingAccountId(accountId);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setDeletingAccountId(null);
    setShowDeleteModal(false);
  };

  const toggleMenu = (e, accountId) => {
    e.stopPropagation();
    setOpenMenuId(prevId => (prevId === accountId ? null : accountId));
  };

  const exportToCSV = (data, filename) => {
    const csvContent = [
      ['Date', 'Description', 'Payee/Payer', 'Type', 'Amount', 'Reference'],
      ...data.map(transaction => [
        new Date(transaction.created_at).toLocaleDateString(),
        transaction.description || '',
        transaction.type === 'Collection'
          ? (transaction.payer_name || transaction.recipient || 'Unknown Payer')
          : (transaction.recipient || transaction.payer_name || 'Unknown Payee'),
        transaction.type || '',
        `${transaction.type === 'Collection' ? '+' : '-'}₱${Math.abs(transaction.amount || 0).toLocaleString()}`,
        transaction.reference || transaction.reference_no || transaction.receipt_no || 'N/A',
      ]),
    ]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const exportToExcel = (data, filename) => {
    const tableHTML = `
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Payee/Payer</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Reference</th>
          </tr>
        </thead>
        <tbody>
          ${data
            .map(
              transaction => `
              <tr>
                <td>${new Date(transaction.created_at).toLocaleDateString()}</td>
                <td>${transaction.description || ''}</td>
                <td>${
                  transaction.type === 'Collection'
                    ? (transaction.payer_name || transaction.recipient || 'Unknown Payer')
                    : (transaction.recipient || transaction.payer_name || 'Unknown Payee')
                }</td>
                <td>${transaction.type || ''}</td>
                <td>${transaction.type === 'Collection' ? '+' : '-'}₱${Math.abs(transaction.amount || 0).toLocaleString()}</td>
                <td>${transaction.reference || transaction.reference_no || transaction.receipt_no || 'N/A'}</td>
              </tr>
            `,
            )
            .join('')}
        </tbody>
      </table>
    `;

    const blob = new Blob([tableHTML], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };


  // Event handlers
  const handleAccountSelect = useCallback((account) => {
    setSelectedAccount(account);
    setShowTransactionHistory(true);
    setTransactionPage(1); // Reset to first page
    setSearchTerm(''); // Reset search term for each account
  }, []);
  
  const handleEditAccount = useCallback((account) => {
    setSelectedAccount(account);
    setShowEditAccount(true);
    setEditAccount({
      ...account,
      initial_balance: account.current_balance
    });
  }, []);
  
  const handleDeleteAccount = useCallback((accountId) => {
    setDeletingAccountId(accountId);
    setShowDeleteModal(true);
  }, []);
  
  const handleMenuToggle = useCallback((accountId) => {
    setOpenMenuId(prevId => (prevId === accountId ? null : accountId));
  }, []);

  const handleTransactionClick = useCallback((transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionPreview(true);
  }, []);

  const formatCurrency = useCallback((value) => {
    const numeric = Number(value) || 0;
    return `₱${numeric.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }, []);
  
  // Simple search handlers for real-time search
  const handleAccountSearchChange = useCallback((e) => {
    setAccountSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  }, []);
  
  const handleTransactionSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
    setTransactionPage(1); // Reset to first page on search
  }, []);
  
  // Filter options
  const filterOptions = [
    { value: 'newest', label: 'Newest Accounts', icon: 'fas fa-clock' },
    { value: 'oldest', label: 'Oldest Accounts', icon: 'fas fa-history' },
    { value: 'biggest', label: 'Biggest Balance', icon: 'fas fa-chart-line' },
    { value: 'highest-transactions', label: 'Most Transactions', icon: 'fas fa-arrow-up' },
    { value: 'lowest-transactions', label: 'Least Transactions', icon: 'fas fa-arrow-down' },
    { value: 'account-type', label: 'By Account Type', icon: 'fas fa-tags' }
  ];
  
  const handleFilterChange = useCallback((newFilter) => {
    setFilterBy(newFilter);
    setShowFilterDropdown(false);
    setCurrentPage(1); // Reset to first page on filter change
  }, []);
  
  const toggleFilterDropdown = useCallback(() => {
    setShowFilterDropdown(prev => !prev);
  }, []);
  
  const toggleExportReportDropdown = useCallback(() => {
    setShowExportReportDropdown(prev => !prev);
  }, []);
  
  // Export handlers
  const handleExportPDF = useCallback(() => {
    exportFundAccountsPDF(filteredAccounts);
    setShowExportReportDropdown(false);
  }, [filteredAccounts]);
  
  const handleExportExcel = useCallback(() => {
    // Create Excel export function
    const exportToExcel = (data, filename) => {
      const csvContent = [
        ['Account Code', 'Account Name', 'Type', 'Current Balance', 'Transactions', 'Status', 'Created Date'],
        ...data.map(account => [
          account.code || 'N/A',
          account.name || 'N/A',
          account.account_type || 'N/A',
          (account.current_balance || 0).toFixed(2),
          account.transactionCount || 0,
          account.is_active !== false ? 'Active' : 'Inactive',
          new Date(account.created_at).toLocaleDateString()
        ])
      ].map(row => row.join(',')).join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
    };
    
    exportToExcel(filteredAccounts, `fund_accounts_${new Date().toISOString().split('T')[0]}.csv`);
    setShowExportReportDropdown(false);
  }, [filteredAccounts]);
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showFilterDropdown && !event.target.closest('.filter-dropdown-container')) {
        setShowFilterDropdown(false);
      }
      if (showExportReportDropdown && !event.target.closest('.export-report-dropdown-container')) {
        setShowExportReportDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilterDropdown, showExportReportDropdown]);

  // Real-time updates via WebSocket/balance service
  useEffect(() => {
    const handleBalanceUpdate = ({ fundAccountId, newBalance, latestTransaction }) => {
      console.log('Real-time balance update:', { fundAccountId, newBalance, latestTransaction });
      
      // Immediately update the accounts cache with new balance
      queryClient.setQueryData(
        FUND_ACCOUNTS_KEYS.list({ page: currentPage, limit: 20, search: '' }),
        (oldData) => {
          if (!oldData?.data) return oldData;
          
          return {
            ...oldData,
            data: oldData.data.map(account => 
              account.id === fundAccountId 
                ? { 
                    ...account, 
                    current_balance: newBalance,
                    // Add new transaction to graph data if available
                    graphData: latestTransaction ? [
                      ...(account.graphData || []).slice(-19), // Keep last 19
                      {
                        date: new Date().toISOString(),
                        balance: newBalance,
                        amount: latestTransaction.amount,
                        type: latestTransaction.type,
                        recipient: latestTransaction.recipient || latestTransaction.payee_name || null,
                        payer_name: latestTransaction.payer_name || null,
                        payee_name: latestTransaction.payee_name || latestTransaction.recipient || null,
                        description: latestTransaction.description || '',
                        reference: latestTransaction.reference || latestTransaction.reference_no || '',
                      }
                    ] : account.graphData
                  }
                : account
            )
          };
        }
      );
      
      // If viewing transactions for this account, invalidate to get fresh data
      if (selectedAccount?.id === fundAccountId && showTransactionHistory) {
        queryClient.invalidateQueries({ 
          queryKey: FUND_ACCOUNTS_KEYS.transactions(fundAccountId) 
        });
      }
    };

    balanceService.addBalanceListener(handleBalanceUpdate);

    return () => {
      balanceService.removeBalanceListener(handleBalanceUpdate);
    };
  }, [queryClient, currentPage, selectedAccount?.id, showTransactionHistory]);

  // Function to show popup messages
  const showPopupMessage = (type, message) => {
    setMessagePopup({ type, message });
    setShowMessagePopup(true);
    // Auto hide after 3 seconds
    setTimeout(() => {
      setShowMessagePopup(false);
    }, 3000);
  };

  // Extract a readable error message from API errors
  const extractErrorMessage = (err) => {
    const fallback = "Request failed. Please try again.";
    if (!err) return fallback;
    const data = err.response?.data;
    if (typeof data === 'string') return data;
    if (data?.message) return data.message;
    if (data?.errors) {
      const firstKey = Object.keys(data.errors)[0];
      if (firstKey && Array.isArray(data.errors[firstKey]) && data.errors[firstKey].length) {
        return data.errors[firstKey][0];
      }
    }
    return err.message || fallback;
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();

    try {
      // Basic client-side validation
      if (!newAccount.name?.trim()) {
        throw new Error('Account name is required');
      }
      if (!newAccount.account_type) {
        throw new Error('Account type is required');
      }
      const ib = Number(newAccount.initial_balance);
      if (Number.isNaN(ib) || ib < 0) {
        throw new Error('Initial balance must be a non-negative number');
      }

      const createdAccount = await createAccountMutation.mutateAsync({
        ...newAccount,
        initial_balance: Number(newAccount.initial_balance) || 0,
      });
      
      // Send notification for new fund account (don't await to speed up)
      notificationService.notifyTransaction('FUND_ACCOUNT_CREATED', {
        name: newAccount.name,
        balance: newAccount.initial_balance,
        fund_account_id: createdAccount.id || createdAccount.data?.id
      }).catch(console.error);
      
      // Show success message immediately
      showPopupMessage("success", "Fund account created successfully!");
      setNewAccount(initialAccountState);
      setShowAddAccount(false);
    } catch (err) {
      const msg = extractErrorMessage(err);
      showPopupMessage("error", msg || "Failed to create fund account. Please try again.");
      console.error("Error creating account:", err.response?.data || err);
    }
  };


  const handleEditAccountSubmit = async (e) => {
    e.preventDefault();

    try {
      // Client-side checks
      if (!editAccount.name?.trim()) {
        throw new Error('Account name is required');
      }
      if (!editAccount.code?.trim()) {
        throw new Error('Account code is required');
      }
      if (!editAccount.account_type) {
        throw new Error('Account type is required');
      }
      const ib = Number(editAccount.initial_balance);
      if (Number.isNaN(ib) || ib < 0) {
        throw new Error('Initial balance must be a non-negative number');
      }

      const updatedAccount = await updateAccountMutation.mutateAsync({
        id: editAccount.id,
        data: {
          name: editAccount.name,
          code: editAccount.code,
          description: editAccount.description,
          initial_balance: Number(editAccount.initial_balance),
          account_type: editAccount.account_type,
        }
      });
      
      // Update the selected account with new data for real-time display
      if (selectedAccount && selectedAccount.id === editAccount.id) {
        setSelectedAccount({
          ...selectedAccount,
          ...editAccount,
          initial_balance: Number(editAccount.initial_balance),
        });
      }
      
      // Show success message immediately
      showPopupMessage("success", "Fund account updated successfully!");
      setShowEditAccount(false);
    } catch (err) {
      const msg = extractErrorMessage(err);
      showPopupMessage("error", msg || "Failed to update fund account. Please try again.");
      console.error("Error updating account:", err);
    }
  };

  const handleDeleteAccountConfirm = async () => {
    if (!deletingAccountId) return;
    
    try {
      const response = await deleteAccountMutation.mutateAsync(deletingAccountId);
      
      // Show success message immediately
      showPopupMessage("success", response.message || "Fund account successfully deleted!");
      
      // Deselect if it was selected
      if (selectedAccount?.id === deletingAccountId) {
        setSelectedAccount(null);
        setShowTransactionHistory(false);
      }
      
      closeDeleteModal();
    } catch (err) {
      showPopupMessage("error", "Failed to delete fund account. Please try again.");
      console.error("Error deleting account:", err.response?.data || err);
    }
  };
  // Error handling
  if (accountsError) {
    return (
      <ErrorBoundary FallbackComponent={QueryErrorFallback}>
        <QueryErrorFallback 
          error={accountsError} 
          resetErrorBoundary={() => refetchAccounts()} 
        />
      </ErrorBoundary>
    );
  }

  if (loading) {
    return (
      <div className="funds-accounts">
        <SkeletonSectionHeader />
        <SkeletonAccountGrid />
      </div>
    );
  }

  return (
    <ErrorBoundary FallbackComponent={QueryErrorFallback}>
      <div className="funds-accounts">
      <div className="section-header">
        <div className="section-title-group">
          <h3>
            <i className="fas fa-university"></i>
            Fund Accounts Management
            <span className="section-count">({accounts.length})</span>
          </h3>
        </div>
        <div className="header-controls">
          <div className="search-filter-container">
            <div className="account-search-container">
              <input
                type="text"
                placeholder="Search accounts..."
                value={accountSearchTerm}
                onChange={handleAccountSearchChange}
                className="account-search-input"
              />
              <i className="fas fa-search account-search-icon"></i>
            </div>
            
            <div className="filter-dropdown-container">
              <button
                className="filter-dropdown-btn"
                onClick={toggleFilterDropdown}
                title="Filter accounts"
              >
                <i className="fas fa-filter"></i>
                <span className="filter-label">
                  {filterOptions.find(opt => opt.value === filterBy)?.label || 'Filter'}
                </span>
                <i className={`fas fa-chevron-${showFilterDropdown ? 'up' : 'down'} filter-arrow`}></i>
              </button>
              
              {showFilterDropdown && (
                <div className="filter-dropdown-menu">
                  {filterOptions.map((option) => (
                    <button
                      key={option.value}
                      className={`filter-option ${filterBy === option.value ? 'active' : ''}`}
                      onClick={() => handleFilterChange(option.value)}
                    >
                      <i className={option.icon}></i>
                      <span>{option.label}</span>
                      {filterBy === option.value && <i className="fas fa-check filter-check"></i>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="action-buttons">
            <div className="export-report-dropdown-container">
              <button
                className="btn-icon export-report-btn"
                onClick={toggleExportReportDropdown}
                disabled={loading || filteredAccounts.length === 0}
                title="Export Reports"
              >   
                <i className="fas fa-download"></i>
              </button>
              
              {showExportReportDropdown && (
                <div className="export-report-dropdown-menu">
                  <button
                    className="export-option"
                    onClick={handleExportPDF}
                  >
                    <i className="fas fa-file-pdf"></i>
                    <span>Export as PDF</span>
                  </button>
                  <button
                    className="export-option"
                    onClick={handleExportExcel}
                  >
                    <i className="fas fa-file-excel"></i>
                    <span>Export as Excel</span>
                  </button>
                </div>
              )}
            </div>
            
            <button
              className="btn-modern add-account-btn"
              onClick={() => setShowAddAccount(true)}
              disabled={loading}
            >   
              <i className="fas fa-plus"></i>
              Add New Account
            </button>
          </div>
        </div>
      </div>

      {showAddAccount && (
        <div className="modal-overlay" onClick={() => setShowAddAccount(false)}>
          <div className="modal wide create-account-modal" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="modal-header modal-header-black">
              <h4><i className="fas fa-plus-circle"></i> Create New Fund Account</h4>
              <button 
                type="button" 
                onClick={() => setShowAddAccount(false)}
                className="close-button"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddAccount} className="enhanced-form">
              {/* Account Information Section */}
              <div className="form-section">
                <div className="section-header">
                  <h5><i className="fas fa-info-circle"></i> Account Information</h5>
                </div>
                
                {/* Two Column Layout: Account Name | Account Code */}
                <div className="form-row">
                  <div className="form-group">
                    <label>Account Name</label>
                    <input
                      type="text"
                      value={newAccount.name}
                      onChange={(e) =>
                        setNewAccount({ ...newAccount, name: e.target.value })
                      }
                      placeholder="Enter account name"
                      required
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Account Code</label>
                    <input
                      type="text"
                      value="Auto-generated"
                      disabled
                      className="auto-generated-field"
                    />
                  </div>
                </div>

                {/* Two Column Layout: Account Type | Initial Balance */}
                <div className="form-row">
                  <div className="form-group">
                    <label>Account Type</label>
                    <select
                      value={newAccount.account_type}
                      onChange={(e) => setNewAccount({ ...newAccount, account_type: e.target.value })}
                      disabled={loading}
                      required
                    >
                      <option value="">Select Type</option>
                      <option value="Revenue">Revenue</option>
                      <option value="Expense">Expense</option>
                      <option value="Asset">Asset</option>
                      <option value="Liability">Liability</option>
                      <option value="Equity">Equity</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Initial Balance</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newAccount.initial_balance}
                      onChange={(e) => {
                        const value = e.target.value;
                        setNewAccount({
                          ...newAccount,
                          initial_balance: value === "" ? "" : parseFloat(value),
                        });
                      }}
                      placeholder="0.00"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Description Section - Compact */}
              <div className="form-section compact">
                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea
                    value={newAccount.description}
                    onChange={(e) =>
                      setNewAccount({
                        ...newAccount,
                        description: e.target.value,
                      })
                    }
                    placeholder="Enter a detailed description of this account's purpose"
                    disabled={loading}
                    rows="1"
                  />
                </div>
              </div>

              {/* Actions Section */}
              <div className="form-actions enhanced-actions">
                <button
                  type="button"
                  onClick={() => setShowAddAccount(false)}
                  disabled={loading}
                  className="btn-cancel"
                >
                  <i className="fas fa-times"></i>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={createAccountMutation.isPending}
                  className="btn-create"
                >
                  {createAccountMutation.isPending ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Creating...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-plus"></i>
                      Create Account
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditAccount && (
        <div className="modal-overlay" onClick={() => setShowEditAccount(false)}>
          <div className="modal edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="edit-modal-header">
              <div className="edit-modal-title">
                <span className="icon-badge">
                
                <i className="fas fa-university"></i>
                </span>
                <div>
                  <h4>Update Fund Account</h4>
                  <p>
                    {editAccount.code ? `Code: ${editAccount.code}` : 'Edit the account configuration and description.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditAccount(false)}
                className="close-button"
                aria-label="Close edit fund account modal"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleEditAccountSubmit} className="edit-modal-form">
              <div className="edit-modal-body">
                <div className="edit-form-grid">
                  <div className="form-card">
                    <div className="form-card-header">
                      <h5><i className="fas fa-info-circle"></i> Account Details</h5>
                      <span className="badge subtle">Required fields</span>
                    </div>

                    <div className="form-row tight">
                      <div className="form-group">
                        <label>Account Name</label>
                        <input
                          type="text"
                          value={editAccount.name}
                          onChange={(e) =>
                            setEditAccount({ ...editAccount, name: e.target.value })
                          }
                          required
                          disabled={loading}
                        />
                       
                      </div>
                      <div className="form-group">
                        <label>Account Type</label>
                        <select
                          value={editAccount.account_type || ''}
                          onChange={(e) => setEditAccount({ ...editAccount, account_type: e.target.value })}
                          disabled={loading}
                          required
                        >
                          <option value="">Select Type</option>
                          <option value="Revenue">Revenue</option>
                          <option value="Expense">Expense</option>
                          <option value="Asset">Asset</option>
                          <option value="Liability">Liability</option>
                          <option value="Equity">Equity</option>
                        </select>
                      
                      </div>
                    </div>

                    <div className="form-row tight">
                      <div className="form-group">
                        <label>Account Code</label>
                        <input
                          type="text"
                          value={editAccount.code}
                          readOnly
                          className="readonly-field"
                          required
                          disabled
                        />
                      </div>
                      <div className="form-group">
                        <label>Current Balance</label>
                        <input
                          type="text"
                          value={formatCurrency(editAccount.initial_balance)}
                          readOnly
                          disabled
                          className="readonly-field"
                        />
                       
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Description</label>
                      <textarea
                        value={editAccount.description || ''}
                        onChange={(e) =>
                          setEditAccount({
                            ...editAccount,
                            description: e.target.value,
                          })
                        }
                        disabled={loading}
                        rows={3}
                        placeholder="Describe how this fund account is used."
                      />
                    </div>

                    <div className="form-actions-inline">
                      <button
                        type="submit"
                        className="btn-primary filled"
                        disabled={updateAccountMutation.isPending}
                      >
                        {updateAccountMutation.isPending ? (
                          <>
                            <i className="fas fa-spinner fa-spin"></i>
                            Updating...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-save"></i>
                            Update Account
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="summary-card">
                    <div className="summary-header">
                      <h5>Account Snapshot</h5>
                      <span className={`status-chip ${editAccount.is_active === false ? 'status-inactive' : 'status-active'}`}>
                        <i className={`fas ${editAccount.is_active === false ? 'fa-pause-circle' : 'fa-bolt'}`}></i>
                        {editAccount.is_active === false ? 'Inactive' : 'Active'}
                      </span>
                    </div>
                    <ul className="summary-list">
                      <li>
                        <span>Fund Name</span>
                        <p>{editAccount.name || '—'}</p>
                      </li>
                      <li>
                        <span>Current Balance</span>
                        <p>{formatCurrency(editAccount.current_balance ?? editAccount.initial_balance)}</p>
                      </li>
                      <li>
                        <span>Created</span>
                        <p>{editAccount.created_at ? new Date(editAccount.created_at).toLocaleString() : '—'}</p>
                      </li>
                      <li>
                        <span>Last Updated</span>
                        <p>{editAccount.updated_at ? new Date(editAccount.updated_at).toLocaleString() : '—'}</p>
                      </li>
                    </ul>

                    <div className="summary-cta">
                      <i className="fas fa-shield-alt"></i>
                      <p>Changes are logged for audit and instantly visible to other modules.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="edit-modal-footer">
                
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4><i className="fas fa-exclamation-triangle"></i> Confirm Deletion</h4>
              <button onClick={closeDeleteModal} className="close-button">×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this fund account? This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button 
                onClick={closeDeleteModal} 
                className="btn btn-secondary"
                disabled={deleteAccountMutation.isPending}
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteAccountConfirm}
                disabled={deleteAccountMutation.isPending}
                className="btn btn-danger"
              >
                {deleteAccountMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Deleting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-trash"></i>
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="accounts-overview">
        <>
          <h4 className="sr-only">Fund Accounts List</h4>
              {accountSearchTerm && (
                <div className="search-results-info">
                  <i className="fas fa-search"></i>
                  Showing {filteredAccounts.length} of {accounts.length} accounts for "{accountSearchTerm}"
                  {filteredAccounts.length === 0 && (
                    <button 
                      onClick={() => setAccountSearchTerm('')}
                      className="clear-search-btn"
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              )}
              <div className="account-cards">
                {filteredAccounts.length > 0 ? (
                  filteredAccounts.map((account) => (
                    <AccountCard
                      key={account.id}
                      account={account}
                      onEdit={handleEditAccount}
                      onDelete={handleDeleteAccount}
                      onViewTransactions={handleAccountSelect}
                      openMenuId={openMenuId}
                      onToggleMenu={handleMenuToggle}
                      globalMaxAmount={globalMaxAmount}
                    />
                  ))
                ) : (
                  <div className="empty-state">
                    <h4>No Matching Accounts Found</h4>
                    <p>No accounts match your search criteria. Try adjusting your search terms.</p>
                  </div>
                )}
              </div>
        </>
        
        {accounts.length === 0 && (
          <div className="empty-state">
            <h4>No Fund Accounts Found</h4>
            <p>Create your first fund account to get started with financial management.</p>
          </div>
        )}
      </div>

      {/* Transaction History Popup */}
      {showTransactionHistory && selectedAccount && (
        <div className="modal-overlay" onClick={() => setShowTransactionHistory(false)}>
          <div className="modal transaction-modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="transaction-modal-header-improved">
              <h4 className="transaction-modal-title-improved">
                <i className="fas fa-history"></i> 
                Transaction History: {selectedAccount.name}
              </h4>
              <div className="transaction-modal-controls">
                <div className="transaction-search-improved">
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={handleTransactionSearchChange}
                    className="transaction-search-input-improved"
                  />
                  <i className="fas fa-search transaction-search-icon-improved"></i>
                </div>
                
                <div className="export-dropdown-improved">
                  <button
                    onClick={() => setShowExportDropdown(!showExportDropdown)}
                    className="export-btn-improved"
                  >
                    <i className="fas fa-download"></i>
                    Export
                    <i className={`fas fa-chevron-${showExportDropdown ? 'up' : 'down'}`}></i>
                  </button>
                  
                  <div className={`export-dropdown-menu-improved ${showExportDropdown ? 'show' : ''}`}>
                    <button
                      onClick={() => {
                        exportTransactionHistoryPDF(filteredTransactions, selectedAccount.name);
                        setShowExportDropdown(false);
                      }}
                      className="export-option-improved"
                    >
                      <i className="fas fa-file-pdf export-pdf-icon-improved"></i>
                      Export as PDF
                    </button>
                    <button
                      onClick={() => {
                        exportToCSV(filteredTransactions, `${selectedAccount.name}_transactions.csv`);
                        setShowExportDropdown(false);
                      }}
                      className="export-option-improved"
                    >
                      <i className="fas fa-file-csv export-csv-icon-improved"></i>
                      Export as CSV
                    </button>
                    <button
                      onClick={() => {
                        exportToExcel(filteredTransactions, `${selectedAccount.name}_transactions.xlsx`);
                        setShowExportDropdown(false);
                      }}
                      className="export-option-improved"
                    >
                      <i className="fas fa-file-excel export-excel-icon-improved"></i>
                      Export as Excel
                    </button>
                  </div>
                </div>
                <div className="account-info-item-improved">
                {/* <button 
                  className="btn btn-secondary refresh-btn-styled"
                  onClick={() => {
                    // Invalidate and refetch transaction data for the selected account
                    queryClient.invalidateQueries({ 
                      queryKey: FUND_ACCOUNTS_KEYS.transactions(selectedAccount.id) 
                    });
                  }}
                  disabled={transactionsLoading}
                >
                  <i className="fas fa-sync-alt"></i> Refresh
                </button> */}
              </div>
                
                <button 
                  onClick={() => setShowTransactionHistory(false)}
                  className="close-btn-styled"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="account-info-section-improved">
              <div className="account-info-item-improved">
                <div className="account-info-label-improved">Account Code</div>
                <div className="account-code-value-improved">{selectedAccount.code}</div>
              </div>
              <div className="account-info-item-improved">
                <div className="account-info-label-improved">Current Balance</div>
                <div className="account-balance-value-improved">₱{selectedAccount.current_balance?.toLocaleString() || "0.00"}</div>
              </div>

            </div>


            
            {transactionsLoading ? (
              <SkeletonTransactionTable />
            ) : (() => {
              // Filter transactions based on search term
              const filteredTransactions = transactions.filter(transaction => {
                if (!searchTerm) return true;
                
                const searchLower = searchTerm.toLowerCase();
                return (
                  transaction.description?.toLowerCase().includes(searchLower) ||
                  transaction.type?.toLowerCase().includes(searchLower) ||
                  transaction.recipient?.toLowerCase().includes(searchLower) ||
                  transaction.payer_name?.toLowerCase().includes(searchLower) ||
                  String(transaction.reference ?? '').toLowerCase().includes(searchLower) ||
                  String(transaction.reference_no ?? '').toLowerCase().includes(searchLower) ||
                  String(transaction.receipt_no ?? '').toLowerCase().includes(searchLower) ||
                  transaction.amount?.toString().includes(searchTerm) ||
                  new Date(transaction.created_at).toLocaleDateString().includes(searchTerm)
                );
              });
              
              return filteredTransactions.length > 0 ? (
                <div className="transaction-history-table-container">
                  <table className="transaction-history-table">
                    <thead>
                      <tr>
                        <th><i className="fas fa-calendar"></i> Date</th>
                        <th><i className="fas fa-file-text"></i> Description</th>
                        <th><i className="fas fa-user"></i> Payee/Payer</th>
                        <th><i className="fas fa-exchange-alt"></i> Type</th>
                        <th><i className="fas fa-money-bill"></i> Amount</th>
                        <th><i className="fas fa-hashtag"></i> Reference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map((transaction, index) => (
                        <tr 
                          key={transaction.id}
                          onClick={() => handleTransactionClick(transaction)}
                        >
                          <td className="transaction-date-cell">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </td>
                          
                          <td className="transaction-description-cell">
                            {transaction.description}
                          </td>
                          
                          <td className={`transaction-payee-cell ${transaction.type?.toLowerCase()}`}>
                            {transaction.type === "Collection" 
                              ? (transaction.payer_name || transaction.recipient || 'Unknown Payer')
                              : (transaction.recipient || transaction.payer_name || 'Unknown Payee')
                            }
                          </td>
                          
                          <td className="transaction-type-cell">
                            <span className={`transaction-type-badge-table ${transaction.type?.toLowerCase()}`}>
                              {transaction.type === "Collection" && <i className="fas fa-arrow-up"></i>}
                              {transaction.type === "Disbursement" && <i className="fas fa-arrow-down"></i>}
                              {transaction.type}
                            </span>
                          </td>
                          
                          <td className={`transaction-amount-cell ${transaction.type?.toLowerCase()}`}>
                            {transaction.type === "Collection" ? "+" : "-"}₱{Math.abs(transaction.amount || 0).toLocaleString()}
                          </td>
                          
                          <td className="transaction-reference-cell">
                            {transaction.reference ||
                             transaction.reference_no ||
                             transaction.receipt_no ||
                             'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="transaction-empty-state-improved">
                  <i className={`fas ${searchTerm ? 'fa-search' : 'fa-inbox'} transaction-empty-icon-improved`}></i>
                  <h4 className="transaction-empty-title-improved">
                    {searchTerm ? 'No Matching Transactions' : 'No Transactions Found'}
                  </h4>
                  <p className="transaction-empty-text-improved">
                    {searchTerm ? `No transactions match "${searchTerm}"` : 'This account has no transaction history yet.'}
                  </p>
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm('')}
                      className="transaction-clear-search-btn-improved"
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Message Popup */}
      {showMessagePopup && (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
          <div 
            className="modal" 
            style={{ 
              maxWidth: '400px', 
              textAlign: 'center',
              animation: 'slideIn 0.3s ease'
            }}
          >
            <div style={{ marginBottom: '20px' }}>
              {messagePopup.type === 'success' ? (
                <div style={{ fontSize: '48px', color: '#16a34a', marginBottom: '15px' }}>
                  <i className="fas fa-check-circle"></i>
                </div>
              ) : (
                <div style={{ fontSize: '48px', color: '#dc2626', marginBottom: '15px' }}>
                  <i className="fas fa-exclamation-circle"></i>
                </div>
              )}
              <h4 style={{ 
                color: messagePopup.type === 'success' ? '#16a34a' : '#dc2626',
                marginBottom: '10px'
              }}>
                {messagePopup.type === 'success' ? 'Success!' : 'Error!'}
              </h4>
              <p style={{ color: '#333333', fontSize: '16px', lineHeight: '1.5' }}>
                {messagePopup.message}
              </p>
            </div>
            <button 
              className="btn btn-primary"
              onClick={() => setShowMessagePopup(false)}
              style={{ minWidth: '100px' }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Transaction Preview Modal */}
      {showTransactionPreview && selectedTransaction && (
        <div className="modal-overlay" onClick={() => setShowTransactionPreview(false)} style={{ zIndex: 2001 }}>
          <div 
            className="transaction-preview-modal-wide" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="transaction-preview-header">
              <h3 className="transaction-preview-title">
                <i className="fas fa-receipt" style={{ color: '#6b7280' }}></i>
                Transaction Details
              </h3>
              <button 
                onClick={() => setShowTransactionPreview(false)}
                className="transaction-preview-close-btn"
              >
                ×
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="transaction-preview-body">
              {/* Left Section - Basic Info */}
              <div className="transaction-preview-section">
                <h4 className="transaction-preview-section-title">
                  <i className="fas fa-info-circle"></i>
                  Basic Information
                </h4>
                
                <div className="transaction-preview-field">
                  <span className="transaction-preview-label">Transaction Type</span>
                  <span className={`transaction-preview-type-badge ${selectedTransaction.type?.toLowerCase()}`}>
                    {selectedTransaction.type === "Collection" && <i className="fas fa-arrow-up"></i>}
                    {selectedTransaction.type === "Disbursement" && <i className="fas fa-arrow-down"></i>}
                    {selectedTransaction.type}
                  </span>
                </div>
                
                <div className="transaction-preview-field">
                  <span className="transaction-preview-label">Date</span>
                  <span className="transaction-preview-value">
                    {new Date(selectedTransaction.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                
                <div className="transaction-preview-field">
                  <span className="transaction-preview-label">Description</span>
                  <span className="transaction-preview-value">{selectedTransaction.description}</span>
                </div>
                
                <div className="transaction-preview-field">
                  <span className="transaction-preview-label">Amount</span>
                  <span className={`transaction-preview-value transaction-preview-amount ${selectedTransaction.type?.toLowerCase()}`}>
                    {selectedTransaction.type === "Collection" ? "+" : "-"}₱{Math.abs(selectedTransaction.amount || 0).toLocaleString()}
                  </span>
                </div>
              </div>
              
              {/* Right Section - Party & Reference Info */}
              <div className="transaction-preview-section">
                <h4 className="transaction-preview-section-title">
                  <i className="fas fa-users"></i>
                  Party & Reference Details
                </h4>
                
                <div className="transaction-preview-field">
                  <span className="transaction-preview-label">
                    {selectedTransaction.type === "Collection" ? "Payer" : "Payee"}
                  </span>
                  <span className="transaction-preview-value">
                    {selectedTransaction.type === "Collection" 
                      ? (selectedTransaction.payer_name || selectedTransaction.recipient || 'Unknown Payer')
                      : (selectedTransaction.recipient || selectedTransaction.payer_name || 'Unknown Payee')
                    }
                  </span>
                </div>
                
                <div className="transaction-preview-field">
                  <span className="transaction-preview-label">Reference</span>
                  <span className="transaction-preview-value">
                    {selectedTransaction.reference || 'N/A'}
                  </span>
                </div>
                
                <div className="transaction-preview-field">
                  <span className="transaction-preview-label">Reference No.</span>
                  <span className="transaction-preview-value">
                    {selectedTransaction.reference_no || 'N/A'}
                  </span>
                </div>
                
                <div className="transaction-preview-field">
                  <span className="transaction-preview-label">Receipt No.</span>
                  <span className="transaction-preview-value">
                    {selectedTransaction.receipt_no || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="transaction-preview-footer">
              <button
                onClick={() => setShowTransactionPreview(false)}
                className="transaction-preview-close-footer-btn"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </ErrorBoundary>
  );
};

export default memo(FundsAccounts);
