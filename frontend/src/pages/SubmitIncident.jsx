import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ShieldAlert, ArrowLeft, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import Toast from '../components/Toast';

const SubmitIncident = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    severity: '',
    storeLocation: user ? user.storeLocation : '',
    dateTime: new Date().toISOString().slice(0, 16), // Pre-format to local datetime-local string
    description: '',
    image: '',
  });

  const [uploadedImages, setUploadedImages] = useState([]);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [dragActive, setDragActive] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Compress an image file using a canvas and return a Base64 JPEG string.
  // Targets ≤ 600 KB base64 per image so combined payload stays under Vercel's
  // 4.5 MB serverless request body limit.
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);

        // Keep longest side ≤ 800 px
        const MAX_SIDE = 800;
        let { width, height } = img;

        if (width > MAX_SIDE || height > MAX_SIDE) {
          if (width > height) {
            height = Math.round((height / width) * MAX_SIDE);
            width = MAX_SIDE;
          } else {
            width = Math.round((width / height) * MAX_SIDE);
            height = MAX_SIDE;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Start at 0.55 quality; drop by 0.1 each pass until ≤ 600 KB base64
        const MAX_B64_BYTES = 600 * 1024; // 600 KB
        let quality = 0.55;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        while (dataUrl.length > MAX_B64_BYTES && quality > 0.15) {
          quality = Math.round((quality - 0.1) * 100) / 100;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(dataUrl);
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error(`Failed to load image '${file.name}'.`));
      };

      img.src = objectUrl;
    });
  };

  // Convert uploaded image files to compressed Base64
  const processImageFiles = (files) => {
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);

    // Validate count
    if (uploadedImages.length + fileList.length > 5) {
      setToast({ message: 'You can upload a maximum of 5 images.', type: 'error' });
      return;
    }

    const loadPromises = fileList.map((file) => {
      // Validate type
      if (!file.type.startsWith('image/')) {
        return Promise.reject(new Error(`File '${file.name}' is not a valid image (PNG, JPG, WEBP).`));
      }

      // Validate raw size — 2 MB cap matches UI hint and keeps compression fast
      if (file.size > 2 * 1024 * 1024) {
        return Promise.reject(new Error(`Image '${file.name}' exceeds the 2 MB per-file limit. Please resize it first.`));
      }

      return compressImage(file);
    });

    Promise.all(loadPromises)
      .then((base64Strings) => {
        setUploadedImages((prev) => [...prev, ...base64Strings]);
        setToast({ message: `${base64Strings.length} picture(s) uploaded successfully!`, type: 'success' });
      })
      .catch((error) => {
        setToast({ message: error.message || 'Error processing images.', type: 'error' });
      });
  };

  const handleFileChange = (e) => {
    processImageFiles(e.target.files);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processImageFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveImage = (e, index) => {
    e.stopPropagation();
    setUploadedImages((prev) => prev.filter((_, idx) => idx !== index));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setToast({ message: 'Picture removed.', type: 'info' });
  };

  const handleZoneClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const validate = () => {
    const tempErrors = {};
    if (!formData.title.trim()) tempErrors.title = 'Incident title is required';
    if (!formData.category) tempErrors.category = 'Please select an incident category';
    if (!formData.severity) tempErrors.severity = 'Please select a severity level';
    if (!formData.storeLocation.trim()) tempErrors.storeLocation = 'Store location is required';
    if (!formData.description.trim()) tempErrors.description = 'Please describe what happened';
    
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        ...formData,
        image: uploadedImages.length > 0 ? JSON.stringify(uploadedImages) : '',
      };
      const response = await api.createIncident(payload);
      setLoading(false);
      if (response.success) {
        setToast({
          message: 'Incident reported successfully! Redirecting...',
          type: 'success',
        });
        setTimeout(() => {
          navigate('/');
        }, 1500);
      }
    } catch (error) {
      setLoading(false);
      setToast({
        message: error.message || 'Failed to submit incident. Please try again.',
        type: 'error',
      });
    }
  };

  const categoryOptions = [
    { value: 'POS Issue', label: 'POS System Issue' },
    { value: 'Delivery Delay', label: 'Delivery/Courier Delay' },
    { value: 'Inventory', label: 'Inventory / Ingredient Shortage' },
    { value: 'Kitchen Equipment', label: 'Kitchen Equipment Failure' },
    { value: 'Customer Complaint', label: 'Customer Complaint / Grievance' },
    { value: 'Other', label: 'Other Operational Issue' },
  ];

  const severityOptions = [
    { value: 'Low', label: 'Low (Minor disruption, service continues)' },
    { value: 'Medium', label: 'Medium (Noticeable impact, quick fix needed)' },
    { value: 'High', label: 'High (Severe impact, partial service shutdown)' },
    { value: 'Critical', label: 'Critical (Total emergency, full service halted)' },
  ];

  const storeOptions = [
    { value: 'Downtown Plaza', label: 'Downtown Plaza (Store #101)' },
    { value: 'Uptown Outlet', label: 'Uptown Outlet (Store #102)' },
    { value: 'West End Bistro', label: 'West End Bistro (Store #103)' },
    { value: 'Airport Food Court', label: 'Airport Food Court (Store #104)' },
    { value: 'Metro Station Kiosk', label: 'Metro Station Kiosk (Store #105)' },
  ];

  return (
    <div className="app-page-container" style={{ gap: '8px' }}>
      <div className="form-page-layout">
        <div className="page-header-actions" style={{ borderBottom: 'none', background: 'transparent', margin: '0 0 12px 0', padding: '4px 0' }}>
          <button onClick={() => navigate(-1)} className="btn-back" aria-label="Back">
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </button>
        </div>

        <Card
          title="Report Operational Incident"
          subtitle="Submit operational errors or complaints for managerial review"
          className="form-card"
          style={{ border: '1px solid #f1f5f9' }}
        >
          

          <form onSubmit={handleSubmit} className="incident-form">
            <div className="form-split-grid">
              {/* Left Column: Required Fields */}
              <div className="form-left-col">
                <Input
                  label="Incident Title"
                  id="title"
                  name="title"
                  type="text"
                  placeholder="e.g. Kitchen freezer temp alarm triggered"
                  value={formData.title}
                  onChange={handleChange}
                  error={errors.title}
                  required
                  disabled={loading}
                  aria-label="Incident Title"
                />

                <div className="form-row-2">
                  <Input
                    label="Category"
                    id="category"
                    name="category"
                    type="select"
                    placeholder="-- Select Category --"
                    value={formData.category}
                    onChange={handleChange}
                    options={categoryOptions}
                    error={errors.category}
                    required
                    disabled={loading}
                    aria-label="Category"
                  />

                  <Input
                    label="Severity Level"
                    id="severity"
                    name="severity"
                    type="select"
                    placeholder="-- Select Severity --"
                    value={formData.severity}
                    onChange={handleChange}
                    options={severityOptions}
                    error={errors.severity}
                    required
                    disabled={loading}
                    aria-label="Severity Level"
                  />
                </div>

                <div className="form-row-2">
                  <Input
                    label="Store Location"
                    id="storeLocation"
                    name="storeLocation"
                    type="select"
                    value={formData.storeLocation}
                    onChange={handleChange}
                    options={storeOptions}
                    error={errors.storeLocation}
                    required
                    disabled={loading}
                    aria-label="Store Location"
                  />

                  <Input
                    label="Date & Time of Occurrence"
                    id="dateTime"
                    name="dateTime"
                    type="datetime-local"
                    value={formData.dateTime}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    aria-label="Occurrence Date Time"
                  />
                </div>

                <Input
                  label="Incident Description"
                  id="description"
                  name="description"
                  type="textarea"
                  placeholder="Provide a detailed explanation of what happened, items impacted, and any initial actions taken..."
                  value={formData.description}
                  onChange={handleChange}
                  error={errors.description}
                  required
                  disabled={loading}
                  rows={5}
                  aria-label="Incident Description"
                />
              </div>

              {/* Right Column: Optional Image Attachments */}
              <div className="form-right-col">
                <div className="image-upload-container" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="input-label">Attach Incident Pictures (Optional)</span>
                    <span className="input-label" style={{ fontSize: '0.75rem', fontWeight: '500' }}>
                      {uploadedImages.length} / 5 Images
                    </span>
                  </div>
                  
                  <input
                    type="file"
                    id="incident-picture"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    ref={fileInputRef}
                    disabled={loading || uploadedImages.length >= 5}
                    multiple
                  />

                  {uploadedImages.length < 5 ? (
                    <div
                      className={`image-upload-zone ${dragActive ? 'drag-active' : ''}`}
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      onClick={handleZoneClick}
                      style={{ flex: 1, minHeight: '220px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}
                    >
                      <Upload size={24} className="image-upload-icon" />
                      <span className="image-upload-text" style={{ fontSize: '0.85rem' }}>Click to select images or drag &amp; drop</span>
                      <span className="image-upload-hint" style={{ fontSize: '0.7rem' }}>Supports PNG, JPG, WEBP formats (Max 10MB — auto-compressed)</span>
                    </div>
                  ) : (
                    <div className="form-intro-alert" style={{ background: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.1)', margin: 0, padding: '0.75rem 1rem' }}>
                      <p style={{ color: '#166534', fontSize: '0.8rem', margin: 0 }}>
                        Maximum upload limit of 5 images reached. Remove an image to upload a different one.
                      </p>
                    </div>
                  )}

                  {uploadedImages.length > 0 && (
                    <div className="image-previews-grid" style={{ marginTop: '0.75rem' }}>
                      {uploadedImages.map((img, idx) => (
                        <div key={idx} className="image-preview-wrapper" style={{ maxWidth: '100%' }}>
                          <img
                            src={img}
                            alt={`Incident preview ${idx + 1}`}
                            className="image-preview-img"
                          />
                          <button
                            type="button"
                            onClick={(e) => handleRemoveImage(e, idx)}
                            className="image-remove-btn"
                            title="Remove image"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="form-intro-alert" style={{ background: 'rgba(242, 92, 34, 0.04)', border: '1px solid rgba(242, 92, 34, 0.1)' }}>
            <ShieldAlert size={20} className="form-alert-icon" />
            <p style={{ color: '#0f172a' }}>
              Please enter the incident details carefully. Critical incidents immediately trigger
              a red flag alert on the manager dashboard for instant attention.
            </p>
          </div>

            <div className="form-submit-row" style={{ borderColor: '#f1f5f9' }}>
              <Button
                variant="secondary"
                onClick={() => navigate('/')}
                disabled={loading}
                type="button"
              >
                Cancel
              </Button>
              
              <Button
                type="submit"
                variant="primary"
                loading={loading}
              >
                Submit Incident Report
              </Button>
            </div>
          </form>
        </Card>
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

export default SubmitIncident;
