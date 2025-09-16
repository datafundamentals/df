// File processing utilities migrated from md-ollama-chroma-loader
// Converted from JavaScript to TypeScript for integration with Approach project

// Simple frontmatter parsing without external dependencies

/**
 * Generate a unique ID with timestamp and random suffix
 * Format: YYMMDDHHMMSSnnnn-a
 * where nnnn = milliseconds, a = random char for deduping
 */
export function generateId(): string {
  const now = new Date();
  const pad = (n: number, l: number = 2): string => String(n).padStart(l, '0');
  
  const timestamp = `${String(now.getFullYear()).slice(2)}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}${pad(now.getMilliseconds(), 4)}`;
  
  const dedupeChar = String.fromCharCode(97 + Math.floor(Math.random() * 26));
  return `${timestamp}-${dedupeChar}`;
}

/**
 * Basic token counting function
 * Simple approximation: split by whitespace and punctuation
 */
export function countTokens(content: string): number {
  if (!content || typeof content !== 'string') {
    return 0;
  }
  
  // Simple token counting approximation
  // Split on whitespace and common punctuation, filter empty strings
  const tokens = content
    .split(/[\s\n\r\t.,!?;:(){}[\]"'`~@#$%^&*+=|\\<>/]+/)
    .filter(token => token.length > 0);
  
  return tokens.length;
}

/**
 * Extract frontmatter and content from markdown text
 */
export interface ParsedMarkdown {
  data: Record<string, any>;
  content: string;
}

/**
 * Parse YAML frontmatter into a JavaScript object
 */
export function parseFrontmatter(yamlString: string): Record<string, any> {
  const data: Record<string, any> = {};
  
  yamlString.split(/\r?\n/).forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      let value = line.slice(colonIndex + 1).trim();
      
      // Remove quotes if present
      value = value.replace(/^["']|["']$/g, '');
      
      // Try to parse as number or boolean
      if (value === 'true') {
        data[key] = true;
      } else if (value === 'false') {
        data[key] = false;
      } else if (!isNaN(Number(value)) && value !== '') {
        data[key] = Number(value);
      } else {
        data[key] = value;
      }
    }
  });
  
  return data;
}

/**
 * Extract frontmatter and content from markdown text
 */
export function extractFrontmatter(markdownText: string): { frontmatter: string; content: string } | null {
  // Handle undefined/null input
  if (!markdownText || typeof markdownText !== 'string') {
    return null;
  }
  
  const frontmatterRegex = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n([\s\S]*)$/;
  const match = markdownText.match(frontmatterRegex);
  
  if (!match) {
    return null;
  }
  
  return {
    frontmatter: match[1],
    content: match[2]
  };
}

/**
 * Parse markdown with frontmatter using discrete functions
 */
export function parseMarkdown(markdownText: string): ParsedMarkdown {
  // Handle undefined/null input
  const safeMarkdownText = markdownText || '';
  const extracted = extractFrontmatter(safeMarkdownText);
  
  if (!extracted) {
    return {
      data: {},
      content: safeMarkdownText
    };
  }
  
  return {
    data: parseFrontmatter(extracted.frontmatter),
    content: extracted.content
  };
}

/**
 * Serialize a JavaScript object to YAML frontmatter string with consistent field ordering
 */
export function serializeFrontmatter(data: Record<string, any>): string {
  // Define the preferred order for frontmatter fields
  const fieldOrder = [
    'title',
    'category',
    'child_of',
    'has_a',
    'is_a',
    'tags', 
    'last_updated',
    'tokenCount',
    'id',
    'filepath',
    'filename'
  ];
  
  // Sort fields according to preferred order, then alphabetically for any others
  const orderedEntries: [string, any][] = [];
  const remainingFields = new Set(Object.keys(data));
  
  // Add fields in preferred order
  for (const field of fieldOrder) {
    if (field in data) {
      orderedEntries.push([field, data[field]]);
      remainingFields.delete(field);
    }
  }
  
  // Add any remaining fields alphabetically
  const sortedRemaining = Array.from(remainingFields).sort();
  for (const field of sortedRemaining) {
    orderedEntries.push([field, data[field]]);
  }
  
  return orderedEntries
    .map(([key, value]) => `${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`)
    .join('\n');
}

/**
 * Convert parsed markdown back to full markdown with frontmatter
 */
export function stringifyMarkdown(parsed: ParsedMarkdown): string {
  if (Object.keys(parsed.data).length === 0) {
    return parsed.content;
  }
  
  const frontmatter = serializeFrontmatter(parsed.data);
  return `---\n${frontmatter}\n---\n${parsed.content}`;
}

/**
 * Document interface for processed files
 */
export interface ProcessedDocument {
  id: string;
  content: string;
  metadata: Record<string, any>;
  tokenCount?: number;
  filePath?: string;
}

/**
 * Add or update ID in frontmatter
 */
export function ensureDocumentId(markdownText: string): { text: string; id: string; wasModified: boolean } {
  const parsed = parseMarkdown(markdownText);
  
  if (parsed.data.id) {
    // Already has an ID
    return {
      text: markdownText,
      id: parsed.data.id,
      wasModified: false
    };
  }
  
  // Generate new ID
  const newId = generateId();
  parsed.data.id = newId;
  
  return {
    text: stringifyMarkdown(parsed),
    id: newId,
    wasModified: true
  };
}