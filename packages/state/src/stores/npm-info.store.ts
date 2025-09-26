import {computed, signal} from '@lit-labs/signals';
import type {NpmInfoWidgetState, NpmInfoWidgetStatus, NpmPackage} from '@df/types';

// Signal state management following the practice-widget pattern
const packageNameSignal = signal<string>('');
const packageDataSignal = signal<NpmPackage | null>(null);
const statusSignal = signal<NpmInfoWidgetStatus>('idle');
const lastUpdatedSignal = signal<number | null>(null);
const errorSignal = signal<string | null>(null);

// Request tracking to prevent race conditions
let pendingRequestId = 0;

/**
 * Computed state that combines all npm-info signals
 * Following the same pattern as practiceWidgetState
 */
export const npmInfoWidgetState = computed<NpmInfoWidgetState>(() => ({
  packageName: packageNameSignal.get(),
  packageData: packageDataSignal.get(),
  status: statusSignal.get(),
  lastUpdated: lastUpdatedSignal.get(),
  errorMessage: errorSignal.get(),
}));

/**
 * Set the package name without triggering a fetch
 * Use this for updating the input field value
 */
export function setPackageName(packageName: string): void {
  const currentName = packageNameSignal.get();
  if (currentName === packageName) {
    return;
  }
  
  packageNameSignal.set(packageName);
}

/**
 * Loads package information from the NPM registry
 */
export async function loadNpmPackageInfo(packageName?: string): Promise<void> {
  const targetPackage = packageName ?? packageNameSignal.get();
  
  if (!targetPackage.trim()) {
    resetNpmInfoWidget();
    return;
  }

  // Update signals for the loading state
  packageNameSignal.set(targetPackage);
  statusSignal.set('loading');
  errorSignal.set(null);
  
  // Track this request to prevent race conditions
  pendingRequestId += 1;
  const requestId = pendingRequestId;

  try {
    const response = await fetch(`https://registry.npmjs.org/${targetPackage}`);
    
    // Artificial delay for demo purposes (matching the original)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if this request is still current
    if (requestId !== pendingRequestId) {
      return;
    }

    if (!response.ok) {
      throw new Error(`Package "${targetPackage}" not found (${response.status})`);
    }

    const packageData = await response.json() as NpmPackage;
    
    // Update signals with successful data
    packageDataSignal.set(packageData);
    statusSignal.set('ready');
    lastUpdatedSignal.set(Date.now());
    
  } catch (error) {
    // Check if this request is still current before setting error
    if (requestId !== pendingRequestId) {
      return;
    }

    statusSignal.set('error');
    errorSignal.set(error instanceof Error ? error.message : 'Failed to fetch package information');
    packageDataSignal.set(null);
  }
}

/**
 * Resets the npm-info state to initial values
 */
export function resetNpmInfoWidget(): void {
  pendingRequestId += 1; // Cancel any pending requests
  packageNameSignal.set('');
  packageDataSignal.set(null);
  statusSignal.set('idle');
  lastUpdatedSignal.set(null);
  errorSignal.set(null);
}

/**
 * Gets the current package name (convenience getter)
 */
export function getCurrentPackageName(): string {
  return packageNameSignal.get();
}