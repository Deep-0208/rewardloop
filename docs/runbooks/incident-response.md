# Incident Response Runbook

This document serves as the primary escalation point for all high-severity (P0/P1) production incidents.

## Severity Definitions

- **P0 (Critical):** Complete system outage, massive data loss/breach, core flows (Login/Billing) completely broken. **Action:** Drop everything, escalate immediately.
- **P1 (High):** Major feature broken for many users, significant performance degradation, partial outage. **Action:** Escalate, assemble tiger team.
- **P2 (Medium):** Feature broken for subset of users, minor performance hit. **Action:** Handle within next sprint or normal working hours.
- **P3 (Low):** Minor bug, cosmetic issue. **Action:** Add to backlog.

## Escalation Path

If a P0 or P1 incident is detected:

1.  **Acknowledge:** Acknowledge the alert in the relevant channel.
2.  **Declare Incident:** Create an incident channel (e.g., `#inc-YYYYMMDD-description`).
3.  **Roles:** Establish an Incident Commander (IC). The IC drives communication and delegates investigation.
4.  **Communicate:** Post a status update internally and, if necessary, to external status pages.

## Immediate Runbooks

### 1. Database Failover (Supabase)

If the primary database goes down or becomes unresponsive:

1.  Navigate to the Supabase Dashboard -> Database -> Backups.
2.  Verify the last Point-in-Time Recovery (PITR) backup timestamp.
3.  If primary is unrecoverable, initiate a restore to a new project or rely on Supabase's managed failover (if enabled).
4.  _Note:_ Manual PITR restoration may result in minutes of data loss. Communicate this to stakeholders.

### 2. Cache Exhaustion / Rate Limit Spikes (Upstash Redis)

If legitimate users are being blocked due to aggressive rate limiting or Redis memory exhaustion:

1.  Navigate to Upstash Console.
2.  Check Memory Usage and Connections.
3.  If rate limits are too aggressive, temporarily adjust the threshold in `src/lib/rate-limit.ts` (requires a PR and Vercel redeploy).
4.  If it is a DDOS attack, enable Vercel Attack Challenge Mode via the Vercel Dashboard -> Security.

### 3. Emergency Rollbacks (Vercel)

If a bad deployment breaks production:

1.  Navigate to the Vercel Dashboard -> Deployments.
2.  Identify the last known good deployment.
3.  Click the vertical dots (...) next to the good deployment and select **Promote to Production** or **Rollback**.
4.  Verify the rollback was successful.
5.  Revert the bad commit in GitHub to unblock the `main` branch.
