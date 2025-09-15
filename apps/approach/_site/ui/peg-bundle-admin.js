import{h as e,i as t,j as r,k as a,x as n,l as i,f as s,t as l}from"./auth-C1lDTTv0.js";import"./peg-players-admin-CjTIF79_.js";
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */var p=function(e,t,r,a){for(var n,i=arguments.length,s=i<3?t:null===a?a=Object.getOwnPropertyDescriptor(t,r):a,l=e.length-1;l>=0;l--)(n=e[l])&&(s=(i<3?n(s):i>3?n(t,r,s):n(t,r))||s);return i>3&&s&&Object.defineProperty(t,r,s),s};let o=class extends(e(t)){render(){return n`
      <div>
        ${r.get()?n`<p>Welcome, ${a.get()?.displayName}</p>
              <players-admin></players-admin>`:n`<button @click="${i}">Sign in with Google</button>`}
      </div>
    `}};o.styles=s`
    :host {
      display: block;
      border: solid 1px gray;
      padding: 16px;
      max-width: 800px;
    }
  `,o=p([l("peg-bundle-admin")],o);export{o as PegBundleAdmin};
