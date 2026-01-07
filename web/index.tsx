import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const umamiWebsiteId = process.env.UMAMI_WEBSITE_ID;
const umamiScriptUrl = process.env.UMAMI_SCRIPT_URL || 'https://umami.edge-kite.com/script.js';

if (umamiWebsiteId && typeof document !== 'undefined') {
  const existing = document.querySelector(`script[data-website-id="${umamiWebsiteId}"]`);
  if (!existing) {
    const script = document.createElement('script');
    script.defer = true;
    script.src = umamiScriptUrl;
    script.setAttribute('data-website-id', umamiWebsiteId);
    document.head.appendChild(script);
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
