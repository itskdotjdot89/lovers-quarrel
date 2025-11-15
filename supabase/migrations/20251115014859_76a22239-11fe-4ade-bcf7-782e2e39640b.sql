-- Remove 'family' from bundle_type enum
-- First, update any existing family subscriptions to couple (if any exist)
UPDATE subscriptions SET bundle_type = 'couple' WHERE bundle_type = 'family';

-- Drop the default temporarily
ALTER TABLE subscriptions ALTER COLUMN bundle_type DROP DEFAULT;

-- Create new enum without 'family'
CREATE TYPE bundle_type_new AS ENUM ('individual', 'couple');

-- Alter the table to use the new enum
ALTER TABLE subscriptions 
  ALTER COLUMN bundle_type TYPE bundle_type_new 
  USING bundle_type::text::bundle_type_new;

-- Drop the old enum and rename the new one
DROP TYPE bundle_type;
ALTER TYPE bundle_type_new RENAME TO bundle_type;

-- Restore the default
ALTER TABLE subscriptions ALTER COLUMN bundle_type SET DEFAULT 'individual'::bundle_type;