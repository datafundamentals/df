/**
 * Mock data fixtures for component testing
 * Provides realistic test data that matches the actual data structures
 */

// Mock documents for document list testing
export const mockDocuments = [
  {
    id: 'doc-1',
    content: '# React Performance Optimization\n\nThis document covers advanced techniques for optimizing React applications including memoization, virtualization, and bundle splitting.',
    text: 'React Performance Optimization - This document covers advanced techniques for optimizing React applications including memoization, virtualization, and bundle splitting.',
    metadata: {
      title: 'React Performance Optimization',
      tags: 'react, performance, optimization, memoization',
      category: 'primary',
      isA: 'programming guide, technical documentation',
      childOf: 'frontend development, web development',
      hasA: 'code examples, best practices',
      tokenCount: 156
    },
    distance: 0.23
  },
  {
    id: 'doc-2', 
    content: '# TypeScript Best Practices\n\nComprehensive guide to TypeScript development patterns, type safety, and advanced type system features.',
    text: 'TypeScript Best Practices - Comprehensive guide to TypeScript development patterns, type safety, and advanced type system features.',
    metadata: {
      title: 'TypeScript Best Practices',
      tags: 'typescript, javascript, type safety, development',
      category: 'primary',
      isA: 'programming guide, reference material',
      childOf: 'javascript development, web development',
      hasA: 'type examples, configuration guides',
      tokenCount: 234
    },
    distance: 0.31
  },
  {
    id: 'doc-3',
    content: '# Database Design Principles\n\nFundamental concepts of relational database design, normalization, and query optimization.',
    text: 'Database Design Principles - Fundamental concepts of relational database design, normalization, and query optimization.',
    metadata: {
      title: 'Database Design Principles', 
      tags: 'database, sql, design patterns, normalization',
      category: 'secondary',
      isA: 'technical reference, design guide',
      childOf: 'backend development, data management',
      hasA: 'schema examples, optimization techniques',
      tokenCount: 189
    },
    distance: 0.67
  },
  {
    id: 'doc-4',
    content: '# API Security Checklist\n\nEssential security considerations for REST API development including authentication, authorization, and data validation.',
    text: 'API Security Checklist - Essential security considerations for REST API development including authentication, authorization, and data validation.',
    metadata: {
      title: 'API Security Checklist',
      tags: 'security, api, authentication, validation',
      category: 'primary', 
      isA: 'security guide, checklist',
      childOf: 'backend development, web security',
      hasA: 'security patterns, vulnerability examples',
      tokenCount: 298
    },
    distance: 0.94
  },
  {
    id: 'doc-5',
    content: '# Git Workflow Strategies\n\nComparison of different Git branching strategies including GitFlow, GitHub Flow, and GitLab Flow.',
    text: 'Git Workflow Strategies - Comparison of different Git branching strategies including GitFlow, GitHub Flow, and GitLab Flow.',
    metadata: {
      title: 'Git Workflow Strategies',
      tags: 'git, workflow, version control, collaboration',
      category: 'reference',
      isA: 'process guide, workflow documentation',
      childOf: 'development process, team collaboration', 
      hasA: 'branching diagrams, workflow examples',
      tokenCount: 167
    },
    distance: 1.12
  }
];

// Mock query results grouped by relevance
export const mockQueryResults = {
  strong: [mockDocuments[0], mockDocuments[1]], // distance < 0.50
  good: [mockDocuments[2]], // distance 0.50-0.90
  weak: [mockDocuments[3]], // distance 0.90-1.05
  poor: [mockDocuments[4]]  // distance > 1.05
};

// Mock authentication states
export const mockAuthStates = {
  signedOut: {
    isLoggedIn: false,
    user: null
  },
  signedIn: {
    isLoggedIn: true, 
    user: {
      displayName: 'Test User',
      email: 'test@example.com',
      photoURL: 'https://via.placeholder.com/32'
    }
  }
};

