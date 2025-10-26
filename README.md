# Hospital Information Management System (HIMS)

A comprehensive, production-ready Hospital Information Management System built with Next.js 13, TypeScript, and Supabase PostgreSQL.

## 🏥 Overview

HIMS is a full-featured healthcare management platform designed to streamline hospital operations with role-based access control for Admins, Doctors, Pharmacists, and Receptionists. The system manages the complete patient journey from registration through treatment to prescription fulfillment.

## ✨ Key Features

### 🔐 Authentication & Authorization
- Secure JWT-based authentication
- Role-based access control (RBAC)
- Multi-hospital support with hospital-specific user roles
- Session management with token expiration

### 👥 User Roles & Capabilities

#### **Admin**
- Complete hospital management dashboard
- Patient management (CRUD operations)
- Inventory oversight and alerts
- User and staff management
- System-wide analytics and reporting

#### **Doctor**
- Patient medical records access
- Visit recording and diagnosis
- Prescription creation and management
- Patient history and vital signs tracking
- Appointment scheduling

#### **Pharmacist**
- Prescription queue management
- Medication dispensing and fulfillment
- Inventory management
- Stock alerts and reordering
- Medication history tracking

#### **Receptionist**
- Patient registration and check-in
- Appointment scheduling and management
- Patient demographic updates
- Visit coordination

### 📋 Core Modules

#### 1. **Patient Management**
- Comprehensive patient registration
- Demographics and contact information
- Medical history (allergies, chronic conditions, surgeries)
- Insurance information
- Emergency contacts
- Patient search and filtering

#### 2. **Appointment System**
- Schedule patient appointments
- Doctor assignment
- Appointment types (consultation, follow-up, emergency)
- Status tracking (scheduled, confirmed, completed, cancelled)
- Check-in management

#### 3. **Clinical Visits**
- Visit documentation
- Vital signs recording (BP, pulse, temperature, oxygen saturation)
- Chief complaints and symptoms
- Diagnosis and treatment plans
- Visit history

#### 4. **Prescription Management**
- Electronic prescription creation
- Medication details with dosage and frequency
- Multi-item prescriptions
- Prescription fulfillment workflow
- Partial and full dispensing
- Prescription history

#### 5. **Inventory Management**
- Medication inventory tracking
- Stock level monitoring
- Low stock alerts
- Reorder level management
- Stock adjustments
- Expiry tracking

#### 6. **Analytics Dashboard**
- Real-time statistics
- Patient count and demographics
- Appointment metrics
- Visit analytics
- Prescription queue status
- Inventory alerts

## 🚀 Technology Stack

### Frontend
- **Framework**: Next.js 13 (App Router)
- **Language**: TypeScript 5.2.2
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS 3.3
- **Icons**: Lucide React
- **Forms**: React Hook Form
- **State Management**: React Context API

### Backend
- **Runtime**: Node.js
- **API**: Next.js API Routes
- **Database**: Supabase PostgreSQL
- **ORM**: Supabase Client
- **Authentication**: JWT with custom middleware
- **Security**: bcrypt for password hashing, crypto for token generation

### Development Tools
- **Linting**: ESLint
- **Type Checking**: TypeScript strict mode
- **Package Manager**: npm

## 📊 System Architecture

### Database Schema

