/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import { PegBundleApp } from '../ui/peg-bundle-app';

import { fixture, assert } from '@open-wc/testing';
import { html } from 'lit/static-html.js';

suite('peg-app', () => {
  test('is defined', () => {
    const el = document.createElement('peg-bundle-app');
    assert.instanceOf(el, PegBundleApp);
  });

  test('renders sign in UI when not logged in', async () => {
    const el = (await fixture(html`<peg-bundle-app></peg-bundle-app>`)) as PegBundleApp;
    await el.updateComplete;
    
    const button = el.shadowRoot!.querySelector('button');
    assert.exists(button);
    assert.include(button!.textContent!, 'Sign in with Google');
  });

  test('contains proper structure', async () => {
    const el = (await fixture(html`<peg-bundle-app></peg-bundle-app>`)) as PegBundleApp;
    await el.updateComplete;
    
    const div = el.shadowRoot!.querySelector('div');
    assert.exists(div);
  });

  test('styling applied', async () => {
    const el = (await fixture(html`<peg-bundle-app></peg-bundle-app>`)) as PegBundleApp;
    await el.updateComplete;
    assert.equal(getComputedStyle(el).paddingTop, '16px');
  });
});
