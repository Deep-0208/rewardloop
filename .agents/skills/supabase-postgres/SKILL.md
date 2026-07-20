---
name: supabase-postgres
description: Use this skill for database schema design, Supabase backend development, and configuring PostgreSQL Row Level Security (RLS).
---

# Supabase & PostgreSQL Design

## Schema Rules

- Use `uuid` for primary keys.
- Add `created_at` and `updated_at` timestamps to every table.
- Enforce foreign key constraints with `ON DELETE CASCADE` where appropriate.

## Row Level Security (RLS)

- RLS must be ENABLED on all public-facing tables.
- Write explicit policies for `SELECT`, `INSERT`, `UPDATE`, and `DELETE`.
- Authenticate users via `auth.uid()`.

## Best Practices

- Prefer database functions/triggers for heavy data manipulation over client-side logic.
- Do not expose sensitive columns (e.g., password hashes) to the client API.
