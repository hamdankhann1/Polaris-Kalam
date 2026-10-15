import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { Analytics } from '@vercel/analytics/react';

/**
 * React 19 Entrypoint
 * Mounts the Polaris Landing Page application to #root in index.html.
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Analytics />
  </React.StrictMode>
);
