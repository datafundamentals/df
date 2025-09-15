import { AsyncComputed } from 'signal-utils/async-computed';
import { discoverRelatedConceptsAsync, findBridgeConceptsAsync } from './ontological-discovery';
import type { RelatedConcept } from './ontological-discovery';

/**
 * Relationship Traversal Store
 * 
 * Provides advanced graph traversal capabilities for navigating semantic relationships.
 * Built on top of the ontological discovery system to enable complex relationship queries.
 */

export interface ConceptPath {
  startConcept: string;
  endConcept: string;
  path: string[];
  relationships: string[];
  pathLength: number;
  confidence: number;
}

export interface ConceptNeighborhood {
  centralConcept: string;
  immediateNeighbors: RelatedConcept[];
  extendedNeighbors: RelatedConcept[];
  neighborhoodClusters: string[][];
  bridgeConcepts: string[];
  pathways: ConceptPath[];
}

export interface RelationshipGraph {
  nodes: ConceptNode[];
  edges: ConceptEdge[];
  clusters: ConceptCluster[];
  centrality: Map<string, number>;
}

export interface ConceptNode {
  concept: string;
  type: 'tag' | 'category' | 'ontology' | 'bridge';
  weight: number;
  collections: string[];
}

export interface ConceptEdge {
  source: string;
  target: string;
  relationship: string;
  weight: number;
  bidirectional: boolean;
}

export interface ConceptCluster {
  id: string;
  concepts: string[];
  clusterType: 'semantic' | 'hierarchical' | 'categorical';
  centroid: string;
}

/**
 * Explore the conceptual neighborhood around a given concept
 */
export const exploreConceptNeighborhoodAsync = (concept: string, depth: number = 2) =>
  new AsyncComputed(async (): Promise<ConceptNeighborhood> => {
    if (!concept || !concept.trim()) {
      return {
        centralConcept: concept,
        immediateNeighbors: [],
        extendedNeighbors: [],
        neighborhoodClusters: [],
        bridgeConcepts: [],
        pathways: []
      };
    }

    try {
      // Get initial relationships
      const initialRelationships = discoverRelatedConceptsAsync(concept);
      await initialRelationships.complete;
      const relationships = initialRelationships.value;
      if (!relationships) {
        return {
          centralConcept: concept,
          immediateNeighbors: [],
          extendedNeighbors: [],
          neighborhoodClusters: [],
          bridgeConcepts: [],
          pathways: []
        };
      }

      const immediateNeighbors = relationships.directRelationships;
      const extendedNeighbors: RelatedConcept[] = [];
      const allNeighborConcepts: string[] = [];

      // Collect all immediate neighbor concepts
      immediateNeighbors.forEach(neighbor => {
        allNeighborConcepts.push(neighbor.concept);
      });

      // Expand to extended neighborhood if depth > 1
      if (depth > 1) {
        const extendedPromises = immediateNeighbors.slice(0, 8).map(async (neighbor) => {
          try {
            const neighborRelationships = discoverRelatedConceptsAsync(neighbor.concept);
            await neighborRelationships.complete;
            return neighborRelationships.value?.directRelationships?.slice(0, 5) || [];
          } catch (error) {
            console.error(`Error exploring neighbor ${neighbor.concept}:`, error);
            return [];
          }
        });

        const extendedResults = await Promise.all(extendedPromises);
        extendedResults.forEach(neighborList => {
          neighborList.forEach(extendedNeighbor => {
            if (extendedNeighbor.concept !== concept && 
                !immediateNeighbors.some(n => n.concept === extendedNeighbor.concept) &&
                !extendedNeighbors.some(n => n.concept === extendedNeighbor.concept)) {
              
              extendedNeighbors.push({
                ...extendedNeighbor,
                confidence: (extendedNeighbor.confidence || 0.5) * 0.8 // Reduce confidence for extended
              });
              allNeighborConcepts.push(extendedNeighbor.concept);
            }
          });
        });
      }

      // Find bridge concepts within the neighborhood
      const bridgeConceptsComputed = findBridgeConceptsAsync(allNeighborConcepts.slice(0, 10));
      await bridgeConceptsComputed.complete;
      const bridgeConcepts = bridgeConceptsComputed.value || [];

      // Build semantic clusters from the neighborhood
      const neighborhoodClusters = buildNeighborhoodClusters([
        concept,
        ...allNeighborConcepts
      ]);

      // Find interesting pathways within the neighborhood
      const pathways = await findConceptPathways(concept, allNeighborConcepts.slice(0, 6));

      return {
        centralConcept: concept,
        immediateNeighbors: immediateNeighbors.slice(0, 12),
        extendedNeighbors: extendedNeighbors.slice(0, 20),
        neighborhoodClusters,
        bridgeConcepts: bridgeConcepts.slice(0, 5),
        pathways: pathways.slice(0, 8)
      };

    } catch (error) {
      console.error('Error exploring concept neighborhood:', error);
      return {
        centralConcept: concept,
        immediateNeighbors: [],
        extendedNeighbors: [],
        neighborhoodClusters: [],
        bridgeConcepts: [],
        pathways: []
      };
    }
  });

