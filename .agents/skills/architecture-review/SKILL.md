---
name: architecture-review
description: Use this skill when reviewing system design, checking architecture compliance, or refactoring code for SOLID/DRY principles.
---

# Architecture Review

## Core Principles

1. **SOLID:** Ensure classes/modules follow Single Responsibility, Open-Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion.
2. **DRY:** Do not repeat yourself. Abstract shared logic into utilities or base classes.
3. **Modularity:** Keep bounded contexts separate. For SaaS, isolate billing, authentication, and core domain logic.

## Instructions

- When asked to review code architecture, evaluate coupling and cohesion.
- Propose interfaces for external dependencies (e.g., payment gateways, email services).
- Avoid premature optimization. Emphasize readability and maintainability.
