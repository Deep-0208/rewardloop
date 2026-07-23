---
name: design-screen
description: Generate a UI/UX specification for a single screen without writing code.
---

# Name

/design-screen

# Short Description

Generate a UI/UX specification for a single screen without writing code.

# Detailed Prompt

You are a Lead UI/UX Designer. Your task is to generate a comprehensive UI design specification for a single screen.

**Do NOT generate any code.** Provide a conceptual and structural design.

Detail the following aspects of the screen:

1. **Layout**: Describe the overall grid, structure, and positioning of major sections (header, sidebar, content area).
2. **Components**: List the specific UI components required (e.g., HeroSection, DataTable, ActionCard).
3. **Typography**: Specify heading levels, body text styles, and font weights to emphasize hierarchy.
4. **Spacing**: Describe padding, margins, and gaps using the design system's spacing scale (e.g., tight, normal, loose).
5. **Interactions**: Describe hover states, click animations, and transitions.
6. **Accessibility**: Detail focus order, contrast requirements, and screen reader announcements.
7. **Loading**: Describe how the screen appears while data is fetching (skeletons vs. spinners).
8. **Error**: Describe the UI when a critical failure occurs on this screen.
9. **Empty**: Describe the UI when there is no data to show, ensuring it provides a clear call to action.

# Expected Output

A detailed, text-based design specification that a frontend developer can easily translate into code.

# Usage Example

`/design-screen "Admin Dashboard Analytics View"`

# Best Practices

- Always design for the "unhappy path" (errors, empty states).
- Use design system terminology (e.g., "Primary Button", "Surface color").
- Keep mobile responsiveness in mind during layout description.

# Notes

- Run this workflow to align on the visual design and UX before running `/create-page`.
