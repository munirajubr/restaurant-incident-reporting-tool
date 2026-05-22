import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { BarChart2, TrendingUp, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import Card from '../components/Card';
import StatsCard from '../components/StatsCard';
import Toast from '../components/Toast';

const Analytics = () => {
  const { user } = useAuth();
  
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    critical: 0,
    resolutionRate: 0,
    categoryBreakdown: {},
    severityBreakdown: {},
    statusBreakdown: {}
  });

  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: 'info' });

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getIncidentStats();
      if (response.success && response.stats) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Fetch stats error:', error);
      setToast({
        message: error.message || 'Failed to load statistics data.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Calculations for custom SVG charts
  const severities = ['Low', 'Medium', 'High', 'Critical'];
  const severityColors = {
    Low: '#10b981',
    Medium: '#f59e0b',
    High: '#f97316',
    Critical: '#ef4444'
  };

  const getSeverityCount = (sev) => stats.severityBreakdown[sev] || 0;
  const maxSeverityCount = Math.max(...severities.map(getSeverityCount), 1);

  const categories = [
    'POS Issue',
    'Delivery Delay',
    'Inventory',
    'Kitchen Equipment',
    'Customer Complaint',
    'Other'
  ];
  const getCategoryCount = (cat) => stats.categoryBreakdown[cat] || 0;
  const maxCategoryCount = Math.max(...categories.map(getCategoryCount), 1);

  return (
    <div className="app-page-container">
      {/* Top Console Title */}
      <div className="dashboard-welcome">
        <div>
          <h1 className="dashboard-title">Metrics &amp; Analytics</h1>
          <p className="dashboard-subtitle">
            {user?.role === 'manager'
              ? 'Analyzing incident metrics and response rates across all store networks'
              : `Analyzing operational performance for location: ${user?.storeLocation}`}
          </p>
        </div>
        <div className="dashboard-actions-header">
          <button
            onClick={fetchStats}
            className="btn-refresh"
            title="Refresh analytics data"
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="table-loading-spinner-box">
          <span className="spinner-loader"></span>
          <p>Compiling database analytical aggregates...</p>
        </div>
      ) : (
        <>
          {/* Top Quick Stats Grid */}
          <div className="stats-grid">
            <StatsCard
              title="Resolution Rate"
              value={`${stats.resolutionRate}%`}
              icon={<TrendingUp size={24} />}
              variant="primary"
              trend="Target threshold: > 85%"
            />
            <StatsCard
              title="Critical Incidents"
              value={stats.critical}
              icon={<AlertTriangle size={24} />}
              variant="danger"
              trend="Require immediate dispatch"
            />
            <StatsCard
              title="Active Backlog"
              value={stats.active}
              icon={<BarChart2 size={24} />}
              variant="secondary"
              trend="Pending manager resolution"
            />
            <StatsCard
              title="Resolved Logs"
              value={stats.resolved + stats.closed}
              icon={<CheckCircle size={24} />}
              variant="success"
              trend="Archived and documented"
            />
          </div>

          {/* Primary Custom SVG Charts Grid */}
          <div className="analytics-grid">
            
            {/* Severity Distribution Custom Bar Chart */}
            <div className="analytics-card">
              <div className="analytics-card-header">
                <h3 className="analytics-card-title">Severity Assessment Breakdown</h3>
                <p className="analytics-card-subtitle">Volume distribution mapped by impact level</p>
              </div>
              
              <div className="svg-chart-container">
                <svg width="100%" height="240" viewBox="0 0 400 240" style={{ maxWidth: '400px' }}>
                  {/* Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                    const y = 40 + ratio * 140;
                    const val = Math.round(maxSeverityCount * (1 - ratio));
                    return (
                      <g key={i}>
                        <line x1="50" y1={y} x2="360" y2={y} className="svg-grid-line" />
                        <text x="35" y={y + 4} className="svg-chart-label" textAnchor="end">{val}</text>
                      </g>
                    );
                  })}

                  {/* Bars */}
                  {severities.map((sev, idx) => {
                    const count = getSeverityCount(sev);
                    const barHeight = count > 0 ? (count / maxSeverityCount) * 140 : 0;
                    const x = 70 + idx * 80;
                    const y = 180 - barHeight;
                    const barWidth = 40;

                    return (
                      <g key={sev}>
                        <rect
                          x={x}
                          y={y}
                          width={barWidth}
                          height={Math.max(barHeight, 2)}
                          fill={severityColors[sev]}
                          className="svg-bar"
                          rx="4"
                          ry="4"
                        />
                        {count > 0 && (
                          <text
                            x={x + barWidth / 2}
                            y={y - 8}
                            className="svg-chart-label"
                            textAnchor="middle"
                            style={{ fontWeight: 700, fill: '#0f172a' }}
                          >
                            {count}
                          </text>
                        )}
                        <text
                          x={x + barWidth / 2}
                          y="205"
                          className="svg-chart-label"
                          textAnchor="middle"
                          style={{ fontWeight: 600 }}
                        >
                          {sev}
                        </text>
                      </g>
                    );
                  })}
                  {/* Axis Line */}
                  <line x1="50" y1="180" x2="360" y2="180" className="svg-axis-line" />
                </svg>
              </div>
            </div>

            {/* Category Analysis Custom Bar Chart */}
            <div className="analytics-card">
              <div className="analytics-card-header">
                <h3 className="analytics-card-title">Category Distribution Overview</h3>
                <p className="analytics-card-subtitle">Comparing relative counts of operational faults</p>
              </div>

              <div className="svg-chart-container">
                <svg width="100%" height="240" viewBox="0 0 420 240" style={{ maxWidth: '420px' }}>
                  {/* Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                    const x = 110 + ratio * 270;
                    const val = Math.round(maxCategoryCount * ratio);
                    return (
                      <g key={i}>
                        <line x1={x} y1="20" x2={x} y2="190" className="svg-grid-line" />
                        <text x={x} y="205" className="svg-chart-label" textAnchor="middle">{val}</text>
                      </g>
                    );
                  })}

                  {/* Horizontal Bars */}
                  {categories.map((cat, idx) => {
                    const count = getCategoryCount(cat);
                    const barWidth = count > 0 ? (count / maxCategoryCount) * 270 : 0;
                    const y = 30 + idx * 26;
                    const barHeight = 14;
                    const shortName = cat.replace(' Equipment', '').replace(' Complaint', '');

                    return (
                      <g key={cat}>
                        <text
                          x="100"
                          y={y + 11}
                          className="svg-chart-label"
                          textAnchor="end"
                          style={{ fontWeight: 500 }}
                        >
                          {shortName}
                        </text>
                        <rect
                          x="110"
                          y={y}
                          width={Math.max(barWidth, 2)}
                          height={barHeight}
                          fill="#f25c22"
                          className="svg-bar"
                          rx="3"
                          ry="3"
                        />
                        {count > 0 && (
                          <text
                            x={110 + barWidth + 8}
                            y={y + 11}
                            className="svg-chart-label"
                            textAnchor="start"
                            style={{ fontWeight: 700, fill: '#0f172a' }}
                          >
                            {count}
                          </text>
                        )}
                      </g>
                    );
                  })}
                  {/* Axis boundary Line */}
                  <line x1="110" y1="20" x2="110" y2="190" className="svg-axis-line" />
                </svg>
              </div>
            </div>

            {/* Resolution Efficiency and Backlog Status */}
            <div className="analytics-card analytics-full-width-card">
              <div className="analytics-card-header">
                <h3 className="analytics-card-title">Incident Life-Cycle Analysis</h3>
                <p className="analytics-card-subtitle">Active backlogs versus resolved historical logs</p>
              </div>

              <div className="analytics-donut-layout">
                {/* SVG Semi Donut representing progress */}
                <div className="svg-chart-container">
                  <svg width="100%" height="160" viewBox="0 0 200 120" style={{ maxWidth: '240px' }}>
                    {/* Background Arc */}
                    <path
                      d="M 20 100 A 80 80 0 0 1 180 100"
                      fill="none"
                      stroke="#f1f5f9"
                      strokeWidth="16"
                      strokeLinecap="round"
                    />
                    {/* Foreground Arc */}
                    {stats.resolutionRate > 0 && (
                      <path
                        d="M 20 100 A 80 80 0 0 1 180 100"
                        fill="none"
                        stroke="url(#gradient-orange)"
                        strokeWidth="16"
                        strokeLinecap="round"
                        strokeDasharray="251.2"
                        strokeDashoffset={251.2 - (251.2 * stats.resolutionRate) / 100}
                        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                      />
                    )}
                    {/* Text overlays */}
                    <text x="100" y="80" textAnchor="middle" style={{ fontSize: '24px', fontWeight: 800, fill: '#0f172a', fontFamily: 'Outfit' }}>
                      {stats.resolutionRate}%
                    </text>
                    <text x="100" y="100" textAnchor="middle" style={{ fontSize: '10px', fontWeight: 600, fill: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Resolution Efficiency
                    </text>

                    {/* Gradients */}
                    <defs>
                      <linearGradient id="gradient-orange" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f25c22" />
                        <stop offset="100%" stopColor="#f59e0b" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                {/* Backlog detailed ledger list */}
                <div className="analytics-stats-list">
                  <div className="analytics-stat-item">
                    <div className="analytics-stat-label-group">
                      <span className="analytics-stat-dot" style={{ backgroundColor: '#10b981' }}></span>
                      <span className="analytics-stat-name">Resolved &amp; Closed Cases</span>
                    </div>
                    <span className="analytics-stat-value">
                      {stats.resolved + stats.closed}
                      <span className="analytics-stat-percent">
                        ({stats.total > 0 ? Math.round(((stats.resolved + stats.closed) / stats.total) * 100) : 0}%)
                      </span>
                    </span>
                  </div>

                  <div className="analytics-stat-item">
                    <div className="analytics-stat-label-group">
                      <span className="analytics-stat-dot" style={{ backgroundColor: '#d97706' }}></span>
                      <span className="analytics-stat-name">In Progress Dispatches</span>
                    </div>
                    <span className="analytics-stat-value">
                      {stats.inProgress}
                      <span className="analytics-stat-percent">
                        ({stats.total > 0 ? Math.round((stats.inProgress / stats.total) * 100) : 0}%)
                      </span>
                    </span>
                  </div>

                  <div className="analytics-stat-item">
                    <div className="analytics-stat-label-group">
                      <span className="analytics-stat-dot" style={{ backgroundColor: '#1d4ed8' }}></span>
                      <span className="analytics-stat-name">Open / Unassigned Queues</span>
                    </div>
                    <span className="analytics-stat-value">
                      {stats.open}
                      <span className="analytics-stat-percent">
                        ({stats.total > 0 ? Math.round((stats.open / stats.total) * 100) : 0}%)
                      </span>
                    </span>
                  </div>

                  <div className="analytics-stat-item">
                    <div className="analytics-stat-label-group">
                      <span className="analytics-stat-dot" style={{ backgroundColor: '#64748b' }}></span>
                      <span className="analytics-stat-name">Aggregate Incident Submissions</span>
                    </div>
                    <span className="analytics-stat-value" style={{ fontSize: '1rem', fontWeight: 800 }}>
                      {stats.total}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </>
      )}

      {toast.message && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: 'info' })}
        />
      )}
    </div>
  );
};

export default Analytics;
