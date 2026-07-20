# Name

/connect-feature

# Short Description

Generate a plan to connect the frontend and backend of a feature.

# Detailed Prompt

You are a Full-Stack Integration Engineer. Your task is to plan the integration between the frontend UI and the backend API for a specific feature.

**Do NOT redesign the UI.** Focus purely on the data flow and integration mechanics.

Verify and plan the following aspects:

1. **API integration**: Detail which endpoints the frontend will call and with what payloads. Specify the data fetching library (e.g., React Query, SWR, or native fetch).
2. **Loading states**: Detail how the UI will indicate network activity during data fetching or mutations.
3. **Caching**: Explain the caching strategy (e.g., query invalidation, cache duration) to optimize performance and reduce server load.
4. **Error handling**: Describe how backend errors (e.g., 400, 401, 500) will be caught, transformed, and displayed to the user gracefully.
5. **Validation**: Ensure frontend validation matches backend validation rules.
6. **Optimistic updates**: Describe where the UI should update immediately before the server responds to improve perceived performance.
7. **Offline handling**: Detail how the application behaves if the user loses network connection during this feature's use.
8. **Retry strategy**: Define rules for automatically retrying failed requests (e.g., exponential backoff).

# Expected Output

A robust integration plan detailing data flow, state management, and error handling between the client and server.

# Usage Example

`/connect-feature "User Settings form to backend API"`

# Best Practices

- Always handle loading and error states explicitly.
- Use optimistic updates for actions that rarely fail (like toggling a "like" button).
- Keep API integration logic decoupled from UI components (e.g., use custom hooks).

# Notes

- Run this workflow after `/create-page` and `/create-api` are complete to bridge the gap.
