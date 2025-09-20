# Shareable Web Component Coding Standards

## 1\. The Prime Directive: Design for Reusability

Our single most important architectural goal is to make every component **shareable** across different applications within the monorepo. To achieve this, components must be designed as **presentation-only** ("dumb") components whenever reasonably practical.

A presentation-only component is completely decoupled from its environment. It has three core characteristics:

1.  **No Business Logic:** It doesn't know *how* to save a user, add an item to a cart, or submit a form.
2.  **No Data Ownership:** It doesn't fetch its own data or connect to APIs.
3.  **No Environmental Awareness:** It doesn't know what application or page it's being used in.

Its sole responsibility is to render a user interface based on the state it is given and to announce user interactions. By enforcing this strict separation of concerns, we ensure a component can be dropped into any context without modification, maximizing its value and reducing code duplication.

-----

## 2\. Our Standard for Decoupling: A Signals-First Architecture

To enforce and simplify the creation of presentation-only components, we use a **signals-first architecture** as the standard for managing all reactive state.

This approach effectively decouples components from a rigid parent-child hierarchy, allowing them to connect directly to a shared source of truth. The following sections detail how to implement this pattern.

### 2.1. The Source of Truth: Centralized Signal State

All dynamic application state that can change over time **must** be managed in signals. This state should be co-located with the business logic that modifies it, typically in dedicated service or state files.

  * ✅ **Do:** Create state files (e.g., `user.state.ts`) that define and export signals and the functions that modify them.
  * ❌ **Don't:** Define shared state signals inside a component's class. A component's role is to consume or update state, not own it.

#### Example: A Standard State File

```typescript
// file: ./src/state/user.state.ts

import { signal } from '@lit-labs/preact-signals';
import { userService } from '../services/user-service.ts';

// 1. Define and export the signal as the source of truth.
export const currentUser = signal({ name: 'Loading...', email: '' });

// 2. Define and export functions that encapsulate the logic for state changes.
export async function fetchUser(userId: string) {
  const user = await userService.fetch(userId);
  currentUser.value = user;
}

export async function updateUser(newName: string) {
  const updatedUser = { ...currentUser.value, name: newName };
  currentUser.value = updatedUser; // Optimistic update
  await userService.save(updatedUser);
}
```

### 2.2. Component Design: Direct Signal Consumption

Components achieve their presentation-only nature by connecting directly to the state signals they need, making them independent of their position in the component tree.

  * ✅ **Do:** Import signals directly into your components. Use tooling like the `@signal` decorator to ensure the component automatically re-renders when the signal's value changes.
  * ❌ **Don't:** Pass reactive data via props from a parent. This creates unnecessary coupling and violates the principle of a component being self-sufficient.

#### Example: Signal-Consuming Components

This `user-display` component is purely presentational. It only knows how to render a user's name and email; it has no idea where that data comes from.

```typescript
// file: ./src/components/user-display.ts
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { signal } from '@lit-labs/preact-signals';

// 1. Import the signal directly.
import { currentUser } from '../state/user.state.ts';

@customElement('user-display')
@signal // This decorator links the component's lifecycle to any signals read in render().
export class UserDisplay extends LitElement {
  render() {
    // 2. Read the signal's value directly in the template.
    return html`
      <h2>Welcome, ${currentUser.value.name}!</h2>
      <p>Email: ${currentUser.value.email}</p>
    `;
  }
}
```

### 2.3. The Limited Role of Properties and Events

While signals are the default for all reactive data, properties and events are reserved for specific use cases that do not break the presentation-only model.

#### When to Use Properties (`@property`)

Use properties **only** for passing **static or configuration data**—data that does not change during the component's lifecycle.

  * **Configuration:** `variant="primary"`, `iconName="close"`
  * **Static Labels:** `label="First Name"`
  * **Identifiers:** A unique ID used by the component to select the *correct* signal from a larger state store (e.g., `<user-profile userId="123"></user-profile>`).

#### When to Use Events (`CustomEvent`)

Use events **only** for communicating **transient user actions** that do not map directly to a persistent state change.

  * **Notifications:** Notifying a parent that a one-time animation has completed.
  * **Layout Changes:** Requesting a parent container to `close` or `dismiss` the component (e.g., a modal's close button).