import { ChromaClient } from 'chromadb';
import { OllamaEmbeddingFunction } from '@chroma-core/ollama';

export interface ChromaDBConfig {
  host?: string;
  port?: number;
  ollamaUrl?: string;
  embeddingModel?: string;
}

export class ChromaDBService {
  private client: ChromaClient;
  private embedder: OllamaEmbeddingFunction;

  constructor(config: ChromaDBConfig = {}) {
    this.client = new ChromaClient({
      host: config.host || 'localhost',
      port: config.port || 8000,
    });

    this.embedder = new OllamaEmbeddingFunction({
      url: config.ollamaUrl || 'http://localhost:11434/',
      model: config.embeddingModel || 'nomic-embed-text',
    });
  }

  async getOrCreateCollection(name: string) {
    try {
      const collection = await this.client.getCollection({
        name,
        embeddingFunction: this.embedder,
      });
      console.log(`Using existing collection: ${name}`);
      return collection;
    } catch (error) {
      console.log(`Creating new collection: ${name}`);
      return await this.client.getOrCreateCollection({
        name,
        embeddingFunction: this.embedder,
      });
    }
  }

  async listCollections() {
    return await this.client.listCollections();
  }

  async deleteCollection(name: string) {
    return await this.client.deleteCollection({ name });
  }

  getClient() {
    return this.client;
  }

  getEmbedder() {
    return this.embedder;
  }
}