import { AsyncComputed } from 'signal-utils/async-computed';
import { createTagSearchComputed } from './tags';
import { createCategorySearchComputed } from './categories';
import { createConceptSearchComputed } from './ontology';

/**
 * Ontological Relationship Discovery Store
 * 
 * Provides semantic relationship discovery through the three-collection architecture:
 * - Tags collection: general keywords and descriptive metadata
 * - Categories collection: hierarchical classification (primary/secondary/reference)
 * - Ontology collection: semantic relationships (isA, childOf, hasA)
 */

export interface RelatedConcept {
  concept: string;
  relationship: 'isA' | 'childOf' | 'hasA' | 'tag' | 'category';
  source: 'tags' | 'categories' | 'ontology';
  confidence?: number;
}

export interface ConceptRelationships {
  concept: string;
  directRelationships: RelatedConcept[];
  indirectRelationships: RelatedConcept[];
  semanticClusters: string[][];
}

/**
 * Discover concepts related to a given concept across all collections
 */
export const discoverRelatedConceptsAsync = (concept: string) =>
  new AsyncComputed(async (): Promise<ConceptRelationships> => {
    if (!concept || !concept.trim()) {
      return {
        concept,
        directRelationships: [],
        indirectRelationships: [],
        semanticClusters: []
      };
    }

    const normalizedConcept = concept.trim().toLowerCase();
    const directRelationships: RelatedConcept[] = [];
    const indirectRelationships: RelatedConcept[] = [];

    try {
      // Search across all three collections
      const [tagsResults, categoriesResults, ontologyResults] = await Promise.all([
        searchInTagsCollection(normalizedConcept),
        searchInCategoriesCollection(normalizedConcept),
        searchInOntologyCollection(normalizedConcept)
      ]);

      // Process direct relationships from tags
      tagsResults.forEach(tag => {
        if (tag.toLowerCase() !== normalizedConcept) {
          directRelationships.push({
            concept: tag,
            relationship: 'tag',
            source: 'tags',
            confidence: calculateSimilarity(normalizedConcept, tag.toLowerCase())
          });
        }
      });

      // Process direct relationships from categories
      categoriesResults.forEach(category => {
        if (category.toLowerCase() !== normalizedConcept) {
          directRelationships.push({
            concept: category,
            relationship: 'category',
            source: 'categories',
            confidence: calculateSimilarity(normalizedConcept, category.toLowerCase())
          });
        }
      });

      // Process direct relationships from ontology
      ontologyResults.forEach(ontologyConcept => {
        if (ontologyConcept.toLowerCase() !== normalizedConcept) {
          // Determine relationship type based on semantic analysis
          const relationshipType = inferRelationshipType(normalizedConcept, ontologyConcept.toLowerCase());
          directRelationships.push({
            concept: ontologyConcept,
            relationship: relationshipType,
            source: 'ontology',
            confidence: calculateSimilarity(normalizedConcept, ontologyConcept.toLowerCase())
          });
        }
      });

      // Find indirect relationships through semantic traversal
      const indirectConcepts = await findIndirectRelationships(directRelationships);
      indirectRelationships.push(...indirectConcepts);

      // Build semantic clusters
      const semanticClusters = buildSemanticClusters([
        ...directRelationships.map(r => r.concept),
        ...indirectRelationships.map(r => r.concept)
      ]);

      return {
        concept,
        directRelationships: sortByConfidence(directRelationships),
        indirectRelationships: sortByConfidence(indirectRelationships),
        semanticClusters
      };

    } catch (error) {
      console.error('Error discovering related concepts:', error);
      return {
        concept,
        directRelationships: [],
        indirectRelationships: [],
        semanticClusters: []
      };
    }
  });

/**
 * Search for concepts in tags collection
 */
async function searchInTagsCollection(concept: string): Promise<string[]> {
  try {
    const searchComputed = createTagSearchComputed(concept);
    await searchComputed.complete;
    return searchComputed.value || [];
  } catch (error) {
    console.error('Error searching tags collection:', error);
    return [];
  }
}

/**
 * Search for concepts in categories collection
 */
async function searchInCategoriesCollection(concept: string): Promise<string[]> {
  try {
    const searchComputed = createCategorySearchComputed(concept);
    await searchComputed.complete;
    return searchComputed.value || [];
  } catch (error) {
    console.error('Error searching categories collection:', error);
    return [];
  }
}

/**
 * Search for concepts in ontology collection
 */
async function searchInOntologyCollection(concept: string): Promise<string[]> {
  try {
    const searchComputed = createConceptSearchComputed(concept);
    await searchComputed.complete;
    return searchComputed.value || [];
  } catch (error) {
    console.error('Error searching ontology collection:', error);
    return [];
  }
}

/**
 * Find indirect relationships by traversing through direct relationships
 */
