import { signal } from '@lit-labs/signals';
import { AsyncComputed } from 'signal-utils/async-computed';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase/firebase-config';

export interface PromptFragment {
  id?: string;
  key: string;      // Mnemonic name (what user sees)
  value: string;    // Actual prompt text (what gets inserted)  
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Signal for triggering refresh of prompt fragments
export const refreshPromptFragments = signal(0);

/**
 * Load all prompt fragments from Firestore
 */
export const loadPromptFragmentsAsync = () => 
  new AsyncComputed(async () => {
    // Watch for refresh trigger
    refreshPromptFragments.get();
    
    try {
      const fragmentsCollection = collection(db, 'promptFragments');
      const fragmentsQuery = query(fragmentsCollection, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(fragmentsQuery);
      
      const fragments: PromptFragment[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PromptFragment));

      return {
        success: true,
        fragments
      };
    } catch (error) {
      console.error('Error loading prompt fragments:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        fragments: []
      };
    }
  });

/**
 * Save a new prompt fragment to Firestore
 */
export const savePromptFragmentAsync = (fragment: Omit<PromptFragment, 'id' | 'createdAt' | 'updatedAt'>) =>
  new AsyncComputed(async () => {
    try {
      // Check for duplicate keys
      const existingFragments = await getDocs(collection(db, 'promptFragments'));
      const duplicateKey = existingFragments.docs.some(doc => 
        doc.data().key === fragment.key
      );
      
      if (duplicateKey) {
        return {
          success: false,
          error: `A prompt fragment with key "${fragment.key}" already exists`
        };
      }

      const now = Timestamp.now();
      const fragmentWithTimestamps = {
        ...fragment,
        createdAt: now,
        updatedAt: now
      };

      const docRef = await addDoc(collection(db, 'promptFragments'), fragmentWithTimestamps);
      
      // Trigger refresh of fragments list
      refreshPromptFragments.set(refreshPromptFragments.get() + 1);
      
      return {
        success: true,
        id: docRef.id,
        fragment: { ...fragmentWithTimestamps, id: docRef.id }
      };
    } catch (error) {
      console.error('Error saving prompt fragment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });