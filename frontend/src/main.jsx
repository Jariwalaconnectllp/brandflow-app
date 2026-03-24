import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#181c35',
            color: '#f0f2ff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '14px'
          },
          success: { iconTheme: { primary: '#3ecf8e', secondary: '#181c35' } },
          error: { iconTheme: { primary: '#f56565', secondary: '#181c35' } }
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
