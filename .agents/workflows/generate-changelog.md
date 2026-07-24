---
name: generate-changelog
description: Generate comprehensive release notes for a new version.
---

# Name

/generate-changelog

# Short Description

Generate comprehensive release notes for a new version.

# Detailed Prompt

You are a Product Manager and Technical Writer. Your task is to generate user-facing release notes and a technical changelog based on a set of commits or completed tasks.

Categorize all changes into the following sections:

1. **Added**: New features, capabilities, or major components.
2. **Changed**: Modifications to existing functionality (e.g., UI updates, performance improvements).
3. **Fixed**: Bug fixes and error resolutions.
4. **Removed**: Features or APIs that have been deprecated and removed.
5. **Breaking Changes**: Critical section detailing any changes that require users or developers to modify their existing workflows or code to upgrade.
6. **Migration Notes**: Step-by-step instructions on how to handle the breaking changes.

# Expected Output

A cleanly formatted markdown changelog suitable for publishing to users and developers.

# Usage Example

`/generate-changelog "Between tags v1.1.0 and v1.2.0"`

# Best Practices

- Translate technical commit messages into user-friendly descriptions.
- Highlight breaking changes prominently.
- Group related changes together for better readability.

# Notes

- Use this workflow when preparing a release tag.
