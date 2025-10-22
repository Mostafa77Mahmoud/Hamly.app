
/*
  # Fix medications table schema
  
  This migration ensures the medications table has the correct structure
  and fixes any schema inconsistencies that might cause query issues.
*/

-- Ensure fda_category column exists and has correct type
DO $$
BEGIN
    -- Add fda_category column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'medications' AND column_name = 'fda_category'
    ) THEN
        ALTER TABLE medications ADD COLUMN fda_category text;
    END IF;
    
    -- Set default value for fda_category where it's null
    UPDATE medications 
    SET fda_category = 'B' 
    WHERE fda_category IS NULL;
    
    -- Add fda_category_ai column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'medications' AND column_name = 'fda_category_ai'
    ) THEN
        ALTER TABLE medications ADD COLUMN fda_category_ai text;
    END IF;
END $$;

-- Ensure all required columns exist with correct constraints
ALTER TABLE medications 
ALTER COLUMN fda_category SET NOT NULL,
ALTER COLUMN fda_category SET DEFAULT 'B';

-- Add check constraint for fda_category values
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE constraint_name = 'medications_fda_category_check'
    ) THEN
        ALTER TABLE medications 
        ADD CONSTRAINT medications_fda_category_check 
        CHECK (fda_category IN ('A', 'B', 'C', 'D', 'X'));
    END IF;
END $$;

-- Update table statistics
ANALYZE medications;
