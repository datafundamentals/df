# Component Testing Playground

## Overview

The Component Playground is an interactive testing environment for validating our extracted RAG components. It provides visual, hands-on testing that's more engaging than traditional unit tests while following our established testing methodology.

## Files Structure

```
/dev/
├── component-playground.html     # Main testing harness
├── fixtures/
│   └── mock-data.js             # Reusable test data and utilities
├── scenarios/
│   └── component-tests.js       # Interactive test scenarios
└── README-COMPONENT-TESTING.md  # This documentation
```

## Testing Approach

### Risk-Based Priority Testing

Components are tested in order of integration risk:

1. **HIGH RISK** - Shared components used across multiple pages
   - `rag-app-header` - Navigation and auth states
   - Event communication patterns (parent ↔ child)

2. **MEDIUM RISK** - Core user interaction workflows  
   - `document-list` - Document selection and display
   - `new-document-creator` - Document creation flow
   - `document-metadata` - Metadata display and formatting

3. **LOW RISK** - Form and display components
   - `query-form` - Query input and submission
   - `context-slider` - Context control interaction
   - `relevance-group` - Search result grouping

## How to Use

1. **Open the Playground**
   ```bash
   open dev/component-playground.html
   ```

2. **Test Each Section**
   - Each risk level has dedicated controls and event logging
   - Green status dots = working correctly
   - Red status dots = issues detected
   - Event logs show real-time component communication

3. **Interactive Testing**
   - Click buttons to trigger component interactions
   - Watch event logs for proper data flow
   - Verify visual appearance and behavior

## Test Scenarios

### Shared App Header Tests
- ✅ Component loads without errors
- ✅ Navigation events fire correctly
- ✅ Authentication state changes work
- ✅ Active page highlighting functions

### Event Communication Tests  
- ✅ Query submission events bubble properly
- ✅ Context slider changes propagate
- ✅ Document edit events carry correct data
- ✅ Parent-child component communication works

### Document Component Tests
- ✅ Document list displays mock data correctly
- ✅ Document selection triggers proper events
- ✅ New document creation workflow functions
- ✅ Metadata display formatting is consistent

### Form & Display Component Tests
- ✅ Query form accepts input and submits
- ✅ Context slider responds to value changes
- ✅ Relevance groups display documents by strength
- ✅ Component isolation maintains proper boundaries

## Success Criteria

**Component Integration Testing Complete When:**
- [ ] All extracted components load without console errors
- [ ] Parent-child event communication verified for each component  
- [ ] Shared components (app-header) work correctly in isolation
- [ ] Critical user workflows function with mock data
- [ ] Event logs show proper data flow between components

## Benefits of This Approach

1. **Visual Validation** - See components working in real-time
2. **Event Tracking** - Comprehensive logging of component communication
3. **Risk-Focused** - Tests highest-risk integration points first  
4. **Developer-Friendly** - Interactive and engaging vs. abstract unit tests
5. **Realistic Data** - Uses actual data structures from the application

## Next Steps

After playground validation:

1. **Playwright Integration Tests** - Automate critical user workflows
2. **Cross-Page Component Testing** - Verify shared components across pages
3. **Performance Benchmarking** - Ensure refactoring didn't impact performance
4. **Regression Prevention** - Create automated safety net for future changes

## Troubleshooting

**Components not loading?**
- Run `npm run build` to ensure TypeScript compilation
- Check browser console for import errors
- Verify file paths in HTML script imports

**Events not firing?**
- Check browser console for JavaScript errors
- Verify event listener attachment in component-tests.js
- Ensure component custom elements are properly defined

**Mock data issues?**
- Verify data structures match actual application data
- Check mock-data.js for proper exports
- Ensure realistic test scenarios

---

This testing approach provides confidence that our component refactoring preserved functionality while improving maintainability. The interactive nature makes it easy to spot issues and validate fixes immediately.