-- Hospital Information Management System (HIMS)
-- Optimized Database Schema
-- Created: October 26, 2025
-- Author: HIMS Development Team

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- ENUMS
-- =============================================

CREATE TYPE user_role AS ENUM ('admin', 'doctor', 'pharmacist', 'receptionist', 'patient');
CREATE TYPE gender_type AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');
CREATE TYPE blood_group_type AS ENUM ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');
CREATE TYPE appointment_status AS ENUM ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');
CREATE TYPE visit_type AS ENUM ('consultation', 'follow_up', 'emergency', 'routine_checkup');
CREATE TYPE prescription_status AS ENUM ('pending', 'filled', 'partially_filled', 'out_of_stock', 'cancelled');
CREATE TYPE test_status AS ENUM ('ordered', 'in_progress', 'completed', 'cancelled');

-- =============================================
-- CORE TABLES
-- =============================================

-- Hospitals (Multi-tenant support)
CREATE TABLE hospitals (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'CGH' for City General Hospital
  logo_url TEXT,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'USA',
  postal_code VARCHAR(20),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  website VARCHAR(255),
  
  -- Hospital Settings
  settings JSONB DEFAULT '{
    "workingHours": {"start": "08:00", "end": "20:00"},
    "appointmentDuration": 30,
    "allowPatientSelfRegistration": true,
    "requireDoctorApproval": false,
    "enablePharmacy": true,
    "enableLab": true,
    "currency": "USD",
    "timezone": "America/New_York"
  }',
  
  departments TEXT[], -- Array of department names
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_hospitals_code ON hospitals(code);
CREATE INDEX idx_hospitals_active ON hospitals(is_active) WHERE deleted_at IS NULL;

-- Users (Authentication and base user info)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT, -- NULL if OAuth user
  
  -- Personal Info
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  date_of_birth DATE,
  gender gender_type,
  profile_picture_url TEXT,
  
  -- OAuth
  oauth_provider VARCHAR(50), -- 'google', 'microsoft', etc.
  oauth_provider_id VARCHAR(255),
  
  -- Status
  email_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_oauth ON users(oauth_provider, oauth_provider_id);
CREATE INDEX idx_users_active ON users(is_active) WHERE deleted_at IS NULL;

-- User Sessions (Token management)
CREATE TABLE user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  
  -- Session Info
  device_info JSONB, -- User agent, browser, OS
  ip_address INET,
  
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(token_hash);
CREATE INDEX idx_sessions_expiry ON user_sessions(expires_at);

