import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { complaintsAPI, formatDate, getTypeLabel, getStatusLabel, getImageUrl, getStatusColor } from '../utils/api';

const Home = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [trendingTopics, setTrendingTopics] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  // Categories for filtering
  const categories = [
    { value: 'all', label: 'For You', icon: '🏠' },
    { value: 'trending', label: 'Trending', icon: '🔥' },
    { value: 'nearby', label: 'Nearby', icon: '📍' },
    { value: 'recent', label: 'Latest', icon: '🕒' },
    { value: 'resolved', label: 'Resolved', icon: '✅' },
    { value: 'garbage', label: 'Waste', icon: '🗑️' },
    { value: 'pothole', label: 'Roads', icon: '🕳️' },
    { value: 'stray_animals', label: 'Animals', icon: '🐕' },
    { value: 'broken_streetlight', label: 'Lights', icon: '💡' },
    { value: 'water_leakage', label: 'Water', icon: '💧' },
  ];

  useEffect(() => {
    fetchComplaints();
    generateTrendingTopics();
    generateRecentActivity();
  }, [activeCategory]);
  
  const generateTrendingTopics = () => {
    // Simulating trending topics data
    const topics = [
      { name: 'Road Maintenance', count: 34 },
      { name: 'Street Lighting', count: 28 },
      { name: 'Waste Collection', count: 53 },
      { name: 'Water Supply Issues', count: 21 },
      { name: 'Public Parks', count: 15 }
    ];
    setTrendingTopics(topics);
  };
  
  const generateRecentActivity = () => {
    // Simulating recent activity data
    const activities = [
      { type: 'resolved', text: 'Pothole on Main Street fixed', time: '2h ago' },
      { type: 'new', text: 'New waste collection schedule posted', time: '4h ago' },
      { type: 'update', text: 'Street light repairs scheduled for Downtown area', time: '6h ago' },
      { type: 'resolved', text: 'Fallen tree on Park Avenue removed', time: '1d ago' }
    ];
    setRecentActivity(activities);
  };

  const fetchComplaints = async (refresh = false) => {
    try {
      setLoading(true);
      const params = { limit: 10, page: refresh ? 1 : page };
      
      if (activeCategory === 'recent') {
        // Sort by most recent first (default behavior)
      } else if (activeCategory === 'trending') {
        params.sort = 'priority';
      } else if (activeCategory === 'resolved') {
        params.status = 'resolved';
      } else if (activeCategory === 'nearby') {
        // In a real app, you'd get user location and sort by proximity
        // For now, we'll just fetch all complaints
      } else if (activeCategory !== 'all') {
        params.type = activeCategory;
      }
      
      const response = await complaintsAPI.getAll(params);
      
      if (refresh || page === 1) {
        setComplaints(response.data);
      } else {
        setComplaints(prev => [...prev, ...response.data]);
      }
      
      setHasMore(response.data.length === 10);
      setPage(refresh ? 2 : page + 1);
    } catch (error) {
      setError('Failed to fetch complaints');
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchComplaints(true);
  };

  const loadMoreComplaints = () => {
    fetchComplaints();
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return '#27ae60';
      case 'medium': return '#3498db';
      case 'high': return '#f39c12';
      case 'urgent': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const handleLikeClick = async (id) => {
    try {
      await complaintsAPI.like(id);
      setComplaints(prev => prev.map(complaint => 
        complaint._id === id 
          ? { ...complaint, likes: (complaint.likes || 0) + 1 } 
          : complaint
      ));
    } catch (error) {
      console.error('Error liking complaint:', error);
    }
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'just now';
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    
    return `${Math.floor(months / 12)}y ago`;
  };

  return (
    <div className="home-layout">
      {/* Left sidebar */}
      <aside className="home-sidebar left-sidebar">
        <div className="sidebar-section">
          <h3 className="sidebar-title">Trending Issues</h3>
          <div className="trending-topics">
            {trendingTopics.map((topic, index) => (
              <div key={index} className="trending-item">
                <div className="trending-rank">#{index + 1}</div>
                <div className="trending-content">
                  <div className="trending-name">{topic.name}</div>
                  <div className="trending-count">{topic.count} reports</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="sidebar-section">
          <h3 className="sidebar-title">Recent Updates</h3>
          <div className="recent-activities">
            {recentActivity.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className={`activity-icon activity-${activity.type}`}>
                  {activity.type === 'resolved' ? '✅' : 
                   activity.type === 'new' ? '🆕' : '🔄'}
                </div>
                <div className="activity-content">
                  <div className="activity-text">{activity.text}</div>
                  <div className="activity-time">{activity.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="sidebar-section">
          <h3 className="sidebar-title">Quick Links</h3>
          <div className="quick-links">
            <Link to="/user" className="quick-link">
              <span className="quick-link-icon">📝</span>
              <span>Report New Issue</span>
            </Link>
            <Link to="/admin" className="quick-link">
              <span className="quick-link-icon">📊</span>
              <span>View Analytics</span>
            </Link>
            <a href="#" className="quick-link">
              <span className="quick-link-icon">📱</span>
              <span>Download Mobile App</span>
            </a>
            <a href="#" className="quick-link">
              <span className="quick-link-icon">❓</span>
              <span>Help Center</span>
            </a>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="home-main">
        <div className="feed-header">
          <h1 className="feed-title">Community Feed</h1>
          <button onClick={handleRefresh} className="refresh-btn" disabled={isRefreshing}>
            <span className={`refresh-icon ${isRefreshing ? 'spinning' : ''}`}>🔄</span>
            <span>Refresh</span>
          </button>
        </div>

        {/* Categories Navigation */}
        <nav className="categories-nav">
          {categories.map(category => (
            <button
              key={category.value}
              className={`category-tab ${activeCategory === category.value ? 'active' : ''}`}
              onClick={() => setActiveCategory(category.value)}
            >
              <span className="category-icon">{category.icon}</span>
              <span className="category-name">{category.label}</span>
            </button>
          ))}
        </nav>

        {/* Feed Content */}
        <div className="feed-content">
          {loading && page === 1 ? (
            <div className="feed-loading">
              <div className="loading-spinner large"></div>
              <div className="loading-text">Loading community issues...</div>
            </div>
          ) : error ? (
            <div className="feed-error">
              <div className="error-icon">⚠️</div>
              <div className="error-text">{error}</div>
              <button onClick={handleRefresh} className="error-retry-btn">Try Again</button>
            </div>
          ) : complaints.length === 0 ? (
            <div className="feed-empty">
              <div className="empty-illustration">📭</div>
              <h3 className="empty-title">No issues found</h3>
              <p className="empty-text">No civic issues found in this category.</p>
              <button onClick={handleRefresh} className="empty-action-btn">
                Refresh Feed
              </button>
            </div>
          ) : (
            <div className="feed-posts">
              {complaints.map(complaint => (
                <article key={complaint._id} className="post-card">
                  <header className="post-header">
                    <div className="post-author">
                      <div className="author-avatar" style={{ backgroundColor: getStatusColor(complaint.status) }}>
                        {complaint.type === 'garbage' ? '🗑️' :
                         complaint.type === 'pothole' ? '🕳️' :
                         complaint.type === 'stray_animals' ? '🐕' :
                         complaint.type === 'broken_streetlight' ? '💡' :
                         complaint.type === 'water_leakage' ? '💧' : '🔧'}
                      </div>
                      <div className="author-info">
                        <h3 className="post-title">{complaint.title}</h3>
                        <div className="post-metadata">
                          <span className="post-type">{getTypeLabel(complaint.type)}</span>
                          <span className="post-separator">•</span>
                          <span className="post-time">{getTimeAgo(complaint.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className={`post-status status-${complaint.status}`}>
                      {getStatusLabel(complaint.status)}
                    </div>
                  </header>
                  
                  <div className="post-body">
                    <p className="post-description">
                      {complaint.description.length > 200
                        ? `${complaint.description.substring(0, 200)}...`
                        : complaint.description}
                    </p>
                    
                    {complaint.image && (
                      <div className="post-media">
                        <img 
                          src={getImageUrl(complaint.image)} 
                          alt={complaint.title} 
                          loading="lazy"
                          className="post-image"
                        />
                      </div>
                    )}
                    
                    <div className="post-location">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="location-icon">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      <span className="location-text">
                        {complaint.location.address || 
                          `${complaint.location.latitude.toFixed(4)}, ${complaint.location.longitude.toFixed(4)}`}
                      </span>
                    </div>
                    
                    <div className="post-priority">
                      <div className="priority-label">Priority:</div>
                      <div 
                        className={`priority-badge priority-${complaint.priority}`}
                        style={{backgroundColor: getPriorityColor(complaint.priority)}}
                      >
                        {complaint.priority}
                      </div>
                    </div>
                  </div>
                  
                  <footer className="post-footer">
                    <button 
                      className="post-action support-btn"
                      onClick={() => handleLikeClick(complaint._id)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"></path>
                        <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                      </svg>
                      <span>Support</span>
                      <span className="action-count">{complaint.likes || 0}</span>
                    </button>
                    
                    <Link 
                      to={`/details/${complaint._id}`} 
                      className="post-action details-btn"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 16v-4M12 8h.01"></path>
                      </svg>
                      <span>Details</span>
                    </Link>
                    
                    <button className="post-action share-btn">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="18" cy="5" r="3"></circle>
                        <circle cx="6" cy="12" r="3"></circle>
                        <circle cx="18" cy="19" r="3"></circle>
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                      </svg>
                      <span>Share</span>
                    </button>
                  </footer>
                  
                  {(complaint.status === 'in_progress' || complaint.status === 'resolved') && (
                    <div className={`post-update-banner status-${complaint.status}`}>
                      {complaint.status === 'in_progress' && (
                        <>
                          <div className="update-icon">🔧</div>
                          <div className="update-text">
                            <strong>In Progress:</strong> City maintenance team is working on this issue
                          </div>
                        </>
                      )}
                      {complaint.status === 'resolved' && (
                        <>
                          <div className="update-icon">✅</div>
                          <div className="update-text">
                            <strong>Resolved:</strong> This issue has been fixed
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </article>
              ))}

              {/* Load More / Loading More */}
              {!loading && hasMore && (
                <div className="load-more-container">
                  <button 
                    onClick={loadMoreComplaints}
                    className="load-more-btn"
                  >
                    Show More Issues
                  </button>
                </div>
              )}
              
              {loading && page > 1 && (
                <div className="loading-more">
                  <div className="loading-spinner"></div>
                  <span>Loading more issues...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Right sidebar */}
      <aside className="home-sidebar right-sidebar">
        <div className="sidebar-section">
          <h3 className="sidebar-title">Issue Statistics</h3>
          <div className="stats-container">
            <div className="stat-box">
              <div className="stat-value">127</div>
              <div className="stat-label">Active Issues</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">43</div>
              <div className="stat-label">Resolved This Week</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">82%</div>
              <div className="stat-label">Resolution Rate</div>
            </div>
          </div>
        </div>
        
        <div className="sidebar-section">
          <h3 className="sidebar-title">Top Contributors</h3>
          <div className="contributors-list">
            <div className="contributor">
              <div className="contributor-rank">1</div>
              <div className="contributor-avatar">JD</div>
              <div className="contributor-info">
                <div className="contributor-name">Jane Doe</div>
                <div className="contributor-count">23 reports</div>
              </div>
            </div>
            <div className="contributor">
              <div className="contributor-rank">2</div>
              <div className="contributor-avatar">MS</div>
              <div className="contributor-info">
                <div className="contributor-name">Mike Smith</div>
                <div className="contributor-count">17 reports</div>
              </div>
            </div>
            <div className="contributor">
              <div className="contributor-rank">3</div>
              <div className="contributor-avatar">AT</div>
              <div className="contributor-info">
                <div className="contributor-name">Alice Taylor</div>
                <div className="contributor-count">14 reports</div>
              </div>
            </div>
            <div className="contributor">
              <div className="contributor-rank">4</div>
              <div className="contributor-avatar">RJ</div>
              <div className="contributor-info">
                <div className="contributor-name">Robert Johnson</div>
                <div className="contributor-count">12 reports</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="sidebar-section">
          <h3 className="sidebar-title">City Information</h3>
          <div className="city-info">
            <div className="city-info-item">
              <div className="info-icon">📞</div>
              <div className="info-content">
                <div className="info-label">Emergency Hotline</div>
                <div className="info-value">800-555-1212</div>
              </div>
            </div>
            <div className="city-info-item">
              <div className="info-icon">🕒</div>
              <div className="info-content">
                <div className="info-label">City Hall Hours</div>
                <div className="info-value">Mon-Fri: 9am-5pm</div>
              </div>
            </div>
            <div className="city-info-item">
              <div className="info-icon">🚚</div>
              <div className="info-content">
                <div className="info-label">Trash Collection</div>
                <div className="info-value">Every Tuesday & Friday</div>
              </div>
            </div>
            <div className="city-info-item">
              <div className="info-icon">📅</div>
              <div className="info-content">
                <div className="info-label">Next Town Hall</div>
                <div className="info-value">June 15, 7:00 PM</div>
              </div>
            </div>
          </div>
        </div>
      </aside>
      
      {/* Floating report button */}
      <Link to="/user" className="floating-report-btn">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        <span className="tooltip">Report Issue</span>
      </Link>

      <style jsx>{`
        .home-layout {
          display: grid;
          grid-template-columns: minmax(250px, 1fr) minmax(0, 2.5fr) minmax(250px, 1fr);
          gap: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }
        
        /* Sidebars */
        .home-sidebar {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .sidebar-section {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          overflow: hidden;
          position: relative;
        }
        
        .sidebar-title {
          font-weight: 700;
          color: var(--dark);
          padding: 15px 20px;
          margin: 0;
          border-bottom: 1px solid #f0f2f5;
          font-size: 1.1rem;
        }
        
        /* Trending Topics */
        .trending-topics {
          padding: 12px 0;
        }
        
        .trending-item {
          display: flex;
          align-items: center;
          padding: 8px 20px;
          transition: background 0.2s;
          cursor: pointer;
        }
        
        .trending-item:hover {
          background: #f7f9fc;
        }
        
        .trending-rank {
          font-weight: 700;
          color: var(--gray);
          margin-right: 12px;
        }
        
        .trending-name {
          font-weight: 600;
          margin-bottom: 2px;
        }
        
        .trending-count {
          font-size: 0.85rem;
          color: var(--gray);
        }
        
        /* Recent Activities */
        .recent-activities {
          padding: 12px 0;
        }
        
        .activity-item {
          display: flex;
          align-items: flex-start;
          padding: 10px 20px;
          transition: background 0.2s;
          cursor: pointer;
        }
        
        .activity-item:hover {
          background: #f7f9fc;
        }
        
        .activity-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
          flex-shrink: 0;
        }
        
        .activity-resolved {
          background: #e8f5e9;
        }
        
        .activity-new {
          background: #e3f2fd;
        }
        
        .activity-update {
          background: #fff8e1;
        }
        
        .activity-text {
          font-size: 0.9rem;
          margin-bottom: 4px;
          line-height: 1.4;
        }
        
        .activity-time {
          font-size: 0.8rem;
          color: var(--gray);
        }
        
        /* Quick Links */
        .quick-links {
          padding: 12px 0;
        }
        
        .quick-link {
          display: flex;
          align-items: center;
          padding: 10px 20px;
          text-decoration: none;
          color: var(--dark);
          transition: background 0.2s;
          font-weight: 500;
        }
        
        .quick-link:hover {
          background: #f7f9fc;
        }
        
        .quick-link-icon {
          margin-right: 12px;
          font-size: 1.1rem;
        }
        
        /* Stats Boxes */
        .stats-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
          gap: 10px;
          padding: 15px;
        }
        
        .stat-box {
          background: #f7f9fc;
          border-radius: 8px;
          padding: 15px;
          text-align: center;
        }
        
        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--primary);
          margin-bottom: 5px;
        }
        
        .stat-label {
          font-size: 0.8rem;
          color: var(--gray);
          line-height: 1.2;
        }
        
        /* Contributors */
        .contributors-list {
          padding: 12px 0;
        }
        
        .contributor {
          display: flex;
          align-items: center;
          padding: 10px 20px;
          transition: background 0.2s;
        }
        
        .contributor:hover {
          background: #f7f9fc;
        }
        
        .contributor-rank {
          font-weight: 700;
          width: 24px;
          margin-right: 10px;
          text-align: center;
          color: var(--gray);
        }
        
        .contributor-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          margin-right: 12px;
        }
        
        .contributor-name {
          font-weight: 600;
          margin-bottom: 2px;
        }
        
        .contributor-count {
          font-size: 0.8rem;
          color: var(--gray);
        }
        
        /* City Info */
        .city-info {
          padding: 12px 0;
        }
        
        .city-info-item {
          display: flex;
          align-items: center;
          padding: 10px 20px;
        }
        
        .info-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #f0f2f5;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
        }
        
        .info-label {
          font-weight: 600;
          margin-bottom: 2px;
          font-size: 0.9rem;
        }
        
        .info-value {
          font-size: 0.85rem;
          color: var(--gray);
        }
        
        /* Main Feed */
        .home-main {
          display: flex;
          flex-direction: column;
          min-width: 0; /* Important for text-overflow to work properly */
        }
        
        .feed-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .feed-title {
          font-size: 1.6rem;
          font-weight: 800;
          color: var(--dark);
          letter-spacing: -0.5px;
          margin: 0;
        }
        
        .refresh-btn {
          display: flex;
          align-items: center;
          padding: 8px 16px;
          border-radius: 20px;
          background: transparent;
          border: 1px solid #e1e8ed;
          color: var(--primary);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .refresh-btn:hover {
          background: #f5f8fa;
          border-color: #ccd6dd;
        }
        
        .refresh-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .refresh-icon {
          display: inline-block;
          margin-right: 8px;
        }
        
        .spinning {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Categories Navigation */
        .categories-nav {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 8px;
          margin-bottom: 20px;
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE/Edge */
          border-bottom: 1px solid #ebeef0;
        }
        
        .categories-nav::-webkit-scrollbar {
          display: none; /* Chrome/Safari */
        }
        
        .category-tab {
          display: flex;
          align-items: center;
          padding: 8px 16px;
          border-radius: 20px;
          background: transparent;
          border: 1px solid #e1e8ed;
          color: var(--primary);
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
        }
        
        .category-tab.active {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }
        
        .category-tab:hover:not(.active) {
          background: #f5f8fa;
          border-color: #ccd6dd;
        }
        
        .category-icon {
          margin-right: 8px;
        }
        
        /* Feed Posts */
        .feed-posts {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .post-card {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid #e1e8ed;
          transition: all 0.2s;
          position: relative;
        }
        
        .post-card:hover {
          border-color: #ccd6dd;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          transform: translateY(-2px);
        }
        
        .post-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 16px 16px 12px;
        }
        
        .post-author {
          display: flex;
          align-items: center;
        }
        
        .author-avatar {
          width: 48px;
          height: 48px;
          border-radius: 24px;
          background: #e1e8ed;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
          font-size: 20px;
        }
        
        .post-title {
          font-size: 1.1rem;
          font-weight: 700;
          margin: 0 0 4px 0;
          color: var(--dark);
        }
        
        .post-metadata {
          display: flex;
          align-items: center;
          color: #657786;
          font-size: 0.9rem;
        }
        
        .post-separator {
          margin: 0 6px;
        }
        
        .post-status {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          padding: 6px 10px;
          border-radius: 16px;
        }
        
        .status-pending {
          background: #fff3cd;
          color: #856404;
        }
        
        .status-assigned {
          background: #d4edda;
          color: #155724;
        }
        
        .status-in_progress {
          background: #cce5ff;
          color: #004085;
        }
        
        .status-resolved {
          background: #d1ecf1;
          color: #0c5460;
        }
        
        .status-rejected {
          background: #f8d7da;
          color: #721c24;
        }
        
        .post-body {
          padding: 0 16px 16px;
        }
        
        .post-description {
          margin: 0 0 16px 0;
          font-size: 1rem;
          line-height: 1.5;
          color: var(--dark);
          white-space: pre-line;
        }
        
        .post-media {
          margin: 0 -16px;
          margin-bottom: 16px;
          position: relative;
        }
        
        .post-image {
          width: 100%;
          display: block;
          max-height: 500px;
          object-fit: cover;
        }
        
        .post-location {
          display: flex;
          align-items: center;
          margin-bottom: 12px;
          color: #657786;
          font-size: 0.9rem;
        }
        
        .location-icon {
          margin-right: 8px;
          color: #e74c3c;
        }
        
        .location-text {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .post-priority {
          display: flex;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .priority-label {
          font-weight: 600;
          margin-right: 8px;
          color: var(--dark);
          font-size: 0.9rem;
        }
        
        .priority-badge {
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 0.8rem;
          font-weight: 700;
          color: white;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .post-footer {
          display: flex;
          border-top: 1px solid #e1e8ed;
        }
        
        .post-action {
          flex: 1;
          padding: 12px 8px;
          background: transparent;
          border: none;
          color: #657786;
          font-weight: 600;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
          text-decoration: none;
        }
        
        .post-action svg {
          margin-right: 8px;
        }
        
        .post-action:hover {
          background: rgba(0, 0, 0, 0.03);
          color: var(--primary);
        }
        
        .action-count {
          margin-left: 4px;
          font-weight: 700;
          background: #f5f8fa;
          color: #657786;
          padding: 2px 6px;
          border-radius: 10px;
          font-size: 0.8rem;
        }
        
        .support-btn:hover {
          color: #e74c3c;
        }
        
        .support-btn:hover svg {
          stroke: #e74c3c;
        }
        
        .details-btn:hover {
          color: var(--primary);
        }
        
        .details-btn:hover svg {
          stroke: var(--primary);
        }
        
        .share-btn:hover {
          color: #27ae60;
        }
        
        .share-btn:hover svg {
          stroke: #27ae60;
        }
        
        .post-action:not(:last-child) {
          border-right: 1px solid #e1e8ed;
        }
        
        .post-update-banner {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          font-size: 0.9rem;
          border-top: 1px solid #e1e8ed;
        }
        
        .post-update-banner.status-in_progress {
          background-color: rgba(204, 229, 255, 0.3);
        }
        
        .post-update-banner.status-resolved {
          background-color: rgba(209, 236, 241, 0.3);
        }
        
        .update-icon {
          margin-right: 10px;
          font-size: 1.1rem;
        }
        
        /* Loading States */
        .feed-loading, .feed-error, .feed-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
          background: white;
          border-radius: 16px;
          border: 1px solid #e1e8ed;
        }
        
        .loading-spinner {
          width: 30px;
          height: 30px;
          border: 3px solid rgba(0, 0, 0, 0.1);
          border-radius: 50%;
          border-top-color: var(--primary);
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }
        
        .loading-spinner.large {
          width: 40px;
          height: 40px;
          border-width: 4px;
        }
        
        .loading-text {
          color: #657786;
          font-weight: 500;
        }
        
        .error-icon {
          font-size: 40px;
          margin-bottom: 16px;
        }
        
        .error-text {
          color: var(--danger);
          font-weight: 600;
          margin-bottom: 16px;
        }
        
        .error-retry-btn {
          padding: 8px 16px;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 20px;
          font-weight: 600;
          cursor: pointer;
        }
        
        .empty-illustration {
          font-size: 48px;
          margin-bottom: 16px;
          opacity: 0.5;
        }
        
        .empty-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0 0 8px 0;
          color: var(--dark);
        }
        
        .empty-text {
          color: #657786;
          margin-bottom: 16px;
        }
        
        .empty-action-btn {
          padding: 10px 20px;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 20px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .empty-action-btn:hover {
          background: var(--primary-light);
        }
        
        .load-more-container {
          display: flex;
          justify-content: center;
          padding: 16px 0;
        }
        
        .load-more-btn {
          padding: 10px 20px;
          background: white;
          border: 1px solid #e1e8ed;
          border-radius: 20px;
          color: var(--primary);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .load-more-btn:hover {
          background: #f5f8fa;
          border-color: #ccd6dd;
        }
        
        .loading-more {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          color: #657786;
        }
        
        .loading-more .loading-spinner {
          margin: 0 8px 0 0;
          width: 20px;
          height: 20px;
        }
        
        /* Floating Action Button */
        .floating-report-btn {
          position: fixed;
          right: 24px;
          bottom: 24px;
          width: 56px;
          height: 56px;
          border-radius: 28px;
          background: var(--primary);
          color: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s;
          z-index: 900;
        }
        
        .floating-report-btn:hover {
          transform: translateY(-4px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
          background: var(--primary-light);
        }
        
        .tooltip {
          position: absolute;
          right: 64px;
          background: rgba(0, 0, 0, 0.75);
          color: white;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 600;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s;
        }
        
        .tooltip::after {
          content: '';
          position: absolute;
          top: 50%;
          right: -4px;
          margin-top: -4px;
          border-width: 4px 0 4px 4px;
          border-style: solid;
          border-color: transparent transparent transparent rgba(0, 0, 0, 0.75);
        }
        
        .floating-report-btn:hover .tooltip {
          opacity: 1;
        }
        
        /* Responsive Design */
        @media (max-width: 1280px) {
          .home-layout {
            grid-template-columns: minmax(200px, 1fr) minmax(0, 2fr) minmax(200px, 1fr);
          }
        }
        
        @media (max-width: 992px) {
          .home-layout {
            grid-template-columns: 1fr minmax(0, 2fr);
          }
          
          .right-sidebar {
            display: none;
          }
        }
        
        @media (max-width: 768px) {
          .home-layout {
            grid-template-columns: 1fr;
          }
          
          .left-sidebar {
            display: none;
          }
          
          .feed-header {
            padding: 0 8px;
          }
          
          .categories-nav {
            padding: 0 8px 8px;
          }
          
          .post-card {
            border-radius: 0;
            border-left: none;
            border-right: none;
            margin: 0 -16px;
          }
          
          .post-card:first-child {
            border-top: none;
          }
          
          .post-media {
            margin: 0 -16px 16px;
          }
          
          .post-title {
            font-size: 1rem;
          }
          
          .post-description {
            font-size: 0.95rem;
          }
          
          .floating-report-btn {
            width: 48px;
            height: 48px;
            right: 16px;
            bottom: 16px;
          }
          
          .tooltip {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default Home;