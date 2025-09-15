import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { SignalWatcher } from '@lit-labs/signals';
import { exploreConceptNeighborhoodAsync, buildRelationshipGraphAsync } from '../stores/relationship-traversal';
import type { ConceptNeighborhood, RelationshipGraph, ConceptPath } from '../stores/relationship-traversal';
import type { RelatedConcept } from '../stores/ontological-discovery';
import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/icon/icon.js';
import '@material/web/chips/chip-set.js';
import '@material/web/chips/filter-chip.js';

/**
 * Concept Explorer Component
 * 
 * Interactive UI for exploring ontological relationships and semantic connections.
 * Provides visualization and navigation through the three-collection metadata architecture.
 */
@customElement('concept-explorer')
export class ConceptExplorer extends SignalWatcher(LitElement) {
  @property() concept = '';
  @property() explorationDepth = 2;
  @property() maxResults = 20;
  
  @state() private neighborhood: ConceptNeighborhood | null = null;
  @state() private relationshipGraph: RelationshipGraph | null = null;
  @state() private isLoading = false;
  @state() private statusMessage = '';
  @state() private activeView: 'neighborhood' | 'graph' | 'pathways' = 'neighborhood';
  @state() private selectedConcepts: Set<string> = new Set();
  @state() private filterBySource: 'all' | 'tags' | 'categories' | 'ontology' = 'all';
  @state() private showClusters = true;

  static override styles = css`
    :host {
      display: block;
      padding: 20px;
      font-family: var(--md-sys-typescale-body-medium-font, 'Roboto', sans-serif);
    }

    .explorer-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }

    .concept-input {
      flex: 1;
      min-width: 200px;
      padding: 12px;
      border: 2px solid var(--md-sys-color-outline, #79747e);
      border-radius: 8px;
      font-size: 16px;
      font-family: inherit;
    }

    .concept-input:focus {
      outline: none;
      border-color: var(--md-sys-color-primary, #6750a4);
    }

    .controls {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }

    .depth-control {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .depth-input {
      width: 60px;
      padding: 6px;
      border: 1px solid var(--md-sys-color-outline, #79747e);
      border-radius: 4px;
      text-align: center;
    }

    .view-tabs {
      display: flex;
      gap: 4px;
      margin-bottom: 16px;
      border-bottom: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
    }

    .view-tab {
      padding: 12px 16px;
      cursor: pointer;
      border: none;
      background: none;
      font-family: inherit;
      font-size: 14px;
      font-weight: 500;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      border-bottom: 3px solid transparent;
      transition: all 0.2s ease;
    }

    .view-tab.active {
      color: var(--md-sys-color-primary, #6750a4);
      border-bottom-color: var(--md-sys-color-primary, #6750a4);
    }

    .view-tab:hover {
      background-color: var(--md-sys-color-surface-container-lowest, #f7f2fa);
    }

    .filters {
      display: flex;
      gap: 12px;
      align-items: center;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .filter-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .filter-select {
      padding: 6px 12px;
      border: 1px solid var(--md-sys-color-outline, #79747e);
      border-radius: 6px;
      font-family: inherit;
      font-size: 14px;
    }

    .status-message {
      padding: 12px 16px;
      margin-bottom: 16px;
      border-radius: 8px;
      font-size: 14px;
      text-align: center;
    }

    .status-message.loading {
      background-color: var(--md-sys-color-primary-container, #e8def8);
      color: var(--md-sys-color-on-primary-container, #21005d);
    }

    .status-message.error {
      background-color: var(--md-sys-color-error-container, #fce4ec);
      color: var(--md-sys-color-on-error-container, #410002);
    }

    .content-section {
      margin-bottom: 32px;
    }

    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .concept-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 16px;
    }

    .concept-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
      background-color: var(--md-sys-color-surface-container-low, #f7f2fa);
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .concept-chip:hover {
      background-color: var(--md-sys-color-surface-container, #f3edf7);
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .concept-chip.selected {
      background-color: var(--md-sys-color-primary-container, #e8def8);
      color: var(--md-sys-color-on-primary-container, #21005d);
      border-color: var(--md-sys-color-primary, #6750a4);
    }

    .concept-chip.tags {
      border-color: #4caf50;
      background-color: #e8f5e8;
    }

    .concept-chip.categories {
      border-color: #ff9800;
      background-color: #fff3e0;
    }

    .concept-chip.ontology {
      border-color: #2196f3;
      background-color: #e3f2fd;
    }

    .confidence-indicator {
      font-size: 10px;
      opacity: 0.7;
    }

    .relationship-badge {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 8px;
      background-color: var(--md-sys-color-surface-container-high, #ece6f0);
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .clusters-section {
      margin-top: 24px;
    }

    .cluster {
      margin-bottom: 16px;
      padding: 12px;
      border: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
      border-radius: 8px;
      background-color: var(--md-sys-color-surface-container-lowest, #f7f2fa);
    }

    .cluster-title {
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      margin-bottom: 8px;
      font-size: 14px;
    }

    .pathways-section {
      margin-top: 24px;
    }

    .pathway {
      margin-bottom: 16px;
      padding: 12px;
      border: 1px solid var(--md-sys-color-outline-variant, #c7c5d0);
      border-radius: 8px;
      background-color: var(--md-sys-color-surface, #fffbfe);
    }

    .pathway-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .pathway-title {
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      font-size: 14px;
    }

    .pathway-metrics {
      display: flex;
      gap: 12px;
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .pathway-path {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .path-arrow {
      color: var(--md-sys-color-on-surface-variant, #49454f);
      font-size: 12px;
    }

    .empty-state {
      text-align: center;
      padding: 32px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .empty-state md-icon {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    @media (max-width: 768px) {
      .explorer-header {
        flex-direction: column;
        align-items: stretch;
      }

      .concept-input {
        min-width: unset;
      }

      .controls {
        justify-content: center;
      }

      .concept-chips {
        justify-content: center;
      }
    }
  `;

