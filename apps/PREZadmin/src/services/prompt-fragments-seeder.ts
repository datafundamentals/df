import * as yaml from 'js-yaml';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  getDocs, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase/firebase-config';

interface SeedFragment {
  key: string;
  value: string;
}

interface SeedData {
  prompt_fragments: SeedFragment[];
}

/**
 * Prompt Fragments Seeder Service
 * 
 * Loads seed data from YAML config and populates Firestore
 * at app startup if fragments don't already exist.
 */
export class PromptFragmentsSeeder {
  private static readonly SEED_CONFIG_PATH = '/config/prompt-fragments.yaml';
  private static readonly COLLECTION_NAME = 'promptFragments';
  private static readonly SEED_MARKER_DOC = '_seedStatus';

  /**
   * Initialize seed data in Firestore if not already loaded
   */
  static async initializeSeedData(): Promise<void> {
    try {
      // Check if we've already seeded the data
      const hasSeedData = await this.checkSeedStatus();
      if (hasSeedData) {
        console.log('✓ Prompt fragments seed data already loaded');
        return;
      }

      // Load and parse seed data
      const seedData = await this.loadSeedData();
      if (!seedData || !seedData.prompt_fragments || seedData.prompt_fragments.length === 0) {
        console.warn('No seed data found in config file');
        return;
      }

      // Seed the data into Firestore
      await this.seedFirestore(seedData.prompt_fragments);
      
      // Mark as seeded
      await this.markSeedStatus();
      
      console.log(`✅ Seeded ${seedData.prompt_fragments.length} prompt fragments into Firestore`);

    } catch (error) {
      console.error('Error initializing prompt fragments seed data:', error);
      // Don't throw - app should continue even if seeding fails
    }
  }

  /**
   * Check if seed data has already been loaded
   */
  private static async checkSeedStatus(): Promise<boolean> {
    try {
      const seedDoc = doc(db, this.COLLECTION_NAME, this.SEED_MARKER_DOC);
      const docSnapshot = await getDoc(seedDoc);
      return docSnapshot.exists();
    } catch (error) {
      console.warn('Could not check seed status:', error);
      return false;
    }
  }

  /**
   * Mark that seed data has been loaded
   */
  private static async markSeedStatus(): Promise<void> {
    const seedDoc = doc(db, this.COLLECTION_NAME, this.SEED_MARKER_DOC);
    await setDoc(seedDoc, {
      seededAt: Timestamp.now(),
      version: '1.0'
    });
  }

  /**
   * Load seed data from YAML config file
   */
  private static async loadSeedData(): Promise<SeedData | null> {
    try {
      const response = await fetch(this.SEED_CONFIG_PATH);
      if (!response.ok) {
        console.warn('Could not load seed config file:', response.statusText);
        return null;
      }
      
      const yamlText = await response.text();
      const seedData = yaml.load(yamlText) as SeedData;
      
      return seedData;
    } catch (error) {
      console.error('Error loading seed data from YAML:', error);
      return null;
    }
  }

  /**
   * Seed fragment data into Firestore
   */
  private static async seedFirestore(fragments: SeedFragment[]): Promise<void> {
    const fragmentsCollection = collection(db, this.COLLECTION_NAME);
    const now = Timestamp.now();

    // Check for existing fragments to avoid duplicates
    const existingSnapshot = await getDocs(fragmentsCollection);
    const existingKeys = new Set(
      existingSnapshot.docs
        .filter(doc => doc.id !== this.SEED_MARKER_DOC)
        .map(doc => doc.data().key)
    );

    for (const fragment of fragments) {
      if (existingKeys.has(fragment.key)) {
        console.log(`Skipping existing fragment: ${fragment.key}`);
        continue;
      }

      const fragmentDoc = doc(fragmentsCollection);
      await setDoc(fragmentDoc, {
        key: fragment.key,
        value: fragment.value,
        createdAt: now,
        updatedAt: now,
        isSeeded: true // Mark as seed data for potential future use
      });

      console.log(`Seeded fragment: ${fragment.key}`);
    }
  }

  /**
   * Force re-seed (for development/testing)
   * This will clear the seed status and reload data
   */
  static async forceSeed(): Promise<void> {
    try {
      // Remove seed marker
      const seedDoc = doc(db, this.COLLECTION_NAME, this.SEED_MARKER_DOC);
      await setDoc(seedDoc, {}, { merge: false });
      
      // Re-initialize
      await this.initializeSeedData();
    } catch (error) {
      console.error('Error force-seeding:', error);
    }
  }
}