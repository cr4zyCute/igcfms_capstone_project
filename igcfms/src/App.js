import './App.css';

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import api from './services/api'; 
import React, { useState, useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import Login from './components/pages/Login.jsx'; 
import Dashboard from './components/pages/Dashboard.jsx';
import Profile from './components/pages/Profile.jsx';
import Register from './components/pages/Register.jsx';

import Navbar from './components/common/Navbar.jsx';
import Sidebar from './components/common/Sidebar.jsx';

import ProtectedRoute from './components/common/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary'; 

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    api.get('/test')
      .then(response => console.log("API is Connected", response.data))
      .catch(error => console.log("API FAIL", error));
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
            {/* Main content */}
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />} />

                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />

                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />

                <Route path="/register" element={<Register />} />
              </Routes>
            </main>

        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}


export default App;
