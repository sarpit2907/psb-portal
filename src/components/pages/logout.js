import React, { useEffect } from 'react';
import { auth } from '../../firebase.js';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const performLogout = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const idToken = await user.getIdToken();

          // Sign out from Firebase
          await signOut(auth);

          // Optionally, notify the server to destroy session
          await axios.post('http://localhost:3001/logout', {}, {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
            withCredentials: true,
          });

          window.localStorage.removeItem("auth");
          window.sessionStorage.removeItem("data");
          navigate('/login');
        }
      } catch (error) {
        console.error('Logout error:', error);
      }
    };

    performLogout();
  }, [navigate]);

  return (
    <div className="w-full h-screen flex items-center justify-center">
      <p>Logging out...</p>
    </div>
  );
};

export default Logout;
