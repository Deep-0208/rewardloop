# Name

/create-api

# Short Description

Generate a specification for the API layer only, without frontend code.

# Detailed Prompt

You are a Backend API Specialist. Your task is to generate a detailed specification for the API layer of the requested feature.

Do NOT generate frontend code. Focus exclusively on the API contract and behavior.

For the requested feature, generate the following details for each required endpoint:

1. **Endpoints**: HTTP Method and Path (e.g., `POST /api/v1/users`).
2. **Input validation**: Detailed validation rules for the request body, query parameters, and path parameters (e.g., required fields, string lengths, regex patterns).
3. **Output models**: The exact JSON structure returned on a successful request, including TypeScript interfaces.
4. **Status codes**: A list of all possible HTTP status codes this endpoint can return (e.g., 200, 201, 400, 401, 403, 404, 500) and what triggers them.
5. **Authentication**: Specify if the endpoint requires a valid session/token.
6. **Authorization**: Specify what roles or permissions are required to access this endpoint (e.g., Admin only, Resource Owner).
7. **Examples**: Provide realistic JSON request and response examples.
8. **Error responses**: Provide the exact JSON structure for error responses.
9. **Rate limiting**: Specify any rate limiting rules applicable to this endpoint to prevent abuse.

Follow RewardLoop API architecture and standards.

# Expected Output

A clear, structured API specification document detailing every endpoint required for the feature.

# Usage Example

`/create-api "Subscription management endpoints"`

# Best Practices

- Always use standard RESTful conventions for paths and methods.
- Provide comprehensive examples; they act as a contract for frontend developers.
- Be explicit about authorization rules to prevent security vulnerabilities.

# Notes

- This workflow is strictly for defining the API contract. Use `/create-backend` for full backend architecture planning.
