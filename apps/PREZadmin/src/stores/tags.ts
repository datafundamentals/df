import { signal } from '@lit-labs/signals';
import { AsyncComputed } from 'signal-utils/async-computed';
import { doc, setDoc, getDoc, serverTimestamp, collection, getDocs, query, orderBy, startAt, endAt } from 'firebase/firestore';
import { db } from '../firebase/firebase-config';

// Signal for tracking tag operations
export const tagOperationStatus = signal<'idle' | 'saving' | 'error'>('idle');
export const lastTagError = signal<string | null>(null);

// Tag document interface
export interface TagDocument {
  name: string;
  createdAt: any; // Firestore timestamp
}

/**
 * Parse comma-separated tags string into individual tag names
 * @param tagsString - Comma-separated string like "foo, bar, baz"
 * @returns Array of trimmed, non-empty tag names
 */
export function parseTagsString(tagsString: string): string[] {
  if (!tagsString || typeof tagsString !== 'string') {
    return [];
  }
  
  return tagsString
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);
}

/**
 * Check if a tag exists in Firestore
 * @param tagName - The tag name to check
 * @returns AsyncComputed that resolves to boolean
 */
export function createTagExistsComputed(tagName: string) {
  return new AsyncComputed(async () => {
    if (!tagName.trim()) {
      return false;
    }
    
    try {
      const tagDoc = doc(db, 'tags', tagName.trim());
      const docSnapshot = await getDoc(tagDoc);
      return docSnapshot.exists();
    } catch (error) {
      console.error(`Error checking if tag "${tagName}" exists:`, error);
      return false;
    }
  });
}

/**
 * Save a single tag to Firestore if it doesn't already exist
 * @param tagName - The tag name to save
 * @returns Promise<boolean> - true if tag was created or already existed, false on error
 */
export async function saveTagIfNew(tagName: string): Promise<boolean> {
  const trimmedTag = tagName.trim();
  if (!trimmedTag) {
    return false;
  }

  try {
    // Check if tag already exists first
    const tagDoc = doc(db, 'tags', trimmedTag);
    const docSnapshot = await getDoc(tagDoc);
    
    if (docSnapshot.exists()) {
      // Tag already exists, no need to create
      return true;
    }

    // Create new tag document
    const tagData: TagDocument = {
      name: trimmedTag,
      createdAt: serverTimestamp(),
    };

    await setDoc(tagDoc, tagData);
    return true;

  } catch (error) {
    console.error(`Error saving tag "${trimmedTag}":`, error);
    return false;
  }
}

/**
 * Save multiple tags to Firestore (fire-and-forget with error handling)
 * @param tagsString - Comma-separated string of tags
 * @returns Promise<void> - Sets signals for status tracking
 */
export async function saveTagsFromString(tagsString: string): Promise<void> {
  const tags = parseTagsString(tagsString);
  
  if (tags.length === 0) {
    return;
  }

  tagOperationStatus.set('saving');
  lastTagError.set(null);

  try {
    // Save all tags concurrently
    const results = await Promise.allSettled(
      tags.map(tag => saveTagIfNew(tag))
    );

    // Check for any failures
    const failures = results.filter(result => 
      result.status === 'rejected' || 
      (result.status === 'fulfilled' && !result.value)
    );

    if (failures.length > 0) {
      const errorMessage = `Failed to save ${failures.length} of ${tags.length} tags`;
      lastTagError.set(errorMessage);
      tagOperationStatus.set('error');
      
      // Show alert as requested (anti-pattern but acceptable for now)
      alert(errorMessage);
    } else {
      tagOperationStatus.set('idle');
    }

  } catch (error) {
    const errorMessage = `Failed to save tags: ${error instanceof Error ? error.message : 'Unknown error'}`;
    lastTagError.set(errorMessage);
    tagOperationStatus.set('error');
    
    // Show alert as requested
    alert(errorMessage);
  }
}

/**
 * Convenience function to save tags from multiple metadata fields
 * @param allTags - Array of tag strings from different metadata fields
 */
export async function saveAllMetadataTags(allTags: string[]): Promise<void> {
  const combinedTags = allTags
    .filter(tagString => tagString && tagString.trim())
    .join(', ');
    
  await saveTagsFromString(combinedTags);
  
  // Refresh tag lists after saving new tags
  refreshTagLists();
}

/**
 * Fetch all existing tags from Firestore
 * @returns AsyncComputed that resolves to array of tag names
 */
export function createAllTagsComputed() {
  return new AsyncComputed(async () => {
    try {
      const tagsCollection = collection(db, 'tags');
      const tagsQuery = query(tagsCollection, orderBy('name'));
      const querySnapshot = await getDocs(tagsQuery);
      
      const tags: string[] = [];
      querySnapshot.forEach((doc) => {
        const tagData = doc.data() as TagDocument;
        tags.push(tagData.name);
      });
      
      return tags;
    } catch (error) {
      console.error('Error fetching all tags:', error);
      return [];
    }
  });
}

/**
 * Search for tags that start with a given prefix
 * @param prefix - The prefix to search for
 * @returns AsyncComputed that resolves to array of matching tag names
 */
export function createTagSearchComputed(prefix: string) {
  return new AsyncComputed(async () => {
    if (!prefix || prefix.trim().length === 0) {
      return [];
    }
    
    const searchPrefix = prefix.trim().toLowerCase();
    
    try {
      const tagsCollection = collection(db, 'tags');
      const tagsQuery = query(
        tagsCollection,
        orderBy('name'),
        startAt(searchPrefix),
        endAt(searchPrefix + '\uf8ff')
      );
      
      const querySnapshot = await getDocs(tagsQuery);
      
      const matchingTags: string[] = [];
      querySnapshot.forEach((doc) => {
        const tagData = doc.data() as TagDocument;
        if (tagData.name.toLowerCase().startsWith(searchPrefix)) {
          matchingTags.push(tagData.name);
        }
      });
      
      return matchingTags;
    } catch (error) {
      console.error(`Error searching tags with prefix "${prefix}":`, error);
      return [];
    }
  });
}

/**
 * Signal to trigger tag list refresh
 */
export const tagListRefreshTrigger = signal<number>(0);

/**
 * Trigger a refresh of tag lists (call after creating new tags)
 */
export function refreshTagLists() {
  tagListRefreshTrigger.set(tagListRefreshTrigger.get() + 1);
}