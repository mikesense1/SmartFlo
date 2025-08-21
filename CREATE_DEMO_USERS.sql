-- Demo Users for SmartFlo Production Database
-- Use this script in your Neon database console to create demo users

-- Insert demo freelancer account
INSERT INTO users (
  email, 
  full_name, 
  password_hash, 
  user_type, 
  subscription_tier, 
  total_contracts_value, 
  is_email_verified,
  freelance_type
) VALUES (
  'demo@smartflo.com',
  'Sarah Johnson', 
  '$2b$12$sXEcbAKKdnfV7WliKj.fyeVoPlvz8CroO4Da16xCr5.j6/4sNLViG',
  'freelancer',
  'free',
  '0',
  true,
  'developer'
) ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  full_name = EXCLUDED.full_name;

-- Insert demo client account  
INSERT INTO users (
  email,
  full_name,
  password_hash, 
  user_type,
  subscription_tier,
  total_contracts_value,
  is_email_verified,
  company_name
) VALUES (
  'client@acmecorp.com',
  'Michael Chen',
  '$2b$12$3yavMwhLmqzt8q0EU73PW.kU3frJA0IsBOPqxftuO2JLQ0BKXPvvi',
  'client', 
  'free',
  '0',
  true,
  'ACME Corp'
) ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  full_name = EXCLUDED.full_name;

-- Verify the users were created
SELECT email, full_name, user_type, created_at FROM users 
WHERE email IN ('demo@smartflo.com', 'client@acmecorp.com');