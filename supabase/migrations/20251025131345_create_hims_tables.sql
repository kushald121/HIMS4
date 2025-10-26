/*
  # Hospital Information Management System (HIMS) Database Schema

  ## Overview
  Complete database schema for a multi-tenant hospital management system.
  
  ## Tables Created
  - hospitals, users, user_sessions, hospital_users
  - patients, visits, medical_tests
  - prescriptions, inventory, prescription_fulfillment
  - appointments, bills
*/

-- ENUM declarations
DO $$ BEGIN
  CREATE TYPE role_enum AS ENUM ('admin', 'doctor', 'pharmacist', 'receptionist', 'patient');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE status_enum AS ENUM ('pending', 'filled', 'partially_filled', 'cancelled', 'out_of_stock', 'active', 'completed', 'scheduled', 'confirmed', 'no_show');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE gender_enum AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE visit_type_enum AS ENUM ('consultation', 'follow_up', 'emergency', 'routine_checkup');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Hospitals
CREATE TABLE IF NOT EXISTS hospitals (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  logo_url TEXT,
  address TEXT,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_hospitals_deleted ON hospitals(deleted_at);
CREATE INDEX IF NOT EXISTS idx_hospitals_settings_gin ON hospitals USING gin (settings);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  oauth_provider VARCHAR(50) NULL,
  oauth_provider_id VARCHAR(255) NULL,
  phone VARCHAR(20),
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'users_oauth_provider_check'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_oauth_provider_check 
    CHECK (oauth_provider IS NULL OR oauth_provider IN ('google', 'meta'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_oauth ON users(oauth_provider, oauth_provider_id);

-- User Sessions
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL,
  device_info JSONB,
  ip_address INET,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_device_gin ON user_sessions USING gin (device_info);

-- Hospital-User Mapping
CREATE TABLE IF NOT EXISTS hospital_users (
  id SERIAL PRIMARY KEY,
  hospital_id INT REFERENCES hospitals(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  role role_enum NOT NULL,
  employee_id VARCHAR(100),
  department VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by INT REFERENCES hospital_users(id),
  deleted_at TIMESTAMP WITH TIME ZONE
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'hospital_users_hospital_id_user_id_key'
  ) THEN
    ALTER TABLE hospital_users ADD CONSTRAINT hospital_users_hospital_id_user_id_key UNIQUE(hospital_id, user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_hospital_users_hospital ON hospital_users(hospital_id);
CREATE INDEX IF NOT EXISTS idx_hospital_users_role ON hospital_users(hospital_id, role);

-- Patients
CREATE TABLE IF NOT EXISTS patients (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) NULL,
  hospital_id INT REFERENCES hospitals(id) ON DELETE CASCADE,
  patient_number VARCHAR(50) NOT NULL,
  date_of_birth DATE,
  gender gender_enum,
  contact_number VARCHAR(20),
  emergency_contact_name VARCHAR(100),
  emergency_contact_number VARCHAR(20),
  address TEXT,
  blood_group VARCHAR(5),
  allergies TEXT,
  medical_history TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by INT REFERENCES hospital_users(id),
  deleted_at TIMESTAMP WITH TIME ZONE
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'patients_hospital_id_patient_number_key'
  ) THEN
    ALTER TABLE patients ADD CONSTRAINT patients_hospital_id_patient_number_key UNIQUE(hospital_id, patient_number);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'patients_hospital_id_user_id_key'
  ) THEN
    ALTER TABLE patients ADD CONSTRAINT patients_hospital_id_user_id_key UNIQUE(hospital_id, user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_patients_hospital ON patients(hospital_id);
CREATE INDEX IF NOT EXISTS idx_patients_user ON patients(user_id);

-- Visits
CREATE TABLE IF NOT EXISTS visits (
  id SERIAL PRIMARY KEY,
  patient_id INT REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id INT REFERENCES hospital_users(id),
  hospital_id INT REFERENCES hospitals(id) ON DELETE CASCADE,
  visit_number VARCHAR(50) NOT NULL,
  visit_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  visit_type visit_type_enum DEFAULT 'consultation',
  chief_complaint TEXT,
  symptoms TEXT,
  diagnosis TEXT,
  treatment_plan TEXT,
  notes TEXT,
  status status_enum DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by INT REFERENCES hospital_users(id)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'visits_hospital_id_visit_number_key'
  ) THEN
    ALTER TABLE visits ADD CONSTRAINT visits_hospital_id_visit_number_key UNIQUE(hospital_id, visit_number);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_visits_patient ON visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_visits_doctor ON visits(doctor_id);
CREATE INDEX IF NOT EXISTS idx_visits_hospital_date ON visits(hospital_id, visit_date);

-- Medical Tests
CREATE TABLE IF NOT EXISTS medical_tests (
  id SERIAL PRIMARY KEY,
  visit_id INT REFERENCES visits(id) ON DELETE CASCADE,
  test_type VARCHAR(100) NOT NULL,
  test_name VARCHAR(255) NOT NULL,
  test_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  result_details TEXT,
  result_values JSONB,
  reference_ranges JSONB,
  image_url TEXT,
  lab_technician_id INT REFERENCES hospital_users(id),
  status status_enum DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by INT REFERENCES hospital_users(id)
);

CREATE INDEX IF NOT EXISTS idx_tests_visit ON medical_tests(visit_id);
CREATE INDEX IF NOT EXISTS idx_tests_status ON medical_tests(status, test_date);
CREATE INDEX IF NOT EXISTS idx_tests_results_gin ON medical_tests USING gin (result_values);

-- Prescriptions
CREATE TABLE IF NOT EXISTS prescriptions (
  id SERIAL PRIMARY KEY,
  visit_id INT REFERENCES visits(id) ON DELETE CASCADE,
  prescribed_by INT REFERENCES hospital_users(id),
  medication_name VARCHAR(255) NOT NULL,
  generic_name VARCHAR(255),
  dosage VARCHAR(100) NOT NULL,
  frequency VARCHAR(100) NOT NULL,
  duration VARCHAR(100) NOT NULL,
  quantity_prescribed INT,
  instructions TEXT,
  status status_enum DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by INT REFERENCES hospital_users(id)
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_visit ON prescriptions(visit_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);

-- Inventory
CREATE TABLE IF NOT EXISTS inventory (
  id SERIAL PRIMARY KEY,
  hospital_id INT REFERENCES hospitals(id) ON DELETE CASCADE,
  medication_name VARCHAR(255) NOT NULL,
  generic_name VARCHAR(255),
  category VARCHAR(100),
  manufacturer VARCHAR(255),
  batch_number VARCHAR(100),
  expiry_date DATE,
  stock_quantity INT DEFAULT 0,
  reorder_threshold INT DEFAULT 10,
  unit_price DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by INT REFERENCES hospital_users(id),
  deleted_at TIMESTAMP WITH TIME ZONE
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'inventory_stock_quantity_check'
  ) THEN
    ALTER TABLE inventory ADD CONSTRAINT inventory_stock_quantity_check CHECK (stock_quantity >= 0);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'inventory_reorder_threshold_check'
  ) THEN
    ALTER TABLE inventory ADD CONSTRAINT inventory_reorder_threshold_check CHECK (reorder_threshold >= 0);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'inventory_hospital_id_medication_name_batch_number_key'
  ) THEN
    ALTER TABLE inventory ADD CONSTRAINT inventory_hospital_id_medication_name_batch_number_key UNIQUE(hospital_id, medication_name, batch_number);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_inventory_hospital ON inventory(hospital_id);
CREATE INDEX IF NOT EXISTS idx_inventory_expiry ON inventory(expiry_date);

-- Prescription Fulfillment
CREATE TABLE IF NOT EXISTS prescription_fulfillment (
  id SERIAL PRIMARY KEY,
  prescription_id INT REFERENCES prescriptions(id) ON DELETE CASCADE,
  inventory_id INT REFERENCES inventory(id),
  pharmacist_id INT REFERENCES hospital_users(id),
  quantity_fulfilled INT NOT NULL,
  fulfilled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status status_enum DEFAULT 'filled',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by INT REFERENCES hospital_users(id)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'prescription_fulfillment_quantity_fulfilled_check'
  ) THEN
    ALTER TABLE prescription_fulfillment ADD CONSTRAINT prescription_fulfillment_quantity_fulfilled_check CHECK (quantity_fulfilled > 0);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_fulfillment_prescription ON prescription_fulfillment(prescription_id);
CREATE INDEX IF NOT EXISTS idx_fulfillment_pharmacist ON prescription_fulfillment(pharmacist_id);

-- Appointments
CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  patient_id INT REFERENCES patients(id),
  doctor_id INT REFERENCES hospital_users(id),
  hospital_id INT REFERENCES hospitals(id) ON DELETE CASCADE,
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INT DEFAULT 30,
  reason TEXT,
  status status_enum DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by INT REFERENCES hospital_users(id)
);

-- Bills
CREATE TABLE IF NOT EXISTS bills (
  id SERIAL PRIMARY KEY,
  visit_id INT REFERENCES visits(id),
  hospital_id INT REFERENCES hospitals(id) ON DELETE CASCADE,
  bill_number VARCHAR(50) NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  paid_amount DECIMAL(12,2) DEFAULT 0,
  status status_enum DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'bills_total_amount_check'
  ) THEN
    ALTER TABLE bills ADD CONSTRAINT bills_total_amount_check CHECK (total_amount >= 0);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'bills_paid_amount_check'
  ) THEN
    ALTER TABLE bills ADD CONSTRAINT bills_paid_amount_check CHECK (paid_amount >= 0);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'bills_hospital_id_bill_number_key'
  ) THEN
    ALTER TABLE bills ADD CONSTRAINT bills_hospital_id_bill_number_key UNIQUE(hospital_id, bill_number);
  END IF;
END $$;