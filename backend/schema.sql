-- Healthcare EMR Appointment Management System
-- PostgreSQL Schema for Neon Database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create appointments table with comprehensive fields
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_name VARCHAR(255) NOT NULL,
    doctor_name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    duration INTEGER NOT NULL DEFAULT 30, -- duration in minutes
    status VARCHAR(50) NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Confirmed', 'Scheduled', 'Upcoming', 'Cancelled', 'Completed')),
    mode VARCHAR(50) NOT NULL CHECK (mode IN ('Online', 'In-Person')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for common queries
CREATE INDEX idx_appointments_date ON appointments(date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_patient ON appointments(patient_name);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_name);

-- Seed 15+ appointments with realistic data
INSERT INTO appointments (patient_name, doctor_name, date, time, duration, status, mode, notes) VALUES
-- Today's appointments
('Rajesh Kumar', 'Dr. Priya Singh', CURRENT_DATE, '09:00', 30, 'Confirmed', 'In-Person', 'Regular checkup'),
('Anjali Patel', 'Dr. Amit Gupta', CURRENT_DATE, '10:00', 45, 'Confirmed', 'Online', 'Consultation for diabetes management'),
('Vivek Sharma', 'Dr. Priya Singh', CURRENT_DATE, '11:30', 30, 'Upcoming', 'In-Person', 'Follow-up appointment'),
('Neha Verma', 'Dr. Ravi Desai', CURRENT_DATE, '14:00', 60, 'Scheduled', 'Online', 'Dental examination'),

-- Tomorrow's appointments
('Arjun Singh', 'Dr. Priya Singh', CURRENT_DATE + INTERVAL '1 day', '09:30', 30, 'Scheduled', 'In-Person', 'Routine physical exam'),
('Priyanka Gupta', 'Dr. Amit Gupta', CURRENT_DATE + INTERVAL '1 day', '11:00', 45, 'Upcoming', 'Online', 'Thyroid consultation'),
('Karan Malhotra', 'Dr. Ravi Desai', CURRENT_DATE + INTERVAL '1 day', '15:00', 30, 'Confirmed', 'In-Person', 'Eye checkup'),

-- Future appointments
('Sneha Iyer', 'Dr. Priya Singh', CURRENT_DATE + INTERVAL '3 days', '10:00', 40, 'Scheduled', 'Online', 'Neurological consultation'),
('Rohit Sharma', 'Dr. Amit Gupta', CURRENT_DATE + INTERVAL '5 days', '09:00', 30, 'Confirmed', 'In-Person', 'Blood pressure monitoring'),
('Divya Nair', 'Dr. Ravi Desai', CURRENT_DATE + INTERVAL '7 days', '14:30', 50, 'Upcoming', 'In-Person', 'Dermatology consultation'),

-- Past appointments
('Sanjay Patel', 'Dr. Priya Singh', CURRENT_DATE - INTERVAL '1 day', '10:00', 30, 'Confirmed', 'In-Person', 'Completed - Regular checkup'),
('Meera Singh', 'Dr. Amit Gupta', CURRENT_DATE - INTERVAL '2 days', '11:00', 45, 'Confirmed', 'Online', 'Completed - Consultation'),
('Vikram Joshi', 'Dr. Ravi Desai', CURRENT_DATE - INTERVAL '3 days', '15:00', 30, 'Confirmed', 'In-Person', 'Completed - Follow-up'),
('Pooja Mahajan', 'Dr. Priya Singh', CURRENT_DATE - INTERVAL '5 days', '09:30', 40, 'Cancelled', 'Online', 'Cancelled by patient'),
('Akshay Kumar', 'Dr. Amit Gupta', CURRENT_DATE - INTERVAL '7 days', '13:00', 60, 'Confirmed', 'In-Person', 'Completed - Comprehensive checkup');