  private async exploreCurrentConcept() {
    if (!this.concept.trim()) {
      this.statusMessage = 'Please enter a concept to explore';
      return;
    }

    this.isLoading = true;
    this.statusMessage = 'Exploring concept relationships...';
    this.neighborhood = null;
    this.relationshipGraph = null;

    try {
      // Get neighborhood exploration
      const neighborhoodComputed = exploreConceptNeighborhoodAsync(this.concept.trim(), this.explorationDepth);
      await neighborhoodComputed.complete;
      this.neighborhood = neighborhoodComputed.value || null;

      // Build relationship graph from all discovered concepts
      if (this.neighborhood) {
        const allConcepts = [
          this.neighborhood.centralConcept,
          ...this.neighborhood.immediateNeighbors.map(n => n.concept),
          ...this.neighborhood.extendedNeighbors.slice(0, 10).map(n => n.concept)
        ];

        const graphComputed = buildRelationshipGraphAsync(allConcepts, this.maxResults);
        await graphComputed.complete;
        this.relationshipGraph = graphComputed.value || null;
      }

      this.statusMessage = '';
    } catch (error) {
      console.error('Error exploring concept:', error);
      this.statusMessage = 'Error exploring concept relationships. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  private handleConceptInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.concept = input.value;
  }

  private handleDepthChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = parseInt(input.value);
    this.explorationDepth = Math.max(1, Math.min(3, isNaN(value) ? 2 : value));
  }

  private handleViewChange(view: 'neighborhood' | 'graph' | 'pathways') {
    this.activeView = view;
  }

