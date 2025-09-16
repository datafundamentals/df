/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import summary from 'rollup-plugin-summary';
import terser from '@rollup/plugin-terser';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: [
    './out-tsc/ui/peg-bundle-app.js',
    './out-tsc/ui/bwp-bundle-app.js',
    './out-tsc/ui/peg-bundle-admin.js',
    './out-tsc/ui/peg-bundle-elective-menu.js',
    './out-tsc/ui/peg-bundle-electives-admin.js',
  ],
  output: {
    dir: './_site/ui',
    format: 'esm',
  },
  onwarn(warning) {
    if (warning.code !== 'THIS_IS_UNDEFINED') {
      console.error(`(!) ${warning.message}`);
    }
  },
  plugins: [
    replace({ preventAssignment: false, 'Reflect.decorate': 'undefined' }),
    resolve(),
    commonjs(),
    /**
     * This minification setup serves the static site generation.
     * For bundling and minification, check the README.md file.
     */
    terser({
      ecma: 2021,
      module: true,
      warnings: true,
      // mangle: { FAILS!! DO NOT USE WITH FIRESTORE
      //   properties: {
      //     regex: /^__/,
      //   },
      // },
    }),
    summary(),
  ],
};
