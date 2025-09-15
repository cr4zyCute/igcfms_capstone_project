import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import api from './services/api'; 
import React, { useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import Login from './components/pages/Login.jsx'; 
import Dashboard from './components/pages/Dashboard.jsx';
import Profile from './components/pages/Profile.jsx';

import ProtectedRoute from './components/common/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary'; 

function App() {
  // API connection test
  useEffect(() => {
    api.get('/test')
      .then(response => {
        console.log("API is Connected", response.data);
      })
      .catch(error => {
        console.log("API FAIL", error);
      });
  }, []);

  return (
     <ErrorBoundary> {/* ← Wrap everything with ErrorBoundary */}
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute> {/* ← Protect this route */}
                <Dashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/profile" element={
              <ProtectedRoute> {/* ← Protect this route */}
                <Profile />
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
