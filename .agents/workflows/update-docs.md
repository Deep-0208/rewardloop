# Name

/update-docs

# Short Description

Synchronize project documentation with the latest code changes.

# Detailed Prompt

You are a Technical Writer and Developer Advocate. Your task is to synchronize the project's documentation based on recent code changes.

**CRITICAL RULE**: Never invent features. Only document what actually exists in the code.

Update the following documentation areas based on the provided changes:

1. **PRD**: Update product requirements if the implementation deviated from the original plan for technical reasons.
2. **Architecture**: Document new architectural decisions, patterns, or new services introduced.
3. **Database**: Update the schema documentation, ER diagrams, or data dictionaries.
4. **API**: Update API documentation (e.g., Swagger/OpenAPI) with new endpoints, modified payloads, or new error codes.
5. **UI documentation**: Update Storybook or design system docs with new component states or variants.
6. **Workflow documentation**: Update any team processes or workflow guides if they have changed.
7. **Changelog**: Add entries for the recent changes (use `/generate-changelog` for a full release changelog).

# Expected Output

A list of specific updates made to various documentation files, or the updated markdown content itself.

# Usage Example

`/update-docs "Based on the recent refactor of the Authentication service"`

# Best Practices

- Documentation should be updated in the same PR as the code changes.
- Keep documentation concise and code-adjacent where possible.
- Remove outdated documentation; inaccurate docs are worse than no docs.

# Notes

- Run this workflow at the end of a sprint or major feature completion.
