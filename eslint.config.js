import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  // Base configuration for all files
  js.configs.recommended,

  // TypeScript configuration
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // Core TypeScript rules
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/ban-types': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',

      // General rules
      'no-prototype-builtins': 'off',
    },
  },

  // Browser environment for UI packages
  {
    files: ['packages/ui-lit/**/*.ts', 'apps/lit-starter/**/*.ts'],
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
        HTMLElement: 'readonly',
        customElements: 'readonly',
      },
    },
  },

  // Node environment for config files
  {
    files: ['**/*.config.js', '**/*.config.mjs', '**/rollup.config.js', '**/web-test-runner.config.js'],
    languageOptions: {
      globals: {
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        global: 'readonly',
        Buffer: 'readonly',
      },
    },
  },

  // Test files - relax some rules
  {
    files: ['**/*_test.ts', '**/*.test.ts', '**/*.spec.ts', '**/test/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // Storybook specific
  {
    files: ['apps/storybook/**/*.ts', 'apps/storybook/**/*.tsx'],
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
      },
    },
  },
];