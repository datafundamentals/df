import axios from 'axios';

export interface OllamaConfig {
  url?: string;
  defaultModel?: string;
}

export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  options?: Record<string, unknown>;
}

export interface OllamaGenerateResponse {
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export class OllamaService {
  private baseUrl: string;
  private defaultModel: string;

  constructor(config: OllamaConfig = {}) {
    this.baseUrl = config.url || 'http://localhost:11434';
    this.defaultModel = config.defaultModel || 'llama3.1';
  }

  async generate(request: Omit<OllamaGenerateRequest, 'model'> & { model?: string }): Promise<OllamaGenerateResponse> {
    const fullRequest: OllamaGenerateRequest = {
      model: request.model || this.defaultModel,
      prompt: request.prompt,
      stream: request.stream || false,
      options: request.options,
    };

    try {
      const response = await axios.post(`${this.baseUrl}/api/generate`, fullRequest);
      return response.data;
    } catch (error) {
      console.error('Ollama API error:', (error as Error).message);
      throw error;
    }
  }

  async generateWithContext(prompt: string, context: string[], model?: string): Promise<OllamaGenerateResponse> {
    const fullPrompt = `Context:\n${context.join('\n\n---\n\n')}\n\nQuestion: ${prompt}\n\nAnswer:`;

    return this.generate({
      prompt: fullPrompt,
      model: model || this.defaultModel,
    });
  }

  async listModels() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`);
      return response.data;
    } catch (error) {
      console.error('Error listing Ollama models:', (error as Error).message);
      throw error;
    }
  }

  setDefaultModel(model: string) {
    this.defaultModel = model;
  }

  getDefaultModel() {
    return this.defaultModel;
  }
}