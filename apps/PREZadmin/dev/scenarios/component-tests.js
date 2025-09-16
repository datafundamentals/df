/**
 * Component testing scenarios
 * Interactive tests for validating component behavior and event communication
 */

import { eventTracker, mockData, updateStatus, logToSection, clearSection } from '../fixtures/mock-data.js';

// Global state for testing
let currentAuthState = 'signedOut';
let currentActivePage = 'query';

// ==================== SHARED APP HEADER TESTS ====================

export function initializeHeaderTests() {
  const headerContainer = document.getElementById('header-container');
  
  // Create app header instance
  const appHeader = document.createElement('rag-app-header');
  appHeader.setAttribute('title', 'Component Playground');
  appHeader.setAttribute('subtitle', 'Testing Environment');
  appHeader.setAttribute('activePage', currentActivePage);
  
  // Add event listeners for navigation
  appHeader.addEventListener('navigate', (event) => {
    eventTracker.logEvent('rag-app-header', 'navigate', event.detail);
    logToSection('header', `Navigation event: ${event.detail.page}`);
  });
  
  headerContainer.appendChild(appHeader);
  logToSection('header', 'App header component loaded');
  updateStatus('header', 'success');
}

window.toggleHeaderAuth = function() {
  currentAuthState = currentAuthState === 'signedOut' ? 'signedIn' : 'signedOut';
  const authState = mockData.authStates[currentAuthState];
  
  logToSection('header', `Auth state changed to: ${currentAuthState}`);
  logToSection('header', `User: ${authState.user?.displayName || 'none'}`);
  eventTracker.logEvent('rag-app-header', 'auth-change', authState);
};

window.changeHeaderPage = function() {
  const pages = ['query', 'storage', 'editor'];
  const currentIndex = pages.indexOf(currentActivePage);
  currentActivePage = pages[(currentIndex + 1) % pages.length];
  
  const appHeader = document.querySelector('rag-app-header');
  if (appHeader) {
    appHeader.setAttribute('activePage', currentActivePage);
    logToSection('header', `Active page changed to: ${currentActivePage}`);
    eventTracker.logEvent('rag-app-header', 'page-change', { activePage: currentActivePage });
  }
};

window.clearHeaderLog = function() {
  clearSection('header');
  eventTracker.clearEvents('rag-app-header');
};

// ==================== EVENT COMMUNICATION TESTS ====================

export function initializeEventTests() {
  const eventsContainer = document.getElementById('events-container');
  
  // Create query form for event testing
  const queryForm = document.createElement('query-form');
  queryForm.setAttribute('queryText', '');
  queryForm.setAttribute('contextValue', '5');
  
  // Create context slider for event testing
  const contextSlider = document.createElement('context-slider');
  contextSlider.setAttribute('value', '5');
  
  // Add comprehensive event listeners
  queryForm.addEventListener('query-submit', (event) => {
    eventTracker.logEvent('query-form', 'query-submit', event.detail);
    logToSection('events', `Query submitted: "${event.detail.queryText}"`);
    updateStatus('events', 'success');
  });
  
  queryForm.addEventListener('context-changed', (event) => {
    eventTracker.logEvent('query-form', 'context-changed', event.detail);
    logToSection('events', `Context value changed to: ${event.detail.contextValue}`);
  });
  
  contextSlider.addEventListener('value-changed', (event) => {
    eventTracker.logEvent('context-slider', 'value-changed', event.detail);
    logToSection('events', `Slider value: ${event.detail.value}`);
  });
  
  eventsContainer.appendChild(queryForm);
  eventsContainer.appendChild(contextSlider);
  
  logToSection('events', 'Event communication components loaded');
  updateStatus('events', 'success');
}

window.testQuerySubmit = function() {
  const queryForm = document.querySelector('query-form');
  if (queryForm) {
    // Simulate filling form and submitting
    const mockQuery = mockData.formInteractions.querySubmit;
    queryForm.setAttribute('queryText', mockQuery.queryText);
    queryForm.setAttribute('contextValue', mockQuery.contextValue.toString());
    
    // Trigger submit event
    const submitEvent = new CustomEvent('query-submit', {
      detail: mockQuery,
      bubbles: true
    });
    queryForm.dispatchEvent(submitEvent);
    
    logToSection('events', `Simulated query submit with: "${mockQuery.queryText}"`);
  }
};

window.testContextChange = function() {
  const contextSlider = document.querySelector('context-slider');
  if (contextSlider) {
    const mockChange = mockData.formInteractions.contextChange;
    contextSlider.setAttribute('value', mockChange.contextValue.toString());
    
    const changeEvent = new CustomEvent('value-changed', {
      detail: mockChange,
      bubbles: true
    });
    contextSlider.dispatchEvent(changeEvent);
    
    logToSection('events', `Simulated context change to: ${mockChange.contextValue}`);
  }
};

window.testDocumentEdit = function() {
  const mockEdit = mockData.formInteractions.documentEdit;
  
  const editEvent = new CustomEvent('edit-document', {
    detail: mockEdit,
    bubbles: true
  });
  document.dispatchEvent(editEvent);
  
  logToSection('events', `Simulated document edit: ${mockEdit.document.metadata.title}`);
  eventTracker.logEvent('document-component', 'edit-document', mockEdit);
};

window.clearEventsLog = function() {
  clearSection('events');
  eventTracker.clearEvents('query-form');
  eventTracker.clearEvents('context-slider');
};