  private handleFilterChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.filterBySource = select.value as 'all' | 'tags' | 'categories' | 'ontology';
  }

  private toggleConceptSelection(concept: string) {
    const newSelected = new Set(this.selectedConcepts);
    if (newSelected.has(concept)) {
      newSelected.delete(concept);
    } else {
      newSelected.add(concept);
    }
    this.selectedConcepts = newSelected;
  }

  private async exploreSelectedConcepts() {
    if (this.selectedConcepts.size === 0) {
      this.statusMessage = 'Please select concepts to explore together';
      return;
    }

    this.isLoading = true;
    this.statusMessage = 'Building relationship graph for selected concepts...';

    try {
      const selectedArray = Array.from(this.selectedConcepts);
      const graphComputed = buildRelationshipGraphAsync(selectedArray, this.maxResults);
      await graphComputed.complete;
      this.relationshipGraph = graphComputed.value || null;
      this.activeView = 'graph';
      this.statusMessage = '';
    } catch (error) {
      console.error('Error exploring selected concepts:', error);
      this.statusMessage = 'Error building relationship graph. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  private getFilteredRelationships(relationships: RelatedConcept[]): RelatedConcept[] {
    if (this.filterBySource === 'all') return relationships;
    return relationships.filter(rel => rel.source === this.filterBySource);
  }

  private renderNeighborhoodView() {
    if (!this.neighborhood) {
      return html`
        <div class="empty-state">
          <md-icon>explore</md-icon>
          <p>Enter a concept above and click "Explore" to discover related concepts</p>
        </div>
      `;
    }

    const filteredImmediate = this.getFilteredRelationships(this.neighborhood.immediateNeighbors);
    const filteredExtended = this.getFilteredRelationships(this.neighborhood.extendedNeighbors);

    return html`
      <div class="content-section">
        <div class="section-title">
          <md-icon>hub</md-icon>
          Central Concept: ${this.neighborhood.centralConcept}
        </div>
      </div>

      ${filteredImmediate.length > 0 ? html`
        <div class="content-section">
          <div class="section-title">
            <md-icon>radio_button_checked</md-icon>
            Direct Relationships (${filteredImmediate.length})
          </div>
          <div class="concept-chips">
            ${filteredImmediate.map(rel => this.renderConceptChip(rel))}
          </div>
        </div>
      ` : ''}

      ${filteredExtended.length > 0 ? html`
        <div class="content-section">
          <div class="section-title">
            <md-icon>radio_button_unchecked</md-icon>
            Extended Relationships (${filteredExtended.length})
          </div>
          <div class="concept-chips">
            ${filteredExtended.map(rel => this.renderConceptChip(rel))}
          </div>
        </div>
      ` : ''}

      ${this.neighborhood.bridgeConcepts.length > 0 ? html`
        <div class="content-section">
          <div class="section-title">
            <md-icon>account_tree</md-icon>
            Bridge Concepts
          </div>
          <div class="concept-chips">
            ${this.neighborhood.bridgeConcepts.map(concept => html`
              <span class="concept-chip bridge" @click=${() => this.toggleConceptSelection(concept)}>
                ${concept}
                <span class="relationship-badge">bridge</span>
              </span>
            `)}
          </div>
        </div>
      ` : ''}

      ${this.showClusters && this.neighborhood.neighborhoodClusters.length > 0 ? html`
        <div class="clusters-section">
          <div class="section-title">
            <md-icon>group_work</md-icon>
            Semantic Clusters
          </div>
          ${this.neighborhood.neighborhoodClusters.map((cluster, index) => html`
            <div class="cluster">
              <div class="cluster-title">Cluster ${index + 1} (${cluster.length} concepts)</div>
              <div class="concept-chips">
                ${cluster.map(concept => html`
                  <span class="concept-chip" @click=${() => this.toggleConceptSelection(concept)}>
                    ${concept}
                  </span>
                `)}
              </div>
            </div>
          `)}
        </div>
      ` : ''}
    `;
  }

  private renderGraphView() {
    if (!this.relationshipGraph) {
      return html`
        <div class="empty-state">
          <md-icon>account_tree</md-icon>
          <p>No relationship graph available. Explore a concept first or select concepts to build a graph.</p>
        </div>
      `;
    }

    return html`
      <div class="content-section">
        <div class="section-title">
          <md-icon>account_tree</md-icon>
          Relationship Graph (${this.relationshipGraph.nodes.length} nodes, ${this.relationshipGraph.edges.length} edges)
        </div>
        <div class="concept-chips">
          ${this.relationshipGraph.nodes.map(node => html`
            <span class="concept-chip ${node.type}" 
                  @click=${() => this.toggleConceptSelection(node.concept)}>
              ${node.concept}
              <span class="relationship-badge">${node.type}</span>
              <span class="confidence-indicator">w:${node.weight.toFixed(2)}</span>
            </span>
          `)}
        </div>
      </div>

      ${this.relationshipGraph.clusters.length > 0 ? html`
        <div class="clusters-section">
          <div class="section-title">
            <md-icon>group_work</md-icon>
            Graph Clusters
          </div>
          ${this.relationshipGraph.clusters.map(cluster => html`
            <div class="cluster">
              <div class="cluster-title">
                ${cluster.clusterType} cluster (${cluster.concepts.length} concepts)
                <span style="font-weight: normal; font-size: 12px;">
                  - centroid: ${cluster.centroid}
                </span>
              </div>
              <div class="concept-chips">
                ${cluster.concepts.map(concept => html`
                  <span class="concept-chip" @click=${() => this.toggleConceptSelection(concept)}>
                    ${concept}
                    ${concept === cluster.centroid ? html`<span class="relationship-badge">center</span>` : ''}
                  </span>
                `)}
              </div>
            </div>
          `)}
        </div>
      ` : ''}
    `;
  }

  private renderPathwaysView() {
    if (!this.neighborhood || this.neighborhood.pathways.length === 0) {
      return html`
        <div class="empty-state">
          <md-icon>route</md-icon>
          <p>No concept pathways found. Explore a concept to discover connection paths.</p>
        </div>
      `;
    }

    return html`
      <div class="pathways-section">
        <div class="section-title">
          <md-icon>route</md-icon>
          Concept Pathways (${this.neighborhood.pathways.length})
        </div>
        ${this.neighborhood.pathways.map(pathway => this.renderPathway(pathway))}
      </div>
    `;
  }

  private renderPathway(pathway: ConceptPath) {
    return html`
      <div class="pathway">
        <div class="pathway-header">
          <div class="pathway-title">
            ${pathway.startConcept} → ${pathway.endConcept}
          </div>
          <div class="pathway-metrics">
            <span>Length: ${pathway.pathLength}</span>
            <span>Confidence: ${(pathway.confidence * 100).toFixed(1)}%</span>
          </div>
        </div>
        <div class="pathway-path">
          ${pathway.path.map((concept, index) => html`
            <span class="concept-chip" @click=${() => this.toggleConceptSelection(concept)}>
              ${concept}
            </span>
            ${index < pathway.path.length - 1 ? html`
              <span class="path-arrow">→</span>
              ${index < pathway.relationships.length ? html`
                <span class="relationship-badge">${pathway.relationships[index]}</span>
              ` : ''}
            ` : ''}
          `)}
        </div>
      </div>
    `;
  }

  private renderConceptChip(rel: RelatedConcept) {
    return html`
      <span class="concept-chip ${rel.source} ${this.selectedConcepts.has(rel.concept) ? 'selected' : ''}" 
            @click=${() => this.toggleConceptSelection(rel.concept)}>
        ${rel.concept}
        <span class="relationship-badge">${rel.relationship}</span>
        ${rel.confidence ? html`
          <span class="confidence-indicator">${(rel.confidence * 100).toFixed(0)}%</span>
        ` : ''}
      </span>
    `;
  }

  override render() {
    return html`
      <div class="explorer-header">
        <input
          type="text"
          class="concept-input"
          placeholder="Enter a concept to explore (e.g., 'javascript', 'framework', 'database')"
          .value=${this.concept}
          @input=${this.handleConceptInput}
          @keydown=${(e: KeyboardEvent) => e.key === 'Enter' && this.exploreCurrentConcept()}
        />
        
        <div class="controls">
          <div class="depth-control">
            <label>Depth:</label>
            <input
              type="number"
              class="depth-input"
              min="1"
              max="3"
              .value=${this.explorationDepth.toString()}
              @change=${this.handleDepthChange}
            />
          </div>
          
          <md-filled-button 
            @click=${this.exploreCurrentConcept}
            ?disabled=${this.isLoading || !this.concept.trim()}>
            ${this.isLoading ? 'Exploring...' : 'Explore'}
          </md-filled-button>
          
          ${this.selectedConcepts.size > 0 ? html`
            <md-outlined-button @click=${this.exploreSelectedConcepts} ?disabled=${this.isLoading}>
              Graph Selected (${this.selectedConcepts.size})
            </md-outlined-button>
          ` : ''}
        </div>
      </div>

      <div class="view-tabs">
        <button class="view-tab ${this.activeView === 'neighborhood' ? 'active' : ''}"
                @click=${() => this.handleViewChange('neighborhood')}>
          Neighborhood
        </button>
        <button class="view-tab ${this.activeView === 'graph' ? 'active' : ''}"
                @click=${() => this.handleViewChange('graph')}>
          Graph
        </button>
        <button class="view-tab ${this.activeView === 'pathways' ? 'active' : ''}"
                @click=${() => this.handleViewChange('pathways')}>
          Pathways
        </button>
      </div>

      <div class="filters">
        <div class="filter-group">
          <label>Source:</label>
          <select class="filter-select" @change=${this.handleFilterChange}>
            <option value="all">All Sources</option>
            <option value="tags">Tags Only</option>
            <option value="categories">Categories Only</option>
            <option value="ontology">Ontology Only</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>
            <input type="checkbox" 
                   ?checked=${this.showClusters}
                   @change=${(e: Event) => this.showClusters = (e.target as HTMLInputElement).checked}>
            Show Clusters
          </label>
        </div>
      </div>

      ${this.statusMessage ? html`
        <div class="status-message ${this.isLoading ? 'loading' : 'error'}">
          ${this.statusMessage}
        </div>
      ` : ''}

      ${this.activeView === 'neighborhood' ? this.renderNeighborhoodView() : ''}
      ${this.activeView === 'graph' ? this.renderGraphView() : ''}
      ${this.activeView === 'pathways' ? this.renderPathwaysView() : ''}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'concept-explorer': ConceptExplorer;
  }
}