# Name

/create-backend

# Short Description

Generate a comprehensive backend implementation plan for a specific feature.

# Detailed Prompt

You are a Senior Backend Engineer. Your task is to generate a comprehensive backend implementation plan for the requested feature.

You must STRICTLY adhere to the following order when planning the backend:

1. **Database**: Schema design, tables, columns, indexes, and relations.
2. **Types**: TypeScript interfaces and types for database models and domain entities.
3. **Validation**: Zod or equivalent validation schemas for input data.
4. **Repository**: Data access layer logic, queries, and mutations.
5. **Business Logic**: Core service layer logic separating business rules from HTTP concerns.
6. **API**: Route definitions, controllers, and request/response handling.
7. **Authentication**: How routes are secured and who can access them.
8. **Authorization**: Role-based access control (RBAC) or ownership checks.
9. **Error Handling**: Standardized error responses and logging.
10. **Testing**: Strategy for unit and integration testing of the backend code.

You MUST enforce the following constraints:

- Use **TypeScript strict mode**.
- Ensure a **reusable architecture** (e.g., separate services and repositories).
- Ensure **no duplicated logic**.
- Do **NOT generate any frontend code**.

Ensure the architecture follows RewardLoop's backend standards and documentation.

# Expected Output

A detailed, ordered markdown document explaining exactly how the backend will be implemented for the feature, adhering to the specified layers.

# Usage Example

`/create-backend "User profile update feature"`

# Best Practices

- Keep business logic isolated from API controllers.
- Always plan for validation at the system boundaries.
- Define explicit TypeScript types for all data crossing boundaries.

# Notes

- This workflow is for planning the backend architecture and structure before writing the actual code. For specific API endpoint generation, use `/create-api`.
