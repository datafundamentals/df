import{c as a,d as r,g as s,h as e,i as t,x as l,f as i,r as n,t as p}from"./auth-C1lDTTv0.js";const o=a(r,"players");var d=function(a,r,s,e){for(var t,l=arguments.length,i=l<3?r:null===e?e=Object.getOwnPropertyDescriptor(r,s):e,n=a.length-1;n>=0;n--)(t=a[n])&&(i=(l<3?t(i):l>3?t(r,s,i):t(r,s))||i);return l>3&&i&&Object.defineProperty(r,s,i),i};let c=class extends(e(t)){constructor(){super(...arguments),this.players=[]}connectedCallback(){super.connectedCallback(),this.loadPlayers()}async loadPlayers(){this.players=await(async()=>(await s(o)).docs.map(a=>({id:a.id,...a.data()})))()}render(){return l`
      <h3>Players List</h3>
      <ul>
        ${this.players.map(a=>l` <li>${a.displayName} - ${a.userId}</li> `)}
      </ul>
    `}};c.styles=i`
    :host {
      display: block;
      border: solid 2px darkred;
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
  `,d([n()],c.prototype,"players",void 0),c=d([p("players-admin")],c);
