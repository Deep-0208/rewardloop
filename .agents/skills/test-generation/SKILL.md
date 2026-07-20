---
name: test-generation
description: Use this skill when writing, generating, or reviewing unit tests, integration tests, or end-to-end tests.
---

# Test Generation

## Testing Strategy

1. **Unit Tests:** Focus on pure functions and isolated business logic. Mock external dependencies.
2. **Integration Tests:** Ensure database queries and API routes work as expected. Use a test database if necessary.
3. **E2E Tests:** Focus on critical user journeys (e.g., login, checkout).

## Best Practices

- Follow the Arrange-Act-Assert (AAA) pattern.
- Test edge cases (null inputs, boundary values, network failures).
- Maintain >80% code coverage on core domain models.
- Ensure test files are co-located with the implementation (e.g., `feature.ts` -> `feature.test.ts`).
