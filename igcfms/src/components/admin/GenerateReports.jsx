import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { useQueryClient } from "@tanstack/react-query";
import "./css/generatereports.css";
import DailyKPI from "../analytics/ReportAnalysis/dailyKPI.jsx";
import MonthlyKPI from "../analytics/ReportAnalysis/monthlyKPI.jsx";
import YearlyKPI from "../analytics/ReportAnalysis/yearlyKPI.jsx";
import ReportPageSkeleton from "../ui/ReportPageSL.jsx";
import CollectionReportTab from "../reports/reportsTab/CollectionReportTab.jsx";
import { 
  useReports, 
  useTransactions, 
  useOverrideRequests, 
  useCreateReport, 
  useDeleteReport,
  REPORT_KEYS 
} from "../../hooks/useReports.js";

const API_BASE = require('../../config/api').default;
const REPORTS_PER_PAGE = 10;

const GenerateReports = ({ 
  user, 
  isCollectingOfficer = false, 
  isDisbursing = false,
  currentUserId = null, 
  currentUser = null,
  hideTransactionTab = false,
  hideOverrideTab = false,
  hideCollectionReportTab = false,
  filterTransactionsByCreator = false,
  hideTransactionActions = false
}) => {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filteredReports, setFilteredReports] = useState([]);
  
  // Use currentUser if provided, otherwise use user from props
  const effectiveUser = currentUser || user;
  const effectiveUserId = currentUserId || effectiveUser?.id;
  const [stats, setStats] = useState({
    totalReports: 0,
    dailyReports: 0,
    monthlyReports: 0,
    yearlyReports: 0
  });
  const [overrideStats, setOverrideStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });

  // Check if user is Admin
  const isAdmin = user?.role === 'Admin';
  
  // TanStack Query hooks
  const queryClient = useQueryClient();
  const { 
    data: reports = [], 
    isLoading: reportsLoading, 
    error: reportsError 
  } = useReports({ enabled: true });
  
  const { 
    data: transactions = [], 
    isLoading: transactionsLoading, 
    error: transactionsError 
  } = useTransactions({ enabled: true });
  
  const { 
    data: overrideRequests = [], 
    isLoading: overridesLoading, 
    error: overridesError 
  } = useOverrideRequests({ isAdmin, enabled: true });
  
  const createReportMutation = useCreateReport();
  const deleteReportMutation = useDeleteReport();
  
  const loading = reportsLoading || transactionsLoading || overridesLoading;

  // Report generation form
  const [reportForm, setReportForm] = useState({
    reportType: "daily",
    dateFrom: "",
    dateTo: "",
    department: "all",
    category: "all",
    includeTransactions: true,
    includeOverrides: false,
    format: "pdf"
  });

  // Filter states
  const [filters, setFilters] = useState({
    type: "all",
    dateFrom: "",
    dateTo: "",
    searchTerm: "",
    activeFilter: "all",
    showFilterDropdown: false
  });

  const [showGenerateFormModal, setShowGenerateFormModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportResult, setReportResult] = useState(null);
  const [openActionMenu, setOpenActionMenu] = useState(null);
  const [dropdownAbove, setDropdownAbove] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activityTab, setActivityTab] = useState('kpi');
  const [transactionFilters, setTransactionFilters] = useState({
    type: "all",
    dateFrom: "",
    dateTo: "",
    searchTerm: "",
    activeFilter: "all",
    showFilterDropdown: false
  });
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [pdfFileName, setPdfFileName] = useState(null);
  const [selectedReportType, setSelectedReportType] = useState('collection-or-fee-details');
  const [showReportTypeDropdown, setShowReportTypeDropdown] = useState(false);
  const [collectionReportFilters, setCollectionReportFilters] = useState({
    dateFrom: "",
    dateTo: "",
    searchTerm: ""
  });
  const [overrideRequestsPage, setOverrideRequestsPage] = useState(1);
  const OVERRIDE_REQUESTS_PER_PAGE = 10;
  const [overrideFilters, setOverrideFilters] = useState({
    status: "all",
    searchTerm: "",
    showFilterDropdown: false,
    dateFrom: "",
    dateTo: "",
    showExportDropdown: false
  });
  const [overridePdfPreviewUrl, setOverridePdfPreviewUrl] = useState(null);
  const [overridePdfFileName, setOverridePdfFileName] = useState(null);

  useEffect(() => {
    applyFilters();
  }, [reports, filters]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openActionMenu && !event.target.closest('.gr-action-menu-container')) {
        setOpenActionMenu(null);
      }
      if (filters.showFilterDropdown && !event.target.closest('.gr-filter-dropdown-container')) {
        setFilters(prev => ({ ...prev, showFilterDropdown: false }));
      }
      if (showReportTypeDropdown && !event.target.closest('.gr-report-type-dropdown-container')) {
        setShowReportTypeDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openActionMenu, filters.showFilterDropdown, showReportTypeDropdown]);

  // Detect if dropdown should appear above
  useEffect(() => {
    if (openActionMenu) {
      setTimeout(() => {
        const menuButton = document.querySelector(`[data-report-id="${openActionMenu}"]`);
        if (menuButton) {
          const rect = menuButton.getBoundingClientRect();
          const dropdownHeight = 150; // Approximate height of dropdown
          const spaceBelow = window.innerHeight - rect.bottom;
          
          // If less than 300px space below, show dropdown above (covers last 2 rows)
          if (spaceBelow < 300) {
            setDropdownAbove(true);
          } else {
            setDropdownAbove(false);
          }
        }
      }, 0);
    }
  }, [openActionMenu]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredReports.length]);

  useEffect(() => {
    const totalPagesForData = Math.max(1, Math.ceil(filteredReports.length / REPORTS_PER_PAGE));
    if (currentPage > totalPagesForData) {
      setCurrentPage(totalPagesForData);
    }
  }, [filteredReports.length, currentPage]);

  // Update stats when reports change
  useEffect(() => {
    if (reports && reports.length > 0) {
      setStats({
        totalReports: reports.length,
        dailyReports: reports.filter(r => r.report_type === 'daily').length,
        monthlyReports: reports.filter(r => r.report_type === 'monthly').length,
        yearlyReports: reports.filter(r => r.report_type === 'yearly').length
      });
    }
  }, [reports]);
  
  // Update override stats when overrides change
  useEffect(() => {
    if (overrideRequests && overrideRequests.length > 0) {
      setOverrideStats({
        total: overrideRequests.length,
        pending: overrideRequests.filter(req => req.status === 'pending').length,
        approved: overrideRequests.filter(req => req.status === 'approved').length,
        rejected: overrideRequests.filter(req => req.status === 'rejected').length
      });
    }
  }, [overrideRequests]);

  const applyFilters = () => {
    let filtered = [...reports];

    // Type filter
    if (filters.type !== "all") {
      filtered = filtered.filter(report => report.report_type === filters.type);
    }

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(report => 
        new Date(report.generated_at) >= new Date(filters.dateFrom)
      );
    }
    if (filters.dateTo) {
      filtered = filtered.filter(report => 
        new Date(report.generated_at) <= new Date(filters.dateTo + "T23:59:59")
      );
    }

    // Search term filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(report => 
        report.report_type?.toLowerCase().includes(searchLower) ||
        report.generated_by?.name?.toLowerCase().includes(searchLower) ||
        report.id.toString().includes(searchLower) ||
        report.format?.toLowerCase().includes(searchLower)
      );
    }

    // Apply active filter (sort or filter based on selection)
    if (filters.activeFilter === 'latest') {
      filtered.sort((a, b) => new Date(b.generated_at) - new Date(a.generated_at));
    } else if (filters.activeFilter === 'oldest') {
      filtered.sort((a, b) => new Date(a.generated_at) - new Date(b.generated_at));
    } else if (filters.activeFilter === 'type-asc') {
      filtered.sort((a, b) => a.report_type.localeCompare(b.report_type));
    } else if (filters.activeFilter === 'type-desc') {
      filtered.sort((a, b) => b.report_type.localeCompare(a.report_type));
    } else if (filters.activeFilter === 'daily') {
      filtered = filtered.filter(report => (report.report_type || '').toLowerCase() === 'daily');
    } else if (filters.activeFilter === 'monthly') {
      filtered = filtered.filter(report => (report.report_type || '').toLowerCase() === 'monthly');
    } else if (filters.activeFilter === 'yearly') {
      filtered = filtered.filter(report => (report.report_type || '').toLowerCase() === 'yearly');
    }

    setFilteredReports(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      type: "all",
      dateFrom: "",
      dateTo: "",
      searchTerm: ""
    });
  };

  const handleFormChange = (field, value) => {
    setReportForm(prev => ({
      ...prev,
      [field]: value
    }));
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

  const validateReportForm = () => {
    const { reportType, dateFrom, dateTo } = reportForm;

    if (!reportType) {
      showMessage("Please select a report type.", 'error');
      return false;
    }
    
    if (dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo)) {
      showMessage("Start date cannot be after end date.", 'error');
      return false;
    }

    return true;
  };

  const handleGenerateReport = () => {
    setShowGenerateModal(true);
  };

  const confirmGenerateReport = async () => {
    try {
      // Always include transaction details and override records
      const payload = {
        report_type: reportForm.reportType,
        date_from: reportForm.dateFrom || null,
        date_to: reportForm.dateTo || null,
        department: reportForm.department !== 'all' ? reportForm.department : null,
        category: reportForm.category !== 'all' ? reportForm.category : null,
        include_transactions: true, // Always include
        include_overrides: true, // Always include
        format: reportForm.format
      };

      // For Excel format, generate Excel file directly
      if (reportForm.format === 'excel') {
        generateExcelReport(payload);
        setShowGenerateModal(false);
        showMessage("Excel report generated successfully!");
        return;
      }

      const response = await createReportMutation.mutateAsync(payload);

      setReportResult({
        id: response.id || response.data?.id,
        reportType: reportForm.reportType,
        format: reportForm.format,
        filePath: response.file_path || response.data?.file_path,
        generatedAt: new Date().toISOString()
      });

      setShowGenerateModal(false);
      showMessage("Report generated successfully!");

    } catch (err) {
      console.error("Error generating report:", err);
      if (err.response?.status === 422 && err.response.data?.errors) {
        const errorMessages = Object.values(err.response.data.errors)
          .flat()
          .join(", ");
        showMessage(`Validation error: ${errorMessages}`, 'error');
      } else {
        showMessage(err.response?.data?.message || "Failed to generate report.", 'error');
      }
    }
  };

  const generateExcelReport = (payload) => {
    // Filter transactions based on report type and date range
    let reportTransactions = transactions;
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    
    // Determine date range based on report type if not explicitly provided
    let dateFrom = payload.date_from;
    let dateTo = payload.date_to;
    
    if (!dateFrom && !dateTo) {
      if (payload.report_type === 'yearly') {
        // For yearly reports without explicit dates, use current year
        dateFrom = `${currentYear}-01-01`;
        dateTo = `${currentYear}-12-31`;
      } else if (payload.report_type === 'monthly') {
        // For monthly reports without explicit dates, use current month
        const monthStr = String(currentMonth + 1).padStart(2, '0');
        dateFrom = `${currentYear}-${monthStr}-01`;
        const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
        dateTo = `${currentYear}-${monthStr}-${lastDay}`;
      } else {
        // For daily reports without explicit dates, use today
        const today = new Date().toISOString().split('T')[0];
        dateFrom = today;
        dateTo = today;
      }
    }
    
    // Filter transactions based on date range
    reportTransactions = reportTransactions.filter(t => {
      const txDate = new Date(t.created_at || t.createdAt);
      if (dateFrom && txDate < new Date(dateFrom)) return false;
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (txDate > toDate) return false;
      }
      return true;
    });

    // Filter override requests based on date range
    let reportOverrides = overrideRequests;
    reportOverrides = reportOverrides.filter(o => {
      const oDate = new Date(o.created_at || o.reviewed_at);
      if (dateFrom && oDate < new Date(dateFrom)) return false;
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (oDate > toDate) return false;
      }
      return true;
    });

    // Create workbook with multiple sheets
    const wb = XLSX.utils.book_new();

    // Sheet 1: Report Summary
    const summaryData = [
      ['Report Summary'],
      [],
      ['Report Type', payload.report_type],
      ['Generated Date', new Date().toLocaleString()],
      ['Generated By', user?.name || 'System'],
      ['Role', user?.role || 'N/A'],
      ['Date From', dateFrom || 'All'],
      ['Date To', dateTo || 'All'],
      [],
      ['Total Transactions', reportTransactions.length],
      ['Total Override Records', reportOverrides.length]
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    // Sheet 2: Transactions
    const transactionData = [
      ['ID', 'Type', 'Amount', 'Recipient/Payer', 'Created By', 'Role', 'Date', 'Time'],
      ...reportTransactions.map(tx => [
        tx.id,
        tx.transaction_type || tx.type || 'Unknown',
        tx.amount,
        tx.recipient || tx.payee || 'N/A',
        tx.created_by?.name || tx.creator?.name || tx.user?.name || 'System',
        tx.created_by?.role || tx.creator?.role || tx.user?.role || 'N/A',
        new Date(tx.created_at).toLocaleDateString(),
        new Date(tx.created_at).toLocaleTimeString()
      ])
    ];
    const wsTransactions = XLSX.utils.aoa_to_sheet(transactionData);
    XLSX.utils.book_append_sheet(wb, wsTransactions, 'Transactions');

    // Sheet 3: Override Records
    const overrideData = [
      ['ID', 'Transaction ID', 'Status', 'Requested By', 'Reviewed By', 'Reason', 'Date', 'Display Type'],
      ...reportOverrides.map(o => [
        o.id,
        o.transaction_id,
        o.status || 'pending',
        o.requested_by?.name || 'N/A',
        o.reviewed_by?.name || 'Pending',
        o.reason || 'N/A',
        new Date(o.created_at || o.reviewed_at).toLocaleDateString(),
        'Override/Cancel'
      ])
    ];
    const wsOverrides = XLSX.utils.aoa_to_sheet(overrideData);
    XLSX.utils.book_append_sheet(wb, wsOverrides, 'Override Records');

    // Generate file
    const fileName = `Report_${payload.report_type}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const viewReportDetails = (report) => {
    setSelectedReport(report);
    setShowPreviewModal(true);
  };

  const generateReportPDF = (report, allTransactions = []) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Add header
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    // Title - Dynamic based on report type
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    const reportTypeTitle = (report.report_type || 'daily').toUpperCase();
    doc.text(`${reportTypeTitle} REPORT`, 15, 15);
    
    // Report info
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, 15, 25);
    
    let yPos = 45;
    
    // Get user data
    const userData = report.generated_by && typeof report.generated_by === 'object'
      ? report.generated_by
      : null;
    const isAdmin = userData?.role === 'Admin';
    const reportGeneratorId = userData?.id;
    
    // Determine report scope based on role
    const reportScope = isAdmin 
      ? 'All System Transactions' 
      : `Transactions Created by ${userData?.name || 'User'}`;
    
    // Report details section
    doc.setTextColor(0, 0, 0);
    doc.setFillColor(0, 0, 0);
    doc.rect(10, yPos, pageWidth - 20, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('REPORT INFORMATION', 15, yPos + 5.5);
    
    yPos += 15;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    
    // Report info table
    autoTable(doc, {
      startY: yPos,
      head: [['Field', 'Value']],
      body: [
        ['Report ID', `#${report.id}`],
        ['Report Type', report.report_type || 'Daily'],
        ['Status', report.status || 'Generated'],
        ['Generated By', userData?.name || 'System'],
        ['Role', userData?.role || 'N/A'],
        ['Report Scope', reportScope],
        ['Generated Date', new Date(report.generated_at).toLocaleString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit', 
          minute: '2-digit'
        })]
      ],
      theme: 'grid',
      headStyles: {
        fillColor: [0, 0, 0],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 9
      },
      columnStyles: {
        0: { cellWidth: 50, fontStyle: 'bold', textColor: [107, 114, 128] },
        1: { cellWidth: 'auto' }
      },
      margin: { left: 15, right: 15 }
    });
    
    yPos = doc.lastAutoTable.finalY + 15;
    
    // Get transactions based on report type
    const reportDate = new Date(report.generated_at);
    let dayTransactions = allTransactions.filter(t => {
      const txDate = new Date(t.created_at || t.createdAt);
      
      // Filter based on report type
      if (report.report_type === 'yearly') {
        // For yearly reports, include all transactions from that year
        return txDate.getFullYear() === reportDate.getFullYear();
      } else if (report.report_type === 'monthly') {
        // For monthly reports, include all transactions from that month
        return txDate.getFullYear() === reportDate.getFullYear() &&
               txDate.getMonth() === reportDate.getMonth();
      } else {
        // For daily reports, include only transactions from that day
        const txDateStr = txDate.toISOString().split('T')[0];
        const reportDateStr = reportDate.toISOString().split('T')[0];
        return txDateStr === reportDateStr;
      }
    });
    
    // If not admin, filter to only show transactions created by this user
    if (!isAdmin && reportGeneratorId) {
      dayTransactions = dayTransactions.filter(t => {
        const txCreatorId = t.created_by?.id || t.creator?.id || t.user?.id;
        return txCreatorId === reportGeneratorId;
      });
    }
    
    // Transactions section
    doc.setFillColor(0, 0, 0);
    doc.rect(10, yPos, pageWidth - 20, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text(`TRANSACTIONS (${dayTransactions.length} total)`, 15, yPos + 5.5);
    
    yPos += 15;
    
    if (dayTransactions.length > 0) {
      // Calculate totals
      const totalCollections = dayTransactions
        .filter(t => (t.transaction_type || t.type || '').toLowerCase() === 'collection')
        .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0);
      
      const totalDisbursements = dayTransactions
        .filter(t => (t.transaction_type || t.type || '').toLowerCase() === 'disbursement')
        .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0);
      
      // Summary table
      autoTable(doc, {
        startY: yPos,
        head: [['Metric', 'Count', 'Amount']],
        body: [
          ['Collections', dayTransactions.filter(t => (t.transaction_type || t.type || '').toLowerCase() === 'collection').length, `PHP ${totalCollections.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`],
          ['Disbursements', dayTransactions.filter(t => (t.transaction_type || t.type || '').toLowerCase() === 'disbursement').length, `PHP ${totalDisbursements.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`],
          ['Net Balance', '-', `PHP ${(totalCollections - totalDisbursements).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`]
        ],
        theme: 'grid',
        headStyles: {
          fillColor: [0, 0, 0],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10
        },
        bodyStyles: {
          fontSize: 9
        },
        columnStyles: {
          0: { cellWidth: 70, fontStyle: 'bold', textColor: [107, 114, 128] },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 85, halign: 'right', fontStyle: 'bold' }
        },
        didParseCell: function(data) {
          if (data.row.index === 0 && data.column.index === 2) {
            data.cell.styles.textColor = [22, 101, 52]; // Green for collections
          }
          if (data.row.index === 1 && data.column.index === 2) {
            data.cell.styles.textColor = [153, 27, 27]; // Red for disbursements
          }
        },
        margin: { left: 15, right: 15 }
      });
      
      yPos = doc.lastAutoTable.finalY + 15;
      
      // Detailed transactions table
      doc.setFillColor(240, 240, 240);
      doc.rect(10, yPos, pageWidth - 20, 8, 'F');
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('TRANSACTION DETAILS', 15, yPos + 5.5);
      
      yPos += 12;
      
      const transactionRows = dayTransactions.map(tx => {
        const creatorName = tx.created_by?.name || tx.creator?.name || tx.user?.name || 'System';
        const creatorRole = tx.created_by?.role || tx.creator?.role || tx.user?.role || 'N/A';
        const amount = Math.abs(parseFloat(tx.amount) || 0);
        
        return [
          `#${tx.id}`,
          (tx.transaction_type || tx.type || 'Unknown').toUpperCase(),
          `PHP ${amount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
          tx.recipient || tx.payee || 'N/A',
          creatorName,
          creatorRole,
          new Date(tx.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        ];
      });
      
      autoTable(doc, {
        startY: yPos,
        head: [['ID', 'Type', 'Amount', 'Recipient/Payer', 'Created By', 'Role', 'Time']],
        body: transactionRows,
        theme: 'grid',
        headStyles: {
          fillColor: [0, 0, 0],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'center'
        },
        bodyStyles: {
          fontSize: 8
        },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center' },
          1: { cellWidth: 18, halign: 'center' },
          2: { cellWidth: 22, halign: 'right', fontStyle: 'bold' },
          3: { cellWidth: 25, halign: 'left' },
          4: { cellWidth: 28, halign: 'left' },
          5: { cellWidth: 22, halign: 'left' },
          6: { cellWidth: 18, halign: 'center' }
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250]
        },
        didParseCell: function(data) {
          if (data.column.index === 2) {
            const cellValue = data.cell.text[0];
            if (cellValue && cellValue.includes('Collection')) {
              data.cell.styles.textColor = [22, 101, 52];
            } else if (cellValue && cellValue.includes('Disbursement')) {
              data.cell.styles.textColor = [153, 27, 27];
            }
          }
        },
        margin: { left: 10, right: 10 }
      });
    } else {
      // No transactions message
      doc.setTextColor(128, 128, 128);
      doc.setFontSize(10);
      doc.text('No transactions recorded for this day.', 15, yPos + 10);
    }
    
    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - 15, pageHeight - 8, { align: 'right' });
      doc.text('IGCFMS - Integrated Government Collections and Funds Management System', pageWidth / 2, pageHeight - 3, { align: 'center' });
    }
    
    return doc;
  };

  const downloadReport = async (report) => {
    try {
      // If format is Excel, generate and download Excel file directly
      if (report.format === 'excel') {
        const payload = {
          report_type: report.report_type,
          date_from: null,
          date_to: null,
          department: null,
          category: null,
          include_transactions: true,
          include_overrides: true,
          format: 'excel'
        };
        generateExcelReport(payload);
        showMessage('Excel report downloaded successfully', 'success');
        return;
      }

      // If file_path exists, try to download from server
      if (report.file_path) {
        const token = localStorage.getItem('token');
        const downloadUrl = `${API_BASE}/${report.file_path}`;
        
        // Use fetch to handle authentication properly
        const response = await fetch(downloadUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Get the blob
        const blob = await response.blob();
        
        // Create a temporary link element for download
        const link = document.createElement('a');
        const url = window.URL.createObjectURL(blob);
        link.href = url;
        link.download = report.file_name || `report_${report.id}.${report.format || 'pdf'}`;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the object URL
        window.URL.revokeObjectURL(url);
        
        showMessage('Download started', 'success');
        return;
      }

      // If no file_path, generate PDF on-the-fly and show preview
      const doc = generateReportPDF(report, transactions);
      const fileName = `report_${report.id}_${new Date().toISOString().split('T')[0]}.pdf`;
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      setPdfPreviewUrl(pdfUrl);
      setPdfFileName(fileName);
      setShowPDFPreview(true);
    } catch (error) {
      console.error('Download error:', error);
      showMessage('Failed to download report. Please try again.', 'error');
    }
  };

  const handleDeleteReport = async () => {
    if (!reportToDelete) return;

    try {
      await deleteReportMutation.mutateAsync(reportToDelete.id);
      showMessage('Report deleted successfully!', 'success');
      setShowDeleteModal(false);
      setReportToDelete(null);
    } catch (err) {
      console.error('Error deleting report:', err);
      showMessage(err?.response?.data?.message || 'Failed to delete report.', 'error');
    }
  };

  const getTransactionDisplayType = useMemo(() => {
    return (transaction) => {
      if (!transaction) return 'Unknown';

      const receipt = transaction.receipt_no || transaction.reference_no || '';

      if (transaction.type === 'Override') {
        return 'Cancelled';
      }

      if (typeof receipt === 'string' && receipt.startsWith('OVR-')) {
        return 'Override';
      }

      return transaction.type || 'Unknown';
    };
  }, []);

  const filteredTransactions = useMemo(() => {
    let filtered = transactions.filter(transaction => {
      // Filter by creator for collecting officers
      // NOTE: This filtering is disabled until backend API includes creator_id in transaction response
      // if (filterTransactionsByCreator && effectiveUserId) {
      //   // Check multiple possible creator ID fields
      //   const creatorId = transaction.creator_id || 
      //                    transaction.created_by?.id ||
      //                    transaction.created_by || 
      //                    transaction.user_id ||
      //                    transaction.user?.id ||
      //                    transaction.created_by_id ||
      //                    transaction.creator?.id ||
      //                    transaction.issuing_officer_id ||
      //                    transaction.disbursing_officer_id ||
      //                    transaction.collecting_officer_id ||
      //                    transaction.issued_by_id ||
      //                    transaction.issued_by?.id;
      //   
      //   const creatorObjectId = transaction.creator?.id || transaction.created_by?.id || transaction.user?.id || transaction.issued_by?.id;
      //   const effectiveUserIdStr = String(effectiveUserId);
      //   const creatorIdStr = String(creatorId);
      //   const creatorObjectIdStr = creatorObjectId ? String(creatorObjectId) : null;
      //   
      //   const isCreator = (creatorIdStr === effectiveUserIdStr) || 
      //                    (creatorObjectIdStr === effectiveUserIdStr) ||
      //                    (parseInt(creatorId) === parseInt(effectiveUserId));
      //   
      //   if (!isCreator) {
      //     return false;
      //   }
      // }

      // Type filter
      if (transactionFilters.type !== "all" && transaction.type !== transactionFilters.type) {
        return false;
      }

      // Date range filter
      if (transactionFilters.dateFrom && new Date(transaction.created_at) < new Date(transactionFilters.dateFrom)) {
        return false;
      }
      if (transactionFilters.dateTo && new Date(transaction.created_at) > new Date(transactionFilters.dateTo + "T23:59:59")) {
        return false;
      }

      // Search filter
      if (transactionFilters.searchTerm) {
        const searchLower = transactionFilters.searchTerm.toLowerCase();
        return (
          transaction.id?.toString().includes(searchLower) ||
          transaction.type?.toLowerCase().includes(searchLower) ||
          transaction.description?.toLowerCase().includes(searchLower) ||
          transaction.recipient?.toLowerCase().includes(searchLower) ||
          transaction.department?.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });

    // Apply sorting based on activeFilter
    if (transactionFilters.activeFilter === 'latest') {
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (transactionFilters.activeFilter === 'oldest') {
      filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else if (transactionFilters.activeFilter === 'highest') {
      filtered.sort((a, b) => parseFloat(b.amount || 0) - parseFloat(a.amount || 0));
    } else if (transactionFilters.activeFilter === 'lowest') {
      filtered.sort((a, b) => parseFloat(a.amount || 0) - parseFloat(b.amount || 0));
    } else if (transactionFilters.activeFilter === 'collections') {
      filtered = filtered.filter(tx => tx.type === 'Collection');
    } else if (transactionFilters.activeFilter === 'disbursements') {
      filtered = filtered.filter(tx => tx.type === 'Disbursement');
    }

    return filtered;
  }, [transactions, transactionFilters, filterTransactionsByCreator, effectiveUserId]);

  const handleTransactionFilterChange = (key, value) => {
    setTransactionFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearTransactionFilters = () => {
    setTransactionFilters({
      type: "all",
      dateFrom: "",
      dateTo: "",
      searchTerm: "",
      activeFilter: "all",
      showFilterDropdown: false
    });
  };

  const exportTransactionsToPDF = () => {
    const doc = new jsPDF();
    const filename = `transactions_${new Date().toISOString().split('T')[0]}.pdf`;
    
    // Add header
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, 210, 35, 'F');
    
    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('TRANSACTION REPORT', 15, 15);
    
    // Report info
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, 15, 25);
    
    // Created by info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Report Details', 15, 45);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Created By: ${user?.name || 'System'}`, 15, 52);
    doc.text(`Role: ${user?.role || 'N/A'}`, 15, 59);
    doc.text(`Total Transactions: ${filteredTransactions.length}`, 15, 66);
    
    // Date filter info
    let dateFilterText = 'Date Range: All Dates';
    if (transactionFilters.dateFrom && transactionFilters.dateTo) {
      dateFilterText = `Date Range: ${new Date(transactionFilters.dateFrom).toLocaleDateString()} to ${new Date(transactionFilters.dateTo).toLocaleDateString()}`;
    } else if (transactionFilters.dateFrom) {
      dateFilterText = `Date Range: From ${new Date(transactionFilters.dateFrom).toLocaleDateString()}`;
    } else if (transactionFilters.dateTo) {
      dateFilterText = `Date Range: Until ${new Date(transactionFilters.dateTo).toLocaleDateString()}`;
    }
    doc.text(dateFilterText, 15, 73);
    
    // Calculate totals
    const totalCollections = filteredTransactions
      .filter(tx => tx.type === 'Collection')
      .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
    
    const totalDisbursements = filteredTransactions
      .filter(tx => tx.type === 'Disbursement')
      .reduce((sum, tx) => sum + Math.abs(parseFloat(tx.amount || 0)), 0);
    
    doc.setFillColor(240, 240, 240);
    doc.rect(15, 78, 180, 20, 'F');
    doc.setFont(undefined, 'bold');
    doc.text(`Total Collections: PHP ${totalCollections.toLocaleString()}`, 20, 85);
    doc.text(`Total Disbursements: PHP ${totalDisbursements.toLocaleString()}`, 20, 93);
    
    // Table data
    const tableData = filteredTransactions.map(transaction => {
      const displayType = getTransactionDisplayType(transaction);
      const amountValue = parseFloat(transaction.amount || 0);
      const amountPrefix = amountValue >= 0 ? '' : '-';
      
      // Try multiple possible fields for creator name
      const creatorName = 
        transaction.created_by?.name || 
        transaction.user?.name || 
        transaction.creator?.name ||
        transaction.created_by_name ||
        transaction.creator_name ||
        transaction.issuing_officer_name ||
        transaction.disbursing_officer_name ||
        transaction.collecting_officer_name ||
        'System';
      
      return [
        transaction.id,
        displayType,
        `${amountPrefix}PHP ${Math.abs(amountValue).toLocaleString()}`,
        transaction.recipient || 'N/A',
        transaction.payee_id || transaction.recipient_id || 'N/A',
        creatorName,
        transaction.description || 'N/A'
      ];
    });
    
    // Add table
    autoTable(doc, {
      startY: 103,
      head: [['ID', 'Type', 'Amount', 'Recipient/Payer', 'Payee ID', 'Created By', 'Description']],
      body: tableData,
      headStyles: {
        fillColor: [0, 0, 0],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
        halign: 'center'
      },
      bodyStyles: {
        textColor: [0, 0, 0],
        fontSize: 9
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { left: 15, right: 15 },
      columnStyles: {
        0: { halign: 'center', cellWidth: 12 },
        1: { halign: 'center', cellWidth: 20 },
        2: { halign: 'right', cellWidth: 25 },
        3: { halign: 'left', cellWidth: 28 },
        4: { halign: 'center', cellWidth: 20 },
        5: { halign: 'left', cellWidth: 25 },
        6: { halign: 'left', cellWidth: 30 }
      }
    });
    
    // Add footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(128, 128, 128);
      doc.text(`Page ${i} of ${pageCount}`, 195, 285, { align: 'right' });
      doc.text('IGCFMS - Integrated Government Collections and Funds Management System', 105, 290, { align: 'center' });
    }
    
    // Generate PDF blob and create preview URL
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    setPdfPreviewUrl(pdfUrl);
    setPdfFileName(filename);
    setShowPDFPreview(true);
  };

  const downloadPDFFromPreview = () => {
    if (pdfPreviewUrl && pdfFileName) {
      const link = document.createElement('a');
      link.href = pdfPreviewUrl;
      link.download = pdfFileName;
      link.click();
    }
  };

  const closePDFPreview = () => {
    if (pdfPreviewUrl) {
      URL.revokeObjectURL(pdfPreviewUrl);
    }
    if (overridePdfPreviewUrl) {
      URL.revokeObjectURL(overridePdfPreviewUrl);
    }
    setShowPDFPreview(false);
    setPdfPreviewUrl(null);
    setPdfFileName(null);
    setOverridePdfPreviewUrl(null);
    setOverridePdfFileName(null);
  };

  const downloadPDFFromOverridePreview = () => {
    if (!overridePdfPreviewUrl) return;
    const link = document.createElement('a');
    link.href = overridePdfPreviewUrl;
    link.download = overridePdfFileName || 'override_requests.pdf';
    link.click();
  };

  const exportCollectionReportPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 15;

    // Add generated timestamp at top right
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - 15, yPosition, { align: 'right' });
    yPosition += 8;

    // Add main title
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Integrated Government Cashiering and Financial Management System (IGCFMS)', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 6;

    // Add report type
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    const reportTypeLabel = selectedReportType === 'collection-or-fee-details' ? 'Collection Reportby O.R Fee Details' :
                           selectedReportType === 'collection-or-fee-summary' ? 'Collection Reportby O.R Fee Summary' :
                           selectedReportType === 'collection-or-details' ? 'Collection Reportby O.R Details' :
                           'Collection Reportby O.R Summary';
    doc.text(reportTypeLabel, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 6;

    // Add date range
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    if (collectionReportFilters.dateFrom || collectionReportFilters.dateTo) {
      const dateRange = `${collectionReportFilters.dateFrom || 'N/A'} to ${collectionReportFilters.dateTo || 'N/A'}`;
      doc.text(dateRange, pageWidth / 2, yPosition, { align: 'center' });
    } else {
      doc.text('All Dates', pageWidth / 2, yPosition, { align: 'center' });
    }
    yPosition += 10;

    // Prepare table data based on selected report type
    let tableData = [];
    let headers = [];

    if (selectedReportType === 'collection-or-fee-details') {
      // Fee details format - grouped by funds account with collections and totals
      headers = ['Funds Account Code', 'Funds Account Name', 'O.R #', 'Amount Paid'];
      tableData = [];
      
      // Group items by fund account
      const groupedByFund = {};
      groupedCollectionsByReceipt.forEach((collection) => {
        if (collection.items && Array.isArray(collection.items)) {
          collection.items.forEach((item) => {
            const fundKey = item.fund_account?.code || 'N/A';
            if (!groupedByFund[fundKey]) {
              groupedByFund[fundKey] = {
                code: item.fund_account?.code || 'N/A',
                name: item.fund_account?.name || item.fundAccountName || 'N/A',
                collections: []
              };
            }
            groupedByFund[fundKey].collections.push({
              receipt_no: collection.receipt_no,
              amount: item.amount
            });
          });
        }
      });
      
      // Build table data with grouping
      Object.values(groupedByFund).forEach((fund) => {
        const totalAmount = fund.collections.reduce((sum, col) => sum + parseFloat(col.amount || 0), 0);
        fund.collections.forEach((col, idx) => {
          // First item - show fund code and name
          if (idx === 0) {
            tableData.push([
              fund.code,
              fund.name,
              col.receipt_no || 'N/A',
              `PHP ${parseFloat(col.amount || 0).toLocaleString()}`
            ]);
          } else {
            // Other items - empty fund code and name
            tableData.push([
              '',
              '',
              col.receipt_no || 'N/A',
              `PHP ${parseFloat(col.amount || 0).toLocaleString()}`
            ]);
          }
        });
        // Total row
        tableData.push([
          '',
          '',
          'Total:',
          `PHP ${totalAmount.toLocaleString()}`
        ]);
      });
    } else if (selectedReportType === 'collection-or-fee-summary') {
      // Fee summary format - only funds account code, name, and amount
      headers = ['Funds Account Code', 'Funds Account Name', 'Amount'];
      tableData = [];
      groupedCollectionsByReceipt.forEach((collection) => {
        if (collection.items && Array.isArray(collection.items) && collection.items.length > 0) {
          collection.items.forEach((item) => {
            tableData.push([
              item.fund_account?.code || 'N/A',
              item.fund_account?.name || item.fundAccountName || 'N/A',
              `PHP ${parseFloat(item.amount || 0).toLocaleString()}`
            ]);
          });
        }
      });
    } else if (selectedReportType === 'collection-or-details') {
      // Grouped funds accounts format
      headers = ['O.R Number', 'Payee ID', 'Payee', 'Funds Accounts & Amount Paid'];
      tableData = groupedCollectionsByReceipt.map(collection => [
        collection.receipt_no || 'N/A',
        collection.payee_id || 'N/A',
        collection.recipient || 'N/A',
        collection.items?.map(item => `${item.fund_account?.name || item.fundAccountName || 'N/A'}: PHP ${parseFloat(item.amount || 0).toLocaleString()}`).join('\n') + `\nTOTAL: PHP ${parseFloat(collection.totalAmount || 0).toLocaleString()}` || 'N/A'
      ]);
    } else {
      // Summary format
      headers = ['O.R Number', 'Payee ID', 'Payee', 'Total Amount'];
      tableData = groupedCollectionsByReceipt.map(collection => [
        collection.receipt_no || 'N/A',
        collection.payee_id || 'N/A',
        collection.recipient || 'N/A',
        `PHP ${parseFloat(collection.totalAmount || 0).toLocaleString()}`
      ]);
    }

    // Add table with matching format
    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: yPosition,
      theme: 'grid',
      headStyles: {
        fillColor: [0, 0, 0],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 11,
        halign: 'center',
        valign: 'middle',
        cellPadding: 4
      },
      bodyStyles: {
        textColor: [0, 0, 0],
        fontSize: 10,
        halign: 'left',
        valign: 'top',
        cellPadding: 4
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250]
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 'auto' },
        1: { halign: 'left', cellWidth: 'auto' },
        2: { halign: 'left', cellWidth: 'auto' },
        3: { halign: 'left', cellWidth: 'auto' }
      },
      margin: { top: 10, right: 10, bottom: 20, left: 10 },
      didDrawPage: (data) => {
        // Footer
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(9);
        doc.setTextColor(128, 128, 128);
        doc.text(`Page ${data.pageNumber} of ${pageCount}`, pageWidth - 15, pageHeight - 8, { align: 'right' });
        doc.text('IGCFMS - Integrated Government Collections and Funds Management System', pageWidth / 2, pageHeight - 8, { align: 'center' });
      }
    });

    // Generate filename
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Collection_Report_${reportTypeLabel.replace(/\s+/g, '_')}_${dateStr}.pdf`;

    // Generate PDF blob and create preview URL
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    setPdfPreviewUrl(pdfUrl);
    setPdfFileName(filename);
    setShowPDFPreview(true);
  };

  const groupedCollectionsByReceipt = useMemo(() => {
    let collections = transactions.filter(tx => tx.type === 'Collection');
    
    // Apply date filters
    if (collectionReportFilters.dateFrom) {
      const dateFrom = new Date(collectionReportFilters.dateFrom);
      collections = collections.filter(tx => new Date(tx.created_at) >= dateFrom);
    }
    if (collectionReportFilters.dateTo) {
      const dateTo = new Date(collectionReportFilters.dateTo);
      dateTo.setHours(23, 59, 59, 999); // Include entire day
      collections = collections.filter(tx => new Date(tx.created_at) <= dateTo);
    }
    
    // Apply search filter
    if (collectionReportFilters.searchTerm) {
      const searchLower = collectionReportFilters.searchTerm.toLowerCase();
      collections = collections.filter(tx => 
        (tx.receipt_no && tx.receipt_no.toLowerCase().includes(searchLower)) ||
        (tx.recipient && tx.recipient.toLowerCase().includes(searchLower)) ||
        (tx.payee_id && tx.payee_id.toString().includes(searchLower))
      );
    }
    
    const grouped = {};
    
    collections.forEach(collection => {
      const receiptNo = collection.receipt_no || `TXN-${collection.id}`;
      if (!grouped[receiptNo]) {
        grouped[receiptNo] = {
          receipt_no: receiptNo,
          recipient: collection.recipient,
          payee_id: null, // Will be set to the first non-null value
          created_at: collection.created_at,
          items: []
        };
      }
      
      // Set payee_id to the first non-null value found
      if (!grouped[receiptNo].payee_id) {
        grouped[receiptNo].payee_id = collection.recipientAccount?.id || collection.recipient_account_id || collection.payee_id || collection.recipient_id || null;
      }
      
      grouped[receiptNo].items.push({
        id: collection.id,
        amount: collection.amount,
        fund_account: collection.fundAccount || collection.fund_account,
        fundAccountName: collection.fundAccount?.name || collection.fund_account?.name
      });
    });
    
    return Object.values(grouped).map(group => ({
      ...group,
      payee_id: group.payee_id || 'N/A',
      totalAmount: group.items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0)
    }));
  }, [transactions, collectionReportFilters]);

  const recentOverrideRequests = useMemo(() => {
    if (!overrideRequests || overrideRequests.length === 0) return [];

    let filtered = [...overrideRequests];

    // Status filter
    if (overrideFilters.status !== "all") {
      filtered = filtered.filter(req => req.status === overrideFilters.status);
    }

    // Search term filter
    if (overrideFilters.searchTerm) {
      const searchLower = overrideFilters.searchTerm.toLowerCase();
      filtered = filtered.filter(req => 
        req.id?.toString().includes(searchLower) ||
        req.transaction_id?.toString().includes(searchLower) ||
        req.requested_by?.name?.toLowerCase().includes(searchLower) ||
        req.reviewed_by?.name?.toLowerCase().includes(searchLower)
      );
    }

    // Sort by latest first
    const sorted = filtered.sort((a, b) => new Date(b.created_at || b.reviewed_at || 0) - new Date(a.created_at || a.reviewed_at || 0));
    
    const startIndex = (overrideRequestsPage - 1) * OVERRIDE_REQUESTS_PER_PAGE;
    const endIndex = startIndex + OVERRIDE_REQUESTS_PER_PAGE;
    
    return sorted.slice(startIndex, endIndex);
  }, [overrideRequests, overrideRequestsPage, overrideFilters]);

  const filteredOverrideRequests = useMemo(() => {
    if (!overrideRequests || overrideRequests.length === 0) return [];

    let filtered = [...overrideRequests];

    // Status filter
    if (overrideFilters.status !== "all") {
      filtered = filtered.filter(req => req.status === overrideFilters.status);
    }

    // Search term filter
    if (overrideFilters.searchTerm) {
      const searchLower = overrideFilters.searchTerm.toLowerCase();
      filtered = filtered.filter(req => 
        req.id?.toString().includes(searchLower) ||
        req.transaction_id?.toString().includes(searchLower) ||
        req.requested_by?.name?.toLowerCase().includes(searchLower) ||
        req.reviewed_by?.name?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [overrideRequests, overrideFilters]);

  const totalOverridePages = useMemo(() => {
    if (!filteredOverrideRequests || filteredOverrideRequests.length === 0) return 1;
    return Math.ceil(filteredOverrideRequests.length / OVERRIDE_REQUESTS_PER_PAGE);
  }, [filteredOverrideRequests]);

  const overridesForSelectedReport = useMemo(() => {
    if (!selectedReport) return [];

    const parseDate = (value) => {
      if (!value) return null;
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    };

    const normalizeRange = () => {
      const from = parseDate(selectedReport.date_from || selectedReport.dateFrom);
      const to = parseDate(selectedReport.date_to || selectedReport.dateTo);
      if (!from && !to) return null;

      return {
        from,
        to: to ? new Date(to.setHours(23, 59, 59, 999)) : null
      };
    };

    const range = normalizeRange();
    const reportType = (selectedReport.report_type || '').toLowerCase();
    const generatedAt = parseDate(selectedReport.generated_at || selectedReport.created_at);

    const isWithinRange = (date) => {
      if (!date) return false;
      if (range) {
        if (range.from && date < range.from) return false;
        if (range.to && date > range.to) return false;
        return true;
      }

      if (!generatedAt) return false;

      if (reportType === 'monthly') {
        return (
          date.getFullYear() === generatedAt.getFullYear() &&
          date.getMonth() === generatedAt.getMonth()
        );
      }

      if (reportType === 'yearly') {
        return date.getFullYear() === generatedAt.getFullYear();
      }

      return (
        date.getFullYear() === generatedAt.getFullYear() &&
        date.getMonth() === generatedAt.getMonth() &&
        date.getDate() === generatedAt.getDate()
      );
    };

    return overrideRequests
      .filter((req) => {
        const comparisonDate = parseDate(req.reviewed_at || req.created_at);
        return isWithinRange(comparisonDate);
      })
      .sort((a, b) => new Date(b.created_at || b.reviewed_at || 0) - new Date(a.created_at || a.reviewed_at || 0));
  }, [overrideRequests, selectedReport]);

  if (loading && reports.length === 0) {
    return <ReportPageSkeleton isAdmin={isAdmin} />;
  }

  return (
    <>
    <div className="generate-reports-page">
      <div className="gr-header">
        <div className="gr-header-content">
          <h1 className="gr-title">
            <i className="fas fa-chart-line"></i> Generate Financial Reports
          </h1>
          <div className="gr-header-actions">
            <button 
              className="gr-btn-generate-report"
              onClick={() => setShowGenerateFormModal(true)}
            >
              <i className="fas fa-plus-circle"></i>
              Generate New Report
            </button>
          </div>
        </div>
      </div>

      <div className="gr-activity-tabs">
        <button
          type="button"
          className={`gr-activity-tab ${activityTab === 'kpi' ? 'active' : ''}`}
          onClick={() => setActivityTab('kpi')}
        >
          <i className="fas fa-chart-column"></i>
          Reports KPI
        </button>
        
        {!hideTransactionTab && (
          <button
            type="button"
            className={`gr-activity-tab ${activityTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setActivityTab('transactions')}
          >
            <i className="fas fa-exchange-alt"></i>
            Transaction Activity
          </button>
        )}
        
        {!hideOverrideTab && (
          <button
            type="button"
            className={`gr-activity-tab ${activityTab === 'overrides' ? 'active' : ''}`}
            onClick={() => setActivityTab('overrides')}
          >
            <i className="fas fa-history"></i>
            Override Activity
          </button>
        )}
        
        {!hideCollectionReportTab && (
          <button
            type="button"
            className={`gr-activity-tab ${activityTab === 'collection-report' ? 'active' : ''}`}
            onClick={() => setActivityTab('collection-report')}
          >
            <i className="fas fa-file-invoice-dollar"></i>
            Collection Report
          </button>
        )}
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

      {/* Financial Collections & Disbursement Dashboard - Only for Admin */}
      {isAdmin && activityTab === 'kpi' && (
        <>
          {/* DAILY REPORT Section */}
          <div className="report-section">
            <DailyKPI transactions={transactions} reports={reports} />
          </div>

          {/* MONTHLY REPORT Section */}
          <div className="report-section">
            <MonthlyKPI transactions={transactions} reports={reports} />
          </div>

          {/* YEARLY REPORT Section */}
          <div className="report-section">
            <YearlyKPI transactions={transactions} reports={reports} />
          </div>
        </>
      )}

      {activityTab === 'kpi' && (
        <div className="gr-content-grid">
          {/* Report Statistics */}
          <div className="report-stats-section">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="fas fa-file-alt"></i>
                </div>
                <div className="stat-content">
                  <div className="stat-value" style={{ position: 'relative', left: '25%' }}>{stats.totalReports}</div>                  <div className="stat-label">Total Reports</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="fas fa-calendar-day"></i>
                </div>
                <div className="stat-content">
                  <div style={{ position: 'relative', left: '25%' }} className="stat-value"  >{stats.dailyReports}</div>
                  <div className="stat-label">Daily Reports</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="fas fa-calendar-alt"></i>
                </div>
                <div className="stat-content">
                  <div style={{ position: 'relative', left: '25%' }} className="stat-value">{stats.monthlyReports}</div>
                  <div className="stat-label">Monthly Reports</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="fas fa-calendar"></i>
                </div>
                <div className="stat-content">
                  <div style={{ position: 'relative', left: '25%' }} className="stat-value">{stats.yearlyReports}</div>
                  <div className="stat-label">Yearly Reports</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="fas fa-exchange-alt"></i>
                </div>
                <div className="stat-content">
                  <div style={{ position: 'relative', left: '25%' }} className="stat-value">{overrideStats.total}</div>
                  <div className="stat-label">Override Requests</div>
                  <div style={{ fontSize: '12px', marginTop: '4px', color: '#6b7280' }}>
                    Approved {overrideStats.approved} • Pending {overrideStats.pending} • Rejected {overrideStats.rejected}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activityTab === 'transactions' && transactionsLoading && (
        <div className="gr-loading-placeholder">
          <div className="gr-loading-spinner"></div>
          <p>Loading transactions...</p>
        </div>
      )}
      
      {activityTab === 'transactions' && !transactionsLoading && (
        <div className="gr-transactions-section">
          <div className="gr-transactions-header">
            <div className="gr-section-title-group">
              <h3>
                <i className="fas fa-exchange-alt"></i>
                Transaction Activity
                <span className="gr-section-count">({filteredTransactions.length})</span>
              </h3>
            </div>
            <div className="gr-header-controls">
              <button
                className="gr-export-btn"
                onClick={exportTransactionsToPDF}
                disabled={filteredTransactions.length === 0}
                title="Export Transactions as PDF"
              >
                <i className="fas fa-file-pdf"></i>
                Export as PDF
              </button>
            </div>
            <div className="gr-header-controls">
              <div className="gr-search-filter-container">
                <div className="gr-date-filter-group">
                  <label>Date From</label>
                  <input 
                    type="date" 
                    value={transactionFilters.dateFrom}
                    onChange={(e) => handleTransactionFilterChange('dateFrom', e.target.value)}
                    className="gr-date-input"
                  />
                </div>
                
                <div className="gr-date-filter-group">
                  <label>Date To</label>
                  <input 
                    type="date" 
                    value={transactionFilters.dateTo}
                    onChange={(e) => handleTransactionFilterChange('dateTo', e.target.value)}
                    className="gr-date-input"
                  />
                </div>

                <div className="gr-account-search-container">
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={transactionFilters.searchTerm}
                    onChange={(e) => handleTransactionFilterChange('searchTerm', e.target.value)}
                    className="gr-account-search-input"
                  />
                  <i className="fas fa-search gr-account-search-icon"></i>
                </div>
                
                <div className="gr-filter-dropdown-container">
                  <button
                    className="gr-filter-dropdown-btn"
                    onClick={() => setTransactionFilters(prev => ({ ...prev, showFilterDropdown: !prev.showFilterDropdown }))}
                    title="Filter transactions"
                  >
                    <i className="fas fa-filter"></i>
                    <span className="gr-filter-label">
                      {transactionFilters.activeFilter === 'all' ? 'All Transactions' :
                       transactionFilters.activeFilter === 'latest' ? 'Latest First' :
                       transactionFilters.activeFilter === 'oldest' ? 'Oldest First' :
                       transactionFilters.activeFilter === 'highest' ? 'Highest Amount' :
                       transactionFilters.activeFilter === 'lowest' ? 'Lowest Amount' :
                       transactionFilters.activeFilter === 'collections' ? 'Collections Only' :
                       'Disbursements Only'}
                    </span>
                    <i className={`fas fa-chevron-${transactionFilters.showFilterDropdown ? 'up' : 'down'} gr-filter-arrow`}></i>
                  </button>
                  
                  {transactionFilters.showFilterDropdown && (
                    <div className="gr-filter-dropdown-menu">
                      <button
                        className={`gr-filter-option ${transactionFilters.activeFilter === 'all' ? 'active' : ''}`}
                        onClick={() => { handleTransactionFilterChange('activeFilter', 'all'); setTransactionFilters(prev => ({ ...prev, showFilterDropdown: false })); }}
                      >
                        <i className="fas fa-list"></i>
                        <span>All Transactions</span>
                        {transactionFilters.activeFilter === 'all' && <i className="fas fa-check gr-filter-check"></i>}
                      </button>
                      <button
                        className={`gr-filter-option ${transactionFilters.activeFilter === 'latest' ? 'active' : ''}`}
                        onClick={() => { handleTransactionFilterChange('activeFilter', 'latest'); setTransactionFilters(prev => ({ ...prev, showFilterDropdown: false })); }}
                      >
                        <i className="fas fa-arrow-down"></i>
                        <span>Latest First</span>
                        {transactionFilters.activeFilter === 'latest' && <i className="fas fa-check gr-filter-check"></i>}
                      </button>
                      <button
                        className={`gr-filter-option ${transactionFilters.activeFilter === 'oldest' ? 'active' : ''}`}
                        onClick={() => { handleTransactionFilterChange('activeFilter', 'oldest'); setTransactionFilters(prev => ({ ...prev, showFilterDropdown: false })); }}
                      >
                        <i className="fas fa-arrow-up"></i>
                        <span>Oldest First</span>
                        {transactionFilters.activeFilter === 'oldest' && <i className="fas fa-check gr-filter-check"></i>}
                      </button>
                      <button
                        className={`gr-filter-option ${transactionFilters.activeFilter === 'highest' ? 'active' : ''}`}
                        onClick={() => { handleTransactionFilterChange('activeFilter', 'highest'); setTransactionFilters(prev => ({ ...prev, showFilterDropdown: false })); }}
                      >
                        <i className="fas fa-sort-amount-down"></i>
                        <span>Highest Amount</span>
                        {transactionFilters.activeFilter === 'highest' && <i className="fas fa-check gr-filter-check"></i>}
                      </button>
                      <button
                        className={`gr-filter-option ${transactionFilters.activeFilter === 'lowest' ? 'active' : ''}`}
                        onClick={() => { handleTransactionFilterChange('activeFilter', 'lowest'); setTransactionFilters(prev => ({ ...prev, showFilterDropdown: false })); }}
                      >
                        <i className="fas fa-sort-amount-up"></i>
                        <span>Lowest Amount</span>
                        {transactionFilters.activeFilter === 'lowest' && <i className="fas fa-check gr-filter-check"></i>}
                      </button>
                      <button
                        className={`gr-filter-option ${transactionFilters.activeFilter === 'collections' ? 'active' : ''}`}
                        onClick={() => { handleTransactionFilterChange('activeFilter', 'collections'); setTransactionFilters(prev => ({ ...prev, showFilterDropdown: false })); }}
                      >
                        <i className="fas fa-arrow-circle-down"></i>
                        <span>Collections Only</span>
                        {transactionFilters.activeFilter === 'collections' && <i className="fas fa-check gr-filter-check"></i>}
                      </button>
                      <button
                        className={`gr-filter-option ${transactionFilters.activeFilter === 'disbursements' ? 'active' : ''}`}
                        onClick={() => { handleTransactionFilterChange('activeFilter', 'disbursements'); setTransactionFilters(prev => ({ ...prev, showFilterDropdown: false })); }}
                      >
                        <i className="fas fa-arrow-circle-up"></i>
                        <span>Disbursements Only</span>
                        {transactionFilters.activeFilter === 'disbursements' && <i className="fas fa-check gr-filter-check"></i>}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="gr-table-section">
            <div className="gr-table-container">
              <table className="gr-table">
                <thead>
                  <tr>
                    <th><i className="fas fa-hashtag"></i> ID</th>
                    <th><i className="fas fa-tag"></i> TYPE</th>
                    <th><i className="fas fa-money-bill"></i> AMOUNT</th>
                    <th><i className="fas fa-user"></i> RECIPIENT/PAYER</th>
                    <th><i className="fas fa-user-circle"></i> CREATED BY</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((transaction) => {
                      const displayType = getTransactionDisplayType(transaction);
                      const amountValue = parseFloat(transaction.amount || 0);
                      const amountIsPositive = amountValue >= 0;
                      const amountPrefix = amountIsPositive ? '' : '-';

                      return (
                        <tr key={transaction.id} className="table-row">
                          <td>
                            <div className="gr-cell-content">
                              <span className="receipt-id">#{transaction.id}</span>
                            </div>
                          </td>
                          <td>
                            <div className="gr-cell-content">
                              <span className={`tm-type-badge ${displayType.toLowerCase()}`}>
                                {displayType}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className="gr-cell-content">
                              <span className={`amount ${amountIsPositive ? 'amount-positive' : 'amount-negative'}`}>
                                {amountPrefix}₱{Math.abs(amountValue).toLocaleString()}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className="gr-cell-content">
                              <span className="payer-name">{transaction.recipient || 'N/A'}</span>
                            </div>
                          </td>
                          <td>
                            <div className="gr-cell-content">
                              <div className="created-by-info">
                                <span className="created-by-name">
                                  {transaction.creator?.name || transaction.created_by?.name || transaction.user?.name || transaction.issuing_officer_name || 'N/A'}
                                </span>
                                <span className="created-by-role">
                                  {transaction.creator?.role || transaction.user?.role || 'N/A'}
                                </span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="gr-no-data">
                        <div className="gr-no-data-content">
                          <i className="fas fa-inbox"></i>
                          <p>No transactions found matching your criteria.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!hideOverrideTab && activityTab === 'overrides' && overridesLoading && (
        <div className="gr-loading-placeholder">
          <div className="gr-loading-spinner"></div>
          <p>Loading override requests...</p>
        </div>
      )}
      
      {!hideOverrideTab && activityTab === 'overrides' && !overridesLoading && (
        <div>
          <div className="gr-override-header">
            <div className="gr-override-title">
              <i className="fas fa-exchange-alt"></i>
              Override Requests
              <span className="gr-override-count">({filteredOverrideRequests.length})</span>
            </div>
            <div className="gr-override-controls">
              <div className="gr-override-search-container">
                <input
                  type="text"
                  placeholder="Search requests..."
                  value={overrideFilters.searchTerm}
                  onChange={(e) => setOverrideFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                  className="gr-override-search-input"
                />
                <i className="fas fa-search gr-override-search-icon"></i>
              </div>

              <div className="gr-override-date-filter">
                <input
                  type="date"
                  value={overrideFilters.dateFrom || ''}
                  onChange={(e) => setOverrideFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  className="gr-override-date-input"
                  title="From Date"
                />
                <span className="gr-override-date-separator">to</span>
                <input
                  type="date"
                  value={overrideFilters.dateTo || ''}
                  onChange={(e) => setOverrideFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  className="gr-override-date-input"
                  title="To Date"
                />
              </div>
              
              <div className="gr-override-filter-container">
                <button
                  className="gr-override-filter-btn"
                  onClick={() => setOverrideFilters(prev => ({ ...prev, showFilterDropdown: !prev.showFilterDropdown }))}
                  title="Filter requests"
                >
                  <i className="fas fa-filter"></i>
                  <span className="gr-override-filter-label">
                    {overrideFilters.status === 'all' ? 'All Status' :
                     overrideFilters.status === 'pending' ? 'Pending' : 
                     overrideFilters.status === 'approved' ? 'Approved' : 
                     'Rejected'}
                  </span>
                  <i className={`fas fa-chevron-${overrideFilters.showFilterDropdown ? 'up' : 'down'}`}></i>
                </button>
                
                {overrideFilters.showFilterDropdown && (
                  <div className="gr-override-filter-menu">
                    <button
                      className={`gr-override-filter-option ${overrideFilters.status === 'all' ? 'active' : ''}`}
                      onClick={() => { setOverrideFilters(prev => ({ ...prev, status: 'all', showFilterDropdown: false })); }}
                    >
                      <i className="fas fa-list"></i>
                      <span>All Status</span>
                      {overrideFilters.status === 'all' && <i className="fas fa-check"></i>}
                    </button>
                    <button
                      className={`gr-override-filter-option ${overrideFilters.status === 'pending' ? 'active' : ''}`}
                      onClick={() => { setOverrideFilters(prev => ({ ...prev, status: 'pending', showFilterDropdown: false })); }}
                    >
                      <i className="fas fa-clock"></i>
                      <span>Pending</span>
                      {overrideFilters.status === 'pending' && <i className="fas fa-check"></i>}
                    </button>
                    <button
                      className={`gr-override-filter-option ${overrideFilters.status === 'approved' ? 'active' : ''}`}
                      onClick={() => { setOverrideFilters(prev => ({ ...prev, status: 'approved', showFilterDropdown: false })); }}
                    >
                      <i className="fas fa-check-circle"></i>
                      <span>Approved</span>
                      {overrideFilters.status === 'approved' && <i className="fas fa-check"></i>}
                    </button>
                    <button
                      className={`gr-override-filter-option ${overrideFilters.status === 'rejected' ? 'active' : ''}`}
                      onClick={() => { setOverrideFilters(prev => ({ ...prev, status: 'rejected', showFilterDropdown: false })); }}
                    >
                      <i className="fas fa-times-circle"></i>
                      <span>Rejected</span>
                      {overrideFilters.status === 'rejected' && <i className="fas fa-check"></i>}
                    </button>
                  </div>
                )}
              </div>

              <div className="gr-override-export-dropdown-container">
                <button
                  className="gr-override-export-btn"
                  onClick={() => setOverrideFilters(prev => ({ ...prev, showExportDropdown: !prev.showExportDropdown }))}
                  title="Export options"
                >
                  <i className="fas fa-download"></i>
                </button>

                {overrideFilters.showExportDropdown && (
                  <div className="gr-override-export-menu">
                    <button
                      className="gr-override-export-option"
                      onClick={() => {
                        // Export override requests to PDF with preview
                        const doc = new jsPDF();
                        const pageWidth = doc.internal.pageSize.getWidth();
                        const margin = 14;
                        
                        // Header
                        doc.setFont('helvetica', 'bold');
                        doc.setFontSize(16);
                        doc.text('Override Requests Report', pageWidth / 2, 18, { align: 'center' });
                        
                        doc.setFont('helvetica', 'normal');
                        doc.setFontSize(11);
                        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, 26, { align: 'center' });
                        
                        // Table
                        const tableData = filteredOverrideRequests.map((req) => [
                          `#${req.id}`,
                          `#${req.transaction_id}`,
                          req.requested_by?.name || 'N/A',
                          req.reviewed_by?.name || 'Pending',
                          req.status || 'N/A',
                          new Date(req.created_at).toLocaleDateString(),
                        ]);
                        
                        autoTable(doc, {
                          head: [['ID', 'Transaction', 'Requested By', 'Reviewed By', 'Status', 'Date']],
                          body: tableData,
                          startY: 35,
                          margin: margin,
                          theme: 'grid',
                          headerStyles: {
                            fillColor: [0, 0, 0],
                            textColor: [255, 255, 255],
                            fontStyle: 'bold',
                            fontSize: 10,
                          },
                          bodyStyles: {
                            fontSize: 9,
                            textColor: [0, 0, 0],
                          },
                          alternateRowStyles: {
                            fillColor: [250, 250, 250],
                          },
                        });
                        
                        const fileName = `override_requests_${new Date().toISOString().split('T')[0]}.pdf`;
                        const blob = doc.output('blob');
                        const url = URL.createObjectURL(blob);
                        setOverridePdfPreviewUrl(url);
                        setOverridePdfFileName(fileName);
                        setShowPDFPreview(true);
                        setOverrideFilters(prev => ({ ...prev, showExportDropdown: false }));
                      }}
                    >
                      <i className="fas fa-file-pdf"></i>
                      <span>Export as PDF</span>
                    </button>

                    <button
                      className="gr-override-export-option"
                      onClick={() => {
                        // Export override requests to Excel
                        const ws_data = [
                          ['ID', 'Transaction', 'Requested By', 'Reviewed By', 'Status', 'Date'],
                          ...filteredOverrideRequests.map((req) => [
                            req.id,
                            req.transaction_id,
                            req.requested_by?.name || 'N/A',
                            req.reviewed_by?.name || 'Pending',
                            req.status || 'N/A',
                            new Date(req.created_at).toLocaleDateString(),
                          ]),
                        ];
                        
                        const ws = XLSX.utils.aoa_to_sheet(ws_data);
                        const wb = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(wb, ws, 'Override Requests');
                        
                        const fileName = `override_requests_${new Date().toISOString().split('T')[0]}.xlsx`;
                        XLSX.writeFile(wb, fileName);
                        setOverrideFilters(prev => ({ ...prev, showExportDropdown: false }));
                      }}
                    >
                      <i className="fas fa-file-excel"></i>
                      <span>Export as Excel</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="ot-requests-section">
            <div className="requests-table-container">
            <table className="requests-table">
              <thead>
                <tr>
                  <th><i className="fas fa-hashtag"></i> ID</th>
                  <th><i className="fas fa-exchange-alt"></i> Transaction</th>
                  <th><i className="fas fa-user"></i> Requested By</th>
                  <th><i className="fas fa-user-shield"></i> Reviewed By</th>
                  <th><i className="fas fa-flag"></i> Status</th>
                  <th><i className="fas fa-calendar"></i> Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOverrideRequests.length > 0 ? (
                  recentOverrideRequests.map((request) => {
                    const requester = request.requested_by || request.requestedBy;
                    const reviewer = request.reviewed_by || request.reviewedBy;
                    const displayDate = request.reviewed_at || request.created_at;

                    return (
                      <tr key={request.id} className="table-row">
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
                              <span className="requester-name">{requester?.name || 'N/A'}</span>
                              <span className="requester-role">{requester?.role || requester?.position || 'N/A'}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="cell-content">
                            <span className="reviewer-name">{reviewer?.name || 'Pending'}</span>
                          </div>
                        </td>
                        <td>
                          <div className="cell-content">
                            <span className={`status-badge ${request.status || 'pending'}`}>
                              {(request.status || 'pending').toUpperCase()}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="cell-content">
                            <span className="request-date">{displayDate ? new Date(displayDate).toLocaleDateString() : 'N/A'}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="no-data">
                      <i className="fas fa-inbox"></i>
                      <p>No override activity recorded yet.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {totalOverridePages > 1 && (
            <div className="ot-table-pagination">
              <div className="ot-pagination-info">
                Showing {((overrideRequestsPage - 1) * OVERRIDE_REQUESTS_PER_PAGE) + 1}-{Math.min(overrideRequestsPage * OVERRIDE_REQUESTS_PER_PAGE, overrideRequests.length)} of {overrideRequests.length} requests
              </div>
              <div className="ot-pagination-controls">
                <button
                  type="button"
                  className="ot-pagination-button"
                  onClick={() => setOverrideRequestsPage(prev => Math.max(1, prev - 1))}
                  disabled={overrideRequestsPage === 1}
                >
                  <i className="fas fa-chevron-left"></i> Previous
                </button>
                <span className="ot-pagination-page-info">
                  Page {overrideRequestsPage} of {totalOverridePages}
                </span>
                <button
                  type="button"
                  className="ot-pagination-button"
                  onClick={() => setOverrideRequestsPage(prev => Math.min(totalOverridePages, prev + 1))}
                  disabled={overrideRequestsPage === totalOverridePages}
                >
                  Next <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>
          )}
        </div>
        </div>
      )}

      {!hideCollectionReportTab && activityTab === 'collection-report' && (
        <div className="gr-collection-report-section">
          <div className="gr-collection-report-header">
            <div className="gr-section-title-group">
              <h3>
                <i className="fas fa-file-invoice-dollar"></i>
                Collection Report
                <span className="gr-section-count">({transactions.filter(tx => tx.type === 'Collection').length})</span>
              </h3>
            </div>
            <div className="gr-header-controls">
              <div className="gr-report-type-dropdown-container">
                <button
                  className="gr-report-type-btn"
                  onClick={() => setShowReportTypeDropdown(!showReportTypeDropdown)}
                  title="Select Report Type"
                >
                  <i className="fas fa-file-alt"></i>
                  <span className="gr-report-type-label">
                    {selectedReportType === 'collection-or-fee-details' ? 'O.R Fee Details' :
                     selectedReportType === 'collection-or-fee-summary' ? 'O.R Fee Summary' :
                     selectedReportType === 'collection-or-details' ? 'O.R Details' :
                     'O.R Summary'}
                  </span>
                  <i className={`fas fa-chevron-${showReportTypeDropdown ? 'up' : 'down'}`}></i>
                </button>
                
                {showReportTypeDropdown && (
                  <div className="gr-report-type-dropdown-menu">
                    <button
                      className={`gr-report-type-option ${selectedReportType === 'collection-or-fee-details' ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedReportType('collection-or-fee-details');
                        setShowReportTypeDropdown(false);
                      }}
                    >
                      <i className="fas fa-receipt"></i>
                      <span>O.R Fee Details</span>
                      {selectedReportType === 'collection-or-fee-details' && <i className="fas fa-check"></i>}
                    </button>
                    <button
                      className={`gr-report-type-option ${selectedReportType === 'collection-or-fee-summary' ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedReportType('collection-or-fee-summary');
                        setShowReportTypeDropdown(false);
                      }}
                    >
                      <i className="fas fa-list"></i>
                      <span>O.R Fee Summary</span>
                      {selectedReportType === 'collection-or-fee-summary' && <i className="fas fa-check"></i>}
                    </button>
                    <button
                      className={`gr-report-type-option ${selectedReportType === 'collection-or-details' ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedReportType('collection-or-details');
                        setShowReportTypeDropdown(false);
                      }}
                    >
                      <i className="fas fa-file-invoice"></i>
                      <span>O.R Details</span>
                      {selectedReportType === 'collection-or-details' && <i className="fas fa-check"></i>}
                    </button>
                    <button
                      className={`gr-report-type-option ${selectedReportType === 'collection-or-summary' ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedReportType('collection-or-summary');
                        setShowReportTypeDropdown(false);
                      }}
                    >
                      <i className="fas fa-chart-bar"></i>
                      <span>O.R Summary</span>
                      {selectedReportType === 'collection-or-summary' && <i className="fas fa-check"></i>}
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="gr-header-controls">
              <div className="gr-search-filter-container">
                <div className="gr-date-filter-group">
                  <label>Date From</label>
                  <input 
                    type="date" 
                    className="gr-date-input"
                    value={collectionReportFilters.dateFrom}
                    onChange={(e) => setCollectionReportFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  />
                </div>
                
                <div className="gr-date-filter-group">
                  <label>Date To</label>
                  <input 
                    type="date" 
                    className="gr-date-input"
                    value={collectionReportFilters.dateTo}
                    onChange={(e) => setCollectionReportFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  />
                </div>

                <div className="gr-account-search-container">
                  <input
                    type="text"
                    placeholder="Search collections..."
                    className="gr-account-search-input"
                    value={collectionReportFilters.searchTerm}
                    onChange={(e) => setCollectionReportFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                  />
                  <i className="fas fa-search gr-account-search-icon"></i>
                </div>

                <button 
                  className="gr-export-btn"
                  onClick={exportCollectionReportPDF}
                  title="Export to PDF"
                >
                  <i className="fas fa-download"></i>
                 
                </button>
              </div>
            </div>
          </div>

          <CollectionReportTab 
            selectedReportType={selectedReportType}
            groupedCollectionsByReceipt={groupedCollectionsByReceipt}
          />
        </div>
      )}

      {/* Reports Table */}
      {activityTab === 'kpi' && (
      <div className="gr-reports-section">
        <div className="gr-reports-header">
          <div className="gr-section-title-group">
            <h3>
              <i className="fas fa-file-alt"></i>
              Generated Reports
              <span className="gr-section-count">({filteredReports.length})</span>
            </h3>
          </div>
          <div className="gr-header-controls">
            <div className="gr-search-filter-container">
              <div className="gr-date-filter-group">
                <label>Date From</label>
                <input 
                  type="date" 
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="gr-date-input"
                />
              </div>
              
              <div className="gr-date-filter-group">
                <label>Date To</label>
                <input 
                  type="date" 
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="gr-date-input"
                />
              </div>

              <div className="gr-account-search-container">
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={filters.searchTerm}
                  onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                  className="gr-account-search-input"
                />
                <i style={{ position: 'relative', left: '-12%' }} className="fas fa-search gr-account-search-icon"></i>
              </div>
              
              <div className="gr-filter-dropdown-container">
                <button
                  className="gr-filter-dropdown-btn"
                  onClick={() => setFilters(prev => ({ ...prev, showFilterDropdown: !prev.showFilterDropdown }))}
                  title="Filter reports"
                >
                  <i className="fas fa-filter"></i>
                  <span className="gr-filter-label">
                    {filters.activeFilter === 'all' ? 'All Reports' :
                     filters.activeFilter === 'latest' ? 'Latest First' : 
                     filters.activeFilter === 'oldest' ? 'Oldest First' : 
                     filters.activeFilter === 'type-asc' ? 'Type A-Z' : 
                     filters.activeFilter === 'type-desc' ? 'Type Z-A' :
                     filters.activeFilter === 'daily' ? 'Daily Reports' :
                     filters.activeFilter === 'monthly' ? 'Monthly Reports' :
                     filters.activeFilter === 'yearly' ? 'Yearly Reports' :
                     'All Reports'}
                  </span>
                  <i className={`fas fa-chevron-${filters.showFilterDropdown ? 'up' : 'down'} gr-filter-arrow`}></i>
                </button>
                
                {filters.showFilterDropdown && (
                  <div className="gr-filter-dropdown-menu">
                    <button
                      className={`gr-filter-option ${filters.activeFilter === 'all' ? 'active' : ''}`}
                      onClick={() => { handleFilterChange('activeFilter', 'all'); setFilters(prev => ({ ...prev, showFilterDropdown: false })); }}
                    >
                      <i className="fas fa-list"></i>
                      <span>All Reports</span>
                      {filters.activeFilter === 'all' && <i className="fas fa-check gr-filter-check"></i>}
                    </button>
                    <button
                      className={`gr-filter-option ${filters.activeFilter === 'latest' ? 'active' : ''}`}
                      onClick={() => { handleFilterChange('activeFilter', 'latest'); setFilters(prev => ({ ...prev, showFilterDropdown: false })); }}
                    >
                      <i className="fas fa-arrow-down"></i>
                      <span>Latest First</span>
                      {filters.activeFilter === 'latest' && <i className="fas fa-check gr-filter-check"></i>}
                    </button>
                    <button
                      className={`gr-filter-option ${filters.activeFilter === 'oldest' ? 'active' : ''}`}
                      onClick={() => { handleFilterChange('activeFilter', 'oldest'); setFilters(prev => ({ ...prev, showFilterDropdown: false })); }}
                    >
                      <i className="fas fa-arrow-up"></i>
                      <span>Oldest First</span>
                      {filters.activeFilter === 'oldest' && <i className="fas fa-check gr-filter-check"></i>}
                    </button>
                    {/* <button
                      className={`gr-filter-option ${filters.activeFilter === 'type-asc' ? 'active' : ''}`}
                      onClick={() => { handleFilterChange('activeFilter', 'type-asc'); setFilters(prev => ({ ...prev, showFilterDropdown: false })); }}
                    >
                      <i className="fas fa-sort-alpha-down"></i>
                      <span>Type A-Z</span>
                      {filters.activeFilter === 'type-asc' && <i className="fas fa-check gr-filter-check"></i>}
                    </button> */}
                    {/* <button
                      className={`gr-filter-option ${filters.activeFilter === 'type-desc' ? 'active' : ''}`}
                      onClick={() => { handleFilterChange('activeFilter', 'type-desc'); setFilters(prev => ({ ...prev, showFilterDropdown: false })); }}
                    >
                      <i className="fas fa-sort-alpha-up"></i>
                      <span>Type Z-A</span>
                      {filters.activeFilter === 'type-desc' && <i className="fas fa-check gr-filter-check"></i>}
                    </button> */}
                    <div style={{ borderTop: '1px solid #e5e7eb', margin: '8px 0' }}></div>
                    <button
                      className={`gr-filter-option ${filters.activeFilter === 'daily' ? 'active' : ''}`}
                      onClick={() => { handleFilterChange('activeFilter', 'daily'); setFilters(prev => ({ ...prev, showFilterDropdown: false })); }}
                    >
                      <i className="fas fa-calendar-day"></i>
                      <span>Daily Reports</span>
                      {filters.activeFilter === 'daily' && <i className="fas fa-check gr-filter-check"></i>}
                    </button>
                    <button
                      className={`gr-filter-option ${filters.activeFilter === 'monthly' ? 'active' : ''}`}
                      onClick={() => { handleFilterChange('activeFilter', 'monthly'); setFilters(prev => ({ ...prev, showFilterDropdown: false })); }}
                    >
                      <i className="fas fa-calendar-alt"></i>
                      <span>Monthly Reports</span>
                      {filters.activeFilter === 'monthly' && <i className="fas fa-check gr-filter-check"></i>}
                    </button>
                    <button
                      className={`gr-filter-option ${filters.activeFilter === 'yearly' ? 'active' : ''}`}
                      onClick={() => { handleFilterChange('activeFilter', 'yearly'); setFilters(prev => ({ ...prev, showFilterDropdown: false })); }}
                    >
                      <i className="fas fa-calendar"></i>
                      <span>Yearly Reports</span>
                      {filters.activeFilter === 'yearly' && <i className="fas fa-check gr-filter-check"></i>}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="gr-table-section">
          <div className="gr-table-container">
            <table className="gr-table">
              <thead>
                <tr>
                  <th><i className="fas fa-hashtag"></i> REPORT ID</th>
                  <th><i className="fas fa-file-alt"></i> REPORT TYPE</th>
                  <th><i className="fas fa-user"></i> GENERATED BY</th>
                  <th><i className="fas fa-user-tag"></i> ROLE</th>
                  <th><i className="fas fa-calendar"></i> GENERATED AT</th>
                  <th><i className="fas fa-file-export"></i> FORMAT</th>
                  <th><i className="fas fa-cog"></i> ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const totalReports = filteredReports.length;
                  const totalPages = Math.max(1, Math.ceil(totalReports / REPORTS_PER_PAGE));
                  const startIndex = (currentPage - 1) * REPORTS_PER_PAGE;
                  const currentReports = filteredReports.slice(startIndex, startIndex + REPORTS_PER_PAGE);
                  
                  return currentReports.length > 0 ? (
                    currentReports.map((report) => {
                    const userData = report.generated_by && typeof report.generated_by === "object"
                      ? report.generated_by
                      : null;

                    return (
                      <tr
                        key={report.id}
                        className={`gr-table-row ${openActionMenu === report.id ? 'gr-row-active-menu' : ''}`}
                        onClick={(e) => {
                          if (!e.target.closest('.gr-action-cell')) {
                            viewReportDetails(report);
                          }
                        }}
                      >
                        <td>
                          <div className="gr-cell-content">
                            <span className="gr-report-id">#{report.id}</span>
                          </div>
                        </td>
                        <td>
                          <div className="gr-cell-content">
                            <span className="gr-report-type">{report.report_type}</span>
                          </div>
                        </td>
                        <td>
                          <div className="gr-cell-content">
                            <span className="gr-generated-by">{userData ? userData.name : `User ID: ${report.generated_by}`}</span>
                          </div>
                        </td>
                        <td>
                          <div className="gr-cell-content">
                            <span className="gr-generated-role">{userData ? userData.role : 'N/A'}</span>
                          </div>
                        </td>
                        <td>
                          <div className="gr-cell-content">
                            <span className="gr-generated-at">{new Date(report.generated_at).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td>
                          <div className="gr-cell-content">
                            <span className="gr-format-badge">{report.format?.toUpperCase() || 'PDF'}</span>
                          </div>
                        </td>
                        <td className="gr-action-cell">
                          <div className="gr-cell-content">
                            <div className="gr-action-buttons-group">
                              <div className="gr-action-menu-container">
                                <button
                                  className="gr-action-btn-icon gr-more-btn"
                                  data-report-id={report.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenActionMenu(openActionMenu === report.id ? null : report.id);
                                  }}
                                  title="Actions"
                                >
                                  <i className="fas fa-ellipsis-v"></i>
                                </button>
                                {openActionMenu === report.id && (
                                  <div className={`gr-action-dropdown-menu ${dropdownAbove ? 'gr-dropdown-above' : ''}`}>
                                    {/* <button
                                      className="gr-action-dropdown-item"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        viewReportDetails(report);
                                        setOpenActionMenu(null);
                                      }}
                                    >
                                      <i className="fas fa-eye"></i>
                                      <span>View Details</span>
                                    </button> */}
                                    <button
                                      className="gr-action-dropdown-item"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        downloadReport(report);
                                        setOpenActionMenu(null);
                                      }}
                                      title="Download Report"
                                    >
                                      <i className="fas fa-download"></i>
                                      <span>Download Report</span>
                                    </button>
                                    <button
                                      className="gr-action-dropdown-item gr-danger"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setReportToDelete(report);
                                        setShowDeleteModal(true);
                                        setOpenActionMenu(null);
                                      }}
                                    >
                                      <i className="fas fa-trash"></i>
                                      <span>Delete Report</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="gr-no-data">
                      <div className="gr-no-data-content">
                        <i className="fas fa-inbox"></i>
                        <p>No reports found matching your criteria.</p>
                      </div>
                    </td>
                  </tr>
                );
                })()}
              </tbody>
            </table>
          </div>
          {filteredReports.length > 0 && (() => {
            const totalReports = filteredReports.length;
            const totalPages = Math.max(1, Math.ceil(totalReports / REPORTS_PER_PAGE));
            const startIndex = (currentPage - 1) * REPORTS_PER_PAGE;
            const displayStart = totalReports === 0 ? 0 : startIndex + 1;
            const displayEnd = Math.min(totalReports, startIndex + REPORTS_PER_PAGE);
            
            return (
              <div className="gr-table-pagination">
                <div className="gr-pagination-info">
                  Showing {displayStart}-{displayEnd} of {totalReports} reports
                </div>
                <div className="gr-pagination-controls">
                  <button
                    type="button"
                    className="gr-pagination-button"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  <span className="gr-pagination-info">Page {currentPage} of {totalPages}</span>
                  <button
                    type="button"
                    className="gr-pagination-button"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages || totalReports === 0}
                  >
                    Next
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
      )}

      {/* Generate Confirmation Modal */}
      {showGenerateModal && (
        <div className="modal-overlay" onClick={() => setShowGenerateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-question-circle"></i> Confirm Report Generation</h3>
              <button className="modal-close" onClick={() => setShowGenerateModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="confirmation-details">
                <div className="detail-item">
                  <label>Report Type:</label>
                  <span>{reportForm.reportType}</span>
                </div>
                {reportForm.reportType === 'custom' && (
                  <>
                    <div className="detail-item">
                      <label>Date Range:</label>
                      <span>{reportForm.dateFrom} to {reportForm.dateTo}</span>
                    </div>
                  </>
                )}
                <div className="detail-item">
                  <label>Department:</label>
                  <span>{reportForm.department === 'all' ? 'All Departments' : reportForm.department}</span>
                </div>
                <div className="detail-item">
                  <label>Category:</label>
                  <span>{reportForm.category === 'all' ? 'All Categories' : reportForm.category}</span>
                </div>
                <div className="detail-item">
                  <label>Format:</label>
                  <span>{reportForm.format.toUpperCase()}</span>
                </div>
                <div className="detail-item">
                  <label>Include Transactions:</label>
                  <span>{reportForm.includeTransactions ? 'Yes' : 'No'}</span>
                </div>
                <div className="detail-item">
                  <label>Include Overrides:</label>
                  <span>{reportForm.includeOverrides ? 'Yes' : 'No'}</span>
                </div>
              </div>
              <p className="confirmation-message">
                Are you sure you want to generate this report?
              </p>
            </div>
            <div className="modal-actions">

              <button
                type="button"
                className="confirm-btn"
                onClick={confirmGenerateReport}
                disabled={loading}
              >
                {loading ? (
                  <>
                    Processing <i className="fas fa-spinner fa-spin"></i>
                  </>
                ) : (
                  <>
                    <i className="fas fa-check"></i> Generate Report
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Success Modal */}
      {reportResult && (
        <div className="modal-overlay" onClick={() => setReportResult(null)}>
          <div className="modal-content success" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-check-circle"></i> Report Generated Successfully</h3>
              <button className="modal-close" onClick={() => setReportResult(null)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="success-details">
                <div className="success-icon">
                  <i className="fas fa-chart-line"></i>
                </div>
                <h4>Report Generated</h4>
                <div className="result-details">
                  <div className="detail-item">
                    <label>Report ID:</label>
                    <span>#{reportResult.id}</span>
                  </div>
                  <div className="detail-item">
                    <label>Type:</label>
                    <span>{reportResult.reportType}</span>
                  </div>
                  <div className="detail-item">
                    <label>Format:</label>
                    <span>{reportResult.format?.toUpperCase() || 'PDF'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Generated At:</label>
                    <span>{new Date(reportResult.generatedAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="close-btn"
                onClick={() => setReportResult(null)}
              >
                <i className="fas fa-times"></i> Close
              </button>
              <button
                type="button"
                className="download-btn"
                onClick={() => {
                  if (reportResult.format === 'excel') {
                    // For Excel, regenerate the report
                    const payload = {
                      report_type: reportResult.reportType,
                      date_from: null,
                      date_to: null,
                      department: null,
                      category: null,
                      include_transactions: true,
                      include_overrides: true,
                      format: 'excel'
                    };
                    generateExcelReport(payload);
                    showMessage('Excel report downloaded successfully', 'success');
                    // Close modal after download
                    setReportResult(null);
                  } else {
                    // For PDF, generate on-the-fly
                    const mockReport = {
                      id: reportResult.id,
                      report_type: reportResult.reportType,
                      generated_by: user,
                      generated_at: reportResult.generatedAt,
                      format: 'pdf'
                    };
                    const doc = generateReportPDF(mockReport, transactions);
                    const fileName = `report_${reportResult.id}_${new Date().toISOString().split('T')[0]}.pdf`;
                    const pdfBlob = doc.output('blob');
                    const pdfUrl = URL.createObjectURL(pdfBlob);
                    
                    setPdfPreviewUrl(pdfUrl);
                    setPdfFileName(fileName);
                    setShowPDFPreview(true);
                    // Close modal after opening preview
                    setReportResult(null);
                  }
                }}
              >
                <i className="fas fa-download"></i> Download Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Details Modal */}
      {showPreviewModal && selectedReport && (
        <div className="modal-overlay" onClick={() => setShowPreviewModal(false)}>
          <div className="modal-content gr-report-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header gr-preview-header">
              <div className="gr-preview-header-content">
                <div className="gr-preview-icon">
                  <i className="fas fa-file-chart-line"></i>
                </div>
                <div className="gr-preview-title-group">
                  <h3>Report Details</h3>
                  <p className="gr-preview-subtitle">#{selectedReport.id} • {selectedReport.report_type}</p>
                </div>
              </div>
              <div className="gr-preview-header-actions">
                {/* <button
                  type="button"
                  className="gr-download-header-btn"
                  onClick={() => downloadReport(selectedReport)}
                  disabled={!selectedReport.file_path}
                  title={selectedReport.file_path ? "Download Report" : "File not available for download"}
                >
                  <i className={`fas ${selectedReport.file_path ? 'fa-download' : 'fa-exclamation-triangle'}`}></i>
                  <span>{selectedReport.file_path ? 'Download' : 'No File'}</span>
                </button> */}
                <button className="modal-close" onClick={() => setShowPreviewModal(false)}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>
            <div className="modal-body gr-preview-body">
              {/* Report Summary Card */}
              <div className="gr-report-summary-card">
                <div className="gr-summary-header">
                  <div className="gr-summary-badge">
                    <i className="fas fa-check-circle"></i>
                    <span>Generated Successfully</span>
                  </div>
                  <div className="gr-report-type-badge">
                    {selectedReport.report_type}
                  </div>
                </div>
                <div className="gr-summary-stats">
                  <div className="gr-summary-stat">
                    <i className="fas fa-calendar-alt"></i>
                    <div className="gr-stat-content">
                      <span className="gr-stat-label">Generated</span>
                      <span className="gr-stat-value">{new Date(selectedReport.generated_at).toLocaleDateString()}</span>
                      <span className="gr-stat-time">{new Date(selectedReport.generated_at).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  <div className="gr-summary-stat">
                    <i className="fas fa-file-alt"></i>
                    <div className="gr-stat-content">
                      <span className="gr-stat-label">Format</span>
                      <span className="gr-stat-value">{selectedReport.format?.toUpperCase() || 'PDF'}</span>
                    </div>
                  </div>
                  <div className="gr-summary-stat">
                    <i className="fas fa-user"></i>
                    <div className="gr-stat-content">
                      <span className="gr-stat-label">Generated By</span>
                      <span className="gr-stat-value">
                        {selectedReport.generated_by && typeof selectedReport.generated_by === "object"
                          ? selectedReport.generated_by.name
                          : `User ID: ${selectedReport.generated_by}`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Information */}
              <div className="gr-report-details-grid">
                <div className="gr-detail-section">
                  <h4><i className="fas fa-info-circle"></i> Report Information</h4>
                  <div className="gr-detail-list">
                    <div className="gr-detail-row">
                      <span className="gr-detail-label">Report ID</span>
                      <span className="gr-detail-value">#{selectedReport.id}</span>
                    </div>
                    <div className="gr-detail-row">
                      <span className="gr-detail-label">Report Type</span>
                      <span className="gr-detail-value gr-capitalize">{selectedReport.report_type}</span>
                    </div>
                    <div className="gr-detail-row">
                      <span className="gr-detail-label">File Format</span>
                      <span className="gr-detail-value">{selectedReport.format?.toUpperCase() || 'PDF'}</span>
                    </div>
                    <div className="gr-detail-row">
                      <span className="gr-detail-label">File Size</span>
                      <span className="gr-detail-value">{selectedReport.file_size || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="gr-detail-section">
                  <h4><i className="fas fa-clock"></i> Timeline</h4>
                  <div className="gr-detail-list">
                    <div className="gr-detail-row">
                      <span className="gr-detail-label">Generated Date</span>
                      <span className="gr-detail-value">{new Date(selectedReport.generated_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div className="gr-detail-row">
                      <span className="gr-detail-label">Generated Time</span>
                      <span className="gr-detail-value">{new Date(selectedReport.generated_at).toLocaleTimeString()}</span>
                    </div>
                    <div className="gr-detail-row">
                      <span className="gr-detail-label">Status</span>
                      <span className="gr-status-badge gr-status-success">
                        <i className="fas fa-check-circle"></i>
                        Generated
                      </span>
                    </div>
                  </div>
                </div>

                {selectedReport.generated_by && typeof selectedReport.generated_by === "object" && (
                  <div className="gr-detail-section">
                    <h4><i className="fas fa-user-shield"></i> Generated By</h4>
                    <div className="gr-detail-list">
                      <div className="gr-detail-row">
                        <span className="gr-detail-label">Name</span>
                        <span className="gr-detail-value">{selectedReport.generated_by.name}</span>
                      </div>
                      <div className="gr-detail-row">
                        <span className="gr-detail-label">Role</span>
                        <span className="gr-detail-value gr-capitalize">{selectedReport.generated_by.role || 'N/A'}</span>
                      </div>
                      <div className="gr-detail-row">
                        <span className="gr-detail-label">User ID</span>
                        <span className="gr-detail-value">#{selectedReport.generated_by.id || selectedReport.generated_by}</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedReport.file_path && (
                  <div className="gr-detail-section">
                    <h4><i className="fas fa-folder-open"></i> File Information</h4>
                    <div className="gr-detail-list">
                      <div className="gr-detail-row">
                        <span className="gr-detail-label">File Path</span>
                        <span className="gr-detail-value gr-file-path">{selectedReport.file_path}</span>
                      </div>
                      <div className="gr-detail-row">
                        <span className="gr-detail-label">Availability</span>
                        <span className="gr-status-badge gr-status-available">
                          <i className="fas fa-check"></i>
                          Available for Download
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && reportToDelete && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-exclamation-triangle"></i> Confirm Delete</h3>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="confirmation-details">
                <div className="detail-item">
                  <label>Report ID:</label>
                  <span>#{reportToDelete.id}</span>
                </div>
                <div className="detail-item">
                  <label>Type:</label>
                  <span>{reportToDelete.report_type}</span>
                </div>
                <div className="detail-item">
                  <label>Generated At:</label>
                  <span>{new Date(reportToDelete.generated_at).toLocaleDateString()}</span>
                </div>
              </div>
              <p className="confirmation-message">
                Are you sure you want to delete this report? This action cannot be undone.
              </p>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setShowDeleteModal(false)}
              >
                <i className="fas fa-times"></i> Cancel
              </button>
              <button
                type="button"
                className="confirm-btn delete-btn"
                onClick={handleDeleteReport}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Deleting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-trash"></i> Delete Report
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Report Form Modal - Rendered outside main container */}
      {showGenerateFormModal && (
      <div className="modal-overlay" onClick={() => setShowGenerateFormModal(false)}>
        <div className="modal-content generate-report-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3><i className="fas fa-plus-circle"></i> Generate New Report</h3>
            <button className="modal-close" onClick={() => setShowGenerateFormModal(false)}>
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="modal-body">
            <div className="report-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Collection Report by *</label>
                  <select
                    value={reportForm.reportType}
                    onChange={(e) => handleFormChange('reportType', e.target.value)}
                    required
                  >
                    <option value="daily">Daily Report</option>
                    <option value="monthly">Monthly Report</option>
                    <option value="yearly">Yearly Report</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Export Format</label>
                  <select
                    value={reportForm.format}
                    onChange={(e) => handleFormChange('format', e.target.value)}
                  >
                    <option value="pdf">PDF Document</option>
                    <option value="excel">Excel Spreadsheet</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date From</label>
                  <input
                    type="date"
                    value={reportForm.dateFrom}
                    onChange={(e) => handleFormChange('dateFrom', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Date To</label>
                  <input
                    type="date"
                    value={reportForm.dateTo}
                    onChange={(e) => handleFormChange('dateTo', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                {/* <div className="form-group">
                  <label>Department Filter</label>
                  <select
                    value={reportForm.department}
                    onChange={(e) => handleFormChange('department', e.target.value)}
                  >
                    <option value="all">All Departments</option>
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
                {/* <div className="form-group">
                  <label>Category Filter</label>
                  <select
                    value={reportForm.category}
                    onChange={(e) => handleFormChange('category', e.target.value)}
                  >
                    <option value="all">All Categories</option>
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
              </div>


            </div>
          </div>
          <div className="modal-actions generate-form-actions">
            <button
              type="button"
              className="generate-btn"
              onClick={() => {
                setShowGenerateFormModal(false);
                handleGenerateReport();
              }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Generating...
                </>
              ) : (
                <>
                  <i className="fas fa-chart-line"></i> Generate Report
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* PDF Preview Modal */}
    {showPDFPreview && (pdfPreviewUrl || overridePdfPreviewUrl) && (
      <div className="pdf-preview-modal-overlay" onClick={closePDFPreview}>
        <div className="pdf-preview-modal" onClick={(e) => e.stopPropagation()}>
          <div className="pdf-preview-header">
            <h2>
              <i className="fas fa-file-pdf"></i>
              PDF Preview
            </h2>
            <div className="pdf-preview-header-actions">
              <button 
                className="pdf-download-btn"
                onClick={() => {
                  if (overridePdfPreviewUrl) {
                    downloadPDFFromOverridePreview();
                  } else {
                    downloadPDFFromPreview();
                  }
                }}
                title="Download PDF"
              >
                <i className="fas fa-download"></i>
                Download PDF
              </button>
              <button 
                className="pdf-close-btn"
                onClick={closePDFPreview}
                title="Close Preview"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
          
          <div className="pdf-preview-container">
            <iframe 
              src={overridePdfPreviewUrl || pdfPreviewUrl} 
              type="application/pdf"
              className="pdf-preview-iframe"
              title="PDF Preview"
            />
          </div>
        </div>
      </div>
    )}
    </div>
    </>
  );
};

export default GenerateReports;
