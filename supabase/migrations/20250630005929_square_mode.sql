/*
  # Add medication adherence tracking

  1. New Tables
    - `medication_adherence_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `medication_id` (uuid, references medications)
      - `date` (date)
      - `taken` (boolean)
      - `notes` (text, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on `medication_adherence_logs` table
    - Add policies for authenticated users to manage their own adherence logs
*/

-- Create medication adherence logs table
CREATE TABLE IF NOT EXISTS medication_adherence_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  medication_id uuid REFERENCES medications(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  taken boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE medication_adherence_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for medication_adherence_logs
CREATE POLICY "Users can read own medication adherence logs"
  ON medication_adherence_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own medication adherence logs"
  ON medication_adherence_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own medication adherence logs"
  ON medication_adherence_logs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own medication adherence logs"
  ON medication_adherence_logs
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS medication_adherence_logs_user_id_idx ON medication_adherence_logs(user_id);
CREATE INDEX IF NOT EXISTS medication_adherence_logs_medication_id_idx ON medication_adherence_logs(medication_id);
CREATE INDEX IF NOT EXISTS medication_adherence_logs_date_idx ON medication_adherence_logs(date);

-- Create trigger for updated_at
CREATE TRIGGER update_medication_adherence_logs_updated_at 
  BEFORE UPDATE ON medication_adherence_logs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();