```
┌─────────────────┐
│    hospitals    │
├─────────────────┤
│ id (PK)         │
│ name            │
│ type            │
│ address         │
│ settings (JSON) │
└─────────────────┘
        │
        ├─────────────────────────────────────┐
        │                                     │
        ▼                                     ▼
┌─────────────────┐                   ┌─────────────────┐
│     users       │                   │  hospital_users │
├─────────────────┤                   ├─────────────────┤
│ id (PK)         │◄──────────────────│ id (PK)         │
│ email           │                   │ user_id (FK)    │
│ password_hash   │                   │ hospital_id (FK)│
│ first_name      │                   │ role            │
│ last_name       │                   │ employee_id     │
│ phone           │                   │ department      │
└─────────────────┘                   └─────────────────┘
        │                                     │
        │                                     │
        ▼                                     ▼
┌─────────────────┐                   ┌─────────────────┐
│  user_sessions  │                   │    patients     │
├─────────────────┤                   ├─────────────────┤
│ id (PK)         │                   │ id (PK)         │
│ user_id (FK)    │                   │ hospital_id (FK)│
│ token_hash      │                   │ patient_number  │
│ expires_at      │                   │ first_name      │
└─────────────────┘                   │ last_name       │
                                      │ date_of_birth   │
                                      │ gender          │
                                      │ contact_number  │
                                      │ allergies       │
                                      └─────────────────┘
                                              │
                        ┌─────────────────────┼─────────────────────┐
                        │                     │                     │
                        ▼                     ▼                     ▼
              ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
              │  appointments   │   │     visits      │   │  prescriptions  │
              ├─────────────────┤   ├─────────────────┤   ├─────────────────┤
              │ id (PK)         │   │ id (PK)         │   │ id (PK)         │
              │ patient_id (FK) │   │ patient_id (FK) │   │ patient_id (FK) │
              │ doctor_id (FK)  │   │ doctor_id (FK)  │   │ visit_id (FK)   │
              │ appointment_date│   │ visit_date      │   │ doctor_id (FK)  │
              │ status          │   │ visit_type      │   │ status          │
              │ reason          │   │ chief_complaint │   │ notes           │
              └─────────────────┘   │ diagnosis       │   └─────────────────┘
                                    │ vital_signs     │           │
                                    └─────────────────┘           │
                                                                  ▼
                                                        ┌─────────────────────┐
                                                        │ prescription_items  │
                                                        ├─────────────────────┤
                                                        │ id (PK)             │
                                                        │ prescription_id (FK)│
                                                        │ medication_id (FK)  │
                                                        │ quantity            │
                                                        │ dosage              │
                                                        │ frequency           │
                                                        └─────────────────────┘
                                                                  │
                                                                  ▼
                                                        ┌─────────────────┐
                                                        │    inventory    │
                                                        ├─────────────────┤
                                                        │ id (PK)         │
                                                        │ hospital_id (FK)│
                                                        │ medication_name │
                                                        │ current_stock   │
                                                        │ minimum_stock   │
                                                        │ unit_price      │
                                                        └─────────────────┘
```

## 🔄 Complete System Flow

### 1. Patient Registration Flow

```
Patient Arrives
      ↓
Receptionist Login
      ↓
Navigate to Patient Registration
      ↓
Fill Patient Form
      ↓
   ┌──────────────────┐
   │ Patient Exists?  │
   └────┬──────────┬──┘
        │          │
       No         Yes
        │          │
        ▼          ▼
Create New   Update Existing
   Record         Record
        │          │
        └────┬─────┘
             ▼
   Generate Patient Number
             ▼
     Save to Database
             ▼
  Patient Profile Created
```

**Steps:**
1. Receptionist logs in with credentials
2. Navigates to **Dashboard → Patients → Register New Patient**
3. Fills in patient information:
   - Personal details (name, DOB, gender, blood group)
   - Contact information (phone, email, address)
   - Medical history (allergies, chronic conditions)
   - Insurance details
   - Emergency contact
4. System generates unique patient number
5. Patient record saved to database
6. Patient can now be scheduled for appointments

### 2. Appointment Scheduling Flow

```
Patient Registered
      ↓
Receptionist/Patient Request
      ↓
Select Doctor & Date/Time
      ↓
Choose Appointment Type
      ↓
Add Reason/Notes
      ↓
Create Appointment
      ↓
Status: Scheduled
      ↓
Appointment Day
      ↓
Patient Check-in
      ↓
Status: Confirmed
      ↓
Doctor Ready
      ↓
Patient Visit Begins
```

**Steps:**
1. Receptionist navigates to **Appointments → Schedule New**
2. Search and select patient
3. Choose available doctor and time slot
4. Select appointment type (consultation, follow-up, emergency)
5. Add reason for visit
6. Appointment created with **Scheduled** status
7. On appointment day, receptionist marks patient as **Checked-in**
8. Appointment status changes to **Confirmed**
9. Doctor can now see patient in their queue