// Mock query responses  
export const mockQueryResponse = {
  response: `# React Performance Optimization

Based on your query about React performance, here are the key optimization techniques:

## 1. Memoization
- Use \`React.memo\` for component memoization
- Implement \`useMemo\` for expensive calculations
- Apply \`useCallback\` for function memoization

## 2. Code Splitting
- Implement route-based code splitting
- Use dynamic imports for large components
- Consider bundle analysis tools

## 3. Virtualization
- Use libraries like react-window for large lists
- Implement intersection observers for lazy loading
- Consider virtual scrolling for performance gains

These techniques can significantly improve your application's performance, especially with large datasets and complex component trees.`,
  context: mockDocuments.slice(0, 3),
  success: true
};

// Mock form states and interactions
export const mockFormInteractions = {
  querySubmit: {
    queryText: 'How to optimize React performance?',
    contextValue: 5,
    filters: {
      title: '',
      tags: 'react, performance',
      category: 'primary'
    }
  },
  contextChange: {
    contextValue: 8,
    explanation: 'More comprehensive context requested'
  },
  documentEdit: {
    document: mockDocuments[0],
    action: 'edit'
  }
};

// Mock metadata configurations
export const mockMetadata = {
  categories: ['primary', 'secondary', 'reference', 'archive'],
  commonTags: [
    'react', 'typescript', 'javascript', 'performance', 'security',
    'database', 'api', 'git', 'workflow', 'optimization', 'best practices'
  ],
  relationshipTypes: {
    isA: ['guide', 'reference', 'tutorial', 'checklist', 'documentation'],
    childOf: ['web development', 'backend development', 'frontend development', 'data management'],
    hasA: ['examples', 'best practices', 'code snippets', 'diagrams']
  }
};

// Event tracking for testing
export class EventTracker {
  constructor() {
    this.events = [];
    this.listeners = new Map();
  }

  logEvent(component, event, data) {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const eventEntry = {
      timestamp,
      component,
      event,
      data: JSON.stringify(data, null, 2)
    };
    
    this.events.push(eventEntry);
    this.notifyListeners(component, eventEntry);
    
    console.log(`🎯 [${timestamp}] ${component}:${event}`, data);
  }

  addListener(component, callback) {
    if (!this.listeners.has(component)) {
      this.listeners.set(component, []);
    }
    this.listeners.get(component).push(callback);
  }

  notifyListeners(component, event) {
    const componentListeners = this.listeners.get(component) || [];
    componentListeners.forEach(callback => callback(event));
  }

  getEvents(component = null) {
    return component 
      ? this.events.filter(e => e.component === component)
      : this.events;
  }

  clearEvents(component = null) {
    if (component) {
      this.events = this.events.filter(e => e.component !== component);
    } else {
      this.events = [];
    }
  }
}

// Global event tracker instance
export const eventTracker = new EventTracker();

// Utility functions for component testing
export function updateStatus(sectionId, status) {
  const indicator = document.getElementById(`${sectionId}-status`);
  if (indicator) {
    indicator.className = `status-indicator ${status}`;
  }
}

export function logToSection(sectionId, message, isError = false) {
  const logElement = document.getElementById(`${sectionId}-log`);
  if (logElement) {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const entry = document.createElement('div');
    entry.className = `event-log-entry ${isError ? 'error' : ''}`;
    entry.textContent = `[${timestamp}] ${message}`;
    
    logElement.appendChild(entry);
    logElement.scrollTop = logElement.scrollHeight;
  }
}

export function clearSection(sectionId) {
  const logElement = document.getElementById(`${sectionId}-log`);
  if (logElement) {
    logElement.innerHTML = '<div class="event-log-entry">Log cleared</div>';
  }
  updateStatus(sectionId, '');
}

// Export the mockData object for ES6 modules
export const mockData = {
  documents: mockDocuments,
  queryResults: mockQueryResults,
  authStates: mockAuthStates,
  queryResponse: mockQueryResponse,
  formInteractions: mockFormInteractions,
  metadata: mockMetadata
};

// Make utilities available globally for HTML onclick handlers
window.updateStatus = updateStatus;
window.logToSection = logToSection;
window.clearSection = clearSection;
window.eventTracker = eventTracker;
window.mockData = mockData;

console.log('📊 Mock data fixtures loaded successfully');