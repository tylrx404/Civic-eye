import React, { useState, useEffect } from 'react';
import { complaintsAPI, formatDate, getTypeLabel, getStatusLabel } from '../utils/api';
import ComplaintMap from './ComplaintMap';

const AdminDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [statistics, setStatistics] = useState({
    statusStats: [],
    typeStats: [],
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [filters, setFilters] = useState({
    type: '',
    status: ''
  });
  const [selectedComplaints, setSelectedComplaints] = useState([]);
  const [bulkAction, setBulkAction] = useState('');

  useEffect(() => {
    fetchComplaints();
    fetchStatistics();
  }, [filters]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.type) params.type = filters.type;
      if (filters.status) params.status = filters.status;
      
      const response = await complaintsAPI.getAll(params);
      setComplaints(response.data);
      setSelectedComplaints([]);
    } catch (error) {
      setError('Failed to fetch complaints');
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      setStatsLoading(true);
      const response = await complaintsAPI.getStatistics();
      setStatistics(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setStatsLoading(false);
    }
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

  const handleStatusChange = async (complaintId, newStatus) => {
    try {
      await complaintsAPI.update(complaintId, { status: newStatus });
      
      // Update local state
      setComplaints(prev => 
        prev.map(complaint => 
          complaint._id === complaintId 
            ? { ...complaint, status: newStatus, updatedAt: new Date().toISOString() } 
            : complaint
        )
      );
      
      // If the complaint is selected, update it too
      if (selectedComplaint && selectedComplaint._id === complaintId) {
        setSelectedComplaint(prev => ({ 
          ...prev, 
          status: newStatus,
          updatedAt: new Date().toISOString()
        }));
      }
      
      // Refresh statistics
      fetchStatistics();
    } catch (error) {
      console.error('Error updating complaint status:', error);
      setError('Failed to update complaint status');
    }
  };
  
  const handleAssignmentChange = async (complaintId, assignedTo) => {
    try {
      await complaintsAPI.update(complaintId, { 
        assignedTo,
        status: 'assigned' // Automatically change status to assigned
      });
      
      // Update local state
      setComplaints(prev => 
        prev.map(complaint => 
          complaint._id === complaintId 
            ? { 
                ...complaint, 
                assignedTo, 
                status: 'assigned',
                updatedAt: new Date().toISOString() 
              } 
            : complaint
        )
      );
      
      // If the complaint is selected, update it too
      if (selectedComplaint && selectedComplaint._id === complaintId) {
        setSelectedComplaint(prev => ({ 
          ...prev, 
          assignedTo,
          status: 'assigned',
          updatedAt: new Date().toISOString()
        }));
      }
      
      // Refresh statistics
      fetchStatistics();
    } catch (error) {
      console.error('Error updating complaint assignment:', error);
      setError('Failed to update complaint assignment');
    }
  };

  const handlePriorityChange = async (complaintId, newPriority) => {
    try {
      await complaintsAPI.update(complaintId, { priority: newPriority });
      
      // Update local state
      setComplaints(prev => 
        prev.map(complaint => 
          complaint._id === complaintId 
            ? { ...complaint, priority: newPriority, updatedAt: new Date().toISOString() } 
            : complaint
        )
      );
      
      // If the complaint is selected, update it too
      if (selectedComplaint && selectedComplaint._id === complaintId) {
        setSelectedComplaint(prev => ({ 
          ...prev, 
          priority: newPriority,
          updatedAt: new Date().toISOString()
        }));
      }
    } catch (error) {
      console.error('Error updating complaint priority:', error);
      setError('Failed to update complaint priority');
    }
  };

  const handleComplaintSelection = (complaintId) => {
    setSelectedComplaints(prev => {
      if (prev.includes(complaintId)) {
        return prev.filter(id => id !== complaintId);
      } else {
        return [...prev, complaintId];
      }
    });
  };

  const handleSelectAllComplaints = () => {
    if (selectedComplaints.length === complaints.length) {
      setSelectedComplaints([]);
    } else {
      setSelectedComplaints(complaints.map(complaint => complaint._id));
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedComplaints.length === 0) {
      return;
    }

    try {
      await complaintsAPI.bulkUpdateStatus(selectedComplaints, bulkAction);
      
      // Update local state
      setComplaints(prev => 
        prev.map(complaint => 
          selectedComplaints.includes(complaint._id) 
            ? { ...complaint, status: bulkAction, updatedAt: new Date().toISOString() } 
            : complaint
        )
      );
      
      // Clear selections after successful update
      setSelectedComplaints([]);
      setBulkAction('');
      
      // Refresh statistics
      fetchStatistics();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      setError('Failed to perform bulk action');
    }
  };

  const handleDeleteComplaint = async (complaintId) => {
    if (!window.confirm('Are you sure you want to delete this complaint? This action cannot be undone.')) {
      return;
    }

    try {
      await complaintsAPI.delete(complaintId);
      
      // Update local state
      setComplaints(prev => prev.filter(complaint => complaint._id !== complaintId));
      
      // If the deleted complaint was selected, clear the selection
      if (selectedComplaint && selectedComplaint._id === complaintId) {
        setSelectedComplaint(null);
      }
      
      // Remove from selected complaints if present
      setSelectedComplaints(prev => prev.filter(id => id !== complaintId));
      
      // Refresh statistics
      fetchStatistics();
    } catch (error) {
      console.error('Error deleting complaint:', error);
      setError('Failed to delete complaint');
    }
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

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ];

  const assigneeOptions = [
    { value: 'team_a', label: 'Team A' },
    { value: 'team_b', label: 'Team B' },
    { value: 'john_doe', label: 'John Doe' },
    { value: 'jane_smith', label: 'Jane Smith' },
    { value: 'maintenance_dept', label: 'Maintenance Department' }
  ];

  const getStatusCount = (status) => {
    const stat = statistics.statusStats.find(s => s._id === status);
    return stat ? stat.count : 0;
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Admin Dashboard</h1>
        <p className="dashboard-subtitle">Manage and resolve civic issues reported by citizens</p>
      </div>

      <div className="admin-dashboard">
        {/* Statistics Cards */}
        <div className="admin-stats">
          <div className="stat-card">
            <div className="stat-number">
              {statsLoading ? '...' : statistics.total}
            </div>
            <div className="stat-label">Total Complaints</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-number">
              {statsLoading ? '...' : getStatusCount('pending')}
            </div>
            <div className="stat-label">Pending</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-number">
              {statsLoading ? '...' : getStatusCount('in_progress')}
            </div>
            <div className="stat-label">In Progress</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-number">
              {statsLoading ? '...' : getStatusCount('resolved')}
            </div>
            <div className="stat-label">Resolved</div>
          </div>
        </div>
        
        {/* Map View */}
        <div className="card">
          <div className="card-header">
            🗺️ Complaints Map
          </div>
          <div className="card-content">
            <div style={{ height: '400px' }}>
              {loading ? (
                <div className="loading">Loading map data...</div>
              ) : (
                <ComplaintMap
                  complaints={complaints}
                  onComplaintClick={handleComplaintClick}
                />
              )}
            </div>
          </div>
        </div>
        
        {/* Complaints Management */}
        <div className="card">
          <div className="card-header">
            📋 Complaints Management
          </div>
          <div className="card-content">
            {error && <div className="error">{error}</div>}
            
            {/* Filters */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '1rem' }}>
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
                style={{ minWidth: '150px' }}
              >
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
            
            {/* Bulk Actions */}
            {selectedComplaints.length > 0 && (
              <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <strong>{selectedComplaints.length}</strong> complaints selected
                </span>
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="form-select"
                  style={{ minWidth: '150px' }}
                >
                  <option value="">Change Status To...</option>
                  <option value="pending">Pending</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <button
                  onClick={handleBulkAction}
                  disabled={!bulkAction}
                  className="btn btn-small btn-primary"
                >
                  Apply
                </button>
              </div>
            )}
            
            {/* Complaints Table */}
            <div className="table-responsive">
              <table className="complaints-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={selectedComplaints.length > 0 && selectedComplaints.length === complaints.length}
                        onChange={handleSelectAllComplaints}
                      />
                    </th>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Location</th>
                    <th>Reported</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="loading">Loading complaints...</td>
                    </tr>
                  ) : complaints.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="empty-state">No complaints found. Try adjusting your filters.</td>
                    </tr>
                  ) : (
                    complaints.map(complaint => (
                      <tr key={complaint._id} className={selectedComplaints.includes(complaint._id) ? 'selected-row' : ''}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedComplaints.includes(complaint._id)}
                            onChange={() => handleComplaintSelection(complaint._id)}
                          />
                        </td>
                        <td>
                          <div className="complaint-title-cell" onClick={() => handleComplaintClick(complaint)}>
                            {complaint.title}
                          </div>
                        </td>
                        <td>{getTypeLabel(complaint.type)}</td>
                        <td>
                          <select
                            value={complaint.status}
                            onChange={(e) => handleStatusChange(complaint._id, e.target.value)}
                            className={`status-select status-${complaint.status}`}
                          >
                            {statusOptions.filter(option => option.value).map(status => (
                              <option key={status.value} value={status.value}>
                                {status.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <select
                            value={complaint.priority}
                            onChange={(e) => handlePriorityChange(complaint._id, e.target.value)}
                            className={`priority-select priority-${complaint.priority}`}
                          >
                            {priorityOptions.map(priority => (
                              <option key={priority.value} value={priority.value}>
                                {priority.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          {complaint.location.address 
                            ? complaint.location.address.substring(0, 20) + '...' 
                            : `${complaint.location.latitude.toFixed(4)}, ${complaint.location.longitude.toFixed(4)}`}
                        </td>
                        <td>{formatDate(complaint.createdAt)}</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              onClick={() => handleComplaintClick(complaint)}
                              className="btn btn-small btn-secondary"
                              title="View Details"
                            >
                              👁️
                            </button>
                            <button
                              onClick={() => handleDeleteComplaint(complaint._id)}
                              className="btn btn-small btn-danger"
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Add some CSS for the complaints table */}
            <style jsx>{`
              .complaints-table {
                width: 100%;
                border-collapse: collapse;
              }
              
              .complaints-table th,
              .complaints-table td {
                padding: 0.75rem;
                border-bottom: 1px solid #eee;
              }
              
              .complaints-table th {
                text-align: left;
                background-color: #f8f9fa;
              }
              
              .selected-row {
                background-color: rgba(102, 126, 234, 0.1);
              }
              
              .complaint-title-cell {
                cursor: pointer;
                font-weight: 500;
              }
              
              .complaint-title-cell:hover {
                text-decoration: underline;
              }
              
              .status-select,
              .priority-select {
                padding: 0.3rem;
                border-radius: 3px;
                font-size: 0.9rem;
                width: 100%;
              }
              
              .status-select.status-pending { color: #856404; border-color: #ffeeba; }
              .status-select.status-assigned { color: #155724; border-color: #c3e6cb; }
              .status-select.status-in_progress { color: #004085; border-color: #b8daff; }
              .status-select.status-resolved { color: #0c5460; border-color: #bee5eb; }
              .status-select.status-rejected { color: #721c24; border-color: #f5c6cb; }
              
              .priority-select.priority-low { color: #28a745; }
              .priority-select.priority-medium { color: #007bff; }
              .priority-select.priority-high { color: #fd7e14; }
              .priority-select.priority-urgent { color: #dc3545; font-weight: bold; }
              
              .action-buttons {
                display: flex;
                gap: 5px;
              }
            `}</style>
          </div>
        </div>
      </div>
      
      {/* Complaint Detail Modal */}
      {selectedComplaint && (
        <div className="modal-overlay" onClick={() => setSelectedComplaint(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2>{selectedComplaint.title}</h2>
              <button className="close-btn" onClick={() => setSelectedComplaint(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="complaint-detail-grid">
                <div>
                  <div className="complaint-detail-status">
                    <span className={`status-badge status-${selectedComplaint.status}`}>
                      {getStatusLabel(selectedComplaint.status)}
                    </span>
                    <span className="complaint-detail-type">
                      {getTypeLabel(selectedComplaint.type)}
                    </span>
                    <span className={`priority-badge priority-${selectedComplaint.priority}`}>
                      Priority: {selectedComplaint.priority}
                    </span>
                  </div>
                  
                  <div className="complaint-detail-section">
                    <h3>Details</h3>
                    <p className="complaint-detail-description">{selectedComplaint.description}</p>
                  </div>
                  
                  <div className="complaint-detail-section">
                    <h3>Location</h3>
                    <p><strong>Coordinates:</strong> {selectedComplaint.location.latitude}, {selectedComplaint.location.longitude}</p>
                    {selectedComplaint.location.address && (
                      <p><strong>Address:</strong> {selectedComplaint.location.address}</p>
                    )}
                  </div>
                  
                  <div className="complaint-detail-section">
                    <h3>Management</h3>
                    <div className="management-controls">
                      <div className="form-group">
                        <label>Status:</label>
                        <select
                          value={selectedComplaint.status}
                          onChange={(e) => handleStatusChange(selectedComplaint._id, e.target.value)}
                          className={`form-select status-select status-${selectedComplaint.status}`}
                        >
                          {statusOptions.filter(option => option.value).map(status => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label>Priority:</label>
                        <select
                          value={selectedComplaint.priority}
                          onChange={(e) => handlePriorityChange(selectedComplaint._id, e.target.value)}
                          className={`form-select priority-select priority-${selectedComplaint.priority}`}
                        >
                          {priorityOptions.map(priority => (
                            <option key={priority.value} value={priority.value}>
                              {priority.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label>Assign To:</label>
                        <select
                          value={selectedComplaint.assignedTo || ''}
                          onChange={(e) => handleAssignmentChange(selectedComplaint._id, e.target.value)}
                          className="form-select"
                        >
                          <option value="">Not Assigned</option>
                          {assigneeOptions.map(assignee => (
                            <option key={assignee.value} value={assignee.value}>
                              {assignee.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="complaint-detail-meta">
                    <p><strong>Reported:</strong> {formatDate(selectedComplaint.createdAt)}</p>
                    <p><strong>Last Updated:</strong> {formatDate(selectedComplaint.updatedAt)}</p>
                    {selectedComplaint.assignedTo && (
                      <p><strong>Assigned To:</strong> {
                        assigneeOptions.find(a => a.value === selectedComplaint.assignedTo)?.label || 
                        selectedComplaint.assignedTo
                      }</p>
                    )}
                  </div>
                </div>
                
                {/* Right side - Image */}
                {selectedComplaint.image && (
                  <div className="complaint-detail-image-container">
                    <div className="complaint-detail-image">
                      <img 
                        src={`http://localhost:5000/uploads/${selectedComplaint.image}`} 
                        alt="Complaint" 
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="modal-actions">
                <button 
                  onClick={() => setSelectedComplaint(null)}
                  className="btn btn-secondary"
                >
                  Close
                </button>
                <button 
                  onClick={() => handleDeleteComplaint(selectedComplaint._id)}
                  className="btn btn-danger"
                >
                  Delete Complaint
                </button>
              </div>
            </div>
            
            {/* Modal specific styles */}
            <style jsx>{`
              .complaint-detail-grid {
                display: grid;
                grid-template-columns: ${selectedComplaint.image ? '1fr 300px' : '1fr'};
                gap: 20px;
              }
              
              .complaint-detail-section {
                margin-bottom: 1.5rem;
              }
              
              .complaint-detail-section h3 {
                margin-bottom: 0.5rem;
                color: #555;
                border-bottom: 1px solid #eee;
                padding-bottom: 0.25rem;
              }
              
              .management-controls {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                gap: 10px;
              }
              
              .priority-badge {
                padding: 0.25rem 0.75rem;
                border-radius: 15px;
                font-size: 0.8rem;
                margin-left: 8px;
              }
              
              .priority-low { background: #d4edda; color: #155724; }
              .priority-medium { background: #cce5ff; color: #004085; }
              .priority-high { background: #fff3cd; color: #856404; }
              .priority-urgent { background: #f8d7da; color: #721c24; font-weight: bold; }
              
              .modal-actions {
                display: flex;
                justify-content: space-between;
                margin-top: 1.5rem;
                padding-top: 1rem;
                border-top: 1px solid #eee;
              }
              
              .complaint-detail-image-container {
                display: flex;
                justify-content: center;
                align-items: flex-start;
              }
              
              .complaint-detail-image img {
                width: 100%;
                border-radius: 5px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
            `}</style>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;