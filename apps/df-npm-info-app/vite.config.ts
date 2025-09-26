import {defineConfig} from 'vite';

export default defineConfig({
  plugins: [
    {
      name: 'df-npm-info-entry',
      apply: 'serve',
      transformIndexHtml(html) {
        return html.replaceAll('../dist/ui/npm-info.js', '/src/ui/npm-info.ts');
      },
    },
  ],
});
