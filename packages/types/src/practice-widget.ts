export type PracticeWidgetStatus = 'idle' | 'loading' | 'ready' | 'error';

export type PracticeTopic = 'web-components' | 'signals' | 'monorepo';

export type PracticeDifficulty = 'intro' | 'intermediate' | 'advanced';

export interface PracticeTask {
  id: string;
  title: string;
  summary: string;
  difficulty: PracticeDifficulty;
}

export interface PracticeWidgetState {
  version: number;
  topic: PracticeTopic;
  tasks: PracticeTask[];
  status: PracticeWidgetStatus;
  lastUpdated: number | null;
  isAutoRefreshing: boolean;
  errorMessage: string | null;
}
