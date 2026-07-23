/**
 * RewardLoop — Authentication Feature Types.
 *
 * Domain types for phone OTP auth flow, user sessions, and business state.
 * Source: backend_implementation_plan.md & api_specification.md
 *
 * @module features/auth/types
 */

import type { PhoneNumber, UUID, ActionResult } from "@/types";

export interface SendOTPInput {
  readonly phone: string;
}

export interface VerifyOTPInput {
  readonly phone: string;
  readonly otp: string;
}

export interface AuthUser {
  readonly id: UUID;
  readonly authUserId: UUID;
  readonly phone: PhoneNumber;
  readonly role: "owner" | "staff";
  readonly businessId: UUID | null;
  readonly sessionVersion: number;
}

export interface AuthBusiness {
  readonly id: UUID;
  readonly name: string;
  readonly status: "active" | "suspended" | "archived" | "deleted";
}

export interface VerifyOTPResult {
  readonly user: AuthUser;
  readonly business: AuthBusiness | null;
  readonly redirectTo: string; // ROUTES.DASHBOARD or ROUTES.ONBOARDING_BUSINESS
}

export type SendOTPResponse = ActionResult<{ phone: string }>;
export type VerifyOTPResponse = ActionResult<VerifyOTPResult>;
export type LogoutResponse = ActionResult<void>;
export type ValidateSessionResponse = ActionResult<{
  userId: string;
  phone: string;
}>;