### 3. Doctor Visit Recording Flow

```
Patient Checked-in
      ↓
Doctor Login
      ↓
View Patient Queue
      ↓
Select Patient
      ↓
Record Vital Signs
      ↓
Document Chief Complaint
      ↓
Enter Diagnosis
      ↓
Record Treatment Plan
      ↓
   ┌──────────────────────┐
   │ Prescription Needed? │
   └────┬──────────┬──────┘
       Yes         No
        │          │
        ▼          │
Create Prescription│
        │          │
        └────┬─────┘
             ▼
    Complete Visit
             ↓
    Save Visit Record
             ↓
Appointment Status: Completed
```

**Steps:**
1. Doctor logs in and navigates to **Dashboard**
2. Views today's appointments in **My Patients** or **Visits**
3. Clicks on checked-in patient
4. Records visit information:
   - **Vital Signs**: BP, pulse, temperature, respiratory rate, oxygen saturation
   - **Chief Complaint**: Patient's primary concern
   - **Symptoms**: Detailed symptoms
   - **Diagnosis**: Medical diagnosis
   - **Treatment Plan**: Recommended treatment
   - **Notes**: Additional observations
5. If medication needed, clicks **Create Prescription**
6. Saves visit record
7. Visit stored in database with timestamp
8. Appointment marked as **Completed**

### 4. Prescription Creation & Fulfillment Flow

```
Visit Recorded
      ↓
Doctor Creates Prescription
      ↓
Add Medications
      ↓
Specify Dosage & Frequency
      ↓
Add Instructions
      ↓
Save Prescription
      ↓
Status: Pending
      ↓
Pharmacist Login
      ↓
View Prescription Queue
      ↓
Select Prescription
      ↓
Verify Medications Available
      ↓
   ┌──────────────────┐
   │ Stock Available? │
   └────┬──────────┬──┘
       Yes         No
        │          │
        ▼          ▼
    Dispense   Mark Partial/
  Medications  Out of Stock
        │          │
        ▼          │
Update Inventory   │
        │          │
        ▼          ▼
Status: Filled   Status:
              Partially Filled
```

**Steps:**

#### Doctor Side:
1. During or after visit, doctor clicks **Create Prescription**
2. Prescription form opens with patient details pre-filled
3. Adds medications:
   - Medication name
   - Dosage (e.g., "500mg")
   - Frequency (e.g., "Twice daily")
   - Duration (e.g., "7 days")
   - Quantity
4. Adds special instructions
5. Saves prescription (Status: **Pending**)
6. Prescription appears in pharmacist queue

#### Pharmacist Side:
1. Pharmacist logs in and navigates to **Prescriptions**
2. Views pending prescriptions sorted by date
3. Selects prescription to fulfill
4. Reviews prescription details and patient information
5. Checks inventory for each medication
6. If stock available:
   - Marks items as dispensed
   - Updates quantities
   - Inventory automatically reduced
   - Status: **Filled**
7. If partial stock:
   - Marks available items as dispensed
   - Notes unavailable items
   - Status: **Partially Filled**
8. Prints prescription label (optional)
9. Gives medications to patient

### 5. Inventory Management Flow

```
Pharmacist Login
      ↓
Navigate to Inventory
      ↓
View Current Stock
      ↓
   ┌──────────────┐
   │Action Needed?│
   └──┬────┬────┬─┘
      │    │    │
   Add  Adjust Check
   New   Stock Alerts
  Med    │     │
   │     │     │
   ▼     ▼     ▼
```

**Steps:**

#### Adding New Medication:
1. Pharmacist navigates to **Inventory → Add Medication**
2. Fills in medication details:
   - Medication name
   - Generic name
   - Category (antibiotic, analgesic, etc.)
   - Unit price
   - Current stock quantity
   - Minimum stock (reorder level)
   - Expiry date
3. Saves medication
4. Medication appears in inventory list

