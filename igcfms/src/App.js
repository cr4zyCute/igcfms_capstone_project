import './App.css';

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import api from './services/api'; 
import React, { useEffect, useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { queryClient } from './lib/queryClient';
import Login from './components/pages/Login.jsx'; 
import Dashboard from './components/pages/Dashboard.jsx';
import Profile from './components/pages/Profile.jsx';
import Register from './components/pages/Register.jsx';

import ProtectedRoute from './components/common/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary'; 

function App() {
  // const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [ReactQueryDevtoolsComponent, setReactQueryDevtoolsComponent] = useState(null);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      import('@tanstack/react-query-devtools')
        .then(({ ReactQueryDevtools }) => {
          setReactQueryDevtoolsComponent(() => ReactQueryDevtools);
        })
        .catch(error => {
          console.warn('React Query Devtools failed to load', error);
        });
    }
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
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
        {/* React Query Devtools - only shows in development */}
        {ReactQueryDevtoolsComponent ? (
          <ReactQueryDevtoolsComponent initialIsOpen={false} />
        ) : null}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}


export default App;
