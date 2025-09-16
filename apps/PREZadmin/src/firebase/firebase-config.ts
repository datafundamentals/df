import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: 'AIzaSyCGaJKzrUv_TgD97QLt-ydGPBbpCyCnrEw',
  authDomain: 'peg-2035.firebaseapp.com',
  projectId: 'peg-2035',
  storageBucket: 'peg-2035.appspot.com',
  messagingSenderId: '1039825199205',
  appId: '1:1039825199205:web:44d7dfd0f6f970c0ee668c',
  measurementId: 'G-FE9PXQ6LLX',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Connect to Firestore emulator in development (use production Auth)
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
  // Only connect Firestore emulator, leave Auth as production
  try {
    connectFirestoreEmulator(db, 'localhost', 8060);
    console.log('Connected to Firestore emulator (using production Auth)');
  } catch (error) {
    console.log('Firestore emulator already connected or unavailable');
  }
}
