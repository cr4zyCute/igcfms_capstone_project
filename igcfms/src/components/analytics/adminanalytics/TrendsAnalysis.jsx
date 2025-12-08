import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Chart from 'chart.js/auto';
import API_BASE_URL from '../../../config/api';
import './css/trendsanalysis.css';

const TrendsAnalysis = ({ selectedYear }) => {
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ collections: 0, disbursements: 0, net: 0 });
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    fetchTrendData();
  }, [selectedYear]);

  useEffect(() => {
    if (!loading && trendData.length > 0) {
      initializeChart();
    }
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [trendData, loading]);

  const fetchTrendData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // Fetch all transactions in the system
      const response = await axios.get(`${API_BASE_URL}/transactions`, {
        params: { limit: 5000 },
        headers
      });

      const transactions = Array.isArray(response.data) ? response.data : response.data.data || [];
      
      // Filter transactions by selected year
      const filteredTransactions = transactions.filter(transaction => {
        const transactionYear = new Date(transaction.created_at).getFullYear();
        return transactionYear === selectedYear;
      });

      // Group transactions by date
      const dailyData = {};
      let totalCollections = 0;
      let totalDisbursements = 0;

      filteredTransactions.forEach(transaction => {
        const date = new Date(transaction.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const amount = parseFloat(transaction.amount || 0);

        if (!dailyData[date]) {
          dailyData[date] = { collections: 0, disbursements: 0 };
        }

        if (transaction.type === 'Collection') {
          dailyData[date].collections += amount;
          totalCollections += amount;
        } else {
          dailyData[date].disbursements += Math.abs(amount);
          totalDisbursements += Math.abs(amount);
        }
      });

      const sortedDates = Object.keys(dailyData).slice(-15); // Last 15 days for display
      const data = sortedDates.map(date => ({
        date,
        collections: dailyData[date].collections,
        disbursements: dailyData[date].disbursements
      }));

      setTrendData(data);
      setStats({
        collections: totalCollections,
        disbursements: totalDisbursements,
        net: totalCollections - totalDisbursements
      });
    } catch (error) {
      console.error('Error fetching trend data:', error);
      setTrendData([]);
    } finally {
      setLoading(false);
    }
  };

  const initializeChart = () => {
    if (!chartRef.current) return;

    setTimeout(() => {
      if (!chartRef.current) return;

      const ctx = chartRef.current.getContext('2d');
      
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const labels = trendData.map(item => item.date);
      const collectionsData = trendData.map(item => item.collections);
      const disbursementsData = trendData.map(item => item.disbursements);

      const maxValue = Math.max(
        ...collectionsData,
        ...disbursementsData,
        1
      );

      // Create gradients for collections
      const collectionsGradient = ctx.createLinearGradient(0, 0, 0, chartRef.current?.clientHeight || 260);
      collectionsGradient.addColorStop(0, 'rgba(46, 125, 50, 0.35)');
      collectionsGradient.addColorStop(1, 'rgba(46, 125, 50, 0.05)');

      // Create gradients for disbursements
      const disbursementsGradient = ctx.createLinearGradient(0, 0, 0, chartRef.current?.clientHeight || 260);
      disbursementsGradient.addColorStop(0, 'rgba(198, 40, 40, 0.35)');
      disbursementsGradient.addColorStop(1, 'rgba(198, 40, 40, 0.05)');

      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Collections',
              data: collectionsData,
              borderColor: '#2e7d32',
              backgroundColor: collectionsGradient,
              borderWidth: 3,
              fill: true,
              tension: 0.4,
              pointRadius: 0,
              pointHoverRadius: 6,
              pointBackgroundColor: '#2e7d32',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointHitRadius: 12,
              spanGaps: true
            },
            {
              label: 'Disbursements',
              data: disbursementsData,
              borderColor: '#c62828',
              backgroundColor: disbursementsGradient,
              borderWidth: 3,
              fill: true,
              tension: 0.4,
              pointRadius: 0,
              pointHoverRadius: 6,
              pointBackgroundColor: '#c62828',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointHitRadius: 12,
              spanGaps: true
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
          layout: {
            padding: {
              top: 8,
              bottom: 4,
              left: 4,
              right: 8
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
              displayColors: true,
              padding: 12,
              titleFont: { size: 12, weight: '700' },
              bodyFont: { size: 11, weight: '500' },
              callbacks: {
                title: (context) => context[0].label,
                label: (context) => `${context.dataset.label}: ₱${context.parsed.y.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              suggestedMax: maxValue === 0 ? 3 : undefined,
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

  if (loading) {
    return <div className="trends-loading">Loading...</div>;
  }

  const hasData = trendData.length > 0;

  return (
    <div className="trends-analysis-container">
      {/* <div className="trends-header">
        <h4 className="trends-title">
          <i className="fas fa-chart-line trends-icon"></i>
          Trends & Analysis (Last 30 Days)
        </h4>
      </div> */}

      <div className="trends-stats">
        <div className="stat-item">
          <span className="stat-label">
            <span className="stat-color collections"></span>
            Total Collections
          </span>
          <span className="stat-value collections">₱{stats.collections.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">
            <span className="stat-color disbursements"></span>
            Total Disbursements
          </span>
          <span className="stat-value disbursements">₱{stats.disbursements.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
        </div>
      </div>

      <div className="trends-chart">
        {hasData ? (
          <canvas 
            ref={chartRef}
            style={{ 
              maxWidth: '100%', 
              maxHeight: '100%' 
            }}
          ></canvas>
        ) : (
          <div className="trends-no-data-message">No data this year</div>
        )}
      </div>

    </div>
  );
};

export default TrendsAnalysis;
