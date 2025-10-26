'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Validation schema
const visitSchema = z.object({
  patient_id: z.string().min(1, 'Patient is required'),
  doctor_id: z.string().min(1, 'Doctor is required'),
  hospital_id: z.string().min(1, 'Hospital is required'),
  visit_type: z.enum(['consultation', 'follow_up', 'emergency', 'routine_checkup']),
  chief_complaint: z.string().min(1, 'Chief complaint is required'),
  diagnosis: z.string().optional(),
  notes: z.string().optional(),
  // Vital signs
  blood_pressure: z.string().optional(),
  temperature: z.string().optional(),
  pulse: z.string().optional(),
  respiratory_rate: z.string().optional(),
  weight: z.string().optional(),
  height: z.string().optional(),
  oxygen_saturation: z.string().optional(),
});

type VisitFormData = z.infer<typeof visitSchema>;

interface Medication {
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  instructions: string;
}

interface VisitRecordingFormProps {
  patientId?: string;
  doctorId?: string;
  hospitalId?: string;
  onSuccess?: (visit: any) => void;
  onCancel?: () => void;
}

export default function VisitRecordingForm({
  patientId,
  doctorId,
  hospitalId,
  onSuccess,
  onCancel,
}: VisitRecordingFormProps) {
  const [loading, setLoading] = useState(false);
  const [includePrescription, setIncludePrescription] = useState(false);
  const [medications, setMedications] = useState<Medication[]>([]);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<VisitFormData>({
    resolver: zodResolver(visitSchema),
    defaultValues: {
      patient_id: patientId || '',
      doctor_id: doctorId || '',
      hospital_id: hospitalId || '',
      visit_type: 'consultation',
    },
  });

  const visitType = watch('visit_type');

  const addMedication = () => {
    setMedications([
      ...medications,
      {
        medication_name: '',
        dosage: '',
        frequency: '',
        duration: '',
        quantity: 0,
        instructions: '',
      },
    ]);
  };

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const updateMedication = (index: number, field: keyof Medication, value: any) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: value };
    setMedications(updated);
  };

  const onSubmit = async (data: VisitFormData) => {
    try {
      setLoading(true);

      // Build vital signs object
      const vital_signs = {
        blood_pressure: data.blood_pressure || null,
        temperature: data.temperature || null,
        pulse: data.pulse || null,
        respiratory_rate: data.respiratory_rate || null,
        weight: data.weight || null,
        height: data.height || null,
        oxygen_saturation: data.oxygen_saturation || null,
      };

      // Build request body
      const requestBody: any = {
        patient_id: data.patient_id,
        doctor_id: data.doctor_id,
        hospital_id: data.hospital_id,
        visit_type: data.visit_type,
        chief_complaint: data.chief_complaint,
        diagnosis: data.diagnosis || null,
        vital_signs,
        notes: data.notes || null,
      };

      // Add prescription if medications are added
      if (includePrescription && medications.length > 0) {
        requestBody.prescription_data = {
          notes: data.notes || null,
          items: medications.filter(m => m.medication_name && m.dosage),
        };
      }

      const response = await fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create visit');
      }

      const result = await response.json();

      toast({
        title: 'Success',
        description: 'Visit recorded successfully',
      });

      if (onSuccess) {
        onSuccess(result.visit);
      }
    } catch (error) {
      console.error('Visit creation error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to record visit',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Visit Information */}
      <Card>
        <CardHeader>
          <CardTitle>Visit Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="visit_type">
                Visit Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={visitType}
                onValueChange={(value: string) => setValue('visit_type', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultation">Consultation</SelectItem>
                  <SelectItem value="follow_up">Follow-up</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="routine_checkup">Routine Checkup</SelectItem>
                </SelectContent>
              </Select>
              {errors.visit_type && (
                <p className="text-sm text-red-500">{errors.visit_type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="chief_complaint">
                Chief Complaint <span className="text-red-500">*</span>
              </Label>
              <Input
                id="chief_complaint"
                placeholder="e.g., Fever and headache"
                {...register('chief_complaint')}
              />
              {errors.chief_complaint && (
                <p className="text-sm text-red-500">{errors.chief_complaint.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="diagnosis">Diagnosis</Label>
            <Textarea
              id="diagnosis"
              placeholder="Enter diagnosis..."
              rows={3}
              {...register('diagnosis')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes..."
              rows={3}
              {...register('notes')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Vital Signs */}
      <Card>
        <CardHeader>
          <CardTitle>Vital Signs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="blood_pressure">Blood Pressure</Label>
              <Input
                id="blood_pressure"
                placeholder="120/80"
                {...register('blood_pressure')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="temperature">Temperature (°F)</Label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                placeholder="98.6"
                {...register('temperature')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pulse">Pulse (bpm)</Label>
              <Input
                id="pulse"
                type="number"
                placeholder="72"
                {...register('pulse')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="respiratory_rate">Resp. Rate</Label>
              <Input
                id="respiratory_rate"
                type="number"
                placeholder="16"
                {...register('respiratory_rate')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                placeholder="70"
                {...register('weight')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                type="number"
                step="0.1"
                placeholder="170"
                {...register('height')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="oxygen_saturation">O2 Saturation (%)</Label>
              <Input
                id="oxygen_saturation"
                type="number"
                placeholder="98"
                {...register('oxygen_saturation')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prescription */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Prescription</CardTitle>
            <Button
              type="button"
              onClick={() => setIncludePrescription(!includePrescription)}
            >
              {includePrescription ? 'Remove Prescription' : 'Add Prescription'}
            </Button>
          </div>
        </CardHeader>
        {includePrescription && (
          <CardContent className="space-y-4">
            {medications.map((med, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Medication {index + 1}</h4>
                  <Button
                    type="button"
                    onClick={() => removeMedication(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Medication Name *</Label>
                    <Input
                      value={med.medication_name}
                      onChange={(e) => updateMedication(index, 'medication_name', e.target.value)}
                      placeholder="e.g., Paracetamol"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Dosage *</Label>
                    <Input
                      value={med.dosage}
                      onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                      placeholder="e.g., 500mg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Frequency *</Label>
                    <Input
                      value={med.frequency}
                      onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                      placeholder="e.g., Twice daily"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Duration *</Label>
                    <Input
                      value={med.duration}
                      onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                      placeholder="e.g., 5 days"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Quantity *</Label>
                    <Input
                      type="number"
                      value={med.quantity}
                      onChange={(e) => updateMedication(index, 'quantity', parseInt(e.target.value) || 0)}
                      placeholder="10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Instructions</Label>
                    <Input
                      value={med.instructions}
                      onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                      placeholder="e.g., Take after meals"
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button
              type="button"
              onClick={addMedication}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Medication
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          <Save className="mr-2 h-4 w-4" />
          {loading ? 'Saving...' : 'Save Visit'}
        </Button>
      </div>
    </form>
  );
}
