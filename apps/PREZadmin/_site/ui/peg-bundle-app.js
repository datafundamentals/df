import{c as e,d as t,g as i,a as o,u as s,b as a,e as r,i as n,x as l,f as d,t as c,h as p,r as h,p as m,j as u,k as g,s as f,l as v}from"./auth-C1lDTTv0.js";import{_ as y}from"./awr-upload-link-CoHLMwP0.js";import"./peg-players-admin-CjTIF79_.js";import"./peg-bundle-electives-admin.js";import{g as b}from"./electives-CP-NrN73.js";import"./fab-CtcsSBEe.js";import"./upload-DZuONd-6.js";const x=e(t,"project");
/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
class w extends n{render(){return l`<slot></slot>`}connectedCallback(){super.connectedCallback();"false"!==this.getAttribute("aria-hidden")?this.setAttribute("aria-hidden","true"):this.removeAttribute("aria-hidden")}}
/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */const j=d`:host{font-size:var(--md-icon-size, 24px);width:var(--md-icon-size, 24px);height:var(--md-icon-size, 24px);color:inherit;font-variation-settings:inherit;font-weight:400;font-family:var(--md-icon-font, Material Symbols Outlined);display:inline-flex;font-style:normal;place-items:center;place-content:center;line-height:1;overflow:hidden;letter-spacing:normal;text-transform:none;user-select:none;white-space:nowrap;word-wrap:normal;flex-shrink:0;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;-moz-osx-font-smoothing:grayscale}::slotted(svg){fill:currentColor}::slotted(*){height:100%;width:100%}
`
/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */;let $=class extends w{};$.styles=[j],$=y([c("md-icon")],$);var P=function(e,t,i,o){for(var s,a=arguments.length,r=a<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o,n=e.length-1;n>=0;n--)(s=e[n])&&(r=(a<3?s(r):a>3?s(t,i,r):s(t,i))||r);return a>3&&r&&Object.defineProperty(t,i,r),r};let U=class extends(p(n)){constructor(){super(...arguments),this.projects=[],this.electivesOptions=[],this.editingProjectId=null,this.formData={name:"",points:"",screenshotUrl:"",videoUrl:"",markdown:"",deploymentUrl:"",electives:[]}}firstUpdated(){this.loadProject(),this.loadElectives()}async loadProject(){this.projects=await(async()=>(await i(x)).docs.map(e=>({id:e.id,...e.data()})))()}async loadElectives(){this.electivesOptions=await b()}handleInputChange(e){const t=e.target;if("electives"===t.id){const e=Array.from(t.selectedOptions).map(e=>e.value);this.formData={...this.formData,electives:e}}else this.formData={...this.formData,[t.id]:t.value}}async handleCreateOrUpdate(){const{name:e,points:t,screenshotUrl:i,videoUrl:r,markdown:n,deploymentUrl:l,electives:d}=this.formData,c={name:e,points:parseInt(t,10),screenshotUrl:i,videoUrl:r,markdown:n,deploymentUrl:l,electives:d};this.editingProjectId?(await(async(e,t)=>{const i=o(x,e);return await s(i,t)})(this.editingProjectId,c),this.editingProjectId=null):await(async e=>{try{const t=await a(x,e);return console.log("Document successfully written with ID:",t.id),t}catch(e){throw console.error("Error creating project:",e),new Error(`Failed to create project: ${e.message}`)}})(c),this.clearForm(),this.loadProject()}async handleEdit(e){const t=this.projects.find(t=>t.id===e);t&&(this.editingProjectId=e,this.formData={name:t.name||"",points:t.points?.toString()||"",screenshotUrl:t.screenshotUrl||"",videoUrl:t.videoUrl||"",markdown:t.markdown||"",deploymentUrl:t.deploymentUrl||"",electives:t.electives||[]})}async handleDelete(e){await(async e=>{const t=o(x,e);return await r(t)})(e),this.loadProject()}handleImageUrlUpdate(e,t){this.formData={...this.formData,[e]:t}}handleAutoResize(e){const t=e.target;if("md-outlined-text-field"===t.tagName.toLowerCase()){const e=t.shadowRoot?.querySelector("textarea");e&&(e.style.width="500px",e.style.height="auto",e.style.height=`${e.scrollHeight}px`)}}clearForm(){this.formData={name:"",points:"",screenshotUrl:"",videoUrl:"",markdown:"",deploymentUrl:"",electives:[]}}render(){return l`
      <h3>${this.editingProjectId?"Edit Project":"Create New Project"}</h3>
      <md-outlined-text-field id="name" label="Project Name" value="${this.formData.name}" @input="${this.handleInputChange}">
      </md-outlined-text-field>
      <md-outlined-text-field
        label="Points"
        id="points"
        type="number"
        placeholder="Points"
        value="${this.formData.points}"
        @input="${this.handleInputChange}"
      >
      </md-outlined-text-field>
      <md-outlined-text-field
        id="markdown"
        label="Project Markdown"
        type="textarea"
        placeholder="Paste in Markdown text"
        value="${this.formData.markdown}"
        @input="${e=>{this.handleInputChange(e),this.handleAutoResize(e)}}"
      ></md-outlined-text-field>
      <awr-resource-documenter resourcePageType="player"></awr-resource-documenter>
      <div id="electiveUpdater">TRY MEl</div>
      <label for="chosenElectivesList">ChosenElectives</label>
      <md-list id="chosenElectivesList" style="max-width: 300px;">
        ${this.electivesOptions.map(e=>l`
            ${this.formData.electives.includes(e.id)?l`
                  <md-list-item @click="${()=>this.shadowRoot.getElementById("electiveUpdater").textContent=e.name}">
                    ${e.name}
                  </md-list-item>
                `:""}
          `)}
      </md-list>

      <br />
      <label for="electives">Electives - Choose All</label>
      <select id="electives" multiple @change="${this.handleInputChange}">
        ${this.electivesOptions.map(e=>l` <option value="${e.id}" ?selected="${this.formData.electives.includes(e.id)}">${e.name}</option>`)}
      </select>
      <md-fab
        @click="${this.handleCreateOrUpdate}"
        label="Submit"
        aria-label=${this.editingProjectId?"Update Project":"Create Project"}
      >
        <md-icon slot="icon">^</md-icon>
      </md-fab>
      <h3>Project List</h3>
      <ul>
        ${this.projects.map(e=>l`
            <li>
              ${e.name} - Points: ${e.points} - Screenshot: ${e.screenshotUrl}
              <button @click="${()=>this.handleEdit(e.id)}">Edit</button>
              <button @click="${()=>this.handleDelete(e.id)}">Delete</button>
            </li>
          `)}
      </ul>
    `}};U.styles=d`
    :host {
      display: block;
      margin: 10px;
      padding: 16px;
      --md-list-container-color: #f4fbfa;
      --md-list-item-label-text-color: #161d1d;
      --md-list-item-supporting-text-color: #3f4948;
      --md-list-item-trailing-supporting-text-color: #3f4948;
      --md-list-item-label-text-font: system-ui;
      --md-list-item-supporting-text-font: system-ui;
      --md-list-item-trailing-supporting-text-font: system-ui;
    }

    input,
    textarea,
    select {
      display: block;
      margin-bottom: 10px;
      border-radius: 5px;
    }

    md-list {
      border: solid 1px;
      margin: 3px;
      padding: 3px;
      border-radius: 5px;
    }

    button {
      margin: 5px;
    }
  `,P([h()],U.prototype,"projects",void 0),P([h()],U.prototype,"electivesOptions",void 0),P([h()],U.prototype,"editingProjectId",void 0),P([h()],U.prototype,"formData",void 0),U=P([c("peg-player")],U);var k=function(e,t,i,o){for(var s,a=arguments.length,r=a<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o,n=e.length-1;n>=0;n--)(s=e[n])&&(r=(a<3?s(r):a>3?s(t,i,r):s(t,i))||r);return a>3&&r&&Object.defineProperty(t,i,r),r};let D=class extends(p(n)){constructor(){super(...arguments),this.playerGraph=m.get()}render(){return l`
      <div>
        ${u.get()?l`<p>Welcome, ${g.get()?.displayName}</p>
              <button @click="${f}">Sign Out</button>
              ${this.playerGraph?l` <div>${this.playerGraph.uid}</div>`:""}
              <peg-player></peg-player>`:l` <button @click="${v}">Sign in with Google</button>`}
      </div>
    `}};D.styles=d`
    :host {
      display: block;
      padding: 16px;
      max-width: 800px;
    }
  `,k([h()],D.prototype,"playerGraph",void 0),D=k([c("peg-bundle-app")],D);export{D as PegBundleApp};
