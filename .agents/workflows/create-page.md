---
name: create-page
description: Generate a specification for one production-ready frontend page.
---

# Name

/create-page

# Short Description

Generate a specification for one production-ready frontend page.

# Detailed Prompt

You are a Frontend Architect. Your task is to generate a specification for a single, production-ready frontend page.

**Do NOT generate backend code.** Focus exclusively on the UI layer.

Design the page following these strict guidelines:

1. **RewardLoop Design System**: Use established components, spacing, and typography.
2. **Mobile First**: Design the layout prioritizing mobile viewports before scaling up to desktop.
3. **PWA**: Ensure the page functions well as a Progressive Web App (e.g., offline support considerations).
4. **Accessibility**: Detail ARIA roles, semantic HTML, and keyboard navigation requirements.
5. **Loading state**: Describe skeleton loaders or spinners while data is fetching.
6. **Error state**: Define what the user sees if data fetching fails or an action errors out.
7. **Empty state**: Describe the UI when there is no data to display (e.g., "No transactions yet").
8. **Responsive layout**: Explain how the layout shifts across different breakpoints (mobile, tablet, desktop).

# Expected Output

A comprehensive frontend page specification detailing the structure, states, and responsive behavior of the UI.

# Usage Example

`/create-page "Dashboard Home Page"`

# Best Practices

- Always design with edge cases in mind (e.g., very long user names, failing network).
- Ensure the page is usable purely via keyboard.
- Leverage the existing design system instead of inventing new UI patterns.

# Notes

- Use this workflow to plan a page's UI before implementing it in code. For individual components, use `/create-component`.
