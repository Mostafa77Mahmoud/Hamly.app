
-- Optimize active pregnancy queries with better indexing and function
-- This migration addresses timeout issues in activePregnancy queries

-- Drop existing function if exists
DROP FUNCTION IF EXISTS get_active_pregnancy_optimized(uuid);

-- Create optimized index specifically for active pregnancy lookups
CREATE INDEX IF NOT EXISTS pregnancies_user_active_optimized_idx 
ON pregnancies(user_id, is_active, updated_at DESC) 
WHERE is_active = true;

-- Additional index for faster user-based queries
CREATE INDEX IF NOT EXISTS pregnancies_user_id_idx 
ON pregnancies(user_id);

-- Partial index for active pregnancies only
CREATE INDEX IF NOT EXISTS pregnancies_active_only_idx 
ON pregnancies(id, user_id, name, last_menstrual_period, due_date, is_active, notes, created_at, updated_at) 
WHERE is_active = true;

-- Create specialized function for active pregnancy with timeout protection
CREATE OR REPLACE FUNCTION get_active_pregnancy_fast(user_uuid uuid)
RETURNS TABLE(
    id uuid,
    user_id uuid,
    name text,
    last_menstrual_period date,
    due_date date,
    is_active boolean,
    notes text,
    created_at timestamptz,
    updated_at timestamptz
) AS $$
BEGIN
    -- Set statement timeout to prevent hanging queries
    SET LOCAL statement_timeout = '8s';
    
    -- Use the optimized index and return immediately
    RETURN QUERY
    SELECT p.id, p.user_id, p.name, p.last_menstrual_period, p.due_date, 
           p.is_active, p.notes, p.created_at, p.updated_at
    FROM pregnancies p
    WHERE p.user_id = user_uuid 
      AND p.is_active = true
    ORDER BY p.updated_at DESC
    LIMIT 1;
    
    -- Reset statement timeout
    RESET statement_timeout;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_active_pregnancy_fast(uuid) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION get_active_pregnancy_fast(uuid) IS 'Optimized function to quickly fetch active pregnancy for a user with timeout protection';

-- Update table statistics to help query planner
ANALYZE pregnancies;
