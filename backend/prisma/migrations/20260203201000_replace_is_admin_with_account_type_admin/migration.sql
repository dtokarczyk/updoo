-- Add ADMIN to AccountType enum (must be in separate transaction from usage in PostgreSQL)
ALTER TYPE "AccountType" ADD VALUE IF NOT EXISTS 'ADMIN';
