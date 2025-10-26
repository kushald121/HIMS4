'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const patientSchema = z.object({
  // Personal Information
  first_name: z.string().min(2, 'First name must be at least 2 characters').optional(),
  last_name: z.string().min(2, 'Last name must be at least 2 characters').optional(),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']),
  blood_group: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  
  // Contact Information
  contact_number: z.string().min(10, 'Valid phone number required'),
  email: z.string().email('Valid email required').optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  
  // Emergency Contact
  emergency_contact_name: z.string().optional(),
  emergency_contact_number: z.string().optional(),
  emergency_contact_relationship: z.string().optional(),
  
  // Medical Information
  allergies: z.string().optional(),
  chronic_conditions: z.string().optional(),
  medical_history: z.string().optional(),
  current_medications: z.string().optional(),
  
  // Insurance
  insurance_provider: z.string().optional(),
  insurance_policy_number: z.string().optional(),
  insurance_group_number: z.string().optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;

interface PatientRegistrationFormProps {
  onSuccess?: (patient: any) => void;
  onCancel?: () => void;
  initialData?: Partial<PatientFormData>;
  mode?: 'create' | 'edit';
  patientId?: number;
}

export default function PatientRegistrationForm({
  onSuccess,
  onCancel,
  initialData,
  mode = 'create',
  patientId,
}: PatientRegistrationFormProps) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: initialData || {},
  });

  const gender = watch('gender');

  const onSubmit = async (data: PatientFormData) => {
    setLoading(true);
    try {
      const url = mode === 'edit' ? `/api/patients/${patientId}` : '/api/patients';
      const method = mode === 'edit' ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to save patient');
      }

      toast.success(
        mode === 'edit'
          ? 'Patient updated successfully'
          : `Patient registered successfully! Patient Number: ${result.data.patient.patient_number}`
      );

      if (onSuccess) {
        onSuccess(result.data.patient);
      }
    } catch (error: any) {
      console.error('Error saving patient:', error);
      toast.error(error.message || 'Failed to save patient');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>{mode === 'edit' ? 'Edit Patient' : 'Register New Patient'}</CardTitle>
          <CardDescription>
            {mode === 'edit'
              ? 'Update patient information'
              : 'Enter patient details to create a new registration'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  placeholder="John"
                  {...register('first_name')}
                />
                {errors.first_name && (
                  <p className="text-sm text-red-500">{errors.first_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  placeholder="Doe"
                  {...register('last_name')}
                />
                {errors.last_name && (
                  <p className="text-sm text-red-500">{errors.last_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_of_birth">
                  Date of Birth <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  {...register('date_of_birth')}
                  max={new Date().toISOString().split('T')[0]}
                />
                {errors.date_of_birth && (
                  <p className="text-sm text-red-500">{errors.date_of_birth.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">
                  Gender <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={gender}
                  onValueChange={(value: string) => setValue('gender', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && (
                  <p className="text-sm text-red-500">{errors.gender.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="blood_group">Blood Group</Label>
                <Select
                  value={watch('blood_group') || ''}
                  onValueChange={(value: string) => setValue('blood_group', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select blood group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Contact Information */}
            <h4 className="font-medium text-md mt-6">Contact Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_number">
                  Contact Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="contact_number"
                  type="tel"
                  placeholder="+1-555-0123"
                  {...register('contact_number')}
                />
                {errors.contact_number && (
                  <p className="text-sm text-red-500">{errors.contact_number.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john.doe@email.com"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Street Address</Label>
              <Textarea
                id="address"
                placeholder="123 Main Street"
                {...register('address')}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="New York"
                  {...register('city')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  placeholder="NY"
                  {...register('state')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  placeholder="10001"
                  {...register('postal_code')}
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Emergency Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_name">Contact Name</Label>
                <Input
                  id="emergency_contact_name"
                  placeholder="Jane Doe"
                  {...register('emergency_contact_name')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergency_contact_number">Contact Number</Label>
                <Input
                  id="emergency_contact_number"
                  type="tel"
                  placeholder="+1-555-0124"
                  {...register('emergency_contact_number')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergency_contact_relationship">Relationship</Label>
                <Select
                  value={watch('emergency_contact_relationship') || ''}
                  onValueChange={(value: string) => setValue('emergency_contact_relationship', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Spouse">Spouse</SelectItem>
                    <SelectItem value="Parent">Parent</SelectItem>
                    <SelectItem value="Sibling">Sibling</SelectItem>
                    <SelectItem value="Child">Child</SelectItem>
                    <SelectItem value="Friend">Friend</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Medical Information</h3>
            <div className="space-y-2">
              <Label htmlFor="allergies">Known Allergies</Label>
              <Textarea
                id="allergies"
                placeholder="e.g., Penicillin, Peanuts, Latex (comma-separated)"
                {...register('allergies')}
                rows={2}
              />
              <p className="text-xs text-gray-500">Separate multiple allergies with commas</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="chronic_conditions">Chronic Conditions</Label>
              <Textarea
                id="chronic_conditions"
                placeholder="e.g., Diabetes, Hypertension, Asthma (comma-separated)"
                {...register('chronic_conditions')}
                rows={2}
              />
              <p className="text-xs text-gray-500">Separate multiple conditions with commas</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="medical_history">Medical History</Label>
              <Textarea
                id="medical_history"
                placeholder="Previous surgeries, hospitalizations, significant medical events..."
                {...register('medical_history')}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_medications">Current Medications</Label>
              <Textarea
                id="current_medications"
                placeholder="Medications currently being taken..."
                {...register('current_medications')}
                rows={2}
              />
            </div>
          </div>

          {/* Insurance Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Insurance Information (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="insurance_provider">Insurance Provider</Label>
                <Input
                  id="insurance_provider"
                  placeholder="e.g., Blue Cross Blue Shield"
                  {...register('insurance_provider')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="insurance_policy_number">Policy Number</Label>
                <Input
                  id="insurance_policy_number"
                  placeholder="BC123456789"
                  {...register('insurance_policy_number')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="insurance_group_number">Group Number</Label>
                <Input
                  id="insurance_group_number"
                  placeholder="GRP001"
                  {...register('insurance_group_number')}
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          {onCancel && (
            <Button type="button" className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
          )}
          <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'edit' ? 'Update Patient' : 'Register Patient'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
