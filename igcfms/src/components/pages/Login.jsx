import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { loginUser } from "../../services/api";
import { Link, useNavigate } from "react-router-dom";
import "./css/Login.css"; 
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";


const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await loginUser(email, password);

     
      const token = data.access_token || data.token;
      if (token) {
        
        localStorage.setItem('auth_token', token);

        const userData = {
          email,
          role: data.role,
        };

        login(userData, token);

        alert("Login successful! Role: " + data.role);
        navigate("/dashboard");
      } else {
        alert(data.message || "Login failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Login error. Check console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      {/* Left Panel */}
      <div className="left-panel">
        <div className="left-content">
          <div className="header">
            <h1>ICGFMS</h1>
            <p> Integrated Government Cashiering and Financial Management System </p>
          </div>


          {/* Login Form */}
          <form onSubmit={handleSubmit} className="login-form">
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label>Password</label>
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span
                className="toggle-eye cursor-pointer"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </span>
            </div>

            <button type="submit" className="continue-btn" disabled={loading}>
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>

          <p className="register">
            Don't have an account?{" "}
            <Link to="/register" className="text-blue-600 hover:text-blue-500">
              Register here
            </Link>
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="right-panel">
        <img src="/your-image.png" alt="IGCFMS Preview" />
        {/* place your-image.png inside the public/ folder */}
      </div>
    </div>
  );
};

export default Login;
