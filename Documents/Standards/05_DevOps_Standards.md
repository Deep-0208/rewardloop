# DevOps, Git & CI/CD Standards

## 1. Git Standards

- **Branch Strategy:** Simplified GitHub Flow (Trunk-based). Branches: `feature/*`, `bugfix/*`, `chore/*`.
- **Commit Strategy:** Strict Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`).
- **PR & Merge:** All PRs require 1 approval. Squash and merge into `main`. Ensure PRs link to issues.
- **Versioning:** Semantic versioning applied via git tags.

## 2. CI/CD Standards (GitHub Actions)

- **Pipeline Stages:**
  1. Linting & Formatting (ESLint, Prettier).
  2. Type Checking (`tsc --noEmit`).
  3. Testing (Unit & Integration).
  4. Security Scan (`npm audit`, secret scanning).
  5. Build (Next.js build).
- **Deployment:** Automatic deployment to Vercel upon merging to `main`. Preview deployments for PRs.
- **Rollback:** Instant rollbacks via Vercel dashboard.

## 3. Release & Deployment Checklists

**Code Review Checklist:**

- [ ] SOLID principles followed?
- [ ] Server Component vs Client Component correctly split?
- [ ] Zod validation added for all inputs?
- [ ] Unit tests cover new logic?

**Deployment Checklist:**

- [ ] Supabase migrations applied successfully?
- [ ] Environment variables updated in Vercel?
- [ ] RLS policies verified?
- [ ] Lighthouse scores checked on Preview URL?
