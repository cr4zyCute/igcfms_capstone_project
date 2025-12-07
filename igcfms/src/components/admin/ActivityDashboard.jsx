import React, { useState, useMemo, useEffect } from 'react';
import './css/activitydashboard.css';
import { useRecentActivities, useActivityStatistics } from '../../hooks/useActivityDashboard.js';

const ActivityDashboard = () => {
  const [filters, setFilters] = useState({
    period: '7',
    role: 'all',
    type: 'all',
    limit: 1000,
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [activeStatFilter, setActiveStatFilter] = useState(null);

  // TanStack Query hooks
  const { 
    data: activities = [], 
    isLoading: activitiesLoading, 
    error: activitiesError,
    refetch: refetchActivities
  } = useRecentActivities({ filters, refetchInterval: 30000 });

  const { 
    data: statistics = {}, 
    isLoading: statisticsLoading, 
    error: statisticsError,
    refetch: refetchStatistics
  } = useActivityStatistics({ filters, refetchInterval: 30000 });

  const loading = activitiesLoading || statisticsLoading;
  const statVal = (key) => (statistics?.statistics?.[key] ?? statistics?.[key] ?? 0);
  const error = activitiesError?.message || statisticsError?.message || '';

  // Manual refresh function
  const handleRefresh = () => {
    refetchActivities();
    refetchStatistics();
  };

  // Filter activities based on active stat filter
  const filteredActivities = useMemo(() => {
    if (activeStatFilter === null) {
      return activities;
    }
    
    return activities.filter(activity => {
      switch(activeStatFilter) {
        case 'login':
          return activity.activity_type === 'login';
        case 'login_failed':
          return activity.activity_type === 'login_failed';
        case 'collection_created':
        case 'disbursement_created':
        case 'receipt_issued':
          return ['collection_created', 'disbursement_created', 'receipt_issued'].includes(activity.activity_type);
        case 'override_requested':
          return activity.activity_type === 'override_requested';
        default:
          return true;
      }
    });
  }, [activeStatFilter, activities]);

  useEffect(() => {
    const tp = Math.max(1, Math.ceil((filteredActivities?.length || 0) / pageSize));
    if (page > tp) setPage(tp);
  }, [filteredActivities, page, pageSize, pageSize]);

  const paginatedActivities = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredActivities.slice(start, start + pageSize);
  }, [filteredActivities, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil((filteredActivities?.length || 0) / pageSize));
  const startItem = filteredActivities.length ? (page - 1) * pageSize + 1 : 0;
  const endItem = Math.min(filteredActivities.length, page * pageSize);

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

  const formatTypeLabel = (type = '') => String(type).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

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
          <button onClick={handleRefresh} className="refresh-btn" disabled={loading}>
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
        <div 
          className={`stat-card primary ${activeStatFilter === null ? 'active' : ''}`}
          onClick={() => setActiveStatFilter(null)}
          style={{ cursor: 'pointer' }}
        >
          <div className="ad-stat-icon">
            <i className="fas fa-chart-bar"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{statVal('total_activities')}</div>
            <div className="stat-label">Total Activities</div>
          </div>
        </div>

        <div 
          className={`stat-card success ${activeStatFilter === 'login' ? 'active' : ''}`}
          onClick={() => setActiveStatFilter('login')}
          style={{ cursor: 'pointer' }}
        >
          <div className="ad-stat-icon">
            <i className="fas fa-sign-in-alt"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{statVal('login_activities')}</div>
            <div className="stat-label">Successful Logins</div>
          </div>
        </div>

        <div 
          className={`stat-card danger ${activeStatFilter === 'login_failed' ? 'active' : ''}`}
          onClick={() => setActiveStatFilter('login_failed')}
          style={{ cursor: 'pointer' }}
        >
          <div className="ad-stat-icon">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{statVal('failed_logins')}</div>
            <div className="stat-label">Failed Login Attempts</div>
          </div>
        </div>

        <div 
          className={`stat-card warning ${activeStatFilter === 'collection_created' ? 'active' : ''}`}
          onClick={() => setActiveStatFilter('collection_created')}
          style={{ cursor: 'pointer' }}
        >
          <div className="ad-stat-icon">
            <i className="fas fa-money-bill-wave"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{statVal('transactions')}</div>
            <div className="stat-label">Transactions</div>
          </div>
        </div>

        <div 
          className={`stat-card info ${activeStatFilter === 'override_requested' ? 'active' : ''}`}
          onClick={() => setActiveStatFilter('override_requested')}
          style={{ cursor: 'pointer' }}
        >
          <div className="ad-stat-icon">
            <i className="fas fa-edit"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{statVal('override_requests')}</div>
            <div className="stat-label">Override Requests</div>
          </div>
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
      {/* Recent Activities */}
      <div className="activities-section">
        <div className="section-header">
          <h3>
            <i className="fas fa-history"></i>
            Recent Activities
            {activeStatFilter && (
              <span className="filter-badge">
                <i className="fas fa-filter"></i> Filtered
              </span>
            )}
          </h3>
          <span className="activity-count">{filteredActivities.length} activities</span>
        </div>

        {/* Table view */}
        {filteredActivities.length === 0 ? (
          <div className="no-activities">
            <i className="fas fa-inbox"></i>
            <p>{activeStatFilter ? 'No activities found for this filter' : 'No recent activities found'}</p>
          </div>
        ) : (
          <div className="activities-table-container">
            <table className="activities-table">
              <thead>
                <tr>
                  <th><i className="fas fa-hashtag"></i> ID</th>
                  <th><i className="fas fa-bolt"></i> TYPE</th>
                  <th><i className="fas fa-align-left"></i> DESCRIPTION</th>
                  <th><i className="fas fa-user"></i> USER</th>
                  <th><i className="fas fa-exclamation-circle"></i> PRIORITY</th>
                  <th><i className="fas fa-clock"></i> TIME</th>
                  <th><i className="fas fa-network-wired"></i> IP</th>
                </tr>
              </thead>
              <tbody>
                {paginatedActivities.map((activity) => (
                  <tr key={activity.id} className={`table-row`}>
                    <td>#{activity.id}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className={`activity-icon small ${getActivityColor(activity.activity_type)}`} style={{ width: 26, height: 26, borderRadius: 6 }}>
                          <i className={getActivityIcon(activity.activity_type)}></i>
                        </span>
                        <strong>{formatTypeLabel(activity.activity_type)}</strong>
                      </div>
                    </td>
                    <td>{activity.activity_description}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <strong>{activity.user_name || '—'}</strong>
                        <span style={{ color: '#6b7280', fontSize: 12 }}>{activity.user_role || '—'}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`priority-badge priority-${getPriorityLevel(activity.activity_type).toLowerCase()}`}>
                        {getPriorityLevel(activity.activity_type)}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span title={new Date(activity.created_at).toLocaleString()}>{formatTimeAgo(activity.created_at)}</span>
                        <span style={{ color: '#9ca3af', fontSize: 12 }}>{new Date(activity.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td>{activity.ip_address || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="activities-pagination" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
          <div style={{ color: '#6b7280', fontSize: 12 }}>
            {filteredActivities.length ? `Showing ${startItem}–${endItem} of ${filteredActivities.length}` : 'No activities'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <select
              value={pageSize}
              onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)); }}
              style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 6 }}
            >
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff' }}
            >
              <i className="fas fa-chevron-left"></i> Prev
            </button>
            <span style={{ minWidth: 90, textAlign: 'center', fontSize: 12, color: '#374151' }}>
              Page {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff' }}
            >
              Next <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>

     
    </div>
  );
};

export default ActivityDashboard;
