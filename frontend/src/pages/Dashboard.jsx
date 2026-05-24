import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  ClipboardList,
  Search,
  SlidersHorizontal,
  X,
  Trash2,
  Calendar,
  User,
  Store,
  RefreshCw,
  Plus,
  UserPlus,
  Sparkles
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import StatsCard from '../components/StatsCard';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Input from '../components/Input';
import Toast from '../components/Toast';

// Helper to parse AI solution text into collapsible sections with clean text
const parseAiSolution = (text) => {
  if (!text) return [];
  
  // Clean all bold and list markdown characters: *, **, and strip any leading/trailing space
  const cleanText = text.replace(/\*\*/g, '').replace(/\*/g, '');
  
  const lines = cleanText.split('\n');
  const sections = [];
  let currentSection = null;
  
  // Match headers (e.g., "1. Immediate Action Plan", "2. Root Cause...", "Immediate Action Plan", etc.)
  const isHeader = (line) => {
    const l = line.toLowerCase().trim();
    return (
      /^\d+\.\s+/.test(l) || // Starts with "1. ", "2. ", etc.
      l.includes('immediate action plan') ||
      l.includes('root cause analysis') ||
      l.includes('preventative actions') ||
      l.includes('recommended operations tools') ||
      l.includes('recommended tools')
    );
  };

  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    if (isHeader(trimmed)) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        title: trimmed,
        content: []
      };
    } else {
      if (!currentSection) {
        currentSection = {
          title: 'AI Incident Analysis',
          content: []
        };
      }
      currentSection.content.push(trimmed);
    }
  }
  
  if (currentSection) {
    sections.push(currentSection);
  }
  
  return sections;
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State Management
  const [incidents, setIncidents] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    critical: 0,
    resolutionRate: 0,
  });

  const [filters, setFilters] = useState({
    category: '',
    severity: '',
    status: '',
    storeLocation: '',
    search: '',
  });

  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Manager Add User Form States
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [addUserForm, setAddUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    storeLocation: '',
  });
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [addUserError, setAddUserError] = useState('');

  // AI Solution Generation States
  const [aiLoading, setAiLoading] = useState(false);

  // Inspector form states (for managers)
  const [inspectStatus, setInspectStatus] = useState('');
  const [inspectNotes, setInspectNotes] = useState('');
  const [inspectActions, setInspectActions] = useState([]);

  // Fetch incidents list
  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getIncidents(filters);
      if (response.success) {
        setIncidents(response.data);
      }
    } catch (error) {
      console.error('Fetch incidents error:', error);
      setToast({
        message: error.message || 'Failed to load incidents log.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const response = await api.getIncidentStats();
      if (response.success && response.stats) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Fetch stats error:', error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Sync details on filter changes or manual trigger
  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      category: '',
      severity: '',
      status: '',
      storeLocation: '',
      search: '',
    });
  };

  const handleInspectClick = async (incidentId) => {
    setModalLoading(true);
    try {
      const response = await api.getIncidentById(incidentId);
      if (response.success && response.data) {
        setSelectedIncident(response.data);
        setInspectStatus(response.data.status);
        setInspectNotes(response.data.managerNotes || '');
        setInspectActions(response.data.resolutionActions || []);
      }
    } catch (error) {
      setToast({
        message: error.message || 'Could not fetch incident details.',
        type: 'error',
      });
    } finally {
      setModalLoading(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedIncident(null);
    const params = new URLSearchParams(window.location.search);
    if (params.has('inspect')) {
      navigate('/', { replace: true });
    }
  };

  const handleAddUserChange = (e) => {
    const { name, value } = e.target;
    setAddUserForm((prev) => ({ ...prev, [name]: value }));
    setAddUserError('');
  };

  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    
    if (!addUserForm.name.trim()) {
      setAddUserError('Full name is required.');
      return;
    }
    if (!addUserForm.email.trim()) {
      setAddUserError('Email is required.');
      return;
    } else if (!/\S+@\S+\.\S+/.test(addUserForm.email)) {
      setAddUserError('Please provide a valid email.');
      return;
    }
    if (!addUserForm.password) {
      setAddUserError('Password is required.');
      return;
    } else if (addUserForm.password.length < 6) {
      setAddUserError('Password must be at least 6 characters.');
      return;
    }
    if (!addUserForm.storeLocation) {
      setAddUserError('Please select a store location.');
      return;
    }

    setAddUserLoading(true);
    setAddUserError('');
    try {
      const response = await api.register(addUserForm);
      if (response.success) {
        setToast({
          message: `User Account for '${addUserForm.name}' (${addUserForm.role}) added successfully!`,
          type: 'success',
        });
        
        setAddUserForm({
          name: '',
          email: '',
          password: '',
          role: 'staff',
          storeLocation: '',
        });
        setShowAddUserModal(false);
      }
    } catch (error) {
      setAddUserError(error.message || 'Failed to register new user.');
    } finally {
      setAddUserLoading(false);
    }
  };

  const handleGenerateAiSolution = async () => {
    if (!selectedIncident) return;
    
    setAiLoading(true);
    try {
      const response = await api.generateAiSolution(selectedIncident._id);
      if (response.success && response.data) {
        setToast({
          message: 'Gemini AI successfully generated and saved incident solution guide!',
          type: 'success',
        });
        
        setSelectedIncident(response.data);
        fetchIncidents();
      }
    } catch (error) {
      setToast({
        message: error.message || 'Gemini AI failed to compile incident solution plan.',
        type: 'error',
      });
    } finally {
      setAiLoading(false);
    }
  };

  // Deep-link check for "?inspect=incident_id" query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inspectId = params.get('inspect');
    if (inspectId) {
      handleInspectClick(inspectId);
    }
  }, [window.location.search]);

  const handleQuickStatusUpdate = async (newStatus) => {
    if (!selectedIncident) return;

    setModalLoading(true);
    try {
      const response = await api.updateIncidentStatus(
        selectedIncident._id,
        newStatus,
        inspectNotes,
        inspectActions
      );
      if (response.success) {
        setToast({
          message: `Incident status updated to '${newStatus}'!`,
          type: 'success',
        });
        
        setInspectStatus(newStatus);
        
        // Refresh details
        setSelectedIncident(response.data);
        
        // Refresh grids
        fetchIncidents();
        fetchStats();
      }
    } catch (error) {
      setToast({
        message: error.message || 'Failed to update status.',
        type: 'error',
      });
    } finally {
      setModalLoading(false);
    }
  };

  const handleSaveResolution = async (e) => {
    e.preventDefault();
    if (!selectedIncident) return;

    setModalLoading(true);
    try {
      const response = await api.updateIncidentStatus(
        selectedIncident._id,
        inspectStatus,
        inspectNotes,
        inspectActions
      );
      if (response.success) {
        setToast({
          message: `Incident status updated to '${inspectStatus}'!`,
          type: 'success',
        });
        
        // Refresh details
        setSelectedIncident(response.data);
        
        // Refresh grids
        fetchIncidents();
        fetchStats();
      }
    } catch (error) {
      setToast({
        message: error.message || 'Failed to save changes.',
        type: 'error',
      });
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteIncident = async (incidentId) => {
    if (!window.confirm('Are you absolutely sure you want to delete this incident report? This action cannot be undone.')) {
      return;
    }

    setModalLoading(true);
    try {
      const response = await api.deleteIncident(incidentId);
      if (response.success) {
        setToast({
          message: 'Incident report deleted successfully.',
          type: 'success',
        });
        handleCloseModal();
        fetchIncidents();
        fetchStats();
      }
    } catch (error) {
      setToast({
        message: error.message || 'Failed to delete incident.',
        type: 'error',
      });
    } finally {
      setModalLoading(false);
    }
  };

  // Helper date formatter
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Helper to parse multiple images
  const getIncidentImages = (imageField) => {
    if (!imageField) return [];
    const trimmed = imageField.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Failed to parse incident images JSON:', e);
      }
    }
    return [imageField];
  };

  // Option listings
  const categoryOptions = [
    { value: 'POS Issue', label: 'POS System Issue' },
    { value: 'Delivery Delay', label: 'Delivery/Courier Delay' },
    { value: 'Inventory', label: 'Inventory / Shortage' },
    { value: 'Kitchen Equipment', label: 'Kitchen Equipment' },
    { value: 'Customer Complaint', label: 'Customer Complaint' },
    { value: 'Other', label: 'Other Operational Issue' },
  ];

  const severityOptions = [
    { value: 'Low', label: 'Low Severity' },
    { value: 'Medium', label: 'Medium Severity' },
    { value: 'High', label: 'High Severity' },
    { value: 'Critical', label: 'Critical Severity' },
  ];

  const statusOptions = [
    { value: 'Open', label: 'Open' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Resolved', label: 'Resolved' },
    { value: 'Closed', label: 'Closed' },
  ];

  const storeOptions = [
    { value: 'Downtown Plaza', label: 'Downtown Plaza (Store #101)' },
    { value: 'Uptown Outlet', label: 'Uptown Outlet (Store #102)' },
    { value: 'West End Bistro', label: 'West End Bistro (Store #103)' },
    { value: 'Airport Food Court', label: 'Airport Food Court (Store #104)' },
    { value: 'Metro Station Kiosk', label: 'Metro Station Kiosk (Store #105)' },
  ];

  const unresolvedCriticalIncidents = incidents.filter(
    (inc) => inc.severity === 'Critical' && inc.status !== 'Resolved' && inc.status !== 'Closed'
  );

  return (
    <div className="app-page-container">
      {/* Top Welcome Title */}
      <div className="dashboard-welcome">
        <div>
          <h1 className="dashboard-title">Operations Console</h1>
          <p className="dashboard-subtitle">
            {user?.role === 'manager'
              ? 'Monitoring operational incident logs across all locations'
              : `Tracking logs for store: ${user?.storeLocation}`}
          </p>
        </div>
        <div className="dashboard-actions-header">
          {user?.role === 'manager' && (
            <button
              onClick={() => setShowAddUserModal(true)}
              className="btn btn-secondary btn-add-user"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', height: '2.6rem' }}
            >
              <UserPlus size={16} />
              <span>Add Staff</span>
            </button>
          )}
          <button
            onClick={() => {
              fetchIncidents();
              fetchStats();
            }}
            className="btn-refresh"
            title="Refresh logs"
          >
            <RefreshCw size={16} />
          </button>
          <Link to="/submit" className="btn btn-primary btn-add-incident">
            <Plus size={16} />
            <span>Report Incident</span>
          </Link>
        </div>
      </div>

      {/* Manager Critical Alert Banner */}
      {user?.role === 'manager' && unresolvedCriticalIncidents.length > 0 && (
        <div className="manager-critical-banner animate-fade-in">
          <div className="manager-critical-banner-header">
            <AlertCircle size={20} className="banner-alert-icon" />
            <h3 className="banner-title">
              CRITICAL ALERTS: {unresolvedCriticalIncidents.length} active critical incident(s) require immediate attention
            </h3>
          </div>
          <div className="manager-critical-banner-list">
            {unresolvedCriticalIncidents.map((inc) => (
              <div key={inc._id} className="banner-critical-item">
                <div className="banner-item-left">
                  <span className="banner-item-store">📍 {inc.storeLocation}</span>
                  <span className="banner-item-title">{inc.title}</span>
                  <span className="banner-item-time">⏱️ {formatDate(inc.dateTime)}</span>
                </div>
                <button
                  onClick={() => handleInspectClick(inc._id)}
                  className="banner-item-inspect-btn"
                >
                  Inspect Incident
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Statistics Cards */}
      <div className="stats-grid">
        <StatsCard
          title="Active Reports"
          value={stats.active}
          icon={<Clock size={24} />}
          variant="primary"
          trend="Open + In Progress cases"
        />
        <StatsCard
          title="Critical Alerts"
          value={stats.critical}
          icon={<AlertCircle size={24} />}
          variant="danger"
          trend="Cases labeled Critical"
        />
        <StatsCard
          title="Resolution Rate"
          value={`${stats.resolutionRate}%`}
          icon={<CheckCircle size={24} />}
          variant="success"
          trend="Resolved or Closed ratio"
        />
        <StatsCard
          title="Total Submitted"
          value={stats.total}
          icon={<ClipboardList size={24} />}
          variant="secondary"
          trend="Accumulated historical logs"
        />
      </div>

      {/* Filters Card Panel */}
      <Card className="filters-card">
        <div className="filters-layout-header">
          <SlidersHorizontal size={18} className="filters-header-icon" />
          <h4>Search & Filters</h4>
          {(filters.category || filters.severity || filters.status || filters.storeLocation || filters.search) && (
            <button onClick={handleResetFilters} className="btn-clear-filters">
              Reset Filters
            </button>
          )}
        </div>
        
        <div className="filters-grid">
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon-svg" />
            <input
              type="text"
              name="search"
              placeholder="Search by title or description..."
              value={filters.search}
              onChange={handleFilterChange}
              className="search-input-field"
            />
          </div>

          <Input
            id="category"
            name="category"
            type="select"
            placeholder="All Categories"
            value={filters.category}
            onChange={handleFilterChange}
            options={categoryOptions}
            className="filter-select-input"
          />

          <Input
            id="severity"
            name="severity"
            type="select"
            placeholder="All Severities"
            value={filters.severity}
            onChange={handleFilterChange}
            options={severityOptions}
            className="filter-select-input"
          />

          <Input
            id="status"
            name="status"
            type="select"
            placeholder="All Statuses"
            value={filters.status}
            onChange={handleFilterChange}
            options={statusOptions}
            className="filter-select-input"
          />

          {user?.role === 'manager' && (
            <Input
              id="storeLocation"
              name="storeLocation"
              type="select"
              placeholder="All Locations"
              value={filters.storeLocation}
              onChange={handleFilterChange}
              options={storeOptions}
              className="filter-select-input"
            />
          )}
        </div>
      </Card>

      {/* Incident List Log */}
      <Card title="Incident Logs" className="logs-card">
        {loading ? (
          <div className="table-loading-spinner-box">
            <span className="spinner-loader"></span>
            <p>Loading operational database logs...</p>
          </div>
        ) : incidents.length === 0 ? (
          <div className="table-empty-box">
            <ShieldAlertIcon />
            <h3>No incidents found</h3>
            <p>
              {(filters.category || filters.severity || filters.status || filters.storeLocation || filters.search)
                ? 'Try adjusting your filters or search terms to find matching records.'
                : 'All systems operational. No active incidents registered!'}
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="incident-table">
              <thead>
                <tr>
                  <th>Incident Details</th>
                  <th>Location</th>
                  <th>Category</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Reported Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((inc) => {
                  const isPinnedCritical = inc.severity === 'Critical' && inc.status !== 'Resolved' && inc.status !== 'Closed';
                  return (
                    <tr 
                      key={inc._id} 
                      className={`table-row-severity-${inc.severity.toLowerCase()} ${isPinnedCritical ? 'table-row-pinned-critical' : ''}`}
                    >
                      <td>
                        <div className="table-cell-title-block">
                          <div className="table-title-inline-row">
                            {isPinnedCritical && (
                              <span className="pinned-badge" title="Active critical incident pinned to top">
                                📌 PINNED
                              </span>
                            )}
                            <span className="table-incident-title">{inc.title}</span>
                          </div>
                          <p className="table-incident-desc-preview">
                            {inc.description.slice(0, 75)}
                            {inc.description.length > 75 ? '...' : ''}
                          </p>
                        </div>
                      </td>
                    <td>
                      <div className="table-cell-location">
                        <Store size={14} className="cell-icon" />
                        <span>{inc.storeLocation}</span>
                      </div>
                    </td>
                    <td>
                      <span className="table-category-label">{inc.category}</span>
                    </td>
                    <td>
                      <Badge value={inc.severity} type="severity" />
                    </td>
                    <td>
                      <Badge value={inc.status} type="status" />
                    </td>
                    <td>
                      <span className="table-date">{formatDate(inc.dateTime)}</span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleInspectClick(inc._id)}
                        className="btn-table-inspect"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Inspect Detail Modal (Drawer) */}
      {selectedIncident && (
        <div className="modal-backdrop" onClick={handleCloseModal}>
          <div className="modal-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="modal-drawer-header">
              <div className="modal-drawer-title-block">
                <Badge value={selectedIncident.severity} type="severity" />
                <Badge value={selectedIncident.status} type="status" />
              </div>
              <button
                onClick={handleCloseModal}
                className="btn-modal-close"
                aria-label="Close details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-drawer-body">
              <h2 className="modal-incident-title">{selectedIncident.title}</h2>
              
              <div className="modal-detail-badges-row">
                <div className="modal-badge-info">
                  <Store size={14} />
                  <span>{selectedIncident.storeLocation}</span>
                </div>
                <div className="modal-badge-info">
                  <ClipboardList size={14} />
                  <span>{selectedIncident.category}</span>
                </div>
                <div className="modal-badge-info">
                  <Calendar size={14} />
                  <span>{formatDate(selectedIncident.dateTime)}</span>
                </div>
              </div>

              <div className="modal-section-divider"></div>

              {/* Description */}
              <div className="modal-detail-section">
                <h4 className="modal-section-title">Incident Description</h4>
                <p className="modal-incident-description-text">{selectedIncident.description}</p>
              </div>

              {/* Photo Evidence */}
              {(() => {
                const images = getIncidentImages(selectedIncident.image);
                if (images.length === 0) return null;
                return (
                  <div className="modal-detail-section">
                    <h4 className="modal-section-title">Photo Evidence ({images.length})</h4>
                    {images.length === 1 ? (
                      <div className="modal-incident-image-container">
                        <a href={images[0]} target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: '100%', height: '100%' }}>
                          <img 
                            src={images[0]} 
                            alt="Incident attachment" 
                            className="modal-incident-image" 
                          />
                        </a>
                      </div>
                    ) : (
                      <div className="image-previews-grid" style={{ marginTop: '0.5rem' }}>
                        {images.map((img, idx) => (
                          <div key={idx} className="image-preview-wrapper" style={{ maxWidth: '100%', cursor: 'pointer' }}>
                            <a href={img} target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: '100%', height: '100%' }}>
                              <img 
                                src={img} 
                                alt={`Incident attachment ${idx + 1}`} 
                                className="image-preview-img" 
                              />
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Reporter details */}
              {selectedIncident.reporter && (
                <div className="modal-detail-section modal-reporter-box">
                  <User size={16} className="reporter-icon" />
                  <div className="reporter-details">
                    <span className="reporter-label">Reported By</span>
                    <span className="reporter-name">
                      {selectedIncident.reporter.name} ({selectedIncident.reporter.role})
                    </span>
                    <span className="reporter-email">{selectedIncident.reporter.email}</span>
                  </div>
                </div>
              )}

              {/* <div className="modal-section-divider"></div> */}

              {/* AI-Generated Resolution Guide */}
              {selectedIncident.status !== 'Resolved' && (
                <details 
                  className="modal-detail-section modal-ai-solution-box" 
                  open={!!selectedIncident.aiSolution}
                >
                  <summary className="ai-solution-summary">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="ai-summary-arrow-wrapper">
                          <svg xmlns="http://www.w3.org/2000/svg" className="ai-summary-arrow-svg" height="20px" viewBox="0 -960 960 960" width="20px">
                            <path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z" fill="currentColor"/>
                          </svg>
                        </span>
                        <Sparkles size={16} className="ai-sparkles-icon" />
                        <h4 className="modal-section-title" style={{ margin: 0, color: 'var(--text-main)', textTransform: 'none', letterSpacing: 'normal' }}>
                          AI Resolution Guide
                        </h4>
                      </div>
                      {selectedIncident.aiSolution && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleGenerateAiSolution();
                          }}
                          className="btn-ai-regenerate-heading"
                          disabled={aiLoading}
                        >
                          <Sparkles size={12} />
                          <span>Regenerate</span>
                        </button>
                      )}
                    </div>
                  </summary>
                  
                  <div className="ai-solution-details-content">
                    {aiLoading ? (
                      <div className="ai-solution-loading animate-pulse">
                        <span className="spinner-loader-small"></span>
                        <p style={{ margin: '0.5rem 0 0 0', fontWeight: '500', color: 'var(--primary-color)' }}>
                          Gemini AI is compiling operations resolutions...
                        </p>
                      </div>
                    ) : selectedIncident.aiSolution ? (
                      <div className="ai-solution-content-text animate-fade-in">
                        {selectedIncident.aiSolution.split('\n').map((line, idx) => {
                          const trimmedLine = line.trim();
                          const isHeader = 
                            line.includes('###') || 
                            trimmedLine.startsWith('#') || 
                            line.toLowerCase().includes('incident resolution plan') ||
                            /^\d+\.\s+/.test(trimmedLine) || 
                            line.toLowerCase().includes('immediate action') ||
                            line.toLowerCase().includes('prevention') ||
                            line.toLowerCase().includes('root cause');
                            
                          const cleaned = line.replace(/[#*]/g, '').trim();
                          if (!cleaned && !line.trim()) return <div key={idx} style={{ height: '0.5rem' }}></div>;
                          if (isHeader) {
                            return (
                              <p 
                                key={idx} 
                                className="ai-solution-line" 
                                style={{ fontWeight: 700, color: 'var(--text-main)', marginTop: '0.75rem', fontSize: '0.9rem' }}
                              >
                                {cleaned}
                              </p>
                            );
                          }
                          return <p key={idx} className="ai-solution-line">{cleaned}</p>;
                        })}
                      </div>
                    ) : (
                      <div className="ai-solution-empty-state">
                        <p>No operational solution generated yet. Click below to analyze with Gemini AI.</p>
                        <button
                          type="button"
                          onClick={handleGenerateAiSolution}
                          className="btn btn-primary btn-ai-generate"
                        >
                          <Sparkles size={14} />
                          <span>Generate Solution</span>
                        </button>
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="modal-section-divider"></div>

              {/* Resolution Info (if exists) */}
              {selectedIncident.resolvedAt && (
                <div className="modal-detail-section modal-resolved-box">
                  <CheckCircle size={16} className="resolved-icon" />
                  <div className="reporter-details">
                    <span className="resolved-label">Resolved On</span>
                    <span className="resolved-date">{formatDate(selectedIncident.resolvedAt)}</span>
                    {selectedIncident.resolvedBy && (
                      <span className="resolved-by">
                        By: {selectedIncident.resolvedBy.name} ({selectedIncident.resolvedBy.email})
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Resolution Actions Taken (Read only for staff) */}
              {selectedIncident.resolutionActions && selectedIncident.resolutionActions.length > 0 && (
                <div className="modal-detail-section">
                  <h4 className="modal-section-title">Resolution Actions Taken</h4>
                  <div className="resolution-actions-read-container">
                    {selectedIncident.resolutionActions.map((action) => (
                      <span key={action} className="resolution-action-tag-read">
                        {action}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Existing Manager Resolution Notes (Read only for staff) */}
              {selectedIncident.managerNotes && (
                <div className="modal-detail-section">
                  <h4 className="modal-section-title">Manager Resolution Notes</h4>
                  <div className="manager-notes-read-box">
                    <p>{selectedIncident.managerNotes}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Sticky bottom footer for Manager Actions / Staff Info */}
            <div className="modal-drawer-footer">
              {user?.role === 'manager' ? (
                <div className="manager-sticky-actions-row">
                  <button
                    type="button"
                    className="btn-sticky-action btn-status-delete"
                    onClick={() => handleDeleteIncident(selectedIncident._id)}
                    disabled={modalLoading}
                  >
                    <Trash2 size={16} />
                    <span>Remove</span>
                  </button>
                  {selectedIncident.status === 'Resolved' ? (
                    <button
                      type="button"
                      className="btn-sticky-action btn-status-ongoing active"
                      onClick={() => handleQuickStatusUpdate('Open')}
                      disabled={modalLoading}
                    >
                      <Clock size={16} />
                      <span>Reopen Incident</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn-sticky-action btn-status-solved"
                      onClick={() => handleQuickStatusUpdate('Resolved')}
                      disabled={modalLoading}
                    >
                      <CheckCircle size={16} />
                      <span>Solved</span>
                    </button>
                  )}
                  
                  
                </div>
              ) : (
                <div className="staff-view-only-alert" style={{ margin: 0 }}>
                  <AlertCircle size={14} />
                  <span>This incident report is locked. Only managers can update incident status or remove this report.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manager Register New User Modal (Drawer) */}
      {showAddUserModal && (
        <div className="modal-backdrop" onClick={() => setShowAddUserModal(false)}>
          <div className="modal-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="modal-drawer-header">
              <div className="modal-drawer-title-block">
                <span className="badge-pill badge-gray" style={{ color: 'var(--primary-color)', backgroundColor: 'var(--primary-light)', fontWeight: 700 }}>
                  MANAGER COMMAND
                </span>
              </div>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="btn-modal-close"
                aria-label="Close panel"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddUserSubmit} className="modal-drawer-body" style={{ gap: '20px' }}>
              <div>
                <h2 className="modal-incident-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.35rem' }}>
                  <UserPlus size={22} style={{ color: 'var(--primary-color)' }} />
                  <span>Register Operations User</span>
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Add a secure credential profile to manage or report incident logs.
                </p>
              </div>

              <div className="modal-section-divider"></div>

              {addUserError && (
                <div className="auth-submit-error-banner animate-fade-in" style={{ margin: 0 }}>
                  <AlertCircle size={16} className="auth-error-banner-icon" />
                  <span>{addUserError}</span>
                </div>
              )}

              <Input
                label="Full Name"
                id="add-name"
                name="name"
                type="text"
                placeholder="e.g. John Doe"
                value={addUserForm.name}
                onChange={handleAddUserChange}
                required
                disabled={addUserLoading}
                aria-label="Full Name"
              />

              <Input
                label="Email Address"
                id="add-email"
                name="email"
                type="email"
                placeholder="e.g. johndoe@restaurant.com"
                value={addUserForm.email}
                onChange={handleAddUserChange}
                required
                disabled={addUserLoading}
                aria-label="Email Address"
              />

              <Input
                label="Initial Password"
                id="add-password"
                name="password"
                type="password"
                placeholder="Min. 6 characters"
                value={addUserForm.password}
                onChange={handleAddUserChange}
                required
                disabled={addUserLoading}
                aria-label="Initial Password"
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Input
                  label="System Role"
                  id="add-role"
                  name="role"
                  type="select"
                  value={addUserForm.role}
                  onChange={handleAddUserChange}
                  options={[
                    { value: 'staff', label: 'Store Staff' },
                    { value: 'manager', label: 'Store Manager' }
                  ]}
                  required
                  disabled={addUserLoading}
                  aria-label="System Role"
                />

                <Input
                  label="Location"
                  id="add-location"
                  name="storeLocation"
                  type="select"
                  placeholder="-- Location --"
                  value={addUserForm.storeLocation}
                  onChange={handleAddUserChange}
                  options={storeOptions}
                  required
                  disabled={addUserLoading}
                  aria-label="Store Location"
                />
              </div>

              <div className="modal-section-divider" style={{ marginTop: 'auto' }}></div>

              <div style={{ display: 'flex', gap: '12px', width: '100%', paddingBottom: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1, height: '2.8rem', justifyContent: 'center' }}
                  disabled={addUserLoading}
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={addUserLoading}
                  style={{ flex: 1, height: '2.8rem' }}
                >
                  Create User
                </Button>
              </div>
            </form>
          </div>
        </div>
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


// SVG Subcomponents to keep code clean and dependency-free
const ShieldAlertIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="48"
    height="48"
    viewBox="0 0 24 24"
    fill="none"
    stroke="var(--danger-color)"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="empty-shield-icon"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

export default Dashboard;
