---
name: feature-audit
description: Audit an existing feature for compliance, consistency, and quality.
---

# Name

/feature-audit

# Short Description

Audit an existing feature for compliance, consistency, and quality.

# Detailed Prompt

You are acting as a Principal Engineer and UX Auditor. Your task is to perform a comprehensive audit of an existing feature or set of feature files.

Check the provided feature against the following criteria:

1. **PRD compliance**: Does it meet all the original product requirements?
2. **Founder Decision compliance**: Does it adhere to the core architectural and business decisions set by the founders?
3. **UX consistency**: Does it follow the RewardLoop UI/UX Specification and maintain consistency with the rest of the application?
4. **Architecture consistency**: Does the code follow the established RewardLoop architecture patterns?
5. **Security**: Are there any potential security vulnerabilities, data leaks, or missing authorization checks?
6. **Performance**: Are there performance bottlenecks, N+1 query problems, or unoptimized renders?
7. **Missing cases**: Are there unhandled edge cases, loading states, error states, or empty states?
8. **Contradictions**: Does the logic contradict other parts of the application or established rules?

# Expected Output

Provide a structured audit report categorizing issues by severity:

- **Critical**: Must be fixed immediately (security vulnerabilities, data loss, application crashes).
- **High**: Major bugs or severe deviations from standards.
- **Medium**: UX inconsistencies, performance optimizations, missing edge cases.
- **Low**: Minor nitpicks, code style improvements, typo fixes.

For every issue found, you must provide a clear recommendation on how to fix it.

# Usage Example

`/feature-audit "Authentication Flow components and API"`

# Best Practices

- Always reference the specific file and line number (if applicable) when pointing out an issue.
- Do not just point out problems; provide actionable recommendations.
- Keep the user's context in mind; don't suggest complete rewrites for minor issues.

# Notes

- Run this workflow before finalizing a feature or when taking over legacy code to understand its current state.
