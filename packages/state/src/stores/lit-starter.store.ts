import {computed, signal} from '@lit-labs/signals';

export const DEFAULT_LIT_STARTER_NAME = 'World';

export type LitStarterState = Readonly<LitStarterSnapshot>;

interface LitStarterSnapshot {
  readonly name: string;
  readonly greeting: string;
  readonly clickCount: number;
  readonly lastInteractionTs: number | null;
}

const nameSignal = signal<string>(DEFAULT_LIT_STARTER_NAME);
const clickCountSignal = signal<number>(0);
const lastInteractionSignal = signal<number | null>(null);

export const litStarterState = computed<LitStarterState>(() => {
  const name = nameSignal.get();

  return {
    name,
    greeting: `Hello, ${name}!`,
    clickCount: clickCountSignal.get(),
    lastInteractionTs: lastInteractionSignal.get(),
  } as const satisfies LitStarterState;
});

export function setLitStarterName(rawName: string) {
  const name = rawName.trim() || DEFAULT_LIT_STARTER_NAME;
  if (nameSignal.get() === name) {
    return;
  }
  nameSignal.set(name);
  markInteraction();
}

export function incrementLitStarterCount() {
  clickCountSignal.set(clickCountSignal.get() + 1);
  markInteraction();
}

export function resetLitStarterState() {
  nameSignal.set(DEFAULT_LIT_STARTER_NAME);
  clickCountSignal.set(0);
  lastInteractionSignal.set(null);
}

function markInteraction() {
  lastInteractionSignal.set(Date.now());
}
