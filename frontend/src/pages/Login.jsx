import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, AlertCircle } from 'lucide-react';
import Input from '../components/Input';
import Button from '../components/Button';
import Toast from '../components/Toast';

const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
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
    if (!formData.email) {
      tempErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = 'Please provide a valid email';
    }
    if (!formData.password) {
      tempErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      tempErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const result = await login(formData.email, formData.password);
    setLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setErrors({ submit: result.error || 'Incorrect email or password. Please try again.' });
      setToast({
        message: result.error || 'Incorrect email or password. Please try again.',
        type: 'error',
      });
    }
  };

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
            <h1 className="auth-welcome-title">Welcome Back!</h1>
            <p className="auth-welcome-subtitle">Please log in to your account</p>

            <form onSubmit={handleSubmit} className="auth-form-split">
              {errors.submit && (
                <div className="auth-submit-error-banner animate-fade-in">
                  <AlertCircle size={16} className="auth-error-banner-icon" />
                  <span>{errors.submit}</span>
                </div>
              )}
              <Input
                label="Email Address"
                id="email"
                name="email"
                type="email"
                placeholder="e.g. staff@restaurant.com"
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
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                required
                disabled={loading}
                aria-label="Password"
              />

              <div className="auth-remember-row">
                <label className="checkbox-label">
                  <input type="checkbox" className="custom-checkbox" />
                  <span>Remember me</span>
                </label>
              </div>

              <div className="auth-buttons-row">
                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                  className="btn-auth-action"
                  style={{ width: '100%' }}
                >
                  Login
                </Button>
              </div>
            </form>
          </div>

          <div className="auth-form-footer">
            <p>© 2026 IncidentHub Operations. All rights reserved.</p>
          </div>
        </div>

        {/* Right Panel: Stunning Hero culinary graphic */}
        <div className="auth-right-panel" style={{ backgroundImage: 'url("/restaurant_login_hero.png")' }}>
          <div className="auth-image-overlay">
            <div className="auth-hero-card">
              <h3>Fresh. Secure. Operational.</h3>
              <p>Keep your kitchen terminals, POS registers, and inventory synchronized with instant management alerts.</p>
            </div>
            <div className="auth-hero-slider-dots">
              <span className="slider-dot active"></span>
              <span className="slider-dot"></span>
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

export default Login;
