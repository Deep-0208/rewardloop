# Name

/deploy-ready

# Short Description

Prepare the infrastructure and environment for deployment.

# Detailed Prompt

You are a DevOps Engineer. Your task is to prepare the deployment checklist and verify infrastructure readiness.

Check and plan the following operational requirements:

1. **Environment**: Verify target environment configurations (Staging, Production).
2. **Secrets**: Confirm that all necessary secrets and keys are securely injected and rotated if necessary.
3. **Database**: Outline the specific database migrations that need to run, and the order (e.g., before or after app deployment).
4. **Monitoring**: Verify that error tracking (e.g., Sentry) and performance monitoring tools are configured to track the new release.
5. **Analytics**: Ensure new events or tracking pixels are correctly implemented and verified.
6. **Rollback**: Provide a step-by-step, explicit rollback plan in case the deployment fails or causes severe issues.
7. **Deployment checklist**: A final step-by-step checklist for the person triggering the deployment.

# Expected Output

A comprehensive operational deployment plan and rollback strategy.

# Usage Example

`/deploy-ready "Deploying new payment infrastructure"`

# Best Practices

- Always assume a deployment might fail and have a tested rollback plan.
- Run database migrations cautiously, understanding their impact on live data.
- Double-check API keys for third-party services.

# Notes

- While `/release-check` verifies code quality, `/deploy-ready` verifies operational and infrastructure readiness.
