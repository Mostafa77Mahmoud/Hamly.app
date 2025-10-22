
/*
  # Final Schema Validation and Cleanup
  
  This migration ensures database schema consistency and fixes all identified issues:
  1. Removes deprecated safety_category column from medications
  2. Ensures all required columns exist with proper constraints
  3. Updates indexes for optimal performance
  4. Validates all foreign key relationships
*/

-- First, ensure we're working with the correct schema
SET search_path = public;

-- Create enum for FDA categories if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fda_category_enum') THEN
        CREATE TYPE fda_category_enum AS ENUM ('A', 'B', 'C', 'D', 'X');
    END IF;
END $$;

-- 1. Clean up medications table - remove deprecated safety_category
DO $$
BEGIN
    -- Check if safety_category column exists and drop it
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'medications' AND column_name = 'safety_category'
    ) THEN
        -- Migrate any remaining data from safety_category to fda_category
        UPDATE medications 
        SET fda_category = safety_category::text
        WHERE fda_category IS NULL AND safety_category IS NOT NULL;
        
        -- Drop the deprecated column
        ALTER TABLE medications DROP COLUMN safety_category;
        RAISE NOTICE 'Removed deprecated safety_category column from medications';
    END IF;
END $$;

-- 2. Ensure all required columns exist with proper types
DO $$
BEGIN
    -- Ensure fda_category exists and has proper constraints
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'medications' AND column_name = 'fda_category'
    ) THEN
        ALTER TABLE medications ADD COLUMN fda_category text NOT NULL DEFAULT 'B';
    END IF;
    
    -- Ensure fda_category_ai exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'medications' AND column_name = 'fda_category_ai'
    ) THEN
        ALTER TABLE medications ADD COLUMN fda_category_ai text;
    END IF;
    
    -- Set proper constraints
    ALTER TABLE medications ALTER COLUMN fda_category SET NOT NULL;
    ALTER TABLE medications ALTER COLUMN fda_category SET DEFAULT 'B';
END $$;

-- 3. Validate and fix foreign key relationships
DO $$
BEGIN
    -- Check if medication_adherence_logs table exists first
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'medication_adherence_logs') THEN
        -- Ensure medication_adherence_logs has proper foreign key to medications
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'medication_adherence_logs_medication_id_fkey'
        ) THEN
            ALTER TABLE medication_adherence_logs 
            ADD CONSTRAINT medication_adherence_logs_medication_id_fkey 
            FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE;
        END IF;
    END IF;
    
    -- Ensure lab_results has proper foreign key to lab_reports
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'lab_results_lab_report_id_fkey'
    ) THEN
        ALTER TABLE lab_results 
        ADD CONSTRAINT lab_results_lab_report_id_fkey 
        FOREIGN KEY (lab_report_id) REFERENCES lab_reports(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4. Create missing indexes for performance (using regular CREATE INDEX, not CONCURRENTLY)
CREATE INDEX IF NOT EXISTS idx_medications_user_fda_category 
ON medications(user_id, fda_category);

-- Only create this index if the table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'medication_adherence_logs') THEN
        CREATE INDEX IF NOT EXISTS idx_medication_adherence_logs_date 
        ON medication_adherence_logs(date DESC);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_lab_results_category_abnormal 
ON lab_results(category, is_abnormal) WHERE is_abnormal = true;

-- 5. Update table statistics
ANALYZE medications;
ANALYZE lab_reports;
ANALYZE lab_results;
ANALYZE symptoms;
ANALYZE pregnancies;
ANALYZE profiles;

-- Only analyze medication_adherence_logs if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'medication_adherence_logs') THEN
        ANALYZE medication_adherence_logs;
    END IF;
END $$;

-- 6. Validate data integrity
DO $$
DECLARE
    orphaned_records INTEGER;
BEGIN
    -- Only check medication adherence logs if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'medication_adherence_logs') THEN
        -- Check for orphaned medication adherence logs
        SELECT COUNT(*) INTO orphaned_records
        FROM medication_adherence_logs mal
        LEFT JOIN medications m ON mal.medication_id = m.id
        WHERE m.id IS NULL;
        
        IF orphaned_records > 0 THEN
            RAISE WARNING 'Found % orphaned medication adherence logs', orphaned_records;
            -- Clean up orphaned records
            DELETE FROM medication_adherence_logs 
            WHERE medication_id NOT IN (SELECT id FROM medications);
        END IF;
    END IF;
    
    -- Check for orphaned lab results
    SELECT COUNT(*) INTO orphaned_records
    FROM lab_results lr
    LEFT JOIN lab_reports rep ON lr.lab_report_id = rep.id
    WHERE rep.id IS NULL;
    
    IF orphaned_records > 0 THEN
        RAISE WARNING 'Found % orphaned lab results', orphaned_records;
        -- Clean up orphaned records
        DELETE FROM lab_results 
        WHERE lab_report_id NOT IN (SELECT id FROM lab_reports);
    END IF;
END $$;

-- 7. Ensure proper RLS policies are in place
DO $$
BEGIN
    -- Refresh RLS policies for all tables to ensure they're current
    DROP POLICY IF EXISTS "Users can read own medications" ON medications;
    DROP POLICY IF EXISTS "Users can insert own medications" ON medications;
    DROP POLICY IF EXISTS "Users can update own medications" ON medications;
    DROP POLICY IF EXISTS "Users can delete own medications" ON medications;
    
    CREATE POLICY "Users can read own medications" ON medications
        FOR SELECT TO authenticated
        USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert own medications" ON medications
        FOR INSERT TO authenticated
        WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update own medications" ON medications
        FOR UPDATE TO authenticated
        USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can delete own medications" ON medications
        FOR DELETE TO authenticated
        USING (auth.uid() = user_id);
END $$;

-- 8. Create function for data validation
CREATE OR REPLACE FUNCTION validate_database_consistency()
RETURNS TABLE(table_name text, issue_type text, issue_count bigint, details text)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check for medications without valid FDA categories
    RETURN QUERY
    SELECT 'medications'::text, 'invalid_fda_category'::text, 
           COUNT(*)::bigint, 'Medications with invalid FDA category'::text
    FROM medications 
    WHERE fda_category NOT IN ('A', 'B', 'C', 'D', 'X');
    
    -- Check for future pregnancy dates
    RETURN QUERY
    SELECT 'pregnancies'::text, 'future_dates'::text,
           COUNT(*)::bigint, 'Pregnancies with future LMP dates'::text
    FROM pregnancies 
    WHERE last_menstrual_period > CURRENT_DATE;
    
    -- Check for symptoms with invalid severity
    RETURN QUERY
    SELECT 'symptoms'::text, 'invalid_severity'::text,
           COUNT(*)::bigint, 'Symptoms with invalid severity (not 1-5)'::text
    FROM symptoms 
    WHERE severity NOT BETWEEN 1 AND 5;
    
    -- Check for lab results with invalid trimester
    RETURN QUERY
    SELECT 'lab_results'::text, 'invalid_trimester'::text,
           COUNT(*)::bigint, 'Lab results with invalid trimester (not 1-3)'::text
    FROM lab_results 
    WHERE trimester NOT BETWEEN 1 AND 3;
END $$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION validate_database_consistency() TO authenticated;

-- Final completion notice
DO $$
BEGIN
    RAISE NOTICE 'Schema validation and cleanup completed successfully';
END $$;
