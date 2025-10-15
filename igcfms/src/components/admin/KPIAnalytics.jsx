import React, { useMemo, useRef, useEffect } from 'react';
import Chart from 'chart.js/auto';
import './css/kpiAnalytics.css';

const KPIAnalytics = ({ disbursements = [], isLoading = false }) => {
  const dpoChartRef = useRef(null);
  const dpoChartInstance = useRef(null);
  const paymentMethodChartRef = useRef(null);
  const paymentMethodChartInstance = useRef(null);

  // Calculate KPI metrics
  const kpiMetrics = useMemo(() => {
    if (!Array.isArray(disbursements) || disbursements.length === 0) {
      return {
        dpo: 0,
        paymentAccuracy: 0,
        vendorPerformance: [],
        paymentMethodDistribution: [],
        totalTransactions: 0,
        errorCount: 0
      };
    }

    // Debug: Log the first disbursement to see the actual data structure
    if (disbursements.length > 0) {
      console.log('Sample disbursement data:', disbursements[0]);
      console.log('Available fields:', Object.keys(disbursements[0]));
    }

    // 1. Days Payable Outstanding (DPO) Calculation
    const calculateDPO = () => {
      const validDisbursements = disbursements.filter(d => d.created_at);
      if (validDisbursements.length === 0) return 0;

      // Calculate average days between invoice date and payment date
      // For this system, we'll use created_at as both invoice and payment date
      // In a real system, you'd have separate invoice_date and payment_date fields
      const totalDays = validDisbursements.reduce((sum, disbursement) => {
        const createdDate = new Date(disbursement.created_at);
        const currentDate = new Date();
        const daysDiff = Math.max(0, Math.floor((currentDate - createdDate) / (1000 * 60 * 60 * 24)));
        return sum + daysDiff;
      }, 0);

      return Math.round(totalDays / validDisbursements.length);
    };

    // 2. Payment Accuracy Rate Calculation
    const calculatePaymentAccuracy = () => {
      const totalPayments = disbursements.length;
      if (totalPayments === 0) return 100;

      // Check for potential errors based on actual database field names
      const errorCount = disbursements.filter(d => {
        // Check for potential errors:
        // - Missing or invalid amounts
        // - Missing recipient information  
        // - Invalid payment methods
        const hasAmountError = !d.amount || parseFloat(d.amount) <= 0;
        const hasRecipientError = !d.recipient && !d.description && !d.purpose;
        const hasPaymentMethodError = !d.mode_of_payment;
        
        return hasAmountError || hasRecipientError || hasPaymentMethodError;
      }).length;

      const correctPayments = totalPayments - errorCount;
      return Math.round((correctPayments / totalPayments) * 100);
    };

    // 3. Vendor Performance Ratings Calculation
    const calculateVendorPerformance = () => {
      const vendorMap = new Map();

      disbursements.forEach(d => {
        const vendorName = d.recipient || d.payer_name || d.description?.split(' - ')[1] || 'Unknown Vendor';
        if (!vendorMap.has(vendorName)) {
          vendorMap.set(vendorName, {
            name: vendorName,
            totalTransactions: 0,
            totalAmount: 0,
            timeliness: 0,
            accuracy: 0,
            compliance: 0,
            communication: 0
          });
        }

        const vendor = vendorMap.get(vendorName);
        vendor.totalTransactions += 1;
        vendor.totalAmount += parseFloat(d.amount) || 0;

        // Simulate performance metrics (in real system, these would be tracked separately)
        // Timeliness: Based on payment speed (30% weight)
        const createdDate = new Date(d.created_at);
        const daysSinceCreation = Math.floor((new Date() - createdDate) / (1000 * 60 * 60 * 24));
        const timelinessScore = Math.max(60, 100 - daysSinceCreation * 2);

        // Accuracy: Based on data completeness (25% weight)
        let accuracyScore = 100;
        if (!d.amount || parseFloat(d.amount) <= 0) accuracyScore -= 25;
        if (!d.purpose) accuracyScore -= 15;
        if (!d.mode_of_payment) accuracyScore -= 10;

        // Compliance: Based on proper documentation (25% weight)
        let complianceScore = 100;
        if (!d.reference && !d.reference_no) complianceScore -= 20;
        if (d.mode_of_payment === 'Cheque' && !d.cheque_number) complianceScore -= 30;

        // Communication: Simulated based on transaction completeness (20% weight)
        const communicationScore = d.description ? 95 : 75;

        // Update running averages
        vendor.timeliness = Math.round((vendor.timeliness + timelinessScore) / 2);
        vendor.accuracy = Math.round((vendor.accuracy + accuracyScore) / 2);
        vendor.compliance = Math.round((vendor.compliance + complianceScore) / 2);
        vendor.communication = Math.round((vendor.communication + communicationScore) / 2);
      });

      // Calculate overall performance rating
      return Array.from(vendorMap.values()).map(vendor => {
        const overallRating = Math.round(
          (vendor.timeliness * 0.30) +
          (vendor.accuracy * 0.25) +
          (vendor.compliance * 0.25) +
          (vendor.communication * 0.20)
        );

        return {
          ...vendor,
          overallRating,
          ratingCategory: overallRating >= 90 ? 'Excellent' :
                         overallRating >= 80 ? 'Good' :
                         overallRating >= 70 ? 'Satisfactory' :
                         overallRating >= 60 ? 'Needs Improvement' : 'Poor'
        };
      }).sort((a, b) => b.overallRating - a.overallRating);
    };

    // 4. Payment Method Distribution Calculation
    const calculatePaymentMethodDistribution = () => {
      const methodMap = new Map();
      const totalTransactions = disbursements.length;

      disbursements.forEach(d => {
        const method = d.mode_of_payment || 'Unknown';
        if (!methodMap.has(method)) {
          methodMap.set(method, { count: 0, amount: 0 });
        }
        const methodData = methodMap.get(method);
        methodData.count += 1;
        methodData.amount += parseFloat(d.amount) || 0;
      });

      return Array.from(methodMap.entries()).map(([method, data]) => ({
        method,
        count: data.count,
        amount: data.amount,
        percentage: totalTransactions > 0 ? Math.round((data.count / totalTransactions) * 100) : 0
      })).sort((a, b) => b.count - a.count);
    };

    const dpo = calculateDPO();
    const paymentAccuracy = calculatePaymentAccuracy();
    const vendorPerformance = calculateVendorPerformance();
    const paymentMethodDistribution = calculatePaymentMethodDistribution();

    return {
      dpo,
      paymentAccuracy,
      vendorPerformance: vendorPerformance.slice(0, 10), // Top 10 vendors
      paymentMethodDistribution,
      totalTransactions: disbursements.length,
      errorCount: disbursements.length - Math.round((disbursements.length * paymentAccuracy) / 100)
    };
  }, [disbursements]);

  // Generate DPO trend data (simulated monthly improvement)
  const dpoTrendData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const baseDPO = kpiMetrics.dpo || 25;
    return months.map((month, index) => ({
      month,
      dpo: Math.max(15, baseDPO - (index * 2)) // Simulated improvement trend
    }));
  }, [kpiMetrics.dpo]);


  // Initialize Charts
  useEffect(() => {
    if (!isLoading && dpoChartRef.current && dpoTrendData.length > 0) {
      initializeDPOChart();
    }
    
    return () => {
      if (dpoChartInstance.current) {
        dpoChartInstance.current.destroy();
      }
    };
  }, [dpoTrendData, isLoading]);

  useEffect(() => {
    if (!isLoading && paymentMethodChartRef.current && kpiMetrics.paymentMethodDistribution.length > 0) {
      initializePaymentMethodChart();
    }
    
    return () => {
      if (paymentMethodChartInstance.current) {
        paymentMethodChartInstance.current.destroy();
      }
    };
  }, [kpiMetrics.paymentMethodDistribution, isLoading]);

  const initializeDPOChart = () => {
    if (!dpoChartRef.current) return;
    
    const ctx = dpoChartRef.current.getContext('2d');
    
    // Destroy existing chart
    if (dpoChartInstance.current) {
      dpoChartInstance.current.destroy();
    }
    
    const chartLabels = dpoTrendData.map(point => point.month);
    const chartData = dpoTrendData.map(point => point.dpo);
    
    // Create gradients matching the IssueReceipt design
    const maxValue = Math.max(...chartData);
    const gradientFill = ctx.createLinearGradient(0, 0, 0, dpoChartRef.current?.clientHeight || 260);
    gradientFill.addColorStop(0, 'rgba(0, 0, 0, 0.35)');
    gradientFill.addColorStop(1, 'rgba(0, 0, 0, 0.05)');

    const borderGradient = ctx.createLinearGradient(0, 0, dpoChartRef.current?.clientWidth || 320, 0);
    borderGradient.addColorStop(0, '#000000');
    borderGradient.addColorStop(1, '#000000');

    dpoChartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: chartLabels,
        datasets: [{
          label: 'Days Payable Outstanding',
          data: chartData,
          borderColor: borderGradient,
          backgroundColor: gradientFill,
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
              label: (context) => `DPO: ${context.parsed.y} days`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            suggestedMax: maxValue === 0 ? 50 : undefined,
            ticks: {
              color: '#1f2937',
              font: { size: 11, weight: '600' },
              padding: 10,
              precision: 0,
              callback: (value) => `${value}d`
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
  };

  const initializePaymentMethodChart = () => {
    if (!paymentMethodChartRef.current) return;
    
    // Wait for the canvas to be properly mounted
    setTimeout(() => {
      if (!paymentMethodChartRef.current || !kpiMetrics.paymentMethodDistribution.length) return;

      const ctx = paymentMethodChartRef.current.getContext('2d');
      // Destroy existing chart
      if (paymentMethodChartInstance.current) {
        paymentMethodChartInstance.current.destroy();
      }

      const baseColors = ['#0f172a', '#1f2937', '#374151', '#4b5563', '#6b7280', '#9ca3af'];
      const hoverPalette = ['#111c2d', '#253149', '#3a465d', '#4a576d', '#627083', '#8b94a3'];
      const backgroundColors = baseColors.slice(0, kpiMetrics.paymentMethodDistribution.length);
      const hoverColors = backgroundColors.map((_, index) => hoverPalette[index] || '#111827');

      paymentMethodChartInstance.current = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: kpiMetrics.paymentMethodDistribution.map(d => d.method),
          datasets: [{
            label: 'Payment Methods',
            data: kpiMetrics.paymentMethodDistribution.map(d => d.count),
            backgroundColor: backgroundColors,
            hoverBackgroundColor: hoverColors,
            borderColor: '#e2e8f0',
            borderWidth: 3,
            hoverBorderColor: '#0f172a',
            hoverBorderWidth: 4,
            hoverOffset: 10
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            animateRotate: true,
            animateScale: true,
            duration: 1500,
            easing: 'easeInOutQuart'
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              titleColor: '#ffffff',
              bodyColor: '#ffffff',
              borderColor: '#3b82f6',
              borderWidth: 1,
              cornerRadius: 8,
              displayColors: true,
              titleFont: { size: 12, weight: 'bold' },
              bodyFont: { size: 11 },
              callbacks: {
                title: (context) => context[0].label,
                label: (context) => {
                  const dataPoint = kpiMetrics.paymentMethodDistribution[context.dataIndex];
                  return [
                    `Transactions: ${dataPoint.count}`,
                    `Amount: ₱${dataPoint.amount.toLocaleString()}`,
                    `Share: ${dataPoint.percentage}%`
                  ];
                }
              }
            }
          },
          interaction: {
            intersect: false
          },
          onHover: (event, activeElements) => {
            event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
          }
        }
      });
    }, 100); // setTimeout delay
  };

  const renderDPOCard = () => {
    return (
      <div className="kpi-card dpo-card">
        <div className="kpi-header">
          <div className="kpi-icon">
            <i className="fas fa-clock"></i>
          </div>
          <div className="kpi-title">
            <h3>Days Payable Outstanding</h3>
            <p>Payment processing time trend</p>
          </div>
        </div>
        <div className="kpi-content">
          {isLoading ? (
            <div className="kpi-loading">
              <i className="fas fa-spinner fa-spin"></i>
            </div>
          ) : (
            <>
              <div className="kpi-value">
                <span className="value">{kpiMetrics.dpo}</span>
                <span className="unit">days</span>
              </div>
              
              {/* Chart.js Line Chart - Matching IssueReceipt design */}
              <div className="dpo-chart">
                <div className="chart-container" style={{ 
                  height: '250px', 
                  width: '100%',
                  position: 'relative',
                  padding: '10px'
                }}>
                  <canvas 
                    ref={dpoChartRef} 
                    id="dpoChart"
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '100%' 
                    }}
                  ></canvas>
                </div>
                <div className="trend-indicator">
                  <i className="fas fa-arrow-down text-green"></i>
                  <span>Improving trend over time</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderPaymentAccuracyCard = () => (
    <div className="kpi-card accuracy-card">
      <div className="kpi-header">
        <div className="kpi-icon">
          <i className="fas fa-bullseye"></i>
        </div>
        <div className="kpi-title">
          <h3>Payment Accuracy Rate</h3>
          <p>Percentage of error-free payments</p>
        </div>
      </div>
      <div className="kpi-content">
        {isLoading ? (
          <div className="kpi-loading">
            <i className="fas fa-spinner fa-spin"></i>
          </div>
        ) : (
          <>
            <div className="kpi-value">
              <span className="value">{kpiMetrics.paymentAccuracy}</span>
              <span className="unit">%</span>
            </div>
            <div className="kpi-gauge">
              <div className="gauge-container">
                <div 
                  className="gauge-fill" 
                  style={{ 
                    width: `${kpiMetrics.paymentAccuracy}%`,
                    backgroundColor: kpiMetrics.paymentAccuracy >= 95 ? '#10b981' :
                                   kpiMetrics.paymentAccuracy >= 90 ? '#f59e0b' :
                                   kpiMetrics.paymentAccuracy >= 80 ? '#ef4444' : '#dc2626'
                  }}
                ></div>
              </div>
            </div>
            <div className="kpi-stats">
              <div className="stat-item">
                <span className="stat-label">Correct Payments</span>
                <span className="stat-value">{kpiMetrics.totalTransactions - kpiMetrics.errorCount}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Total Payments</span>
                <span className="stat-value">{kpiMetrics.totalTransactions}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const renderVendorPerformanceCard = () => (
    <div className="kpi-card vendor-card">
      <div className="kpi-header">
        <div className="kpi-icon">
          <i className="fas fa-star"></i>
        </div>
        <div className="kpi-title">
          <h3>Vendor Performance Ratings</h3>
          <p>Bar chart by vendor performance</p>
        </div>
      </div>
      <div className="kpi-content">
        {isLoading ? (
          <div className="kpi-loading">
            <i className="fas fa-spinner fa-spin"></i>
          </div>
        ) : (
          <div className="vendor-performance">
            {kpiMetrics.vendorPerformance.length > 0 ? (
              <>
                {/* Bar Chart Visualization */}
                <div className="vendor-bar-chart">
                  {kpiMetrics.vendorPerformance.slice(0, 5).map((vendor, index) => (
                    <div key={index} className="vendor-bar-item">
                      <div className="vendor-label">
                        <span className="vendor-name">{vendor.name.length > 12 ? vendor.name.substring(0, 12) + '...' : vendor.name}</span>
                        <span className="vendor-percentage">{vendor.overallRating}%</span>
                      </div>
                      <div className="vendor-bar">
                        <div 
                          className={`vendor-bar-fill ${vendor.ratingCategory.toLowerCase().replace(' ', '-')}`}
                          style={{ width: `${vendor.overallRating}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Vendor Details List */}
                <div className="vendor-details">
                  {kpiMetrics.vendorPerformance.slice(0, 3).map((vendor, index) => (
                    <div key={index} className="vendor-detail-item">
                      <div className="vendor-info">
                        <div className="vendor-name">{vendor.name}</div>
                        <div className="vendor-stats">
                          <span className="transaction-count">{vendor.totalTransactions} transactions</span>
                          <span className="vendor-amount">₱{vendor.totalAmount.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="vendor-rating">
                        <div className={`rating-badge ${vendor.ratingCategory.toLowerCase().replace(' ', '-')}`}>
                          <span className="rating-value">{vendor.overallRating}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="no-data">
                <i className="fas fa-users"></i>
                <p>No vendor data available</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );


  const renderPaymentMethodCard = () => {
    return (
      <div className="dashboard-box payment-method-pie-card">
        <div className="box-header payment-method-header">
          <h3 className="box-title">Payment Method Distribution</h3>
          <span className="box-subtitle">TOP 3 METHODS</span>
        </div>
        <div className="box-content">
          {isLoading ? (
            <div className="chart-loading">
              <i className="fas fa-chart-pie"></i>
              <span>Loading distribution...</span>
            </div>
          ) : kpiMetrics.paymentMethodDistribution.length === 0 ? (
            <div className="chart-error">
              <i className="fas fa-exclamation-triangle"></i>
              <span>No payment method data available</span>
            </div>
          ) : (
            <div className="payment-method-pie-layout">
              <div className="pie-chart-large-section">
                <canvas ref={paymentMethodChartRef} id="paymentMethodChart"></canvas>
              </div>
              <div className="payment-methods-small-cards">
                <h4 className="small-cards-title">TOP 3 METHODS</h4>
                <div className="small-cards-container">
                  {kpiMetrics.paymentMethodDistribution.slice(0, 3).map((method, index) => (
                    <div key={index} className="payment-method-small-card">
                      <div className="small-card-header">
                        <div className={`small-card-badge badge-${index + 1}`}>#{index + 1}</div>
                        <div className="small-card-method">{method.method}</div>
                      </div>
                      <div className="small-card-stats">
                        <div className="small-card-amount">₱{method.amount.toLocaleString()}</div>
                        <div className="small-card-details">
                          <span className="small-card-count">{method.count} transactions</span>
                          <span className="small-card-percentage">{method.percentage}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="kpi-analytics-container">
  
      
      <div className="kpi-custom-layout">
        {/* Top Section - Days Payable Outstanding (Full Width) */}
        <div className="kpi-top-section">
          <div className="kpi-dpo-full-width">
            {renderDPOCard()}
          </div>
        </div>
        
        {/* Bottom Section - 2x2 Grid Layout */}
        <div className="kpi-bottom-grid">
          <div className="kpi-bottom-left">
            {renderVendorPerformanceCard()}
          </div>
          <div className="kpi-bottom-right">
            <div className="kpi-right-top">
              {renderPaymentAccuracyCard()}
            </div>
            <div className="kpi-right-bottom">
              {renderPaymentMethodCard()}
            </div>
          </div>
        </div>
      </div>

      <div className="kpi-summary">
        <div className="summary-card">
          <h3>
            <i className="fas fa-info-circle"></i>
            KPI Summary & Insights
          </h3>
          <div className="insights-grid">
            <div className="insight-item">
              <div className="insight-icon">
                <i className="fas fa-tachometer-alt"></i>
              </div>
              <div className="insight-content">
                <h4>Operational Efficiency</h4>
                <p>
                  Your average payment processing time is <strong>{kpiMetrics.dpo} days</strong>.
                  {kpiMetrics.dpo <= 25 ? ' This is within acceptable range.' : ' Consider optimizing your payment workflow.'}
                </p>
              </div>
            </div>
            <div className="insight-item">
              <div className="insight-icon">
                <i className="fas fa-shield-alt"></i>
              </div>
              <div className="insight-content">
                <h4>Quality Assurance</h4>
                <p>
                  Payment accuracy rate is <strong>{kpiMetrics.paymentAccuracy}%</strong>.
                  {kpiMetrics.paymentAccuracy >= 95 ? ' Excellent accuracy maintained.' : ' Review processes to reduce errors.'}
                </p>
              </div>
            </div>
            <div className="insight-item">
              <div className="insight-icon">
                <i className="fas fa-users"></i>
              </div>
              <div className="insight-content">
                <h4>Vendor Relations</h4>
                <p>
                  Tracking <strong>{kpiMetrics.vendorPerformance.length} vendors</strong> with performance ratings.
                  Focus on maintaining strong partnerships with top performers.
                </p>
              </div>
            </div>
            <div className="insight-item">
              <div className="insight-icon">
                <i className="fas fa-chart-pie"></i>
              </div>
              <div className="insight-content">
                <h4>Payment Modernization</h4>
                <p>
                  Monitor payment method distribution to track digital transformation progress
                  and identify opportunities for process improvement.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KPIAnalytics;
