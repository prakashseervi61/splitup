-- SplitUP Onboarding Completed Flag
-- Migration 00003: Add onboarding_completed column to users table
alter table if exists public.users add column if not exists onboarding_completed boolean not null default false;
