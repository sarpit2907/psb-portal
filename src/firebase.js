import { initializeApp} from 'firebase/app';
import { getFirestore } from 'firebase/firestore'
import {
  getAuth,
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  GithubAuthProvider,
  FacebookAuthProvider,
  TwitterAuthProvider,
  OAuthProvider,
  signInWithPopup
} from 'firebase/auth';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyASP3MFv2666fh7iUz1kaWDTdVPyJNCWuU",
  authDomain: "psb-portal.firebaseapp.com",
  databaseURL: "https://psb-portal-default-rtdb.firebaseio.com",
  projectId: "psb-portal",
  storageBucket: "psb-portal.appspot.com",
  messagingSenderId: "748405053842",
  appId: "1:748405053842:web:045d9864307d5d7f4e894b",
  measurementId: "G-6L9GQ9BCP0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
auth.language="en";
const db = getFirestore(app);

// Social Media Providers
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();
// const facebookProvider = new FacebookAuthProvider();
// const twitterProvider = new TwitterAuthProvider();
const microsoftProvider = new OAuthProvider('microsoft.com');


// Export everything needed for social login
export { 
  app,
  auth,
  googleProvider,
  microsoftProvider,
  githubProvider,
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  db,
  signInWithPopup,
};
