
-- Migration: Add performance index for active pregnancy queries
-- This addresses the timeout issues in activePregnancy data loading
-- Created: 2025-01-26

-- Add index for fast lookup of active pregnancies by user
CREATE INDEX IF NOT EXISTS idx_pregnancies_user_active 
ON pregnancies(user_id) 
WHERE is_active = true;

-- Add is_active column to medications if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'medications' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE medications ADD COLUMN is_active boolean NOT NULL DEFAULT true;
        RAISE NOTICE 'Added is_active column to medications table';
    END IF;
END $$;

-- Add index for medications active lookup (preventative)
CREATE INDEX IF NOT EXISTS idx_medications_user_active 
ON medications(user_id) 
WHERE is_active = true;

-- Update table statistics for query planner
ANALYZE pregnancies;
ANALYZE medications;

-- Rollback instructions:
-- DROP INDEX CONCURRENTLY IF EXISTS idx_pregnancies_user_active;
-- DROP INDEX CONCURRENTLY IF EXISTS idx_medications_user_active;
-- ALTER TABLE medications DROP COLUMN IF EXISTS is_active;
