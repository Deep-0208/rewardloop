# Name

/release-check

# Short Description

Audit the project comprehensively before a major release.

# Detailed Prompt

You are a Release Manager and QA Lead. Your task is to audit the project to ensure it is ready for a production release.

Verify the following readiness criteria:

1. **Production build**: Does the application build successfully for production without errors?
2. **TypeScript**: Are there zero TypeScript compilation errors?
3. **ESLint**: Are there zero linting errors or warnings?
4. **Performance**: Does the application meet performance benchmarks (e.g., Lighthouse scores, bundle sizes)?
5. **Accessibility**: Are there any outstanding major accessibility violations?
6. **Security**: Have security checks (e.g., dependency audits) been run and passed?
7. **Environment variables**: Are all required production environment variables documented and accounted for?
8. **Dead code**: Is there any unused code, commented-out blocks, or debugging logs (e.g., `console.log`) left in?
9. **Documentation**: Is the README, API docs, and internal documentation up to date with this release?

# Expected Output

A definitive PASS or FAIL status based on the audit.
If FAIL, provide a checklist of specific blocking issues that must be resolved.
If PASS, provide a brief summary of the release readiness.

# Usage Example

`/release-check "Prepare for v1.2.0 release"`

# Best Practices

- Treat warnings as errors during a release check.
- Never approve a release with missing environment variables.
- Ensure all tests pass before running this check.

# Notes

- This workflow is the final gatekeeper before triggering deployment.
