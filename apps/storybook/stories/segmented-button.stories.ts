import type {Meta, StoryObj} from '@storybook/web-components';
import {html} from 'lit';
import '@df/ui-lit/segmented-button';
import type {SegmentedButtonOption} from '@df/types';

const DEFAULT_OPTIONS: SegmentedButtonOption[] = [
  {id: 'none', label: 'None'},
  {id: 'upload', label: 'Upload'},
  {id: 'site', label: 'Site'},
  {id: 'add', label: 'Add'},
];

interface SegmentedButtonStoryArgs {
  options: SegmentedButtonOption[];
  disabled: string[];
  selected: string;
  onChange?: (selectedId: string) => void;
}

const meta: Meta<SegmentedButtonStoryArgs> = {
  title: 'Components/Segmented Button',
  component: 'df-segmented-button',
  parameters: {
    layout: 'centered',
  },
  args: {
    options: DEFAULT_OPTIONS,
    disabled: [],
    selected: 'none',
  },
  argTypes: {
    options: {control: 'object'},
    disabled: {control: 'object'},
    selected: {control: 'text'},
    onChange: {action: 'change'},
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<SegmentedButtonStoryArgs>;

export const Default: Story = {
  render: (args) => html`
    <df-segmented-button
      .options=${args.options}
      .disabled=${args.disabled}
      .selected=${args.selected}
      @df-segmented-button-change=${(event: CustomEvent<{id: string}>) =>
        args.onChange?.(event.detail.id)}
    ></df-segmented-button>
  `,
};

export const DisabledSegments: Story = {
  args: {
    disabled: ['upload', 'site'],
    selected: 'none',
  },
};

export const CustomLabels: Story = {
  args: {
    options: [
      {id: 'alpha', label: 'Alpha'},
      {id: 'beta', label: 'Beta'},
      {id: 'gamma', label: 'Gamma'},
    ],
    selected: 'beta',
  },
};
