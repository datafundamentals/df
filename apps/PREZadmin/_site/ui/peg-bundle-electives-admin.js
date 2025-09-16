import{h as e,i as t,x as i,f as a,r as o,t as n}from"./auth-C1lDTTv0.js";import{a as s,c as l,u as r,d}from"./electives-CP-NrN73.js";import"./awr-upload-link-CoHLMwP0.js";import"./upload-DZuONd-6.js";var c=function(e,t,i,a){for(var o,n=arguments.length,s=n<3?t:null===a?a=Object.getOwnPropertyDescriptor(t,i):a,l=e.length-1;l>=0;l--)(o=e[l])&&(s=(n<3?o(s):n>3?o(t,i,s):o(t,i))||s);return n>3&&s&&Object.defineProperty(t,i,s),s};let p=class extends(e(t)){constructor(){super(...arguments),this.electives=[],this.fileName="No screenshot chosen"}connectedCallback(){super.connectedCallback(),this.loadElectives()}async loadElectives(){this.electives=await s()}async handleCreate(){if(this.shadowRoot){const e=this.shadowRoot.getElementById("name").value,t="(this.shadowRoot.getElementById('screenShot') as HTMLInputElement).value;",i=this.shadowRoot.getElementById("creationDate").value,a=parseInt(this.shadowRoot.getElementById("points").value);await l({name:e,screenShot:t,creationDate:i,points:a}),this.loadElectives()}}async handleUpdate(e){const t={points:parseInt(prompt("Points:","0")||"0")};await r(e,t),this.loadElectives()}async handleDelete(e){await d(e),this.loadElectives()}render(){return i`
      <h3>You Probbaly Dont Want to Create New Elective Here</h3>
      <p>
        Problem is, i think this competes with the 'src/util/synchElectives' functionality so you better test both and eliminate one - i
        think the other is dominant??? Check and see
      </p>
      <p>On the other hand, some portion of this may be useful. Again, more research before taking action.</p>
      <input id="name" placeholder="Name" />
      <input id="creationDate" type="date" placeholder="Creation Date" />
      <input id="points" type="number" placeholder="Points Awarded" />

      <input id="uploaded" placeholder="UploadedURL" />
      <uploaded-link resourceLinkType="image"></uploaded-link>
      <button @click="${this.handleCreate}">Create Electives</button>

      <h3>Electives List</h3>
      <ul>
        ${this.electives.map(e=>i`
            <li>
              ${e.name} - Due: ${e.creationDate}
              ${e.screenShot?'"'+e.screenShot+'": Screen Shot':" "}- Points: ${e.points}
              <button @click="${()=>this.handleUpdate(e.id)}">Update</button>
              <button @click="${()=>this.handleDelete(e.id)}">Delete</button>
            </li>
          `)}
      </ul>
      <ul>
        ${this.electives.map(e=>i` <li><a href="/electives/${e.id}">${e.name} </a></li> `)}
      </ul>
    `}};p.styles=a`
    :host {
      display: block;
      border: solid 20px darkorange;
      border-radius: 5px;
      margin: 10px;
      padding: 16px;
    }
    input {
      display: block;
      margin-bottom: 10px;
      button {
        margin: 5px;
      }
      input {
        margin: 5px;
      }
    }
  `,c([o()],p.prototype,"electives",void 0),c([o()],p.prototype,"fileName",void 0),p=c([n("peg-bundle-electives-admin")],p);export{p as PegBundleElectivesAdmin};
