import {defineConfig} from 'vite';

const distEntry = './dist/df-practice-app.js';
const sourceEntry = '/src/df-practice-app.ts';

export default defineConfig({
  plugins: [
    {
      name: 'df-practice-entry',
      apply: 'serve',
      transformIndexHtml(html) {
        return html.replace(distEntry, sourceEntry);
      },
    },
  ],
});
