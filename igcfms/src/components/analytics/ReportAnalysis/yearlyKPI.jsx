import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './css/yearlyKPI.css';

const YearlyKPI = ({ transactions = [], reports = [] }) => {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const [yearlyData, setYearlyData] = useState({
    totalCollections: 0,
    totalDisbursements: 0,
    yearlyNetBalance: 0,
    yoyGrowth: 0,
    costEfficiencyRatio: 0
  });
  const [monthlyData, setMonthlyData] = useState([]);
  const [growthTrendData, setGrowthTrendData] = useState([]);
  const [hasYearlyTransactions, setHasYearlyTransactions] = useState(false);
  const [autoGenerateEnabled, setAutoGenerateEnabled] = useState(true);
  const [lastAutoGenYear, setLastAutoGenYear] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedYear, setSelectedYear] = useState('');
  const [historyData, setHistoryData] = useState([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [pdfFileName, setPdfFileName] = useState(null);
  const [previewType, setPreviewType] = useState(null); // 'details' or 'history'

  const monthlyBarRef = useRef(null);
  const netBalanceRef = useRef(null);
  const growthLineRef = useRef(null);

  const monthlyBarInstance = useRef(null);
  const netBalanceInstance = useRef(null);
  const growthLineInstance = useRef(null);

  useEffect(() => {
    calculateYearlyData();
  }, [transactions]);

  useEffect(() => {
    initializeMonthlyBarChart();
    return () => {
      if (monthlyBarInstance.current) {
        monthlyBarInstance.current.destroy();
      }
    };
  }, [monthlyData]);

  useEffect(() => {
    initializeNetBalanceChart();
    return () => {
      if (netBalanceInstance.current) {
        netBalanceInstance.current.destroy();
      }
    };
  }, [monthlyData]);

  useEffect(() => {
    initializeGrowthLineChart();
    return () => {
      if (growthLineInstance.current) {
        growthLineInstance.current.destroy();
      }
    };
  }, [growthTrendData]);

  const calculateYearlyData = () => {
    if (!Array.isArray(transactions)) {
      setYearlyData({
        totalCollections: 0,
        totalDisbursements: 0,
        yearlyNetBalance: 0,
        yoyGrowth: 0,
        costEfficiencyRatio: 0
      });
      setMonthlyData([]);
      setGrowthTrendData([]);
      setHasYearlyTransactions(false);
      return;
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear + 1, 0, 0, 23, 59, 59, 999);

    const yearTransactions = transactions.filter(t => {
      const created = new Date(t?.created_at);
      return !Number.isNaN(created.getTime()) && created >= startOfYear && created <= endOfYear;
    });

    setHasYearlyTransactions(yearTransactions.length > 0);

    if (yearTransactions.length === 0) {
      setYearlyData({
        totalCollections: 0,
        totalDisbursements: 0,
        yearlyNetBalance: 0,
        yoyGrowth: 0,
        costEfficiencyRatio: 0
      });
      setMonthlyData([]);
      const yearsRange = Array.from({ length: 5 }, (_, idx) => (currentYear - 4 + idx).toString());
      const growthData = yearsRange
        .map(year => ({
          year,
          collections: 0
        }));
      setGrowthTrendData(growthData);
      return;
    }

    const totalCollections = yearTransactions
      .filter(t => (t?.transaction_type || t?.type || '').toLowerCase() === 'collection')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t?.amount) || 0), 0);

    const totalDisbursements = yearTransactions
      .filter(t => (t?.transaction_type || t?.type || '').toLowerCase() === 'disbursement')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t?.amount) || 0), 0);

    const yearlyNetBalance = totalCollections - totalDisbursements;

    const previousYear = currentYear - 1;
    const previousYearCollections = transactions
      .filter(t => {
        const created = new Date(t?.created_at);
        return !Number.isNaN(created.getTime()) && created.getFullYear() === previousYear && (t?.transaction_type || t?.type || '').toLowerCase() === 'collection';
      })
      .reduce((sum, t) => sum + Math.abs(parseFloat(t?.amount) || 0), 0);

    const yoyGrowth = previousYearCollections > 0
      ? ((totalCollections - previousYearCollections) / previousYearCollections) * 100
      : 0;

    const costEfficiencyRatio = totalCollections > 0
      ? (totalDisbursements / totalCollections) * 100
      : 0;

    setYearlyData({
      totalCollections,
      totalDisbursements,
      yearlyNetBalance,
      yoyGrowth,
      costEfficiencyRatio
    });

    const monthlyBuckets = monthNames.map((name, index) => ({
      month: name,
      monthIndex: index,
      collections: 0,
      disbursements: 0
    }));

    yearTransactions.forEach(t => {
      const created = new Date(t?.created_at);
      const amount = Math.abs(parseFloat(t?.amount) || 0);
      if (Number.isNaN(created.getTime())) return;
      const monthIdx = created.getMonth();
      const bucket = monthlyBuckets[monthIdx];
      if (!bucket) return;

      const kind = (t?.transaction_type || t?.type || '').toLowerCase();
      if (kind === 'collection') {
        bucket.collections += amount;
      } else if (kind === 'disbursement') {
        bucket.disbursements += amount;
      }
    });

    const monthlyAggregates = monthlyBuckets
      .map(bucket => ({
        month: bucket.month,
        collections: bucket.collections,
        disbursements: bucket.disbursements,
        netBalance: bucket.collections - bucket.disbursements
      }))
      .filter(bucket => bucket.collections > 0 || bucket.disbursements > 0);

    setMonthlyData(monthlyAggregates);

    const yearsRange = Array.from({ length: 5 }, (_, idx) => currentYear - 4 + idx);
    const growthData = yearsRange.map((year) => {
      const collections = transactions
        .filter((t) => {
          const created = new Date(t?.created_at);
          return !Number.isNaN(created.getTime()) && created.getFullYear() === year && (t?.transaction_type || t?.type || '').toLowerCase() === 'collection';
        })
        .reduce((sum, t) => sum + Math.abs(parseFloat(t?.amount) || 0), 0);

      return {
        year: year.toString(),
        collections: collections
      };
    });

    setGrowthTrendData(growthData);
  };

  const initializeMonthlyBarChart = () => {
    if (!monthlyBarRef.current) return;

    if (monthlyData.length === 0) {
      if (monthlyBarInstance.current) {
        monthlyBarInstance.current.destroy();
        monthlyBarInstance.current = null;
      }
      return;
    }

    const ctx = monthlyBarRef.current.getContext('2d');

    if (monthlyBarInstance.current) {
      monthlyBarInstance.current.destroy();
    }

    monthlyBarInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: monthlyData.map(d => d.month),
        datasets: [
          {
            label: 'Collections',
            data: monthlyData.map(d => d.collections),
            backgroundColor: '#166534',
            borderRadius: 6,
            barThickness: 24
          },
          {
            label: 'Disbursements',
            data: monthlyData.map(d => d.disbursements),
            backgroundColor: '#991b1b',
            borderRadius: 6,
            barThickness: 24
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              font: { size: 12, weight: '600' },
              color: '#111827',
              usePointStyle: true,
              padding: 16
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
              label: (context) => `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`
            }
          }
        },
        scales: {
          x: {
            stacked: false,
            ticks: {
              color: '#1f2937',
              font: { size: 11, weight: '600' }
            },
            grid: {
              display: false
            }
          },
          y: {
            stacked: false,
            ticks: {
              color: '#1f2937',
              font: { size: 11, weight: '600' },
              callback: (value) => formatShortCurrency(value)
            },
            grid: {
              color: 'rgba(17, 24, 39, 0.08)',
              drawBorder: false
            }
          }
        }
      }
    });
  };

  const initializeNetBalanceChart = () => {
    if (!netBalanceRef.current) return;

    if (monthlyData.length === 0) {
      if (netBalanceInstance.current) {
        netBalanceInstance.current.destroy();
        netBalanceInstance.current = null;
      }
      return;
    }

    const ctx = netBalanceRef.current.getContext('2d');

    if (netBalanceInstance.current) {
      netBalanceInstance.current.destroy();
    }

    netBalanceInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: monthlyData.map(d => d.month),
        datasets: [
          {
            label: 'Net Balance',
            data: monthlyData.map(d => d.netBalance),
            backgroundColor: monthlyData.map(d => d.netBalance >= 0 ? '#166534' : '#991b1b'),
            borderRadius: 6,
            barThickness: 28
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
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
              label: (context) => `Net Balance: ${formatCurrency(context.parsed.y)}`
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: '#1f2937',
              font: { size: 11, weight: '600' }
            },
            grid: {
              display: false
            }
          },
          y: {
            ticks: {
              color: '#1f2937',
              font: { size: 11, weight: '600' },
              callback: (value) => formatShortCurrency(value)
            },
            grid: {
              color: 'rgba(17, 24, 39, 0.08)',
              drawBorder: false
            }
          }
        }
      }
    });
  };

  const initializeGrowthLineChart = () => {
    if (!growthLineRef.current) return;

    if (growthTrendData.length === 0) {
      if (growthLineInstance.current) {
        growthLineInstance.current.destroy();
        growthLineInstance.current = null;
      }
      return;
    }

    const ctx = growthLineRef.current.getContext('2d');

    if (growthLineInstance.current) {
      growthLineInstance.current.destroy();
    }

    // Chart area background gradient plugin
    const chartAreaBackgroundPlugin = {
      id: 'chartAreaBackgroundPlugin',
      beforeDraw: (chart) => {
        const { ctx: pluginCtx, chartArea } = chart;
        if (!chartArea) return;
        const backgroundGradient = pluginCtx.createLinearGradient(
          chartArea.left,
          chartArea.top,
          chartArea.right,
          chartArea.bottom
        );
        backgroundGradient.addColorStop(0, '#ffffff');
        backgroundGradient.addColorStop(1, '#f3f4f6');
        pluginCtx.save();
        pluginCtx.fillStyle = backgroundGradient;
        pluginCtx.fillRect(
          chartArea.left,
          chartArea.top,
          chartArea.right - chartArea.left,
          chartArea.bottom - chartArea.top
        );
        pluginCtx.restore();
      }
    };

    // Value label plugin for data points
    const valueLabelPlugin = {
      id: 'valueLabelPlugin',
      afterDatasetsDraw: (chart) => {
        const { ctx: pluginCtx, data } = chart;
        const dataset = data.datasets[0];
        if (!dataset) return;
        const meta = chart.getDatasetMeta(0);
        pluginCtx.save();
        pluginCtx.font = "600 12px 'Inter', 'Segoe UI', sans-serif";
        pluginCtx.fillStyle = '#0f172a';
        pluginCtx.textAlign = 'center';
        pluginCtx.textBaseline = 'bottom';

        meta.data.forEach((point, index) => {
          const raw = dataset.data[index];
          if (raw === undefined || raw === null) return;
          const text = formatShortCurrency(raw);
          const x = point.x;
          const y = point.y - 8;
          pluginCtx.fillText(text, x, y);
        });

        pluginCtx.restore();
      }
    };

    growthLineInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: growthTrendData.map(d => d.year),
        datasets: [
          {
            label: 'Collections',
            data: growthTrendData.map(d => d.collections),
            borderColor: '#000000',
            backgroundColor: 'rgba(0, 0, 0, 0.08)',
            borderWidth: 3,
            fill: true,
            tension: 0,
            pointRadius: 0,
            pointHoverRadius: 9,
            pointBackgroundColor: '#000000',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHoverBackgroundColor: '#111827',
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 1800,
          easing: 'easeInOutCubic',
          delay: (context) => {
            if (context.type === 'data' && context.mode === 'default') {
              return context.dataIndex * 100;
            }
            return 0;
          }
        },
        layout: {
          padding: {
            top: 24,
            bottom: 12,
            left: 14,
            right: 14
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
            cornerRadius: 10,
            displayColors: true,
            padding: 12,
            titleFont: {
              size: 13,
              weight: 'bold',
              family: "'Inter', 'Segoe UI', sans-serif"
            },
            bodyFont: {
              size: 12,
              weight: '500',
              family: "'Inter', 'Segoe UI', sans-serif"
            },
            callbacks: {
              title: (context) => `Year ${context[0].label}`,
              label: (context) => ` Collections: ${formatCurrency(context.parsed.y)}`
            }
          }
        },
        scales: {
          x: {
            title: {
              display: false
            },
            ticks: {
              color: '#1f2937',
              font: { size: 12, weight: '600' },
              padding: 10
            },
            grid: {
              color: 'rgba(17, 24, 39, 0.12)',
              lineWidth: 1,
              drawBorder: false,
              drawTicks: false
            },
            border: {
              display: true,
              color: '#d1d5db'
            }
          },
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: 'Collections (₱)',
              color: '#111827',
              font: {
                size: 13,
                weight: '700',
                family: "'Inter', 'Segoe UI', sans-serif"
              },
              padding: { top: 0, bottom: 10 }
            },
            ticks: {
              color: '#1f2937',
              font: { size: 11, weight: '600' },
              padding: 10,
              callback: (value) => formatShortCurrency(value)
            },
            grid: {
              color: 'rgba(17, 24, 39, 0.12)',
              lineWidth: 1,
              drawBorder: false,
              drawTicks: false
            },
            border: {
              display: true,
              color: '#d1d5db'
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      },
      plugins: [chartAreaBackgroundPlugin, valueLabelPlugin]
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Auto-generate yearly report on December 31st at 11:59 PM
  useEffect(() => {
    const savedAutoGen = localStorage.getItem('yearlyReportAutoGen');
    const savedLastYear = localStorage.getItem('yearlyReportLastAutoGen');
    
    if (savedAutoGen === null) {
      setAutoGenerateEnabled(true);
      localStorage.setItem('yearlyReportAutoGen', 'true');
    } else {
      setAutoGenerateEnabled(savedAutoGen === 'true');
    }
    
    if (savedLastYear) {
      setLastAutoGenYear(savedLastYear);
    }

    const checkAndGenerateReport = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentYear = now.getFullYear().toString();
      const currentMonth = now.getMonth() + 1; // 1-12
      const currentDay = now.getDate();

      if (!autoGenerateEnabled && savedAutoGen !== 'true') return;
      if (lastAutoGenYear === currentYear || savedLastYear === currentYear) return;
      
      // Generate on December 31st at 11:59 PM
      if (currentMonth === 12 && currentDay === 31 && currentHour === 23 && currentMinute === 59) {
        generateYearlyReportAutomatically();
      }
    };

    const interval = setInterval(checkAndGenerateReport, 60000);
    checkAndGenerateReport();

    return () => clearInterval(interval);
  }, [autoGenerateEnabled, lastAutoGenYear, yearlyData]);

  const generateYearlyReportAutomatically = async () => {
    try {
      const now = new Date();
      const currentYear = now.getFullYear().toString();
      const token = localStorage.getItem('token');
      const API_BASE = require('../../../config/api').default;

      const reportData = {
        report_type: 'yearly',
        generated_at: new Date().toISOString(),
        status: 'Generated',
        data: {
          year: currentYear,
          totalCollections: yearlyData.totalCollections,
          totalDisbursements: yearlyData.totalDisbursements,
          yearlyNetBalance: yearlyData.yearlyNetBalance,
          yoyGrowth: yearlyData.yoyGrowth,
          costEfficiencyRatio: yearlyData.costEfficiencyRatio
        }
      };

      await axios.post(`${API_BASE}/reports`, reportData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setLastAutoGenYear(currentYear);
      localStorage.setItem('yearlyReportLastAutoGen', currentYear);

      console.log('Yearly report auto-generated successfully for:', currentYear);
    } catch (error) {
      console.error('Error auto-generating yearly report:', error);
    }
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
    const lastYear = new Date().getFullYear() - 1;
    setSelectedYear(lastYear.toString());
    loadHistoryData(lastYear.toString());
  };

  const handleCloseHistory = () => {
    setShowHistoryModal(false);
    setHistoryData([]);
  };

  const handleYearChange = (e) => {
    const newYear = e.target.value;
    setSelectedYear(newYear);
    loadHistoryData(newYear);
  };

  const loadHistoryData = (year) => {
    if (!year) return;
    
    // Filter YEARLY reports for the selected year
    const yearReports = reports.filter(r => {
      const generatedAt = new Date(r.generated_at || r.createdAt || r.created_at);
      if (Number.isNaN(generatedAt.getTime())) return false;
      
      const isInYear = generatedAt.getFullYear().toString() === year;
      const reportType = (r.report_type || r.type || '').toLowerCase();
      const isYearlyReport = reportType.includes('yearly') || reportType.includes('annual');
      
      return isInYear && isYearlyReport;
    });

    const transformedReports = yearReports
      .map(report => ({
        id: `report-${report.id}`,
        created_at: report.generated_at || report.createdAt || report.created_at,
        report_type: report.report_type || report.type || 'Report',
        status: report.status || 'Generated',
        user_role: report.generated_by?.role || report.user_role || 'N/A',
        generated_by: report.generated_by?.name || report.generated_by_name || 'N/A'
      }))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    setHistoryData(transformedReports);
  };

  const handleRowClick = (report) => {
    const reportDate = new Date(report.created_at);
    const year = reportDate.getFullYear();
    
    // Get user info from report
    const userData = report.generated_by && typeof report.generated_by === 'object'
      ? report.generated_by
      : null;
    const isAdmin = userData?.role === 'Admin';
    const reportGeneratorId = userData?.id;
    
    let yearTransactions = transactions.filter(t => {
      const createdAt = new Date(t.created_at || t.createdAt || t.created_at_local);
      if (Number.isNaN(createdAt.getTime())) return false;
      return createdAt.getFullYear() === year;
    });
    
    // If not admin, filter to only show transactions created by this user
    if (!isAdmin && reportGeneratorId) {
      yearTransactions = yearTransactions.filter(t => {
        const txCreatorId = t.created_by?.id || t.creator?.id || t.user?.id;
        return txCreatorId === reportGeneratorId;
      });
    }

    const collections = yearTransactions
      .filter(t => (t.transaction_type || t.type || '').toLowerCase() === 'collection')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0);

    const collectionCount = yearTransactions
      .filter(t => (t.transaction_type || t.type || '').toLowerCase() === 'collection').length;

    const disbursements = yearTransactions
      .filter(t => (t.transaction_type || t.type || '').toLowerCase() === 'disbursement')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0);

    const disbursementCount = yearTransactions
      .filter(t => (t.transaction_type || t.type || '').toLowerCase() === 'disbursement').length;

    const enrichedReport = {
      ...report,
      totalTransactions: yearTransactions.length,
      collections,
      collectionCount,
      disbursements,
      disbursementCount,
      isAdmin,
      reportGeneratorId
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
    
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(2);
    doc.rect(5, 5, pageWidth - 10, pageHeight - 10);

    doc.setFillColor(0, 0, 0);
    doc.rect(10, 10, pageWidth - 20, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('YEARLY REPORT DETAILS', pageWidth / 2, 25, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('IGCFMS - Management & Planning', pageWidth / 2, 35, { align: 'center' });

    let yPos = 55;

    doc.setTextColor(0, 0, 0);
    doc.setFillColor(0, 0, 0);
    doc.rect(10, yPos, pageWidth - 20, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORT INFORMATION', 15, yPos + 5.5);
    
    yPos += 15;
    
    // Determine report scope based on role
    const reportScope = selectedReport.isAdmin 
      ? 'All System Transactions' 
      : `Transactions Created by ${selectedReport.generated_by || 'User'}`;

    autoTable(doc, {
      startY: yPos,
      head: [['Field', 'Value']],
      body: [
        ['Report Type', selectedReport.report_type || 'N/A'],
        ['Status', selectedReport.status || 'Generated'],
        ['Generated By', selectedReport.generated_by || 'N/A'],
        ['Role', selectedReport.user_role || 'N/A'],
        ['Report Scope', reportScope],
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

    doc.setFillColor(0, 0, 0);
    doc.rect(10, yPos, pageWidth - 20, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TRANSACTION STATISTICS', 15, yPos + 5.5);
    
    yPos += 15;

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
          data.cell.styles.textColor = [22, 101, 52];
        }
        if (data.row.index === 2 && data.column.index === 2) {
          data.cell.styles.textColor = [153, 27, 27];
        }
      },
      margin: { left: 15, right: 15 },
      tableWidth: 'auto'
    });

    yPos = doc.lastAutoTable.finalY + 15;

    // Detailed transactions section
    doc.setFillColor(240, 240, 240);
    doc.rect(10, yPos, pageWidth - 20, 8, 'F');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('TRANSACTION DETAILS', 15, yPos + 5.5);
    
    yPos += 12;

    // Get year transactions for detailed list
    const reportDate = new Date(selectedReport.created_at);
    const year = reportDate.getFullYear();
    
    let yearTransactions = transactions.filter(t => {
      const createdAt = new Date(t.created_at || t.createdAt || t.created_at_local);
      if (Number.isNaN(createdAt.getTime())) return false;
      return createdAt.getFullYear() === year;
    });
    
    // If not admin, filter to only show transactions created by this user
    if (!selectedReport.isAdmin && selectedReport.reportGeneratorId) {
      yearTransactions = yearTransactions.filter(t => {
        const txCreatorId = t.created_by?.id || t.creator?.id || t.user?.id;
        return txCreatorId === selectedReport.reportGeneratorId;
      });
    }

    if (yearTransactions.length > 0) {
      const transactionRows = yearTransactions.map(tx => {
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
          new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        ];
      });
      
      autoTable(doc, {
        startY: yPos,
        head: [['ID', 'Type', 'Amount', 'Recipient/Payer', 'Created By', 'Role', 'Date']],
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
      doc.setTextColor(128, 128, 128);
      doc.setFontSize(10);
      doc.text('No transactions recorded for this year.', 15, yPos + 10);
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - 15, pageHeight - 8, { align: 'right' });
      doc.text('IGCFMS - Integrated Government Collections and Funds Management System', pageWidth / 2, pageHeight - 3, { align: 'center' });
    }

    return doc;
  };

  const handleDownloadPDF = () => {
    const doc = generateDetailsPDF();
    if (!doc) return;

    const fileName = `Yearly_Report_${selectedReport.report_type || 'Details'}_${new Date().toISOString().split('T')[0]}.pdf`;
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    
    setPdfPreviewUrl(pdfUrl);
    setPdfFileName(fileName);
    setPreviewType('details');
    setShowPDFPreview(true);
  };

  const generateHistoryPDF = () => {
    if (!historyData || historyData.length === 0) return null;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(2);
    doc.rect(5, 5, pageWidth - 10, pageHeight - 10);

    doc.setFillColor(0, 0, 0);
    doc.rect(10, 10, pageWidth - 20, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('YEARLY REPORT HISTORY', pageWidth / 2, 25, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Year: ${selectedYear}`, pageWidth / 2, 35, { align: 'center' });

    let yPos = 55;

    doc.setTextColor(0, 0, 0);
    doc.setFillColor(0, 0, 0);
    doc.rect(10, yPos, pageWidth - 20, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('SUMMARY', 15, yPos + 5.5);
    
    yPos += 15;

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

    doc.setFillColor(0, 0, 0);
    doc.rect(10, yPos, pageWidth - 20, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORTS LIST', 15, yPos + 5.5);
    
    yPos += 15;

    const reportRows = historyData.map(report => {
      const createdAt = new Date(report.created_at);
      const timeStr = !Number.isNaN(createdAt.getTime()) 
        ? createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        : 'N/A';
      
      const reportDate = new Date(report.created_at);
      const year = reportDate.getFullYear();
      
      const yearTransactions = transactions.filter(t => {
        const createdAt = new Date(t.created_at || t.createdAt || t.created_at_local);
        if (Number.isNaN(createdAt.getTime())) return false;
        return createdAt.getFullYear() === year;
      });

      const totalTrans = yearTransactions.length;
      
      const collections = yearTransactions
        .filter(t => (t.transaction_type || t.type || '').toLowerCase() === 'collection')
        .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0);

      const disbursements = yearTransactions
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

    const footerY = pageHeight - 15;
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleString('en-US')}`, 15, footerY);
    doc.text(`Page 1 of 1`, pageWidth - 15, footerY, { align: 'right' });

    return doc;
  };

  const handleDownloadHistoryPDF = () => {
    if (!historyData || historyData.length === 0) return;

    const doc = generateHistoryPDF();
    if (!doc) return;

    const fileName = `Yearly_Report_History_${selectedYear}.pdf`;
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    
    setPdfPreviewUrl(pdfUrl);
    setPdfFileName(fileName);
    setPreviewType('history');
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
    setShowPDFPreview(false);
    setPdfPreviewUrl(null);
    setPdfFileName(null);
  };

  const formatShortCurrency = (value) => {
    if (value >= 1000000) {
      return `₱${(value / 1000000).toFixed(1)}M`;
    }
    return `₱${(value / 1000).toFixed(0)}K`;
  };

  const formatPercentage = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  return (
    <div className="yearly-kpi-container">
      <div className="yearly-kpi-header">
        <div className="header-left">
          <i className="fas fa-calendar"></i>
          <h3>YEARLY REPORT (Management & Planning)</h3>
        </div>
        {/* <button className="history-button" onClick={handleOpenHistory}>
          <i className="fas fa-history"></i>
          History
        </button> */}
      </div>
      
      {/* KPI Metrics */}
      <div className="yearly-kpi-metrics">
        <div className="kpi-metric-small">
          <div className="metric-label">Total Collections YTD</div>
          <div className="metric-value collections">
            {formatCurrency(yearlyData.totalCollections)}
          </div>
        </div>
        
        <div className="kpi-metric-small">
          <div className="metric-label">Total Disbursements YTD</div>
          <div className="metric-value disbursements">
            {formatCurrency(yearlyData.totalDisbursements)}
          </div>
        </div>
        
        <div className="kpi-metric-small">
          <div className="metric-label">Yearly Net Balance</div>
          <div className="metric-value net-balance">
            {formatCurrency(yearlyData.yearlyNetBalance)}
          </div>
        </div>
        
        <div className="kpi-metric-small">
          <div className="metric-label">Year-over-Year Growth</div>
          <div className={`metric-value ${yearlyData.yoyGrowth >= 0 ? 'growth-positive' : 'growth-negative'}`}>
            {formatPercentage(yearlyData.yoyGrowth)}
          </div>
        </div>
        
        <div className="kpi-metric-small">
          <div className="metric-label">Cost Efficiency Ratio</div>
          <div className="metric-value efficiency">
            {yearlyData.costEfficiencyRatio.toFixed(1)}%
          </div>
        </div>
      </div>
      
      {/* Graphs Section */}
      <div className="yearly-graphs">
        {/* Bar Chart: Monthly Collections vs Disbursements */}
        <div className="graph-container bar-chart-container">
          <h4>Collections vs Disbursements (per month)</h4>
          <div className="chart-wrapper">
            <canvas ref={monthlyBarRef}></canvas>
          </div>
        </div>
        
        {/* Stacked Bar Chart: Yearly Net Balance */}
        <div className="graph-container stacked-chart-container">
          <h4>Stacked Chart: Yearly Net Balance</h4>
          <div className="chart-wrapper">
            <canvas ref={netBalanceRef}></canvas>
          </div>
        </div>
        
        {/* Line Chart: Year-over-Year Growth Trend */}
        <div className="graph-container growth-chart-container">
          <div className="chart-wrapper" style={{ position: 'relative' }}>
            <h4 style={{ position: 'absolute', top: '3px', left: '56%', margin: 0, zIndex: 10, fontSize: '13px', fontWeight: '700', color: '#111827', letterSpacing: '0.5px' }}>YEAR-OVER-YEAR GROWTH TREND</h4>
            <canvas ref={growthLineRef}></canvas>
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
                <label htmlFor="history-year">Select Year:</label>
                <input
                  type="number"
                  id="history-year"
                  value={selectedYear}
                  onChange={handleYearChange}
                  min="2000"
                  max={new Date().getFullYear()}
                  placeholder="YYYY"
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
                  <div className="empty-state">No reports generated in the selected year.</div>
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
                {previewType === 'history' ? 'Yearly Report History PDF Preview' : 'Yearly Report Details PDF Preview'}
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
                title="Yearly Report PDF Preview"
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

export default YearlyKPI;
