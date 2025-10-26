'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, User, Phone, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { Appointment } from '@/app/types';
import { useToast } from '@/hooks/use-toast';

interface DoctorAppointmentsWidgetProps {
  doctorId: string;
  hospitalId: string;
}

export default function DoctorAppointmentsWidget({
  doctorId,
  hospitalId,
}: DoctorAppointmentsWidgetProps) {
  const { toast } = useToast();
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'today' | 'upcoming'>('today');

  useEffect(() => {
    fetchAppointments();
    // Refresh every 5 minutes
    const interval = setInterval(fetchAppointments, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [doctorId, hospitalId]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Fetch today's appointments
      const todayParams = new URLSearchParams({
        hospital_id: hospitalId,
        doctor_id: doctorId,
        date: today,
      });
      const todayResponse = await fetch(`/api/appointments?${todayParams}`);
      if (!todayResponse.ok) throw new Error('Failed to fetch today appointments');
      const todayData = await todayResponse.json();
      
      // Fetch upcoming appointments (next 7 days)
      const upcomingParams = new URLSearchParams({
        hospital_id: hospitalId,
        doctor_id: doctorId,
        status: 'scheduled,confirmed',
      });
      const upcomingResponse = await fetch(`/api/appointments?${upcomingParams}`);
      if (!upcomingResponse.ok) throw new Error('Failed to fetch upcoming appointments');
      const upcomingData = await upcomingResponse.json();

      setTodayAppointments(todayData.appointments || []);
      
      // Filter upcoming to exclude today and sort by date
      const upcoming = (upcomingData.appointments || [])
        .filter((apt: Appointment) => apt.appointment_date && apt.appointment_date > today)
        .sort((a: Appointment, b: Appointment) => {
          const dateA = `${a.appointment_date} ${a.appointment_time}`;
          const dateB = `${b.appointment_date} ${b.appointment_time}`;
          return dateA.localeCompare(dateB);
        })
        .slice(0, 5); // Show next 5 appointments

      setUpcomingAppointments(upcoming);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load appointments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no_show':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (time: string | undefined) => {
    if (!time) return 'N/A';
    try {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return time;
    }
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return 'N/A';
    try {
      return format(parseISO(date), 'MMM dd, yyyy');
    } catch {
      return date;
    }
  };

  const appointments = activeView === 'today' ? todayAppointments : upcomingAppointments;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Appointments
          </CardTitle>
          <div className="flex gap-2">
            <Button
              onClick={() => setActiveView('today')}
              className={activeView === 'today' ? '' : 'bg-gray-200 text-gray-700'}
            >
              Today
              <Badge className="ml-2">{todayAppointments.length}</Badge>
            </Button>
            <Button
              onClick={() => setActiveView('upcoming')}
              className={activeView === 'upcoming' ? '' : 'bg-gray-200 text-gray-700'}
            >
              Upcoming
              <Badge className="ml-2">{upcomingAppointments.length}</Badge>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 animate-pulse rounded" />
            ))}
          </div>
        ) : appointments.length > 0 ? (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-600" />
                    <div>
                      <h4 className="font-semibold">
                        {appointment.patients
                          ? `${appointment.patients.first_name} ${appointment.patients.last_name}`
                          : 'Unknown Patient'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {appointment.patients?.patient_number || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(appointment.status || 'scheduled')}>
                    {(appointment.status || 'scheduled').replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-2">
                  {activeView === 'upcoming' && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(appointment.appointment_date)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatTime(appointment.appointment_time)}</span>
                  </div>
                  {appointment.patients?.contact_number && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      <span>{appointment.patients.contact_number}</span>
                    </div>
                  )}
                </div>

                {appointment.reason && (
                  <div className="text-sm bg-gray-50 p-2 rounded mb-2">
                    <span className="font-medium">Reason: </span>
                    {appointment.reason}
                  </div>
                )}

                {appointment.notes && (
                  <div className="text-sm text-gray-600 italic">
                    Note: {appointment.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600">
              {activeView === 'today'
                ? 'No appointments scheduled for today'
                : 'No upcoming appointments'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
