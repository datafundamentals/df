import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { createProject, deleteProject, getProject, updateProject } from '../stores/project';
import { getElectiveSelect } from '../stores/electives';
import './awr-upload-link';
import './awr-resource-documenter';
import '@material/web/fab/fab.js';
import '@material/web/icon/icon.js';
import '@material/web/textfield/outlined-text-field.js';
import '@material/web/list/list.js';
import { SignalWatcher } from '@lit-labs/signals';

@customElement('peg-player')
export class PegPlayer extends SignalWatcher(LitElement) {
  @state() projects: Array<{
    id: string;
    name?: string;
    points?: number;
    screenshotUrl?: string;
    videoUrl?: string;
    markdown?: string;
    deploymentUrl?: string;
    electives?: string[];
  }> = [];

  @state() electivesOptions: { id: string; name: string }[] = [];
  @state() editingProjectId: string | null = null;
  @state() formData = {
    name: '',
    points: '',
    screenshotUrl: '',
    videoUrl: '',
    markdown: '',
    deploymentUrl: '',
    electives: [] as string[],
  };

  static override styles = css`
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
  `;

  override firstUpdated() {
    this.loadProject();
    this.loadElectives();
  }

  async loadProject() {
    this.projects = await getProject();
  }

  async loadElectives() {
    this.electivesOptions = await getElectiveSelect();
  }

  handleInputChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    if (target.id === 'electives') {
      // Update electives from selected options in the multi-select
      const newElectives = Array.from(target.selectedOptions).map(option => option.value);
      this.formData = { ...this.formData, electives: newElectives };
    } else {
      this.formData = { ...this.formData, [target.id]: target.value };
    }
  }

  async handleCreateOrUpdate() {
    const { name, points, screenshotUrl, videoUrl, markdown, deploymentUrl, electives } = this.formData;
    const projectData = {
      name,
      points: parseInt(points, 10),
      screenshotUrl,
      videoUrl,
      markdown,
      deploymentUrl,
      electives,
    };

    if (this.editingProjectId) {
      await updateProject(this.editingProjectId, projectData);
      this.editingProjectId = null;
    } else {
      await createProject(projectData);
    }
    this.clearForm();
    this.loadProject();
  }

  async handleEdit(projectId: string) {
    const project = this.projects.find(p => p.id === projectId);
    if (project) {
      this.editingProjectId = projectId;
      this.formData = {
        name: project.name || '',
        points: project.points?.toString() || '',
        screenshotUrl: project.screenshotUrl || '',
        videoUrl: project.videoUrl || '',
        markdown: project.markdown || '',
        deploymentUrl: project.deploymentUrl || '',
        electives: project.electives || [],
      };
    }
  }

  async handleDelete(id: string) {
    await deleteProject(id);
    this.loadProject();
  }

  handleImageUrlUpdate(field: keyof typeof this.formData, imageUrl: string) {
    this.formData = { ...this.formData, [field]: imageUrl };
  }

  handleAutoResize(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    if (target.tagName.toLowerCase() === 'md-outlined-text-field') {
      const textarea = target.shadowRoot?.querySelector('textarea') as HTMLTextAreaElement;
      if (textarea) {
        textarea.style.width = '500px';
        textarea.style.height = 'auto'; // Reset height to calculate the new height
        textarea.style.height = `${textarea.scrollHeight}px`; // Set height based on content
      }
    }
  }

  clearForm() {
    this.formData = {
      name: '',
      points: '',
      screenshotUrl: '',
      videoUrl: '',
      markdown: '',
      deploymentUrl: '',
      electives: [],
    };
  }

  override render() {
    return html`
      <h3>${this.editingProjectId ? 'Edit Project' : 'Create New Project'}</h3>
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
        @input="${(e: InputEvent) => {
          this.handleInputChange(e);
          this.handleAutoResize(e);
        }}"
      ></md-outlined-text-field>
      <awr-resource-documenter resourcePageType="player"></awr-resource-documenter>
      <div id="electiveUpdater">TRY MEl</div>
      <label for="chosenElectivesList">ChosenElectives</label>
      <md-list id="chosenElectivesList" style="max-width: 300px;">
        ${this.electivesOptions.map(
          elective => html`
            ${this.formData.electives.includes(elective.id)
              ? html`
                  <md-list-item @click="${() => (this.shadowRoot!.getElementById('electiveUpdater')!.textContent = elective.name)}">
                    ${elective.name}
                  </md-list-item>
                `
              : ''}
          `,
        )}
      </md-list>

      <br />
      <label for="electives">Electives - Choose All</label>
      <select id="electives" multiple @change="${this.handleInputChange}">
        ${this.electivesOptions.map(
          elective =>
            html` <option value="${elective.id}" ?selected="${this.formData.electives.includes(elective.id)}">${elective.name}</option>`,
        )}
      </select>
      <md-fab
        @click="${this.handleCreateOrUpdate}"
        label="Submit"
        aria-label=${this.editingProjectId ? 'Update Project' : 'Create Project'}
      >
        <md-icon slot="icon">^</md-icon>
      </md-fab>
      <h3>Project List</h3>
      <ul>
        ${this.projects.map(
          project => html`
            <li>
              ${project.name} - Points: ${project.points} - Screenshot: ${project.screenshotUrl}
              <button @click="${() => this.handleEdit(project.id)}">Edit</button>
              <button @click="${() => this.handleDelete(project.id)}">Delete</button>
            </li>
          `,
        )}
      </ul>
    `;
  }
}
