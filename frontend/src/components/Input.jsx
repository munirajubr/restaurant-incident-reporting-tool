import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const Input = ({
  label = '',
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  error = '',
  required = false,
  options = [], // Used for 'select' type
  rows = 4, // Used for 'textarea' type
  disabled = false,
  className = '',
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const inputClass = `input-field ${error ? 'input-field-error' : ''} ${className}`;

  // Close custom dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectClick = () => {
    if (!disabled) setIsOpen(!isOpen);
  };

  const handleOptionSelect = (optValue) => {
    // Create custom mock event to adapt to parent form states
    const mockEvent = {
      target: {
        name,
        value: optValue
      }
    };
    onChange(mockEvent);
    setIsOpen(false);
  };

  // Find currently selected option
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="input-group">
      {label && (
        <label htmlFor={id} className="input-label">
          {label} {required && <span className="input-required-star">*</span>}
        </label>
      )}

      {type === 'textarea' ? (
        <textarea
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          className={inputClass}
          required={required}
          {...props}
        />
      ) : type === 'select' ? (
        <div className="custom-select-container" ref={containerRef} style={{ position: 'relative', width: '100%' }}>
          <button
            type="button"
            id={id}
            onClick={handleSelectClick}
            disabled={disabled}
            className={`input-field custom-select-trigger ${error ? 'input-field-error' : ''} ${className}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: disabled ? 'not-allowed' : 'pointer',
              textAlign: 'left',
              backgroundColor: '#ffffff',
              userSelect: 'none'
            }}
          >
            <span
              style={{
                color: selectedOption ? 'var(--text-main)' : '#94a3b8',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                paddingRight: '1rem',
                fontWeight: selectedOption ? '500' : '400'
              }}
            >
              {selectedOption ? selectedOption.label : (placeholder || '-- Select --')}
            </span>
            <ChevronDown
              size={16}
              style={{
                color: 'var(--text-muted)',
                transform: isOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s ease',
                flexShrink: 0
              }}
            />
          </button>

          {isOpen && (
            <div
              className="custom-select-dropdown"
              style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: 0,
                width: '100%',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: 'var(--radius-md)',
                zIndex: 1000,
                maxHeight: '220px',
                overflowY: 'auto',
                padding: '4px'
              }}
            >
              {options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleOptionSelect(opt.value)}
                    className={`custom-select-option ${isSelected ? 'selected' : ''}`}
                    style={{
                      padding: '0.7rem 1rem',
                      fontSize: '0.9rem',
                      fontWeight: isSelected ? '600' : '500',
                      color: isSelected ? 'var(--primary-color)' : 'var(--text-main)',
                      backgroundColor: isSelected ? 'var(--primary-light)' : 'transparent',
                      borderRadius: 'calc(var(--radius-md) - 4px)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'var(--transition-smooth)'
                    }}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check size={14} style={{ color: 'var(--primary-color)' }} />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={inputClass}
          required={required}
          {...props}
        />
      )}

      {error && <span className="input-error-msg">{error}</span>}
    </div>
  );
};

export default Input;
