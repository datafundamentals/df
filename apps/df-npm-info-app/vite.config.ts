import {defineConfig} from 'vite';

const distEntry = './dist/df-npm-info-app.js';
const sourceEntry = '/src/df-npm-info-app.ts';

export default defineConfig({
  plugins: [
    {
      name: 'df-npm-info-entry',
      apply: 'serve',
      transformIndexHtml(html) {
        return html.replace(distEntry, sourceEntry);
      },
    },
  ],
});
