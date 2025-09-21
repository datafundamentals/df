import {computed, signal} from '@lit-labs/signals';
import type {SegmentedButtonConfig, SegmentedButtonOption} from '@df/types';

const DEFAULT_OPTIONS: SegmentedButtonOption[] = [
  {id: 'none', label: 'None'},
  {id: 'upload', label: 'Upload'},
  {id: 'site', label: 'Site'},
  {id: 'add', label: 'Add'},
];

const disabledIdsSignal = signal<string[]>([]);
const selectedIdSignal = signal<string>('none');
const optionsSignal = signal<SegmentedButtonOption[]>(DEFAULT_OPTIONS);

export const segmentedButtonState = computed<SegmentedButtonConfig>(() => ({
  options: optionsSignal.get(),
  selectedId: selectedIdSignal.get(),
  disabledIds: disabledIdsSignal.get(),
}));

export function selectSegment(id: string) {
  const availableOptions = optionsSignal.get();
  const optionExists = availableOptions.some((option) => option.id === id);
  const isDisabled = disabledIdsSignal.get().includes(id);
  if (!optionExists || isDisabled) {
    return;
  }
  selectedIdSignal.set(id);
}

export function setOptions(nextOptions: SegmentedButtonOption[]) {
  optionsSignal.set(nextOptions);
  const disabledIds = disabledIdsSignal.get();
  const currentSelection = selectedIdSignal.get();
  const stillValid = nextOptions.some((option) => option.id === currentSelection);
  if (!stillValid) {
    const firstEnabled = nextOptions.find((option) => !disabledIds.includes(option.id));
    selectedIdSignal.set(firstEnabled?.id ?? nextOptions[0]?.id ?? 'none');
  }
}

export function disableSegments(ids: string[]) {
  disabledIdsSignal.set(ids);
  if (ids.includes(selectedIdSignal.get())) {
    const firstEnabled = optionsSignal
      .get()
      .find((option) => !ids.includes(option.id));
    selectedIdSignal.set(firstEnabled?.id ?? optionsSignal.get()[0]?.id ?? 'none');
  }
}

export function resetSegments() {
  optionsSignal.set(DEFAULT_OPTIONS);
  disabledIdsSignal.set([]);
  selectedIdSignal.set('none');
}
