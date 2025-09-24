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
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  // Clear errors when user starts typing
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (emailError) setEmailError("");
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (passwordError) setPasswordError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setLoading(true);
    
    // Clear previous errors
    setEmailError("");
    setPasswordError("");

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
        // Handle login failure - don't refresh page
        if (data.message && data.message.toLowerCase().includes('email')) {
          setEmailError("Invalid email address");
        } else if (data.message && data.message.toLowerCase().includes('password')) {
          setPasswordError("Incorrect password");
        } else {
          setPasswordError("Login failed. Please check your credentials.");
        }
        return false; // Prevent any form refresh
      }
    } catch (err) {
      console.error(err);
      
      // Handle different types of errors
      if (err.response && err.response.status === 401) {
        // Unauthorized - wrong credentials
        const errorMessage = err.response.data?.message || "";
        if (errorMessage.toLowerCase().includes('email') || errorMessage.toLowerCase().includes('user')) {
          setEmailError("Email not found or invalid");
        } else if (errorMessage.toLowerCase().includes('password')) {
          setPasswordError("Incorrect password");
        } else {
          setEmailError("Invalid email address");
          setPasswordError("Incorrect password");
        }
      } else if (err.response && err.response.status === 422) {
        // Validation errors
        const errors = err.response.data?.errors || {};
        if (errors.email) {
          setEmailError(errors.email[0]);
        }
        if (errors.password) {
          setPasswordError(errors.password[0]);
        }
      } else {
        // Network or other errors
        setPasswordError("Login error. Please try again.");
      }
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
              onChange={handleEmailChange}
              className={emailError ? "error" : ""}
              required
            />
            {emailError && <div className="error-message">{emailError}</div>}

            <label>Password</label>
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={handlePasswordChange}
                className={passwordError ? "error" : ""}
                required
              />
              <span
                className="toggle-eye cursor-pointer"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </span>
            </div>
            {passwordError && <div className="error-message">{passwordError}</div>}

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
