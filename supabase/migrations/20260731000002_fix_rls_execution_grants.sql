-- Migration: 20260731000002_fix_rls_execution_grants.sql
-- Description: Restore EXECUTE permission on auth_business_id for authenticated users.
-- This function is used in RLS policies evaluated by authenticated users, so they must have permission to execute it.

GRANT EXECUTE ON FUNCTION public.auth_business_id() TO authenticated;
