import { signal } from '@lit-labs/signals';
import { AsyncComputed } from 'signal-utils/async-computed';
import { doc, setDoc, getDoc, serverTimestamp, collection, getDocs, query, orderBy, startAt, endAt } from 'firebase/firestore';
import { db } from '../firebase/firebase-config';

// Signal for tracking category operations
export const categoryOperationStatus = signal<'idle' | 'saving' | 'error'>('idle');
export const lastCategoryError = signal<string | null>(null);

// Category document interface
export interface CategoryDocument {
  name: string;
  createdAt: any; // Firestore timestamp
}

/**
 * Check if a category exists in Firestore
 * @param categoryName - The category name to check
 * @returns AsyncComputed that resolves to boolean
 */
export function createCategoryExistsComputed(categoryName: string) {
  return new AsyncComputed(async () => {
    const validation = validateCategory(categoryName);
    if (!validation.isValid) {
      return false;
    }
    
    const normalizedCategory = normalizeCategory(categoryName);
    
    try {
      const categoryDoc = doc(db, 'categories', normalizedCategory);
      const docSnapshot = await getDoc(categoryDoc);
      return docSnapshot.exists();
    } catch (error) {
      console.error(`Error checking if category "${categoryName}" exists:`, error);
      return false;
    }
  });
}

/**
 * Save a single category to Firestore if it doesn't already exist
 * @param categoryName - The category name to save
 * @returns Promise<boolean> - true if category was created or already existed, false on error
 */
export async function saveCategoryIfNew(categoryName: string): Promise<boolean> {
  // Validate the category first
  const validation = validateCategory(categoryName);
  if (!validation.isValid) {
    console.error(`Invalid category "${categoryName}": ${validation.error}`);
    return false;
  }

  const normalizedCategory = normalizeCategory(categoryName);

  try {
    // Check if category already exists first
    const categoryDoc = doc(db, 'categories', normalizedCategory);
    const docSnapshot = await getDoc(categoryDoc);
    
    if (docSnapshot.exists()) {
      // Category already exists, no need to create
      return true;
    }

    // Create new category document
    const categoryData: CategoryDocument = {
      name: normalizedCategory,
      createdAt: serverTimestamp(),
    };

    await setDoc(categoryDoc, categoryData);
    return true;

  } catch (error) {
    console.error(`Error saving category "${normalizedCategory}":`, error);
    return false;
  }
}

/**
 * Save a category to Firestore (fire-and-forget with error handling)
 * @param categoryName - The category name to save
 * @returns Promise<void> - Sets signals for status tracking
 */
export async function saveCategory(categoryName: string): Promise<void> {
  if (!categoryName || !categoryName.trim()) {
    return;
  }

  categoryOperationStatus.set('saving');
  lastCategoryError.set(null);

  try {
    const success = await saveCategoryIfNew(categoryName);

    if (success) {
      categoryOperationStatus.set('idle');
      // Refresh category lists after saving new category
      refreshCategoryLists();
    } else {
      const errorMessage = `Failed to save category "${categoryName}"`;
      lastCategoryError.set(errorMessage);
      categoryOperationStatus.set('error');
      
      // Show alert like tags do (anti-pattern but consistent)
      alert(errorMessage);
    }

  } catch (error) {
    const errorMessage = `Failed to save category: ${error instanceof Error ? error.message : 'Unknown error'}`;
    lastCategoryError.set(errorMessage);
    categoryOperationStatus.set('error');
    
    // Show alert like tags do
    alert(errorMessage);
  }
}

/**
 * Fetch all existing categories from Firestore
 * @returns AsyncComputed that resolves to array of category names
 */
export function createAllCategoriesComputed() {
  return new AsyncComputed(async () => {
    try {
      const categoriesCollection = collection(db, 'categories');
      const categoriesQuery = query(categoriesCollection, orderBy('name'));
      const querySnapshot = await getDocs(categoriesQuery);
      
      const categories: string[] = [];
      querySnapshot.forEach((doc) => {
        const categoryData = doc.data() as CategoryDocument;
        categories.push(categoryData.name);
      });
      
      return categories;
    } catch (error) {
      console.error('Error fetching all categories:', error);
      return [];
    }
  });
}

/**
 * Search for categories that start with a given prefix
 * @param prefix - The prefix to search for
 * @returns AsyncComputed that resolves to array of matching category names
 */
export function createCategorySearchComputed(prefix: string) {
  return new AsyncComputed(async () => {
    if (!prefix || prefix.trim().length === 0) {
      return [];
    }
    
    const searchPrefix = prefix.trim().toLowerCase();
    
    try {
      const categoriesCollection = collection(db, 'categories');
      const categoriesQuery = query(
        categoriesCollection,
        orderBy('name'),
        startAt(searchPrefix),
        endAt(searchPrefix + '\uf8ff')
      );
      
      const querySnapshot = await getDocs(categoriesQuery);
      
      const matchingCategories: string[] = [];
      querySnapshot.forEach((doc) => {
        const categoryData = doc.data() as CategoryDocument;
        if (categoryData.name.toLowerCase().startsWith(searchPrefix)) {
          matchingCategories.push(categoryData.name);
        }
      });
      
      return matchingCategories;
    } catch (error) {
      console.error(`Error searching categories with prefix "${prefix}":`, error);
      return [];
    }
  });
}

/**
 * Signal to trigger category list refresh
 */
export const categoryListRefreshTrigger = signal<number>(0);

/**
 * Trigger a refresh of category lists (call after creating new categories)
 */
export function refreshCategoryLists() {
  categoryListRefreshTrigger.set(categoryListRefreshTrigger.get() + 1);
}

/**
 * Get default/suggested categories for new documents
 * @returns Array of common category options
 */
export function getDefaultCategories(): string[] {
  return ['primary', 'secondary', 'reference'];
}

/**
 * Validate if a category name is appropriate
 * Categories should be simple, single words or short phrases
 * @param categoryName - The category to validate
 * @returns Object with isValid boolean and optional error message
 */
export function validateCategory(categoryName: string): { isValid: boolean; error?: string } {
  if (!categoryName || !categoryName.trim()) {
    return { isValid: false, error: 'Category cannot be empty' };
  }

  const trimmed = categoryName.trim();
  
  // Categories should not contain commas (unlike tags)
  if (trimmed.includes(',')) {
    return { isValid: false, error: 'Categories should not contain commas' };
  }
  
  // Categories should be reasonably short
  if (trimmed.length > 50) {
    return { isValid: false, error: 'Category name should be under 50 characters' };
  }
  
  return { isValid: true };
}

/**
 * Normalize category name for consistent storage
 * @param categoryName - The category name to normalize
 * @returns Normalized category name
 */
export function normalizeCategory(categoryName: string): string {
  return categoryName.trim().toLowerCase();
}