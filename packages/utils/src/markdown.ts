const HEADING_PATTERN = /^(#{1,6})\s+(.*)$/;
const LIST_PATTERN = /^\s*[-*+]\s+(.*)$/;

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function processInlineMarkdown(input: string): string {
  return escapeHtml(input)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/~~(.+?)~~/g, '<del>$1</del>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

export function renderMarkdownToHtml(markdown: string): string {
  if (!markdown) {
    return '';
  }

  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const htmlParts: string[] = [];
  let paragraphBuffer: string[] = [];
  let listBuffer: string[] = [];
  let inCodeBlock = false;
  const codeBuffer: string[] = [];

  const flushParagraph = () => {
    if (paragraphBuffer.length === 0) {
      return;
    }
    htmlParts.push(`<p>${processInlineMarkdown(paragraphBuffer.join(' '))}</p>`);
    paragraphBuffer = [];
  };

  const flushList = () => {
    if (listBuffer.length === 0) {
      return;
    }
    const listItems = listBuffer.map((item) => `<li>${processInlineMarkdown(item)}</li>`).join('');
    htmlParts.push(`<ul>${listItems}</ul>`);
    listBuffer = [];
  };

  const flushCode = () => {
    if (!inCodeBlock) {
      return;
    }
    htmlParts.push(`<pre><code>${escapeHtml(codeBuffer.join('\n'))}</code></pre>`);
    codeBuffer.length = 0;
    inCodeBlock = false;
  };

  for (const rawLine of lines) {
    const line = rawLine;

    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        flushCode();
      } else {
        flushParagraph();
        flushList();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    if (line.trim() === '') {
      flushParagraph();
      flushList();
      continue;
    }

    const headingMatch = line.match(HEADING_PATTERN);
    if (headingMatch) {
      flushParagraph();
      flushList();
      const level = Math.min(6, headingMatch[1].length);
      htmlParts.push(`<h${level}>${processInlineMarkdown(headingMatch[2])}</h${level}>`);
      continue;
    }

    const listMatch = line.match(LIST_PATTERN);
    if (listMatch) {
      flushParagraph();
      listBuffer.push(listMatch[1]);
      continue;
    }

    paragraphBuffer.push(line.trim());
  }

  flushCode();
  flushList();
  flushParagraph();

  return htmlParts.join('');
}

export function countMarkdownWords(value: string): number {
  const trimmed = value.trim();
  return trimmed === '' ? 0 : trimmed.split(/\s+/).length;
}

export function computeLineCount(value: string): number {
  if (!value) {
    return 1;
  }
  return value.replace(/\r\n?/g, '\n').split('\n').length;
}

export function clampSelectionIndexes(start: number, end: number, limit: number) {
  const safeLimit = Math.max(0, limit);
  const nextStart = Math.max(0, Math.min(start, safeLimit));
  const nextEnd = Math.max(0, Math.min(end, safeLimit));
  return nextStart <= nextEnd
    ? {start: nextStart, end: nextEnd}
    : {start: nextEnd, end: nextStart};
}
