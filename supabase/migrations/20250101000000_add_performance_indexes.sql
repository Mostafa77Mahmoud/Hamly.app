
/*
  # Add Performance Indexes - Updated

  This migration adds indexes to improve query performance for commonly accessed fields.
  These indexes will help resolve timeout issues by making queries much faster.

  1. User-based queries
  2. Date-based queries  
  3. Boolean flag queries
  4. Foreign key relationship queries
  5. Composite indexes for complex queries
*/

-- Drop existing indexes if they exist (to avoid conflicts)
DROP INDEX IF EXISTS pregnancies_user_id_idx;
DROP INDEX IF EXISTS pregnancies_is_active_idx;
DROP INDEX IF EXISTS pregnancies_user_active_idx;
DROP INDEX IF EXISTS pregnancies_user_created_idx;
DROP INDEX IF EXISTS pregnancies_user_pregnancy_idx;
DROP INDEX IF EXISTS medications_user_id_idx;
DROP INDEX IF EXISTS medications_user_id_date_idx;
DROP INDEX IF EXISTS medications_user_pregnancy_idx;
DROP INDEX IF EXISTS symptoms_user_id_idx;
DROP INDEX IF EXISTS symptoms_user_id_date_idx;
DROP INDEX IF EXISTS symptoms_user_pregnancy_idx;
DROP INDEX IF EXISTS lab_reports_user_id_idx;
DROP INDEX IF EXISTS lab_reports_date_idx;
DROP INDEX IF EXISTS lab_reports_user_id_date_idx;
DROP INDEX IF EXISTS lab_results_user_id_idx;
DROP INDEX IF EXISTS lab_results_lab_report_id_idx;
DROP INDEX IF EXISTS lab_results_user_id_date_idx;
DROP INDEX IF EXISTS medication_adherence_logs_medication_id_idx;
DROP INDEX IF EXISTS medication_adherence_logs_user_id_date_idx;

-- Pregnancies indexes (CRITICAL for activePregnancy query)
CREATE INDEX pregnancies_user_id_idx ON pregnancies(user_id);
CREATE INDEX pregnancies_is_active_idx ON pregnancies(is_active) WHERE is_active = true;
CREATE INDEX pregnancies_user_active_idx ON pregnancies(user_id, is_active) WHERE is_active = true;
CREATE INDEX pregnancies_user_created_idx ON pregnancies(user_id, created_at DESC);

-- Medications indexes
CREATE INDEX medications_user_id_idx ON medications(user_id);
CREATE INDEX medications_user_id_date_idx ON medications(user_id, created_at DESC);
CREATE INDEX medications_user_pregnancy_idx ON medications(user_id, pregnancy_id);

-- Symptoms indexes
CREATE INDEX symptoms_user_id_idx ON symptoms(user_id);
CREATE INDEX symptoms_user_id_date_idx ON symptoms(user_id, date DESC);
CREATE INDEX symptoms_user_pregnancy_idx ON symptoms(user_id, pregnancy_id);

-- Lab reports indexes
CREATE INDEX lab_reports_user_id_idx ON lab_reports(user_id);
CREATE INDEX lab_reports_date_idx ON lab_reports(date DESC);
CREATE INDEX lab_reports_user_id_date_idx ON lab_reports(user_id, date DESC);

-- Lab results indexes
CREATE INDEX lab_results_user_id_idx ON lab_results(user_id);
CREATE INDEX lab_results_lab_report_id_idx ON lab_results(lab_report_id);
CREATE INDEX lab_results_user_id_date_idx ON lab_results(user_id, date DESC);

-- Medication adherence logs indexes
CREATE INDEX medication_adherence_logs_medication_id_idx ON medication_adherence_logs(medication_id);
CREATE INDEX medication_adherence_logs_user_id_date_idx ON medication_adherence_logs(user_id, date DESC);

-- Additional composite indexes for common query patterns
CREATE INDEX medications_user_active_pregnancy_idx ON medications(user_id, pregnancy_id) WHERE pregnancy_id IS NOT NULL;
CREATE INDEX symptoms_user_active_pregnancy_idx ON symptoms(user_id, pregnancy_id) WHERE pregnancy_id IS NOT NULL;
CREATE INDEX lab_reports_user_pregnancy_idx ON lab_reports(user_id, pregnancy_id) WHERE pregnancy_id IS NOT NULL;

-- Optimize for the specific activePregnancy query pattern
CREATE INDEX pregnancies_active_lookup_idx ON pregnancies(user_id) WHERE is_active = true;

-- Update table statistics to help the query planner
ANALYZE pregnancies;
ANALYZE medications;
ANALYZE symptoms;
ANALYZE lab_reports;
ANALYZE lab_results;
ANALYZE medication_adherence_logs;
ANALYZE profiles;

-- Add foreign key constraints if missing (for better query optimization)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'medications_pregnancy_id_fkey'
    ) THEN
        ALTER TABLE medications 
        ADD CONSTRAINT medications_pregnancy_id_fkey 
        FOREIGN KEY (pregnancy_id) REFERENCES pregnancies(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'symptoms_pregnancy_id_fkey'
    ) THEN
        ALTER TABLE symptoms 
        ADD CONSTRAINT symptoms_pregnancy_id_fkey 
        FOREIGN KEY (pregnancy_id) REFERENCES pregnancies(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'lab_reports_pregnancy_id_fkey'
    ) THEN
        ALTER TABLE lab_reports 
        ADD CONSTRAINT lab_reports_pregnancy_id_fkey 
        FOREIGN KEY (pregnancy_id) REFERENCES pregnancies(id) ON DELETE SET NULL;
    END IF;
END $$;
