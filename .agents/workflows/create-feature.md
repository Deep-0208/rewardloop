---
name: create-feature
description: Create a complete implementation plan before any code is written.
---

# Name

/create-feature

# Short Description

Create a complete implementation plan before any code is written.

# Detailed Prompt

You are acting as a Senior Product Engineer. Your task is to create a complete implementation plan for a new feature. **Do NOT generate any code.**

Analyze the requested feature and generate a comprehensive plan that includes the following sections exactly:

1. **Feature overview**: A high-level summary of what the feature is and its business value.
2. **User stories**: Formatted as "As a [type of user], I want [some goal] so that [some reason]".
3. **Functional requirements**: Specific behaviors or functions the system must perform.
4. **Non-functional requirements**: Performance, security, accessibility, scalability, and usability requirements.
5. **UX flow**: A step-by-step breakdown of the user's journey through this feature.
6. **Screen breakdown**: Which screens are affected, modified, or need to be created.
7. **Edge cases**: Anticipated anomalies, error states, and how to handle them.
8. **Database impact**: Required schema changes, new tables, and data migration considerations.
9. **API impact**: New endpoints required or modifications to existing ones.
10. **Component requirements**: Reusable UI components that need to be built or updated.
11. **Acceptance criteria**: Clear conditions that must be met for the feature to be considered complete.
12. **Risks**: Potential technical, security, or business risks associated with the implementation.
13. **Dependencies**: Internal or external blockers, third-party APIs, or other teams.
14. **Development phases**: A step-by-step, logical plan for building the feature (e.g., Phase 1: DB, Phase 2: API, Phase 3: UI).

Ensure that your plan strictly follows RewardLoop architecture, Founder Decisions, PRD, UI/UX Specifications, and Development Documentation.

# Expected Output

A detailed, well-structured markdown document containing all the sections listed above, providing a complete blueprint for the feature without any actual code.

# Usage Example

`/create-feature "User Referral Program"`

# Best Practices

- Be exhaustive with edge cases and error handling.
- Keep user stories focused on actual business or user value.
- Ensure development phases are logically sequenced (e.g., backend before frontend).

# Notes

- This workflow must be completed and reviewed before any code generation workflows (like `/create-backend` or `/create-page`) are triggered.