// ==================== DOCUMENT COMPONENT TESTS ====================

export function initializeDocumentTests() {
  const documentContainer = document.getElementById('document-container');
  
  // Create document list component
  const documentList = document.createElement('document-list');
  documentList.documents = [];
  documentList.disabled = false;
  
  // Create new document creator
  const newDocumentCreator = document.createElement('new-document-creator');
  newDocumentCreator.disabled = false;
  
  // Add event listeners
  documentList.addEventListener('document-selected', (event) => {
    eventTracker.logEvent('document-list', 'document-selected', event.detail);
    logToSection('document', `Document selected: ${event.detail.document.metadata.title}`);
    updateStatus('document', 'success');
  });
  
  newDocumentCreator.addEventListener('document-created', (event) => {
    eventTracker.logEvent('new-document-creator', 'document-created', event.detail);
    logToSection('document', `New document created: "${event.detail.title}"`);
    updateStatus('document', 'success');
  });
  
  documentContainer.appendChild(documentList);
  documentContainer.appendChild(newDocumentCreator);
  
  logToSection('document', 'Document components loaded');
}

window.loadMockDocuments = function() {
  const documentList = document.querySelector('document-list');
  if (documentList) {
    documentList.documents = mockData.documents;
    logToSection('document', `Loaded ${mockData.documents.length} mock documents`);
    updateStatus('document', 'success');
  }
};

window.testDocumentSelection = function() {
  const documentList = document.querySelector('document-list');
  if (documentList) {
    const selectedDoc = mockData.documents[0];
    
    const selectEvent = new CustomEvent('document-selected', {
      detail: { document: selectedDoc },
      bubbles: true
    });
    documentList.dispatchEvent(selectEvent);
    
    logToSection('document', `Simulated document selection: ${selectedDoc.metadata.title}`);
  }
};

window.testNewDocumentCreation = function() {
  const newDocCreator = document.querySelector('new-document-creator');
  if (newDocCreator) {
    const mockNewDoc = {
      title: 'Test Document',
      filename: 'test-document.md'
    };
    
    const createEvent = new CustomEvent('document-created', {
      detail: mockNewDoc,
      bubbles: true
    });
    newDocCreator.dispatchEvent(createEvent);
    
    logToSection('document', `Simulated new document creation: "${mockNewDoc.title}"`);
  }
};

window.clearDocumentLog = function() {
  clearSection('document');
  eventTracker.clearEvents('document-list');
  eventTracker.clearEvents('new-document-creator');
};

// ==================== FORM & DISPLAY COMPONENT TESTS ====================

export function initializeFormTests() {
  const formsContainer = document.getElementById('forms-container');
  
  // Create relevance group for testing
  const relevanceGroup = document.createElement('relevance-group');
  relevanceGroup.level = 'strong';
  relevanceGroup.label = 'Strong Match';
  relevanceGroup.items = mockData.queryResults.strong;
  
  // Create document metadata display
  const documentMetadata = document.createElement('document-metadata');
  documentMetadata.metadata = mockData.documents[0].metadata;
  documentMetadata.compact = false;
  
  // Add event listeners
  relevanceGroup.addEventListener('edit-document', (event) => {
    eventTracker.logEvent('relevance-group', 'edit-document', event.detail);
    logToSection('forms', `Edit document request: ${event.detail.item.metadata.title}`);
    updateStatus('forms', 'success');
  });
  
  formsContainer.appendChild(relevanceGroup);
  formsContainer.appendChild(documentMetadata);
  
  logToSection('forms', 'Form and display components loaded');
}

window.testQueryForm = function() {
  const queryForm = document.querySelector('query-form');
  if (queryForm) {
    logToSection('forms', 'Query form test - see Event Communication section');
  } else {
    logToSection('forms', 'Query form not found - check Event Communication section');
  }
};

window.testContextSlider = function() {
  const contextSlider = document.querySelector('context-slider');
  if (contextSlider) {
    // Test different slider values
    const testValues = [-5, 0, 5, 10];
    testValues.forEach((value, index) => {
      setTimeout(() => {
        contextSlider.setAttribute('value', value.toString());
        logToSection('forms', `Context slider set to: ${value}`);
        
        const changeEvent = new CustomEvent('value-changed', {
          detail: { value },
          bubbles: true
        });
        contextSlider.dispatchEvent(changeEvent);
      }, index * 500);
    });
  }
};

window.testRelevanceGroups = function() {
  const relevanceGroup = document.querySelector('relevance-group');
  if (relevanceGroup) {
    const testItem = mockData.documents[0];
    
    const editEvent = new CustomEvent('edit-document', {
      detail: { item: testItem },
      bubbles: true
    });
    relevanceGroup.dispatchEvent(editEvent);
    
    logToSection('forms', `Simulated relevance group edit: ${testItem.metadata.title}`);
  }
};

window.clearFormsLog = function() {
  clearSection('forms');
  eventTracker.clearEvents('relevance-group');
  eventTracker.clearEvents('context-slider');
};

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', () => {
  // Initialize all test sections
  setTimeout(() => {
    initializeHeaderTests();
    initializeEventTests();
    initializeDocumentTests();
    initializeFormTests();
    
    console.log('🧪 All component tests initialized successfully!');
  }, 100);
});

console.log('🎯 Component test scenarios loaded successfully');