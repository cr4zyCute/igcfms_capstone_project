import './App.css';
import api from './services/api';
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/components/Login.jsx'; // ← Correct path

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
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;