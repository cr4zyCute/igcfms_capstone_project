import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import axios from 'axios';
import './css/dailyKPI.css';

const DailyKPI = ({ transactions = [], reports = [] }) => {
  const [dailyData, setDailyData] = useState({
    totalCollections: 0,
    totalDisbursements: 0,
    netBalance: 0,
    totalTransactions: 0,
    pendingApprovals: 0
  });
  const [hourlyData, setHourlyData] = useState([]);
  const [hasDailyTransactions, setHasDailyTransactions] = useState(false);
  const [roleSummary, setRoleSummary] = useState([]);
  const [summaryStats, setSummaryStats] = useState({
    totalRecords: 0,
    activeRoles: 0,
    totalReportsGenerated: 0
  });
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [historyData, setHistoryData] = useState([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [autoGenerateEnabled, setAutoGenerateEnabled] = useState(true); // Default to true
  const [lastAutoGenDate, setLastAutoGenDate] = useState(null);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const autoGenTimerRef = useRef(null);

  const calculateDailyData = () => {
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    // Filter today's transactions
    const todayTransactions = transactions.filter(t => {
      const createdAt = new Date(t.created_at || t.createdAt || t.created_at_local);
      if (Number.isNaN(createdAt.getTime())) return false;
      const transactionDate = createdAt.toISOString().split('T')[0];
      return transactionDate === today;
    });
    
    const hasTransactions = todayTransactions.length > 0;
    setHasDailyTransactions(hasTransactions);

    const collections = todayTransactions
      .filter(t => (t.transaction_type || t.type || '').toLowerCase() === 'collection')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0);

    const disbursements = todayTransactions
      .filter(t => (t.transaction_type || t.type || '').toLowerCase() === 'disbursement')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0);

    const pending = todayTransactions.filter(t => (t.status || '').toLowerCase() === 'pending').length;

    setDailyData({
      totalCollections: collections,
      totalDisbursements: disbursements,
      netBalance: collections - disbursements,
      totalTransactions: todayTransactions.length,
      pendingApprovals: pending
    });

    const hourlyBuckets = Array.from({ length: 24 }, (_, hour) => ({ hour, transactions: 0 }));

    todayTransactions.forEach(t => {
      const createdAt = new Date(t.created_at || t.createdAt);
      if (!Number.isNaN(createdAt.getTime())) {
        const hour = createdAt.getHours();
        if (hourlyBuckets[hour]) {
          hourlyBuckets[hour].transactions += 1;
        }
      }
    });

    const computedHourlyData = hourlyBuckets.filter(bucket => bucket.transactions > 0);
    setHourlyData(computedHourlyData.length > 0 ? computedHourlyData : hourlyBuckets);

    // Filter today's reports (daily reports only)
    const todayReports = reports.filter(r => {
      const generatedAt = new Date(r.generated_at || r.createdAt || r.created_at);
      if (Number.isNaN(generatedAt.getTime())) return false;
      const reportDate = generatedAt.toISOString().split('T')[0];
      
      // Check if it's today
      const isToday = reportDate === today;
      
      // Check if it's a daily report (same logic as History modal)
      const reportType = (r.report_type || r.type || '').toLowerCase();
      const isDailyReport = reportType.includes('daily') || reportType === 'report' || reportType === '' || !r.report_type;
      
      return isToday && isDailyReport;
    });

    // Combine transactions and reports for role tracking
    const rolesMap = {};

    // Track transaction activity by role
    todayTransactions.forEach(transaction => {
      const role = transaction.user_role
        || transaction.role
        || transaction.user?.role
        || transaction.creator?.role
        || transaction.created_by_role
        || 'Unspecified';
      
      if (!rolesMap[role]) {
        rolesMap[role] = { transactions: 0, reports: 0 };
      }
      rolesMap[role].transactions += 1;
    });

    // Track report generation activity by role
    todayReports.forEach(report => {
      const userData = report.generated_by && typeof report.generated_by === 'object'
        ? report.generated_by
        : null;
      const role = userData?.role || report.user_role || 'Unspecified';
      
      if (!rolesMap[role]) {
        rolesMap[role] = { transactions: 0, reports: 0 };
      }
      rolesMap[role].reports += 1;
    });

    let roleList = Object.entries(rolesMap)
      .map(([role, counts]) => ({ 
        role, 
        count: counts.transactions + counts.reports,
        transactions: counts.transactions,
        reports: counts.reports
      }))
      .sort((a, b) => b.count - a.count);

    if (roleList.length === 0 && todayTransactions.length > 0) {
      const typeCounts = todayTransactions.reduce((acc, t) => {
        const kind = (t.transaction_type || t.type || 'Transaction').toLowerCase();
        const label = kind === 'collection' ? 'Collections' : kind === 'disbursement' ? 'Disbursements' : 'Transactions';
        acc[label] = (acc[label] || 0) + 1;
        return acc;
      }, {});
      roleList = Object.entries(typeCounts)
        .map(([role, count]) => ({ role, count, transactions: count, reports: 0 }))
        .sort((a, b) => b.count - a.count);
    }

    setRoleSummary(roleList);
    setSummaryStats({
      totalRecords: todayTransactions.length,
      activeRoles: roleList.length,
      totalReportsGenerated: todayReports.length
    });
  };

  useEffect(() => {
    // Always calculate data (will use mock data if no transactions)
    calculateDailyData();
  }, [transactions, reports]);

  useEffect(() => {
    if (hourlyData.length > 0) {
      initializeChart();
    } else if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [hourlyData]);

  // Auto-generate daily report at end of day (11:59 PM)
  useEffect(() => {
    // Load auto-generate settings from localStorage (default to true if not set)
    const savedAutoGen = localStorage.getItem('dailyReportAutoGen');
    const savedLastDate = localStorage.getItem('dailyReportLastAutoGen');
    
    if (savedAutoGen === null) {
      // First time - set default to true
      setAutoGenerateEnabled(true);
      localStorage.setItem('dailyReportAutoGen', 'true');
    } else {
      setAutoGenerateEnabled(savedAutoGen === 'true');
    }
    
    if (savedLastDate) {
      setLastAutoGenDate(savedLastDate);
    }

    const checkAndGenerateReport = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const today = now.toISOString().split('T')[0];

      // Check if auto-generate is enabled
      if (!autoGenerateEnabled && savedAutoGen !== 'true') return;

      // Check if already generated today
      if (lastAutoGenDate === today || savedLastDate === today) return;

      // Generate report at 11:59 PM (23:59)
      if (currentHour === 23 && currentMinute === 59) {
        generateDailyReportAutomatically();
      }
    };

    // Check every minute
    const interval = setInterval(checkAndGenerateReport, 60000);
    
    // Also check immediately
    checkAndGenerateReport();

    return () => {
      clearInterval(interval);
    };
  }, [autoGenerateEnabled, lastAutoGenDate, transactions]);

  const generateDailyReportAutomatically = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const token = localStorage.getItem('token');
      const API_BASE = require('../../../config/api').default;

      // Prepare report data
      const reportData = {
        report_type: 'daily',
        generated_at: new Date().toISOString(),
        status: 'Generated',
        data: {
          date: today,
          totalCollections: dailyData.totalCollections,
          totalDisbursements: dailyData.totalDisbursements,
          netBalance: dailyData.netBalance,
          totalTransactions: dailyData.totalTransactions,
          pendingApprovals: dailyData.pendingApprovals
        }
      };

      // Save to backend
      await axios.post(`${API_BASE}/reports`, reportData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Update last generation date
      setLastAutoGenDate(today);
      localStorage.setItem('dailyReportLastAutoGen', today);

      console.log('Daily report auto-generated successfully for:', today);
    } catch (error) {
      console.error('Error auto-generating daily report:', error);
    }
  };


  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatCurrencyForPDF = (amount) => {
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Math.abs(amount));
    return 'PHP ' + formatted;
  };

  const handleOpenHistory = () => {
    setShowHistoryModal(true);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    setSelectedDate(yesterday.toISOString().split('T')[0]);
    loadHistoryData(yesterday.toISOString().split('T')[0]);
  };

  const handleCloseHistory = () => {
    setShowHistoryModal(false);
    setHistoryData([]);
  };

  const handleDownloadHistoryPDF = () => {
    if (!historyData || historyData.length === 0) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Add black border
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(2);
    doc.rect(5, 5, pageWidth - 10, pageHeight - 10);

    // Header - Black background
    doc.setFillColor(0, 0, 0);
    doc.rect(10, 10, pageWidth - 20, 35, 'F');
    
    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORT HISTORY', pageWidth / 2, 25, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const dateFormatted = new Date(selectedDate).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    doc.text(`Date: ${dateFormatted}`, pageWidth / 2, 35, { align: 'center' });

    let yPos = 55;

    // Summary Section
    doc.setTextColor(0, 0, 0);
    doc.setFillColor(0, 0, 0);
    doc.rect(10, yPos, pageWidth - 20, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('SUMMARY', 15, yPos + 5.5);
    
    yPos += 15;

    // Summary Table
    const totalReports = historyData.length;
    const adminReports = historyData.filter(r => r.user_role === 'Admin').length;
    const otherReports = historyData.filter(r => r.user_role !== 'Admin').length;

    autoTable(doc, {
      startY: yPos,
      head: [['Metric', 'Count']],
      body: [
        ['Total Reports Generated', String(totalReports)],
        ['By Admin', String(adminReports)],
        ['By Other Roles', String(otherReports)]
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
        0: { cellWidth: 100, fontStyle: 'bold', textColor: [107, 114, 128] },
        1: { cellWidth: 'auto', halign: 'center', fontStyle: 'bold' }
      },
      margin: { left: 15, right: 15 }
    });

    yPos = doc.lastAutoTable.finalY + 15;

    // Reports List Section
    doc.setFillColor(0, 0, 0);
    doc.rect(10, yPos, pageWidth - 20, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORTS LIST', 15, yPos + 5.5);
    
    yPos += 15;

    // Reports Table with transaction stats
    const reportRows = historyData.map(report => {
      const createdAt = new Date(report.created_at);
      const timeStr = !Number.isNaN(createdAt.getTime()) 
        ? createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        : 'N/A';
      
      // Get the date of the report
      const reportDate = new Date(report.created_at).toISOString().split('T')[0];
      
      // Filter transactions for that date
      const dateTransactions = transactions.filter(t => {
        const createdAt = new Date(t.created_at || t.createdAt || t.created_at_local);
        if (Number.isNaN(createdAt.getTime())) return false;
        const transactionDate = createdAt.toISOString().split('T')[0];
        return transactionDate === reportDate;
      });

      // Calculate transaction stats
      const totalTrans = dateTransactions.length;
      
      const collections = dateTransactions
        .filter(t => (t.transaction_type || t.type || '').toLowerCase() === 'collection')
        .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0);

      const disbursements = dateTransactions
        .filter(t => (t.transaction_type || t.type || '').toLowerCase() === 'disbursement')
        .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0);
      
      return [
        timeStr,
        report.report_type || 'Report',
        report.generated_by || 'N/A',
        report.user_role || 'N/A',
        String(totalTrans),
        formatCurrencyForPDF(collections),
        formatCurrencyForPDF(disbursements)
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [['Time', 'Type', 'Generated By', 'Role', 'Total Trans.', 'Collections', 'Disbursements']],
      body: reportRows,
      theme: 'grid',
      headStyles: {
        fillColor: [0, 0, 0],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8
      },
      bodyStyles: {
        fontSize: 7,
        cellPadding: 2
      },
      columnStyles: {
        0: { cellWidth: 18, halign: 'center' },
        1: { cellWidth: 22 },
        2: { cellWidth: 32 },
        3: { cellWidth: 28 },
        4: { cellWidth: 18, halign: 'center' },
        5: { cellWidth: 35, halign: 'right', textColor: [22, 101, 52], fontStyle: 'bold' },
        6: { cellWidth: 35, halign: 'right', textColor: [153, 27, 27], fontStyle: 'bold' }
      },
      margin: { left: 10, right: 10 }
    });

    // Footer
    const footerY = pageHeight - 15;
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleString('en-US')}`, 15, footerY);
    doc.text(`Page 1 of 1`, pageWidth - 15, footerY, { align: 'right' });

    // Save PDF
    const fileName = `Report_History_${selectedDate}.pdf`;
    doc.save(fileName);
  };

  const handleRowClick = (report) => {
    // Get the date of the report
    const reportDate = new Date(report.created_at).toISOString().split('T')[0];
    
    // Filter transactions for that date
    const dateTransactions = transactions.filter(t => {
      const createdAt = new Date(t.created_at || t.createdAt || t.created_at_local);
      if (Number.isNaN(createdAt.getTime())) return false;
      const transactionDate = createdAt.toISOString().split('T')[0];
      return transactionDate === reportDate;
    });

    // Calculate transaction stats
    const collections = dateTransactions
      .filter(t => (t.transaction_type || t.type || '').toLowerCase() === 'collection')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0);

    const collectionCount = dateTransactions
      .filter(t => (t.transaction_type || t.type || '').toLowerCase() === 'collection').length;

    const disbursements = dateTransactions
      .filter(t => (t.transaction_type || t.type || '').toLowerCase() === 'disbursement')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0);

    const disbursementCount = dateTransactions
      .filter(t => (t.transaction_type || t.type || '').toLowerCase() === 'disbursement').length;

    // Add transaction stats to report
    const enrichedReport = {
      ...report,
      totalTransactions: dateTransactions.length,
      collections,
      collectionCount,
      disbursements,
      disbursementCount
    };

    setSelectedReport(enrichedReport);
    setShowDetailsModal(true);
  };

  const handleCloseDetails = () => {
    setShowDetailsModal(false);
    setSelectedReport(null);
  };

  const handleDownloadPDF = () => {
    if (!selectedReport) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Add black border
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(2);
    doc.rect(5, 5, pageWidth - 10, pageHeight - 10);

    // Header - Black background
    doc.setFillColor(0, 0, 0);
    doc.rect(10, 10, pageWidth - 20, 35, 'F');
    
    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORT DETAILS', pageWidth / 2, 25, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('IGCFMS - Internal Grant Collection & Fund Management System', pageWidth / 2, 35, { align: 'center' });

    let yPos = 55;

    // Report Information Section
    doc.setTextColor(0, 0, 0);
    doc.setFillColor(0, 0, 0);
    doc.rect(10, yPos, pageWidth - 20, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORT INFORMATION', 15, yPos + 5.5);
    
    yPos += 15;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    // Report Info Table
    autoTable(doc, {
      startY: yPos,
      head: [['Field', 'Value']],
      body: [
        ['Report Type', selectedReport.report_type || 'N/A'],
        ['Status', selectedReport.status || 'Generated'],
        ['Generated By', selectedReport.generated_by || 'N/A'],
        ['Role', selectedReport.user_role || 'N/A'],
        ['Generated Date', new Date(selectedReport.created_at).toLocaleString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit', 
          minute: '2-digit',
          second: '2-digit'
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

    // Transaction Statistics Section
    doc.setFillColor(0, 0, 0);
    doc.rect(10, yPos, pageWidth - 20, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TRANSACTION STATISTICS', 15, yPos + 5.5);
    
    yPos += 15;

    // Stats Table
    autoTable(doc, {
      startY: yPos,
      head: [['Metric', 'Count', 'Amount']],
      body: [
        ['Total Transactions', String(selectedReport.totalTransactions || 0), '-'],
        ['Collections', String(selectedReport.collectionCount || 0), formatCurrencyForPDF(selectedReport.collections || 0)],
        ['Disbursements', String(selectedReport.disbursementCount || 0), formatCurrencyForPDF(selectedReport.disbursements || 0)]
      ],
      theme: 'grid',
      headStyles: {
        fillColor: [0, 0, 0],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 70, fontStyle: 'bold', textColor: [107, 114, 128] },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 85, halign: 'right', fontStyle: 'bold', overflow: 'linebreak' }
      },
      didParseCell: function(data) {
        if (data.row.index === 1 && data.column.index === 2) {
          data.cell.styles.textColor = [22, 101, 52]; // Dark green for collections
        }
        if (data.row.index === 2 && data.column.index === 2) {
          data.cell.styles.textColor = [153, 27, 27]; // Dark red for disbursements
        }
      },
      margin: { left: 15, right: 15 },
      tableWidth: 'auto'
    });

    // Footer
    const footerY = pageHeight - 15;
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleString('en-US')}`, 15, footerY);
    doc.text(`Page 1 of 1`, pageWidth - 15, footerY, { align: 'right' });

    // Save PDF
    const fileName = `Report_${selectedReport.report_type || 'Details'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    loadHistoryData(newDate);
  };

  const loadHistoryData = (date) => {
    if (!date) return;
    
    console.log('=== DAILY REPORT HISTORY DEBUG ===');
    console.log('Loading history for date:', date);
    console.log('Total reports available:', reports.length);
    console.log('All reports:', reports);
    
    // Filter reports for the selected date (show ALL reports for that date, including manual ones)
    const dateReports = reports.filter(r => {
      const generatedAt = new Date(r.generated_at || r.createdAt || r.created_at);
      if (Number.isNaN(generatedAt.getTime())) {
        console.log('⚠️ Invalid date for report:', r);
        return false;
      }
      const reportDate = generatedAt.toISOString().split('T')[0];
      
      // Match the date
      const isMatchingDate = reportDate === date;
      
      // Accept daily reports OR any report without a specific type (manual reports)
      const reportType = (r.report_type || r.type || '').toLowerCase();
      const isDailyReport = reportType.includes('daily') || reportType === 'report' || reportType === '' || !r.report_type;
      
      console.log('📊 Report Check:', {
        id: r.id,
        report_type: r.report_type,
        type: r.type,
        generatedAt: generatedAt.toISOString(),
        reportDate: reportDate,
        selectedDate: date,
        matchesDate: isMatchingDate,
        isDailyReport: isDailyReport,
        WILL_SHOW: isMatchingDate && isDailyReport
      });
      
      return isMatchingDate && isDailyReport;
    });

    console.log('✅ Filtered reports for date:', dateReports.length);
    console.log('Filtered reports:', dateReports);

    // Transform reports to display format and sort by time (most recent first)
    const transformedReports = dateReports
      .map(report => ({
        id: `report-${report.id}`,
        created_at: report.generated_at || report.createdAt || report.created_at,
        report_type: report.report_type || report.type || 'Report',
        status: report.status || 'Generated',
        user_role: report.generated_by?.role || report.user_role || 'N/A',
        generated_by: report.generated_by?.name || report.generated_by_name || 'N/A'
      }))
      .sort((a, b) => {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return dateB - dateA; // Most recent first
      });

    setHistoryData(transformedReports);
  };

  const initializeChart = () => {
    if (!chartRef.current) {
      console.log('Canvas ref not available');
      return;
    }

    // Wait for canvas to be properly mounted
    setTimeout(() => {
      if (!chartRef.current) {
        console.log('Canvas ref not available after timeout');
        return;
      }

      const ctx = chartRef.current.getContext('2d');

      // Destroy existing chart
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      // Prepare chart data
      const chartLabels = hourlyData.map(d => `${d.hour}:00`);
      const chartData = hourlyData.map(d => d.transactions);

      // Monochrome gradient (black to light gray)
      const gradient = ctx.createLinearGradient(0, 0, 0, chartRef.current?.clientHeight || 250);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.35)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.05)');

      // Border gradient
      const borderGradient = ctx.createLinearGradient(0, 0, chartRef.current?.clientWidth || 400, 0);
      borderGradient.addColorStop(0, '#000000');
      borderGradient.addColorStop(1, '#000000');

      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: chartLabels,
          datasets: [{
            label: 'Transactions per hour',
            data: chartData,
            borderColor: borderGradient,
            backgroundColor: gradient,
            borderWidth: 3,
            fill: 'start',
            tension: 0,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointBackgroundColor: '#0f172a',
            pointBorderColor: '#f9fafb',
            pointBorderWidth: 2,
            pointHitRadius: 12,
            spanGaps: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 1400,
            easing: 'easeInOutCubic'
          },
          layout: {
            padding: {
              top: 16,
              bottom: 8,
              left: 8,
              right: 16
            }
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: '#111827',
              titleColor: '#f9fafb',
              bodyColor: '#f3f4f6',
              borderColor: '#0f172a',
              borderWidth: 1,
              cornerRadius: 8,
              displayColors: false,
              padding: 12,
              titleFont: { size: 12, weight: '700' },
              bodyFont: { size: 11, weight: '500' },
              callbacks: {
                title: (context) => context[0].label,
                label: (context) => `Transactions: ${context.parsed.y}`
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                color: '#1f2937',
                font: { size: 11, weight: '600' },
                padding: 10,
                precision: 0
              },
              grid: {
                color: 'rgba(17, 24, 39, 0.08)',
                drawBorder: false,
                tickLength: 0
              }
            },
            x: {
              ticks: {
                color: '#1f2937',
                font: { size: 11, weight: '600' },
                padding: 8,
                maxRotation: 0,
                minRotation: 0
              },
              grid: {
                color: 'rgba(17, 24, 39, 0.06)',
                drawBorder: false,
                tickLength: 0
              }
            }
          },
          elements: {
            line: {
              borderJoinStyle: 'round'
            }
          },
          interaction: {
            intersect: false,
            mode: 'index'
          }
        }
      });

    }, 100);
  };

  return (
    <div className="daily-kpi-container">
      <div className="daily-kpi-header">
        <div className="header-left">
          <i className="fas fa-calendar-day"></i>
          <h3>DAILY REPORT (Operational Monitoring)</h3>
        </div>
        <button className="history-button" onClick={handleOpenHistory}>
          <i className="fas fa-history"></i>
          History
        </button>
      </div>
      
      <div className="daily-kpi-metrics">
        <div className="kpi-metric-card">
          <div className="metric-info">
            <div className="metric-label">Total Collections</div>
            <div className="metric-value collections">
              {formatCurrency(dailyData.totalCollections)}
            </div>
          </div>
        </div>

        <div className="kpi-metric-card">
          <div className="metric-info">
            <div className="metric-label">Total Disbursements</div>
            <div className="metric-value disbursements">
              {formatCurrency(dailyData.totalDisbursements)}
            </div>
          </div>
        </div>

        <div className="kpi-metric-card">
          <div className="metric-info">
            <div className="metric-label">Net Balance</div>
            <div className="metric-value net-balance">
              {formatCurrency(dailyData.netBalance)}
            </div>
          </div>
        </div>

        <div className="kpi-metric-card">
          <div className="metric-info">
            <div className="metric-label">Total Transactions</div>
            <div className="metric-value transactions">
              {dailyData.totalTransactions}
            </div>
          </div>
        </div>

        <div className="kpi-metric-card">
          <div className="metric-info">
            <div className="metric-label">Pending Approvals</div>
            <div className="metric-value pending">
              {dailyData.pendingApprovals}
            </div>
          </div>
        </div>
      </div>
      
      {/* Chart Section with Summary Box */}
      <div className="daily-chart-section">
        {/* Left Summary Box */}
        <div className="daily-summary-box">
          <h4>Daily Report Status</h4>
          
          <div className="role-cards-container">
            {roleSummary.length > 0 ? (
              roleSummary.map(({ role, count, transactions, reports }) => (
                <div className="role-card" key={role}>
                  <div className="role-card-header">
                    <div className="role-card-title">
                      <span>{role}</span>
                    </div>
                    <div className={`role-status-indicator ${count > 0 ? 'active' : 'inactive'}`}></div>
                  </div>
                  <div className="role-card-content">
                    <div className="role-card-stats">
                      <div className="role-stat-item">
                        <span className="role-card-label">Transactions</span>
                        <span className={`role-card-value ${transactions > 0 ? 'active' : 'inactive'}`}>{transactions || 0}</span>
                      </div>
                      <div className="role-stat-item">
                        <span className="role-card-label">Reports Generated</span>
                        <span className={`role-card-value ${reports > 0 ? 'active' : 'inactive'}`}>{reports || 0}</span>
                      </div>
                    </div>
                    <div className="role-card-total">
                      <span className="role-card-label">Total Activity</span>
                      <span className={`role-card-value total ${count > 0 ? 'active' : 'inactive'}`}>{count}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state small">No roles recorded activity today.</div>
            )}
          </div>

          <div className="summary-stats">
            <div className="summary-stat-row">
              <span className="summary-stat-label">Total Transactions Today</span>
              <span className="summary-stat-value">{summaryStats.totalRecords}</span>
            </div>
            <div className="summary-stat-row">
              <span className="summary-stat-label">Reports Generated Today</span>
              <span className="summary-stat-value">{summaryStats.totalReportsGenerated}</span>
            </div>
            <div className="summary-stat-row">
              <span className="summary-stat-label">Active Roles</span>
              <span className="summary-stat-value small success">{summaryStats.activeRoles}</span>
            </div>
          </div>
        </div>

        {/* Right Chart Container */}
        <div className="daily-chart-container">
          <h4>Transactions Per Hour (Daily Activity Trend)</h4>
          <div className="chart-container">
            {hasDailyTransactions && hourlyData.length > 0 ? (
              <canvas ref={chartRef}></canvas>
            ) : (
              <div className="empty-state">No hourly transaction activity recorded today.</div>
            )}
          </div>
        </div>
      </div>

      {/* History Modal */}
      {showHistoryModal && (
        <div className="history-modal-overlay" onClick={handleCloseHistory}>
          <div className="history-modal" onClick={(e) => e.stopPropagation()}>
            <div className="history-modal-header">
              <h3>
                <i className="fas fa-history"></i>
                Report History
              </h3>
              <div className="header-actions">
                <button className="download-button" onClick={handleDownloadHistoryPDF} title="Download History PDF">
                  <i className="fas fa-download"></i>
                  Download PDF
                </button>
                <button className="close-button" onClick={handleCloseHistory}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>
            
            <div className="history-modal-body">
              <div className="date-selector">
                <label htmlFor="history-date">Select Date:</label>
                <input
                  type="date"
                  id="history-date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="history-summary">
                <div className="history-summary-item">
                  <span className="label">Total Reports Generated:</span>
                  <span className="value">{historyData.length}</span>
                </div>
                <div className="history-summary-item">
                  <span className="label">By Admin:</span>
                  <span className="value">
                    {historyData.filter(r => r.user_role === 'Admin').length}
                  </span>
                </div>
                <div className="history-summary-item">
                  <span className="label">By Other Roles:</span>
                  <span className="value">
                    {historyData.filter(r => r.user_role !== 'Admin').length}
                  </span>
                </div>
              </div>

              <div className="history-table-container">
                {historyData.length > 0 ? (
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>Time Generated</th>
                        <th>Report Type</th>
                        <th>Generated By</th>
                        <th>Role</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyData.map((report, index) => {
                        const createdAt = new Date(report.created_at);
                        const timeStr = !Number.isNaN(createdAt.getTime()) 
                          ? createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                          : 'N/A';
                        const reportType = report.report_type || 'Report';
                        const status = report.status || 'Generated';
                        const role = report.user_role || 'N/A';
                        const generatedBy = report.generated_by || 'N/A';
                        
                        return (
                          <tr 
                            key={report.id || index}
                            className="clickable-row"
                            onClick={() => handleRowClick(report)}
                            title="Click to view details"
                          >
                            <td>{timeStr}</td>
                            <td>
                              <span className="type-badge report">
                                {reportType}
                              </span>
                            </td>
                            <td>{generatedBy}</td>
                            <td>{role}</td>
                            <td>
                              <span className={`status-badge ${status.toLowerCase()}`}>
                                {status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty-state">No reports generated on the selected date.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Details Modal */}
      {showDetailsModal && selectedReport && (
        <div className="history-modal-overlay" onClick={handleCloseDetails}>
          <div className="details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="history-modal-header">
              <h3>
                <i className="fas fa-file-alt"></i>
                Report Details
              </h3>
              <div className="header-actions">
                <button className="download-button" onClick={handleDownloadPDF} title="Download PDF">
                  <i className="fas fa-download"></i>
                  Download PDF
                </button>
                <button className="close-button" onClick={handleCloseDetails}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>
            
            <div className="details-modal-body">
              {/* Report Information Section */}
              <div className="detail-section">
                <h4 className="section-title">Report Information</h4>
                <div className="detail-grid">
                  <div className="detail-card">
                    <span className="detail-label">Report Type</span>
                    <span className="detail-value">
                      <span className="type-badge report">
                        {selectedReport.report_type || 'Report'}
                      </span>
                    </span>
                  </div>
                  
                  <div className="detail-card">
                    <span className="detail-label">Status</span>
                    <span className="detail-value">
                      <span className={`status-badge ${(selectedReport.status || 'Generated').toLowerCase()}`}>
                        {selectedReport.status || 'Generated'}
                      </span>
                    </span>
                  </div>
                  
                  <div className="detail-card">
                    <span className="detail-label">Generated By</span>
                    <span className="detail-value">{selectedReport.generated_by || 'N/A'}</span>
                  </div>
                  
                  <div className="detail-card">
                    <span className="detail-label">Role</span>
                    <span className="detail-value">{selectedReport.user_role || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Transaction Statistics Section */}
              <div className="detail-section">
                <h4 className="section-title">Transaction Statistics</h4>
                <div className="detail-grid">
                  <div className="detail-card stat-card">
                    <span className="detail-label">Total Transactions</span>
                    <span className="detail-value stat-value">{selectedReport.totalTransactions || 0}</span>
                  </div>
                  
                  <div className="detail-card stat-card collections-card">
                    <span className="detail-label">Collections</span>
                    <div className="stat-group">
                      <span className="detail-value stat-value">{formatCurrency(selectedReport.collections || 0)}</span>
                      <span className="stat-count">({selectedReport.collectionCount || 0} transactions)</span>
                    </div>
                  </div>
                  
                  <div className="detail-card stat-card disbursements-card">
                    <span className="detail-label">Disbursements</span>
                    <div className="stat-group">
                      <span className="detail-value stat-value">{formatCurrency(selectedReport.disbursements || 0)}</span>
                      <span className="stat-count">({selectedReport.disbursementCount || 0} transactions)</span>
                    </div>
                  </div>
                  
                  <div className="detail-card stat-card">
                    <span className="detail-label">Generated</span>
                    <span className="detail-value">
                      {new Date(selectedReport.created_at).toLocaleString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit', 
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DailyKPI;