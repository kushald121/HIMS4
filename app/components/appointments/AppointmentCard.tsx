'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  User,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import type { Appointment } from '@/app/types';

interface AppointmentCardProps {
  appointment: Appointment & {
    patients?: any;
    doctors?: any;
  };
  onCheckIn?: (appointment: Appointment) => void;
  onCancel?: (appointment: Appointment) => void;
  onReschedule?: (appointment: Appointment) => void;
  onView?: (appointment: Appointment) => void;
  showActions?: boolean;
  role?: 'receptionist' | 'doctor' | 'admin';
}

export default function AppointmentCard({
  appointment,
  onCheckIn,
  onCancel,
  onReschedule,
  onView,
  showActions = true,
  role = 'receptionist',
}: AppointmentCardProps) {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      no_show: 'bg-orange-100 text-orange-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const canCheckIn = () => {
    return (
      role === 'receptionist' &&
      (appointment.status === 'scheduled' || appointment.status === 'confirmed')
    );
  };

  const canCancel = () => {
    return (
      appointment.status !== 'completed' &&
      appointment.status !== 'cancelled'
    );
  };

  const canReschedule = () => {
    return (
      appointment.status === 'scheduled' ||
      appointment.status === 'confirmed'
    );
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Main Content */}
          <div className="flex-1 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(appointment.status)}>
                  {getStatusIcon(appointment.status)}
                  <span className="ml-1 capitalize">
                    {appointment.status.replace('_', ' ')}
                  </span>
                </Badge>
              </div>
              <span className="text-xs text-gray-500">
                ID: {appointment.id}
              </span>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-600" />
                <div>
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="text-sm font-medium">
                    {appointment.appointment_date &&
                      format(new Date(appointment.appointment_date), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-600" />
                <div>
                  <p className="text-xs text-gray-500">Time</p>
                  <p className="text-sm font-medium">
                    {appointment.appointment_time}
                  </p>
                </div>
              </div>
            </div>

            {/* Patient Info */}
            {appointment.patients && (
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-gray-600 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Patient</p>
                  <p className="text-sm font-medium">
                    {appointment.patients.first_name}{' '}
                    {appointment.patients.last_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {appointment.patients.patient_number}
                  </p>
                  {appointment.patients.contact_number && (
                    <p className="text-xs text-gray-500">
                      {appointment.patients.contact_number}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Doctor Info */}
            {appointment.doctors && role !== 'doctor' && (
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-gray-600 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Doctor</p>
                  <p className="text-sm font-medium">
                    Dr. {appointment.doctors.first_name}{' '}
                    {appointment.doctors.last_name}
                  </p>
                </div>
              </div>
            )}

            {/* Reason */}
            {appointment.reason && (
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-gray-600 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Reason</p>
                  <p className="text-sm">{appointment.reason}</p>
                </div>
              </div>
            )}

            {/* Cancellation Reason */}
            {appointment.status === 'cancelled' &&
              appointment.cancellation_reason && (
                <div className="bg-red-50 border border-red-200 rounded p-2">
                  <p className="text-xs font-semibold text-red-800">
                    Cancellation Reason:
                  </p>
                  <p className="text-sm text-red-700">
                    {appointment.cancellation_reason}
                  </p>
                </div>
              )}
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex flex-col gap-2">
              {canCheckIn() && onCheckIn && (
                <Button
                  onClick={() => onCheckIn(appointment)}
                  className="text-xs whitespace-nowrap"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Check In
                </Button>
              )}
              {canReschedule() && onReschedule && (
                <Button
                  onClick={() => onReschedule(appointment)}
                  className="text-xs whitespace-nowrap border"
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  Reschedule
                </Button>
              )}
              {canCancel() && onCancel && (
                <Button
                  onClick={() => onCancel(appointment)}
                  className="text-xs whitespace-nowrap border"
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
              )}
              {onView && (
                <Button
                  onClick={() => onView(appointment)}
                  className="text-xs whitespace-nowrap border"
                >
                  <FileText className="h-3 w-3 mr-1" />
                  View
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
