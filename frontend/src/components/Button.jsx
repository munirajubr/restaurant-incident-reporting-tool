import React from 'react';

const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  loading = false,
  disabled = false,
  icon = null,
  className = '',
  ...props
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`btn btn-${variant} ${loading ? 'btn-loading' : ''} ${className}`}
      {...props}
    >
      {loading && (
        <span className="btn-spinner"></span>
      )}
      {!loading && icon && (
        <span className="btn-icon">{icon}</span>
      )}
      <span className="btn-content">{children}</span>
    </button>
  );
};

export default Button;
