import React from 'react';
import {
  X,
  Store,
  ClipboardList,
  Calendar,
  User,
  Sparkles,
  CheckCircle,
  Clock,
  Trash2,
  AlertCircle,
  Lightbulb,
  Save
} from 'lucide-react';
import Badge from './Badge';

// Helper utilities local to the component for clean self-containment
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const getIncidentImages = (imgField) => {
  if (!imgField) return [];
  const trimmed = imgField.trim();
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      console.error('Failed to parse incident images JSON:', e);
    }
  }
  return [imgField];
};

const IncidentInspectDrawer = ({
  isOpen,
  onClose,
  incident,
  user,
  aiLoading,
  modalLoading,
  onGenerateAiSolution,
  inspectNotes,
  setInspectNotes,
  inspectActions,
  setInspectActions,
  customActionText,
  setCustomActionText,
  handleSaveResolution,
  handleDeleteIncident,
  handleQuickStatusUpdate
}) => {
  const [isEditingSuggestion, setIsEditingSuggestion] = React.useState(false);

  React.useEffect(() => {
    setIsEditingSuggestion(false);
  }, [incident?._id]);

  const handleLocalSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    await handleSaveResolution();
    setIsEditingSuggestion(false);
  };

  const handleLocalCancel = () => {
    setInspectNotes(incident.managerNotes || '');
    setInspectActions(incident.resolutionActions || []);
    setIsEditingSuggestion(false);
  };

  if (!isOpen || !incident) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="modal-drawer-header">
          <div className="modal-drawer-title-block">
            <Badge value={incident.severity} type="severity" />
            <Badge value={incident.status} type="status" />
          </div>
          <button
            onClick={onClose}
            className="btn-modal-close"
            aria-label="Close details"
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-drawer-body">
          <h2 className="incident-title">{incident.title}</h2>
          
          <div className="modal-detail-badges-row">
            <div className="modal-badge-info">
              <Store size={14} />
              <span>{incident.storeLocation}</span>
            </div>
            <div className="modal-badge-info">
              <ClipboardList size={14} />
              <span>{incident.category}</span>
            </div>
            <div className="modal-badge-info">
              <Calendar size={14} />
              <span>{formatDate(incident.dateTime)}</span>
            </div>
          </div>

          <div className="modal-section-divider"></div>

          {/* Description */}
          <div className="modal-detail-section">
            <h4 className="section-title">Incident Description</h4>
            <p className="modal-incident-description-text">{incident.description}</p>
          </div>

          {/* Photo Evidence */}
          {(() => {
            const images = getIncidentImages(incident.image);
            if (images.length === 0) return null;
            return (
              <div className="modal-detail-section">
                <h4 className="section-title">Photo Evidence ({images.length})</h4>
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
          {incident.reporter && (
            <div className="modal-detail-section modal-reporter-box">
              <User size={16} className="reporter-icon" />
              <div className="reporter-details">
                <span className="reporter-label">Reported By</span>
                <span className="reporter-name">
                  {incident.reporter.name} ({incident.reporter.role})
                </span>
                <span className="reporter-email">{incident.reporter.email}</span>
              </div>
            </div>
          )}

          {/* AI-Generated Resolution Guide */}
          {incident.status !== 'Resolved' && (
            <details 
              className="modal-detail-section modal-ai-solution-box"
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
                    <h4 className="section-title" style={{ margin: 0, color: 'var(--text-main)', textTransform: 'none', letterSpacing: 'normal' }}>
                      AI Resolution Guide
                    </h4>
                  </div>
                  {incident.aiSolution && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onGenerateAiSolution();
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
                ) : incident.aiSolution ? (
                  <div className="ai-solution-content-text animate-fade-in">
                    {incident.aiSolution.split('\n').map((line, idx) => {
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
                      onClick={onGenerateAiSolution}
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

          {/* <div className="modal-section-divider"></div> */}

          {/* Resolution Info (if exists) */}
          {incident.resolvedAt && (
            <div className="modal-detail-section modal-resolved-box">
              <CheckCircle size={16} className="resolved-icon" />
              <div className="reporter-details">
                <span className="section-title">Resolved On</span>
                <span className="resolved-date">{formatDate(incident.resolvedAt)}</span>
                {incident.resolvedBy && (
                  <span className="resolved-by">
                    By: {incident.resolvedBy.name} ({incident.resolvedBy.email})
                  </span>
                )}
              </div>
            </div>
          )}

          {/* <div className="modal-section-divider"></div> */}

          {/* Manager suggestions & experience section (editable for Managers, quote for Staff) */}
          {user?.role === 'manager' ? (
            <div className="modal-detail-section manager-suggestion-box">
              <div className="manager-suggestion-header" style={{ justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <Lightbulb size={18} className="suggestion-bulb-icon animate-pulse" />
                  <div className="manager-suggestion-title-block">
                    <h4 className="section-title">Manager's Perspective & Advice</h4>
                  </div>
                </div>
                {!isEditingSuggestion && (
                  <button
                    type="button"
                    onClick={() => setIsEditingSuggestion(true)}
                    className="btn-edit-suggestion-trigger"
                  >
                    {incident.managerNotes || (incident.resolutionActions && incident.resolutionActions.length > 0)
                      ? 'Edit Suggestion'
                      : 'Add Suggestion'}
                  </button>
                )}
              </div>

              {isEditingSuggestion ? (
                <div className="manager-suggestion-body animate-fade-in" style={{ marginTop: '0.5rem' }}>
                  <label className="suggestion-label" htmlFor="manager-suggestion-text">
                    Operations Advice / Notes from Experience
                  </label>
                  <textarea
                    id="manager-suggestion-text"
                    className="manager-suggestion-textarea"
                    placeholder="e.g., Based on my experience with POS lags, standard protocol is to hard reset the main station and warn downtown support. Always keep order logs on paper to save wait times..."
                    value={inspectNotes}
                    onChange={(e) => setInspectNotes(e.target.value)}
                  />

                  {/* Resolution Actions tagging */}
                  <div style={{ marginTop: '1.25rem' }}>
                    <label className="suggestion-label">Resolution Actions Taken</label>
                    <div className="manager-preset-tags">
                      {[
                        'Staff Retrained',
                        'Equipment Serviced',
                        'POS Rebooted',
                        'Customer Compensated',
                        'Safety Audit Conducted',
                        'Inventory Restocked',
                        'Vendor Contacted'
                      ].map((action) => {
                        const isActive = inspectActions.includes(action);
                        return (
                          <button
                            key={action}
                            type="button"
                            onClick={() => {
                              if (isActive) {
                                setInspectActions(inspectActions.filter(a => a !== action));
                              } else {
                                setInspectActions([...inspectActions, action]);
                              }
                            }}
                            className={`manager-tag-pill ${isActive ? 'active' : ''}`}
                          >
                            {action}
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom tag input */}
                    <div className="manager-custom-action-row" style={{ marginTop: '0.75rem' }}>
                      <input
                        type="text"
                        className="manager-custom-action-input"
                        placeholder="Add custom action tag"
                        value={customActionText}
                        onChange={(e) => setCustomActionText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (customActionText.trim() && !inspectActions.includes(customActionText.trim())) {
                              setInspectActions([...inspectActions, customActionText.trim()]);
                              setCustomActionText('');
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="btn-custom-action-add"
                        onClick={() => {
                          if (customActionText.trim() && !inspectActions.includes(customActionText.trim())) {
                            setInspectActions([...inspectActions, customActionText.trim()]);
                            setCustomActionText('');
                          }
                        }}
                      >
                        Add
                      </button>
                    </div>

                    {/* Currently selected actions tags list */}
                    {inspectActions.length > 0 && (
                      <div className="manager-selected-actions-list" style={{ marginTop: '0.75rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Tags:</span>
                        <div className="resolution-actions-read-container" style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '6px', marginLeft: '8px' }}>
                          {inspectActions.map((action) => (
                            <span key={action} className="resolution-action-tag-read active-removable" onClick={() => setInspectActions(inspectActions.filter(a => a !== action))}>
                              {action} &times;
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '1.25rem' }}>
                    <button
                      type="button"
                      className="btn-save-manager-suggestion animate-scale-up"
                      onClick={handleLocalSave}
                      disabled={modalLoading}
                      style={{ marginTop: 0 }}
                    >
                      <Save size={14} />
                      <span>Save Advice & Actions</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleLocalCancel}
                      disabled={modalLoading}
                      style={{ padding: '0 1rem', height: '2.25rem', fontSize: '0.8rem', fontWeight: 600, borderRadius: '8px' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* Read only suggestion presentation inside the manager box */
                (incident.managerNotes || (incident.resolutionActions && incident.resolutionActions.length > 0)) ? (
                  <div className="staff-suggestion-box" style={{ marginTop: '0.75rem', backgroundColor: 'rgba(0,0,0,0.01)', border: '1px solid rgba(0,0,0,0.04)', borderRadius: '8px' }}>
                    {incident.managerNotes && (
                      <div className="staff-suggestion-blockquote-container">
                        <blockquote className="staff-suggestion-blockquote">
                          <p>"{incident.managerNotes}"</p>
                          <cite className="staff-suggestion-cite">
                            — {incident.managerName || 'Store Manager'}{incident.managerStore ? ` (${incident.managerStore})` : ''}
                          </cite>
                        </blockquote>
                      </div>
                    )}

                    {incident.resolutionActions && incident.resolutionActions.length > 0 && (
                      <div style={{ marginTop: incident.managerNotes ? '1rem' : '0' }}>
                        <h4 className="modal-section-title" style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }}>Resolution Actions Applied</h4>
                        <div className="resolution-actions-read-container">
                          {incident.resolutionActions.map((action) => (
                            <span key={action} className="resolution-action-tag-read">
                              {action}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="staff-suggestion-box-empty" style={{ marginTop: '0.75rem' }}>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center' }}>
                      No suggestions have been logged for this incident yet. Click "Add Suggestion" above to document your experience.
                    </p>
                  </div>
                )
              )}
            </div>
          ) : (
            // Staff / view-only presentation
            (incident.managerNotes || (incident.resolutionActions && incident.resolutionActions.length > 0)) ? (
              <div className="modal-detail-section staff-suggestion-box">
                {incident.managerNotes && (
                  <div className="staff-suggestion-blockquote-container">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <Lightbulb size={16} style={{ color: 'var(--primary-color)' }} />
                      <h4 className="staff-suggestion-title" style={{ margin: 0 }}>Manager's Advice & Suggestions</h4>
                    </div>
                    <blockquote className="staff-suggestion-blockquote">
                      <p>"{incident.managerNotes}"</p>
                      <cite className="staff-suggestion-cite">
                        — Operational Advice by {incident.managerName || 'Store Manager'}{incident.managerStore ? ` (${incident.managerStore})` : ''}
                      </cite>
                    </blockquote>
                  </div>
                )}

                {incident.resolutionActions && incident.resolutionActions.length > 0 && (
                  <div style={{ marginTop: incident.managerNotes ? '1.25rem' : '0' }}>
                    <h4 className="modal-section-title" style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }}>Resolution Actions Applied</h4>
                    <div className="resolution-actions-read-container">
                      {incident.resolutionActions.map((action) => (
                        <span key={action} className="resolution-action-tag-read">
                          {action}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="modal-detail-section staff-suggestion-box-empty">
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center' }}>
                  No manager suggestions or resolution actions have been logged for this incident yet.
                </p>
              </div>
            )
          )}
        </div>

        {/* Sticky bottom footer for Manager Actions / Staff Info */}
        <div className="modal-drawer-footer">
          {user?.role === 'manager' ? (
            <div className="manager-sticky-actions-row">
              <button
                type="button"
                className="btn-sticky-action btn-status-delete"
                onClick={() => handleDeleteIncident(incident._id)}
                disabled={modalLoading}
              >
                <Trash2 size={16} />
                <span>Remove</span>
              </button>
              {incident.status === 'Resolved' ? (
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
  );
};

export default IncidentInspectDrawer;