/**
 * Find pathways between concepts through the relationship graph
 */
async function findConceptPathways(startConcept: string, targetConcepts: string[]): Promise<ConceptPath[]> {
  const pathways: ConceptPath[] = [];
  
  for (const targetConcept of targetConcepts.slice(0, 3)) {
    if (targetConcept === startConcept) continue;
    
    try {
      const pathway = await findShortestPath(startConcept, targetConcept, 3); // Max depth of 3
      if (pathway) {
        pathways.push(pathway);
      }
    } catch (error) {
      console.error(`Error finding pathway from ${startConcept} to ${targetConcept}:`, error);
    }
  }
  
  return pathways.sort((a, b) => a.pathLength - b.pathLength || (b.confidence - a.confidence));
}

/**
 * Find shortest path between two concepts using BFS
 */
async function findShortestPath(start: string, end: string, maxDepth: number): Promise<ConceptPath | null> {
  const visited = new Set<string>();
  const queue: Array<{concept: string, path: string[], relationships: string[], confidence: number}> = [];
  
  queue.push({
    concept: start,
    path: [start],
    relationships: [],
    confidence: 1.0
  });
  
  visited.add(start);
  
  while (queue.length > 0 && queue[0].path.length <= maxDepth) {
    const current = queue.shift()!;
    
    if (current.concept === end) {
      return {
        startConcept: start,
        endConcept: end,
        path: current.path,
        relationships: current.relationships,
        pathLength: current.path.length - 1,
        confidence: current.confidence
      };
    }
    
    if (current.path.length >= maxDepth) continue;
    
    try {
      const relationsComputed = discoverRelatedConceptsAsync(current.concept);
      await relationsComputed.complete;
      const relations = relationsComputed.value;
      
      if (!relations) continue;
      
      const allRelations = [
        ...relations.directRelationships.slice(0, 5),
        ...relations.indirectRelationships.slice(0, 3)
      ];
      
      for (const relation of allRelations) {
        if (!visited.has(relation.concept)) {
          visited.add(relation.concept);
          queue.push({
            concept: relation.concept,
            path: [...current.path, relation.concept],
            relationships: [...current.relationships, relation.relationship],
            confidence: current.confidence * (relation.confidence || 0.5)
          });
        }
      }
    } catch (error) {
      console.error(`Error expanding path from ${current.concept}:`, error);
    }
  }
  
  return null; // No path found
}

/**
 * Build clusters within a concept neighborhood
 */
function buildNeighborhoodClusters(concepts: string[]): string[][] {
  const clusters: string[][] = [];
  const processed = new Set<string>();
  
  // Group concepts by semantic similarity
  for (const concept of concepts) {
    if (processed.has(concept)) continue;
    
    const cluster = [concept];
    processed.add(concept);
    
    // Find semantically similar concepts
    for (const otherConcept of concepts) {
      if (processed.has(otherConcept)) continue;
      
      if (areSemanticallySimilar(concept, otherConcept)) {
        cluster.push(otherConcept);
        processed.add(otherConcept);
      }
    }
    
    if (cluster.length > 1 || concept.length > 0) {
      clusters.push(cluster);
    }
  }
  
  return clusters
    .filter(cluster => cluster.length > 1) // Only return multi-concept clusters
    .sort((a, b) => b.length - a.length)
    .slice(0, 6); // Limit to 6 clusters
}

/**
 * Check if two concepts are semantically similar
 */
