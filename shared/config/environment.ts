import dotenv from 'dotenv';
import path from 'path';

export interface AppEnvironment {
  PORT: number;
  CHROMADB_HOST: string;
  CHROMADB_PORT: number;
  OLLAMA_URL: string;
  EMBEDDING_MODEL: string;
  DEFAULT_N_RESULTS: number;
  DEFAULT_MARKDOWN_SOURCE_DIR?: string;
  TEMPLATE_FILE?: string;
}

export function loadEnvironment(projectRoot?: string): AppEnvironment {
  // Load .env file from project root if specified
  if (projectRoot) {
    dotenv.config({ path: path.join(projectRoot, '.env') });
  } else {
    dotenv.config();
  }

  return {
    PORT: parseInt(process.env.PORT || '5011', 10),
    CHROMADB_HOST: process.env.CHROMADB_HOST || 'localhost',
    CHROMADB_PORT: parseInt(process.env.CHROMADB_PORT || '8000', 10),
    OLLAMA_URL: process.env.OLLAMA_URL || 'http://localhost:11434/',
    EMBEDDING_MODEL: process.env.EMBEDDING_MODEL || 'nomic-embed-text',
    DEFAULT_N_RESULTS: parseInt(process.env.DEFAULT_N_RESULTS || '3', 10),
    DEFAULT_MARKDOWN_SOURCE_DIR: process.env.DEFAULT_MARKDOWN_SOURCE_DIR,
    TEMPLATE_FILE: process.env.TEMPLATE_FILE,
  };
}

export function validateEnvironment(env: AppEnvironment): void {
  const required = ['PORT', 'CHROMADB_HOST', 'CHROMADB_PORT', 'OLLAMA_URL', 'EMBEDDING_MODEL'];

  for (const key of required) {
    const value = env[key as keyof AppEnvironment];
    if (value === undefined || value === '') {
      throw new Error(`Required environment variable ${key} is not set`);
    }
  }
}