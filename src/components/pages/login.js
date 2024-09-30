import React, { useState } from "react";
import { auth, googleProvider, githubProvider, microsoftProvider } from "../../firebase.js";
import { signInWithEmailAndPassword, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState('');
  const [need2FA, setNeed2FA] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // Handle Email/Password Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');
  
    try {
      const response = await axios.post('http://localhost:3001/login', {
        email,
        password,
      }, {
        withCredentials: true,
      });
      
      if (response.data.twoFactorRequired) {
        setNeed2FA(true);
        // Store userId in session or state for later use in 2FA verification
        window.sessionStorage.setItem("userId", response.data.userId);
      } else if (response.data.message === "Logged in successfully.") {
        window.localStorage.setItem("auth", "true");
        window.sessionStorage.setItem("data", JSON.stringify(response.data.data));
        navigate("/home");
      } else {
        setMessage(response.data.error || "Login failed.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setMessage(error.response?.data?.error || error.message || "Login failed.");
    }
  };
  

  // Handle 2FA Verification
  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      // Get current user
      const user = auth.currentUser;
      if (!user) {
        setMessage("User not authenticated.");
        return;
      }

      const idToken = await user.getIdToken(true); // Refresh token

      // Send 2FA token to server for verification
      const response = await axios.post('http://localhost:3001/login-2fa', { token }, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        withCredentials: true,
      });

      if (response.data.message === "2FA verification successful.") {
        window.localStorage.setItem("auth", "true");
        navigate("/home");
      } else {
        setMessage(response.data.error || "2FA verification failed.");
      }
    } catch (error) {
      console.error("2FA verification error:", error);
      setMessage(error.response?.data?.error || "2FA verification error.");
    }
  };

  // Social Login Handler
  const signInWithProvider = async (provider) => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const idToken = await user.getIdToken();

      // Send ID token to server to handle session creation or additional checks
      const response = await axios.post('http://localhost:3001/login', {}, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        withCredentials: true,
      });

      if (response.data.twoFactorRequired) {
        setNeed2FA(true);
      } else if (response.data.message === "Logged in successfully.") {
        window.localStorage.setItem("auth", "true");
        window.sessionStorage.setItem("data", JSON.stringify(response.data.data));
        navigate("/home");
      } else {
        setMessage(response.data.error || "Login failed.");
      }
    } catch (error) {
      console.error("Social login error:", error);
      setMessage(error.response?.data?.error || "Social login failed.");
    }
  };

  return (
    <div className="w-full h-screen bg-blue-200 flex items-center justify-center">
      <div className="w-full max-w-lg bg-white px-8 py-6 rounded-lg shadow-md">
        <h1 className="text-3xl text-center font-semibold text-zinc-700 mb-4">
            PSB
        </h1>
        <p className="text-center text-md mb-4">Login to continue</p>

        {/* Display either Login Form or 2FA Form */}
        {!need2FA ? (
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-blue-500 text-white rounded-full py-2 px-4 font-semibold"
            >
              Login
            </button>

            {/* Error Message */}
            {message && <p className="text-red-500 text-center">{message}</p>}
          </form>
        ) : (
          <form onSubmit={handleVerify2FA} className="space-y-4">
            {/* 2FA Token */}
            <div>
              <label htmlFor="token" className="block text-sm font-medium text-gray-700">2FA Code</label>
              <input
                id="token"
                name="token"
                type="text"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Enter code from authenticator app"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
              />
            </div>

            {/* Verify Button */}
            <button
              type="submit"
              className="w-full bg-blue-500 text-white rounded-full py-2 px-4 font-semibold"
            >
              Verify 2FA
            </button>

            {/* Error Message */}
            {message && <p className="text-red-500 text-center">{message}</p>}
          </form>
        )}

        {/* Social Login Buttons */}
        <div className="my-4 flex flex-col items-center">
          <button
            className="w-full bg-red-500 text-white rounded-full py-2 my-1"
            onClick={() => signInWithProvider(googleProvider)}
          >
            Continue with Google
          </button>
          <button
            className="w-full bg-green-600 text-white rounded-full py-2 my-1"
            onClick={() => signInWithProvider(microsoftProvider)}
          >
            Continue with Microsoft
          </button>
          <button
            className="w-full bg-gray-800 text-white rounded-full py-2 my-1"
            onClick={() => signInWithProvider(githubProvider)}
          >
            Continue with Github
          </button>
        </div>

        {/* Redirect to Register */}
        <a href="/register" className="block text-center text-sm font-semibold mt-4 text-red-600">
          New member? Register
        </a>
      </div>
    </div>
  );
};

export default Login;