function areSemanticallySimilar(concept1: string, concept2: string): boolean {
  const c1 = concept1.toLowerCase().trim();
  const c2 = concept2.toLowerCase().trim();
  
  if (c1 === c2) return true;
  
  // Check for common words
  const words1 = c1.split(/[\s-_]+/);
  const words2 = c2.split(/[\s-_]+/);
  const commonWords = words1.filter(word => words2.includes(word));
  
  if (commonWords.length > 0 && (words1.length <= 3 || words2.length <= 3)) {
    return true;
  }
  
  // Check for substring relationships
  if (c1.includes(c2) || c2.includes(c1)) {
    return true;
  }
  
  // Check for similar prefixes/suffixes
  const prefixLength = Math.min(3, Math.min(c1.length, c2.length));
  if (prefixLength >= 3 && c1.substring(0, prefixLength) === c2.substring(0, prefixLength)) {
    return true;
  }
  
  return false;
}

/**
 * Build a relationship graph from a set of concepts
 */
export const buildRelationshipGraphAsync = (concepts: string[], maxNodes: number = 50) =>
  new AsyncComputed(async (): Promise<RelationshipGraph> => {
    const nodes: ConceptNode[] = [];
    const edges: ConceptEdge[] = [];
    const nodeMap = new Map<string, ConceptNode>();
    const edgeSet = new Set<string>();
    
    // Limit concepts to prevent excessive computation
    const limitedConcepts = concepts.slice(0, Math.min(maxNodes, concepts.length));
    
    try {
      // Build nodes and edges
      for (const concept of limitedConcepts) {
        if (nodeMap.has(concept)) continue;
        
        // Create node
        const node: ConceptNode = {
          concept,
          type: inferNodeType(concept),
          weight: 1,
          collections: ['ontology'] // Will be updated based on relationships
        };
        nodes.push(node);
        nodeMap.set(concept, node);
        
        // Get relationships for this concept
        try {
          const relationsComputed = discoverRelatedConceptsAsync(concept);
          await relationsComputed.complete;
          const relations = relationsComputed.value;
          
          if (!relations) continue;
          
          // Update node collections based on relationships
          const collections = new Set<string>();
          relations.directRelationships.forEach(rel => collections.add(rel.source));
          node.collections = Array.from(collections);
          
          // Create edges
          const allRelations = [
            ...relations.directRelationships.slice(0, 8),
            ...relations.indirectRelationships.slice(0, 4)
          ];
          
          allRelations.forEach(relation => {
            const edgeKey = `${concept}-${relation.concept}`;
            const reverseEdgeKey = `${relation.concept}-${concept}`;
            
            if (!edgeSet.has(edgeKey) && !edgeSet.has(reverseEdgeKey)) {
              edges.push({
                source: concept,
                target: relation.concept,
                relationship: relation.relationship,
                weight: relation.confidence || 0.5,
                bidirectional: relation.source === 'ontology'
              });
              edgeSet.add(edgeKey);
            }
          });
        } catch (error) {
          console.error(`Error building relationships for ${concept}:`, error);
        }
      }
      
      // Calculate centrality scores
      const centrality = calculateCentrality(nodes, edges);
      
      // Update node weights based on centrality
      nodes.forEach(node => {
        node.weight = centrality.get(node.concept) || 1;
      });
      
      // Build clusters
      const clusters = buildGraphClusters(nodes, edges);
      
      return {
        nodes: nodes.slice(0, maxNodes),
        edges: edges.slice(0, maxNodes * 3), // Limit edges to 3x nodes
        clusters: clusters.slice(0, 8),
        centrality
      };
      
    } catch (error) {
      console.error('Error building relationship graph:', error);
      return {
        nodes: [],
        edges: [],
        clusters: [],
        centrality: new Map()
      };
    }
  });

/**
 * Infer node type based on concept characteristics
 */
function inferNodeType(concept: string): 'tag' | 'category' | 'ontology' | 'bridge' {
  const c = concept.toLowerCase();
  
  // Category indicators
  if (['primary', 'secondary', 'reference'].includes(c)) {
    return 'category';
  }
  
  // Ontology relationship indicators
  if (c.includes('type') || c.includes('kind') || c.includes('class')) {
    return 'ontology';
  }
  
  // Bridge concept indicators (connecting multiple domains)
  if (c.includes('system') || c.includes('framework') || c.includes('platform')) {
    return 'bridge';
  }
  
  // Default to tag
  return 'tag';
}

