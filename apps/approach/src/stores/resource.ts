import { ResourceGraph } from '../types';
export const initializeResourceGraph = {
  name: 'void',
  image: [],
  video: [],
  site: [],
  markdown: '',
};

export const upsertResourceGraph = <T, K extends keyof ResourceGraph>(root: T, path: string[], key: K, value: ResourceGraph[K]): void => {
  // no idea what this does now, a piece of relic code
  console.log('MAYBE THIS SHOULD BE bubbling up so i could persist?');
  let current: unknown = root;

  // Traverse the path to the target `ResourceGraph`
  for (const segment of path) {
    if (typeof current === 'object' && current !== null && segment in current) {
      current = (current as Record<string, unknown>)[segment];
    } else {
      throw new Error(`Invalid path segment: ${segment}`);
    }
  }

  // Ensure the current target is a `ResourceGraph`
  if (typeof current === 'object' && current !== null && 'name' in current) {
    const resourceGraph = current as ResourceGraph;

    // Upsert the key in the `ResourceGraph`
    resourceGraph[key] = value;
  } else {
    throw new Error(`Target is not a valid ResourceGraph`);
  }
};

