import React from 'react';

const Card = ({
  children,
  title = '',
  subtitle = '',
  action = null,
  className = '',
  hoverable = false,
  onClick = null,
}) => {
  const isClickable = !!onClick;
  
  return (
    <div
      onClick={onClick}
      className={`card ${hoverable ? 'card-hoverable' : ''} ${isClickable ? 'card-clickable' : ''} ${className}`}
    >
      {(title || subtitle || action) && (
        <div className="card-header">
          <div className="card-header-titles">
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          {action && <div className="card-header-action">{action}</div>}
        </div>
      )}
      <div className="card-body">
        {children}
      </div>
    </div>
  );
};

export default Card;
