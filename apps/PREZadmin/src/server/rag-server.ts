import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';
import axios from 'axios';
import { ChromaClient } from 'chromadb';
import { OllamaEmbeddingFunction } from '@chroma-core/ollama';
import dotenv from 'dotenv';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure dotenv to load from the project root
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

// Environment configuration
const env = {
  PORT: parseInt(process.env.PORT || '5011', 10),
  CHROMADB_HOST: process.env.CHROMADB_HOST || 'localhost',
  CHROMADB_PORT: parseInt(process.env.CHROMADB_PORT || '8000', 10),
  OLLAMA_URL: process.env.OLLAMA_URL || 'http://localhost:11434/',
  EMBEDDING_MODEL: process.env.EMBEDDING_MODEL || 'nomic-embed-text',
  DEFAULT_N_RESULTS: parseInt(process.env.DEFAULT_N_RESULTS || '3', 10),
  DEFAULT_MARKDOWN_SOURCE_DIR: process.env.DEFAULT_MARKDOWN_SOURCE_DIR,
  TEMPLATE_FILE: process.env.TEMPLATE_FILE,
};

const app = express();

// Initialize ChromaDB client
const chroma = new ChromaClient({
  host: env.CHROMADB_HOST,
  port: env.CHROMADB_PORT,
});

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, '..', '..', 'dev')));

// Define interfaces for type safety
interface DocumentMetadata {
  title?: string | null;
  category?: string | null;
  tags?: string | null;
  is_a?: string | null;
  child_of?: string | null;
  has_a?: string | null;
  [key: string]: string | number | boolean | null | undefined;
}

interface Document {
  id: string;
  text: string;
  metadata: DocumentMetadata;
}

interface QueryRequestBody {
  action: string;
  collection_name: string;
  document?: Document;
  query?: string;
  n_results?: number;
  metadata_filters?: Record<string, unknown>;
  concept?: string;
  directory?: string;
  file_path?: string;
  content?: string;
  filename?: string;
  contextOnlyMode?: boolean;
  options?: {
    resetCollection?: boolean;
    verbose?: boolean;
  };
}

interface ContextItem {
  document: string;
  distance?: number | null;
  metadata: DocumentMetadata;
  id: string;
}

