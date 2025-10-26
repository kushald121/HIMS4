'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar as CalendarIcon, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import type { Patient } from '@/app/types';

const appointmentSchema = z.object({
  appointment_date: z.string().min(1, 'Date is required'),
  appointment_time: z.string().min(1, 'Time slot is required'),
  reason: z.string().min(3, 'Reason must be at least 3 characters'),
  notes: z.string().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface AppointmentBookingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient;
  doctorId: string;
  doctorName: string;
  hospitalId: string;
  onSuccess?: () => void;
}

interface TimeSlot {
  value: string;
  label: string;
  available: boolean;
}

export default function AppointmentBookingForm({
  open,
  onOpenChange,
  patient,
  doctorId,
  doctorName,
  hospitalId,
  onSuccess,
}: AppointmentBookingFormProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
  });

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedDate]);

  const fetchAvailableSlots = async () => {
    if (!selectedDate) return;

    try {
      setLoadingSlots(true);
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      const response = await fetch(
        `/api/appointments/available-slots?doctor_id=${doctorId}&date=${dateString}`
      );

      if (!response.ok) throw new Error('Failed to fetch available slots');

      const data = await response.json();
      setAvailableSlots(data.slots || []);
    } catch (error) {
      console.error('Error fetching slots:', error);
      toast({
        title: 'Error',
        description: 'Failed to load available time slots',
        variant: 'destructive',
      });
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSlotSelect = (slot: string) => {
    setSelectedSlot(slot);
    setValue('appointment_time', slot);
  };

  const onSubmit = async (data: AppointmentFormData) => {
    try {
      setLoading(true);

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospital_id: hospitalId,
          patient_id: patient.id,
          doctor_id: doctorId,
          appointment_date: data.appointment_date,
          appointment_time: data.appointment_time,
          reason: data.reason,
          notes: data.notes || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to book appointment');
      }

      toast({
        title: 'Success',
        description: 'Appointment booked successfully',
      });

      reset();
      setSelectedDate(undefined);
      setSelectedSlot('');
      setAvailableSlots([]);
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to book appointment',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedSlot('');
    if (date) {
      setValue('appointment_date', format(date, 'yyyy-MM-dd'));
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book Appointment</DialogTitle>
          <DialogDescription>
            Schedule an appointment for {patient.first_name} {patient.last_name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Patient & Doctor Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-semibold">Patient:</span>
              <span className="text-sm">
                {patient.first_name} {patient.last_name} ({patient.patient_number})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-semibold">Doctor:</span>
              <span className="text-sm">{doctorName}</span>
            </div>
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Select Date
            </Label>
            <div className="border rounded-lg p-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={(date) => date < today}
                className="mx-auto"
              />
            </div>
            {errors.appointment_date && (
              <p className="text-sm text-red-500">{errors.appointment_date.message}</p>
            )}
          </div>

          {/* Time Slot Selection */}
          {selectedDate && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Select Time Slot
              </Label>
              {loadingSlots ? (
                <div className="grid grid-cols-4 gap-2">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-10 bg-gray-200 animate-pulse rounded" />
                  ))}
                </div>
              ) : availableSlots.length > 0 ? (
                <div className="grid grid-cols-4 gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.value}
                      type="button"
                      onClick={() => handleSlotSelect(slot.value)}
                      className={`p-2 border rounded text-sm transition-colors ${
                        selectedSlot === slot.value
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white hover:bg-blue-50 border-gray-300'
                      }`}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No available slots for this date</p>
                  <p className="text-sm">Please select another date</p>
                </div>
              )}
              {errors.appointment_time && (
                <p className="text-sm text-red-500">{errors.appointment_time.message}</p>
              )}
            </div>
          )}

          {/* Selected Appointment Summary */}
          {selectedDate && selectedSlot && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-blue-900 mb-2">
                Appointment Summary
              </p>
              <div className="text-sm text-blue-800 space-y-1">
                <p>
                  <strong>Date:</strong> {format(selectedDate, 'EEEE, MMMM dd, yyyy')}
                </p>
                <p>
                  <strong>Time:</strong>{' '}
                  {availableSlots.find((s) => s.value === selectedSlot)?.label}
                </p>
              </div>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">
              Reason for Visit <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reason"
              {...register('reason')}
              placeholder="e.g., Regular checkup, Follow-up consultation, Specific symptoms..."
              rows={3}
            />
            {errors.reason && (
              <p className="text-sm text-red-500">{errors.reason.message}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Any additional information..."
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !selectedDate || !selectedSlot}
            >
              {loading ? 'Booking...' : 'Book Appointment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
