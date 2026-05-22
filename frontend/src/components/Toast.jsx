import React, { useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';

const Toast = ({
  message,
  type = 'info',
  onClose,
  duration = 4000
}) => {
  useEffect(() => {
    if (duration > 0 && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} className="toast-icon-svg" />;
      case 'error':
        return <AlertCircle size={20} className="toast-icon-svg" />;
      case 'warning':
        return <AlertTriangle size={20} className="toast-icon-svg" />;
      default:
        return <Info size={20} className="toast-icon-svg" />;
    }
  };

  if (!message) return null;

  return (
    <div className={`toast toast-${type}`}>
      <div className="toast-content">
        {getIcon()}
        <span className="toast-message">{message}</span>
      </div>
      {onClose && (
        <button onClick={onClose} className="toast-close-btn" aria-label="Close notification">
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default Toast;
