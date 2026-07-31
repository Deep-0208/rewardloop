# RewardLoop Infrastructure as Code (IaC) — Terraform Specification
# Platform Stack: Supabase Cloud, Vercel Edge Platform & Upstash Redis

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 1.10.0"
    }
    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.0.0"
    }
  }

  backend "s3" {
    # Replace with your state bucket in production
    bucket         = "rewardloop-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "ap-south-1"
    encrypt        = true
    dynamodb_table = "rewardloop-terraform-locks"
  }
}

provider "vercel" {
  api_token = var.vercel_api_token
  team      = var.vercel_team_id
}

# Vercel Project Resource
resource "vercel_project" "rewardloop" {
  name      = "rewardloop"
  framework = "nextjs"

  git_repository = {
    type = "github"
    repo = var.github_repo
  }

  build_command    = "npm run build"
  output_directory = ".next"
  install_command  = "npm ci"
}

# Multi-Region Deployment Environment Variables
resource "vercel_project_environment_variable" "site_url" {
  project_id = vercel_project.rewardloop.id
  key        = "NEXT_PUBLIC_SITE_URL"
  value      = var.site_url
  target     = ["production", "preview", "development"]
}

resource "vercel_project_environment_variable" "supabase_url" {
  project_id = vercel_project.rewardloop.id
  key        = "NEXT_PUBLIC_SUPABASE_URL"
  value      = var.supabase_url
  target     = ["production", "preview", "development"]
}

resource "vercel_project_environment_variable" "supabase_anon_key" {
  project_id = vercel_project.rewardloop.id
  key        = "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  value      = var.supabase_anon_key
  target     = ["production", "preview", "development"]
}

resource "vercel_project_environment_variable" "supabase_service_role_key" {
  project_id = vercel_project.rewardloop.id
  key        = "SUPABASE_SERVICE_ROLE_KEY"
  value      = var.supabase_service_role_key
  target     = ["production", "preview"]
  sensitive  = true
}

resource "vercel_project_environment_variable" "session_secret" {
  project_id = vercel_project.rewardloop.id
  key        = "REWARDLOOP_SESSION_SECRET"
  value      = var.session_secret
  target     = ["production", "preview"]
  sensitive  = true
}

resource "vercel_project_environment_variable" "upstash_url" {
  project_id = vercel_project.rewardloop.id
  key        = "UPSTASH_REDIS_REST_URL"
  value      = var.upstash_redis_rest_url
  target     = ["production", "preview"]
}

resource "vercel_project_environment_variable" "upstash_token" {
  project_id = vercel_project.rewardloop.id
  key        = "UPSTASH_REDIS_REST_TOKEN"
  value      = var.upstash_redis_rest_token
  target     = ["production", "preview"]
  sensitive  = true
}
