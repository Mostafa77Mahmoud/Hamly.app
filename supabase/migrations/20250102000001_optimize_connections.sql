
/*
  # Connection and Query Optimizations
  
  This migration adds database-level optimizations to improve
  connection handling and query performance.
*/

-- Optimize PostgreSQL settings for better performance
-- These are session-level settings that help with query performance

-- Enable more efficient query plans
SET enable_hashjoin = on;
SET enable_mergejoin = on;
SET enable_nestloop = on;

-- Optimize work memory for complex queries
-- This is set at session level, not globally
SET work_mem = '16MB';

-- Optimize shared buffers usage
SET effective_cache_size = '256MB';

-- Create a function to optimize query performance
CREATE OR REPLACE FUNCTION optimize_query_performance()
RETURNS void AS $$
BEGIN
    -- Update statistics for all tables
    ANALYZE pregnancies;
    ANALYZE medications;
    ANALYZE symptoms;
    ANALYZE lab_reports;
    ANALYZE lab_results;
    ANALYZE medication_adherence_logs;
    ANALYZE profiles;
    
    -- Log optimization completion
    RAISE NOTICE 'Query performance optimization completed';
END;
$$ LANGUAGE plpgsql;

-- Create a function specifically for activePregnancy lookup
CREATE OR REPLACE FUNCTION get_active_pregnancy_optimized(user_uuid uuid)
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
    RETURN QUERY
    SELECT p.id, p.user_id, p.name, p.last_menstrual_period, p.due_date, 
           p.is_active, p.notes, p.created_at, p.updated_at
    FROM pregnancies p
    WHERE p.user_id = user_uuid AND p.is_active = true
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_active_pregnancy_optimized(uuid) TO authenticated;

-- Run initial optimization
SELECT optimize_query_performance();
