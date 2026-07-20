---
name: nextjs-expert
description: Use this skill when developing Next.js features, writing React components, or styling with Tailwind CSS.
---

# Next.js & React Expert

## App Router Guidelines

- Default to **Server Components** for data fetching and better performance.
- Only add `'use client'` when interactivity, state (useState/useEffect), or browser APIs are required.
- Place data fetching logic as close to the consuming component as possible.

## React Best Practices

- Use functional components and hooks.
- Avoid prop drilling; use Context or state management (e.g., Zustand) when appropriate.
- Keep components small and focused.

## Tailwind CSS

- Use utility classes over custom CSS files.
- Adhere to the project's design tokens (colors, spacing).
- Use `cn` or `clsx` for dynamic class names.
