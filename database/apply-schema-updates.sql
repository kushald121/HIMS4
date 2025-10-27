-- =============================================
-- HIMS Schema Update Script
-- Apply this script to update existing database to match database/schema.sql
-- Created: October 27, 2025
-- =============================================

-- IMPORTANT: Backup your database before running this script!

BEGIN;

-- =============================================
-- 1. ADD MISSING COLUMNS TO PATIENTS TABLE
-- =============================================

-- Add denormalized patient name fields for walk-in patients
ALTER TABLE patients 
  ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);

-- Add detailed address fields
ALTER TABLE patients 
  ADD COLUMN IF NOT EXISTS email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS state VARCHAR(100),
  ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);

-- Add emergency contact relationship
ALTER TABLE patients 
  ADD COLUMN IF NOT EXISTS emergency_contact_relationship VARCHAR(50);

-- Add medical information fields
ALTER TABLE patients 
  ADD COLUMN IF NOT EXISTS chronic_conditions TEXT[],
  ADD COLUMN IF NOT EXISTS current_medications TEXT;

-- Add insurance fields
ALTER TABLE patients 
  ADD COLUMN IF NOT EXISTS insurance_provider VARCHAR(100),
  ADD COLUMN IF NOT EXISTS insurance_policy_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS insurance_group_number VARCHAR(100);

-- Add registration source
ALTER TABLE patients 
  ADD COLUMN IF NOT EXISTS registration_source VARCHAR(50) DEFAULT 'receptionist';

-- Convert allergies to array if it's text
-- Only run if allergies is currently TEXT type
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'patients' 
    AND column_name = 'allergies' 
    AND data_type = 'text'
  ) THEN
    -- Backup existing data
    ALTER TABLE patients RENAME COLUMN allergies TO allergies_old;
    ALTER TABLE patients ADD COLUMN allergies TEXT[];
    
    -- Convert comma-separated to array
    UPDATE patients 
    SET allergies = string_to_array(allergies_old, ',')
    WHERE allergies_old IS NOT NULL;
    
    -- Drop old column
    ALTER TABLE patients DROP COLUMN allergies_old;
  END IF;
END $$;

-- =============================================
-- 2. ADD MISSING COLUMNS TO INVENTORY TABLE
-- =============================================

-- Rename stock_quantity to current_stock if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'inventory' 
    AND column_name = 'stock_quantity'
  ) THEN
    ALTER TABLE inventory RENAME COLUMN stock_quantity TO current_stock;
  END IF;
END $$;

-- Add medication detail fields
ALTER TABLE inventory 
  ADD COLUMN IF NOT EXISTS brand_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS form VARCHAR(50),
  ADD COLUMN IF NOT EXISTS strength VARCHAR(50);

-- Add supplier information
ALTER TABLE inventory 
  ADD COLUMN IF NOT EXISTS supplier VARCHAR(255),
  ADD COLUMN IF NOT EXISTS manufacture_date DATE;

-- Add stock level controls
ALTER TABLE inventory 
  ADD COLUMN IF NOT EXISTS current_stock INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS minimum_stock INT DEFAULT 10,
  ADD COLUMN IF NOT EXISTS maximum_stock INT DEFAULT 1000;

-- Rename reorder_threshold to minimum_stock if exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'inventory' 
    AND column_name = 'reorder_threshold'
  ) THEN
    -- Copy data to minimum_stock
    UPDATE inventory SET minimum_stock = reorder_threshold WHERE reorder_threshold IS NOT NULL;
    ALTER TABLE inventory DROP COLUMN reorder_threshold;
  END IF;
END $$;

-- Rename unit_price to unit_cost if exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'inventory' 
    AND column_name = 'unit_price'
  ) THEN
    ALTER TABLE inventory RENAME COLUMN unit_price TO unit_cost;
  END IF;
END $$;

-- Add pricing fields
ALTER TABLE inventory 
  ADD COLUMN IF NOT EXISTS unit_cost DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS selling_price DECIMAL(10,2);

-- Add prescription requirement flag
ALTER TABLE inventory 
  ADD COLUMN IF NOT EXISTS requires_prescription BOOLEAN DEFAULT TRUE;

-- =============================================
-- 3. UPDATE STOCK_MOVEMENTS TABLE
-- =============================================

-- Add stock tracking fields
ALTER TABLE stock_movements 
  ADD COLUMN IF NOT EXISTS stock_before INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stock_after INT NOT NULL DEFAULT 0;

