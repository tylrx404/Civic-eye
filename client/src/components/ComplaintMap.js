import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { getTypeLabel, getStatusColor, formatDate, getImageUrl } from '../utils/api';

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;

/**
 * Interactive complaint map component displaying civic issues geographically
 * 
 * @param {Array} complaints - Array of complaint objects to display on map
 * @param {Function} onComplaintClick - Callback when a complaint is selected
 * @param {Array} center - Default map center coordinates [lat, lng]
 * @param {Number} zoom - Default zoom level
 */
const ComplaintMap = ({ complaints = [], onComplaintClick, center = [20.5937, 78.9629], zoom = 5 }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const markersLayerRef = useRef(null);

  // Initialize map on component mount
  useEffect(() => {
    if (!mapInstanceRef.current) {
      // Create map instance with custom options
      mapInstanceRef.current = L.map(mapRef.current, {
        center: center,
        zoom: zoom,
        zoomControl: false,
        scrollWheelZoom: true,
        attributionControl: false
      });

      // Add custom attribution with better styling
      L.control.attribution({
        prefix: '<a href="https://civiceye.org">CivicEye</a>'
      }).addTo(mapInstanceRef.current);

      // Add zoom control at a different position
      L.control.zoom({
        position: 'bottomright'
      }).addTo(mapInstanceRef.current);

      // Use a more modern tile layer with better styling
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(mapInstanceRef.current);

      // Create a markers layer group for better performance
      markersLayerRef.current = L.layerGroup().addTo(mapInstanceRef.current);

      // Add scale control
      L.control.scale({
        imperial: false,
        position: 'bottomleft'
      }).addTo(mapInstanceRef.current);

      setMapLoaded(true);
    } else {
      // Update map view if center or zoom changes
      mapInstanceRef.current.setView(center, zoom);
    }

    // Cleanup function for component unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
        setMapLoaded(false);
      }
    };
  }, [center, zoom]);

  // Update markers when complaints data changes
  useEffect(() => {
    // Don't proceed if map isn't loaded yet or there are no complaints
    if (!mapInstanceRef.current || !mapLoaded || !complaints) return;

    // Clear existing markers layer and create new one
    if (markersLayerRef.current) {
      markersLayerRef.current.clearLayers();
    }

    // Track all marker bounds to fit map
    const markerBounds = [];
    
    // Create custom icon function based on complaint type and status
    const createCustomMarker = (complaint) => {
      const { latitude, longitude } = complaint.location;
      
      // Skip if location data is invalid
      if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) return null;
      
      // Store coordinates for bounds calculation
      markerBounds.push([latitude, longitude]);
      
      // Get status-specific color for marker
      const iconColor = getStatusColor(complaint.status);
      
      // Determine icon and styling based on complaint type
      let iconSymbol;
      let iconStyle;
      
      switch(complaint.type) {
        case 'garbage':
          iconSymbol = '🗑️';
          iconStyle = 'garbage-marker';
          break;
        case 'pothole':
          iconSymbol = '🕳️';
          iconStyle = 'pothole-marker';
          break;
        case 'stray_animals':
          iconSymbol = '🐕';
          iconStyle = 'animal-marker';
          break;
        case 'broken_streetlight':
          iconSymbol = '💡';
          iconStyle = 'light-marker';
          break;
        case 'water_leakage':
          iconSymbol = '💧';
          iconStyle = 'water-marker';
          break;
        default:
          iconSymbol = '🔧';
          iconStyle = 'other-marker';
      }
      
      // Create marker with pulse effect for newer complaints
      const isRecent = (Date.now() - new Date(complaint.createdAt).getTime()) < 86400000; // 24 hours
      const isPriority = complaint.priority === 'high' || complaint.priority === 'urgent';
      
      // Create custom HTML marker with enhanced styling
      const customIcon = L.divIcon({
        className: `custom-marker ${iconStyle}`,
        html: `
          <div class="marker-container">
            <div class="marker-pin" style="background-color: ${iconColor};">
              <span class="marker-icon">${iconSymbol}</span>
              ${isPriority ? '<span class="priority-indicator"></span>' : ''}
            </div>
            <div class="marker-shadow"></div>
            ${isRecent ? '<div class="pulse-ring"></div>' : ''}
          </div>
        `,
        iconSize: [36, 46],
        iconAnchor: [18, 46],
        popupAnchor: [0, -46]
      });

      // Create marker and add to layer group
      const marker = L.marker([latitude, longitude], { 
        icon: customIcon,
        alt: complaint.title,
        title: complaint.title // Tooltip on hover
      }).addTo(markersLayerRef.current);

      // Store reference to marker
      marker.complaintId = complaint._id;
      
      return marker;
    };
    
    // Process each complaint and create markers
    complaints.forEach(complaint => {
      const marker = createCustomMarker(complaint);
      if (!marker) return;
      
      // Get status-specific color for marker
      const iconColor = getStatusColor(complaint.status);
      
      // Create enhanced popup with better styling and organization
      const priorityDisplay = {
        'low': '<span class="priority-dot priority-low"></span> Low',
        'medium': '<span class="priority-dot priority-medium"></span> Medium',
        'high': '<span class="priority-dot priority-high"></span> High',
        'urgent': '<span class="priority-dot priority-urgent"></span> Urgent'
      };

      const popupContent = `
        <div class="custom-popup">
          <div class="popup-header" style="border-color: ${iconColor};">
            <h3>${complaint.title}</h3>
          </div>
          
          <div class="popup-content">
            <div class="popup-badges">
              <span class="popup-badge" style="background-color: ${iconColor};">${complaint.status.replace('_', ' ').toUpperCase()}</span>
              <span class="popup-type">${getTypeLabel(complaint.type)}</span>
            </div>
            
            <p class="popup-description">${complaint.description.length > 100 ? 
              complaint.description.substring(0, 100) + '...' : 
              complaint.description
            }</p>
            
            <div class="popup-meta">
              <div class="meta-item">
                <strong>Priority:</strong> ${priorityDisplay[complaint.priority] || complaint.priority}
              </div>
              <div class="meta-item">
                <strong>Reported:</strong> ${formatDate(complaint.createdAt)}
              </div>
              ${complaint.location.address ? 
                `<div class="meta-item">
                  <strong>Location:</strong> ${complaint.location.address}
                </div>` : 
                ''
              }
            </div>
            
            ${complaint.image ? `
              <div class="popup-image">
                <img src="${getImageUrl(complaint.image)}" alt="Issue photo" />
              </div>
            ` : ''}
            
            ${onComplaintClick ? `
              <button class="popup-button" onclick="window.selectComplaint('${complaint._id}')">
                <span class="button-icon">👁️</span> View Full Details
              </button>
            ` : ''}
          </div>
        </div>
      `;

      // Add popup with custom options
      marker.bindPopup(popupContent, {
        maxWidth: 320,
        minWidth: 280,
        className: 'civic-popup',
        closeButton: true,
        autoPan: true,
        autoPanPadding: [40, 40]
      });

      // Additional event handlers for interaction
      marker.on({
        mouseover: function() {
          this.getElement().classList.add('marker-hover');
        },
        mouseout: function() {
          this.getElement().classList.remove('marker-hover');
        },
        click: function() {
          if (mapInstanceRef.current.getZoom() < 14) {
            mapInstanceRef.current.setView(
              [complaint.location.latitude, complaint.location.longitude], 
              14, 
              { animate: true }
            );
          }
        }
      });

      // Direct click handler for complaint selection
      if (onComplaintClick) {
        marker.on('click', () => {
          // Highlight active marker
          document.querySelectorAll('.marker-active').forEach(el => {
            el.classList.remove('marker-active');
          });
          marker.getElement().classList.add('marker-active');
        });
      }
    });

    // Register global handler for popup button clicks
    window.selectComplaint = (complaintId) => {
      const complaint = complaints.find(c => c._id === complaintId);
      if (complaint && onComplaintClick) {
        onComplaintClick(complaint);
      }
    };

    // Fit map bounds if we have markers
    if (markerBounds.length > 0) {
      const bounds = L.latLngBounds(markerBounds);
      if (bounds.isValid()) {
        mapInstanceRef.current.fitBounds(bounds, { 
          padding: [40, 40],
          maxZoom: 15,
          animate: true
        });
      }
    }

    // Update map size in case container dimensions changed
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 100);

    return () => {
      // Cleanup global handler
      delete window.selectComplaint;
    };
  }, [complaints, mapLoaded, onComplaintClick]);

  return (
    <div className="map-wrapper">
      <div ref={mapRef} className="map-container" />
      <style jsx>{`
        .map-wrapper {
          position: relative;
          height: 100%;
          width: 100%;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .map-container {
          height: 100%;
          width: 100%;
          z-index: 1;
        }
        
        :global(.custom-marker) {
          background: transparent !important;
          border: none !important;
        }
        
        :global(.marker-container) {
          position: relative;
          width: 36px;
          height: 46px;
          display: flex;
          justify-content: center;
          transform-origin: bottom center;
          transition: transform 0.2s ease;
        }
        
        :global(.marker-pin) {
          position: absolute;
          top: 0;
          left: 0;
          width: 36px;
          height: 46px;
          display: flex;
          justify-content: center;
          align-items: center;
          color: white;
          background-size: contain;
          background-position: center;
          background-repeat: no-repeat;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 36 46' fill='%23000000'%3E%3Cpath d='M36 18c0 9.941-18 28-18 28S0 27.941 0 18C0 8.059 8.059 0 18 0s18 8.059 18 18z'/%3E%3C/svg%3E");
          filter: drop-shadow(0 3px 5px rgba(0, 0, 0, 0.3));
        }

        :global(.marker-shadow) {
          position: absolute;
          bottom: -2px;
          left: 6px;
          width: 24px;
          height: 5px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.3);
          filter: blur(2px);
        }
        
        :global(.marker-icon) {
          margin-top: -5px;
          font-size: 16px;
        }
        
        :global(.priority-indicator) {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #e74c3c;
          border: 2px solid white;
          box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.2);
        }
        
        :global(.marker-hover) {
          z-index: 1000 !important;
        }
        
        :global(.marker-hover .marker-container) {
          transform: scale(1.1);
        }
        
        :global(.marker-active .marker-container) {
          transform: scale(1.15);
        }
        
        :global(.marker-active .marker-pin) {
          filter: drop-shadow(0 5px 8px rgba(0, 0, 0, 0.5));
        }
        
        :global(.pulse-ring) {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: rgba(52, 152, 219, 0.4);
          animation: pulse-animation 2s infinite;
          z-index: -1;
        }
        
        @keyframes pulse-animation {
          0% {
            transform: translateX(-50%) scale(0.8);
            opacity: 1;
          }
          70% {
            transform: translateX(-50%) scale(2);
            opacity: 0;
          }
          100% {
            transform: translateX(-50%) scale(0.8);
            opacity: 0;
          }
        }
        
        :global(.civic-popup .leaflet-popup-content-wrapper) {
          border-radius: 8px;
          box-shadow: 0 3px 20px rgba(0, 0, 0, 0.15);
          overflow: hidden;
          padding: 0;
        }
        
        :global(.civic-popup .leaflet-popup-content) {
          margin: 0;
          width: auto !important;
        }
        
        :global(.civic-popup .leaflet-popup-tip) {
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
        }
        
        :global(.custom-popup) {
          font-family: var(--font-primary);
        }
        
        :global(.popup-header) {
          padding: 12px 15px;
          border-bottom: 3px solid;
        }
        
        :global(.popup-header h3) {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }
        
        :global(.popup-content) {
          padding: 15px;
        }
        
        :global(.popup-badges) {
          display: flex;
          align-items: center;
          margin-bottom: 10px;
          flex-wrap: wrap;
          gap: 8px;
        }
        
        :global(.popup-badge) {
          padding: 3px 8px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.5px;
          color: white;
        }
        
        :global(.popup-type) {
          padding: 3px 8px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.3px;
          background: #f1f2f6;
          color: #555;
        }
        
        :global(.popup-description) {
          font-size: 13px;
          line-height: 1.5;
          margin: 10px 0;
          color: #444;
        }
        
        :global(.popup-meta) {
          background: #f8f9fa;
          padding: 10px;
          border-radius: 6px;
          font-size: 12px;
          margin: 12px 0;
        }
        
        :global(.meta-item) {
          margin-bottom: 5px;
        }
        
        :global(.popup-image) {
          margin: 10px 0;
          border-radius: 6px;
          overflow: hidden;
        }
        
        :global(.popup-image img) {
          width: 100%;
          height: auto;
          display: block;
        }
        
        :global(.popup-button) {
          background: var(--primary);
          color: white;
          border: none;
          padding: 10px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          width: 100%;
          font-size: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
          margin-top: 8px;
        }
        
        :global(.popup-button:hover) {
          background: var(--primary-light);
        }
        
        :global(.button-icon) {
          margin-right: 6px;
        }
        
        :global(.priority-dot) {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 5px;
        }
        
        :global(.priority-low) {
          background-color: #27ae60;
        }
        
        :global(.priority-medium) {
          background-color: #3498db;
        }
        
        :global(.priority-high) {
          background-color: #f39c12;
        }
        
        :global(.priority-urgent) {
          background-color: #e74c3c;
        }
        
        /* Type-specific marker styles */
        :global(.garbage-marker .marker-pin) { 
          filter: drop-shadow(0 3px 5px rgba(149, 165, 166, 0.5));
        }
        
        :global(.pothole-marker .marker-pin) { 
          filter: drop-shadow(0 3px 5px rgba(211, 84, 0, 0.5)); 
        }
        
        :global(.animal-marker .marker-pin) { 
          filter: drop-shadow(0 3px 5px rgba(142, 68, 173, 0.5)); 
        }
        
        :global(.light-marker .marker-pin) { 
          filter: drop-shadow(0 3px 5px rgba(241, 196, 15, 0.5)); 
        }
        
        :global(.water-marker .marker-pin) { 
          filter: drop-shadow(0 3px 5px rgba(52, 152, 219, 0.5)); 
        }
        
        :global(.other-marker .marker-pin) { 
          filter: drop-shadow(0 3px 5px rgba(44, 62, 80, 0.5)); 
        }
      `}</style>
    </div>
  );
};

export default ComplaintMap;