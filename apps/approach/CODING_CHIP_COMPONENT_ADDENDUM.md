# Chip Input UI Pattern

This is also goes by the name of **Multi-select with Creation** 

## 1\. Abstract

This document defines the standards for implementing a "multi-select with creation" user interface pattern. This component, often referred to as a **Chip Input** or **Tag Input**, allows users to both select items from a predefined list and dynamically add new items via free-text entry. It serves as an evolution of the traditional combo box, enhanced for multi-selection and on-the-fly data entry.

The primary goal of this pattern is to provide a seamless user experience for managing a collection of entities, such as tags, categories, or recipients, without navigating away from the primary input area.

-----

## 2\. Terminology

To ensure consistent communication within the team, the following terms shall be used:

  * **Chip Input / Tag Input**: The entire component, comprising a text field and a set of chips.
  * **Chip / Tag**: The visual, token-like element that represents a single selected or created item. Each chip is typically dismissible.
  * **Creation**: The action of a user typing new text into the input field and pressing a confirmation key (e.g., `Enter`, `Tab`) to convert that text into a chip.

-----

## 3\. Use Cases

### 3.1. When to Use this Pattern

This pattern is the preferred solution for interfaces that require users to build a list of items from a combination of existing and new data.

  * **Tagging**: Assigning metadata keywords to content like articles, images, or issues (e.g., `bug`, `feature`, `documentation`).
  * **Category Management**: Applying multiple categories or labels to an entity, where new categories may need to be created.
  * **Recipient Lists**: Adding contacts to an email or messaging system, allowing both selection from an address book and entry of new email addresses.

### 3.2. When to Avoid this Pattern

This pattern introduces complexity that is unnecessary in simpler scenarios.

  * **Fixed, Single Selection**: Use a standard dropdown (`<select>` or `<md-select>`) if the user must choose only one item from a static list.
  * **Fixed, Multi-selection**: Use a standard multi-select listbox or checkboxes if the user can only choose from a predefined, non-expandable list of options.
  * **Free-text Only**: Use a standard text input (`<md-filled-text-field>`) if there is no concept of discrete, selectable items.

-----

## 4\. Implementation Standard: Lit with Material Design 3

Our standard implementation will leverage the Material Web Components (`@material/web`) library to ensure consistency with the Material Design 3 system and maintain accessibility.

### 4.1. Core Components

The pattern will be constructed using the following components:

  * `<md-chip-set>`: The container for the collection of chips.
  * `<md-input-chip>`: The component for each individual chip, which includes a label and a remove icon.
  * `<md-filled-text-field>` or `<md-outlined-text-field>`: The text input for user entry.

### 4.2. Reference Implementation

The following Lit component provides a foundational blueprint. It demonstrates state management for the list of tags and the logic for adding and removing them.

```typescript
import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import '@material/web/textfield/filled-text-field.js';
import '@material/web/chips/chip-set.js';
import '@material/web/chips/input-chip.js';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/icon/icon.js';

@customElement('chip-input-example')
export class ChipInputExample extends LitElement {
  @state()
  private tags: string[] = ['Lit', 'Material 3'];

  render() {
    return html`
      <div>
        <md-chip-set>
          ${repeat(
            this.tags,
            (tag) => tag,
            (tag) => html`
              <md-input-chip
                label=${tag}
                @remove=${() => this._removeTag(tag)}
              >
                <md-icon-button slot="remove-icon" aria-label=${`Remove ${tag}`}>
                  <md-icon>close</md-icon>
                </md-icon-button>
              </md-input-chip>
            `
          )}
        </md-chip-set>
        
        <md-filled-text-field
          label="Add a new tag"
          aria-label="Enter a tag and press Enter"
          @keydown=${this._handleKeyDown}
        ></md-filled-text-field>
      </div>
    `;
  }

  private _handleKeyDown(e: KeyboardEvent) {
    const input = e.target as HTMLInputElement;
    const newTag = input.value.trim();

    // Add tag on 'Enter' press if input is not empty and tag is not a duplicate.
    if (e.key === 'Enter' && newTag) {
      if (!this.tags.includes(newTag)) {
        this.tags = [...this.tags, newTag];
      }
      // Clear the input for the next entry.
      input.value = '';
      e.preventDefault();
    }
  }

  private _removeTag(tagToRemove: string) {
    this.tags = this.tags.filter((tag) => tag !== tagToRemove);
  }
}
```

-----

## 5\. Behavior and Accessibility (A11y)

### 5.1. User Interaction

  * **Addition**: A new chip is created when the user presses `Enter` in the text field. The field should then be cleared.
  * **Deletion**: A user can remove a chip by clicking its trailing icon or by using the `Backspace` key when the text input is empty and a chip is focused.
  * **Navigation**: Users must be able to navigate between the text input and the chips using the keyboard (`Tab`, arrow keys).

### 5.2. Accessibility

To be compliant, the component must be accessible to all users.

  * **ARIA Roles**: Implement appropriate ARIA attributes to describe the component's role and state (e.g., `role="combobox"` on the container, `role="listbox"` for the chip set, and `role="option"` for each chip).
  * **Labels**: All interactive elements, including the text input and the remove icon on each chip, must have clear, descriptive `aria-label` attributes.
  * **Focus Management**: Ensure logical focus control as users navigate into the component, add chips, and remove them.