-- Add reference fields
ALTER TABLE stock_movements 
  ADD COLUMN IF NOT EXISTS reference_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS reference_id INT;

-- Rename performed_by to created_by if exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock_movements' 
    AND column_name = 'performed_by'
  ) THEN
    ALTER TABLE stock_movements RENAME COLUMN performed_by TO created_by;
  END IF;
END $$;

-- =============================================
-- 4. CREATE HELPER FUNCTIONS
-- =============================================

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

-- Function to calculate age from date of birth
CREATE OR REPLACE FUNCTION calculate_age(dob DATE)
RETURNS INT AS $$
BEGIN
  RETURN EXTRACT(YEAR FROM AGE(NOW(), dob))::INT;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================
-- 5. CREATE VIEWS
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

-- View: Active Prescriptions
CREATE OR REPLACE VIEW active_prescriptions AS
SELECT 
  pr.*,
  p.patient_number,
  p.first_name || ' ' || p.last_name as patient_name,
  d.first_name || ' ' || d.last_name as doctor_name,
  COUNT(pri.id) as item_count
FROM prescriptions pr
LEFT JOIN patients p ON pr.patient_id = p.id
LEFT JOIN hospital_users hu ON pr.doctor_id = hu.id
LEFT JOIN users d ON hu.user_id = d.id
LEFT JOIN prescription_items pri ON pr.id = pri.prescription_id
WHERE pr.status IN ('pending', 'partially_filled')
GROUP BY pr.id, p.patient_number, p.first_name, p.last_name, d.first_name, d.last_name;

-- =============================================
-- 6. ADD INDEXES FOR PERFORMANCE
-- =============================================

-- Patient indexes
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_patients_city_state ON patients(city, state) WHERE deleted_at IS NULL;

-- Inventory indexes
CREATE INDEX IF NOT EXISTS idx_inventory_brand ON inventory(brand_name) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_inventory_form ON inventory(form) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_inventory_expiry ON inventory(expiry_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock ON inventory(hospital_id) 
  WHERE current_stock <= minimum_stock AND deleted_at IS NULL;

-- =============================================
-- 7. ADD COMMENTS
-- =============================================

COMMENT ON FUNCTION generate_patient_number(INT) IS 'Generate sequential patient number (P0001, P0002, ...)';
COMMENT ON FUNCTION generate_visit_number(INT) IS 'Generate sequential visit number (V0001, V0002, ...)';
COMMENT ON FUNCTION generate_prescription_number(INT) IS 'Generate sequential prescription number (RX0001, RX0002, ...)';
COMMENT ON FUNCTION calculate_age(DATE) IS 'Calculate age in years from date of birth';

COMMENT ON VIEW patient_summary IS 'Patient records with calculated age and related information';
COMMENT ON VIEW low_stock_items IS 'Inventory items that need reordering';
COMMENT ON VIEW expiring_medications IS 'Medications expiring within 30 days';
COMMENT ON VIEW active_prescriptions IS 'Pending and partially filled prescriptions';

-- =============================================
-- 8. VERIFY CHANGES
-- =============================================

-- Check if all functions were created
SELECT 
  'Functions Created' as status,
  COUNT(*) as count 
FROM pg_proc 
WHERE proname IN (
  'generate_patient_number', 
  'generate_visit_number', 
  'generate_prescription_number',
  'calculate_age'
);

-- Check if all views were created
SELECT 
  'Views Created' as status,
  COUNT(*) as count 
FROM pg_views 
WHERE viewname IN (
  'patient_summary',
  'low_stock_items',
  'expiring_medications',
  'active_prescriptions'
);

-- =============================================
-- COMMIT CHANGES
-- =============================================

COMMIT;

-- =============================================
-- POST-DEPLOYMENT NOTES
-- =============================================

-- After running this script:
-- 1. Test patient registration with new fields
-- 2. Test inventory management with new fields
-- 3. Verify low stock and expiring medication views
-- 4. Update application code to use helper functions for number generation
-- 5. Run comprehensive end-to-end tests

-- To use helper functions in your application:
-- SELECT generate_patient_number(1); -- Replace 1 with actual hospital_id
-- SELECT generate_visit_number(1);
-- SELECT generate_prescription_number(1);

-- To query views:
-- SELECT * FROM patient_summary WHERE hospital_id = 1;
-- SELECT * FROM low_stock_items WHERE hospital_id = 1;
-- SELECT * FROM expiring_medications WHERE hospital_id = 1;
-- SELECT * FROM active_prescriptions WHERE hospital_id = 1;
