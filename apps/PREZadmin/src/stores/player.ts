import { signal } from '@lit-labs/signals';
import { Player } from '../types';

export const initializePlayer = (): Player => ({
  uid: 'void',
  resourceGraph: {
    name: 'void',
    image: [],
    video: [],
    site: [],
    markdown: 'void',
  },
  projects: [],
  points: 0,
});

export const player = signal<Player>(initializePlayer());

export const setPlayerUid = (uid: string) => {
  const current = player.get();
  player.set({
    ...current,
    uid: uid,
  });
};

