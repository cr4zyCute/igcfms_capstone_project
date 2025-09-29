import './App.css';

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import api from './services/api'; 
import React, { useEffect } from 'react';
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

  useEffect(() => {
    api.get('/test')
      .then(response => console.log("API is Connected", response.data))
      .catch(error => console.log("API FAIL", error));
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
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}


export default App;
