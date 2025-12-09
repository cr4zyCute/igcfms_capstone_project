import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { loginUser } from "../../services/api";
import { Link, useNavigate } from "react-router-dom";
import "./css/Login.css"; 
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import loginImageOne from "../../assets/images/login/login1.png";
import loginImageTwo from "../../assets/images/login/login2.png";


const sliderImages = [loginImageOne, loginImageTwo];
const extendedSliderImages =
  sliderImages.length > 1
    ? [sliderImages[sliderImages.length - 1], ...sliderImages, sliderImages[0]]
    : sliderImages;

const SLIDE_INTERVAL_MS = 3000;
const SLIDE_DURATION_MS = 800;
const INITIAL_SLIDE_INDEX = sliderImages.length > 1 ? 1 : 0;

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [currentSlide, setCurrentSlide] = useState(INITIAL_SLIDE_INDEX);
  const [isTransitioning, setIsTransitioning] = useState(true);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (sliderImages.length <= 1) return undefined;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => prev + 1);
    }, SLIDE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (sliderImages.length <= 1) return undefined;

    if (currentSlide === extendedSliderImages.length - 1) {
      const timeout = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentSlide(1);

        requestAnimationFrame(() => {
          requestAnimationFrame(() => setIsTransitioning(true));
        });
      }, SLIDE_DURATION_MS);

      return () => clearTimeout(timeout);
    }

    if (currentSlide === 0) {
      const timeout = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentSlide(sliderImages.length);

        requestAnimationFrame(() => {
          requestAnimationFrame(() => setIsTransitioning(true));
        });
      }, SLIDE_DURATION_MS);

      return () => clearTimeout(timeout);
    }

    return undefined;
  }, [currentSlide]);

  const getActiveDot = () => {
    if (sliderImages.length <= 1) return 0;
    return (currentSlide - 1 + sliderImages.length) % sliderImages.length;
  };

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

        // Navigate immediately without blocking alert
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
            <h1>IGCFMS</h1>
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

          {/* <p className="register">
            Don't have an account?{" "}
            <Link to="/register" className="text-blue-600 hover:text-blue-500">
              Register here
            </Link>
          </p> */}
        </div>
      </div>

      {/* Right Panel */}
      <div className="right-panel">
        <div className="image-slider" aria-label="System preview slideshow">
          <div
            className="image-slider-track"
            style={{
              transform: `translateX(-${currentSlide * 100}%)`,
              transition: isTransitioning
                ? `transform ${SLIDE_DURATION_MS}ms ease-in-out`
                : "none",
            }}
          >
            {extendedSliderImages.map((imageSrc, index) => (
              <div className="image-slide" key={`${imageSrc}-${index}`}>
                <img src={imageSrc} alt={`IGCFMS preview ${index + 1}`} />
              </div>
            ))}
          </div>

          <div className="slider-dots" role="tablist">
            {sliderImages.map((_, index) => (
              <button
                key={index}
                type="button"
                className={`slider-dot ${getActiveDot() === index ? "active" : ""}`}
                onClick={() => {
                  setIsTransitioning(true);
                  setCurrentSlide(sliderImages.length > 1 ? index + 1 : 0);
                }}
                aria-label={`Show image ${index + 1}`}
                aria-selected={getActiveDot() === index}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
