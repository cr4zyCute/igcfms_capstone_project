import React, { useState, useEffect, useMemo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useQueryClient } from '@tanstack/react-query';
import { 
  useRecipientAccounts, 
  useCreateRecipientAccount, 
  useUpdateRecipientAccount, 
  useDeleteRecipientAccount, 
  useToggleRecipientStatus,
  useRecipientTransactions,
  RECIPIENT_ACCOUNTS_KEYS 
} from '../../hooks/useRecipientAccounts';
import { SkeletonSectionHeader, SkeletonRecipientGrid, SkeletonTransactionTable } from '../ui/LoadingSkeleton';
import QueryErrorFallback from '../common/QueryErrorBoundary';
import "../../assets/admin.css";
import "./css/recipientaccount.css";
import notificationService from "../../services/notificationService";
import balanceService from "../../services/balanceService";
import Deletion from '../common/Deletion';

const RecipientAccount = () => {
  // State for fund accounts
  const [fundAccounts, setFundAccounts] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFundAccountModal, setShowFundAccountModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingRecipient, setDeletingRecipient] = useState(null);
  const [editingRecipient, setEditingRecipient] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationType, setNotificationType] = useState("success");
  const [fundAccountSearch, setFundAccountSearch] = useState("");
  
  // React Query client for manual cache updates
  const queryClient = useQueryClient();
  
  // React Query hooks
  const { 
    data: recipients = [], 
    isLoading: recipientsLoading, 
    error: recipientsError
  } = useRecipientAccounts();

  // React Query mutations
  const createRecipientMutation = useCreateRecipientAccount();
  const updateRecipientMutation = useUpdateRecipientAccount();
  const deleteRecipientMutation = useDeleteRecipientAccount();
  const toggleStatusMutation = useToggleRecipientStatus();

  // Generate fund code helper function
  const generateFundCode = (accountType, fundAccount = null) => {
    const prefixes = {
      'disbursement': 'DB',
      'collection': 'CL',
      'vendor': 'VD',
      'employee': 'EM',
      'contractor': 'CT',
      'supplier': 'SP'
    };
    
    const prefix = prefixes[accountType.toLowerCase()] || 'GF';
    const timestamp = Date.now().toString().slice(-4);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    
    if (fundAccount) {
      return `${prefix}-${fundAccount.code}-${timestamp}`;
    }
    
    return `${prefix}-${timestamp}${random}`;
  };

  const defaultAccountType = "disbursement";

  const getInitialFormData = () => ({
    name: "",
    type: defaultAccountType,
    fund_account_id: "",
    fund_code: generateFundCode(defaultAccountType),
    contact_person: "",
    email: "",
    phone: "",
    id_number: "",
    address: "",
    bank_name: "",
    account_number: "",
    branch: "",
    description: "",
    status: "active"
  });

  // Form data state
  const [formData, setFormData] = useState(getInitialFormData);
  
  // Additional states
  const [notification, setNotification] = useState({
    type: "success",
    title: "",
    message: ""
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Combined loading state for all operations
  const isLoading = loading || recipientsLoading || createRecipientMutation.isPending || 
                   updateRecipientMutation.isPending || deleteRecipientMutation.isPending || 
                   toggleStatusMutation.isPending;

  const selectedFundAccountDetails = useMemo(() => {
    if (!formData.fund_account_id) return null;
    return fundAccounts.find(
      (fund) => parseInt(formData.fund_account_id) === parseInt(fund.id)
    ) || null;
  }, [formData.fund_account_id, fundAccounts]);

  const filteredFundAccounts = useMemo(() => {
    const term = fundAccountSearch.trim().toLowerCase();
    if (!term) return fundAccounts;
    return fundAccounts.filter((fund) => {
      const nameMatch = fund.name?.toLowerCase().includes(term);
      const codeMatch = fund.code?.toLowerCase().includes(term);
      const typeMatch = fund.account_type?.toLowerCase().includes(term);
      return nameMatch || codeMatch || typeMatch;
    });
  }, [fundAccounts, fundAccountSearch]);
  
  // Transaction query for selected recipient (transaction history modal)
  const {
    data: transactions = [],
    isLoading: transactionsLoading,
    error: transactionsError
  } = useRecipientTransactions(selectedRecipient?.id, {
    enabled: !!selectedRecipient && showTransactionHistory
  });

  // Transaction query for deleting recipient (to get count for delete modal)
  const {
    data: deletingRecipientTransactions = [],
    isLoading: deletingTransactionsLoading
  } = useRecipientTransactions(deletingRecipient?.id, {
    enabled: !!deletingRecipient && showDeleteModal
  });

  // Load fund accounts on component mount
  useEffect(() => {
    loadFundAccounts();
  }, []);

  // API Functions

  const loadFundAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Loading fund accounts...'); // Debug log
      
      // Use the working fund-accounts endpoint directly
      const response = await fetch('/api/fund-accounts', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', response.status); // Debug log
      
      if (!response.ok) {
        console.error('Failed to load fund accounts:', response.status, response.statusText);
        setFundAccounts([]);
        return;
      }
      
      const data = await response.json();
      console.log('Fund accounts response:', data); // Debug log
      
      // Handle different response formats
      if (Array.isArray(data)) {
        setFundAccounts(data);
        console.log('Fund accounts loaded:', data.length, 'accounts'); // Debug log
      } else if (data.success && data.data) {
        setFundAccounts(data.data);
        console.log('Fund accounts loaded:', data.data.length, 'accounts'); // Debug log
      } else if (data.data && Array.isArray(data.data)) {
        setFundAccounts(data.data);
        console.log('Fund accounts loaded:', data.data.length, 'accounts'); // Debug log
      } else {
        console.error('Unexpected fund accounts response format:', data);
        setFundAccounts([]);
      }
    } catch (error) {
      console.error('Error loading fund accounts:', error);
      // Fallback: Add sample fund accounts for testing
      const sampleFundAccounts = [
        {
          id: 1,
          name: "General Fund",
          code: "REV001",
          current_balance: 50000,
          account_type: "Revenue",
          department: "Finance"
        },
        {
          id: 2,
          name: "Special Education Fund",
          code: "REV002", 
          current_balance: 25000,
          account_type: "Revenue",
          department: "Education"
        },
        {
          id: 3,
          name: "Infrastructure Fund",
          code: "EXP001",
          current_balance: 75000,
          account_type: "Expense",
          department: "Public Works"
        }
      ];
      console.log('Using sample fund accounts for testing');
      setFundAccounts(sampleFundAccounts);
    }
  };

  // Handle fund account selection and auto-fill
  const handleFundAccountSelect = (fundAccountId) => {
    const selectedFund = fundAccounts.find(
      (fund) => parseInt(fund.id, 10) === parseInt(fundAccountId, 10)
    );

    setFormData((prev) => {
      const updates = {
        ...prev,
        fund_account_id: fundAccountId
      };

      if (selectedFund) {
        updates.fund_code = generateFundCode(prev.type, selectedFund);
        if (!prev.name) {
          const autoName = `${selectedFund.name} Account`;
          updates.name = autoName;
          updates.contact_person = autoName;
        } else if (prev.name === prev.contact_person) {
          updates.contact_person = prev.name;
        }
        if (!prev.description) {
          updates.description = `Account linked to ${selectedFund.name} (${selectedFund.account_type})`;
        }
      }

      return updates;
    });

    setErrors((prev) => ({
      ...prev,
      fund_account_id: undefined
    }));

    setShowFundAccountModal(false);
  };

  // Handle account type change
  const handleAccountTypeChange = (type) => {
    // Map new account types to existing backend types - removed collection type
    const typeMapping = {
      'vendor': 'disbursement',
      'employee': 'disbursement',
      'contractor': 'disbursement',
      'supplier': 'disbursement'
    };
    
    const backendType = typeMapping[type] || 'disbursement';
    const newFundCode = generateFundCode(backendType);
    
    setFormData(prev => ({
      ...prev,
      type: backendType,
      fund_code: newFundCode,
      // Reset fund account selection when type changes
      fund_account_id: "",
      name: "",
      contact_person: ""
    }));
  };

  // Utility Functions
  const showPopupMessage = (type, title, message) => {
    setNotification({ type, title, message });
    setShowNotification(true);
  };

  const resetForm = () => {
    setFormData(getInitialFormData());
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Required fields
    if (!formData.name.trim()) newErrors.name = "Account name is required";
    if (!formData.email.trim()) newErrors.email = "Email address is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!formData.address.trim()) newErrors.address = "Address is required";
    
    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    // Phone validation (basic)
    if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }
    
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // CRUD Operations
  const handleAddRecipient = async (e) => {
    e.preventDefault();
    
    // Enhanced validation
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Account name is required';
    if (!formData.email.trim()) newErrors.email = 'Email address is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    
    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Phone validation (basic)
    if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showPopupMessage('error', 'Validation Error', 'Please fill in all required fields correctly');
      return;
    }
    
    try {
      // Prepare data for API
      const apiData = {
        name: formData.name.trim(),
        type: formData.type || defaultAccountType,
        contact_person: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        id_number: formData.id_number?.trim() || null,
        address: formData.address.trim(),
        description: formData.description?.trim() || null,
        status: 'active',
        fund_account_id: formData.fund_account_id || null,
        fund_code: formData.fund_code || null,
        bank_name: formData.bank_name?.trim() || null,
        account_number: formData.account_number?.trim() || null,
        account_type: formData.account_type || null,
        branch: formData.branch?.trim() || null
      };
      
      console.log('Creating recipient account with data:', apiData);
      
      // Use React Query mutation
      await createRecipientMutation.mutateAsync(apiData);
      
      // Send notification for new recipient account
      try {
        await notificationService.notifyTransaction('RECIPIENT_ACCOUNT_CREATED', {
          name: formData.name,
          fund_account: formData.fund_account_id ? `Fund Account #${formData.fund_account_id}` : null,
          fund_account_id: formData.fund_account_id || null
        });
      } catch (notificationError) {
        console.log('Notification failed:', notificationError);
        // Continue even if notification fails
      }
      
      showPopupMessage('success', 'Success', 'Recipient account created successfully');
      resetForm();
      setShowAddModal(false);
      
    } catch (error) {
      console.error('Error creating recipient:', error);
      
      // Show specific error message
      let errorMessage = 'Failed to create recipient account';
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        errorMessage = 'An account with this email already exists';
      } else if (error.message.includes('validation')) {
        errorMessage = 'Please check your input data';
      } else if (error.message.includes('404') || error.message.includes('Not Found')) {
        errorMessage = 'API endpoint not found. Please check if the backend server is running.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showPopupMessage('error', 'Error', errorMessage);
    }
  };

  const handleEditRecipientSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const updateData = {
        ...formData,
        name: formData.name.trim(),
        contact_person: formData.name.trim(),
        id_number: formData.id_number?.trim() || null
      };

      await updateRecipientMutation.mutateAsync({
        id: editingRecipient.id,
        data: updateData
      });
      setShowEditModal(false);
      setEditingRecipient(null);
      resetForm();
      showPopupMessage("success", "Recipient Updated", `${formData.name}'s information has been successfully updated.`);
    } catch (error) {
      showPopupMessage("error", "Error", error.message || "Failed to update recipient");
    }
  };

  const handleDeleteRecipientConfirm = async () => {
    try {
      await deleteRecipientMutation.mutateAsync(deletingRecipient.id);
      setShowDeleteModal(false);
      setDeletingRecipient(null);
      showPopupMessage("success", "Recipient Deleted", `${deletingRecipient.name} has been removed from the system.`);
    } catch (error) {
      showPopupMessage("error", "Error", error.message || "Failed to delete recipient");
    }
  };

  const toggleRecipientStatus = async (recipient) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/recipient-accounts/${recipient.id}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        // React Query will automatically update the cache
        const newStatus = data.data.status;
        showPopupMessage(
          "success", 
          "Status Updated", 
          `${recipient.name} has been ${newStatus === "active" ? "activated" : "deactivated"}.`
        );
      } else {
        showPopupMessage("error", "Error", data.message || "Failed to update status");
      }
    } catch (error) {
      showPopupMessage("error", "Error", "Failed to update status");
    }
  };

  // Modal Handlers
  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (recipient) => {
    console.log('Opening edit modal for recipient:', recipient);
    console.log('Recipient fund_code:', recipient.fund_code);
    setEditingRecipient(recipient);
    setFormData({
      name: recipient.name,
      type: recipient.type,
      contact_person: recipient.name || recipient.contact_person || "",
      email: recipient.email,
      phone: recipient.phone,
      address: recipient.address,
      id_number: recipient.id_number || "",
      bank_account: recipient.bank_account || "",
      bank_name: recipient.bank_name || "",
      account_number: recipient.account_number || "",
      account_type: recipient.account_type || "savings",
      fund_code: recipient.fund_code || recipient.code || "",
      description: recipient.description || "",
      fund_account_id: recipient.fund_account_id || "",
      balance: recipient.balance || recipient.current_balance || 0,
      id: recipient.id || ""
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (recipient) => {
    setDeletingRecipient(recipient);
    setShowDeleteModal(true);
  };

  // Filter helper functions
  const getFilterLabel = (filter) => {
    const filterLabels = {
      'all': 'All Recipients',
      'latest': 'Latest Account',
      'oldest': 'Oldest Account',
      'active': 'Active',
      'inactive': 'Inactive'
    };
    return filterLabels[filter] || 'Filter';
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setShowFilterDropdown(false);
  };

  // Menu handlers
  const handleMenuToggle = (recipientId) => {
    setOpenMenuId(openMenuId === recipientId ? null : recipientId);
  };

  const handleEditRecipient = (recipient) => {
    openEditModal(recipient);
    setOpenMenuId(null);
  };

  const handleDeleteRecipient = (recipient) => {
    openDeleteModal(recipient);
    setOpenMenuId(null);
  };

  const handleToggleStatus = (recipient) => {
    toggleRecipientStatus(recipient);
    setOpenMenuId(null);
  };

  const handleViewTransactions = (recipient) => {
    setSelectedRecipient(recipient);
    setShowTransactionHistory(true);
    setOpenMenuId(null);
  };

  // Memoized filtered recipients for performance
  const filteredRecipients = useMemo(() => {
    let filtered = recipients.filter(recipient => {
      const matchesFilter = activeFilter === "all" || 
                           (activeFilter === "active" && recipient.status === "active") ||
                           (activeFilter === "inactive" && recipient.status === "inactive") ||
                           (activeFilter === "latest" && true) ||
                           (activeFilter === "oldest" && true);
      const matchesSearch = !searchTerm || 
                           recipient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           recipient.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           recipient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (recipient.bank_name && recipient.bank_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (recipient.account_number && recipient.account_number.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesFilter && matchesSearch;
    });

    // Apply sorting for latest/oldest
    if (activeFilter === "latest") {
      filtered.sort((a, b) => new Date(b.created_at || b.id) - new Date(a.created_at || a.id));
    } else if (activeFilter === "oldest") {
      filtered.sort((a, b) => new Date(a.created_at || a.id) - new Date(b.created_at || b.id));
    }

    return filtered;
  }, [recipients, activeFilter, searchTerm]);

  const stats = useMemo(() => ({
    total: recipients.length,
    vendors: recipients.filter(r => r.type === "disbursement").length,
    withBank: recipients.filter(r => r.bank_name && r.bank_name.trim()).length,
    active: recipients.filter(r => r.status === "active").length,
    inactive: recipients.filter(r => r.status === "inactive").length
  }), [recipients]);


  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showFilterDropdown && !event.target.closest('.filter-dropdown-container')) {
        setShowFilterDropdown(false);
      }
      if (openMenuId && !event.target.closest('.menu-container')) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilterDropdown, openMenuId]);

  // Show loading skeleton while data is loading
  if (recipientsLoading) {
    return (
      <div className="recipient-account-page">
        <SkeletonSectionHeader />
        <SkeletonRecipientGrid />
      </div>
    );
  }

  return (
    <ErrorBoundary FallbackComponent={QueryErrorFallback}>
      <div className="recipient-account-page">
      <div className="section-header">
        <div className="section-title-group">
          <h3>
            <i className="fas fa-address-book"></i>
            Recipient Account Management
            <span className="section-count">({filteredRecipients.length})</span>
          </h3>
        </div>
        <div className="header-controls">
          <div className="search-filter-container">
            <div className="account-search-container">
              <input
                type="text"
                placeholder="Search recipients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="account-search-input"
              />
              <i className="fas fa-search account-search-icon"></i>
            </div>
            
            <div className="filter-dropdown-container">
              <button
                className="filter-dropdown-btn"
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                title="Filter recipients"
              >
                <i className="fas fa-filter"></i>
                <span className="filter-label">
                  {getFilterLabel(activeFilter)}
                </span>
                <i className={`fas fa-chevron-${showFilterDropdown ? 'up' : 'down'} filter-arrow`}></i>
              </button>
              
              {showFilterDropdown && (
                <div className="filter-dropdown-menu">
                  <button
                    className={`filter-option ${activeFilter === 'all' ? 'active' : ''}`}
                    onClick={() => handleFilterChange('all')}
                  >
                    <i className="fas fa-list"></i>
                    <span>All Recipients</span>
                    {activeFilter === 'all' && <i className="fas fa-check filter-check"></i>}
                  </button>
                  <button
                    className={`filter-option ${activeFilter === 'latest' ? 'active' : ''}`}
                    onClick={() => handleFilterChange('latest')}
                  >
                    <i className="fas fa-arrow-down"></i>
                    <span>Latest Account</span>
                    {activeFilter === 'latest' && <i className="fas fa-check filter-check"></i>}
                  </button>
                  <button
                    className={`filter-option ${activeFilter === 'oldest' ? 'active' : ''}`}
                    onClick={() => handleFilterChange('oldest')}
                  >
                    <i className="fas fa-arrow-up"></i>
                    <span>Oldest Account</span>
                    {activeFilter === 'oldest' && <i className="fas fa-check filter-check"></i>}
                  </button>
                  <button
                    className={`filter-option ${activeFilter === 'active' ? 'active' : ''}`}
                    onClick={() => handleFilterChange('active')}
                  >
                    <i className="fas fa-check-circle"></i>
                    <span>Active</span>
                    {activeFilter === 'active' && <i className="fas fa-check filter-check"></i>}
                  </button>
                  <button
                    className={`filter-option ${activeFilter === 'inactive' ? 'active' : ''}`}
                    onClick={() => handleFilterChange('inactive')}
                  >
                    <i className="fas fa-pause-circle"></i>
                    <span>Inactive</span>
                    {activeFilter === 'inactive' && <i className="fas fa-check filter-check"></i>}
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="action-buttons">
            <button
              className="btn-modern add-account-btn"
              onClick={openAddModal}
              disabled={isLoading}
            >
              <i className="fas fa-plus"></i>
              Add New Recipient
            </button>
          </div>
        </div>
      </div>

      <div className="accounts-overview">
        {searchTerm && (
          <div className="search-results-info">
            <i className="fas fa-search"></i>
            Showing {filteredRecipients.length} of {recipients.length} recipients for "{searchTerm}"
            {filteredRecipients.length === 0 && (
              <button 
                onClick={() => setSearchTerm('')}
                className="clear-search-btn"
              >
                ×
              </button>
            )}
          </div>
        )}
        
        <div className="account-cards">
          {filteredRecipients.length > 0 ? (
            filteredRecipients.map((recipient) => (
            <div 
              key={recipient.id} 
              className="recipient-card clickable-card"
              onClick={() => handleViewTransactions(recipient)}
              title="Click to view transactions"
            >
              <div className="card-top-section">
                <div className={`status-badge ${recipient.status}`}>
                  <i className={`fas fa-${recipient.status === 'active' ? 'check-circle' : 'pause-circle'}`}></i>
                  {recipient.status}
                </div>
                
                <div className="menu-container">
                  <button
                    className="menu-btn"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent card click when clicking menu
                      handleMenuToggle(recipient.id);
                    }}
                    title="More actions"
                  >
                    <i className="fas fa-ellipsis-v"></i>
                  </button>
                  
                  {openMenuId === recipient.id && (
                    <div className="menu-dropdown" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="menu-option edit-option"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditRecipient(recipient);
                        }}
                      >
                        <i className="fas fa-edit"></i>
                        <span>Edit</span>
                      </button>
                      <button
                        className={`menu-option status-option ${recipient.status === 'active' ? 'deactivate' : 'activate'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(recipient);
                        }}
                      >
                        <i className={`fas fa-${recipient.status === 'active' ? 'pause' : 'play'}`}></i>
                        <span>{recipient.status === 'active' ? 'Deactivate' : 'Activate'}</span>
                      </button>
                      <button
                        className="menu-option delete-option"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRecipient(recipient);
                        }}
                      >
                        <i className="fas fa-trash"></i>
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="recipient-card-header">
                <div className="recipient-avatar">
                  <i className="fas fa-building"></i>
                </div>
                <div className="recipient-info">
                  <h3 className="recipient-name">
                    {recipient.name}
                  </h3>
                </div>
              </div>

              <div className="recipient-details">
                <div className="recipient-detail">
                  <i className="fas fa-envelope"></i>
                  <span><strong>Email:</strong> {recipient.email}</span>
                </div>
                <div className="recipient-detail">
                  <i className="fas fa-phone"></i>
                  <span><strong>Phone:</strong> {recipient.phone}</span>
                </div>
                {recipient.bank_name && (
                  <div className="recipient-detail bank-info">
                    <i className="fas fa-university"></i>
                    <span><strong>Bank:</strong> {recipient.bank_name}</span>
                  </div>
                )}
                {recipient.account_number && (
                  <div className="recipient-detail">
                    <i className="fas fa-credit-card"></i>
                    <span><strong>Account:</strong> {recipient.account_number}</span>
                  </div>
                )}
                <div className="recipient-detail">
                  <i className="fas fa-map-marker-alt"></i>
                  <span><strong>Address:</strong> {recipient.address}</span>
                </div>
                {recipient.description && (
                  <div className="recipient-detail">
                    <i className="fas fa-info-circle"></i>
                    <span><strong>Notes:</strong> {recipient.description}</span>
                  </div>
                )}
              </div>


              {/* Click hint */}
              <div className="card-click-hint">
                <i className="fas fa-history"></i>
                <span>Click to view transactions</span>
              </div>

            </div>
            ))
          ) : (
            <div className="empty-state">
              <h4>No Matching Recipients Found</h4>
              <p>No recipients match your search criteria. Try adjusting your search terms.</p>
            </div>
          )}
        </div>
        
        {recipients.length === 0 && (
          <div className="empty-state">
            <h4>No Recipients Found</h4>
            <p>Create your first recipient account to get started with vendor management.</p>
            <button className="btn-modern add-account-btn" onClick={openAddModal}>
              <i className="fas fa-plus"></i> Add First Recipient
            </button>
          </div>
        )}
      </div>

      {/* Transaction History Modal */}
      {showTransactionHistory && selectedRecipient && (
        <div className="modal-overlay transaction-history-overlay" onClick={() => setShowTransactionHistory(false)}>
          <div className="transaction-history-modal" onClick={(e) => e.stopPropagation()}>
            <div className="transaction-history-header">
              <h4 className="transaction-history-title">
                <i className="fas fa-history"></i> 
                Transaction History: {selectedRecipient.name}
              </h4>
              <div className="transaction-history-controls">
                <button 
                  onClick={() => setShowTransactionHistory(false)}
                  className="transaction-history-close"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="transaction-history-recipient-meta">
              <div className="transaction-history-meta-item">
                <div className="transaction-history-meta-label">Recipient Code</div>
                <div className="transaction-history-meta-value code">{selectedRecipient.fund_code || 'N/A'}</div>
              </div>
              <div className="transaction-history-meta-item">
                <div className="transaction-history-meta-label">Contact Person</div>
                <div className="transaction-history-meta-value">{selectedRecipient.contact_person}</div>
              </div>
              <div className="transaction-history-meta-item">
                <div className="transaction-history-meta-label">Email</div>
                <div className="transaction-history-meta-value email">{selectedRecipient.email}</div>
              </div>
            </div>

            {/* Transaction Summary Statistics */}
            {transactions.length > 0 && (
              <div className="transaction-summary-stats">
                <div className="summary-stat-item total">
                  <div className="stat-icon">
                    <i className="fas fa-coins"></i>
                  </div>
                  <div className="stat-content">
                    <div className="stat-label">Total Amount</div>
                    <div className="stat-value">₱{Math.abs(transactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)).toLocaleString()}</div>
                  </div>
                </div>
                <div className="summary-stat-item collection">
                  <div className="stat-icon">
                    <i className="fas fa-arrow-up"></i>
                  </div>
                  <div className="stat-content">
                    <div className="stat-label">Collection Total</div>
                    <div className="stat-value">₱{transactions.filter(t => t.type === 'Collection').reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0).toLocaleString()}</div>
                  </div>
                </div>
                <div className="summary-stat-item disbursement">
                  <div className="stat-icon">
                    <i className="fas fa-arrow-down"></i>
                  </div>
                  <div className="stat-content">
                    <div className="stat-label">Disbursement Total</div>
                    <div className="stat-value">₱{Math.abs(transactions.filter(t => t.type === 'Disbursement').reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            )}

            {transactionsLoading ? (
              <SkeletonTransactionTable />
            ) : transactions.length > 0 ? (
              <div className="transaction-history-table-wrapper">
                <table className="transaction-history-table-wide">
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
                    {transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td className="transaction-date-cell">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </td>
                        
                        <td className="transaction-description-cell">
                          {transaction.description || 'N/A'}
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
                <i className="fas fa-inbox transaction-empty-icon-improved"></i>
                <h4 className="transaction-empty-title-improved">No Transactions Found</h4>
                <p className="transaction-empty-text-improved">
                  This recipient account has no transaction history yet.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Recipient Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content edit-modal-enhanced" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                <i className="fas fa-plus-circle"></i> Add New Recipient Account
              </h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleAddRecipient}>
              <div className="modal-body modal-body-no-scroll">
                <div className="form-container">
                  <div className="form-sections-row">
                    <div className="form-section">
                      <div className="form-section-header">
                        <i className="fas fa-user form-section-icon"></i>
                        <h5 className="form-section-title">Basic Information</h5>
                      </div>
                      <div className="form-grid-2x2">
                        <div className="form-group">
                          <label className="form-label">
                            Recipient Name <span className="required">*</span>
                          </label>
                          <input
                            type="text"
                            className={`form-input ${errors.name ? 'error' : ''}`}
                            value={formData.name}
                            onChange={(e) => {
                              const value = e.target.value;
                              setFormData(prev => ({
                                ...prev,
                                name: value,
                                contact_person: value
                              }));
                            }}
                            placeholder="e.g., ABC Corporation"
                          />
                          {errors.name && (
                            <div className="form-error">
                              <i className="fas fa-exclamation-circle"></i>
                              {errors.name}
                            </div>
                          )}
                        </div>

                        <div className="form-group">
                          <label className="form-label">Recipient Code</label>
                          <input
                            type="text"
                            className="form-input auto-generated"
                            value={formData.fund_code}
                            readOnly
                            placeholder="Auto-generated"
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Description & Notes</label>
                        <textarea
                          className="form-textarea"
                          value={formData.description}
                          onChange={(e) =>
                            setFormData(prev => ({ ...prev, description: e.target.value }))
                          }
                          placeholder="Add any important details about this recipient"
                          rows="4"
                        />
                        {errors.description && (
                          <div className="form-error">
                            <i className="fas fa-exclamation-circle"></i>
                            {errors.description}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Contact Information Section */}
                    <div className="form-section">
                      <div className="form-section-header">
                        <i className="fas fa-address-card form-section-icon"></i>
                        <h5 className="form-section-title">Contact Information</h5>
                      </div>
                      <div className="form-grid-2x2">
                        <div className="form-group">
                          <label className="form-label">
                            Email Address <span className="required">*</span>
                          </label>
                          <input
                            type="email"
                            className={`form-input ${errors.email ? 'error' : ''}`}
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            placeholder="Enter email address"
                          />
                          {errors.email && <div className="form-error"><i className="fas fa-exclamation-circle"></i>{errors.email}</div>}
                        </div>

                        <div className="form-group">
                          <label className="form-label">
                            Phone Number <span className="required">*</span>
                          </label>
                          <input
                            type="tel"
                            className={`form-input ${errors.phone ? 'error' : ''}`}
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            placeholder="Enter phone number"
                          />
                          {errors.phone && <div className="form-error"><i className="fas fa-exclamation-circle"></i>{errors.phone}</div>}
                        </div>

                        <div className="form-group">
                          <label className="form-label">ID Number</label>
                          <input
                            type="text"
                            className="form-input"
                            value={formData.id_number || ""}
                            onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                            placeholder="Enter government ID or tax number"
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">
                            Address <span className="required">*</span>
                          </label>
                          <input
                            type="text"
                            className={`form-input ${errors.address ? 'error' : ''}`}
                            value={formData.address}
                            onChange={(e) => setFormData({...formData, address: e.target.value})}
                            placeholder="Enter complete address"
                          />
                          {errors.address && <div className="form-error"><i className="fas fa-exclamation-circle"></i>{errors.address}</div>}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
              <div className="modal-footer modal-footer-enhanced">
                
                <button type="submit" className="btn btn-primary btn-update-enhanced" disabled={createRecipientMutation.isPending}>
                  {createRecipientMutation.isPending ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-plus"></i>}
                  {createRecipientMutation.isPending ? 'Adding...' : 'Add Recipient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Recipient Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content edit-modal-enhanced" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                <i className="fas fa-edit"></i> Edit Recipient Account
              </h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleEditRecipientSubmit}>
              <div className="modal-body modal-body-no-scroll">
                <div className="form-container">
                  
                  {/* First Row: Basic Information & Contact Information */}
                  <div className="form-sections-row">
                    {/* Basic Information Section */}
                    <div className="form-section">
                      <div className="form-section-header">
                        <i className="fas fa-user form-section-icon"></i>
                        <h5 className="form-section-title">Basic Information</h5>
                      </div>
                      
                      {/* 2x2 Grid Layout */}
                      <div className="form-grid-2x2">
                        <div className="form-group">
                          <label className="form-label">
                            Recipient Name <span className="required">*</span>
                          </label>
                          <input
                            type="text"
                            className={`form-input ${errors.name ? 'error' : ''}`}
                            value={formData.name}
                            onChange={(e) => {
                              const value = e.target.value;
                              setFormData(prev => ({
                                ...prev,
                                name: value,
                                contact_person: value
                              }));
                            }}
                            placeholder="e.g., ABC Corporation"
                          />
                          {errors.name && <div className="form-error"><i className="fas fa-exclamation-circle"></i>{errors.name}</div>}
                        </div>

                        <div className="form-group">
                          <label className="form-label">Recipient Code</label>
                          <input
                            type="text"
                            className="form-input auto-generated"
                            value={formData.fund_code || "N/A"}
                            readOnly
                            placeholder="Auto-generated"
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          Description / Purpose <span className="required">*</span>
                        </label>
                        <textarea
                          className={`form-textarea ${errors.description ? 'error' : ''}`}
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Explain the use and purpose of this recipient account"
                          rows="4"
                        />
                        {errors.description && <div className="form-error"><i className="fas fa-exclamation-circle"></i>{errors.description}</div>}
                      </div>
                    </div>

                    {/* Contact Information Section */}
                    <div className="form-section">
                      <div className="form-section-header">
                        <i className="fas fa-address-card form-section-icon"></i>
                        <h5 className="form-section-title">Contact Information</h5>
                      </div>
                      
                      {/* 2x2 Grid Layout */}
                      <div className="form-grid-2x2">
                        <div className="form-group">
                          <label className="form-label">
                            Email Address <span className="required">*</span>
                          </label>
                          <input
                            type="email"
                            className={`form-input ${errors.email ? 'error' : ''}`}
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="Enter email address"
                          />
                          {errors.email && <div className="form-error"><i className="fas fa-exclamation-circle"></i>{errors.email}</div>}
                        </div>

                        <div className="form-group">
                          <label className="form-label">
                            Phone Number <span className="required">*</span>
                          </label>
                          <input
                            type="tel"
                            className={`form-input ${errors.phone ? 'error' : ''}`}
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="Enter phone number"
                          />
                          {errors.phone && <div className="form-error"><i className="fas fa-exclamation-circle"></i>{errors.phone}</div>}
                        </div>

                        <div className="form-group">
                          <label className="form-label">ID Number</label>
                          <input
                            type="text"
                            className="form-input"
                            value={formData.id_number || ""}
                            onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                            placeholder="Enter government ID or tax number"
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">
                            Address <span className="required">*</span>
                          </label>
                          <input
                            type="text"
                            className={`form-input ${errors.address ? 'error' : ''}`}
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="Enter complete address"
                          />
                          {errors.address && <div className="form-error"><i className="fas fa-exclamation-circle"></i>{errors.address}</div>}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
              <div className="modal-footer modal-footer-enhanced">
                <button type="submit" className="btn btn-primary btn-update-enhanced" disabled={updateRecipientMutation.isPending}>
                  {updateRecipientMutation.isPending ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>}
                  {updateRecipientMutation.isPending ? 'Updating...' : 'Update Recipient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
    {/* Delete Confirmation Modal */}
    <Deletion
      isOpen={showDeleteModal && !!deletingRecipient}
      onClose={() => setShowDeleteModal(false)}
      onConfirm={handleDeleteRecipientConfirm}
      loading={deleteRecipientMutation.isPending}
      title="CONFIRM DELETION"
      message="Are you sure you want to delete this recipient? This action cannot be undone and will permanently remove all associated data."
      itemDetails={deletingRecipient ? [
        { label: "Recipient Name", value: deletingRecipient.name },
        { label: "Email", value: deletingRecipient.email || "N/A" },
        { label: "Transaction Count", value: deletingTransactionsLoading ? "Loading..." : deletingRecipientTransactions.length.toString() }
      ] : []}
      confirmText="Delete"
      cancelText="Cancel"
    />
      {showFundAccountModal && (
        <div className="modal-overlay" onClick={() => setShowFundAccountModal(false)}>
          <div className="modal-content fund-account-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                <i className="fas fa-university"></i> Select Fund Account
              </h3>
              <button className="modal-close" onClick={() => setShowFundAccountModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              {/* Search Bar */}
              <div className="search-bar-container">
                <div className="search-input-wrapper">
                  <i className="fas fa-search search-icon"></i>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search by name, code, or type..."
                    value={fundAccountSearch}
                    onChange={(e) => setFundAccountSearch(e.target.value)}
                    autoFocus
                  />
                  {fundAccountSearch && (
                    <button
                      className="clear-search"
                      onClick={() => setFundAccountSearch("")}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                </div>
                <div className="search-results-count">
                  {filteredFundAccounts.length} of {fundAccounts.length} accounts
                </div>
              </div>

              {/* Fund Accounts List */}
              <div className="fund-accounts-list">
                {filteredFundAccounts.length === 0 ? (
                  <div className="empty-state">
                    <i className="fas fa-search"></i>
                    <p>No fund accounts found</p>
                    {fundAccountSearch && (
                      <button
                        className="btn btn-secondary"
                        onClick={() => setFundAccountSearch("")}
                      >
                        Clear Search
                      </button>
                    )}
                  </div>
                ) : (
                  filteredFundAccounts.map((fund) => (
                    <div
                      key={fund.id}
                      className={`fund-account-item ${
                        parseInt(formData.fund_account_id) === parseInt(fund.id)
                          ? "selected"
                          : ""
                      }`}
                      onClick={() => handleFundAccountSelect(fund.id)}
                    >
                      <div className="fund-account-info">
                        <div className="fund-account-header">
                          <h4 className="fund-account-name">{fund.name}</h4>
                          <span className="fund-account-code">{fund.code}</span>
                        </div>
                        <div className="fund-account-details">
                          <span className="fund-account-type">
                            <i className="fas fa-tag"></i> {fund.account_type}
                          </span>
                          {fund.department && (
                            <span className="fund-account-dept">
                              <i className="fas fa-building"></i> {fund.department}
                            </span>
                          )}
                        </div>
                        <div className="fund-account-balance">
                          <span className="balance-label">Current Balance:</span>
                          <span className="balance-amount">
                            ₱{parseFloat(fund.current_balance || 0).toLocaleString('en-PH', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </span>
                        </div>
                      </div>
                      {parseInt(formData.fund_account_id) === parseInt(fund.id) && (
                        <div className="selected-indicator">
                          <i className="fas fa-check-circle"></i>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setFundAccountSearch("");
                  setShowFundAccountModal(false);
                }}
              >
                <i className="fas fa-times"></i> Cancel
              </button>
            </div> */}
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {showNotification && (
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
              {notification.type === 'success' ? (
                <div style={{ fontSize: '48px', color: '#16a34a', marginBottom: '15px' }}>
                  <i className="fas fa-check-circle"></i>
                </div>
              ) : (
                <div style={{ fontSize: '48px', color: '#dc2626', marginBottom: '15px' }}>
                  <i className="fas fa-exclamation-circle"></i>
                </div>
              )}
              <h4 style={{ 
                color: notification.type === 'success' ? '#16a34a' : '#dc2626',
                marginBottom: '10px'
              }}>
                {notification.type === 'success' ? 'Success!' : 'Error!'}
              </h4>
              <p style={{ color: '#333333', fontSize: '16px', lineHeight: '1.5' }}>
                {notification.message}
              </p>
            </div>
            <button 
              className="btn btn-primary"
              onClick={() => setShowNotification(false)}
              style={{ minWidth: '100px' }}
            >
              OK
            </button>
          </div>
        </div>
      )}
      </div>
    </ErrorBoundary>
  );
};

export default RecipientAccount;
