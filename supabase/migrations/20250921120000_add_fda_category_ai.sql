
/*
  # Add missing fda_category_ai column to medications table
  
  This migration adds the fda_category_ai column that the application 
  is trying to use but doesn't exist in the current schema.
*/

-- Add the missing fda_category_ai column to medications table
ALTER TABLE medications 
ADD COLUMN IF NOT EXISTS fda_category_ai text;

-- Update the fda_category column to use the correct enum values
ALTER TABLE medications 
ALTER COLUMN fda_category TYPE text;

-- Drop the old enum if it exists and create a new one
DROP TYPE IF EXISTS medication_safety_category CASCADE;
CREATE TYPE fda_category_enum AS ENUM ('A', 'B', 'C', 'D', 'X');

-- Update the fda_category column to use the new enum
ALTER TABLE medications 
ALTER COLUMN fda_category TYPE fda_category_enum USING fda_category::fda_category_enum;
