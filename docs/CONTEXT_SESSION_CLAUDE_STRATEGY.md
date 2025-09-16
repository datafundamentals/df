# Context Strategy for Claude Code Session Design.md

This is a summary of tips made by claude for maximizing use of claude code's session window.

## Source of this Document

I asked anthropic chat the following question:

```
one of the challenges of using claude code is that i am moving so fast through my tasks that now things are becoming disorganzied.
- Systems which naturally evolve over the years need to happen in days and weeks
- I am concerned about accumulation of code v limits against token windows
- There are natural overlaps between unrelated projects and shared docs
- There are natural overlaps between projects and shared web components
- There are natural overlaps between projects and shared servers or even external services
- There are natural overlaps between multiple local and remote instances such firebase and firebase emulator 

There are other issues, but I'm sure you get the point. Normally I would solve this by moving the team to a monorepo, and document things accordingly.

But now it's primarily me and claude code, and I don't know how to manage this in a way that works well with both claude's sessions, and also with the many shared resources that I don't want to necessary load up in a single token context. For example, should I keep opening and closing sessions different sessions within a child projects? Or ... or ... or - so many options. What should the strategy be?
```

You've hit a classic scaling challenge that's amplified by Claude Code's session-based nature. The tension between rapid development velocity and maintaining organized, reusable architecture is real. Here's a strategic approach:

## Core Strategy: Hybrid Monorepo with Session Boundaries

**Set up a monorepo structure** but design it around Claude Code's session model rather than fighting it:

```
workspace/
├── shared/
│   ├── components/     # Shared React/UI components
│   ├── services/       # Shared APIs, database models
│   ├── config/         # Environment configs, constants
│   └── utils/          # Pure utility functions
├── apps/
│   ├── project-a/
│   ├── project-b/
│   └── project-c/
└── docs/
    ├── architecture.md
    ├── session-guides/  # Claude Code session templates
    └── shared-resources.md
```

## Session Management Strategy

**Use focused, purpose-driven sessions:**

1. **Shared Resource Sessions**: Dedicated sessions for developing/maintaining shared components, services, or utilities. These run longer and accumulate more context.

2. **Project-Specific Sessions**: Shorter sessions focused on individual app features, importing from shared resources rather than recreating them.

3. **Integration Sessions**: Bridge sessions that handle cross-project concerns or major architectural changes.

## Practical Tactics

**For token window management:**
- Create concise "context summaries" at the start of sessions referencing shared resources
- Use clear import statements and references rather than copying shared code
- Keep session-specific READMEs that Claude can quickly reference

**For shared resources:**
- Version your shared components/services explicitly
- Create "interface contracts" - clear APIs between shared and project-specific code
- Use TypeScript interfaces as documentation that travels light in token windows

**For overlapping infrastructure:**
- Document environment switching clearly (firebase vs emulator, local vs remote)
- Create setup scripts that Claude can reference and modify
- Use environment-specific config files that sessions can quickly understand

## When to Start New Sessions

- **Continue session**: Adding features within the same project scope
- **New session**: Switching between projects, major architectural changes, or when context gets too heavy with debugging artifacts

The key insight is treating Claude Code sessions as you would treat focused work sprints - each should have a clear scope and outcome, with handoffs happening through well-documented shared resources rather than massive context windows.

```
With regard to your notation Continue session: Adding features within the same project scope If i finish one feature is it bad practice to /exit before stating the next feature within the same project?
```

**Exiting between features is often good practice**, even within the same project. Here's why:

## Benefits of `/exit` Between Features

**Context hygiene**: Each feature development accumulates debugging artifacts, failed attempts, and tangential discussions. Starting fresh gives Claude a clean slate to focus on the new feature without that baggage.

**Clearer feature boundaries**: Each session becomes a discrete unit of work with clear inputs/outputs, making it easier to track what was accomplished and when.

**Token efficiency**: You avoid carrying forward irrelevant context from the previous feature that might crowd out space for the new feature's requirements.

## When to Continue vs Exit

**Continue the session when:**
- Features are tightly coupled (e.g., building a form and its validation logic)
- You're iterating rapidly on related UI components
- The next feature directly builds on code you just wrote
- You're in a flow state and context switching would be disruptive

