import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google'; // Importamos el proveedor
import App from './App.jsx';
import './index.css';

// Reemplaza 'TU_CLIENT_ID_DE_GOOGLE' con la clave que obtengas de Google Cloud Console
const GOOGLE_CLIENT_ID = "888538490084-oa0uld9vof5blkcni06mqs6q0uehmprs.apps.googleusercontent.com"; 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>,
);