export interface SegmentedButtonOption {
  id: string;
  label: string;
}

export interface SegmentedButtonConfig {
  options: SegmentedButtonOption[];
  selectedId: string | null;
  disabledIds: string[];
}
