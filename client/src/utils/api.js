import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API endpoints
export const complaintsAPI = {
  // Get all complaints
  getAll: (params = {}) => api.get('/complaints', { params }),
  
  // Get single complaint
  getById: (id) => api.get(`/complaints/${id}`),
  
  // Create new complaint
  create: (formData) => api.post('/complaints', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  
  // Update complaint
  update: (id, data) => api.put(`/complaints/${id}`, data),
  
  // Delete complaint
  delete: (id) => api.delete(`/complaints/${id}`),
  
  // Get statistics
  getStatistics: () => api.get('/complaints/statistics'),
  like: (id) => api.post(`/complaints/${id}/like`),

  
  // Bulk update status
  bulkUpdateStatus: (ids, status) => api.put('/complaints/bulk/status', { ids, status }),
};


// Utility functions
export const getImageUrl = (filename) => {
  if (!filename) return null;
  return `${API_BASE_URL.replace('/api', '')}/uploads/${filename}`;
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getStatusColor = (status) => {
  const colors = {
    pending: '#ffc107',
    assigned: '#28a745',
    in_progress: '#007bff',
    resolved: '#17a2b8',
    rejected: '#dc3545',
  };
  return colors[status] || '#6c757d';
};

export const getTypeLabel = (type) => {
  const labels = {
    garbage: '🗑️ Garbage/Waste',
    pothole: '🕳️ Pothole',
    stray_animals: '🐕 Stray Animals',
    broken_streetlight: '💡 Broken Streetlight',
    water_leakage: '💧 Water Leakage',
    other: '🔧 Other Infrastructure',
  };
  return labels[type] || type;
};

export const getStatusLabel = (status) => {
  const labels = {
    pending: 'Pending',
    assigned: 'Assigned',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    rejected: 'Rejected',
  };
  return labels[status] || status;
};

export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  });
};

export default api;