// Custom endpoint to handle ChromaDB operations
app.post('/api/v2', async (req: Request<{}, {}, QueryRequestBody>, res: Response) => {
  try {
    const { action, collection_name, document } = req.body;

    if (action === 'save_document') {
      console.log(`Saving document ${document?.id} to collection ${collection_name}`);

      // Debug: List all collections first
      try {
        const collections = await chroma.listCollections();
        console.log(
          'Existing collections:',
          collections.map(c => c.name),
        );
      } catch (error) {
        console.log('Error listing collections:', (error as Error).message);
      }

      // Create embedding function for nomic-embed-text via Ollama
      const embedder = new OllamaEmbeddingFunction({
        url: 'http://localhost:11434/',
        model: 'nomic-embed-text',
      });

      // Get or create collection with nomic-embed-text embedding function
      let collection;
      try {
        collection = await chroma.getCollection({
          name: collection_name,
          embeddingFunction: embedder,
        });
        console.log(`Using existing collection: ${collection_name}`);
      } catch (error) {
        console.log(`Creating new collection: ${collection_name}`);
        collection = await chroma.getOrCreateCollection({
          name: collection_name,
          embeddingFunction: embedder,
        });
      }

      // Add document to collection
      if (document) {
        await collection.add({
          documents: [document.text],
          metadatas: [document.metadata as Record<string, string | number | boolean | null>],
          ids: [document.id],
        });
      }

      const result = {
        success: true,
        collection: collection_name,
        document_id: document?.id,
        timestamp: new Date().toISOString(),
        embedding_model: 'nomic-embed-text',
      };

      console.log('Document saved successfully:', result);
      res.json(result);
    } else if (action === 'update_document') {
      console.log(`Updating document ${document?.id} in collection ${collection_name}`);

      // Create embedding function for nomic-embed-text via Ollama
      const embedder = new OllamaEmbeddingFunction({
        url: 'http://localhost:11434/',
        model: 'nomic-embed-text',
      });

      // Get collection with nomic-embed-text embedding function
      const collection = await chroma.getCollection({
        name: collection_name,
        embeddingFunction: embedder,
      });

      // Get original document to extract filepath for bi-directional save
      let originalFilePath: string | null = null;
      let originalMetadata: DocumentMetadata | null = null;
      try {
        const existingDoc = await collection.get({ ids: [document?.id || ''] });
        if (existingDoc.metadatas.length > 0) {
          originalMetadata = existingDoc.metadatas[0] as DocumentMetadata;
          originalFilePath = originalMetadata.filepath as string || null;
        }
      } catch (error) {
        console.log('Could not retrieve original document metadata:', error);
      }

      // Update document in collection (ChromaDB upsert pattern)
      if (document) {
        await collection.upsert({
          documents: [document.text],
          metadatas: [document.metadata as Record<string, string | number | boolean | null>],
          ids: [document.id],
        });
      }

      // Bi-directional save: Write back to filesystem if we have content and filepath
      // IMPORTANT: Do this AFTER ChromaDB upsert so we get the updated metadata
      let fileWriteResult = null;
      if (req.body.content && originalFilePath) {
        
        // Get the UPDATED metadata from ChromaDB after upsert
        let updatedMetadata: DocumentMetadata | null = null;
        try {
          const freshDoc = await collection.get({ ids: [document?.id || ''] });
          if (freshDoc.metadatas.length > 0) {
            updatedMetadata = freshDoc.metadatas[0] as DocumentMetadata;
          }
        } catch (error) {
          console.log('Could not retrieve fresh document metadata, using original');
          updatedMetadata = originalMetadata;
        }
        try {
          
          // Import file processing utilities
          const { parseMarkdown, stringifyMarkdown, countTokens } = await import('../services/file-processing.js');
          
          // Parse the current content to extract frontmatter and body
          const parsed = parseMarkdown(req.body.content);
          
          // Update frontmatter with new values - use FRESH metadata as base
          // Note: parsed.data will be empty if content has no frontmatter, which is expected
          const updatedParsed = {
            content: parsed.content,
            data: {
              ...(updatedMetadata || {}),  // Start with FRESH metadata from ChromaDB (post-upsert)
              ...parsed.data,              // Override with any frontmatter from edited content (if any)
              last_updated: new Date().toISOString(),
              tokenCount: countTokens(parsed.content),
              // Remove internal ChromaDB fields that shouldn't be in frontmatter
              filename: undefined,
              filepath: undefined,
              source: undefined,
              timestamp: undefined,
              length: undefined,
            }
          };
          
          
          // Clean up undefined values
          Object.keys(updatedParsed.data).forEach(key => {
            if ((updatedParsed.data as any)[key] === undefined) {
              delete (updatedParsed.data as any)[key];
            }
          });
          
          // Serialize back to markdown with updated frontmatter
          const updatedContent = stringifyMarkdown(updatedParsed);
          
          // Write to filesystem
          await fs.writeFile(originalFilePath, updatedContent, 'utf-8');
          
          fileWriteResult = {
            filepath: originalFilePath,
            tokenCount: updatedParsed.data.tokenCount,
            last_updated: updatedParsed.data.last_updated,
          };
          
          
        } catch (error) {
          console.error('Error writing document to filesystem:', error);
          fileWriteResult = {
            error: `Failed to write to filesystem: ${(error as Error).message}`,
          };
        }
      }

      const result = {
        success: true,
        collection: collection_name,
        document_id: document?.id,
        timestamp: new Date().toISOString(),
        embedding_model: 'nomic-embed-text',
        action: 'updated',
        fileWrite: fileWriteResult,
      };

      console.log('Document updated successfully:', result);
      res.json(result);
    } else if (action === 'list_collections') {
      const collections = await chroma.listCollections();
      res.json({ collections: collections.map(c => ({ name: c.name, id: c.id })) });
    } else if (action === 'get_collection_info') {
      const collection = await chroma.getCollection({ name: collection_name });
      const count = await collection.count();
      res.json({
        name: collection_name,
        count: count,
        id: collection.id,
      });
    } else if (action === 'get_documents') {
      const collection = await chroma.getCollection({ name: collection_name });
      const results = await collection.get();
      res.json(results);
    } else if (action === 'query_rag') {
      console.log(`Processing RAG query: "${req.body.query}"`);

      // Step 1: Retrieve relevant documents from ChromaDB
      const embedder = new OllamaEmbeddingFunction({
        url: 'http://localhost:11434/',
        model: 'nomic-embed-text',
      });

      const collection = await chroma.getCollection({
        name: collection_name,
        embeddingFunction: embedder,
      });

      const queryParams = {
        queryTexts: [req.body.query!],
        nResults: req.body.n_results || parseInt(process.env.DEFAULT_N_RESULTS || '3'),
      };
      
      console.log(`🔍 Query params: nResults=${queryParams.nResults}`);

      const searchResults = await collection.query(queryParams);

      console.log(`Found ${searchResults.documents[0].length} relevant documents`);

      // Step 2: Prepare context from retrieved documents
      const contextDocuments = searchResults.documents[0];
      const distances = searchResults.distances?.[0] || [];
      const metadatas = searchResults.metadatas?.[0] || [];
      const ids = searchResults.ids?.[0] || [];
      const context: ContextItem[] = contextDocuments.map((doc, index) => ({
        document: doc || '',
        distance: distances[index] || null,
        metadata: (metadatas[index] as DocumentMetadata) || {},
        id: ids[index] || '',
      }));

      // Step 3: Generate response using Ollama
      const contextWithMetadata = context
        .map(item => {
          let metadataInfo = '';
          if (item.metadata && Object.keys(item.metadata).length > 0) {
            const metaParts: string[] = [];
            if (item.metadata.title) metaParts.push(`Title: ${item.metadata.title}`);
            if (item.metadata.category) metaParts.push(`Category: ${item.metadata.category}`);
            if (item.metadata.tags) metaParts.push(`Tags: ${item.metadata.tags}`);
            if (item.metadata.is_a) metaParts.push(`Is a: ${item.metadata.is_a}`);

            if (metaParts.length > 0) {
              metadataInfo = `[${metaParts.join(' | ')}]\n`;
            }
          }
          return `${metadataInfo}${item.document}`;
        })
        .join('\n\n---\n\n');

      // Build prompt based on contextOnlyMode setting
      const contextOnlyMode = req.body.contextOnlyMode !== false; // Default to true for backward compatibility
      
      const prompt = contextOnlyMode 
        ? `You must answer the user's question using ONLY the information provided in the context documents below. Do not use any external knowledge. If the context contains relevant information, use it to answer the question directly and completely.

Context Documents:
${contextWithMetadata}

Question: ${req.body.query}

Answer based on the context above:`
        : `Please answer the user's question. I'm providing some relevant context documents that might be helpful, but you can also use your general knowledge to provide a comprehensive answer.

Context Documents:
${contextWithMetadata}

Question: ${req.body.query}

Answer:`;
// command-r-plus
// llama3.1
// qwen2:72b-instruct

      const modelName = 'llama3.1';
      console.log(`🤖 Using Ollama model: ${modelName}`);
      console.log(`🎯 Context-only mode: ${contextOnlyMode}`);
      
      try {
        const ollamaResponse = await axios.post('http://localhost:11434/api/generate', {
          model: modelName,
          prompt: prompt,
          stream: false,
        });

        const aiResponse = ollamaResponse.data.response;
        console.log(`✅ AI response generated successfully using ${modelName}`);

        res.json({
          success: true,
          query: req.body.query,
          context: context,
          response: aiResponse,
          model: modelName,
          timestamp: new Date().toISOString(),
        });
      } catch (ollamaError) {
        console.error('Ollama API error:', (ollamaError as Error).message);

        // Fallback: return context without AI response
        res.json({
          success: true,
          query: req.body.query,
          context: context,
          response: `I found relevant information but couldn't generate a response. Ollama error: ${(ollamaError as Error).message}`,
          timestamp: new Date().toISOString(),
        });
      }
    } else if (action === 'find_by_parent_concept') {
      console.log(`Finding documents by parent concept: "${req.body.concept}"`);

      const collection = await chroma.getCollection({ name: collection_name });

      // Get all documents first, then filter client-side since ChromaDB has limited string matching
      const allResults = await collection.get();

      // Filter documents that contain the concept in their child_of field
      const filteredResults = {
        documents: [] as string[],
        metadatas: [] as DocumentMetadata[],
        ids: [] as string[],
      };

      for (let i = 0; i < allResults.documents.length; i++) {
        const metadata = allResults.metadatas[i] as DocumentMetadata;
        const document = allResults.documents[i];
        const id = allResults.ids[i];
        if (
          metadata &&
          metadata.child_of &&
          req.body.concept &&
          matchesConceptInDelimitedField(metadata.child_of, req.body.concept) &&
          document &&
          id
        ) {
          filteredResults.documents.push(document);
          filteredResults.metadatas.push(metadata);
          filteredResults.ids.push(id);
        }
      }

      const results = filteredResults;

      console.log(`Found ${results.documents.length} documents with parent concept "${req.body.concept}"`);

      // Format results similar to query_rag response
      const formattedResults = results.documents.map((doc, index) => ({
        document: doc,
        metadata: results.metadatas[index] || {},
        id: results.ids[index],
      }));

      res.json({
        success: true,
        concept: req.body.concept,
        results: formattedResults,
        count: formattedResults.length,
        timestamp: new Date().toISOString(),
      });
    } else if (action === 'find_by_is_a') {
      console.log(`Finding documents by is_a relationship: "${req.body.concept}"`);

      const collection = await chroma.getCollection({ name: collection_name });

      // Get all documents first, then filter client-side since ChromaDB has limited string matching
      const allResults = await collection.get();
      console.log(`🔍 Total documents to search: ${allResults.documents.length}`);

      // Filter documents that contain the concept in their is_a field
      const filteredResults = {
        documents: [] as string[],
        metadatas: [] as DocumentMetadata[],
        ids: [] as string[],
      };

      let matchCount = 0;
      let emptyIsACount = 0;
      let hasIsACount = 0;

      for (let i = 0; i < allResults.documents.length; i++) {
        const metadata = allResults.metadatas[i] as DocumentMetadata;
        const document = allResults.documents[i];
        const id = allResults.ids[i];
        
        // Track statistics
        if (metadata && metadata.is_a) {
          if (metadata.is_a.trim() === '') {
            emptyIsACount++;
          } else {
            hasIsACount++;
            // Log first few non-empty is_a values for debugging
            if (hasIsACount <= 5) {
              console.log(`📋 Sample is_a value: "${metadata.is_a}"`);
            }
          }
        }
        
        if (
          metadata &&
          metadata.is_a &&
          req.body.concept &&
          matchesConceptInDelimitedField(metadata.is_a, req.body.concept) &&
          document &&
          id
        ) {
          matchCount++;
          // Log first few matches for debugging
          if (matchCount <= 3) {
            console.log(`✅ Match ${matchCount}: is_a="${metadata.is_a}"`);
          }
          filteredResults.documents.push(document);
          filteredResults.metadatas.push(metadata);
          filteredResults.ids.push(id);
        }
      }

      console.log(`📊 Search Statistics:`, {
        totalDocuments: allResults.documents.length,
        emptyIsACount,
        hasIsACount,
        finalMatches: matchCount
      });

      const results = filteredResults;

      console.log(`Found ${results.documents.length} documents with is_a relationship "${req.body.concept}"`);

      // Format results similar to query_rag response
      const formattedResults = results.documents.map((doc, index) => ({
        document: doc,
        metadata: results.metadatas[index] || {},
        id: results.ids[index],
      }));

      res.json({
        success: true,
        concept: req.body.concept,
        results: formattedResults,
        count: formattedResults.length,
        timestamp: new Date().toISOString(),
      });
    } else if (action === 'find_by_has_a') {
      console.log(`Finding documents by has_a relationship: "${req.body.concept}"`);

      const collection = await chroma.getCollection({ name: collection_name });

      // Get all documents first, then filter client-side since ChromaDB has limited string matching
      const allResults = await collection.get();

      // Filter documents that contain the concept in their has_a field
      const filteredResults = {
        documents: [] as string[],
        metadatas: [] as DocumentMetadata[],
        ids: [] as string[],
      };

      for (let i = 0; i < allResults.documents.length; i++) {
        const metadata = allResults.metadatas[i] as DocumentMetadata;
        const document = allResults.documents[i];
        const id = allResults.ids[i];
        if (
          metadata &&
          metadata.has_a &&
          req.body.concept &&
          matchesConceptInDelimitedField(metadata.has_a, req.body.concept) &&
          document &&
          id
        ) {
          filteredResults.documents.push(document);
          filteredResults.metadatas.push(metadata);
          filteredResults.ids.push(id);
        }
      }

      const results = filteredResults;

      console.log(`Found ${results.documents.length} documents with has_a relationship "${req.body.concept}"`);

      // Format results similar to query_rag response
      const formattedResults = results.documents.map((doc, index) => ({
        document: doc,
        metadata: results.metadatas[index] || {},
        id: results.ids[index],
      }));

      res.json({
        success: true,
        concept: req.body.concept,
        results: formattedResults,
        count: formattedResults.length,
        timestamp: new Date().toISOString(),
      });
    } else if (action === 'browse_directory') {
      console.log(`Browsing directory: ${req.body.directory || 'DEFAULT_MARKDOWN_SOURCE_DIR'}`);

      const targetDirectory = req.body.directory || process.env.DEFAULT_MARKDOWN_SOURCE_DIR;
      
      if (!targetDirectory) {
        res.status(400).json({ 
          error: 'No directory specified and DEFAULT_MARKDOWN_SOURCE_DIR not set' 
        });
        return;
      }

      try {
        // Check if directory exists and is accessible
        const stats = await fs.stat(targetDirectory);
        if (!stats.isDirectory()) {
          res.status(400).json({ 
            error: `Path ${targetDirectory} is not a directory` 
          });
          return;
        }

        // Read directory contents
        const entries = await fs.readdir(targetDirectory, { withFileTypes: true });
        
        // Filter and format entries
        const files = entries
          .filter(entry => entry.isFile() && (
            entry.name.endsWith('.md') || 
            entry.name.endsWith('.markdown') ||
            entry.name.endsWith('.txt')
          ))
          .map(entry => ({
            name: entry.name,
            path: path.join(targetDirectory, entry.name),
            type: 'file'
          }));

        const directories = entries
          .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
          .map(entry => ({
            name: entry.name,
            path: path.join(targetDirectory, entry.name),
            type: 'directory'
          }));

        res.json({
          success: true,
          directory: targetDirectory,
          files: files,
          directories: directories,
          total_files: files.length,
          total_directories: directories.length,
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        console.error('Directory browsing error:', error);
        res.status(500).json({ 
          error: `Failed to browse directory: ${(error as Error).message}` 
        });
      }
    } else if (action === 'read_file') {
      console.log(`Reading file: ${req.body.file_path}`);

      const filePath = req.body.file_path;
      
      if (!filePath) {
        res.status(400).json({ 
          error: 'No file path specified' 
        });
        return;
      }

      try {
        // Security check: ensure file is in allowed directory
        const defaultDir = process.env.DEFAULT_MARKDOWN_SOURCE_DIR;
        if (defaultDir && !path.resolve(filePath).startsWith(path.resolve(defaultDir))) {
          res.status(403).json({ 
            error: 'File access denied: outside of allowed directory' 
          });
          return;
        }

        // Check if file exists and is accessible
        const stats = await fs.stat(filePath);
        if (!stats.isFile()) {
          res.status(400).json({ 
            error: `Path ${filePath} is not a file` 
          });
          return;
        }

        // Read file contents
        const content = await fs.readFile(filePath, 'utf-8');
        
        res.json({
          success: true,
          file_path: filePath,
          content: content,
          size: stats.size,
          modified: stats.mtime.toISOString(),
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        console.error('File reading error:', error);
        res.status(500).json({ 
          error: `Failed to read file: ${(error as Error).message}` 
        });
      }
    } else if (action === 'load_all_rag_files') {
      console.log('Loading all RAG files from DEFAULT_MARKDOWN_SOURCE_DIR');
      console.log('Options received:', req.body.options);

      const targetDirectory = process.env.DEFAULT_MARKDOWN_SOURCE_DIR;
      const options = req.body.options || {};
      
      if (!targetDirectory) {
        res.status(400).json({ 
          error: 'DEFAULT_MARKDOWN_SOURCE_DIR not configured' 
        });
        return;
      }

      try {
        // Check if directory exists
        const stats = await fs.stat(targetDirectory);
        if (!stats.isDirectory()) {
          res.status(400).json({ 
            error: `Path ${targetDirectory} is not a directory` 
          });
          return;
        }

        // Create embedding function for nomic-embed-text via Ollama
        const embedder = new OllamaEmbeddingFunction({
          url: 'http://localhost:11434/',
          model: 'nomic-embed-text',
        });

        // Handle reset collection option
        if (options.resetCollection) {
          console.log('Resetting collection as requested...');
          try {
            await chroma.deleteCollection({ name: collection_name });
            console.log('Collection deleted successfully');
          } catch (error) {
            console.log('Collection did not exist or could not be deleted');
          }
        }

        // Get or create collection
        let collection;
        try {
          collection = await chroma.getCollection({
            name: collection_name,
            embeddingFunction: embedder,
          });
          console.log(`Using existing collection: ${collection_name}`);
        } catch (error) {
          console.log(`Creating new collection: ${collection_name}`);
          collection = await chroma.getOrCreateCollection({
            name: collection_name,
            embeddingFunction: embedder,
          });
        }

        // Read all markdown files from directory
        const entries = await fs.readdir(targetDirectory, { withFileTypes: true });
        const markdownFiles = entries
          .filter(entry => entry.isFile() && (
            entry.name.endsWith('.md') || 
            entry.name.endsWith('.markdown') ||
            entry.name.endsWith('.txt')
          ))
          .filter(entry => entry.name !== process.env.TEMPLATE_FILE); // Exclude template file

        console.log(`Found ${markdownFiles.length} markdown files to process`);

        let processedCount = 0;
        let errorCount = 0;
        let addedCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;
        const verboseMessages: Array<{type: string, text: string}> = [];

        if (options.verbose) {
          verboseMessages.push({type: 'info', text: 'Syncing with ChromaDB...'});
        }

        // Process files sequentially
        for (const fileEntry of markdownFiles) {
          try {
            const filePath = path.join(targetDirectory, fileEntry.name);
            const content = await fs.readFile(filePath, 'utf-8');
            
            // Use same processing as the file-processing utilities
            const { ensureDocumentId, parseMarkdown, countTokens } = await import('../services/file-processing.js');
            const { text: processedText, id: documentId } = ensureDocumentId(content);
            const parsed = parseMarkdown(processedText);
            const tokenCount = countTokens(parsed.content);

            // Check if document already exists to determine action
            let action = 'add';
            try {
              const existing = await collection.get({ ids: [documentId] });
              if (existing.ids.length > 0) {
                action = 'update';
              }
            } catch (e) {
              // Document doesn't exist, will be added
            }

            // Add or update document in collection
            if (action === 'add') {
              await collection.add({
                documents: [parsed.content],
                metadatas: [{
                  ...parsed.data,
                  filename: fileEntry.name,
                  filepath: filePath,
                  timestamp: new Date().toISOString(),
                  length: parsed.content.length,
                  tokenCount,
                  source: 'bulk_load',
                } as Record<string, string | number | boolean | null>],
                ids: [documentId],
              });
              addedCount++;
            } else {
              await collection.upsert({
                documents: [parsed.content],
                metadatas: [{
                  ...parsed.data,
                  filename: fileEntry.name,
                  filepath: filePath,
                  timestamp: new Date().toISOString(),
                  length: parsed.content.length,
                  tokenCount,
                  source: 'bulk_load',
                } as Record<string, string | number | boolean | null>],
                ids: [documentId],
              });
              updatedCount++;
            }

            processedCount++;
            
            if (options.verbose) {
              const verboseText = `Processing: ${fileEntry.name} (${action})`;
              console.log(verboseText);
              verboseMessages.push({type: 'processing', text: verboseText});
              
              // Add token count info if significant
              if (tokenCount > 200) {
                const tokenText = `Updated token count for ${fileEntry.name}: ${tokenCount} tokens`;
                console.log(`  ${tokenText}`);
                verboseMessages.push({type: 'processing', text: `  ${tokenText}`});
              }
            }
          } catch (error) {
            console.error(`Error processing ${fileEntry.name}:`, error);
            errorCount++;
            if (options.verbose) {
              verboseMessages.push({type: 'error', text: `Error processing ${fileEntry.name}: ${(error as Error).message}`});
            }
          }
        }

        // Add template file info if verbose
        if (options.verbose && process.env.TEMPLATE_FILE) {
          const templateText = `Skipping template file: ${process.env.TEMPLATE_FILE}`;
          console.log(templateText);
          verboseMessages.push({type: 'skipped', text: templateText});
          skippedCount = 1;
        }

        // Add summary if verbose
        if (options.verbose) {
          const summaryText = `Sync completed:\n  Added: ${addedCount} documents\n  Updated: ${updatedCount} documents\n  Skipped: ${skippedCount} documents\n  Total files processed: ${markdownFiles.length + skippedCount}`;
          console.log(summaryText);
          verboseMessages.push({type: 'summary', text: summaryText});
          
          if (skippedCount > 0) {
            verboseMessages.push({type: 'summary', text: `\nSkipped files:`});
            if (process.env.TEMPLATE_FILE) {
              verboseMessages.push({type: 'skipped', text: `  ${targetDirectory}/${process.env.TEMPLATE_FILE}: Template file (excluded from processing)`});
            }
          }
        }

        const result = {
          success: true,
          directory: targetDirectory,
          filesProcessed: processedCount,
          filesWithErrors: errorCount,
          totalFilesFound: markdownFiles.length,
          addedCount,
          updatedCount,
          skippedCount,
          verboseMessages: options.verbose ? verboseMessages : [],
          timestamp: new Date().toISOString(),
          resetCollection: options.resetCollection || false,
        };

        console.log(`Bulk load completed: ${processedCount} processed, ${errorCount} errors`);
        res.json(result);

      } catch (error) {
        console.error('Bulk load error:', error);
        res.status(500).json({ 
          error: `Failed to load RAG files: ${(error as Error).message}` 
        });
      }
    } else if (action === 'save_new_document_with_file') {
      console.log(`Creating new document with filesystem save`);
      console.log('Options received:', req.body);

      const targetDirectory = process.env.DEFAULT_MARKDOWN_SOURCE_DIR;
      const filename = req.body.filename;
      
      if (!targetDirectory) {
        res.status(400).json({ 
          error: 'DEFAULT_MARKDOWN_SOURCE_DIR not configured' 
        });
        return;
      }

      if (!filename) {
        res.status(400).json({ 
          error: 'Filename is required for new document creation' 
        });
        return;
      }

      try {
        // Create embedding function for nomic-embed-text via Ollama
        const embedder = new OllamaEmbeddingFunction({
          url: 'http://localhost:11434/',
          model: 'nomic-embed-text',
        });

        // Get collection with nomic-embed-text embedding function
        const collection = await chroma.getCollection({
          name: collection_name,
          embeddingFunction: embedder,
        });

        // Create filesystem path first
        const filepath = path.join(targetDirectory, `${filename}.md`);
        
        // Add filepath to metadata before saving to ChromaDB
        const metadataWithFilepath = {
          ...document?.metadata,
          filepath: filepath,
          filename: `${filename}.md`,
        };

        // Add document to ChromaDB
        if (document) {
          await collection.add({
            documents: [document.text],
            metadatas: [metadataWithFilepath as Record<string, string | number | boolean | null>],
            ids: [document.id],
          });
        }
        
        // Check if file already exists
        try {
          await fs.access(filepath);
          res.status(409).json({ 
            error: `File ${filename}.md already exists` 
          });
          return;
        } catch (error) {
          // File doesn't exist, which is what we want
        }
        
        // Import file processing utilities and save to filesystem
        let fileWriteResult = null;
        try {
          const { parseMarkdown, stringifyMarkdown, countTokens } = await import('../services/file-processing.js');
          
          // Parse the content to extract frontmatter and body
          const parsed = parseMarkdown(req.body.content || '');
          
          // Update frontmatter with metadata from ChromaDB
          const updatedParsed = {
            content: parsed.content,
            data: {
              ...parsed.data,                    // Any frontmatter from original content
              ...metadataWithFilepath,           // Metadata with filepath included
              last_updated: new Date().toISOString(),
              tokenCount: countTokens(parsed.content),
              // Remove internal ChromaDB fields that shouldn't be in frontmatter
              timestamp: undefined,
              length: undefined,
              source: undefined,
            }
          };
          
          // Clean up undefined values
          Object.keys(updatedParsed.data).forEach(key => {
            if ((updatedParsed.data as any)[key] === undefined) {
              delete (updatedParsed.data as any)[key];
            }
          });
          
          // Serialize to markdown with frontmatter
          const markdownContent = stringifyMarkdown(updatedParsed);
          
          // Write to filesystem
          await fs.writeFile(filepath, markdownContent, 'utf-8');
          
          fileWriteResult = {
            filepath: filepath,
            filename: `${filename}.md`,
            tokenCount: updatedParsed.data.tokenCount,
            last_updated: updatedParsed.data.last_updated,
          };
          
          console.log(`Successfully created new document: ${filepath}`);
          
        } catch (error) {
          console.error('Error writing new document to filesystem:', error);
          fileWriteResult = {
            error: `Failed to write to filesystem: ${(error as Error).message}`,
          };
        }

        const result = {
          success: true,
          collection: collection_name,
          document_id: document?.id,
          timestamp: new Date().toISOString(),
          embedding_model: 'nomic-embed-text',
          action: 'created',
          fileWrite: fileWriteResult,
        };

        console.log('New document with file created successfully:', result);
        res.json(result);

      } catch (error) {
        console.error('New document creation error:', error);
        res.status(500).json({ 
          error: `Failed to create new document: ${(error as Error).message}` 
        });
      }
    } else {
      res.status(400).json({ error: 'Unknown action' });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Helper function to match concepts in comma-delimited fields
function matchesConceptInDelimitedField(fieldValue: string, concept: string): boolean {
  if (!fieldValue || !concept) return false;
  
  // Split by comma and trim whitespace, then check for exact matches
  const values = fieldValue.split(',').map(v => v.trim().toLowerCase());
  const searchConcept = concept.trim().toLowerCase();
  
  const isMatch = values.includes(searchConcept);
  
  // Debug logging - only log first few to avoid spam
  if (Math.random() < 0.01) { // Log ~1% of calls
    console.log(`🔍 Matching Debug:`, {
      fieldValue,
      concept,
      values,
      searchConcept,
      isMatch
    });
  }
  
  return isMatch;
}

app.listen(env.PORT, () => {
  console.log(`RAG Backend Service running on http://localhost:${env.PORT}`);
  console.log(`Open your browser to http://localhost:${env.PORT} to use the application`);
  console.log(`DEFAULT_MARKDOWN_SOURCE_DIR: ${env.DEFAULT_MARKDOWN_SOURCE_DIR}`);
  console.log(`Server __dirname: ${__dirname}`);
});
