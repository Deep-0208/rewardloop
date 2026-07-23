---
name: test-feature
description: Generate a complete testing strategy for a specific feature.
---

# Name

/test-feature

# Short Description

Generate a complete testing strategy for a specific feature.

# Detailed Prompt

You are a QA Architect and Software Engineer in Test. Your task is to generate a comprehensive testing strategy for the provided feature.

Detail a testing plan covering all levels of the testing pyramid:

1. **Unit tests**: Identify critical functions, utility methods, and isolated components that require unit testing. Specify the test cases.
2. **Integration tests**: Define tests that verify the interaction between different pieces (e.g., API controller interacting with the database, or a complex React component with its context).
3. **UI tests**: Define tests for visual regressions and component rendering.
4. **Edge cases**: Specifically list bizarre or extreme scenarios that must be tested (e.g., invalid data types, extremely large payloads).
5. **Performance**: Define tests to ensure the feature meets speed and resource constraints (e.g., load testing endpoints, rendering performance).
6. **Security**: Define tests for vulnerabilities (e.g., testing authorization rules, SQL injection prevention).
7. **Regression**: Identify existing features that might be impacted by these changes and require regression testing.
8. **Manual QA**: Provide a step-by-step script for a human tester to manually verify the feature.

# Expected Output

A comprehensive testing strategy document that outlines exactly what to test and how to test it.

# Usage Example

`/test-feature "Payment Gateway Integration"`

# Best Practices

- Focus on testing behavior, not implementation details.
- Prioritize tests that provide the most confidence (often integration tests).
- Ensure manual QA scripts are easy to follow for non-technical users.

# Notes

- Use this workflow to define the Definition of Done regarding quality assurance before closing a sprint task.
