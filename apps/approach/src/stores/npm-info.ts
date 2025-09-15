import { signal } from '@lit-labs/signals';
import { AsyncComputed } from 'signal-utils/async-computed';

export interface NpmPackage {
  description: string;
  ['dist-tags']: { [tag: string]: string };
}

// Default value to return when no valid package is available
const DEFAULT_NPM_PACKAGE: NpmPackage = {
  description: 'No package selected',
  ['dist-tags']: {},
};

export class NpmInfo {
  #packageName = signal('');
  get packageName() {
    return this.#packageName.get();
  }
  set packageName(value: string) {
    this.#packageName.set(value);
    this.#npmInfo.run();
  }

  #npmInfo = new AsyncComputed<NpmPackage>(async abortSignal => {
    if (!this.packageName) {
      return DEFAULT_NPM_PACKAGE;
    }

    const response = await fetch(`https://registry.npmjs.org/${this.packageName}`, { signal: abortSignal });

    // Artificial delay for demo purposes
    await new Promise(r => setTimeout(r, 1000));

    if (!response.ok) {
      return DEFAULT_NPM_PACKAGE;
    }

    return (await response.json()) as NpmPackage;
  });

  get info() {
    return this.#npmInfo;
  }
}

export const renderAsyncComputed = <T>(
  v: AsyncComputed<T>,
  {
    initial,
    pending,
    complete,
    error,
  }: {
    initial?: () => unknown;
    pending?: () => unknown;
    complete?: (value: T) => unknown;
    error?: (error: unknown) => unknown;
  },
) => {
  switch (v.status) {
    case 'initial':
      return initial?.();
    case 'pending':
      return pending?.();
    case 'complete':
      return complete?.(v.value as T);
    case 'error':
      return error?.(v.error as unknown);
  }
};
