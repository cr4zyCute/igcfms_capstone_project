import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import axios from 'axios';
import './css/monthlyKPI.css';

const MonthlyKPI = ({ transactions = [], reports = [] }) => {
  const [monthlyData, setMonthlyData] = useState({
    totalCollections: 0,
    totalDisbursements: 0,
    collectionRate: 0,
    target: 0,
    approvedCount: 0,
    rejectedCount: 0,
    avgProcessingTime: 0
  });
  const [dailyData, setDailyData] = useState([]);
  const [approvalData, setApprovalData] = useState([]);
  const [processingTimeData, setProcessingTimeData] = useState([]);
  const [hasMonthlyTransactions, setHasMonthlyTransactions] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [historyData, setHistoryData] = useState([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [autoGenerateEnabled, setAutoGenerateEnabled] = useState(true);
  const [lastAutoGenMonth, setLastAutoGenMonth] = useState(null);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [pdfFileName, setPdfFileName] = useState(null);
  const [previewType, setPreviewType] = useState(null); // 'details' or 'history'

  // Chart refs
  const lineChartRef = useRef(null);
  const pieChartRef = useRef(null);
  const barChartRef = useRef(null);
  const lineChartInstance = useRef(null);
  const pieChartInstance = useRef(null);
  const barChartInstance = useRef(null);

  useEffect(() => {
    calculateMonthlyData();
  }, [transactions]);

  useEffect(() => {
    if (dailyData.length > 0) {
      initializeLineChart();
    } else if (lineChartInstance.current) {
      lineChartInstance.current.destroy();
      lineChartInstance.current = null;
    }
    return () => {
      if (lineChartInstance.current) {
        lineChartInstance.current.destroy();
      }
    };
  }, [dailyData]);

  useEffect(() => {
    if (approvalData.length > 0) {
      initializePieChart();
    } else if (pieChartInstance.current) {
      pieChartInstance.current.destroy();
      pieChartInstance.current = null;
    }
    return () => {
      if (pieChartInstance.current) {
        pieChartInstance.current.destroy();
      }
    };
  }, [approvalData]);

  useEffect(() => {
    if (processingTimeData.length > 0) {
      initializeBarChart();
    } else if (barChartInstance.current) {
      barChartInstance.current.destroy();
      barChartInstance.current = null;
    }
    return () => {
      if (barChartInstance.current) {
        barChartInstance.current.destroy();
      }
    };
  }, [processingTimeData]);

  const calculateMonthlyData = () => {
    // Get current month dates
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
    const monthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.created_at);
      return !Number.isNaN(transactionDate.getTime()) && transactionDate >= firstDay && transactionDate <= lastDay;
    });

    setHasMonthlyTransactions(monthTransactions.length > 0);

    if (monthTransactions.length === 0) {
      setMonthlyData({
        totalCollections: 0,
        totalDisbursements: 0,
        collectionRate: 0,
        target: 0,
        approvedCount: 0,
        rejectedCount: 0,
        avgProcessingTime: 0
      });
      setDailyData([]);
      setApprovalData([]);
      setProcessingTimeData([]);
      return;
    }

    const collections = monthTransactions
      .filter(t => (t.transaction_type || t.type || '').toLowerCase() === 'collection')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0);

    const disbursements = monthTransactions
      .filter(t => (t.transaction_type || t.type || '').toLowerCase() === 'disbursement')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0);

    const approved = monthTransactions.filter(t => (t.status || '').toLowerCase() === 'approved').length
      || monthTransactions.filter(t => (t.approval_status || '').toLowerCase() === 'approved').length;
    const rejected = monthTransactions.filter(t => (t.status || t.approval_status || '').toLowerCase() === 'rejected').length;

    const target = monthTransactions.reduce((sum, t) => {
      const targetAmount = parseFloat(t.target_amount || t.monthly_target);
      return sum + (Number.isFinite(targetAmount) ? targetAmount : 0);
    }, 0);

    const fallbackTarget = target > 0
      ? target
      : collections > 0
        ? collections * 1.1
        : disbursements > 0
          ? disbursements * 1.1
          : 0;

    const collectionRate = fallbackTarget > 0 ? (collections / fallbackTarget) * 100 : 0;

    const processingTimes = monthTransactions
      .filter(t => t.processed_at && t.created_at)
      .map(t => {
        const created = new Date(t.created_at);
        const processed = new Date(t.processed_at);
        return (processed - created) / (1000 * 60 * 60);
      })
      .filter(time => Number.isFinite(time) && time >= 0);

    const avgProcessingTime = processingTimes.length > 0
      ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
      : 0;

    setMonthlyData({
      totalCollections: collections,
      totalDisbursements: disbursements,
      collectionRate,
      target: fallbackTarget,
      approvedCount: approved,
      rejectedCount: rejected,
      avgProcessingTime
    });

    const dailyMap = {};
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      dailyMap[dateKey] = { date: dateKey, collections: 0, disbursements: 0 };
    }

    monthTransactions.forEach(t => {
      const dateKey = new Date(t.created_at).toISOString().split('T')[0];
      if (dailyMap[dateKey]) {
        const amount = Math.abs(parseFloat(t.amount) || 0);
        const kind = (t.transaction_type || t.type || '').toLowerCase();
        if (kind === 'collection') {
          dailyMap[dateKey].collections += amount;
        } else if (kind === 'disbursement') {
          dailyMap[dateKey].disbursements += amount;
        }
      }
    });

    const normalizedDailyData = Object.values(dailyMap)
      .map(d => ({
        date: new Date(d.date).getDate(),
        collections: d.collections,
        disbursements: d.disbursements
      }))
      .filter(d => d.collections > 0 || d.disbursements > 0);
    setDailyData(normalizedDailyData);

    let approvals = [];
    if (approved > 0) approvals.push({ name: 'Approved', value: approved, color: '#166534' });
    if (rejected > 0) approvals.push({ name: 'Rejected', value: rejected, color: '#991b1b' });
    if (approvals.length === 0 && monthTransactions.length > 0) {
      const collectionCount = monthTransactions.filter(t => (t.transaction_type || t.type || '').toLowerCase() === 'collection').length;
      const disbursementCount = monthTransactions.filter(t => (t.transaction_type || t.type || '').toLowerCase() === 'disbursement').length;
      if (collectionCount > 0) approvals.push({ name: 'Collections', value: collectionCount, color: '#166534' });
      if (disbursementCount > 0) approvals.push({ name: 'Disbursements', value: disbursementCount, color: '#991b1b' });
      if (approvals.length === 0) {
        approvals.push({ name: 'Transactions', value: monthTransactions.length, color: '#3b82f6' });
      }
    }
    setApprovalData(approvals);

    const deptMap = monthTransactions.reduce((acc, t) => {
      const departmentName = t.department || t.department_name;
      const processedAtRaw = t.processed_at || t.updated_at;
      if (processedAtRaw && t.created_at && departmentName) {
        const created = new Date(t.created_at);
        const processed = new Date(processedAtRaw);
        const hours = (processed - created) / (1000 * 60 * 60);
        if (!Number.isFinite(hours) || hours < 0) {
          return acc;
        }
        const dept = departmentName;
        if (!acc[dept]) {
          acc[dept] = { total: 0, count: 0 };
        }
        acc[dept].total += hours;
        acc[dept].count += 1;
      }
      return acc;
    }, {});

    let processingData = Object.entries(deptMap)
      .map(([department, value]) => ({ department, avgTime: value.total / value.count }))
      .filter(item => Number.isFinite(item.avgTime));
    if (processingData.length === 0 && monthTransactions.length > 0) {
      const deptCounts = monthTransactions.reduce((acc, t) => {
        const dept = t.department || t.department_name || 'Unspecified';
        acc[dept] = (acc[dept] || 0) + 1;
        return acc;
      }, {});
      processingData = Object.entries(deptCounts).map(([department, count]) => ({
        department,
        avgTime: count
      }));
    }
    setProcessingTimeData(processingData);
  };

  const initializeLineChart = () => {
    if (!lineChartRef.current) return;

    setTimeout(() => {
      if (!lineChartRef.current) return;

      const ctx = lineChartRef.current.getContext('2d');

      if (lineChartInstance.current) {
        lineChartInstance.current.destroy();
      }

      const labels = dailyData.map(d => `Day ${d.date}`);
      const collectionsData = dailyData.map(d => d.collections);
      const disbursementsData = dailyData.map(d => d.disbursements);

      lineChartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Collections',
              data: collectionsData,
              borderColor: '#166534',
              backgroundColor: 'rgba(22, 101, 52, 0.1)',
              borderWidth: 3,
              fill: true,
              tension: 0,
              pointRadius: 3,
              pointHoverRadius: 6,
              pointBackgroundColor: '#166534',
              pointBorderColor: '#fff',
              pointBorderWidth: 2
            },
            {
              label: 'Disbursements',
              data: disbursementsData,
              borderColor: '#991b1b',
              backgroundColor: 'rgba(153, 27, 27, 0.1)',
              borderWidth: 3,
              fill: true,
              tension: 0,
              pointRadius: 3,
              pointHoverRadius: 6,
              pointBackgroundColor: '#991b1b',
              pointBorderColor: '#fff',
              pointBorderWidth: 2
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 1400,
            easing: 'easeInOutCubic'
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
              padding: 12,
              callbacks: {
                label: (context) => `${context.dataset.label}: ₱${context.parsed.y.toLocaleString()}`
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                color: '#1f2937',
                font: { size: 11, weight: '600' },
                callback: (value) => `₱${(value / 1000).toFixed(0)}K`
              },
              grid: {
                color: 'rgba(17, 24, 39, 0.08)',
                drawBorder: false
              }
            },
            x: {
              ticks: {
                color: '#1f2937',
                font: { size: 11, weight: '600' },
                maxRotation: 0,
                autoSkip: true,
                maxTicksLimit: 10
              },
              grid: {
                color: 'rgba(17, 24, 39, 0.06)',
                drawBorder: false
              }
            }
          }
        }
      });
    }, 100);
  };

  const initializePieChart = () => {
    if (!pieChartRef.current || approvalData.length === 0) return;

    setTimeout(() => {
      if (!pieChartRef.current) return;

      const ctx = pieChartRef.current.getContext('2d');

      if (pieChartInstance.current) {
        pieChartInstance.current.destroy();
      }

      pieChartInstance.current = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: approvalData.map(d => d.name),
          datasets: [{
            data: approvalData.map(d => d.value),
            backgroundColor: approvalData.map(d => d.color),
            borderWidth: 3,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 1400,
            easing: 'easeInOutCubic'
          },
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                font: { size: 13, weight: '600' },
                color: '#111827',
                padding: 20,
                usePointStyle: true,
                pointStyle: 'circle'
              }
            },
            tooltip: {
              backgroundColor: '#111827',
              titleColor: '#f9fafb',
              bodyColor: '#f3f4f6',
              borderColor: '#0f172a',
              borderWidth: 1,
              cornerRadius: 8,
              padding: 12,
              callbacks: {
                label: (context) => `${context.label}: ${context.parsed}`
              }
            }
          }
        }
      });
    }, 150);
  };

  const initializeBarChart = () => {
    if (!barChartRef.current || processingTimeData.length === 0) return;

    setTimeout(() => {
      if (!barChartRef.current) return;

      const ctx = barChartRef.current.getContext('2d');

      if (barChartInstance.current) {
        barChartInstance.current.destroy();
      }

      const labels = processingTimeData.map(d => d.department);
      const data = processingTimeData.map(d => d.avgTime);

      barChartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Avg Time (hours)',
            data,
            backgroundColor: '#000000',
            borderColor: '#000000',
            borderWidth: 1,
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 1400,
            easing: 'easeInOutCubic'
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
              padding: 12,
              callbacks: {
                label: (context) => `${context.parsed.y.toFixed(1)} hours`
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                color: '#1f2937',
                font: { size: 11, weight: '600' },
                callback: (value) => `${value}h`
              },
              grid: {
                color: 'rgba(17, 24, 39, 0.08)',
                drawBorder: false
              }
            },
            x: {
              ticks: {
                color: '#1f2937',
                font: { size: 11, weight: '600' }
              },
              grid: {
                display: false
              }
            }
          }
        }
      });
    }, 100);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatCurrencyForPDF = (amount) => {
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Math.abs(amount));
    return 'PHP ' + formatted;
  };

  // Auto-generate monthly report on last day of month at 11:59 PM
  useEffect(() => {
    const savedAutoGen = localStorage.getItem('monthlyReportAutoGen');
    const savedLastMonth = localStorage.getItem('monthlyReportLastAutoGen');
    
    if (savedAutoGen === null) {
      setAutoGenerateEnabled(true);
      localStorage.setItem('monthlyReportAutoGen', 'true');
    } else {
      setAutoGenerateEnabled(savedAutoGen === 'true');
    }
    
    if (savedLastMonth) {
      setLastAutoGenMonth(savedLastMonth);
    }

    const checkAndGenerateReport = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      // Check if it's the last day of the month
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isLastDayOfMonth = tomorrow.getMonth() !== now.getMonth();

      if (!autoGenerateEnabled && savedAutoGen !== 'true') return;
      if (lastAutoGenMonth === currentMonth || savedLastMonth === currentMonth) return;
      
      // Generate on last day of month at 11:59 PM
      if (isLastDayOfMonth && currentHour === 23 && currentMinute === 59) {
        generateMonthlyReportAutomatically();
      }
    };

    const interval = setInterval(checkAndGenerateReport, 60000);
    checkAndGenerateReport();

    return () => clearInterval(interval);
  }, [autoGenerateEnabled, lastAutoGenMonth, monthlyData]);

  const generateMonthlyReportAutomatically = async () => {
    try {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const token = localStorage.getItem('token');
      const API_BASE = require('../../../config/api').default;

      const reportData = {
        report_type: 'monthly',
        generated_at: new Date().toISOString(),
        status: 'Generated',
        data: {
          month: currentMonth,
          totalCollections: monthlyData.totalCollections,
          totalDisbursements: monthlyData.totalDisbursements,
          collectionRate: monthlyData.collectionRate,
          approvedCount: monthlyData.approvedCount,
          rejectedCount: monthlyData.rejectedCount,
          avgProcessingTime: monthlyData.avgProcessingTime
        }
      };

      await axios.post(`${API_BASE}/reports`, reportData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setLastAutoGenMonth(currentMonth);
      localStorage.setItem('monthlyReportLastAutoGen', currentMonth);

      console.log('Monthly report auto-generated successfully for:', currentMonth);
    } catch (error) {
      console.error('Error auto-generating monthly report:', error);
    }
  };

  const handleOpenHistory = () => {
    setShowHistoryModal(true);
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(monthStr);
    loadHistoryData(monthStr);
  };

  const handleCloseHistory = () => {
    setShowHistoryModal(false);
    setHistoryData([]);
  };

  const handleMonthChange = (e) => {
    const newMonth = e.target.value;
    setSelectedMonth(newMonth);
    loadHistoryData(newMonth);
  };

  const loadHistoryData = (monthStr) => {
    if (!monthStr) return;
    
    const [year, month] = monthStr.split('-').map(Number);
    
    console.log('Loading monthly history for:', monthStr);
    console.log('Total reports available:', reports.length);
    
    // Filter MONTHLY reports for the selected month (show all reports generated within that month)
    const monthReports = reports.filter(r => {
      const generatedAt = new Date(r.generated_at || r.createdAt || r.created_at);
      if (Number.isNaN(generatedAt.getTime())) return false;
      
      // Check if it's in the selected month
      const isInMonth = generatedAt.getFullYear() === year && generatedAt.getMonth() + 1 === month;
      
      // Check if it's a monthly report (accept monthly, report, or empty)
      const reportType = (r.report_type || r.type || '').toLowerCase();
      const isMonthlyReport = reportType.includes('monthly') || reportType === 'report' || reportType === '';
      
      console.log('Report:', {
        id: r.id,
        type: r.report_type,
        generatedAt: generatedAt.toISOString(),
        isInMonth: isInMonth,
        isMonthlyReport: isMonthlyReport
      });
      
      return isInMonth && isMonthlyReport;
    });

    console.log('Filtered monthly reports:', monthReports.length);

    // Transform reports to display format and sort by time (most recent first)
    const transformedReports = monthReports
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

  const handleRowClick = (report) => {
    // Get the month of the report
    const reportDate = new Date(report.created_at);
    const year = reportDate.getFullYear();
    const month = reportDate.getMonth();
    
    // Filter transactions for that month
    const monthTransactions = transactions.filter(t => {
      const createdAt = new Date(t.created_at || t.createdAt || t.created_at_local);
      if (Number.isNaN(createdAt.getTime())) return false;
      return createdAt.getFullYear() === year && createdAt.getMonth() === month;
    });

    // Calculate transaction stats
    const collections = monthTransactions
      .filter(t => (t.transaction_type || t.type || '').toLowerCase() === 'collection')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0);

    const collectionCount = monthTransactions
      .filter(t => (t.transaction_type || t.type || '').toLowerCase() === 'collection').length;

    const disbursements = monthTransactions
      .filter(t => (t.transaction_type || t.type || '').toLowerCase() === 'disbursement')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0);

    const disbursementCount = monthTransactions
      .filter(t => (t.transaction_type || t.type || '').toLowerCase() === 'disbursement').length;

    // Add transaction stats to report
    const enrichedReport = {
      ...report,
      totalTransactions: monthTransactions.length,
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

  const generateDetailsPDF = () => {
    if (!selectedReport) return null;

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
    doc.text('IGCFMS - Monthly Performance Evaluation', pageWidth / 2, 35, { align: 'center' });

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

    return doc;
  };

  const handleDownloadPDF = () => {
    const doc = generateDetailsPDF();
    if (!doc) return;
    
    const fileName = `Monthly_Report_${selectedReport.report_type || 'Details'}_${new Date().toISOString().split('T')[0]}.pdf`;
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    
    setPdfPreviewUrl(pdfUrl);
    setPdfFileName(fileName);
    setPreviewType('details');
    setShowPDFPreview(true);
  };

  const handleDownloadHistoryPDF = () => {
    if (!historyData || historyData.length === 0) return;

    const doc = generateHistoryPDF();
    if (!doc) return;

    const fileName = `Monthly_Report_History_${selectedMonth}.pdf`;
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    
    setPdfPreviewUrl(pdfUrl);
    setPdfFileName(fileName);
    setPreviewType('history');
    setShowPDFPreview(true);
  };

  const generateHistoryPDF = () => {
    if (!historyData || historyData.length === 0) return null;

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
    doc.text('MONTHLY REPORT HISTORY', pageWidth / 2, 25, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const [year, month] = selectedMonth.split('-');
    const monthName = new Date(year, month - 1).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    doc.text(`Month: ${monthName}`, pageWidth / 2, 35, { align: 'center' });

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
    const [yearNum, monthNum] = selectedMonth.split('-').map(Number);
    const reportRows = historyData.map(report => {
      const createdAt = new Date(report.created_at);
      const timeStr = !Number.isNaN(createdAt.getTime()) 
        ? createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        : 'N/A';
      
      // Get the month of the report
      const reportDate = new Date(report.created_at);
      const year = reportDate.getFullYear();
      const month = reportDate.getMonth();
      
      // Filter transactions for that month
      const monthTransactions = transactions.filter(t => {
        const createdAt = new Date(t.created_at || t.createdAt || t.created_at_local);
        if (Number.isNaN(createdAt.getTime())) return false;
        return createdAt.getFullYear() === year && createdAt.getMonth() === month;
      });

      // Calculate transaction stats
      const totalTrans = monthTransactions.length;
      
      const collections = monthTransactions
        .filter(t => (t.transaction_type || t.type || '').toLowerCase() === 'collection')
        .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0);

      const disbursements = monthTransactions
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
      head: [['Date/Time', 'Type', 'Generated By', 'Role', 'Total Trans.', 'Collections', 'Disbursements']],
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
        0: { cellWidth: 28, halign: 'center' },
        1: { cellWidth: 20 },
        2: { cellWidth: 28 },
        3: { cellWidth: 24 },
        4: { cellWidth: 16, halign: 'center' },
        5: { cellWidth: 32, halign: 'right', textColor: [22, 101, 52], fontStyle: 'bold' },
        6: { cellWidth: 32, halign: 'right', textColor: [153, 27, 27], fontStyle: 'bold' }
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

    return doc;
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
    setShowPDFPreview(false);
    setPdfPreviewUrl(null);
    setPdfFileName(null);
  };

  const safeRate = Number.isFinite(monthlyData.collectionRate) ? monthlyData.collectionRate : 0;
  const gaugeFillWidth = `${Math.min(Math.max(safeRate, 0), 100)}%`;
  const hasTarget = Number.isFinite(monthlyData.target) && monthlyData.target > 0;

  return (
    <div className="monthly-kpi-container">
      <div className="monthly-kpi-header">
        <div className="header-left">
          <i className="fas fa-calendar-alt"></i>
          <h3>MONTHLY REPORT (Performance Evaluation)</h3>
        </div>
        <div className="header-right">
          <div className="header-legend">
            <span className="legend-item">
              <span className="legend-dot collections-dot"></span>
              Collections
            </span>
            <span className="legend-item">
              <span className="legend-dot disbursements-dot"></span>
              Disbursements
            </span>
          </div>
          <button className="history-button" onClick={handleOpenHistory}>
            <i className="fas fa-history"></i>
            History
          </button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="monthly-kpi-metrics">
        <div className="kpi-metric-small">
          <div className="metric-label">Total Collections</div>
          <div className="metric-value collections">
            {formatCurrency(monthlyData.totalCollections)}
          </div>
        </div>

        <div className="kpi-metric-small">
          <div className="metric-label">Total Disbursements</div>
          <div className="metric-value disbursements">
            {formatCurrency(monthlyData.totalDisbursements)}
          </div>
        </div>

        <div className="kpi-metric-small">
          <div className="metric-label">Collection Rate</div>
          <div className="metric-value rate">
            {monthlyData.collectionRate.toFixed(1)}%
          </div>
        </div>

        <div className="kpi-metric-small">
          <div className="metric-label">Avg Processing Time</div>
          <div className="metric-value time">
            {monthlyData.avgProcessingTime.toFixed(1)}h
          </div>
        </div>
      </div>

      {!hasMonthlyTransactions && (
        <div className="empty-state">No monthly data available for this period.</div>
      )}

      {/* Graphs Section */}
      <div className="monthly-graphs">
        {/* Line Chart: Daily Collections vs Disbursements */}
        <div className="graph-container line-chart-container">
          <h4>Daily Collections vs Disbursements</h4>
          <div className="chart-wrapper">
            {dailyData.length > 0 ? (
              <canvas ref={lineChartRef}></canvas>
            ) : (
              <div className="empty-state">No daily trend data to display.</div>
            )}
          </div>
        </div>

        {/* Pie Chart: Approved vs Rejected */}
        <div className="graph-container pie-chart-container">
          <h4>Approved vs Rejected</h4>
          <div className="chart-wrapper">
            {approvalData.length > 0 ? (
              <canvas ref={pieChartRef}></canvas>
            ) : (
              <div className="empty-state">No approval distribution data available.</div>
            )}
          </div>
        </div>

        {/* Bar Chart: Processing Time by Department */}
        <div className="graph-container bar-chart-container">
          <h4>Avg Processing Time by Department</h4>
          <div className="chart-wrapper">
            {processingTimeData.length > 0 ? (
              <canvas ref={barChartRef}></canvas>
            ) : (
              <div className="empty-state">No processing time records available.</div>
            )}
          </div>
        </div>

        {/* Gauge: Collection Rate */}
        <div className="graph-container gauge-container">
          <h4>Collection Rate Target</h4>
          {hasTarget ? (
            <div className="gauge-wrapper">
              <div className="gauge">
                <div
                  className="gauge-fill"
                  style={{
                    width: gaugeFillWidth,
                    backgroundColor: monthlyData.collectionRate >= 90 ? '#166534' : monthlyData.collectionRate >= 70 ? '#f59e0b' : '#991b1b'
                  }}
                ></div>
              </div>
              <div className="gauge-value">
                {monthlyData.collectionRate.toFixed(1)}%
              </div>
              <div className="gauge-label">
                {formatCurrency(monthlyData.totalCollections)} / {formatCurrency(monthlyData.target)}
              </div>
            </div>
          ) : (
            <div className="empty-state">No collection target data defined.</div>
          )}
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
                <label htmlFor="history-month">Select Month:</label>
                <input
                  type="month"
                  id="history-month"
                  value={selectedMonth}
                  onChange={handleMonthChange}
                  max={new Date().toISOString().slice(0, 7)}
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
                      </tr>
                    </thead>
                    <tbody>
                      {historyData.map((report, index) => {
                        const createdAt = new Date(report.created_at);
                        const timeStr = !Number.isNaN(createdAt.getTime()) 
                          ? createdAt.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : 'N/A';
                        const reportType = report.report_type || 'Report';
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
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty-state">No reports generated in the selected month.</div>
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

      {/* PDF Preview Modal */}
      {showPDFPreview && pdfPreviewUrl && (
        <div
          className="pdf-preview-modal-overlay"
          onClick={closePDFPreview}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999
          }}
        >
          <div
            className="pdf-preview-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '80vw', height: '85vh', background: '#fff', borderRadius: '10px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            <div
              className="pdf-preview-header"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                       padding: '12px 16px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}
            >
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#111827' }}>
                {previewType === 'history' ? 'Monthly Report History PDF Preview' : 'Monthly Report Details PDF Preview'}
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
                title="Monthly Report PDF Preview"
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

export default MonthlyKPI;
