import {LitElement, html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';

@customElement('my-element')
export class MyElement extends LitElement {
  static override styles = css`
    :host {
      display: block;
      border: solid 1px gray;
      padding: 16px;
      max-width: 800px;
    }
  `;

  @property()
  declare name: string;

  @property({type: Number})
  declare count: number;

  constructor() {
    super();
    this.name = 'World';
    this.count = 0;
  }

  override render() {
    return html`
      <h1>${this.sayHello(this.name)}!</h1>
      <button @click=${this.onClick} part="button">
        Click Count: ${this.count}
      </button>
      <slot></slot>
    `;
  }

  private onClick() {
    this.count += 1;
    this.dispatchEvent(new CustomEvent('count-changed'));
  }

  sayHello(name: string): string {
    return `Hello, ${name}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-element': MyElement;
  }
}
