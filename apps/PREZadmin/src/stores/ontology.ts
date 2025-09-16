import { signal } from '@lit-labs/signals';
import { AsyncComputed } from 'signal-utils/async-computed';
import { doc, setDoc, getDoc, serverTimestamp, collection, getDocs, query, orderBy, startAt, endAt } from 'firebase/firestore';
import { db } from '../firebase/firebase-config';

// Signal for tracking ontology operations
export const ontologyOperationStatus = signal<'idle' | 'saving' | 'error'>('idle');
export const lastOntologyError = signal<string | null>(null);

// Ontology document interface
export interface OntologyDocument {
  concept: string;
  createdAt: any; // Firestore timestamp
  // That's it. Let the relationships emerge organically through queries.
}

/**
 * Check if a concept exists in the ontology collection
 * @param conceptName - The concept name to check
 * @returns AsyncComputed that resolves to boolean
 */
export function createConceptExistsComputed(conceptName: string) {
  return new AsyncComputed(async () => {
    const validation = validateConcept(conceptName);
    if (!validation.isValid) {
      return false;
    }
    
    const normalizedConcept = normalizeConcept(conceptName);
    
    try {
      const conceptDoc = doc(db, 'ontology', normalizedConcept);
      const docSnapshot = await getDoc(conceptDoc);
      return docSnapshot.exists();
    } catch (error) {
      console.error(`Error checking if concept "${conceptName}" exists:`, error);
      return false;
    }
  });
}

/**
 * Save a single concept to the ontology collection if it doesn't already exist
 * @param conceptName - The concept name to save
 * @returns Promise<boolean> - true if concept was created or already existed, false on error
 */
export async function saveConceptIfNew(conceptName: string): Promise<boolean> {
  // Validate the concept first
  const validation = validateConcept(conceptName);
  if (!validation.isValid) {
    console.error(`Invalid concept "${conceptName}": ${validation.error}`);
    return false;
  }

  const normalizedConcept = normalizeConcept(conceptName);

  try {
    // Check if concept already exists first
    const conceptDoc = doc(db, 'ontology', normalizedConcept);
    const docSnapshot = await getDoc(conceptDoc);
    
    if (docSnapshot.exists()) {
      // Concept already exists, no need to create
      return true;
    }

    // Create new concept document
    const conceptData: OntologyDocument = {
      concept: normalizedConcept,
      createdAt: serverTimestamp(),
    };

    await setDoc(conceptDoc, conceptData);
    return true;

  } catch (error) {
    console.error(`Error saving concept "${normalizedConcept}":`, error);
    return false;
  }
}

/**
 * Save a concept to the ontology collection (fire-and-forget with error handling)
 * @param conceptName - The concept name to save
 * @returns Promise<void> - Sets signals for status tracking
 */
export async function saveConcept(conceptName: string): Promise<void> {
  if (!conceptName || !conceptName.trim()) {
    return;
  }

  ontologyOperationStatus.set('saving');
  lastOntologyError.set(null);

  try {
    const success = await saveConceptIfNew(conceptName);

    if (success) {
      ontologyOperationStatus.set('idle');
      // Refresh concept lists after saving new concept
    } else {
      ontologyOperationStatus.set('error');
      lastOntologyError.set('Failed to save concept');
    }
  } catch (error) {
    ontologyOperationStatus.set('error');
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    lastOntologyError.set(errorMessage);
    console.error('Error in saveConcept:', error);
  }
}

/**
 * Get all concepts from the ontology collection
 * @returns AsyncComputed that resolves to array of concept names
 */
export function createAllConceptsComputed() {
  return new AsyncComputed(async () => {
    try {
      const ontologyCollection = collection(db, 'ontology');
      const ontologyQuery = query(ontologyCollection, orderBy('concept'));
      const querySnapshot = await getDocs(ontologyQuery);
      
      return querySnapshot.docs.map(doc => doc.data().concept as string);
    } catch (error) {
      console.error('Error fetching all concepts:', error);
      return [];
    }
  });
}

/**
 * Search concepts by prefix
 * @param prefix - The prefix to search for
 * @returns AsyncComputed that resolves to array of matching concept names
 */
export function createConceptSearchComputed(prefix: string) {
  return new AsyncComputed(async () => {
    if (!prefix || !prefix.trim()) {
      return [];
    }

    const normalizedPrefix = normalizeConcept(prefix.trim());
    
    try {
      const ontologyCollection = collection(db, 'ontology');
      const searchQuery = query(
        ontologyCollection,
        orderBy('concept'),
        startAt(normalizedPrefix),
        endAt(normalizedPrefix + '\uf8ff')
      );
      
      const querySnapshot = await getDocs(searchQuery);
      return querySnapshot.docs.map(doc => doc.data().concept as string);
    } catch (error) {
      console.error(`Error searching concepts with prefix "${prefix}":`, error);
      return [];
    }
  });
}

/**
 * Validate a concept name
 * @param conceptName - The concept name to validate
 * @returns Object with isValid boolean and optional error message
 */
export function validateConcept(conceptName: string): { isValid: boolean; error?: string } {
  if (!conceptName || !conceptName.trim()) {
    return { isValid: false, error: 'Concept cannot be empty' };
  }

  const trimmed = conceptName.trim();
  
  if (trimmed.includes(',')) {
    return { isValid: false, error: 'Concepts should not contain commas' };
  }

  if (trimmed.length > 100) {
    return { isValid: false, error: 'Concept name should be under 100 characters' };
  }

  return { isValid: true };
}

/**
 * Normalize a concept name for consistent storage
 * @param conceptName - The concept name to normalize
 * @returns Normalized concept name (trimmed and lowercased)
 */
export function normalizeConcept(conceptName: string): string {
  return conceptName.trim().toLowerCase();
}

/**
 * Save concepts from multiple metadata fields to the ontology collection
 * @param metadataFields - Array of metadata field values (isA, childOf, hasA, etc.)
 * @returns Promise<void>
 */
export async function saveAllMetadataConcepts(metadataFields: string[]): Promise<void> {
  const promises: Promise<void>[] = [];

  for (const fieldValue of metadataFields) {
    if (fieldValue && fieldValue.trim()) {
      // Split comma-separated values and save each concept
      const concepts = fieldValue.split(',').map(concept => concept.trim()).filter(concept => concept.length > 0);
      
      for (const concept of concepts) {
        promises.push(saveConcept(concept));
      }
    }
  }

  await Promise.all(promises);
}