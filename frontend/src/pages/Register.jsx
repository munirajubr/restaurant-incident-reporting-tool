import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, AlertCircle } from 'lucide-react';
import Input from '../components/Input';
import Button from '../components/Button';
import Toast from '../components/Toast';

const Register = () => {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    storeLocation: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info' });

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear validation and submit errors when typing
    setErrors((prev) => ({ ...prev, [name]: '', submit: '' }));
  };

  const validate = () => {
    const tempErrors = {};
    if (!formData.name.trim()) {
      tempErrors.name = 'Full name is required';
    }
    if (!formData.email) {
      tempErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = 'Please provide a valid email';
    }
    if (!formData.password) {
      tempErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      tempErrors.password = 'Password must be at least 6 characters';
    }
    if (!formData.storeLocation) {
      tempErrors.storeLocation = 'Please select your store location';
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const result = await register(formData);
    setLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setErrors({ submit: result.error || 'Failed to create account. Email may be in use.' });
      setToast({
        message: result.error || 'Failed to create account. Email may be in use.',
        type: 'error',
      });
    }
  };

  const storeOptions = [
    { value: 'Downtown Plaza', label: 'Downtown Plaza (Store #101)' },
    { value: 'Uptown Outlet', label: 'Uptown Outlet (Store #102)' },
    { value: 'West End Bistro', label: 'West End Bistro (Store #103)' },
    { value: 'Airport Food Court', label: 'Airport Food Court (Store #104)' },
    { value: 'Metro Station Kiosk', label: 'Metro Station Kiosk (Store #105)' },
  ];

  const roleOptions = [
    { value: 'staff', label: 'Store Staff (Report incidents)' },
    { value: 'manager', label: 'Store Manager (Review & resolve)' },
  ];

  return (
    <div className="auth-page-container">
      <div className="auth-split-wrapper">
        
        {/* Left Panel: Clean form layout */}
        <div className="auth-left-panel">
          <div className="auth-form-header">
            <div className="auth-brand-logo">
              <Shield size={24} className="auth-brand-logo-icon" />
              <span className="auth-brand-logo-text">IncidentHub</span>
            </div>
          </div>

          <div className="auth-form-content">
            <h1 className="auth-welcome-title">Create Account</h1>
            <p className="auth-welcome-subtitle">Register to begin reporting restaurant incidents</p>

            <form onSubmit={handleSubmit} className="auth-form-split">
              {errors.submit && (
                <div className="auth-submit-error-banner animate-fade-in">
                  <AlertCircle size={16} className="auth-error-banner-icon" />
                  <span>{errors.submit}</span>
                </div>
              )}
              <Input
                label="Full Name"
                id="name"
                name="name"
                type="text"
                placeholder="e.g. John Doe"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
                required
                disabled={loading}
                aria-label="Full Name"
              />

              <Input
                label="Email Address"
                id="email"
                name="email"
                type="email"
                placeholder="e.g. johndoe@restaurant.com"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                required
                disabled={loading}
                aria-label="Email Address"
              />

              <Input
                label="Password"
                id="password"
                name="password"
                type="password"
                placeholder="Min. 6 characters"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                required
                disabled={loading}
                aria-label="Password"
              />

              <div className="auth-form-grid-2">
                <Input
                  label="Designation / Role"
                  id="role"
                  name="role"
                  type="select"
                  value={formData.role}
                  onChange={handleChange}
                  options={roleOptions}
                  required
                  disabled={loading}
                  aria-label="Designation Role"
                />

                <Input
                  label="Store Location"
                  id="storeLocation"
                  name="storeLocation"
                  type="select"
                  placeholder="-- Choose Location --"
                  value={formData.storeLocation}
                  onChange={handleChange}
                  options={storeOptions}
                  error={errors.storeLocation}
                  required
                  disabled={loading}
                  aria-label="Store Location"
                />
              </div>

              <div className="auth-buttons-row">
                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                  className="btn-auth-action"
                >
                  Sign Up
                </Button>
                
                <Link to="/login" className="btn btn-secondary btn-auth-secondary">
                  Sign In
                </Link>
              </div>
            </form>
          </div>

          <div className="auth-form-footer">
            <p>© 2026 IncidentHub Operations. All rights reserved.</p>
          </div>
        </div>

        {/* Center Decorative Orange Circle Divider (matching the reference image) */}
        <div className="auth-divider-circle">
          <span className="auth-divider-arrow">→</span>
        </div>

        {/* Right Panel: Stunning Hero culinary graphic */}
        <div className="auth-right-panel" style={{ backgroundImage: 'url("/restaurant_login_hero.png")' }}>
          <div className="auth-image-overlay">
            <div className="auth-hero-card">
              <h3>Fresh. Secure. Operational.</h3>
              <p>Keep your kitchen terminals, POS registers, and inventory synchronized with instant management alerts.</p>
            </div>
            <div className="auth-hero-slider-dots">
              <span className="slider-dot"></span>
              <span className="slider-dot active"></span>
              <span className="slider-dot"></span>
            </div>
          </div>
        </div>

      </div>

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

export default Register;