**Exit and start fresh when:**
- Moving to a different part of the codebase
- The previous feature involved significant debugging/troubleshooting  
- You want Claude to approach the new feature with fresh perspective
- The session has accumulated a lot of "noise"

## Practical Workflow

A good pattern might be:
1. Start session with feature goal
2. Implement and test the feature
3. `/exit` 
4. Start new session: "Building on the user auth I just completed, now I need to add profile management..."

This gives you the benefits of both continuity (by referencing previous work) and fresh context. The key is being explicit about what was just accomplished when you start the new session.

Think of it like focused work blocks rather than marathon coding sessions - often more effective even when working on the same project. 

## Session Documentation

This question

```
if i create documentation for a new session, what happens to the documentation i created for previous sessions?
```

Great question - this touches on a key challenge with Claude Code's session-based model. Here's what happens and how to manage it:

## What Happens to Previous Session Documentation

**Session documentation is ephemeral** - when you exit a Claude Code session, any documentation created within that session only exists if it was written to actual files in your codebase. Claude doesn't retain memory of previous sessions.

## Documentation Strategy for Claude Code

**Write documentation to persistent files, not just in chat:**

```
workspace/
├── docs/
│   ├── sessions/
│   │   ├── 2024-09-15-user-auth.md      # Feature completion notes
│   │   ├── 2024-09-15-profile-mgmt.md   # Next feature session
│   │   └── session-template.md          # Standard format
│   ├── architecture.md                  # Living architecture doc
│   └── project-status.md               # Current state summary
```

**Session handoff pattern:**
1. **End each session** by asking Claude to update/create relevant markdown files
2. **Start new sessions** by having Claude read the latest documentation first
3. **Maintain living docs** that get updated across sessions rather than created fresh each time

## Practical Workflow

**At session end:**
```
"Before we /exit, please update docs/project-status.md with what we just completed and create docs/sessions/user-auth-completed.md summarizing the implementation."
```

**At session start:**
```
"Please read docs/project-status.md and docs/architecture.md to understand the current state, then let's work on the profile management feature."
```

**For shared resources:**
Keep a `docs/shared-resources.md` that gets updated whenever you modify shared components/services, so future sessions understand what's available.

The key insight: treat documentation as **code artifacts** that persist in your filesystem, not as session conversations that disappear. Each session should contribute to and read from this persistent knowledge base.

This way your documentation accumulates and evolves across sessions rather than being recreated each time.

## claude.md

```
previously i used a claude.md file as my primary driver, at least initially. I assume this would be replaced by the per each session readme?
```
Not necessarily! You can actually use **both approaches strategically**:

## Keep claude.md as Your Master Driver

The `claude.md` file can remain your **primary orchestration document** - think of it as your project's "mission control":

```
claude.md                    # Master project driver
├── Project overview
├── Current priorities  
├── Architecture decisions
├── Cross-cutting concerns
└── Session reference guide
```

## Session READMEs for Tactical Work

Per-session READMEs handle the **tactical, feature-specific context**:

```
docs/sessions/
├── session-template.md      # Standard format
├── user-auth-session.md     # Feature-specific context
└── profile-mgmt-session.md  # Next feature context
```

## Hybrid Workflow

**At project start:** Create/update `claude.md` with overall direction
**At session start:** Read `claude.md` + relevant session README
**During session:** Work within the session's tactical scope  
**At session end:** Update both the session README and potentially `claude.md`

## Evolution of claude.md

Your `claude.md` evolves from:
- **Initial state**: "Here's what I want to build"
- **Active development**: "Here's current status, priorities, and architectural decisions"
- **Maintenance mode**: "Here's how the system works and common session patterns"

## Practical Example

```markdown
# claude.md
## Current Priority
Finishing user management system - auth is complete, now working on profiles

## Quick Start for New Sessions
1. Read this file
2. Check docs/architecture.md for system overview
3. Check docs/sessions/latest-session.md for immediate context
4. Review shared/ directory for available components

## Active Decisions
- Using Firebase Auth (not local)
- Shared components in shared/components/
- Each feature gets its own session
```

So `claude.md` becomes your **strategic context**, while session READMEs provide **tactical context**. Both work together rather than replacing each other.