-- Create school_registrations table
CREATE TABLE IF NOT EXISTS school_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT NOT NULL,
  institution_name TEXT NOT NULL,
  institution_address TEXT NOT NULL,
  role_in_institution TEXT NOT NULL,
  interested_in_pilot BOOLEAN DEFAULT FALSE,
  willing_to_pay BOOLEAN DEFAULT FALSE,
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_school_registrations_email ON school_registrations(email);
CREATE INDEX IF NOT EXISTS idx_school_registrations_institution_name ON school_registrations(institution_name);
CREATE INDEX IF NOT EXISTS idx_school_registrations_created_at ON school_registrations(created_at);

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to automatically update updated_at
CREATE TRIGGER update_school_registrations_updated_at
  BEFORE UPDATE ON school_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add Row Level Security (RLS)
ALTER TABLE school_registrations ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert registrations (for the public form)
CREATE POLICY "Allow public insert on school_registrations"
  ON school_registrations
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create policy to allow service role to read all registrations
CREATE POLICY "Allow service role to read all school_registrations"
  ON school_registrations
  FOR SELECT
  TO service_role
  USING (true);

-- Create policy to allow service role to update registrations
CREATE POLICY "Allow service role to update school_registrations"
  ON school_registrations
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create policy to allow service role to delete registrations
CREATE POLICY "Allow service role to delete school_registrations"
  ON school_registrations
  FOR DELETE
  TO service_role
  USING (true);
