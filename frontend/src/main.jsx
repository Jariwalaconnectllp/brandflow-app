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
            background: '#172722',
            color: '#eef5f1',
            border: '1px solid rgba(202,224,214,0.12)',
            borderRadius: '10px',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '14px'
          },
          success: { iconTheme: { primary: '#74d39f', secondary: '#172722' } },
          error: { iconTheme: { primary: '#ff7f8f', secondary: '#172722' } }
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
