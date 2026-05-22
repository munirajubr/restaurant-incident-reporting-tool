import React from 'react';

const Badge = ({ value, type = 'status' }) => {
  const getBadgeClass = () => {
    const val = value ? value.toLowerCase().replace(' ', '-') : '';
    
    if (type === 'severity') {
      switch (val) {
        case 'low':
          return 'badge-severity-low';
        case 'medium':
          return 'badge-severity-medium';
        case 'high':
          return 'badge-severity-high';
        case 'critical':
          return 'badge-severity-critical';
        default:
          return 'badge-gray';
      }
    } else {
      // Default: Status
      switch (val) {
        case 'open':
          return 'badge-status-open';
        case 'in-progress':
          return 'badge-status-progress';
        case 'resolved':
          return 'badge-status-resolved';
        case 'closed':
          return 'badge-status-closed';
        default:
          return 'badge-gray';
      }
    }
  };

  return (
    <span className={`badge-pill ${getBadgeClass()}`}>
      {value}
    </span>
  );
};

export default Badge;
