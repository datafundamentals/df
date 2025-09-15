import{h as e,i as t,m as r,j as a,n as o,x as i,l as n,f as s,o as p,t as l,k as d,s as u}from"./auth-C1lDTTv0.js";import"./awr-upload-link-CoHLMwP0.js";import"./fab-CtcsSBEe.js";import"./upload-DZuONd-6.js";var h=function(e,t,r,a){for(var o,i=arguments.length,n=i<3?t:null===a?a=Object.getOwnPropertyDescriptor(t,r):a,s=e.length-1;s>=0;s--)(o=e[s])&&(n=(i<3?o(n):i>3?o(t,r,n):o(t,r))||n);return i>3&&n&&Object.defineProperty(t,r,n),n};let c=class extends(e(t)){constructor(){super(...arguments),this._pageAuthorState=r,this.resourcePageType="void"}handleTextChange(e,t){switch(t){case"name":this._pageAuthorState.resourceName=e;break;case"markdown":this._pageAuthorState.markdown=e}}handleLink(e,t,r){e&&t&&r?this._pageAuthorState.linkResource={urlMediaType:e,url:t,makeAdd:r}:console.error("INCOMPLETE LINK RESOURCE")}render(){return i`
      <div>
        ${a.get()?i`
              ${o(this._pageAuthorState.persisted,{initial:()=>i`<span> If you see this then this is initial renderAsyncComputed. </span>`,pending:()=>i`<span>If you see this then this is pendng renderAsyncComputed.</span>`,complete:()=>i`
                  <awr-resource-documenter
                    @text-change="${e=>this.handleTextChange(e.detail.value,e.detail.id)}"
                    @link-make-add="${e=>this.handleLink(e.detail.linkType,e.detail.url,e.detail.makeAdd)}"
                    .resourceGraph="${this._pageAuthorState.pageAuthor.resourceGraph}"
                    resourcePageType="pageAuthor"
                  >
                  </awr-resource-documenter>
                `,error:e=>i`<span>Error: ${e}</span>`})}

              <awr-resource-documenter .resourceGraph="${this._pageAuthorState.pageAuthor.resourceGraph}" resourcePageType="pageAuthor">
              </awr-resource-documenter>
              <md-filled-tonal-button @click="${()=>window.location.href='/dev/webpage.html?resourcePageType="pageAuthor.page'}"
                >Add Page
              </md-filled-tonal-button>
            `:i` <button @click="${n}">Sign in with Google</button>`}
      </div>
    `}};c.styles=s`
    :host {
      display: block;
      padding: 16px;
      max-width: 800px;
    }
  `,h([p()],c.prototype,"resourcePageType",void 0),c=h([l("bwp-page-author")],c);var g=function(e,t,r,a){for(var o,i=arguments.length,n=i<3?t:null===a?a=Object.getOwnPropertyDescriptor(t,r):a,s=e.length-1;s>=0;s--)(o=e[s])&&(n=(i<3?o(n):i>3?o(t,r,n):o(t,r))||n);return i>3&&n&&Object.defineProperty(t,r,n),n};let m=class extends(e(t)){render(){return i`
      <div>
        ${a.get()?i`<p>Welcome, ${d.get()?.displayName} ${d.get()?.uid} ${d.get()?.email}</p>
              <md-fab @click="${u}" label="Sign Out" aria-label="Sign Out"> </md-fab>
              <bwp-page-author> </bwp-page-author> `:i`
              <md-fab @click="${n}" label="Sign in with Google" aria-label="Sign in with Google">
                <md-icon slot="icon">^</md-icon>
              </md-fab>
            `}
      </div>
    `}};m.styles=s`
    :host {
      display: block;
      padding: 16px;
      max-width: 800px;
    }
  `,m=g([l("bwp-bundle-app")],m);export{m as BwpBundleApp};
