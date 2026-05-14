import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { complaintsAPI, formatDate, getTypeLabel, getStatusLabel, getImageUrl } from '../utils/api';

const ComplaintDetails = () => {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchComplaintDetails = async () => {
      try {
        setLoading(true);
        const response = await complaintsAPI.getById(id);
        setComplaint(response.data);
      } catch (error) {
        setError('Failed to load complaint details');
        console.error('Error fetching complaint:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaintDetails();
  }, [id]);

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'low': return 'priority-low';
      case 'medium': return 'priority-medium';
      case 'high': return 'priority-high';
      case 'urgent': return 'priority-urgent';
      default: return '';
    }
  };

  if (loading) {
    return <div className="loading">Loading complaint details...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!complaint) {
    return <div className="error">Complaint not found</div>;
  }

  return (
    <div className="complaint-details">
      <Link to="/" className="back-link">
        &larr; Back to Feed
      </Link>
      
      <div className="details-card">
        <div className="details-header">
          <h1>{complaint.title}</h1>
          <div className="details-meta">
            <div className="details-type">{getTypeLabel(complaint.type)}</div>
            <div className="details-date">Reported on {formatDate(complaint.createdAt)}</div>
          </div>
          <div className={`details-status status-${complaint.status}`}>
            {getStatusLabel(complaint.status)}
          </div>
        </div>
        
        {complaint.image && (
          <div className="details-image">
            <img src={getImageUrl(complaint.image)} alt={complaint.title} />
          </div>
        )}
        
        <div className="details-content">
          <div className="details-section">
            <h2>Description</h2>
            <p>{complaint.description}</p>
          </div>
          
          <div className="details-section">
            <h2>Location</h2>
            <p className="details-location">
              <span className="location-icon">📍</span>
              {complaint.location.address || 
                `${complaint.location.latitude}, ${complaint.location.longitude}`}
            </p>
            <div className="details-map-placeholder">
              <div className="map-message">
                Map view available in dashboard
              </div>
            </div>
          </div>
          
          <div className="details-section">
            <h2>Status Information</h2>
            <div className="status-info">
              <div className="status-item">
                <span className="status-label">Current Status:</span>
                <span className={`status-value status-${complaint.status}`}>
                  {getStatusLabel(complaint.status)}
                </span>
              </div>
              
              <div className="status-item">
                <span className="status-label">Priority Level:</span>
                <span className={`priority-badge ${getPriorityClass(complaint.priority)}`}>
                  {complaint.priority}
                </span>
              </div>
              
              <div className="status-item">
                <span className="status-label">Last Updated:</span>
                <span className="status-value">
                  {formatDate(complaint.updatedAt)}
                </span>
              </div>
              
              {complaint.assignedTo && (
                <div className="status-item">
                  <span className="status-label">Assigned To:</span>
                  <span className="status-value">
                    {complaint.assignedTo}
                  </span>
                </div>
              )}
            </div>
            
            <div className="status-timeline">
              <div className={`timeline-node ${complaint.status !== 'pending' ? 'completed' : 'active'}`}>
                <div className="node-dot"></div>
                <div className="node-label">Reported</div>
                <div className="node-date">{formatDate(complaint.createdAt)}</div>
              </div>
              <div className={`timeline-node ${['assigned', 'in_progress', 'resolved'].includes(complaint.status) ? 'completed' : ''}`}>
                <div className="node-dot"></div>
                <div className="node-label">Assigned</div>
              </div>
              <div className={`timeline-node ${['in_progress', 'resolved'].includes(complaint.status) ? 'completed' : ''}`}>
                <div className="node-dot"></div>
                <div className="node-label">In Progress</div>
              </div>
              <div className={`timeline-node ${complaint.status === 'resolved' ? 'completed' : ''}`}>
                <div className="node-dot"></div>
                <div className="node-label">Resolved</div>
                {complaint.status === 'resolved' && (
                  <div className="node-date">{formatDate(complaint.updatedAt)}</div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="details-actions">
          <Link to="/user" className="btn btn-primary">
            Report Similar Issue
          </Link>
          <button className="btn btn-secondary">
            Share Issue
          </button>
          <button className="btn btn-secondary">
            Subscribe to Updates
          </button>
        </div>
      </div>

      <style jsx>{`
        .complaint-details {
          max-width: 800px;
          margin: 0 auto;
          padding: 1rem 0;
        }
        
        .back-link {
          display: inline-block;
          margin-bottom: 1rem;
          color: var(--primary);
          text-decoration: none;
          font-weight: 500;
          transition: var(--transition);
        }
        
        .back-link:hover {
          color: var(--secondary);
        }
        
        .details-card {
          background: white;
          border-radius: var(--radius);
          overflow: hidden;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
        }
        
        .details-header {
          padding: 1.5rem;
          background: var(--primary);
          color: white;
        }
        
        .details-header h1 {
          font-size: 1.5rem;
          margin-bottom: 0.75rem;
          font-weight: 600;
        }
        
        .details-meta {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
          font-size: 0.9rem;
          opacity: 0.9;
          flex-wrap: wrap;
        }
        
        .details-status {
          display: inline-block;
          padding: 0.4rem 1rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        
        .details-image {
          width: 100%;
          max-height: 500px;
          overflow: hidden;
          border-bottom: 1px solid #eee;
        }
        
        .details-image img {
          width: 100%;
          height: auto;
          display: block;
        }
        
        .details-content {
          padding: 1.5rem;
        }
        
        .details-section {
          margin-bottom: 2rem;
        }
        
        .details-section h2 {
          font-size: 1.25rem;
          margin-bottom: 1rem;
          color: var(--primary);
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #eee;
        }
        
        .details-section p {
          line-height: 1.7;
        }
        
        .details-location {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        
        .location-icon {
          color: #e74c3c;
        }
        
        .details-map-placeholder {
          height: 150px;
          background: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius);
          border: 1px dashed #ddd;
        }
        
        .map-message {
          color: var(--gray);
          font-size: 0.9rem;
        }
        
        .status-info {
          background: #f8f9fa;
          border-radius: var(--radius);
          padding: 1rem;
          margin-bottom: 1.5rem;
        }
        
        .status-item {
          display: flex;
          align-items: center;
          margin-bottom: 0.75rem;
        }
        
        .status-label {
          width: 120px;
          font-weight: 600;
          color: var(--dark);
          font-size: 0.9rem;
        }
        
        .status-value {
          flex: 1;
        }
        
        .priority-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          color: white;
          text-transform: uppercase;
          display: inline-block;
        }
        
        .priority-low {
          background-color: #27ae60;
        }
        
        .priority-medium {
          background-color: #3498db;
        }
        
        .priority-high {
          background-color: #f39c12;
        }
        
        .priority-urgent {
          background-color: #e74c3c;
        }
        
        .status-timeline {
          display: flex;
          justify-content: space-between;
          margin: 2rem 0;
          position: relative;
        }
        
        .status-timeline::before {
          content: '';
          position: absolute;
          top: 10px;
          left: 0;
          right: 0;
          height: 2px;
          background: #ddd;
          z-index: 1;
        }
        
        .timeline-node {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          z-index: 2;
          width: 22%;
        }
        
        .node-dot {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid #ddd;
          background: white;
          margin-bottom: 0.5rem;
        }
        
        .node-label {
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--gray);
          text-align: center;
        }
        
        .node-date {
          font-size: 0.75rem;
          color: var(--gray);
          margin-top: 0.25rem;
        }
        
        .timeline-node.active .node-dot {
          border-color: var(--secondary);
          background: var(--secondary);
        }
        
        .timeline-node.active .node-label {
          color: var(--dark);
          font-weight: 600;
        }
        
        .timeline-node.completed .node-dot {
          border-color: var(--accent);
          background: var(--accent);
        }
        
        .timeline-node.completed .node-label {
          color: var(--accent);
          font-weight: 600;
        }
        
        .details-actions {
          padding: 1.5rem;
          border-top: 1px solid #eee;
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }
        
        @media (max-width: 768px) {
          .details-actions {
            flex-direction: column;
          }
          
          .status-timeline {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          
          .status-timeline::before {
            top: 0;
            bottom: 0;
            left: 10px;
            right: auto;
            width: 2px;
            height: auto;
          }
          
          .timeline-node {
            flex-direction: row;
            width: 100%;
            align-items: flex-start;
            padding-left: 30px;
          }
          
          .node-dot {
            position: absolute;
            left: 0;
            top: 0;
            margin-bottom: 0;
          }
          
          .node-label {
            text-align: left;
          }
          
          .node-date {
            margin-left: 0.5rem;
            margin-top: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default ComplaintDetails;