# AI Agent Rules & Documentation Standards

## 1. Mandatory AI Behavior Rules

- **NEVER invent APIs:** Only use existing endpoints or standard Supabase methods.
- **NEVER ignore project architecture:** Always place code in the correct Feature or Shared layer.
- **ALWAYS follow the Design System:** Strictly use shadcn/ui and Tailwind. No custom CSS classes.
- **ALWAYS validate types:** Ensure strict TypeScript and Zod validation.
- **ALWAYS generate tests:** Create corresponding `.test.ts` files for business logic.
- **ALWAYS update documentation:** When altering a feature, update its Markdown document.
- **ALWAYS check accessibility:** Include ARIA labels and focus rings.
- **ALWAYS optimize performance:** Use Server Components by default.
- **ALWAYS preserve backward compatibility:** Unless explicitly told to introduce a breaking change.

## 2. Documentation Standards

- Every feature must be documented in `Development/` before coding begins.
- Explain the _Why_, not just the _How_.
- Keep documentation close to code (e.g., READMEs inside complex feature folders).
- Maintain clear database diagrams and API interface specs in `Documents/`.
