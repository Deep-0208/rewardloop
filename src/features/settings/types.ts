/**
 * RewardLoop — Settings Feature Types.
 *
 * Domain types for the business settings/more page.
 *
 * @module features/settings/types
 */

import type { ActionResult, Paise, UUID, Timestamp } from "@/types";

/** Business profile data. */
export interface BusinessProfile {
  readonly id: UUID;
  readonly name: string;
  readonly businessType: string;
  readonly email: string | null;
  readonly gstNumber: string | null;
  readonly address: string | null;
}

/** Reward rules configuration. */
export interface RewardRulesConfig {
  readonly id: UUID;
  readonly rewardPercentage: number;
  readonly maxRedeemPercentage: number;
}

/** Catalog item for the management list (includes inactive items). */
export interface CatalogManagementItem {
  readonly id: UUID;
  readonly name: string;
  readonly price: Paise;
  readonly type: "service" | "product";
  readonly status: "active" | "inactive";
  readonly createdAt: Timestamp;
}

/** Full settings page data. */
export interface SettingsData {
  readonly profile: BusinessProfile;
  readonly rewardRules: RewardRulesConfig | null;
  readonly catalogItemCount: number;
  readonly customerCount: number;
}

export type GetSettingsResponse = ActionResult<SettingsData>;
export type GetCatalogManagementResponse = ActionResult<
  CatalogManagementItem[]
>;
export type GetRewardRulesResponse = ActionResult<RewardRulesConfig>;

/** Input for creating/updating a catalog item. */
export interface CatalogItemInput {
  readonly name: string;
  readonly price: Paise;
  readonly type: "service" | "product";
}

/** Input for updating reward rules. */
export interface RewardRulesInput {
  readonly rewardPercentage: number;
  readonly maxRedeemPercentage: number;
}

export type MutateCatalogItemResponse = ActionResult<CatalogManagementItem>;
export type UpdateRewardRulesResponse = ActionResult<RewardRulesConfig>;
