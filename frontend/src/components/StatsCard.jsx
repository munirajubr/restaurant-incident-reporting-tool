import React from 'react';

const StatsCard = ({
  title,
  value,
  icon = null,
  trend = '',
  trendType = 'neutral', // 'positive' | 'negative' | 'neutral'
  variant = 'primary',
  className = '',
}) => {
  const getTrendClass = () => {
    switch (trendType) {
      case 'positive':
        return 'stats-trend-up';
      case 'negative':
        return 'stats-trend-down';
      default:
        return 'stats-trend-neutral';
    }
  };

  return (
    <div className={`stats-card stats-card-${variant} ${className}`}>
      <div className="stats-card-main">
        <div className="stats-card-content">
          <p className="stats-card-title">{title}</p>
          <h2 className="stats-card-value">{value}</h2>
        </div>
        {icon && (
          <div className={`stats-card-icon-container stats-icon-${variant}`}>
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className="stats-card-footer">
          <span className={`stats-trend ${getTrendClass()}`}>{trend}</span>
        </div>
      )}
    </div>
  );
};

export default StatsCard;
