/*
  # Initial Schema for Pregnancy App

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, unique)
      - `full_name` (text, nullable)
      - `avatar_url` (text, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `pregnancies`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `name` (text)
      - `last_menstrual_period` (date)
      - `due_date` (date)
      - `is_active` (boolean)
      - `notes` (text, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `lab_reports`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `pregnancy_id` (uuid, references pregnancies, nullable)
      - `date` (date)
      - `summary` (text)
      - `source` (enum: manual, upload)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `lab_results`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `lab_report_id` (uuid, references lab_reports)
      - `test_name` (text)
      - `value` (text)
      - `unit` (text)
      - `reference_range` (text)
      - `date` (date)
      - `is_abnormal` (boolean)
      - `notes` (text, nullable)
      - `category` (enum: blood, urine, ultrasound, genetic, other)
      - `trimester` (integer: 1, 2, 3)
      - `explanation` (text, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `medications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `pregnancy_id` (uuid, references pregnancies, nullable)
      - `name` (text)
      - `dosage` (text)
      - `frequency` (text)
      - `prescribed_date` (date)
      - `end_date` (date, nullable)
      - `safety_category` (enum: A, B, C, D, X)
      - `notes` (text, nullable)
      - `llm_safety_analysis` (text, nullable)
      - `llm_benefits` (text, nullable)
      - `llm_risks` (text, nullable)
      - `fda_category` (text, nullable)
      - `overall_safety` (text, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `symptoms`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `pregnancy_id` (uuid, references pregnancies, nullable)
      - `date` (date)
      - `type` (text)
      - `severity` (integer: 1-5)
      - `description` (text)
      - `triggers` (text, nullable)
      - `llm_analysis` (text, nullable)
      - `llm_recommendations` (text, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
*/

-- Create custom types
CREATE TYPE lab_result_category AS ENUM ('blood', 'urine', 'ultrasound', 'genetic', 'other');
CREATE TYPE medication_safety_category AS ENUM ('A', 'B', 'C', 'D', 'X');
CREATE TYPE lab_report_source AS ENUM ('manual', 'upload');

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create pregnancies table
CREATE TABLE IF NOT EXISTS pregnancies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  last_menstrual_period date NOT NULL,
  due_date date NOT NULL,
  is_active boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create lab_reports table
CREATE TABLE IF NOT EXISTS lab_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  pregnancy_id uuid REFERENCES pregnancies(id) ON DELETE SET NULL,
  date date NOT NULL,
  summary text NOT NULL,
  source lab_report_source NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create lab_results table
CREATE TABLE IF NOT EXISTS lab_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  lab_report_id uuid REFERENCES lab_reports(id) ON DELETE CASCADE NOT NULL,
  test_name text NOT NULL,
  value text NOT NULL,
  unit text NOT NULL,
  reference_range text NOT NULL,
  date date NOT NULL,
  is_abnormal boolean NOT NULL,
  notes text,
  category lab_result_category NOT NULL,
  trimester integer CHECK (trimester IN (1, 2, 3)) NOT NULL,
  explanation text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create medications table
CREATE TABLE IF NOT EXISTS medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  pregnancy_id uuid REFERENCES pregnancies(id) ON DELETE SET NULL,
  name text NOT NULL,
  dosage text NOT NULL,
  frequency text NOT NULL,
  prescribed_date date NOT NULL,
  end_date date,
  safety_category medication_safety_category NOT NULL,
  notes text,
  llm_safety_analysis text,
  llm_benefits text,
  llm_risks text,
  fda_category text,
  overall_safety text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create symptoms table
CREATE TABLE IF NOT EXISTS symptoms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  pregnancy_id uuid REFERENCES pregnancies(id) ON DELETE SET NULL,
  date date NOT NULL,
  type text NOT NULL,
  severity integer CHECK (severity >= 1 AND severity <= 5) NOT NULL,
  description text NOT NULL,
  triggers text,
  llm_analysis text,
  llm_recommendations text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pregnancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptoms ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create policies for pregnancies
CREATE POLICY "Users can read own pregnancies"
  ON pregnancies
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pregnancies"
  ON pregnancies
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pregnancies"
  ON pregnancies
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pregnancies"
  ON pregnancies
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for lab_reports
CREATE POLICY "Users can read own lab reports"
  ON lab_reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lab reports"
  ON lab_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lab reports"
  ON lab_reports
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own lab reports"
  ON lab_reports
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for lab_results
CREATE POLICY "Users can read own lab results"
  ON lab_results
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lab results"
  ON lab_results
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lab results"
  ON lab_results
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own lab results"
  ON lab_results
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for medications
CREATE POLICY "Users can read own medications"
  ON medications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own medications"
  ON medications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own medications"
  ON medications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own medications"
  ON medications
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for symptoms
CREATE POLICY "Users can read own symptoms"
  ON symptoms
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own symptoms"
  ON symptoms
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own symptoms"
  ON symptoms
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own symptoms"
  ON symptoms
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS pregnancies_user_id_idx ON pregnancies(user_id);
CREATE INDEX IF NOT EXISTS pregnancies_is_active_idx ON pregnancies(is_active);
CREATE INDEX IF NOT EXISTS lab_reports_user_id_idx ON lab_reports(user_id);
CREATE INDEX IF NOT EXISTS lab_reports_date_idx ON lab_reports(date);
CREATE INDEX IF NOT EXISTS lab_results_user_id_idx ON lab_results(user_id);
CREATE INDEX IF NOT EXISTS lab_results_lab_report_id_idx ON lab_results(lab_report_id);
CREATE INDEX IF NOT EXISTS medications_user_id_idx ON medications(user_id);
CREATE INDEX IF NOT EXISTS symptoms_user_id_idx ON symptoms(user_id);
CREATE INDEX IF NOT EXISTS symptoms_date_idx ON symptoms(date);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pregnancies_updated_at BEFORE UPDATE ON pregnancies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lab_reports_updated_at BEFORE UPDATE ON lab_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lab_results_updated_at BEFORE UPDATE ON lab_results FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medications_updated_at BEFORE UPDATE ON medications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_symptoms_updated_at BEFORE UPDATE ON symptoms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();