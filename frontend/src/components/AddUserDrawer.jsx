import React from 'react';
import { X, UserPlus, AlertCircle } from 'lucide-react';
import Input from './Input';
import Button from './Button';

const AddUserDrawer = ({
  isOpen,
  onClose,
  onSubmit,
  loading,
  error,
  formState,
  onChange,
  storeOptions = []
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="modal-drawer-header">
          <div className="modal-drawer-title-block">
            <span 
              className="badge-pill badge-gray" 
              style={{ color: 'var(--primary-color)', backgroundColor: 'var(--primary-light)', fontWeight: 700 }}
            >
              MANAGER COMMAND
            </span>
          </div>
          <button
            onClick={onClose}
            className="btn-modal-close"
            aria-label="Close panel"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="modal-drawer-body" style={{ gap: '20px' }}>
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

          {error && (
            <div className="auth-submit-error-banner animate-fade-in" style={{ margin: 0 }}>
              <AlertCircle size={16} className="auth-error-banner-icon" />
              <span>{error}</span>
            </div>
          )}

          <Input
            label="Full Name"
            id="add-name"
            name="name"
            type="text"
            placeholder="e.g. John Doe"
            value={formState.name}
            onChange={onChange}
            required
            disabled={loading}
            aria-label="Full Name"
          />

          <Input
            label="Email Address"
            id="add-email"
            name="email"
            type="email"
            placeholder="e.g. johndoe@restaurant.com"
            value={formState.email}
            onChange={onChange}
            required
            disabled={loading}
            aria-label="Email Address"
          />

          <Input
            label="Initial Password"
            id="add-password"
            name="password"
            type="password"
            placeholder="Min. 6 characters"
            value={formState.password}
            onChange={onChange}
            required
            disabled={loading}
            aria-label="Initial Password"
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input
              label="System Role"
              id="add-role"
              name="role"
              type="select"
              value={formState.role}
              onChange={onChange}
              options={[
                { value: 'staff', label: 'Store Staff' },
                { value: 'manager', label: 'Store Manager' }
              ]}
              required
              disabled={loading}
              aria-label="System Role"
            />

            <Input
              label="Location"
              id="add-location"
              name="storeLocation"
              type="select"
              placeholder="-- Location --"
              value={formState.storeLocation}
              onChange={onChange}
              options={storeOptions}
              required
              disabled={loading}
              aria-label="Store Location"
            />
          </div>

          <div className="modal-section-divider" style={{ marginTop: 'auto' }}></div>

          <div style={{ display: 'flex', gap: '12px', width: '100%', paddingBottom: '1rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ flex: 1, height: '2.8rem', justifyContent: 'center' }}
              disabled={loading}
            >
              Cancel
            </button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              style={{ flex: 1, height: '2.8rem' }}
            >
              Create User
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserDrawer;
