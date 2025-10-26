// =============================================
// ENUMS (matching database schema)
// =============================================

export type UserRole = 'admin' | 'doctor' | 'pharmacist' | 'receptionist' | 'patient';
export type GenderType = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export type BloodGroupType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
export type VisitType = 'consultation' | 'follow_up' | 'emergency' | 'routine_checkup';
export type PrescriptionStatus = 'pending' | 'filled' | 'partially_filled' | 'out_of_stock' | 'cancelled';
export type TestStatus = 'ordered' | 'in_progress' | 'completed' | 'cancelled';

// Legacy type aliases for backward compatibility
export type RoleEnum = UserRole;
export type GenderEnum = GenderType;
export type VisitTypeEnum = VisitType;
export type StatusEnum = AppointmentStatus | PrescriptionStatus | TestStatus;

// =============================================
// CORE INTERFACES
// =============================================

export interface Hospital {
  id: number;
  name: string;
  code: string;
  logo_url?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  contact_email?: string;
  contact_phone?: string;
  website?: string;
  settings?: {
    workingHours?: { start: string; end: string };
    appointmentDuration?: number;
    allowPatientSelfRegistration?: boolean;
    requireDoctorApproval?: boolean;
    enablePharmacy?: boolean;
    enableLab?: boolean;
    currency?: string;
    timezone?: string;
  };
  departments?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface User {
  id: number;
  email: string;
  password_hash?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: GenderType;
  profile_picture_url?: string;
  oauth_provider?: string;
  oauth_provider_id?: string;
  email_verified: boolean;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface UserSession {
  id: number;
  user_id: number;
  token_hash: string;
  device_info?: Record<string, any>;
  ip_address?: string;
  expires_at: string;
  created_at: string;
  last_used_at: string;
}

export interface HospitalUser {
  id: number;
  hospital_id: number;
  user_id: number;
  role: UserRole;
  employee_id?: string;
  department?: string;
  specialization?: string;
  license_number?: string;
  permissions?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: number;
  deleted_at?: string;
  
  // Populated fields
  users?: User;
  hospitals?: Hospital;
}

export interface Patient {
  id?: number;
  hospital_id: number;
  user_id?: number;
  patient_number: string;
  
  // Personal Information
  first_name?: string;
  last_name?: string;
  date_of_birth: string;
  age?: number | null;
  gender: GenderType;
  blood_group?: BloodGroupType;
  
  // Contact Information
  contact_number: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  
  // Emergency Contact
  emergency_contact_name?: string;
  emergency_contact_number?: string;
  emergency_contact_relationship?: string;
  
  // Medical Information
  allergies?: string[] | string;
  chronic_conditions?: string[] | string;
  medical_history?: string;
  current_medications?: string;
  
  // Insurance
  insurance_provider?: string;
  insurance_policy_number?: string;
  insurance_group_number?: string;
  
  // Assignment
  primary_doctor_id?: number;
  
  // Status
  is_active: boolean;
  registration_source?: string;
  
  created_at: string;
  updated_at: string;
  created_by?: number;
  deleted_at?: string;
  
  // Populated fields
  users?: User | null;
  hospital_users?: HospitalUser;
  primary_doctor?: HospitalUser;
}

export interface Visit {
  id?: number;
  hospital_id: number;
  patient_id: number;
  doctor_id?: number;
  appointment_id?: number;
  
  // Visit Identification
  visit_number: string;
  visit_date: string; // TIMESTAMP
  visit_type: VisitType;
  
  // Chief Complaint & Symptoms
  chief_complaint: string;
  symptoms?: string[];
  symptom_duration?: string;
  
  // Vital Signs
  vital_signs?: {
    temperature?: number;
    bloodPressure?: string;
    blood_pressure?: string; // alias
    heartRate?: number;
    pulse?: number; // alias
    respiratoryRate?: number;
    respiratory_rate?: number; // alias
    oxygenSaturation?: number;
    oxygen_saturation?: number; // alias
    weight?: number;
    height?: number;
    bmi?: number;
  };
  
  // Clinical Assessment
  physical_examination?: string;
  diagnosis?: string;
  differential_diagnosis?: string[];
  
  // Treatment
  treatment_plan?: string;
  clinical_notes?: string;
  doctor_notes?: string;
  notes?: string; // general notes
  
  // Follow-up
  follow_up_required: boolean;
  follow_up_date?: string;
  follow_up_instructions?: string;
  
  // Status
  status: AppointmentStatus;
  
  // Billing
  consultation_fee?: number;
  
  created_at: string;
  updated_at: string;
  created_by?: number;
  
  // Populated fields
  patients?: Patient;
  hospital_users?: HospitalUser;
  appointments?: Appointment;
  prescriptions?: Prescription[];
}

export interface MedicalTest {
  id: number;
  hospital_id: number;
  visit_id: number;
  patient_id: number;
  ordered_by?: number;
  
  // Test Details
  test_type: string;
  test_name: string;
  test_code?: string;
  
  // Scheduling
  ordered_at: string;
  scheduled_date?: string;
  scheduled_time?: string;
  
  // Execution
  performed_at?: string;
  performed_by?: number;
  
  // Results
  result_values?: Record<string, any>;
  result_text?: string;
  reference_ranges?: Record<string, any>;
  
  // Attachments
  report_url?: string;
  images_urls?: string[];
  
  // Interpretation
  interpretation?: string;
  abnormal_flags?: string[];
  
  // Status
  status: TestStatus;
  
  // Priority
  is_urgent: boolean;
  
  // Pricing
  test_cost?: number;
  
  // Notes
  technician_notes?: string;
  
  created_at: string;
  updated_at: string;
  created_by?: number;
  
  // Populated fields
  patients?: Patient;
  visits?: Visit;
  ordered_by_user?: HospitalUser;
  performed_by_user?: HospitalUser;
}

export interface Prescription {
  id?: number;
  hospital_id: number;
  visit_id: number;
  patient_id: number;
  doctor_id?: number;
  
  // Prescription Details
  prescription_number: string;
  prescribed_date: string; // TIMESTAMP
  
  // Status
  status: PrescriptionStatus;
  
  // Fulfillment
  filled_at?: string;
  filled_by?: number;
  pharmacist_notes?: string;
  notes?: string; // General notes
  
  // Instructions
  general_instructions?: string;
  
  created_at: string;
  updated_at: string;
  created_by?: number;
  
  // Populated fields
  patients?: Patient;
  patient?: Patient; // alias for compatibility
  visits?: Visit;
  hospital_users?: HospitalUser;
  prescription_items?: PrescriptionItem[];
}

export interface PrescriptionItem {
  id: number;
  prescription_id: number;
  
  // Medication Details
  medication_name: string;
  generic_name?: string;
  dosage: string;
  form?: string; // 'Tablet', 'Syrup', etc.
  
  // Instructions
  frequency: string;
  duration: string;
  quantity: number;
  
  route?: string; // 'Oral', 'Topical', etc.
  instructions?: string;
  
  // Fulfillment
  quantity_fulfilled: number;
  
  created_at: string;
}

export interface Inventory {
  id?: number;
  hospital_id: number;
  
  // Medication Details
  medication_name: string;
  generic_name?: string;
  brand_name?: string;
  category?: string;
  form?: string;
  strength?: string;
  
  // Supplier Information
  manufacturer?: string;
  supplier?: string;
  batch_number?: string;
  
  // Expiry
  manufacture_date?: string;
  expiry_date?: string;
  
  // Stock Information
  current_stock: number;
  quantity_in_stock?: number; // alias for current_stock
  minimum_stock: number;
  reorder_level?: number; // alias for minimum_stock
  maximum_stock: number;
  
  // Pricing
  unit_cost?: number;
  selling_price?: number;
  
  // Storage
  storage_location?: string;
  
  // Status
  is_active: boolean;
  requires_prescription: boolean;
  
  // Metadata
  description?: string;
  
  created_at: string;
  updated_at: string;
  created_by?: number;
  deleted_at?: string;
}

export interface StockMovement {
  id: number;
  hospital_id: number;
  inventory_id: number;
  
  // Movement Details
  movement_type: 'purchase' | 'sale' | 'adjustment' | 'expired' | 'damaged';
  quantity: number;
  
  // Reference
  reference_type?: string;
  reference_id?: number;
  
  // Details
  reason?: string;
  notes?: string;
  
  // Stock After Movement
  stock_before: number;
  stock_after: number;
  
  created_at: string;
  created_by?: number;
}

export interface PrescriptionFulfillment {
  id: number;
  prescription_id: number;
  inventory_id?: number;
  pharmacist_id?: number;
  quantity_fulfilled: number;
  fulfilled_at: string;
  status: StatusEnum;
  notes?: string;
  created_at: string;
  created_by?: number;
}

export interface Appointment {
  id?: number;
  hospital_id: number;
  patient_id: number;
  doctor_id?: number;
  
  // Appointment Details
  appointment_date: string; // DATE
  appointment_time: string; // TIME
  duration_minutes: number;
  
  appointment_type: VisitType;
  reason?: string;
  notes?: string;
  
  // Status
  status: AppointmentStatus;
  
  // Cancellation
  cancelled_at?: string;
  cancelled_by?: number;
  cancellation_reason?: string;
  
  // Check-in
  checked_in_at?: string;
  checked_in_by?: number;
  
  created_at: string;
  updated_at: string;
  created_by?: number;
  
  // Populated fields
  patients?: Patient;
  users?: User; // doctor
  hospital_users?: HospitalUser;
}

export interface Bill {
  id: number;
  visit_id?: number;
  hospital_id: number;
  bill_number: string;
  total_amount: number;
  paid_amount: number;
  status: StatusEnum;
  created_at: string;
  updated_at: string;
}
