import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import  {db } from './firebase-config.js';
import bcrypt from "bcrypt";
import bodyParser from 'body-parser';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import jwt from 'jsonwebtoken';
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.json());

const allowedOrigins = [
  "http://localhost:3000"
];
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.static('src'));
app.use(session({
  secret: 'random',
  saveUninitialized: true,
  cookie: { secure: false }
}));
const saveUserSecret = async (userId, secret) => {
  try {
    // Update the user document with the 2FA secret
    await db.collection('user').doc(userId).update({
      twoFactorSecret: secret,
      twoFactorEnabled: true,
    });
    console.log(`2FA secret saved for user: ${userId}`);
  } catch (error) {
    console.error('Error saving 2FA secret:', error.message);
    throw new Error('Failed to save 2FA secret');
  }
};

app.post('/register', async (req, res) => {
  const { email, username, fullName, password, contactNumber } = req.body;
  
  if (!email || !username || !contactNumber || !fullName || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    // Hash the password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user in Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password
    });

    // Store additional user information in Firestore
    await db.collection('user').doc(userRecord.uid).set({
      username: username,
      email: email,
      contact: contactNumber,
      fullname: fullName,
      password: hashedPassword,  // Store the hashed password
      twoFactorEnabled: false,
      twoFactorSecret: null
    });

    // Generate a JWT token
    const token = jwt.sign({ email: userRecord.email, id: userRecord.uid }, 'random', { expiresIn: '1h' });

    // Send the JWT token as part of the response
    res.status(201).json({ message: 'User registered successfully.', token });
  } catch (error) {
    console.error('Error registering user:', error.message, error.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const userCredential = await admin.auth().getUserByEmail(email);
    const userSnapshot = await db.collection('user').doc(userCredential.uid).get();
    
    if (!userSnapshot.exists) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    const userData = userSnapshot.data();
    const passwordMatch = await bcrypt.compare(password, userData.password);
    
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    
    if (userData.twoFactorEnabled) {
      // Return flag indicating 2FA is required
      return res.status(200).json({ twoFactorRequired: true, userId: userCredential.uid });
    }
    
    const token = jwt.sign({ email: userCredential.email, id: userCredential.uid }, "random", { expiresIn: '1h' });
    window.localStorage.setItem(token);
    // return res.status(200).cookie('token', token, { httpOnly: true }).json({ message: 'Logged in successfully.', data: {...userCredential}});
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Endpoint to verify 2FA during sign-in
app.post('/login-2fa', async (req, res) => {
  const { token } = req.body;
  const userId = req.session.uid || req.body.userId; // Assuming userId is stored in session or passed

  try {
    const userDoc = await db.collection('user').doc(userId).get();

    if (!userDoc.exists || !userDoc.data().twoFactorSecret) {
      return res.status(400).json({ error: '2FA not set up' });
    }

    const secret = userDoc.data().twoFactorSecret;

    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 1,
    });

    if (verified) {
      req.session.uid = null; // Clear the session if used
      res.status(200).json({ message: '2FA verification successful.' });
    } else {
      res.status(400).json({ error: 'Invalid 2FA token' });
    }
  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/generate-2fa', (req, res) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization token provided' });
  }

  const token = authHeader.split(' ')[1]; // Extract the token after 'Bearer '

  // Verify the JWT token
  jwt.verify(token, 'your-secret-key', async (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Failed to authenticate token' });
    }

    // Extract user ID from decoded token
    const userId = decoded.id;

    // Generate a 2FA secret for the user
    const secret = speakeasy.generateSecret({ name: 'YourAppName' });

    // Save the 2FA secret to the user's document in Firestore (or your database)
    try {
      await saveUserSecret(userId, secret.base32);  // Save the base32 secret

      // Generate the QR code URL for the user to scan
      qrcode.toDataURL(secret.otpauth_url, (err, dataUrl) => {
        if (err) {
          return res.status(500).json({ error: 'Error generating QR code' });
        }
        res.json({ qrCode: dataUrl });
      });
    } catch (error) {
      console.error('Error saving 2FA secret:', error.message);
      res.status(500).json({ error: 'Failed to save 2FA secret' });
    }
  });
});



// Endpoint to verify TOTP code and enable 2FA
app.post('/verify-2fa', (req, res) => {
  const { token } = req.body;
  const userId = req.user.id; // Assuming req.user contains the authenticated user

  // Retrieve the user's secret from the database
  const userSecret = getUserSecret(userId); // Example function to get user secret

  const verified = speakeasy.totp.verify({
    secret: userSecret,
    encoding: 'base32',
    token,
  });

  if (verified) {
    // Mark 2FA as enabled for the user in the database
    enable2FAForUser(userId); // Example function
    res.json({ message: '2FA enabled successfully.' });
  } else {
    res.status(400).json({ error: 'Invalid token.' });
  }
});


// Logout Endpoint
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).json({ error: 'Could not log out.' });
    }
    res.clearCookie('connect.sid'); // Default cookie name for express-session
    res.json({ message: 'Logged out successfully.' });
  });
});

// 404 Route
app.all('*', (req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// Start Server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
