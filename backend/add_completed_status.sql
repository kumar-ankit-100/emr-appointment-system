-- Migration: Add 'Completed' status to appointments table
-- Run this on your Neon database to allow 'Completed' status

-- Drop the old constraint
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;

-- Add new constraint with 'Completed' included
ALTER TABLE appointments ADD CONSTRAINT appointments_status_check 
    CHECK (status IN ('Confirmed', 'Scheduled', 'Upcoming', 'Cancelled', 'Completed'));

-- Verify the change
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'appointments_status_check';
