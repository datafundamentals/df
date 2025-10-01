import {computed, signal} from '@lit-labs/signals';
import type {
  PracticeDifficulty,
  PracticeTask,
  PracticeTopic,
  PracticeWidgetState,
  PracticeWidgetStatus,
} from '@df/types';

const topics: PracticeTopic[] = ['web-components', 'signals', 'monorepo'];
const difficultyCycle: PracticeDifficulty[] = ['intro', 'intermediate', 'advanced'];

const topicSignal = signal<PracticeTopic>(topics[0]);
const tasksSignal = signal<PracticeTask[]>([]);
const statusSignal = signal<PracticeWidgetStatus>('idle');
const lastUpdatedSignal = signal<number | null>(null);
const stateVersionSignal = signal<number>(0);
const errorSignal = signal<string | null>(null);
const forceErrorSignal = signal<boolean>(false);
const isAutoRefreshingSignal = signal<boolean>(false);

let pendingRequestId = 0;
let autoRefreshHandle: ReturnType<typeof setInterval> | null = null;

export const PRACTICE_TOPICS = [...topics];

export const practiceWidgetState = computed<PracticeWidgetState>(() => ({
  version: stateVersionSignal.get(),
  topic: topicSignal.get(),
  tasks: tasksSignal.get(),
  status: statusSignal.get(),
  lastUpdated: lastUpdatedSignal.get(),
  isAutoRefreshing: isAutoRefreshingSignal.get(),
  errorMessage: errorSignal.get(),
}));

/** @internal For integration tests only. */
export function __setPracticeForceError(flag: boolean) {
  forceErrorSignal.set(flag);
}

if (typeof globalThis === 'object') {
  const globalTarget = globalThis as {
    __dfPracticeForcePracticeErrorSetter?: (flag: boolean) => void;
    __dfPracticeGetForcePracticeError?: () => boolean;
  };
  globalTarget.__dfPracticeForcePracticeErrorSetter = __setPracticeForceError;
  globalTarget.__dfPracticeGetForcePracticeError = () => forceErrorSignal.get();
}

export function setPracticeTopic(topic: PracticeTopic): boolean {
  if (topicSignal.get() === topic) {
    return false;
  }
  topicSignal.set(topic);
  stateVersionSignal.set(stateVersionSignal.get() + 1);
  return true;
}

export async function loadPracticeTasks(topic?: PracticeTopic) {
  const nextTopic = topic ?? topicSignal.get();
  topicSignal.set(nextTopic);
  stateVersionSignal.set(stateVersionSignal.get() + 1);
  pendingRequestId += 1;
  const requestId = pendingRequestId;

  statusSignal.set('loading');
  errorSignal.set(null);

  if (shouldForcePracticeError()) {
    tasksSignal.set([]);
    statusSignal.set('error');
    errorSignal.set('Practice tasks fetch forced failure');
    stateVersionSignal.set(stateVersionSignal.get() + 1);
    return;
  }

  try {
    const tasks = await simulateTaskFetch(nextTopic);

    if (requestId !== pendingRequestId) {
      return;
    }

    tasksSignal.set(tasks);
    statusSignal.set('ready');
    lastUpdatedSignal.set(Date.now());
    stateVersionSignal.set(stateVersionSignal.get() + 1);
  } catch (error) {
    if (requestId !== pendingRequestId) {
      return;
    }

    statusSignal.set('error');
    errorSignal.set(error instanceof Error ? error.message : 'Unknown error');
    stateVersionSignal.set(stateVersionSignal.get() + 1);
  }
}

export function startAutoRefresh(intervalMs = 15000) {
  stopAutoRefresh();
  isAutoRefreshingSignal.set(true);
  void loadPracticeTasks();
  stateVersionSignal.set(stateVersionSignal.get() + 1);
  autoRefreshHandle = setInterval(() => {
    void loadPracticeTasks();
  }, intervalMs);
}

export function stopAutoRefresh() {
  if (autoRefreshHandle !== null) {
    clearInterval(autoRefreshHandle);
    autoRefreshHandle = null;
  }
  isAutoRefreshingSignal.set(false);
  stateVersionSignal.set(stateVersionSignal.get() + 1);
}

export function resetPracticeWidget() {
  pendingRequestId += 1;
  stopAutoRefresh();
  topicSignal.set(topics[0]);
  tasksSignal.set([]);
  statusSignal.set('idle');
  lastUpdatedSignal.set(null);
  errorSignal.set(null);
  stateVersionSignal.set(stateVersionSignal.get() + 1);
}

async function simulateTaskFetch(topic: PracticeTopic): Promise<PracticeTask[]> {
  if (shouldForcePracticeError()) {
    throw new Error('Practice tasks fetch forced failure');
  }

  await delay(450 + Math.random() * 550);

  const seed = topic;
  const now = Date.now();

  return Array.from({length: 3}, (_, index) => {
    const difficulty = difficultyCycle[index % difficultyCycle.length];
    return {
      id: `${seed}-${now}-${index}`,
      title: buildTitle(topic, difficulty, index + 1),
      summary: buildSummary(topic, difficulty),
      difficulty,
    } satisfies PracticeTask;
  });
}

function buildTitle(topic: PracticeTopic, difficulty: PracticeDifficulty, count: number) {
  return `${capitalize(topic)} practice #${count} (${difficulty})`;
}

function buildSummary(topic: PracticeTopic, difficulty: PracticeDifficulty) {
  switch (topic) {
    case 'web-components':
      return difficulty === 'advanced'
        ? 'Wire a custom element into a host app without leaking implementation details.'
        : difficulty === 'intermediate'
          ? 'Refactor lifecycle logic behind a Lit controller to prep for reuse.'
          : 'Author a Lit element with reactive properties and slots.';
    case 'signals':
      return difficulty === 'advanced'
        ? 'Compose computed signals across packages to flow derived state into UI.'
        : difficulty === 'intermediate'
          ? 'Replace event-driven updates with signal setters in a form workflow.'
          : 'Connect a Lit component to a signal-backed store to mirror state.';
    case 'monorepo':
      return difficulty === 'advanced'
        ? 'Split a shared package and rehydrate Turbo caches after dependency changes.'
        : difficulty === 'intermediate'
          ? 'Promote a feature into a shared workspace while keeping storybook coverage.'
          : 'Add a new app workspace and register its build artifacts with Turbo.';
    default:
      return 'Practice focus not yet documented.';
  }
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    if (shouldForcePracticeError()) {
      // Skip the artificial delay when failures are forced so tests stay fast.
      resolve();
      return;
    }

    setTimeout(resolve, ms);
  });
}

function shouldForcePracticeError() {
  return (
    forceErrorSignal.get() ||
    Boolean((globalThis as {__dfPracticeForcePracticeError?: boolean}).__dfPracticeForcePracticeError)
  );
}
