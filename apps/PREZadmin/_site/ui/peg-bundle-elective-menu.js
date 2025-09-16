import{h as e,i as t,x as a,f as o,r as i,t as s}from"./auth-C1lDTTv0.js";import{a as l}from"./electives-CP-NrN73.js";import"./upload-DZuONd-6.js";var n=function(e,t,a,o){for(var i,s=arguments.length,l=s<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,a):o,n=e.length-1;n>=0;n--)(i=e[n])&&(l=(s<3?i(l):s>3?i(t,a,l):i(t,a))||l);return s>3&&l&&Object.defineProperty(t,a,l),l};let c=class extends(e(t)){constructor(){super(...arguments),this.electives=[]}connectedCallback(){super.connectedCallback(),this.loadElectives()}async loadElectives(){this.electives=await l()}navigateToPage(e){const t=e.target.value;t&&(window.location.href=`/electives/${t}/`)}render(){return a`
      <select @change=${this.navigateToPage}>
        <option value="">Navigate to an Elective</option>
        ${this.electives.map(e=>a`<option value="${e.id}">${e.name}</option>`)}
      </select>
    `}};c.styles=o`
    :host {
      display: block;
      margin: 5px;
      padding: 5px;
    }
  `,n([i()],c.prototype,"electives",void 0),c=n([s("peg-bundle-elective-menu")],c);export{c as PegBundleElectiveMenu};
