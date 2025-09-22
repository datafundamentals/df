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
const errorSignal = signal<string | null>(null);
const isAutoRefreshingSignal = signal<boolean>(false);

let pendingRequestId = 0;
let autoRefreshHandle: ReturnType<typeof setInterval> | null = null;

export const PRACTICE_TOPICS = [...topics];

export const practiceWidgetState = computed<PracticeWidgetState>(() => ({
  topic: topicSignal.get(),
  tasks: tasksSignal.get(),
  status: statusSignal.get(),
  lastUpdated: lastUpdatedSignal.get(),
  isAutoRefreshing: isAutoRefreshingSignal.get(),
  errorMessage: errorSignal.get(),
}));

export function setPracticeTopic(topic: PracticeTopic): boolean {
  if (topicSignal.get() === topic) {
    return false;
  }
  topicSignal.set(topic);
  return true;
}

export async function loadPracticeTasks(topic?: PracticeTopic) {
  const nextTopic = topic ?? topicSignal.get();
  topicSignal.set(nextTopic);
  pendingRequestId += 1;
  const requestId = pendingRequestId;

  statusSignal.set('loading');
  errorSignal.set(null);

  try {
    const tasks = await simulateTaskFetch(nextTopic);

    if (requestId !== pendingRequestId) {
      return;
    }

    tasksSignal.set(tasks);
    statusSignal.set('ready');
    lastUpdatedSignal.set(Date.now());
  } catch (error) {
    if (requestId !== pendingRequestId) {
      return;
    }

    statusSignal.set('error');
    errorSignal.set(error instanceof Error ? error.message : 'Unknown error');
  }
}

export function startAutoRefresh(intervalMs = 15000) {
  stopAutoRefresh();
  isAutoRefreshingSignal.set(true);
  void loadPracticeTasks();
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
}

export function resetPracticeWidget() {
  pendingRequestId += 1;
  stopAutoRefresh();
  topicSignal.set(topics[0]);
  tasksSignal.set([]);
  statusSignal.set('idle');
  lastUpdatedSignal.set(null);
  errorSignal.set(null);
}

async function simulateTaskFetch(topic: PracticeTopic): Promise<PracticeTask[]> {
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
    setTimeout(resolve, ms);
  });
}
