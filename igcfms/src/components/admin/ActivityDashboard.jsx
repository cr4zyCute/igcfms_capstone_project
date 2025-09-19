import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './css/activitydashboard.css';

const ActivityDashboard = () => {
  const [activities, setActivities] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    period: '7',
    role: 'all',
    type: 'all'
  });

  const API_BASE = "http://localhost:8000/api";
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchData();
 
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };

      const [activitiesRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE}/activity-logs/recent?limit=20`, { headers }),
        axios.get(`${API_BASE}/activity-logs/statistics?period=${filters.period}`, { headers })
      ]);

      setActivities(activitiesRes.data);
      setStatistics(statsRes.data);
      setError('');
    } catch (err) {
      console.error('Error fetching activity data:', err);
      setError('Failed to load activity data');
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    const icons = {
      'login': 'fas fa-sign-in-alt',
      'login_failed': 'fas fa-exclamation-triangle',
      'logout': 'fas fa-sign-out-alt',
      'collection_created': 'fas fa-coins',
      'disbursement_created': 'fas fa-money-bill-wave',
      'override_requested': 'fas fa-edit',
      'override_approved': 'fas fa-check-circle',
      'override_rejected': 'fas fa-times-circle',
      'fund_account_created': 'fas fa-university',
      'fund_account_updated': 'fas fa-university',
      'report_generated': 'fas fa-chart-bar',
      'user_created': 'fas fa-user-plus',
      'user_updated': 'fas fa-user-edit',
      'receipt_issued': 'fas fa-receipt',
      'cheque_issued': 'fas fa-money-check',
    };
    return icons[type] || 'fas fa-info-circle';
  };

  const getActivityColor = (type) => {
    const colors = {
      'login': 'success',
      'login_failed': 'danger',
      'logout': 'info',
      'collection_created': 'success',
      'disbursement_created': 'warning',
      'override_requested': 'warning',
      'override_approved': 'success',
      'override_rejected': 'danger',
      'fund_account_created': 'primary',
      'fund_account_updated': 'primary',
      'report_generated': 'info',
      'user_created': 'primary',
      'user_updated': 'primary',
      'receipt_issued': 'success',
      'cheque_issued': 'warning',
    };
    return colors[type] || 'secondary';
  };

  const getPriorityLevel = (type) => {
    const highPriority = ['login_failed', 'override_requested', 'user_created'];
    const mediumPriority = ['login', 'collection_created', 'disbursement_created'];
    
    if (highPriority.includes(type)) return 'HIGH';
    if (mediumPriority.includes(type)) return 'MEDIUM';
    return 'LOW';
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="activity-dashboard-loading">
        <div className="spinner"></div>
        <p>Loading activity dashboard...</p>
      </div>
    );
  }

  return (
    <div className="activity-dashboard">
      <div className="dashboard-header">
        <h2>
          <i className="fas fa-chart-line"></i>
          System Activity Dashboard
        </h2>
        <div className="dashboard-controls">
          <select 
            value={filters.period} 
            onChange={(e) => setFilters({...filters, period: e.target.value})}
            className="period-select"
          >
            <option value="1">Last 24 hours</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <button onClick={fetchData} className="refresh-btn">
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <i className="fas fa-exclamation-triangle"></i>
          {error}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">
            <i className="fas fa-chart-bar"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{statistics.statistics?.total_activities || 0}</div>
            <div className="stat-label">Total Activities</div>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">
            <i className="fas fa-sign-in-alt"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{statistics.statistics?.login_activities || 0}</div>
            <div className="stat-label">Successful Logins</div>
          </div>
        </div>

        <div className="stat-card danger">
          <div className="stat-icon">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{statistics.statistics?.failed_logins || 0}</div>
            <div className="stat-label">Failed Login Attempts</div>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">
            <i className="fas fa-money-bill-wave"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{statistics.statistics?.transactions || 0}</div>
            <div className="stat-label">Transactions</div>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-icon">
            <i className="fas fa-edit"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{statistics.statistics?.override_requests || 0}</div>
            <div className="stat-label">Override Requests</div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="activities-section">
        <div className="section-header">
          <h3>
            <i className="fas fa-history"></i>
            Recent Activities
          </h3>
          <span className="activity-count">{activities.length} activities</span>
        </div>

        <div className="activities-list">
          {activities.length === 0 ? (
            <div className="no-activities">
              <i className="fas fa-inbox"></i>
              <p>No recent activities found</p>
            </div>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className={`activity-item ${getActivityColor(activity.activity_type)}`}>
                <div className="activity-icon">
                  <i className={getActivityIcon(activity.activity_type)}></i>
                </div>
                
                <div className="activity-content">
                  <div className="activity-header">
                    <div className="activity-title">
                      {activity.activity_description}
                    </div>
                    <div className="activity-meta">
                      <span className={`priority-badge priority-${getPriorityLevel(activity.activity_type).toLowerCase()}`}>
                        {getPriorityLevel(activity.activity_type)}
                      </span>
                      <span className="activity-time">
                        {formatTimeAgo(activity.created_at)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="activity-details">
                    <div className="detail-item">
                      <span className="detail-label">User:</span>
                      <span className="detail-value">{activity.user_name} ({activity.user_role})</span>
                    </div>
                    {activity.ip_address && (
                      <div className="detail-item">
                        <span className="detail-label">IP:</span>
                        <span className="detail-value">{activity.ip_address}</span>
                      </div>
                    )}
                    {activity.details && Object.keys(activity.details).length > 0 && (
                      <div className="detail-item">
                        <span className="detail-label">Details:</span>
                        <span className="detail-value">
                          {Object.entries(activity.details)
                            .filter(([key, value]) => !['user_agent', 'session_id'].includes(key) && value)
                            .map(([key, value]) => `${key}: ${value}`)
                            .join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {activity.activity_type === 'login_failed' && (
                  <div className="activity-alert">
                    <i className="fas fa-shield-alt"></i>
                    <span>Security Alert</span>
                  </div>
                )}

                {activity.activity_type === 'override_requested' && (
                  <div className="activity-alert">
                    <i className="fas fa-clock"></i>
                    <span>Action Required</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Activity by Role Chart */}
      {statistics.activity_by_role && Object.keys(statistics.activity_by_role).length > 0 && (
        <div className="chart-section">
          <h3>
            <i className="fas fa-users"></i>
            Activity by Role
          </h3>
          <div className="role-chart">
            {Object.entries(statistics.activity_by_role).map(([role, count]) => (
              <div key={role} className="role-item">
                <div className="role-name">{role}</div>
                <div className="role-bar">
                  <div 
                    className="role-fill" 
                    style={{
                      width: `${(count / Math.max(...Object.values(statistics.activity_by_role))) * 100}%`
                    }}
                  ></div>
                </div>
                <div className="role-count">{count}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityDashboard;
