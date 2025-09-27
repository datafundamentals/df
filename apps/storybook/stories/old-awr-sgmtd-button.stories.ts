import type {Meta, StoryObj} from '@storybook/web-components';
import {html} from 'lit';
import '@df/ui-lit/old-awr-sgmtd-button';

interface OldAwrSgmtdButtonStoryArgs {
  selected: string;
  disabledOptions: string[];
  onSelectionChange?: (selectedValue: string) => void;
}

const meta: Meta<OldAwrSgmtdButtonStoryArgs> = {
  title: 'Components/Old AWR Segmented Button',
  component: 'old-m3-segmented-button',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Material Design 3 segmented button with predefined options: Close (0), Upload, Site, and Add. Uses SVG icons and supports selection and disabled states.',
      },
    },
  },
  args: {
    selected: '0',
    disabledOptions: [],
  },
  argTypes: {
    selected: {
      control: 'select',
      options: ['0', 'Upload', 'Site', 'Add'],
      description: 'Currently selected option',
    },
    disabledOptions: {
      control: 'check',
      options: ['0', 'Upload', 'Site', 'Add'],
      description: 'Array of options to disable (hide from display)',
    },
    onSelectionChange: {
      action: 'selection-change',
      description: 'Fired when selection changes',
    },
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<OldAwrSgmtdButtonStoryArgs>;

export const Default: Story = {
  render: (args) => html`
    <old-m3-segmented-button
      .selected=${args.selected}
      .disabledOptions=${args.disabledOptions}
      @selection-change=${(event: CustomEvent) =>
        args.onSelectionChange?.(event.detail.selected)}
    ></old-m3-segmented-button>
  `,
};

export const UploadSelected: Story = {
  args: {
    selected: 'Upload',
  },
};

export const SiteSelected: Story = {
  args: {
    selected: 'Site',
  },
};

export const AddSelected: Story = {
  args: {
    selected: 'Add',
  },
};

export const WithDisabledOptions: Story = {
  args: {
    selected: 'Site',
    disabledOptions: ['Upload', 'Add'],
  },
};

export const OnlyCloseAndSite: Story = {
  args: {
    selected: '0',
    disabledOptions: ['Upload', 'Add'],
  },
};

export const Interactive: Story = {
  render: (args) => html`
    <div style="display: flex; flex-direction: column; gap: 16px; align-items: center;">
      <old-m3-segmented-button
        .selected=${args.selected}
        .disabledOptions=${args.disabledOptions}
        @selection-change=${(event: CustomEvent) => {
          args.onSelectionChange?.(event.detail.selected);
          // Update the component's selected state for interactive demo
          const button = event.target as HTMLElement & { selected: string };
          if (button) {
            button.selected = event.detail.selected;
          }
        }}
      ></old-m3-segmented-button>
      <p style="margin: 0; font-family: sans-serif; color: #666;">
        Selected: <strong id="selected-value">${args.selected}</strong>
      </p>
    </div>
  `,
};