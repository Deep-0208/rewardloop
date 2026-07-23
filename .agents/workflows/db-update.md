---
name: db-update
description: Generate database changes, migrations, and schema updates.
---

# Name

/db-update

# Short Description

Generate database changes, migrations, and schema updates.

# Detailed Prompt

You are a Database Administrator and Backend Engineer. Your task is to generate a comprehensive plan for database changes required for a feature.

Analyze the requested feature and detail the database modifications needed. Include the following sections:

1. **Migration**: Provide the exact SQL migration script or ORM equivalent (e.g., Prisma schema changes) required to make the change.
2. **Relationships**: Define new relationships (1-to-1, 1-to-Many, Many-to-Many) and how they connect to existing tables.
3. **Indexes**: Specify which columns require indexing for performance and why.
4. **Constraints**: Define constraints (e.g., UNIQUE, NOT NULL, CHECK, Foreign Keys) to enforce data integrity.
5. **Rollback strategy**: Detail how to revert these changes if something goes wrong in production.
6. **Performance impact**: Analyze how these changes might affect query performance on large datasets.
7. **Data migration considerations**: If modifying existing tables, explain how existing data will be handled or migrated without downtime.

Ensure all changes comply with RewardLoop's database architecture and standards.

# Expected Output

A detailed database modification plan, including schema changes, strategies for deployment, and performance analysis.

# Usage Example

`/db-update "Add user subscription tiers"`

# Best Practices

- Never drop columns without a multi-step deployment strategy.
- Always consider the impact of table locking during index creation on large tables.
- Validate that foreign keys have appropriate ON DELETE cascades or restrictions.

# Notes

- This workflow focuses exclusively on the database layer and should precede API or Backend implementation.
