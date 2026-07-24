---
name: run-project
description: Start the Next.js development server for the project.
---

# Name

/run-project

# Short Description

Start the Next.js development server for the project.

# Detailed Prompt

You are an AI assistant helping a developer. Your task is to start the Next.js development server for this project.

1. First, check if the server is already running.
2. If it is already running, notify the user with the localhost URL (http://localhost:3000).
3. If it is not running, execute `npm run dev` in the background.
4. After starting it, provide the URL (http://localhost:3000) to the user for testing.

# Expected Output

The development server running in the background and a message confirming the local URL.

# Usage Example

`/run-project`

# Best Practices

- Always check if the task is already running in the background before trying to start a new server to avoid port conflicts.
- Provide the exact clickable URL to the user so they can quickly test their app.

# Notes

- This workflow automates the process of starting the local development environment, making it easy to see changes in real-time.
