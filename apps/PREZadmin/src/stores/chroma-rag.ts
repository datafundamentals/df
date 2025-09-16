import { AsyncComputed } from 'signal-utils/async-computed';

/**
 * ChromaRAG Store - Handles all RAG document operations following AsyncComputed patterns
 * Compliant with coding standards: all async operations in stores, not UI components
 */

export interface SaveDocumentRequest {
  documentId: string;
  content: string;
  metadata: any;
}

export interface QueryRequest {
  action: string;
  collection_name: string;
  query: string;
  limit?: number;
  metadata_filter?: any;
}

export interface UpdateDocumentRequest {
  isCreatingNew: boolean;
  document: any;
  content: string;
  filename?: string;
}

export interface LoadFilesRequest {
  resetCollection: boolean;
  verbose: boolean;
}

export interface GetDocumentRequest {
  documentId: string;
}

/**
 * Save a document to ChromaDB
 */
export const saveDocumentAsync = (request: SaveDocumentRequest) => 
  new AsyncComputed(async () => {
    const response = await fetch('/api/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'save_document',
        collection_name: 'rag-documents',
        document: {
          id: request.documentId,
          text: request.content,
          metadata: {
            ...request.metadata,
            timestamp: new Date().toISOString(),
            length: request.content.length,
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Save document failed: ${response.statusText}`);
    }

    return await response.json();
  });

/**
 * Query documents with LLM integration
 */
export const queryWithLLMAsync = (requestBody: any) => 
  new AsyncComputed(async () => {
    const response = await fetch('/api/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Query failed: ${response.statusText}`);
    }

    return await response.json();
  });

/**
 * Update or create a document
 */
export const updateDocumentAsync = (request: UpdateDocumentRequest) => 
  new AsyncComputed(async () => {
    const response = await fetch('/api/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: request.isCreatingNew ? 'save_new_document_with_file' : 'update_document',
        collection_name: 'rag-documents',
        content: request.content, // Pass raw markdown content for bi-directional save
        filename: request.isCreatingNew ? request.filename : undefined,
        document: {
          id: request.document.id,
          text: request.document.text,
          metadata: request.document.metadata,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Update document failed: ${response.statusText}`);
    }

    return await response.json();
  });

/**
 * Get a specific document by ID
 */
export const getDocumentByIdAsync = (_request: GetDocumentRequest) => 
  new AsyncComputed(async () => {
    const response = await fetch('/api/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'query_rag',
        collection_name: 'rag-documents',
        query: '', // Empty/broad query to get more documents
        n_results: 50 // Get more results to increase chance of finding the document
      }),
    });

    if (!response.ok) {
      throw new Error(`Get document failed: ${response.statusText}`);
    }

    return await response.json();
  });

/**
 * Load all RAG files from directory
 */
export const loadAllRAGFilesAsync = (request: LoadFilesRequest) => 
  new AsyncComputed(async () => {
    const response = await fetch('/api/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'load_all_rag_files',
        collection_name: 'rag-documents',
        options: {
          resetCollection: request.resetCollection,
          verbose: request.verbose,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Load files failed: ${response.statusText}`);
    }

    return await response.json();
  });