/**
 * Calculate centrality scores for nodes in the graph
 */
function calculateCentrality(nodes: ConceptNode[], edges: ConceptEdge[]): Map<string, number> {
  const centrality = new Map<string, number>();
  const adjacency = new Map<string, string[]>();
  
  // Initialize adjacency list
  nodes.forEach(node => {
    adjacency.set(node.concept, []);
    centrality.set(node.concept, 0);
  });
  
  // Build adjacency list
  edges.forEach(edge => {
    adjacency.get(edge.source)?.push(edge.target);
    if (edge.bidirectional) {
      adjacency.get(edge.target)?.push(edge.source);
    }
  });
  
  // Calculate degree centrality (simple version)
  adjacency.forEach((neighbors, concept) => {
    centrality.set(concept, neighbors.length);
  });
  
  // Normalize centrality scores
  const maxCentrality = Math.max(...Array.from(centrality.values()));
  if (maxCentrality > 0) {
    centrality.forEach((score, concept) => {
      centrality.set(concept, score / maxCentrality);
    });
  }
  
  return centrality;
}

/**
 * Build clusters from the relationship graph
 */
function buildGraphClusters(nodes: ConceptNode[], edges: ConceptEdge[]): ConceptCluster[] {
  const clusters: ConceptCluster[] = [];
  const processed = new Set<string>();
  
  // Simple clustering based on connected components
  for (const node of nodes) {
    if (processed.has(node.concept)) continue;
    
    const cluster = findConnectedComponent(node.concept, nodes, edges, processed);
    if (cluster.length > 2) {
      clusters.push({
        id: `cluster-${clusters.length}`,
        concepts: cluster,
        clusterType: inferClusterType(cluster),
        centroid: findClusterCentroid(cluster, edges)
      });
    }
  }
  
  return clusters;
}

/**
 * Find connected component starting from a node
 */
function findConnectedComponent(
  startConcept: string, 
  _nodes: ConceptNode[], 
  edges: ConceptEdge[], 
  processed: Set<string>
): string[] {
  const component: string[] = [];
  const stack = [startConcept];
  const visited = new Set<string>();
  
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (visited.has(current)) continue;
    
    visited.add(current);
    processed.add(current);
    component.push(current);
    
    // Find connected nodes
    edges.forEach(edge => {
      if (edge.source === current && !visited.has(edge.target)) {
        stack.push(edge.target);
      }
      if (edge.bidirectional && edge.target === current && !visited.has(edge.source)) {
        stack.push(edge.source);
      }
    });
  }
  
  return component;
}

/**
 * Infer cluster type based on concepts in the cluster
 */
function inferClusterType(concepts: string[]): 'semantic' | 'hierarchical' | 'categorical' {
  const categoryTerms = concepts.filter(c => 
    ['primary', 'secondary', 'reference'].includes(c.toLowerCase())
  );
  
  if (categoryTerms.length > 0) return 'categorical';
  
  const hierarchicalTerms = concepts.filter(c => 
    c.toLowerCase().includes('parent') || 
    c.toLowerCase().includes('child') || 
    c.toLowerCase().includes('type')
  );
  
  if (hierarchicalTerms.length > 0) return 'hierarchical';
  
  return 'semantic';
}

/**
 * Find the centroid (most central concept) in a cluster
 */
function findClusterCentroid(concepts: string[], edges: ConceptEdge[]): string {
  const connectionCounts = new Map<string, number>();
  
  // Initialize counts
  concepts.forEach(concept => connectionCounts.set(concept, 0));
  
  // Count connections within the cluster
  edges.forEach(edge => {
    if (concepts.includes(edge.source) && concepts.includes(edge.target)) {
      connectionCounts.set(edge.source, (connectionCounts.get(edge.source) || 0) + 1);
      if (edge.bidirectional) {
        connectionCounts.set(edge.target, (connectionCounts.get(edge.target) || 0) + 1);
      }
    }
  });
  
  // Return concept with most connections
  let maxConnections = -1;
  let centroid = concepts[0];
  
  connectionCounts.forEach((count, concept) => {
    if (count > maxConnections) {
      maxConnections = count;
      centroid = concept;
    }
  });
  
  return centroid;
}