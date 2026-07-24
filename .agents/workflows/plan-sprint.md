---
name: plan-sprint
description: Break a feature down into actionable implementation tasks for a development sprint.
---

# Name

/plan-sprint

# Short Description

Break a feature down into actionable implementation tasks for a development sprint.

# Detailed Prompt

You are an Agile Project Manager and Technical Lead. Your task is to break down a feature or set of requirements into actionable implementation tasks suitable for a development sprint.

Based on the provided feature context, generate a Sprint Plan containing:

1. **Sprint Goal**: A clear, concise statement of what this sprint aims to achieve.
2. **Development tasks**: A granular list of technical tasks required to build the feature (e.g., "Create users table migration", "Implement POST /api/users endpoint").
3. **Dependencies**: Clearly state which tasks block other tasks (e.g., "Task B depends on Task A").
4. **Priority**: Assign a priority to each task (High, Medium, Low).
5. **Estimated complexity**: Provide a relative complexity estimate for each task (e.g., Story Points: 1, 2, 3, 5, 8, or T-Shirt Sizes: S, M, L, XL).
6. **Definition of Done**: A checklist of what must be true for a task to be considered complete.
7. **Testing requirements**: Specify what types of tests (Unit, Integration, E2E) need to be written for these tasks.

Ensure the tasks are small, independent (where possible), and deliverable within a standard sprint cycle. Follow the RewardLoop development documentation for task structuring.

# Expected Output

A structured markdown document outlining the sprint plan, with a clear list of tasks, dependencies, and estimations.

# Usage Example

`/plan-sprint "Based on the User Referral System implementation plan"`

# Best Practices

- Keep tasks small enough to be completed in a day or two.
- Always identify database/backend tasks as dependencies for frontend tasks.
- Ensure the Definition of Done includes testing and documentation updates.

# Notes

- This workflow pairs well with `/create-feature`. Use `/create-feature` to define _what_ needs to be built, and `/plan-sprint` to define _how_ work will be executed.