#### Stock Adjustment:
1. Selects medication from inventory list
2. Clicks **Adjust Stock**
3. Chooses adjustment type:
   - **Stock In**: Receiving new stock
   - **Stock Out**: Removing damaged/expired items
   - **Correction**: Fixing count errors
4. Enters quantity and reason
5. Stock level updated
6. If below minimum, alert shown on dashboard

#### Low Stock Monitoring:
1. Dashboard shows **Low Stock Alerts**
2. Lists medications below reorder level
3. Pharmacist/Admin can generate purchase orders
4. Restock medications
5. Update inventory with new stock

### 6. Complete Patient Journey Example

**Scenario: Patient "John Doe" with flu symptoms**

```
Day 1 - Registration & Appointment:
├── 9:00 AM: John arrives at hospital
├── 9:05 AM: Receptionist registers John in system
│            - Patient Number: PAT-2025-0001
│            - Contact: +1234567890
│            - Emergency Contact: Jane Doe
├── 9:10 AM: Receptionist schedules appointment
│            - Doctor: Dr. Sarah Smith
│            - Time: 10:00 AM
│            - Type: Consultation
│            - Reason: Flu symptoms
└── 9:15 AM: Appointment Status: Scheduled

Day 1 - Check-in & Visit:
├── 9:55 AM: John arrives for appointment
├── 10:00 AM: Receptionist marks John as Checked-in
│            - Appointment Status: Confirmed
├── 10:05 AM: Dr. Smith sees John
│            - Records Vitals:
│              • BP: 120/80 mmHg
│              • Pulse: 78 bpm
│              • Temperature: 101.2°F
│              • O2 Saturation: 98%
│            - Chief Complaint: "Fever, cough, body aches"
│            - Diagnosis: "Influenza"
│            - Treatment Plan: "Rest, fluids, antipyretics"
├── 10:15 AM: Dr. Smith creates prescription
│            - Paracetamol 500mg - 3x daily - 5 days - Qty: 15
│            - Azithromycin 500mg - 1x daily - 3 days - Qty: 3
│            - Prescription Status: Pending
└── 10:20 AM: Visit completed, Appointment Status: Completed

Day 1 - Prescription Fulfillment:
├── 10:30 AM: John goes to pharmacy
├── 10:35 AM: Pharmacist opens prescription
│            - Verifies patient identity
│            - Checks inventory:
│              • Paracetamol: 150 in stock ✓
│              • Azithromycin: 50 in stock ✓
├── 10:40 AM: Pharmacist dispenses medications
│            - Updates inventory:
│              • Paracetamol: 150 → 135
│              • Azithromycin: 50 → 47
│            - Prescription Status: Filled
├── 10:45 AM: Provides instructions to John
└── 10:50 AM: John leaves with medications

Backend Processing:
├── Patient record created in 'patients' table
├── Appointment created in 'appointments' table
├── Visit recorded in 'visits' table
├── Prescription created in 'prescriptions' table
├── Prescription items in 'prescription_items' table
├── Inventory updated in 'inventory' table
└── All timestamps and audit trails recorded
```

## 🛠️ Installation & Setup

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Supabase account
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/kushald121/HIMS4.git
cd HIMS4
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

#### Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Note your project URL and anon key

#### Run Migrations
```bash
# The migration file is located at:
# supabase/migrations/20251025131345_create_hims_tables.sql

# Apply to your Supabase project via Supabase dashboard:
# 1. Go to SQL Editor
# 2. Copy contents of migration file
# 3. Execute the SQL
```

### 4. Environment Configuration

Create `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 5. Create Test Users

Run the test user creation script:

```bash
node create-test-user.js
```

This creates:
- **Admin**: admin@hospital.com / Admin@123
- **Doctor**: doctor@hospital.com / Doctor@123
- **Pharmacist**: pharmacist@hospital.com / Pharmacist@123
- **Receptionist**: receptionist@hospital.com / Receptionist@123

### 6. Start Development Server

```bash
npm run dev
```

Application will be available at: `http://localhost:3000`

### 7. Build for Production

```bash
npm run build
npm start
```

## 📱 Usage Guide

