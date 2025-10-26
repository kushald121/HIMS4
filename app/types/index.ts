export type RoleEnum = 'admin' | 'doctor' | 'pharmacist' | 'receptionist' | 'patient';

export type StatusEnum =
  | 'pending'
  | 'filled'
  | 'partially_filled'
  | 'cancelled'
  | 'out_of_stock'
  | 'active'
  | 'completed'
  | 'scheduled'
  | 'confirmed'
  | 'no_show';

export type GenderEnum = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export type VisitTypeEnum = 'consultation' | 'follow_up' | 'emergency' | 'routine_checkup';

export interface Hospital {
  id: number;
  name: string;
  logo_url?: string;
  address?: string;
  contact_email?: string;
  contact_phone?: string;
  settings?: Record<string, any>;
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
  oauth_provider?: 'google' | 'meta';
  oauth_provider_id?: string;
  phone?: string;
  email_verified: boolean;
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
  role: RoleEnum;
  employee_id?: string;
  department?: string;
  created_at: string;
  updated_at: string;
  created_by?: number;
  deleted_at?: string;
}

export interface Patient {
  id: number;
  user_id?: number;
  hospital_id: number;
  patient_number: string;
  date_of_birth?: string;
  gender?: GenderEnum;
  contact_number?: string;
  emergency_contact_name?: string;
  emergency_contact_number?: string;
  address?: string;
  blood_group?: string;
  allergies?: string;
  medical_history?: string;
  created_at: string;
  updated_at: string;
  created_by?: number;
  deleted_at?: string;
}

export interface Visit {
  id: number;
  patient_id: number;
  doctor_id?: number;
  hospital_id: number;
  visit_number: string;
  visit_date: string;
  visit_type: VisitTypeEnum;
  chief_complaint?: string;
  symptoms?: string;
  diagnosis?: string;
  treatment_plan?: string;
  notes?: string;
  status: StatusEnum;
  created_at: string;
  updated_at: string;
  created_by?: number;
}

export interface MedicalTest {
  id: number;
  visit_id: number;
  test_type: string;
  test_name: string;
  test_date: string;
  result_details?: string;
  result_values?: Record<string, any>;
  reference_ranges?: Record<string, any>;
  image_url?: string;
  lab_technician_id?: number;
  status: StatusEnum;
  created_at: string;
  updated_at: string;
  created_by?: number;
}

export interface Prescription {
  id: number;
  visit_id: number;
  prescribed_by?: number;
  medication_name: string;
  generic_name?: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity_prescribed?: number;
  instructions?: string;
  status: StatusEnum;
  created_at: string;
  updated_at: string;
  created_by?: number;
}

export interface Inventory {
  id: number;
  hospital_id: number;
  medication_name: string;
  generic_name?: string;
  category?: string;
  manufacturer?: string;
  batch_number?: string;
  expiry_date?: string;
  stock_quantity: number;
  reorder_threshold: number;
  unit_price?: number;
  created_at: string;
  updated_at: string;
  created_by?: number;
  deleted_at?: string;
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
  id: number;
  patient_id?: number;
  doctor_id?: number;
  hospital_id: number;
  appointment_date: string;
  duration_minutes: number;
  reason?: string;
  status: StatusEnum;
  created_at: string;
  updated_at: string;
  created_by?: number;
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
