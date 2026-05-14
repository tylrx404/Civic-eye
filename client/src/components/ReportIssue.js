import React, { useState, useEffect } from 'react';
import { complaintsAPI, getCurrentLocation, getTypeLabel } from '../utils/api';

const ReportIssue = ({ onReportSubmitted }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    latitude: '',
    longitude: '',
    address: '',
    priority: 'medium',
    image: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [step, setStep] = useState(1); // For multi-step form

  const issueTypes = [
    { value: 'garbage', label: '🗑️ Garbage/Waste Management' },
    { value: 'pothole', label: '🕳️ Potholes' },
    { value: 'stray_animals', label: '🐕 Stray Animals' },
    { value: 'broken_streetlight', label: '💡 Broken Streetlights' },
    { value: 'water_leakage', label: '💧 Water Leakage' },
    { value: 'other', label: '🔧 Other Infrastructure' }
  ];

  const priorityLevels = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setError('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      setFormData(prev => ({
        ...prev,
        image: file
      }));

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const getCurrentLocationHandler = async () => {
    setLocationLoading(true);
    setError('');

    try {
      const location = await getCurrentLocation();
      setFormData(prev => ({
        ...prev,
        latitude: location.latitude.toString(),
        longitude: location.longitude.toString()
      }));

      // Reverse geocoding to get address (using a free service)
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}`
        );
        const data = await response.json();
        if (data.display_name) {
          setFormData(prev => ({
            ...prev,
            address: data.display_name
          }));
        }
      } catch (geocodeError) {
        console.warn('Could not get address:', geocodeError);
      }

      setSuccess('Location detected successfully');
    } catch (error) {
      setError('Could not get your location. Please enter coordinates manually or allow location access.');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        throw new Error('Title is required');
      }
      if (!formData.description.trim()) {
        throw new Error('Description is required');
      }
      if (!formData.type) {
        throw new Error('Issue type is required');
      }
      if (!formData.latitude || !formData.longitude) {
        throw new Error('Location is required');
      }

      // Create FormData object
      const submitData = new FormData();
      submitData.append('title', formData.title.trim());
      submitData.append('description', formData.description.trim());
      submitData.append('type', formData.type);
      submitData.append('latitude', formData.latitude);
      submitData.append('longitude', formData.longitude);
      submitData.append('address', formData.address.trim());
      submitData.append('priority', formData.priority);
      
      if (formData.image) {
        submitData.append('image', formData.image);
      }

      const response = await complaintsAPI.create(submitData);
      
      setSuccess('Your report has been successfully submitted. Thank you for helping improve our community!');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        type: '',
        latitude: '',
        longitude: '',
        address: '',
        priority: 'medium',
        image: null
      });
      setImagePreview(null);
      setStep(1);

      // Notify parent component
      if (onReportSubmitted) {
        onReportSubmitted(response.data);
      }

    } catch (error) {
      setError(error.response?.data?.error || error.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setFormData({
      title: '',
      description: '',
      type: '',
      latitude: '',
      longitude: '',
      address: '',
      priority: 'medium',
      image: null
    });
    setImagePreview(null);
    setError('');
    setSuccess('');
    setStep(1);
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.title.trim() || !formData.type || !formData.description.trim()) {
        setError('Please fill in all required fields in this section');
        return;
      }
      setError('');
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    setError('');
    setStep(step - 1);
  };

  return (
    <div className="card">
      <div className="card-header">
        Report New Issue
      </div>
      <div className="card-content">
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        {/* Progress Indicator */}
        <div className="form-progress">
          <div className={`progress-step ${step === 1 ? 'active' : step > 1 ? 'completed' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Issue Details</div>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${step === 2 ? 'active' : step > 2 ? 'completed' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Location</div>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${step === 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">Review & Submit</div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Issue Details */}
          {step === 1 && (
            <div className="form-step">
              <div className="form-group">
                <label className="form-label" htmlFor="title">Issue Title <span className="required">*</span></label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Briefly describe the issue in a few words"
                />
                <small className="input-help">Example: "Broken Street Light on Main St" or "Garbage Pile on 5th Avenue"</small>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="type">Issue Type <span className="required">*</span></label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="">Select issue type</option>
                  {issueTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="priority">Priority Level</label>
                <div className="priority-options">
                  {priorityLevels.map(priority => (
                    <label key={priority.value} className={`priority-option ${formData.priority === priority.value ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="priority"
                        value={priority.value}
                        checked={formData.priority === priority.value}
                        onChange={handleInputChange}
                      />
                      <span className={`priority-label priority-${priority.value}`}>{priority.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="description">Detailed Description <span className="required">*</span></label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="form-textarea"
                  placeholder="Provide detailed information about the issue. The more specific you are, the better we can address it."
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={nextStep}
                  className="btn btn-primary"
                >
                  Continue to Location
                </button>
                <button
                  type="button"
                  onClick={clearForm}
                  className="btn btn-secondary"
                >
                  Clear Form
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <div className="form-step">
              <div className="form-group">
                <label className="form-label">Issue Location <span className="required">*</span></label>
                <div className="location-auto-detect">
                  <button
                    type="button"
                    onClick={getCurrentLocationHandler}
                    disabled={locationLoading}
                    className="btn btn-secondary location-btn"
                  >
                    {locationLoading ? 
                      <><span className="loading-spinner"></span> Detecting Location...</> : 
                      <><span className="location-icon">📍</span> Detect My Current Location</>
                    }
                  </button>
                </div>
                
                <div className="coordinates-group">
                  <div className="form-group">
                    <label className="form-label" htmlFor="latitude">Latitude <span className="required">*</span></label>
                    <input
                      type="number"
                      id="latitude"
                      name="latitude"
                      value={formData.latitude}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="e.g., 37.7749"
                      step="any"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="longitude">Longitude <span className="required">*</span></label>
                    <input
                      type="number"
                      id="longitude"
                      name="longitude"
                      value={formData.longitude}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="e.g., -122.4194"
                      step="any"
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label" htmlFor="address">Address (Optional)</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Street address or landmark description"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Upload Image (Optional)</label>
                <div className="file-upload-container">
                  <input
                    type="file"
                    id="file-upload"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="form-file"
                  />
                  <label htmlFor="file-upload" className="custom-file-upload">
                    {imagePreview ? 'Change Image' : 'Select Image'}
                  </label>
                  <small className="input-help">Accepted formats: JPEG, PNG, GIF, WebP (Max: 5MB)</small>
                </div>
                {imagePreview && (
                  <div className="image-preview-container">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="image-preview"
                    />
                    <button 
                      type="button" 
                      className="remove-image-btn"
                      onClick={() => {
                        setImagePreview(null);
                        setFormData(prev => ({ ...prev, image: null }));
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={prevStep}
                  className="btn btn-secondary"
                >
                  Back to Details
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="btn btn-primary"
                >
                  Review Report
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review & Submit */}
          {step === 3 && (
            <div className="form-step">
              <h3 className="review-title">Review Your Report</h3>
              
              <div className="review-section">
                <h4>Issue Details</h4>
                <div className="review-item">
                  <span className="review-label">Title:</span>
                  <span className="review-value">{formData.title}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Type:</span>
                  <span className="review-value">{getTypeLabel(formData.type)}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Priority:</span>
                  <span className={`review-value priority-${formData.priority}`}>{formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1)}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Description:</span>
                  <span className="review-value description">{formData.description}</span>
                </div>
              </div>
              
              <div className="review-section">
                <h4>Location</h4>
                <div className="review-item">
                  <span className="review-label">Coordinates:</span>
                  <span className="review-value">{formData.latitude}, {formData.longitude}</span>
                </div>
                {formData.address && (
                  <div className="review-item">
                    <span className="review-label">Address:</span>
                    <span className="review-value">{formData.address}</span>
                  </div>
                )}
              </div>
              
              {imagePreview && (
                <div className="review-section">
                  <h4>Attached Image</h4>
                  <div className="review-image-container">
                    <img
                      src={imagePreview}
                      alt="Issue"
                      className="review-image"
                    />
                  </div>
                </div>
              )}
              
              <div className="form-actions">
                <button
                  type="button"
                  onClick={prevStep}
                  className="btn btn-secondary"
                >
                  Edit Report
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary submit-btn"
                >
                  {loading ? <><span className="loading-spinner"></span> Submitting...</> : 'Submit Report'}
                </button>
              </div>
            </div>
          )}
        </form>
        
        <style jsx>{`
          .form-progress {
            display: flex;
            align-items: center;
            margin-bottom: 2rem;
            justify-content: space-between;
          }
          
          .progress-step {
            display: flex;
            flex-direction: column;
            align-items: center;
            position: relative;
          }
          
          .step-number {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: #f1f3f5;
            border: 2px solid #dee2e6;
            color: #495057;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            margin-bottom: 8px;
          }
          
          .progress-step.active .step-number {
            background: #3498db;
            border-color: #3498db;
            color: white;
          }
          
          .progress-step.completed .step-number {
            background: #2ecc71;
            border-color: #2ecc71;
            color: white;
            position: relative;
          }
          
          .progress-step.completed .step-number:after {
            content: '✓';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
          }
          
          .step-label {
            font-size: 0.85rem;
            color: #6c757d;
          }
          
          .progress-step.active .step-label {
            font-weight: 600;
            color: #3498db;
          }
          
          .progress-line {
            flex-grow: 1;
            height: 3px;
            background: #e9ecef;
            margin: 0 10px;
            margin-bottom: 25px; /* Align with the balls */
          }
          
          .required {
            color: #e74c3c;
          }
          
          .input-help {
            display: block;
            margin-top: 5px;
            color: #6c757d;
            font-size: 0.85rem;
          }
          
          .priority-options {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
          }
          
          .priority-option {
            display: inline-flex;
            align-items: center;
            padding: 8px 15px;
            border-radius: 20px;
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            cursor: pointer;
            transition: all 0.2s;
          }
          
          .priority-option input {
            position: absolute;
            opacity: 0;
            cursor: pointer;
            height: 0;
            width: 0;
          }
          
          .priority-option.selected {
            background: rgba(52, 152, 219, 0.1);
            border-color: #3498db;
            font-weight: 500;
          }
          
          .priority-low {
            color: #27ae60;
          }
          
          .priority-medium {
            color: #3498db;
          }
          
          .priority-high {
            color: #f39c12;
          }
          
          .priority-urgent {
            color: #e74c3c;
          }
          
          .priority-option.selected .priority-low {
            color: #219651;
          }
          
          .priority-option.selected .priority-medium {
            color: #2980b9;
          }
          
          .priority-option.selected .priority-high {
            color: #d35400;
          }
          
          .priority-option.selected .priority-urgent {
            color: #c0392b;
          }
          
          .form-actions {
            display: flex;
            justify-content: space-between;
            margin-top: 2rem;
            gap: 15px;
          }
          
          .location-auto-detect {
            margin-bottom: 1rem;
          }
          
          .location-btn {
            width: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 12px;
          }
          
          .location-icon {
            margin-right: 8px;
            font-size: 1.2em;
          }
          
          .coordinates-group {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
          }
          
          .loading-spinner {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 1s linear infinite;
            margin-right: 8px;
          }
          
          .file-upload-container {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          
          .form-file {
            display: none;
          }
          
          .custom-file-upload {
            border: 2px dashed #dee2e6;
            border-radius: 6px;
            display: inline-block;
            padding: 15px 25px;
            cursor: pointer;
            background: #f8f9fa;
            transition: all 0.3s;
            width: 100%;
            text-align: center;
            margin-bottom: 10px;
            font-weight: 500;
          }
          
          .custom-file-upload:hover {
            background: rgba(52, 152, 219, 0.05);
            border-color: #3498db;
          }
          
          .image-preview-container {
            position: relative;
            margin-top: 1rem;
            border-radius: 6px;
            overflow: hidden;
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
            max-width: 300px;
          }
          
          .image-preview {
            width: 100%;
            height: auto;
            display: block;
          }
          
          .remove-image-btn {
            position: absolute;
            top: 8px;
            right: 8px;
            background: rgba(0, 0, 0, 0.6);
            color: white;
            border: none;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            font-size: 16px;
            line-height: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: background 0.2s;
          }
          
          .remove-image-btn:hover {
            background: rgba(0, 0, 0, 0.8);
          }
          
          .review-title {
            font-size: 1.2rem;
            color: #2c3e50;
            margin-bottom: 1.5rem;
            text-align: center;
          }
          
          .review-section {
            border: 1px solid #e9ecef;
            border-radius: 6px;
            padding: 1.25rem;
            margin-bottom: 1.5rem;
            background: #f8f9fa;
          }
          
          .review-section h4 {
            margin-bottom: 1rem;
            color: #2c3e50;
            font-size: 1.1rem;
            font-weight: 600;
            padding-bottom: 8px;
            border-bottom: 1px solid #dee2e6;
          }
          
          .review-item {
            margin-bottom: 0.75rem;
            display: flex;
          }
          
          .review-label {
            font-weight: 600;
            color: #495057;
            margin-right: 10px;
            min-width: 100px;
          }
          
          .review-value {
            color: #212529;
            flex-grow: 1;
          }
          
          .review-value.description {
            white-space: pre-line;
          }
          
          .review-image-container {
            display: flex;
            justify-content: center;
          }
          
          .review-image {
            max-width: 100%;
            max-height: 250px;
            border-radius: 6px;
          }
          
          .submit-btn {
            font-weight: 600;
            padding-left: 2rem;
            padding-right: 2rem;
          }
          
          @media (max-width: 768px) {
            .form-actions {
              flex-direction: column-reverse;
            }
            
            .coordinates-group {
              grid-template-columns: 1fr;
              gap: 10px;
            }
            
            .review-item {
              flex-direction: column;
            }
            
            .review-label {
              margin-bottom: 5px;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default ReportIssue;