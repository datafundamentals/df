import {mergeConfig} from 'vite';
import {fileURLToPath, URL} from 'node:url';
import type {StorybookConfig} from '@storybook/web-components-vite';

const config: StorybookConfig = {
  stories: ['../stories/**/*.mdx', '../stories/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-interactions'],
  framework: {
    name: '@storybook/web-components-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  viteFinal: async (baseConfig) =>
    mergeConfig(baseConfig, {
      resolve: {
        alias: {
          '@df/ui-lit': fileURLToPath(
            new URL('../../../packages/ui-lit/src', import.meta.url),
          ),
        },
      },
    }),
};

export default config;
