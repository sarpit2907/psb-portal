import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { QRCodeCanvas } from 'qrcode.react';

const Enable2FA = () => {
  const [qrCode, setQrCode] = useState('');
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const generate2FA = async () => {
    const jwtToken = localStorage.getItem('token');
    console.log(jwtToken);
    if (!jwtToken) {
      setMessage('User not authenticated.');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const response = await axios.post(
        'http://localhost:3001/generate-2fa',
        {}, // No body needed, JWT is sent in the headers
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,  // Send the token in the Authorization header
          },
          withCredentials: true,  // Ensure cookies and credentials are sent if needed
        }
      );

      if (response.data.qrCode) {
        setQrCode(response.data.qrCode);  // Display the QR code from response
        setMessage('Scan the QR code with your authenticator app and enter the code below.');
      } else {
        setMessage('Failed to generate QR code.');
      }
    } catch (error) {
      console.error('Error generating 2FA:', error);
      setMessage(error.response?.data?.error || 'Error generating 2FA.');
    } finally {
      setLoading(false);
    }
  };
  

  const verify2FA = async () => {
    const jwtToken = localStorage.getItem('token');
    if (!jwtToken) {
      setMessage('User not authenticated.');
      return;
    }

    if (!token) {
      setMessage('Please enter the 2FA token.');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const response = await axios.post(
        'http://localhost:3001/verify-2fa',
        { token }, // The token entered by the user
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
          withCredentials: true,
        }
      );

      if (response.data.message === '2FA enabled successfully.') {
        setMessage('2FA verification successful.');
        setQrCode('');
        setToken('');
      } else {
        setMessage(response.data.error || 'Invalid token.');
      }
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      setMessage(error.response?.data?.error || 'Invalid token.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="w-full h-screen bg-blue-200 flex items-center justify-center">
      <div className="max-w-md bg-white px-8 py-6 rounded-lg shadow-md">
        <h2 className="text-2xl text-center font-semibold text-zinc-700 mb-4">
          Enable Two-Factor Authentication
        </h2>

        {!qrCode ? (
          <button
            onClick={generate2FA}
            className={`w-full bg-blue-500 text-white rounded-full py-2 px-4 font-semibold ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Enable 2FA'}
          </button>
        ) : (
          <div className="space-y-4">
            <p className="text-center">Scan the QR code with your authenticator app:</p>
            <div className="flex justify-center">
              <QRCodeCanvas value={qrCode} level="L" size={256} />
            </div>
            <p className="text-center">Enter the code from your authenticator app:</p>
            <input
              type="text"
              placeholder="Enter the code"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
            <button
  onClick={generate2FA}
  className={`w-full bg-blue-500 text-white rounded-full py-2 px-4 font-semibold ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
  disabled={loading}
>
  {loading ? 'Generating...' : 'Enable 2FA'}
</button>

          </div>
        )}

        {/* Message Display */}
        {message && <p className={`text-center mt-4 ${message.includes('successful') ? 'text-green-500' : 'text-red-500'}`}>{message}</p>}
      </div>
    </div>
  );
};

export default Enable2FA;
