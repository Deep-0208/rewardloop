---
name: git-workflow
description: Use this skill to automate Git branching, writing commit messages, and managing CI/CD workflows.
---

# Git Workflow

## Branching Strategy

- Use Trunk-based development or simplified GitHub Flow.
- Branch names: `feature/xyz`, `bugfix/xyz`, `chore/xyz`.

## Conventional Commits

- `feat:` A new feature.
- `fix:` A bug fix.
- `docs:` Documentation only changes.
- `style:` Changes that do not affect the meaning of the code.
- `refactor:` A code change that neither fixes a bug nor adds a feature.
- `test:` Adding missing tests.
- `chore:` Updating build tasks, package manager configs, etc.

## Instructions

- When asked to commit code, ALWAYS generate a conventional commit message.
- Do not commit directly to `main`.
