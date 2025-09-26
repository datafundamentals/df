/**
 * NPM package information types for the npm-info widget
 */

/**
 * NPM registry package information
 * Keep minimal for demo purposes - not a production NPM client
 */
export interface NpmPackage {
  name: string;
  description?: string;
  'dist-tags'?: {
    latest?: string;
    beta?: string;
    alpha?: string;
    next?: string;
  };
}

/**
 * Widget state for npm package information
 * CRITICAL: Follows the exact async state pattern from practice-widget
 * This pattern (idle | loading | ready | error) is the monorepo standard
 */
export type NpmInfoWidgetStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface NpmInfoWidgetState {
  packageName: string;
  packageData: NpmPackage | null;
  status: NpmInfoWidgetStatus;
  lastUpdated: number | null;
  errorMessage: string | null;
}

/**
 * Configuration for the npm-info widget
 * Static properties that don't change during widget lifecycle
 */
export interface NpmInfoWidgetConfig {
  defaultPackage?: string;
  enableAutoRefresh?: boolean;
  refreshIntervalMs?: number;
}

export type NpmInfoStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface NpmInfoState {
  packageName: string;
  packageData: NpmPackage | null;
  status: NpmInfoStatus;
  lastUpdated: number | null;
  errorMessage: string | null;
}

/**
 * Configuration interface for npm-info widget
 * Used for static/configuration data passed via properties
 */
export interface NpmInfoConfig {
  /** Default package name to load on initialization */
  defaultPackage?: string;
  /** Whether to show additional package metadata */
  showMetadata?: boolean;
  /** Custom placeholder text for the input field */
  placeholder?: string;
  /** Whether the component is in a compact display mode */
  variant?: 'compact' | 'full';
}