variable "vercel_api_token" {
  type        = string
  description = "Vercel API token for authentication"
  sensitive   = true
}

variable "vercel_team_id" {
  type        = string
  description = "Vercel Team ID"
  default     = ""
}

variable "github_repo" {
  type        = string
  description = "GitHub repository (owner/repo)"
  default     = "owner/rewardloop"
}

variable "site_url" {
  type        = string
  description = "Production Site URL"
  default     = "https://rewardloop.in"
}

variable "supabase_url" {
  type        = string
  description = "Supabase project REST URL"
}

variable "supabase_anon_key" {
  type        = string
  description = "Supabase anonymous public key"
}

variable "supabase_service_role_key" {
  type        = string
  description = "Supabase admin service role key"
  sensitive   = true
}

variable "session_secret" {
  type        = string
  description = "RewardLoop session signing secret (min 32 chars)"
  sensitive   = true
}

variable "upstash_redis_rest_url" {
  type        = string
  description = "Upstash Redis REST API URL"
}

variable "upstash_redis_rest_token" {
  type        = string
  description = "Upstash Redis REST API Token"
  sensitive   = true
}
