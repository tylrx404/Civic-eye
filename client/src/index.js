import React from 'react';
import ReactDOM from 'react-dom/client';
import './App.css';
import App from './App';

// Import Leaflet CSS for maps
import 'leaflet/dist/leaflet.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);