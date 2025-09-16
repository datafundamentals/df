import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  eslint.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        HTMLElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLSelectElement: 'readonly',
        HTMLTextAreaElement: 'readonly',
        customElements: 'readonly',
        CSSResult: 'readonly',
        CustomEvent: 'readonly',
        Event: 'readonly',
        InputEvent: 'readonly',
        URL: 'readonly',
        File: 'readonly',
        Image: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        getComputedStyle: 'readonly',
        prompt: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      'no-prototype-builtins': 'off',
      '@typescript-eslint/ban-types': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    files: ['rollup.config.js', 'web-test-runner.config.js', 'src/server/**/*.ts'],
    languageOptions: {
      globals: {
        process: 'readonly',
        __dirname: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
      },
    },
  },
  {
    files: ['*_test.ts', '**/*_test.ts', '**/custom_typings/*.ts'],
    languageOptions: {
      globals: {
        suite: 'readonly',
        test: 'readonly',
        setup: 'readonly',
        teardown: 'readonly',
        before: 'readonly',
        after: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];