import React, { useState, useEffect } from 'react';
import ReportIssue from './ReportIssue';
import ComplaintMap from './ComplaintMap';
import { complaintsAPI, formatDate, getTypeLabel, getStatusLabel } from '../utils/api';

const UserDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAllComplaints, setShowAllComplaints] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [filters, setFilters] = useState({
    type: '',
    status: ''
  });

  useEffect(() => {
    fetchComplaints();
  }, [filters]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.type) params.type = filters.type;
      if (filters.status) params.status = filters.status;
      
      const response = await complaintsAPI.getAll(params);
      setComplaints(response.data);
    } catch (error) {
      setError('Failed to fetch complaints');
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReportSubmitted = (newComplaint) => {
    setComplaints(prev => [newComplaint, ...prev]);
  };

  const handleComplaintClick = (complaint) => {
    setSelectedComplaint(complaint);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      status: ''
    });
  };

  const issueTypes = [
    { value: '', label: 'All Types' },
    { value: 'garbage', label: '🗑️ Garbage/Waste' },
    { value: 'pothole', label: '🕳️ Potholes' },
    { value: 'stray_animals', label: '🐕 Stray Animals' },
    { value: 'broken_streetlight', label: '💡 Broken Streetlights' },
    { value: 'water_leakage', label: '💧 Water Leakage' },
    { value: 'other', label: '🔧 Other Infrastructure' }
  ];

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'rejected', label: 'Rejected' }
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">User Dashboard</h1>
        <p className="dashboard-subtitle">Report civic issues and track complaints in your area</p>
      </div>

      <div className="user-dashboard">
        {/* Left Panel - Report Issue */}
        <div>
          <ReportIssue onReportSubmitted={handleReportSubmitted} />
        </div>

        {/* Right Panel - Map and Complaints */}
        <div>
          <div className="card">
            <div className="card-header">
              🗺️ Complaints Map & List
            </div>
            <div className="card-content">
              {/* Toggle and Filters */}
              <div style={{ marginBottom: '1rem' }}>
                <div className="toggle-container">
                  <span>Show Personal Complaints Only</span>
                  <div 
                    className={`toggle-switch ${showAllComplaints ? 'active' : ''}`}
                    onClick={() => setShowAllComplaints(!showAllComplaints)}
                  >
                    <div className="toggle-slider"></div>
                  </div>
                  <span>Show All Complaints</span>
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
                  <select
                    value={filters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    className="form-select"
                    style={{ minWidth: '150px' }}
                  >
                    {issueTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="form-select"
                    style={{ minWidth: '150px' }}                                      >
                                        {statusOptions.map(status => (
                                          <option key={status.value} value={status.value}>
                                            {status.label}
                                          </option>
                                        ))}
                                      </select>
                    
                                      <button
                                        onClick={clearFilters}
                                        className="btn btn-small btn-secondary"
                                      >
                                        🔄 Clear Filters
                                      </button>
                                    </div>
                                  </div>
                    
                                  {/* Map View */}
                                  <div style={{ height: '300px', marginBottom: '1rem' }}>
                                    {loading ? (
                                      <div className="loading">Loading map data...</div>
                                    ) : (
                                      <ComplaintMap
                                        complaints={complaints}
                                        onComplaintClick={handleComplaintClick}
                                      />
                                    )}
                                  </div>
                    
                                  {/* Complaints List */}
                                  <div className="complaints-list">
                                    <h3 style={{ marginBottom: '1rem' }}>Recent Complaints</h3>
                                    
                                    {loading ? (
                                      <div className="loading">Loading complaints...</div>
                                    ) : error ? (
                                      <div className="error">{error}</div>
                                    ) : complaints.length === 0 ? (
                                      <div className="empty-state">
                                        No complaints found. Try adjusting your filters or report a new issue.
                                      </div>
                                    ) : (
                                      complaints.map(complaint => (
                                        <div
                                          key={complaint._id}
                                          className="complaint-item"
                                          onClick={() => handleComplaintClick(complaint)}
                                        >
                                          <div className="complaint-header">
                                            <div>
                                              <div className="complaint-title">{complaint.title}</div>
                                              <div className="complaint-type">{getTypeLabel(complaint.type)}</div>
                                            </div>
                                            <div className={`status-badge status-${complaint.status}`}>
                                              {getStatusLabel(complaint.status)}
                                            </div>
                                          </div>
                                          <div className="complaint-description">
                                            {complaint.description.length > 100
                                              ? `${complaint.description.substring(0, 100)}...`
                                              : complaint.description}
                                          </div>
                                          <div className="complaint-meta">
                                            <span>🕒 {formatDate(complaint.createdAt)}</span>
                                            {complaint.location.address && (
                                              <span>📍 {complaint.location.address.substring(0, 30)}</span>
                                            )}
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                    
                          {/* Complaint Detail Modal */}
                          {selectedComplaint && (
                            <div className="modal-overlay" onClick={() => setSelectedComplaint(null)}>
                              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                                <div className="modal-header">
                                  <h2>{selectedComplaint.title}</h2>
                                  <button className="close-btn" onClick={() => setSelectedComplaint(null)}>×</button>
                                </div>
                                <div className="modal-body">
                                  <div className="complaint-detail-status">
                                    <span className={`status-badge status-${selectedComplaint.status}`}>
                                      {getStatusLabel(selectedComplaint.status)}
                                    </span>
                                    <span className="complaint-detail-type">
                                      {getTypeLabel(selectedComplaint.type)}
                                    </span>
                                  </div>
                                  
                                  <p className="complaint-detail-description">{selectedComplaint.description}</p>
                                  
                                  {selectedComplaint.image && (
                                    <div className="complaint-detail-image">
                                      <img 
                                        src={`http://localhost:5000/uploads/${selectedComplaint.image}`} 
                                        alt="Complaint" 
                                      />
                                    </div>
                                  )}
                                  
                                  <div className="complaint-detail-meta">
                                    <p><strong>Reported:</strong> {formatDate(selectedComplaint.createdAt)}</p>
                                    {selectedComplaint.location.address && (
                                      <p><strong>Location:</strong> {selectedComplaint.location.address}</p>
                                    )}
                                    <p><strong>Coordinates:</strong> {selectedComplaint.location.latitude}, {selectedComplaint.location.longitude}</p>
                                    <p><strong>Priority:</strong> {selectedComplaint.priority}</p>
                                    <p><strong>Last Updated:</strong> {formatDate(selectedComplaint.updatedAt)}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    };
                    
                    export default UserDashboard;