### First-Time Login

1. Navigate to `http://localhost:3000`
2. Click **Login**
3. Use test credentials or your created user
4. System redirects to role-specific dashboard

### Admin Dashboard

**Access**: Login with admin credentials

**Features**:
- View system-wide statistics
- Manage all patients
- View all appointments
- Monitor inventory across departments
- User management (coming soon)

**Common Tasks**:
```
Manage Patients:
Dashboard → Patients → Register/Edit/Delete

View Reports:
Dashboard → Statistics cards show real-time metrics

Inventory Overview:
Dashboard → Low Stock Alerts section
```

### Doctor Dashboard

**Access**: Login with doctor credentials

**Features**:
- View assigned patients
- Record visits and examinations
- Create prescriptions
- View patient medical history
- Appointment management

**Common Tasks**:
```
Record a Visit:
Dashboard → Visits → Record New Visit
- Select patient
- Enter vital signs
- Add diagnosis
- Create prescription (if needed)

View Patient History:
Dashboard → Patients → Select Patient → View Details
```

### Pharmacist Dashboard

**Access**: Login with pharmacist credentials

**Features**:
- Prescription queue management
- Medication dispensing
- Inventory management
- Stock alerts

**Common Tasks**:
```
Fulfill Prescription:
Dashboard → Prescriptions → Select Pending Prescription
- Verify patient details
- Check stock availability
- Dispense medications
- Mark as fulfilled

Manage Inventory:
Dashboard → Inventory → Add/Adjust Stock
- Add new medications
- Update stock levels
- Set reorder points
```

### Receptionist Dashboard

**Access**: Login with receptionist credentials

**Features**:
- Patient registration
- Appointment scheduling
- Patient check-in
- Basic patient information updates

**Common Tasks**:
```
Register Patient:
Dashboard → Register Patient
- Fill patient form
- Save record

Schedule Appointment:
Dashboard → Appointments → New Appointment
- Search patient
- Select doctor and time
- Set appointment type
- Save

Check-in Patient:
Dashboard → Appointments → Find Today's Appointment
- Click Check-in button
- Status updates to Confirmed
```

## 🔒 Security Features

### Authentication
- Password hashing with bcrypt (10 salt rounds)
- JWT tokens with expiration
- Secure session management
- Token refresh mechanism

### Authorization
- Role-based access control (RBAC)
- Hospital-scoped data access
- API route protection
- Middleware authentication checks

### Data Protection
- SQL injection prevention (parameterized queries)
- XSS protection
- CSRF protection
- Secure password policies

### Audit Trail
- Created by / Updated by tracking
- Timestamp logging
- Soft deletes (deleted_at)
- Session activity logging

## 🧪 Testing

### Run Tests
```bash
# Test Supabase connection
node test-supabase.js

# Test login functionality
node test-login.js

# Check database tables
node check-tables.js
```

### Manual Testing Checklist

- [ ] User registration and login
- [ ] Patient registration
- [ ] Appointment scheduling
- [ ] Visit recording
- [ ] Prescription creation
- [ ] Prescription fulfillment
- [ ] Inventory management
- [ ] Role-based access control
- [ ] Data persistence
- [ ] Dashboard statistics

## 📁 Project Structure

