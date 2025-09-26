import React, { useState, useEffect } from "react";
import "./css/recipientaccount.css";
import notificationService from "../../services/notificationService";
import balanceService from "../../services/balanceService";

const RecipientAccount = () => {
  // State for recipients and fund accounts
  const [recipients, setRecipients] = useState([]);
  const [fundAccounts, setFundAccounts] = useState([]);

  // Modal and form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  
  // Filter and search states
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Generate unique fund code function (moved up for initialization)
  const generateFundCode = (accountType, fundAccount = null) => {
    const prefixes = {
      'collection': 'CF',
      'disbursement': 'DF', 
      'trust': 'TF'
    };
    
    const prefix = prefixes[accountType.toLowerCase()] || 'GF';
    const timestamp = Date.now().toString().slice(-4);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    
    if (fundAccount) {
      return `${prefix}-${fundAccount.code}-${timestamp}`;
    }
    
    return `${prefix}-${timestamp}${random}`;
  };

  // Form data state
  const [formData, setFormData] = useState({
    name: "",
    type: "disbursement",
    fund_account_id: "",
    fund_code: generateFundCode("disbursement"),
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    bank_name: "",
    account_number: "",
    branch: "",
    description: "",
    status: "active"
  });
  
  // Other states
  const [editingRecipient, setEditingRecipient] = useState(null);
  const [deletingRecipient, setDeletingRecipient] = useState(null);
  const [notification, setNotification] = useState({
    type: "success",
    title: "",
    message: ""
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Load data on component mount
  useEffect(() => {
    loadRecipients();
    loadFundAccounts();
  }, []);

  // API Functions
  const loadRecipients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/recipient-accounts', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error('Failed to load recipients:', response.status, response.statusText);
        // For now, set empty array if endpoint doesn't exist
        setRecipients([]);
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        setRecipients(data.data);
      } else {
        setRecipients([]);
      }
    } catch (error) {
      console.error('Error loading recipients:', error);
      setRecipients([]);
    }
  };

  const loadFundAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Loading fund accounts...'); // Debug log
      
      // Use the working fund-accounts endpoint directly
      const response = await fetch('http://localhost:8000/api/fund-accounts', {
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
    const selectedFund = fundAccounts.find(fund => fund.id === parseInt(fundAccountId));
    if (selectedFund) {
      const generatedCode = generateFundCode(formData.type, selectedFund);
      
      if (formData.type === 'collection') {
        setFormData(prev => ({
          ...prev,
          fund_account_id: fundAccountId,
          name: `${selectedFund.name} Collection Account`,
          fund_code: generatedCode,
          description: `Collection account linked to ${selectedFund.name} (${selectedFund.account_type})`
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          fund_account_id: fundAccountId,
          fund_code: generatedCode
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        fund_account_id: fundAccountId
      }));
    }
  };

  // Handle account type change
  const handleAccountTypeChange = (type) => {
    // Map new account types to existing backend types
    const typeMapping = {
      'vendor': 'disbursement',
      'customer': 'collection', 
      'employee': 'disbursement',
      'other': 'disbursement'
    };
    
    const backendType = typeMapping[type] || type;
    const newFundCode = generateFundCode(backendType);
    
    setFormData(prev => ({
      ...prev,
      type: backendType,
      fund_code: newFundCode,
      // Reset fund account selection when type changes
      fund_account_id: "",
      name: ""
    }));
  };

  // Utility Functions
  const showNotification = (type, title, message) => {
    setNotification({ type, title, message });
    setShowNotificationModal(true);
  };

  const resetForm = () => {
    const defaultType = "disbursement";
    setFormData({
      name: "",
      type: defaultType,
      fund_account_id: "",
      fund_code: generateFundCode(defaultType),
      contact_person: "",
      email: "",
      phone: "",
      address: "",
      bank_name: "",
      account_number: "",
      branch: "",
      description: "",
      status: "active"
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Required fields
    if (!formData.name.trim()) newErrors.name = "Account name is required";
    if (!formData.contact_person.trim()) newErrors.contact_person = "Contact person is required";
    if (!formData.email.trim()) newErrors.email = "Email address is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!formData.address.trim()) newErrors.address = "Address is required";
    if (!formData.fund_code.trim()) newErrors.fund_code = "Fund code is required";
    if (!formData.description.trim()) newErrors.description = "Description/Purpose is required";
    
    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    // Phone validation (basic)
    if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }
    
    // Fund account validation
    if (!formData.fund_account_id) {
      newErrors.fund_account_id = "Fund account selection is required";
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
    if (!formData.contact_person.trim()) newErrors.contact_person = 'Contact person is required';
    if (!formData.email.trim()) newErrors.email = 'Email address is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.description.trim()) newErrors.description = 'Description/Purpose is required';
    
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
      showNotification('error', 'Validation Error', 'Please fill in all required fields correctly');
      return;
    }
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Prepare data for API
      const apiData = {
        name: formData.name.trim(),
        type: formData.type,
        contact_person: formData.contact_person.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        description: formData.description.trim(),
        status: formData.status,
        fund_account_id: formData.fund_account_id || null,
        fund_code: formData.fund_code || null,
        bank_name: formData.bank_name?.trim() || null,
        account_number: formData.account_number?.trim() || null,
        branch: formData.branch?.trim() || null
      };
      
      console.log('Creating recipient account with data:', apiData);
      
      // Make API call to create recipient account
      const response = await fetch('http://localhost:8000/api/recipient-accounts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiData)
      });
      
      const responseData = await response.json();
      console.log('API Response:', responseData);
      
      if (!response.ok) {
        throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
      }
      
      if (responseData.success) {
        // Success - reload recipients from server
        await loadRecipients();
        
        // Send notification for new recipient account
        const selectedFund = fundAccounts.find(fund => fund.id === parseInt(formData.fund_account_id));
        try {
          await notificationService.notifyTransaction('RECIPIENT_ACCOUNT_CREATED', {
            name: formData.name,
            fund_account: selectedFund?.name || `Fund Account #${formData.fund_account_id}`,
            fund_account_id: formData.fund_account_id
          });
        } catch (notificationError) {
          console.log('Notification failed:', notificationError);
          // Continue even if notification fails
        }
        
        showNotification('success', 'Success', 'Recipient account created successfully');
        resetForm();
        setShowAddModal(false);
      } else {
        throw new Error(responseData.message || 'Failed to create recipient account');
      }
      
    } catch (error) {
      console.error('Error creating recipient:', error);
      
      // Show specific error message
      let errorMessage = 'Failed to create recipient account';
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        errorMessage = 'An account with this email already exists';
      } else if (error.message.includes('validation')) {
        errorMessage = 'Please check your input data';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showNotification('error', 'Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEditRecipient = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/recipient-accounts/${editingRecipient.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        await loadRecipients(); // Reload the list
        setShowEditModal(false);
        setEditingRecipient(null);
        resetForm();
        showNotification("success", "Recipient Updated", `${formData.name}'s information has been successfully updated.`);
      } else {
        showNotification("error", "Error", data.message || "Failed to update recipient");
      }
    } catch (error) {
      showNotification("error", "Error", "Failed to update recipient");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecipient = async () => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/recipient-accounts/${deletingRecipient.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        await loadRecipients(); // Reload the list
        setShowDeleteModal(false);
        setDeletingRecipient(null);
        showNotification("success", "Recipient Deleted", `${deletingRecipient.name} has been removed from the system.`);
      } else {
        showNotification("error", "Error", data.message || "Failed to delete recipient");
      }
    } catch (error) {
      showNotification("error", "Error", "Failed to delete recipient");
    } finally {
      setLoading(false);
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
        await loadRecipients(); // Reload the list
        const newStatus = data.data.status;
        showNotification(
          "success", 
          "Status Updated", 
          `${recipient.name} has been ${newStatus === "active" ? "activated" : "deactivated"}.`
        );
      } else {
        showNotification("error", "Error", data.message || "Failed to update status");
      }
    } catch (error) {
      showNotification("error", "Error", "Failed to update status");
    }
  };

  // Modal Handlers
  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (recipient) => {
    setEditingRecipient(recipient);
    setFormData({
      name: recipient.name,
      type: recipient.type,
      contact_person: recipient.contact_person,
      email: recipient.email,
      phone: recipient.phone,
      address: recipient.address,
      tax_id: recipient.tax_id || "",
      bank_account: recipient.bank_account || "",
      fund_code: recipient.fund_code || "",
      description: recipient.description || "",
      fund_account_id: recipient.fund_account_id || ""
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (recipient) => {
    setDeletingRecipient(recipient);
    setShowDeleteModal(true);
  };

  // Filter and calculate stats
  const filteredRecipients = recipients.filter(recipient => {
    const matchesFilter = activeFilter === "all" || recipient.type === activeFilter;
    const matchesSearch = recipient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recipient.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recipient.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: recipients.length,
    disbursement: recipients.filter(r => r.type === "disbursement").length,
    collection: recipients.filter(r => r.type === "collection").length,
    active: recipients.filter(r => r.status === "active").length,
    inactive: recipients.filter(r => r.status === "inactive").length
  };

  return (
    <div className="recipient-account-page">
      <div className="funds-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="header-title">
              <i className="fas fa-address-book"></i>
              Recipient Account Management
            </h1>
            <p className="header-subtitle">
              Manage payees, vendors, and fund collection accounts for cashier operations
            </p>
          </div>
        </div>
        <button className="add-recipient-btn" onClick={openAddModal}>
          <i className="fas fa-plus"></i> Add New Recipient
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button 
          className={`filter-tab ${activeFilter === "all" ? "active" : ""}`}
          onClick={() => setActiveFilter("all")}
        >
          <i className="fas fa-list"></i> All Recipients
        </button>
        <button 
          className={`filter-tab ${activeFilter === "disbursement" ? "active" : ""}`}
          onClick={() => setActiveFilter("disbursement")}
        >
          <i className="fas fa-arrow-up"></i> Disbursement Recipients
        </button>
        <button 
          className={`filter-tab ${activeFilter === "collection" ? "active" : ""}`}
          onClick={() => setActiveFilter("collection")}
        >
          <i className="fas fa-arrow-down"></i> Collection Funds
        </button>
      </div>

      {/* Search Bar */}
      <div className="search-filter-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Search recipients by name, contact person, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Stats Cards */}
      <div className="recipient-stats">
        <div className="stat-card">
          <div className="stat-icon total">
            <i className="fas fa-address-book"></i>
          </div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Recipients</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon disbursement">
            <i className="fas fa-money-bill-wave"></i>
          </div>
          <div className="stat-info">
            <div className="stat-number">{stats.disbursement}</div>
            <div className="stat-label">Payees/Vendors</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon collection">
            <i className="fas fa-piggy-bank"></i>
          </div>
          <div className="stat-info">
            <div className="stat-number">{stats.collection}</div>
            <div className="stat-label">Fund Accounts</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon active">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="stat-value">{stats.active}</div>
          <div className="stat-label">Active Accounts</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon inactive">
            <i className="fas fa-times-circle"></i>
          </div>
          <div className="stat-value">{stats.inactive}</div>
          <div className="stat-label">Inactive Accounts</div>
        </div>
      </div>

      {/* Recipients Grid */}
      {filteredRecipients.length > 0 ? (
        <div className="recipients-grid">
          {filteredRecipients.map((recipient) => (
            <div key={recipient.id} className="recipient-card">
              <div className={`status-badge ${recipient.status}`}>
                {recipient.status}
              </div>
              
              <div className="recipient-card-header">
                <div className="recipient-info">
                  <h3 className="recipient-name">
                    <i className={`fas fa-${recipient.type === 'disbursement' ? 'building' : 'university'}`}></i>
                    {recipient.name}
                  </h3>
                  <span className={`recipient-type ${recipient.type}`}>
                    {recipient.type}
                  </span>
                </div>
              </div>

              <div className="recipient-details">
                <div className="recipient-detail">
                  <i className="fas fa-user"></i>
                  <span>{recipient.contact_person}</span>
                </div>
                <div className="recipient-detail">
                  <i className="fas fa-envelope"></i>
                  <span>{recipient.email}</span>
                </div>
                <div className="recipient-detail">
                  <i className="fas fa-phone"></i>
                  <span>{recipient.phone}</span>
                </div>
                <div className="recipient-detail">
                  <i className="fas fa-map-marker-alt"></i>
                  <span>{recipient.address}</span>
                </div>
                {recipient.type === 'disbursement' ? (
                  <>
                    <div className="recipient-detail">
                      <i className="fas fa-id-card"></i>
                      <span>Tax ID: {recipient.tax_id}</span>
                    </div>
                    <div className="recipient-detail">
                      <i className="fas fa-credit-card"></i>
                      <span>Bank: {recipient.bank_account}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="recipient-detail">
                      <i className="fas fa-code"></i>
                      <span>Fund Code: {recipient.fund_code}</span>
                    </div>
                    <div className="recipient-detail">
                      <i className="fas fa-info-circle"></i>
                      <span>{recipient.description}</span>
                    </div>
                    {recipient.fund_account && (
                      <div className="recipient-detail">
                        <i className="fas fa-university"></i>
                        <span>Fund: {recipient.fund_account.name} ({recipient.fund_account.code})</span>
                      </div>
                    )}
                  </>
                )}
                <div className="recipient-detail">
                  <i className="fas fa-chart-line"></i>
                  <span>{recipient.total_transactions} transactions • ₱{recipient.total_amount ? parseFloat(recipient.total_amount).toLocaleString() : '0'}</span>
                </div>
              </div>

              <div className="recipient-actions">
                <button
                  className="action-btn edit-btn"
                  onClick={() => openEditModal(recipient)}
                  title="Edit Recipient"
                >
                  <i className="fas fa-edit"></i>
                </button>
                <button
                  className={`action-btn toggle-btn ${recipient.status === "inactive" ? "activate" : ""}`}
                  onClick={() => toggleRecipientStatus(recipient)}
                  title={recipient.status === "active" ? "Deactivate" : "Activate"}
                >
                  <i className={`fas fa-${recipient.status === "active" ? "pause" : "play"}`}></i>
                </button>
                <button
                  className="action-btn delete-btn"
                  onClick={() => openDeleteModal(recipient)}
                  title="Delete Recipient"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <i className="fas fa-address-book"></i>
          <h3>No Recipients Found</h3>
          <p>No recipients match your current filter and search criteria.</p>
          <button className="btn btn-primary" onClick={openAddModal}>
            <i className="fas fa-plus"></i> Add First Recipient
          </button>
        </div>
      )}

      {/* Add Recipient Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                <i className="fas fa-plus-circle"></i> Add New Recipient Account
              </h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleAddRecipient}>
              <div className="modal-body">
                <div className="form-container">
                  
                  {/* Basic Information Section */}
                  <div className="form-section">
                    <div className="form-section-header">
                      <i className="fas fa-info-circle form-section-icon"></i>
                      <h4 className="form-section-title">Basic Information</h4>
                    </div>
                    <div className="form-grid">
                      <div className="form-group full-width">
                        <label className="form-label">
                          Account Name <span className="required">*</span>
                        </label>
                        <input
                          type="text"
                          className={`form-input ${errors.name ? 'error' : ''}`}
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          placeholder="e.g., ABC Corporation, John Doe"
                        />
                        {errors.name && <div className="form-error"><i className="fas fa-exclamation-circle"></i>{errors.name}</div>}
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          Account Type <span className="required">*</span>
                        </label>
                        <select
                          className="form-select"
                          value={formData.type}
                          onChange={(e) => handleAccountTypeChange(e.target.value)}
                        >
                          <option value="disbursement">Vendor</option>
                          <option value="collection">Customer</option>
                          <option value="employee">Employee</option>
                          <option value="other">Other</option>
                        </select>
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
                        <div className="form-help">Automatically generated based on account type</div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Fund Account (Optional)</label>
                        <select
                          className={`form-select ${errors.fund_account_id ? 'error' : ''}`}
                          value={formData.fund_account_id}
                          onChange={(e) => handleFundAccountSelect(e.target.value)}
                        >
                          <option value="">Select Fund Account ({fundAccounts.length} available)</option>
                          {fundAccounts.map((fund) => (
                            <option key={fund.id} value={fund.id}>
                              {fund.name} - {fund.code} (₱{parseFloat(fund.current_balance || 0).toLocaleString()})
                            </option>
                          ))}
                        </select>
                        {errors.fund_account_id && <div className="form-error"><i className="fas fa-exclamation-circle"></i>{errors.fund_account_id}</div>}
                      </div>
                    </div>
                  </div>

                  {/* Contact Information Section */}
                  <div className="form-section">
                    <div className="form-section-header">
                      <i className="fas fa-address-book form-section-icon"></i>
                      <h4 className="form-section-title">Contact Information</h4>
                    </div>
                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">
                          Contact Person <span className="required">*</span>
                        </label>
                        <input
                          type="text"
                          className={`form-input ${errors.contact_person ? 'error' : ''}`}
                          value={formData.contact_person}
                          onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                          placeholder="Enter contact person name"
                        />
                        {errors.contact_person && <div className="form-error"><i className="fas fa-exclamation-circle"></i>{errors.contact_person}</div>}
                      </div>

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

                      <div className="form-group full-width">
                        <label className="form-label">
                          Address <span className="required">*</span>
                        </label>
                        <textarea
                          className={`form-textarea ${errors.address ? 'error' : ''}`}
                          value={formData.address}
                          onChange={(e) => setFormData({...formData, address: e.target.value})}
                          placeholder="Enter complete address"
                          rows="3"
                        />
                        {errors.address && <div className="form-error"><i className="fas fa-exclamation-circle"></i>{errors.address}</div>}
                      </div>
                    </div>
                  </div>

                  {/* Bank Information Section */}
                  <div className="form-section">
                    <div className="form-section-header">
                      <i className="fas fa-university form-section-icon"></i>
                      <h4 className="form-section-title">Bank Information (Optional)</h4>
                    </div>
                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">Bank Name</label>
                        <input
                          type="text"
                          className="form-input"
                          value={formData.bank_name}
                          onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
                          placeholder="Enter bank name"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Account Number</label>
                        <input
                          type="text"
                          className="form-input"
                          value={formData.account_number}
                          onChange={(e) => setFormData({...formData, account_number: e.target.value})}
                          placeholder="Enter account number"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Branch</label>
                        <input
                          type="text"
                          className="form-input"
                          value={formData.branch}
                          onChange={(e) => setFormData({...formData, branch: e.target.value})}
                          placeholder="Enter branch name"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Status and Description Section */}
                  <div className="form-section">
                    <div className="form-section-header">
                      <i className="fas fa-cog form-section-icon"></i>
                      <h4 className="form-section-title">Status & Description</h4>
                    </div>
                    
                    <div className="status-toggle">
                      <div 
                        className={`toggle-switch ${formData.status === 'active' ? 'active' : ''}`}
                        onClick={() => setFormData({...formData, status: formData.status === 'active' ? 'inactive' : 'active'})}
                      ></div>
                      <div className="toggle-label">Account Status</div>
                      <div className={`toggle-status ${formData.status}`}>
                        {formData.status}
                      </div>
                    </div>

                    <div className="form-grid single-column" style={{marginTop: '24px'}}>
                      <div className="form-group">
                        <label className="form-label">
                          Description / Purpose <span className="required">*</span>
                        </label>
                        <textarea
                          className={`form-textarea ${errors.description ? 'error' : ''}`}
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                          placeholder="Explain the use and purpose of this recipient account"
                          rows="4"
                        />
                        {errors.description && <div className="form-error"><i className="fas fa-exclamation-circle"></i>{errors.description}</div>}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  <i className="fas fa-times"></i> Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-plus"></i>}
                  {loading ? 'Adding...' : 'Add Recipient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Recipient Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                <i className="fas fa-edit"></i> Edit Recipient Account
              </h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleEditRecipient}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Account Type *</label>
                    <select
                      className="form-select"
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                    >
                      <option value="disbursement">Disbursement Recipient</option>
                      <option value="collection">Collection Fund</option>
                    </select>
                  </div>
                  {formData.type === 'collection' && (
                    <div className="form-group">
                      <label className="form-label">Fund Account *</label>
                      <select
                        className={`form-select ${errors.fund_account_id ? 'error' : ''}`}
                        value={formData.fund_account_id}
                        onChange={(e) => handleFundAccountSelect(e.target.value)}
                      >
                        <option value="">Select Fund Account ({fundAccounts.length} available)</option>
                        {fundAccounts.map((fund) => (
                          <option key={fund.id} value={fund.id}>
                            {fund.name} - {fund.code} (₱{parseFloat(fund.current_balance || 0).toLocaleString()})
                          </option>
                        ))}
                      </select>
                      {errors.fund_account_id && <div className="form-error">{errors.fund_account_id}</div>}
                    </div>
                  )}
                  <div className="form-group full-width">
                    <label className="form-label">
                      {formData.type === 'disbursement' ? 'Company/Individual Name' : 'Fund Name'} *
                    </label>
                    <input
                      type="text"
                      className={`form-input ${errors.name ? 'error' : ''}`}
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder={formData.type === 'disbursement' ? 'Enter company or individual name' : 'Enter fund name'}
                    />
                    {errors.name && <div className="form-error">{errors.name}</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact Person *</label>
                    <input
                      type="text"
                      className={`form-input ${errors.contact_person ? 'error' : ''}`}
                      value={formData.contact_person}
                      onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                      placeholder="Enter contact person name"
                    />
                    {errors.contact_person && <div className="form-error">{errors.contact_person}</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input
                      type="email"
                      className={`form-input ${errors.email ? 'error' : ''}`}
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="Enter email address"
                    />
                    {errors.email && <div className="form-error">{errors.email}</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number *</label>
                    <input
                      type="tel"
                      className={`form-input ${errors.phone ? 'error' : ''}`}
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="Enter phone number"
                    />
                    {errors.phone && <div className="form-error">{errors.phone}</div>}
                  </div>
                  <div className="form-group full-width">
                    <label className="form-label">Address *</label>
                    <textarea
                      className={`form-textarea ${errors.address ? 'error' : ''}`}
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      placeholder="Enter complete address"
                      rows="3"
                    />
                    {errors.address && <div className="form-error">{errors.address}</div>}
                  </div>
                  
                  {formData.type === 'disbursement' ? (
                    <>
                      <div className="form-group">
                        <label className="form-label">Tax ID Number *</label>
                        <input
                          type="text"
                          className={`form-input ${errors.tax_id ? 'error' : ''}`}
                          value={formData.tax_id}
                          onChange={(e) => setFormData({...formData, tax_id: e.target.value})}
                          placeholder="Enter tax ID number"
                        />
                        {errors.tax_id && <div className="form-error">{errors.tax_id}</div>}
                      </div>
                      <div className="form-group">
                        <label className="form-label">Bank Account *</label>
                        <input
                          type="text"
                          className={`form-input ${errors.bank_account ? 'error' : ''}`}
                          value={formData.bank_account}
                          onChange={(e) => setFormData({...formData, bank_account: e.target.value})}
                          placeholder="Enter bank account number"
                        />
                        {errors.bank_account && <div className="form-error">{errors.bank_account}</div>}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="form-group">
                        <label className="form-label">Fund Code *</label>
                        <input
                          type="text"
                          className={`form-input ${errors.fund_code ? 'error' : ''}`}
                          value={formData.fund_code}
                          onChange={(e) => setFormData({...formData, fund_code: e.target.value})}
                          placeholder="Enter fund code (e.g., GF-001)"
                        />
                        {errors.fund_code && <div className="form-error">{errors.fund_code}</div>}
                      </div>
                      <div className="form-group full-width">
                        <label className="form-label">Description *</label>
                        <textarea
                          className={`form-textarea ${errors.description ? 'error' : ''}`}
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                          placeholder="Enter fund description and purpose"
                          rows="3"
                        />
                        {errors.description && <div className="form-error">{errors.description}</div>}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  <i className="fas fa-times"></i> Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>}
                  {loading ? 'Updating...' : 'Update Recipient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingRecipient && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                <i className="fas fa-exclamation-triangle" style={{color: '#dc3545'}}></i> Confirm Delete
              </h3>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete <strong>{deletingRecipient.name}</strong>?</p>
              <p style={{color: '#dc3545', fontSize: '14px'}}>
                <i className="fas fa-exclamation-triangle"></i> This action cannot be undone and will affect transaction history.
              </p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                <i className="fas fa-times"></i> Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={handleDeleteRecipient} disabled={loading}>
                {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-trash"></i>}
                {loading ? 'Deleting...' : 'Delete Recipient'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {showNotificationModal && (
        <div className="modal-overlay" onClick={() => setShowNotificationModal(false)}>
          <div className="notification-modal" onClick={(e) => e.stopPropagation()}>
            <div className="notification-header">
              <div className={`notification-icon ${notification.type}`}>
                <i className={`fas fa-${notification.type === 'success' ? 'check-circle' : notification.type === 'error' ? 'times-circle' : 'exclamation-triangle'}`}></i>
              </div>
              <h3 className="notification-title">{notification.title}</h3>
              <p className="notification-message">{notification.message}</p>
            </div>
            <div className="notification-footer">
              <button className="btn btn-primary" onClick={() => setShowNotificationModal(false)}>
                <i className="fas fa-check"></i> OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipientAccount;
