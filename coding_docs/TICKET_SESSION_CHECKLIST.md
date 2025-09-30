# Ticket Session Checklist for Monorepo Management

Usage: `Ticket` is used in this document as you would also use pull request or story or github issue or jira task.

## Pre-Session Setup (Start Every Session)

### 1. Context Loading (MANDATORY) - done
- [ ] If claude, then read `coding_docs/claude/CLAUDE.md` if it exists
- [ ] Read `coding_docs/TICKET_SESSION_CHECKLIST.md` (this file)
- [ ] Read relevant session documentation from `docs/sessions/`
- [ ] Check `coding_docs/architecture.md` for system overview
- [ ] Review `shared/` directory for available components/services

### 2. Environment Verification
- [ ] Confirm current working directory location
- [ ] Check git status and current branch
- [ ] Verify which project/app you're working on
- [ ] Confirm required services are running (if applicable)

### 3. Session Scope Definition
- [ ] Define clear session objective (1-3 features max)
- [ ] Identify if this is: Shared Resource / Project-Specific / Integration session
- [ ] Set session boundaries (what will NOT be done)
- [ ] Create TodoWrite list for session tasks

## During Session (Active Development)

### 4. Documentation Standards
- [ ] if claude Use TodoWrite tool to track all tasks and progress
- [ ] Mark todos as completed immediately after finishing
- [ ] Document architectural decisions in real-time
- [ ] Update relevant files with implementation notes

### 5. Code Quality Protocols
- [ ] Follow existing code conventions and patterns
- [ ] Check existing dependencies before adding new ones
- [ ] Use shared components/utilities when available
- [ ] Run lint/typecheck commands when available
- [ ] Never commit secrets or sensitive data

### 6. Monorepo Awareness
- [ ] Check if changes affect other apps/shared resources
- [ ] Update shared component versions if modified
- [ ] Maintain interface contracts between shared/project code
- [ ] Document cross-project implications

## Session Decision Points

### 7. When to Continue vs Exit
**Continue if:**
- [ ] Features are tightly coupled
- [ ] Iterating on related components
- [ ] Building directly on just-written code
- [ ] In productive flow state

**Exit if:**
- [ ] Moving to different codebase area
- [ ] Session accumulated debugging noise
- [ ] Switching between projects
- [ ] Token window getting heavy
- [ ] Major architectural changes needed

## Pre-Exit Protocols (End Every Session)

### 8. Documentation Updates (MANDATORY)
- [ ] if claude **Update `coding_docs/claude/CLAUDE.md` with current monorepo status/priorities**
- [ ] Update app-specific `coding_docs/claude/` files if project-specific changes made
- [ ] Create/update session-specific documentation in `coding_docs/sessions/`
- [ ] Update `coding_docs/architecture.md` if architectural changes made
- [ ] Document any new shared resources in `coding_docs/shared-resources.md`
- [ ] Update project-specific README files

### 9. Code Finalization
- [ ] Complete all active todos or document blockers
- [ ] Run final lint/typecheck/test commands
- [ ] **MANDATORY: Commit all session changes to git for clean checkpoint**
- [ ] Tag incomplete work clearly for next session

### 10. Session Handoff Preparation
- [ ] Create next session context in `coding_docs/sessions/next-session.md`
- [ ] List immediate next priorities
- [ ] Document any blockers or dependencies
- [ ] Reference related shared resources

## Session Templates

### New Project Session Template
```markdown
# Session: [Project Name] - [Feature/Goal]
**Date:** [Date]
**Scope:** [Brief description]

## Pre-Session Context
- Previous work: [Reference or "First session"]
- Dependencies: [Shared resources needed]
- Related projects: [Any overlap concerns]

## Session Objectives
1. [Primary objective]
2. [Secondary objective if time permits]

## Architectural Decisions
[Document major decisions made during session]

## Next Session Setup
[What should the next session focus on]
```

### Shared Resource Session Template
```markdown
# Shared Resource Session: [Component/Service Name]
**Date:** [Date]
**Affected Projects:** [List apps that use this resource]

## Changes Made
[List modifications]

## Breaking Changes
[Any interface changes that affect consuming projects]

## Migration Notes
[How existing projects should adapt]

## Testing Completed
[What was verified]
```

## Emergency Protocols

### If Session Gets Derailed
- [ ] Use TodoWrite to capture current state
- [ ] Document what went wrong in session notes
- [ ] Exit cleanly with clear handoff documentation
- [ ] Start fresh session with lessons learned

### If Context Window Becomes Heavy
- [ ] Summarize current progress in TodoWrite
- [ ] Exit session immediately
- [ ] Create detailed handoff documentation
- [ ] Start new session with clean context

## Quality Assurance Checklist

### Before Any Code Changes
- [ ] Understand existing patterns and conventions
- [ ] Check for existing similar implementations
- [ ] Verify shared resource availability

### Before Session Exit
- [ ] All todos marked completed or explicitly handed off
- [ ] Documentation updated with session outcomes
- [ ] Clear next steps documented for continuity
- [ ] No temporary/debug code left in codebase

---

## Usage Notes

**This checklist should be:**
1. **Loaded at every session start** - Read this file first
2. **Referenced during development** - Check protocols before major decisions
3. **Completed before session exit** - Ensure clean handoffs

**Success metrics:**
- Every session has clear scope and outcomes
- Documentation accumulates across sessions
- Shared resources remain stable and versioned
- No session starts without proper context
- Clean handoffs enable productive follow-up sessions

**Remember:** This checklist serves the dual purpose of maintaining development velocity while building sustainable, organized systems that scale beyond individual sessions.

## Documentation Architecture Notes

**CLAUDE.md Hierarchy:**
- **Main `/coding_docs/claude/CLAUDE.md`**: Monorepo overview, current state, shared context
- **App `/apps/{project}/coding_docs/claude/`**: Project-specific implementation details

**Shared Documentation:**
- Conceptual docs (coding standards, testing strategies) belong in `/coding_docs/`
- Project-specific addendums stay in app directories
- Avoid duplication between apps - consolidate shared concepts