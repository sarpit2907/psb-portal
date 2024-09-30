import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile,getAuth,setPersistence, browserLocalPersistence } from 'firebase/auth';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
const auth = getAuth();
const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const response = await axios.post('http://localhost:3001/register', {
        username,
        email,
        fullName,
        password,
        contactNumber        
      });
      const { token } = response.data;
      localStorage.setItem('token', token);
      if (response.data.message === 'User registered successfully.') {
      navigate('/enable2fa');
      }
      else
      {
        console.error('Registration failed:', response.data);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setMessage(error.message || 'Registration failed.');
    }
  };

  return (
    <div className="w-full h-screen bg-blue-200 flex items-center justify-center">
      <div className="w-1/3 bg-white px-8 py-6 rounded-lg shadow-md">
        <h1 className="text-3xl text-center font-semibold text-zinc-700 mb-4">
          Register
        </h1>
        <p className="text-center text-md mb-4">Sign up to get started</p>
        <form onSubmit={handleRegister} className="space-y-4">
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

          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          {/* Full Name */}
          <div>
            <label htmlFor="fullname" className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              id="fullname"
              name="fullname"
              type="text"
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          {/* Contact Number */}
          <div>
            <label htmlFor="contact" className="block text-sm font-medium text-gray-700">Contact Number</label>
            <input
              id="contact"
              name="contact"
              type="tel"
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Contact Number"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
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
            Register
          </button>

          {/* Error Message */}
          {message && <p className="text-red-500 text-center">{message}</p>}
        </form>

        {/* Redirect to Login */}
        <a href="/login" className="block text-center text-sm font-semibold mt-4 text-red-600">
          Already a member? Log in
        </a>
      </div>
    </div>
  );
};

export default Register;
