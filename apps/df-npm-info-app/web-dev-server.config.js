/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import { legacyPlugin } from '@web/dev-server-legacy';

const mode = process.env.MODE || 'dev';
if (!['dev', 'prod'].includes(mode)) {
  throw new Error(`MODE must be "dev" or "prod", was "${mode}"`);
}

export default {
  nodeResolve: { exportConditions: mode === 'dev' ? ['development'] : [] },
  preserveSymlinks: true,

  // Middleware to proxy RAG API calls to the RAG backend server
  middleware: [
    // First middleware: parse body
    async function parseBody(context, next) {
      if (context.url.startsWith('/api/v2') && context.request.method === 'POST') {
        const chunks = [];
        for await (const chunk of context.req) {
          chunks.push(chunk);
        }
        const bodyString = Buffer.concat(chunks).toString();
        context.parsedBody = bodyString;
      }
      return next();
    },

    // Second middleware: proxy request
    async function ragApiProxy(context, next) {
      if (context.url.startsWith('/api/v2')) {
        const targetUrl = `http://localhost:5011${context.url}`;

        try {
          const response = await fetch(targetUrl, {
            method: context.request.method,
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: context.parsedBody || undefined,
          });

          const responseText = await response.text();

          context.response.status = response.status;
          context.response.set('Content-Type', 'application/json');
          context.response.body = responseText;
        } catch (error) {
          console.error('Proxy error:', error);
          context.response.status = 500;
          context.response.body = JSON.stringify({ error: `Proxy error: ${error.message}` });
        }

        return; // Don't call next()
      }
      return next();
    },
  ],

  plugins: [
    legacyPlugin({
      polyfills: {
        // Manually imported in index.html file
        webcomponents: false,
      },
    }),
  ],
};
