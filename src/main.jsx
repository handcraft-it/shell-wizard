// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx'; // Importiert die App-Komponente aus derselben Ebene
import './App.css';   // Importiert das zugehörige CSS

// Startet den React-Render-Prozess
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