async function findIndirectRelationships(directRelationships: RelatedConcept[]): Promise<RelatedConcept[]> {
  const indirectConcepts: RelatedConcept[] = [];
  const processedConcepts = new Set<string>();

  // Limit traversal depth to prevent infinite loops (currently not used but reserved for future enhancement)
  
  for (const directRelation of directRelationships.slice(0, 5)) { // Limit to top 5 for performance
    if (processedConcepts.has(directRelation.concept)) continue;
    processedConcepts.add(directRelation.concept);

    try {
      const secondLevelResults = await Promise.all([
        searchInTagsCollection(directRelation.concept),
        searchInCategoriesCollection(directRelation.concept),
        searchInOntologyCollection(directRelation.concept)
      ]);

      const allSecondLevel = [
        ...secondLevelResults[0].map(c => ({ concept: c, source: 'tags' as const })),
        ...secondLevelResults[1].map(c => ({ concept: c, source: 'categories' as const })),
        ...secondLevelResults[2].map(c => ({ concept: c, source: 'ontology' as const }))
      ];

      allSecondLevel.forEach(result => {
        if (!processedConcepts.has(result.concept) && 
            !indirectConcepts.some(ic => ic.concept === result.concept)) {
          indirectConcepts.push({
            concept: result.concept,
            relationship: inferRelationshipType(directRelation.concept, result.concept),
            source: result.source,
            confidence: calculateSimilarity(directRelation.concept, result.concept) * 0.7 // Reduce confidence for indirect
          });
        }
      });
    } catch (error) {
      console.error(`Error finding indirect relationships for ${directRelation.concept}:`, error);
    }
  }

  return indirectConcepts.slice(0, 10); // Limit indirect relationships
}

/**
 * Infer relationship type based on semantic analysis
 */
function inferRelationshipType(concept1: string, concept2: string): 'isA' | 'childOf' | 'hasA' {
  // Simple heuristics for relationship type inference
  // In a real implementation, this could use NLP or ML models
  
  const c1 = concept1.toLowerCase();
  const c2 = concept2.toLowerCase();
  
  // isA relationship indicators
  if (c2.includes(c1) || c1.includes('type') || c1.includes('kind')) {
    return 'isA';
  }
  
  // hasA relationship indicators  
  if (c1.includes('has') || c1.includes('contains') || c1.includes('includes')) {
    return 'hasA';
  }
  
  // Default to childOf for hierarchical relationships
  return 'childOf';
}

/**
 * Calculate similarity between two concepts (simple string similarity)
 */
function calculateSimilarity(concept1: string, concept2: string): number {
  if (concept1 === concept2) return 1.0;
  
  // Simple similarity based on common characters and length
  const c1 = concept1.toLowerCase();
  const c2 = concept2.toLowerCase();
  
  // Exact substring match gets high score
  if (c1.includes(c2) || c2.includes(c1)) return 0.8;
  
  // Calculate Jaccard similarity on character sets
  const set1 = new Set(c1.split(''));
  const set2 = new Set(c2.split(''));
  const intersection = new Set([...set1].filter(c => set2.has(c)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

/**
 * Build semantic clusters from related concepts
 */
function buildSemanticClusters(concepts: string[]): string[][] {
  const clusters: string[][] = [];
  const processed = new Set<string>();
  
  for (const concept of concepts) {
    if (processed.has(concept)) continue;
    
    const cluster = [concept];
    processed.add(concept);
    
    // Find similar concepts for this cluster
    for (const otherConcept of concepts) {
      if (processed.has(otherConcept)) continue;
      
      if (calculateSimilarity(concept, otherConcept) > 0.6) {
        cluster.push(otherConcept);
        processed.add(otherConcept);
      }
    }
    
    if (cluster.length > 1) {
      clusters.push(cluster);
    }
  }
  
  return clusters.sort((a, b) => b.length - a.length); // Sort by cluster size
}

/**
 * Sort relationships by confidence score
 */
function sortByConfidence(relationships: RelatedConcept[]): RelatedConcept[] {
  return relationships.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
}

/**
 * Find concepts that bridge multiple semantic domains
 */
export const findBridgeConceptsAsync = (concepts: string[]) =>
  new AsyncComputed(async (): Promise<string[]> => {
    if (!concepts || concepts.length < 2) return [];
    
    const bridgeConcepts: Map<string, number> = new Map();
    
    // For each pair of concepts, find connecting concepts
    for (let i = 0; i < concepts.length; i++) {
      for (let j = i + 1; j < concepts.length; j++) {
        try {
          const [relations1, relations2] = await Promise.all([
            discoverRelatedConceptsAsync(concepts[i]).complete,
            discoverRelatedConceptsAsync(concepts[j]).complete
          ]);
          
          // Find overlapping concepts
          const concepts1 = new Set([
            ...relations1.directRelationships.map(r => r.concept),
            ...relations1.indirectRelationships.map(r => r.concept)
          ]);
          
          const concepts2 = new Set([
            ...relations2.directRelationships.map(r => r.concept),
            ...relations2.indirectRelationships.map(r => r.concept)
          ]);
          
          // Count bridge concepts
          for (const concept of concepts1) {
            if (concepts2.has(concept)) {
              bridgeConcepts.set(concept, (bridgeConcepts.get(concept) || 0) + 1);
            }
          }
        } catch (error) {
          console.error('Error finding bridge concepts:', error);
        }
      }
    }
    
    // Return concepts that bridge multiple domains, sorted by frequency
    return Array.from(bridgeConcepts.entries())
      .sort(([,a], [,b]) => b - a)
      .map(([concept]) => concept)
      .slice(0, 10);
  });