import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { loginUser } from '../../services/api';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate(); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await loginUser(email, password);

      if (data.access_token) {
        // Build userData from response
        const userData = {
          email,
          role: data.role,
        };

       
        login(userData, data.access_token);

        alert('Login successful! Role: ' + data.role);
        navigate('/dashboard'); 
      } else {
        alert(data.message || 'Login failed.');
      }
    } catch (err) {
      console.error(err);
      alert('Login error. Check console.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p className="text-center mt-4">
        Don't have an account?{' '}
        <Link to="/register" className="text-blue-600 hover:text-blue-500">
          Register here
        </Link>
      </p>
    </div>
  );
};

export default Login;
