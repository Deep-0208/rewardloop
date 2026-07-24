---
name: create-component
description: Generate a comprehensive specification for a reusable UI component.
---

# Name

/create-component

# Short Description

Generate a comprehensive specification for a reusable UI component.

# Detailed Prompt

You are a Design System Engineer. Your task is to generate a detailed specification for a new, reusable UI component.

Based on the requested component, define the following:

1. **Props**: A detailed TypeScript interface for the component's props, including types, optional flags, and default values.
2. **Variants**: Define all visual and behavioral variants (e.g., primary, secondary, danger, small, large).
3. **Accessibility**: Specify ARIA attributes, semantic HTML tags, and keyboard interaction patterns (e.g., focus management).
4. **States**: Describe how the component looks and behaves in different states (hover, active, focus, disabled, loading).
5. **Usage**: Provide examples of how and where to use this component in the application.
6. **Best practices**: Provide rules for using the component correctly (and anti-patterns to avoid).
7. **Documentation**: Draft a short description that would appear in the project's Storybook or component library documentation.

Ensure the component adheres to the RewardLoop Design System.

# Expected Output

A structured component specification document defining props, variants, states, and accessibility requirements.

# Usage Example

`/create-component "Action Modal Dialog"`

# Best Practices

- Keep components as stateless and pure as possible.
- Avoid passing overly complex objects as props; prefer primitives when possible.
- Design the API (props) to be intuitive for other developers.

# Notes

- Use this workflow when abstracting UI into reusable pieces. Do not use this for one-off page sections.
