import { computed, signal } from '@lit-labs/signals';
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, User } from 'firebase/auth';
import { auth } from '../firebase/firebase-config';
import { setPlayerUid } from './player';
import { setPageAuthorUid } from './page-author';

// Create a signal for user authentication state
export const userSignal = signal<User | null>(null);

// Computed signal to track if the user is logged in
export const isLoggedIn = computed(() => userSignal.get() !== null);

// Function to sign in using Google
export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    userSignal.set(result.user);
    setPageAuthorUid(result.user.uid);
    setPlayerUid(result.user.uid);
  } catch (error) {
    console.error('Error signing in with Google:', error);
  }
};

export const signOut = async () => {
  try {
    auth.signOut();
  } catch (error) {
    console.error('Error signing out:', error);
  }
};

// Automatically update userSignal when auth state changes
onAuthStateChanged(auth, user => {
  if (user) {
    userSignal.set(user);
  } else {
    userSignal.set(null); // User is logged out
  }
});
