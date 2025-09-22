import type {Meta, StoryObj} from '@storybook/web-components';
import {html} from 'lit';
import '@df/ui-lit/markdown-codemirror';
import {
  registerMarkdownEditor,
  resetMarkdownEditor,
  setMarkdownValue,
} from '@df/state';
import type {
  MarkdownCodemirrorChangeDetail,
  MarkdownCodemirrorFocusDetail,
} from '@df/types';

interface MarkdownEditorArgs {
  editorId: string;
  label: string;
  placeholder: string;
  theme: 'light' | 'dark';
  readOnly: boolean;
  showPreview: boolean;
  initialValue: string;
  onChange?: (detail: MarkdownCodemirrorChangeDetail) => void;
  onFocusChange?: (hasFocus: boolean) => void;
}

const meta: Meta<MarkdownEditorArgs> = {
  title: 'Components/Markdown Codemirror',
  component: 'df-markdown-codemirror',
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    editorId: 'storybook-markdown',
    label: 'Markdown Notes',
    placeholder: 'Start writing Markdown...',
    theme: 'light',
    readOnly: false,
    showPreview: true,
    initialValue: '# Markdown heading\n\nStart with some **bold** text and a [link](https://example.com).',
  },
  argTypes: {
    editorId: {control: 'text'},
    label: {control: 'text'},
    placeholder: {control: 'text'},
    theme: {control: {type: 'inline-radio'}, options: ['light', 'dark']},
    readOnly: {control: 'boolean'},
    showPreview: {control: 'boolean'},
    initialValue: {control: 'text'},
    onChange: {action: 'change'},
    onFocusChange: {action: 'focus'},
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<MarkdownEditorArgs>;

const renderMarkdownStory = (args: MarkdownEditorArgs) => {
  resetMarkdownEditor(args.editorId);
  registerMarkdownEditor({
    id: args.editorId,
    initialValue: args.initialValue,
    placeholder: args.placeholder,
    theme: args.theme,
    readOnly: args.readOnly,
    showPreview: args.showPreview,
  });
  setMarkdownValue(args.editorId, args.initialValue);

  return html`
    <df-markdown-codemirror
      .editorId=${args.editorId}
      .label=${args.label}
      .placeholder=${args.placeholder}
      .theme=${args.theme}
      .readOnly=${args.readOnly}
      .showPreview=${args.showPreview}
      .initialValue=${args.initialValue}
      @df-markdown-codemirror-change=${(event: CustomEvent<MarkdownCodemirrorChangeDetail>) =>
        args.onChange?.(event.detail)}
      @df-markdown-codemirror-focus=${(event: CustomEvent<MarkdownCodemirrorFocusDetail>) =>
        args.onFocusChange?.(event.detail.hasFocus)}
    ></df-markdown-codemirror>
  `;
};

export const Default: Story = {
  render: renderMarkdownStory,
};

export const DarkTheme: Story = {
  render: renderMarkdownStory,
  args: {
    editorId: 'storybook-markdown-dark',
    theme: 'dark',
    label: 'Dark Mode Markdown',
    initialValue: '## Compose in the dark\n\nToggle preview to focus on the code block.\n\n```ts\nconst hello = "world";\n```',
  },
};

export const ReadOnly: Story = {
  render: renderMarkdownStory,
  args: {
    editorId: 'storybook-markdown-readonly',
    readOnly: true,
    showPreview: true,
    label: 'Read-only Markdown',
    initialValue: '### Review mode\n\nContent is locked for editing.',
  },
};

export const EditorOnly: Story = {
  render: renderMarkdownStory,
  args: {
    editorId: 'storybook-markdown-editor-only',
    showPreview: false,
    label: 'Editor Only',
    initialValue: '* Focus on typing without the preview panel.\n* Toggle preview from the header.',
  },
};
