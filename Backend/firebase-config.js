// firebase-config.js
import admin from 'firebase-admin';
import serviceAccount from './config/serviceAccount.json' assert { type: 'json' };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://psb-portal-default-rtdb.firebaseio.com"
});

const db = admin.firestore();

export {db} ;