-- Hospital Users (Role mapping)
CREATE TABLE hospital_users (
  id SERIAL PRIMARY KEY,
  hospital_id INT REFERENCES hospitals(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  
  role user_role NOT NULL,
  employee_id VARCHAR(100), -- Hospital-specific employee ID
  department VARCHAR(100),
  specialization VARCHAR(100), -- For doctors
  license_number VARCHAR(100), -- For doctors/pharmacists
  
  -- Permissions
  permissions JSONB DEFAULT '[]', -- Array of permission strings
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by INT REFERENCES hospital_users(id),
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(hospital_id, user_id)
);

CREATE INDEX idx_hospital_users_hospital ON hospital_users(hospital_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_hospital_users_user ON hospital_users(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_hospital_users_role ON hospital_users(hospital_id, role) WHERE deleted_at IS NULL;
CREATE INDEX idx_hospital_users_active ON hospital_users(is_active) WHERE deleted_at IS NULL;

-- =============================================
-- PATIENT MANAGEMENT
-- =============================================

-- Patients
CREATE TABLE patients (
  id SERIAL PRIMARY KEY,
  hospital_id INT REFERENCES hospitals(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE SET NULL, -- Optional: linked user account
  
  -- Identification
  patient_number VARCHAR(50) NOT NULL, -- Hospital-specific ID (P0001, P0002, etc.)
  
  -- Personal Information (denormalized for walk-in patients without user accounts)
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  date_of_birth DATE NOT NULL,
  gender gender_type NOT NULL,
  blood_group blood_group_type,
  
  -- Contact Information
  contact_number VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  
  -- Emergency Contact
  emergency_contact_name VARCHAR(100),
  emergency_contact_number VARCHAR(20),
  emergency_contact_relationship VARCHAR(50), -- 'Spouse', 'Parent', 'Sibling', etc.
  
  -- Medical Information
  allergies TEXT[], -- Array of allergy strings
  chronic_conditions TEXT[], -- Array of condition strings
  medical_history TEXT, -- Free text medical history
  current_medications TEXT, -- Current medications patient is taking
  
  -- Insurance (Optional)
  insurance_provider VARCHAR(100),
  insurance_policy_number VARCHAR(100),
  insurance_group_number VARCHAR(100),
  
  -- Assignment
  primary_doctor_id INT REFERENCES hospital_users(id), -- Assigned primary doctor
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  registration_source VARCHAR(50) DEFAULT 'receptionist', -- 'receptionist', 'self', 'referral'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by INT REFERENCES hospital_users(id),
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(hospital_id, patient_number)
);

CREATE INDEX idx_patients_hospital ON patients(hospital_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_patients_user ON patients(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_patients_number ON patients(hospital_id, patient_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_patients_contact ON patients(contact_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_patients_doctor ON patients(primary_doctor_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_patients_dob ON patients(date_of_birth);
CREATE INDEX idx_patients_name ON patients(first_name, last_name);

-- =============================================
-- APPOINTMENTS
-- =============================================

-- Appointments
CREATE TABLE appointments (
  id SERIAL PRIMARY KEY,
  hospital_id INT REFERENCES hospitals(id) ON DELETE CASCADE,
  patient_id INT REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id INT REFERENCES hospital_users(id) ON DELETE SET NULL,
  
  -- Appointment Details
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration_minutes INT DEFAULT 30,
  
  appointment_type visit_type DEFAULT 'consultation',
  reason TEXT,
  notes TEXT,
  
  -- Status
  status appointment_status DEFAULT 'scheduled',
  
  -- Cancellation
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancelled_by INT REFERENCES hospital_users(id),
  cancellation_reason TEXT,
  
  -- Check-in
  checked_in_at TIMESTAMP WITH TIME ZONE,
  checked_in_by INT REFERENCES hospital_users(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by INT REFERENCES hospital_users(id)
);

CREATE INDEX idx_appointments_hospital ON appointments(hospital_id);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments(hospital_id, appointment_date);
CREATE INDEX idx_appointments_datetime ON appointments(appointment_date, appointment_time);
CREATE INDEX idx_appointments_status ON appointments(status);

-- =============================================
-- VISITS & CONSULTATIONS
-- =============================================

-- Visits
CREATE TABLE visits (
  id SERIAL PRIMARY KEY,
  hospital_id INT REFERENCES hospitals(id) ON DELETE CASCADE,
  patient_id INT REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id INT REFERENCES hospital_users(id),
  appointment_id INT REFERENCES appointments(id), -- Optional: linked to appointment
  
  -- Visit Identification
  visit_number VARCHAR(50) NOT NULL, -- Hospital-specific ID (V0001, V0002, etc.)
  visit_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  visit_type visit_type DEFAULT 'consultation',
  
  -- Chief Complaint & Symptoms
  chief_complaint TEXT NOT NULL,
  symptoms TEXT[], -- Array of symptom strings
  symptom_duration VARCHAR(100), -- 'Since 3 days', 'Since morning', etc.
  
  -- Vital Signs
  vital_signs JSONB DEFAULT '{}', -- {temperature, bloodPressure, heartRate, respiratoryRate, oxygenSaturation, weight, height, bmi}
  
  -- Clinical Assessment
  physical_examination TEXT,
  diagnosis TEXT,
  differential_diagnosis TEXT[], -- Array of possible diagnoses
  
  -- Treatment
  treatment_plan TEXT,
  clinical_notes TEXT,
  doctor_notes TEXT, -- Private notes for doctor
  
  -- Follow-up
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_date DATE,
  follow_up_instructions TEXT,
  
  -- Status
  status appointment_status DEFAULT 'in_progress',
  
  -- Billing
  consultation_fee DECIMAL(10,2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by INT REFERENCES hospital_users(id),
  
  UNIQUE(hospital_id, visit_number)
);

CREATE INDEX idx_visits_hospital ON visits(hospital_id);
CREATE INDEX idx_visits_patient ON visits(patient_id);
CREATE INDEX idx_visits_doctor ON visits(doctor_id);
CREATE INDEX idx_visits_appointment ON visits(appointment_id);
CREATE INDEX idx_visits_date ON visits(hospital_id, visit_date);
CREATE INDEX idx_visits_number ON visits(hospital_id, visit_number);
CREATE INDEX idx_visits_status ON visits(status);

-- =============================================
-- PRESCRIPTIONS & PHARMACY
-- =============================================

-- Prescriptions
CREATE TABLE prescriptions (
  id SERIAL PRIMARY KEY,
  hospital_id INT REFERENCES hospitals(id) ON DELETE CASCADE,
  visit_id INT REFERENCES visits(id) ON DELETE CASCADE,
  patient_id INT REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id INT REFERENCES hospital_users(id),
  
  -- Prescription Details
  prescription_number VARCHAR(50) NOT NULL, -- Hospital-specific ID (RX0001, RX0002, etc.)
  prescribed_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Status
  status prescription_status DEFAULT 'pending',
  
  -- Fulfillment
  filled_at TIMESTAMP WITH TIME ZONE,
  filled_by INT REFERENCES hospital_users(id), -- Pharmacist
  pharmacist_notes TEXT,
  
  -- Instructions
  general_instructions TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by INT REFERENCES hospital_users(id),
  
  UNIQUE(hospital_id, prescription_number)
);

CREATE INDEX idx_prescriptions_hospital ON prescriptions(hospital_id);
CREATE INDEX idx_prescriptions_visit ON prescriptions(visit_id);
CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_doctor ON prescriptions(doctor_id);
CREATE INDEX idx_prescriptions_status ON prescriptions(hospital_id, status);
CREATE INDEX idx_prescriptions_date ON prescriptions(prescribed_date);

-- Prescription Items (Medications)
CREATE TABLE prescription_items (
  id SERIAL PRIMARY KEY,
  prescription_id INT REFERENCES prescriptions(id) ON DELETE CASCADE,
  
  -- Medication Details
  medication_name VARCHAR(255) NOT NULL,
  generic_name VARCHAR(255),
  dosage VARCHAR(100) NOT NULL, -- '500mg', '10ml', etc.
  form VARCHAR(50), -- 'Tablet', 'Syrup', 'Injection', 'Capsule', etc.
  
  -- Instructions
  frequency VARCHAR(100) NOT NULL, -- 'Twice daily', 'Every 8 hours', etc.
  duration VARCHAR(100) NOT NULL, -- '7 days', '2 weeks', '1 month', etc.
  quantity INT NOT NULL, -- Total quantity prescribed
  
  route VARCHAR(50), -- 'Oral', 'Topical', 'IV', etc.
  instructions TEXT, -- 'Take with food', 'Before bedtime', etc.
  
  -- Fulfillment
  quantity_fulfilled INT DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_prescription_items_prescription ON prescription_items(prescription_id);

-- Inventory (Pharmacy stock)
CREATE TABLE inventory (
  id SERIAL PRIMARY KEY,
  hospital_id INT REFERENCES hospitals(id) ON DELETE CASCADE,
  
  -- Medication Details
  medication_name VARCHAR(255) NOT NULL,
  generic_name VARCHAR(255),
  brand_name VARCHAR(255),
  category VARCHAR(100), -- 'Antibiotic', 'Analgesic', 'Antidiabetic', etc.
  form VARCHAR(50), -- 'Tablet', 'Syrup', 'Injection', etc.
  strength VARCHAR(50), -- '500mg', '250mg/5ml', etc.
  
  -- Supplier Information
  manufacturer VARCHAR(255),
  supplier VARCHAR(255),
  batch_number VARCHAR(100),
  
  -- Expiry
  manufacture_date DATE,
  expiry_date DATE,
  
  -- Stock Information
  current_stock INT DEFAULT 0,
  minimum_stock INT DEFAULT 10, -- Reorder threshold
  maximum_stock INT DEFAULT 1000,
  
  -- Pricing
  unit_cost DECIMAL(10,2), -- Cost per unit
  selling_price DECIMAL(10,2), -- Selling price per unit
  
  -- Storage
  storage_location VARCHAR(100), -- 'Shelf A-3', 'Refrigerator 2', etc.
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  requires_prescription BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  description TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by INT REFERENCES hospital_users(id),
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(hospital_id, medication_name, batch_number)
);

CREATE INDEX idx_inventory_hospital ON inventory(hospital_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_inventory_name ON inventory(medication_name) WHERE deleted_at IS NULL;
CREATE INDEX idx_inventory_category ON inventory(hospital_id, category) WHERE deleted_at IS NULL;
CREATE INDEX idx_inventory_expiry ON inventory(expiry_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_inventory_stock ON inventory(hospital_id, current_stock) WHERE deleted_at IS NULL;
CREATE INDEX idx_inventory_low_stock ON inventory(hospital_id) WHERE current_stock <= minimum_stock AND deleted_at IS NULL;

-- Stock Movements (Track inventory changes)
CREATE TABLE stock_movements (
  id SERIAL PRIMARY KEY,
  hospital_id INT REFERENCES hospitals(id) ON DELETE CASCADE,
  inventory_id INT REFERENCES inventory(id) ON DELETE CASCADE,
  
  -- Movement Details
  movement_type VARCHAR(50) NOT NULL, -- 'purchase', 'sale', 'adjustment', 'expired', 'damaged'
  quantity INT NOT NULL, -- Positive for addition, negative for deduction
  
  -- Reference
  reference_type VARCHAR(50), -- 'prescription', 'purchase_order', 'manual'
  reference_id INT, -- ID of the reference (prescription_id, etc.)
  
  -- Details
  reason TEXT,
  notes TEXT,
  
  -- Stock After Movement
  stock_before INT NOT NULL,
  stock_after INT NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by INT REFERENCES hospital_users(id)
);

CREATE INDEX idx_stock_movements_hospital ON stock_movements(hospital_id);
CREATE INDEX idx_stock_movements_inventory ON stock_movements(inventory_id);
CREATE INDEX idx_stock_movements_type ON stock_movements(movement_type);
CREATE INDEX idx_stock_movements_date ON stock_movements(created_at);

-- =============================================
-- MEDICAL TESTS & LAB
-- =============================================

-- Medical Tests
CREATE TABLE medical_tests (
  id SERIAL PRIMARY KEY,
  hospital_id INT REFERENCES hospitals(id) ON DELETE CASCADE,
  visit_id INT REFERENCES visits(id) ON DELETE CASCADE,
  patient_id INT REFERENCES patients(id) ON DELETE CASCADE,
  ordered_by INT REFERENCES hospital_users(id), -- Doctor who ordered
  
  -- Test Details
  test_type VARCHAR(100) NOT NULL, -- 'Blood Test', 'Urine Test', 'X-Ray', 'MRI', etc.
  test_name VARCHAR(255) NOT NULL, -- 'Complete Blood Count', 'Lipid Profile', etc.
  test_code VARCHAR(50), -- Internal code
  
  -- Scheduling
  ordered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scheduled_date DATE,
  scheduled_time TIME,
  
  -- Execution
  performed_at TIMESTAMP WITH TIME ZONE,
  performed_by INT REFERENCES hospital_users(id), -- Lab technician
  
  -- Results
  result_values JSONB, -- Structured test results
  result_text TEXT, -- Free-form result description
  reference_ranges JSONB, -- Normal ranges for comparison
  
  -- Attachments
  report_url TEXT, -- URL to PDF report
  images_urls TEXT[], -- Array of image URLs
  
  -- Interpretation
  interpretation TEXT,
  abnormal_flags TEXT[], -- Array of abnormal findings
  
  -- Status
  status test_status DEFAULT 'ordered',
  
  -- Priority
  is_urgent BOOLEAN DEFAULT FALSE,
  
  -- Pricing
  test_cost DECIMAL(10,2),
  
  -- Notes
  technician_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by INT REFERENCES hospital_users(id)
);

CREATE INDEX idx_medical_tests_hospital ON medical_tests(hospital_id);
CREATE INDEX idx_medical_tests_visit ON medical_tests(visit_id);
CREATE INDEX idx_medical_tests_patient ON medical_tests(patient_id);
CREATE INDEX idx_medical_tests_ordered_by ON medical_tests(ordered_by);
CREATE INDEX idx_medical_tests_status ON medical_tests(hospital_id, status);
CREATE INDEX idx_medical_tests_date ON medical_tests(scheduled_date);
CREATE INDEX idx_medical_tests_urgent ON medical_tests(is_urgent) WHERE status != 'completed';

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to calculate age from date of birth
CREATE OR REPLACE FUNCTION calculate_age(dob DATE)
RETURNS INT AS $$
BEGIN
  RETURN EXTRACT(YEAR FROM AGE(NOW(), dob))::INT;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to generate next patient number
CREATE OR REPLACE FUNCTION generate_patient_number(hospital_id_param INT)
RETURNS VARCHAR AS $$
DECLARE
  last_number INT;
  new_number VARCHAR;
BEGIN
  SELECT COALESCE(
    MAX(CAST(SUBSTRING(patient_number FROM 2) AS INT)),
    0
  ) INTO last_number
  FROM patients
  WHERE hospital_id = hospital_id_param
    AND patient_number ~ '^P[0-9]+$';
  
  new_number := 'P' || LPAD((last_number + 1)::TEXT, 4, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate next visit number
CREATE OR REPLACE FUNCTION generate_visit_number(hospital_id_param INT)
RETURNS VARCHAR AS $$
DECLARE
  last_number INT;
  new_number VARCHAR;
BEGIN
  SELECT COALESCE(
    MAX(CAST(SUBSTRING(visit_number FROM 2) AS INT)),
    0
  ) INTO last_number
  FROM visits
  WHERE hospital_id = hospital_id_param
    AND visit_number ~ '^V[0-9]+$';
  
  new_number := 'V' || LPAD((last_number + 1)::TEXT, 4, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate next prescription number
CREATE OR REPLACE FUNCTION generate_prescription_number(hospital_id_param INT)
RETURNS VARCHAR AS $$
DECLARE
  last_number INT;
  new_number VARCHAR;
BEGIN
  SELECT COALESCE(
    MAX(CAST(SUBSTRING(prescription_number FROM 3) AS INT)),
    0
  ) INTO last_number
  FROM prescriptions
  WHERE hospital_id = hospital_id_param
    AND prescription_number ~ '^RX[0-9]+$';
  
  new_number := 'RX' || LPAD((last_number + 1)::TEXT, 4, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_hospitals_updated_at BEFORE UPDATE ON hospitals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hospital_users_updated_at BEFORE UPDATE ON hospital_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visits_updated_at BEFORE UPDATE ON visits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON prescriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_tests_updated_at BEFORE UPDATE ON medical_tests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- VIEWS FOR COMMON QUERIES
-- =============================================

-- View: Patient Summary with Age
CREATE OR REPLACE VIEW patient_summary AS
SELECT 
  p.*,
  calculate_age(p.date_of_birth) as age,
  u.email as patient_email,
  u.phone as patient_phone,
  d.id as doctor_id,
  du.first_name || ' ' || du.last_name as doctor_name,
  h.name as hospital_name
FROM patients p
LEFT JOIN users u ON p.user_id = u.id
LEFT JOIN hospital_users d ON p.primary_doctor_id = d.id
LEFT JOIN users du ON d.user_id = du.id
LEFT JOIN hospitals h ON p.hospital_id = h.id
WHERE p.deleted_at IS NULL;

-- View: Low Stock Items
CREATE OR REPLACE VIEW low_stock_items AS
SELECT 
  i.*,
  h.name as hospital_name,
  (i.minimum_stock - i.current_stock) as reorder_quantity
FROM inventory i
LEFT JOIN hospitals h ON i.hospital_id = h.id
WHERE i.current_stock <= i.minimum_stock
  AND i.deleted_at IS NULL
  AND i.is_active = TRUE
ORDER BY i.current_stock ASC;

-- View: Expiring Medications (within 30 days)
CREATE OR REPLACE VIEW expiring_medications AS
SELECT 
  i.*,
  h.name as hospital_name,
  (i.expiry_date - CURRENT_DATE) as days_until_expiry
FROM inventory i
LEFT JOIN hospitals h ON i.hospital_id = h.id
WHERE i.expiry_date <= CURRENT_DATE + INTERVAL '30 days'
  AND i.expiry_date > CURRENT_DATE
  AND i.deleted_at IS NULL
  AND i.is_active = TRUE
ORDER BY i.expiry_date ASC;

-- =============================================
-- SAMPLE DATA (Optional - for testing)
-- =============================================

-- Insert a sample hospital
INSERT INTO hospitals (name, code, address, contact_email, contact_phone, departments)
VALUES (
  'City General Hospital',
  'CGH',
  '123 Healthcare Ave, Medical District, New York, NY 10001',
  'info@citygeneralhospital.com',
  '+1-555-0100',
  ARRAY['Emergency', 'Cardiology', 'Pediatrics', 'Orthopedics', 'Pharmacy', 'Laboratory', 'Radiology']
);

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE hospitals IS 'Hospital/Clinic information with multi-tenant support';
COMMENT ON TABLE users IS 'User authentication and basic profile information';
COMMENT ON TABLE hospital_users IS 'Maps users to hospitals with roles and permissions';
COMMENT ON TABLE patients IS 'Patient records with medical history and contact info';
COMMENT ON TABLE appointments IS 'Patient appointments with doctors';
COMMENT ON TABLE visits IS 'Doctor-patient consultations and visit records';
COMMENT ON TABLE prescriptions IS 'Prescriptions issued by doctors';
COMMENT ON TABLE prescription_items IS 'Individual medications in a prescription';
COMMENT ON TABLE inventory IS 'Pharmacy inventory and stock management';
COMMENT ON TABLE stock_movements IS 'Track all inventory stock changes';
COMMENT ON TABLE medical_tests IS 'Lab tests and medical imaging orders and results';

COMMENT ON FUNCTION calculate_age(DATE) IS 'Calculate age in years from date of birth';
COMMENT ON FUNCTION generate_patient_number(INT) IS 'Generate sequential patient number (P0001, P0002, ...)';
COMMENT ON FUNCTION generate_visit_number(INT) IS 'Generate sequential visit number (V0001, V0002, ...)';
COMMENT ON FUNCTION generate_prescription_number(INT) IS 'Generate sequential prescription number (RX0001, RX0002, ...)';

-- =============================================
-- END OF SCHEMA
-- =============================================