```
HIMS4/
├── app/
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Authentication endpoints
│   │   │   ├── login/
│   │   │   ├── logout/
│   │   │   └── register/
│   │   ├── appointments/         # Appointment management
│   │   ├── patients/             # Patient CRUD
│   │   ├── visits/               # Visit recording
│   │   ├── prescriptions/        # Prescription management
│   │   └── inventory/            # Inventory operations
│   │
│   ├── auth/                     # Auth pages
│   │   ├── login/
│   │   └── register/
│   │
│   ├── dashboard/                # Role-based dashboards
│   │   ├── admin/
│   │   │   ├── patients/
│   │   │   └── inventory/
│   │   ├── doctor/
│   │   │   ├── patients/
│   │   │   ├── visits/
│   │   │   └── prescriptions/
│   │   ├── pharmacist/
│   │   │   ├── prescriptions/
│   │   │   └── inventory/
│   │   └── receptionist/
│   │       ├── patients/
│   │       └── appointments/
│   │
│   ├── components/               # Reusable components
│   │   ├── DashboardLayout.tsx
│   │   ├── patients/
│   │   ├── visits/
│   │   ├── prescriptions/
│   │   ├── appointments/
│   │   └── inventory/
│   │
│   ├── context/                  # React Context
│   │   └── AuthContext.tsx
│   │
│   ├── lib/                      # Libraries & utilities
│   │   └── supabase.ts
│   │
│   ├── middleware/               # Middleware functions
│   │   └── auth.ts
│   │
│   ├── types/                    # TypeScript definitions
│   │   └── index.ts
│   │
│   ├── utils/                    # Utility functions
│   │   ├── crypto.ts
│   │   └── response.ts
│   │
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
│
├── components/                   # shadcn/ui components
│   └── ui/
│
├── hooks/                        # Custom React hooks
│   └── use-toast.ts
│
├── lib/                          # Library configurations
│   └── utils.ts
│
├── supabase/                     # Database migrations
│   └── migrations/
│       └── 20251025131345_create_hims_tables.sql
│
├── public/                       # Static assets
│
├── .env.local                    # Environment variables
├── next.config.js                # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── package.json                  # Dependencies
└── README.md                     # This file
```

## 🔧 Configuration

### Next.js Configuration (`next.config.js`)

```javascript
module.exports = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
}
```

### TypeScript Configuration (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

## 🐛 Troubleshooting

### Common Issues

#### Build Errors
```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

#### Database Connection Issues
```bash
# Test connection
node test-supabase.js

# Verify environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
```

#### Authentication Errors
- Verify user exists in database
- Check password is correct
- Ensure token hasn't expired
- Clear browser cookies/localStorage

#### Type Errors
```bash
# Run type check
npx tsc --noEmit
```

## 📈 Performance Optimization

### Implemented Optimizations
- Next.js automatic code splitting
- Image optimization with Next/Image
- API route caching where appropriate
- Database query optimization with proper indexes
- Lazy loading of components
- Pagination for large datasets

### Recommended Production Settings
- Enable compression
- Set up CDN for static assets
- Configure database connection pooling
- Implement Redis for session storage
- Set up monitoring and logging

## 🚧 Roadmap

### Phase 6: Laboratory Management (Planned)
- [ ] Lab test ordering
- [ ] Sample tracking
- [ ] Results management
- [ ] Report generation

### Phase 7: Billing & Payments (Planned)
- [ ] Invoice generation
- [ ] Payment processing
- [ ] Insurance claims
- [ ] Financial reporting

### Phase 8: Advanced Features (Planned)
- [ ] Telemedicine integration
- [ ] Mobile app
- [ ] Patient portal
- [ ] Analytics dashboard
- [ ] Automated notifications
- [ ] Reporting system

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Coding Standards
- Follow TypeScript best practices
- Use meaningful variable and function names
- Add comments for complex logic
- Maintain consistent formatting
- Write unit tests for new features

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- **Aniket Singh** - Initial development and architecture
- **Kushal D** - Repository maintenance

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend as a Service
- [shadcn/ui](https://ui.shadcn.com/) - UI component library
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Lucide Icons](https://lucide.dev/) - Icon library

## 📞 Support

For support, email support@example.com or open an issue in the GitHub repository.

## 📊 Project Status

**Current Version**: 1.0.0  
**Status**: ✅ Production Ready  
**Last Updated**: October 27, 2025

### Completed Phases
- ✅ Phase 1: Database Schema & Authentication
- ✅ Phase 2: Patient Management
- ✅ Phase 3: Visits, Prescriptions & Inventory
- ✅ Phase 4: Appointment Scheduling
- ✅ Phase 5: Enhanced Role-Based Dashboards

### Build Status
- ✅ All TypeScript compilation errors resolved
- ✅ Build successful
- ✅ Type safety enforced
- ✅ Production deployment ready

---

**Made with ❤️ for better healthcare management**
