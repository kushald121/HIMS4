'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PatientSearchDialog from '@/app/components/patients/PatientSearchDialog';
import { 
  Users, 
  Calendar, 
  UserPlus, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Plus 
} from 'lucide-react';
import { format, startOfMonth } from 'date-fns';
import type { Appointment, Patient } from '@/app/types';

export default function ReceptionistDashboard() {
  const { user, token, hospitalId, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    pendingCheckIns: 0,
    completedToday: 0,
    newPatientsThisMonth: 0,
  });
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);

  useEffect(() => {
    if (hospitalId) {
      fetchDashboardData();
    }
  }, [hospitalId]);

  const fetchDashboardData = async () => {
    try {
      setStatsLoading(true);
      const today = format(new Date(), 'yyyy-MM-dd');
      const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');

      // Fetch patients
      const patientsParams = new URLSearchParams();
      if (hospitalId) patientsParams.append('hospital_id', hospitalId.toString());
      
      const patientsResponse = await fetch(`/api/patients?${patientsParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-hospital-id': hospitalId!.toString()
        }
      });
      if (patientsResponse.ok) {
        const patientsData = await patientsResponse.json();
        const patients = patientsData.patients || [];
        
        // Count new patients this month
        const newThisMonth = patients.filter((p: Patient) => 
          p.created_at && p.created_at >= monthStart
        );

        // Fetch today's appointments
        const aptParams = new URLSearchParams({
          hospital_id: hospitalId!.toString(),
          date: today,
        });
        const aptResponse = await fetch(`/api/appointments?${aptParams}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-hospital-id': hospitalId!.toString()
          }
        });
        if (aptResponse.ok) {
          const aptData = await aptResponse.json();
          const appointments = aptData.appointments || [];
          
          const pendingCheckIns = appointments.filter(
            (a: Appointment) => a.status === 'scheduled' || a.status === 'confirmed'
          );
          const completedToday = appointments.filter(
            (a: Appointment) => a.status === 'completed'
          );

          setTodayAppointments(appointments.slice(0, 5));
          setStats({
            totalPatients: patients.length,
            todayAppointments: appointments.length,
            pendingCheckIns: pendingCheckIns.length,
            completedToday: completedToday.length,
            newPatientsThisMonth: newThisMonth.length,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handlePatientRegister = () => {
    router.push('/dashboard/receptionist/patients');
  };

  const handleCheckIn = async (appointmentId: number) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}/check-in`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-hospital-id': hospitalId!.toString()
        }
      });

      if (response.ok) {
        fetchDashboardData(); // Refresh data
      }
    } catch (error) {
      console.error('Error checking in:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
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

  return (
    <DashboardLayout
      title="Receptionist Dashboard"
      description="Manage patient registration and appointments"
      role="receptionist"
    >
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatients}</div>
            <p className="text-xs text-gray-600 mt-1">Registered patients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Today's Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayAppointments}</div>
            <p className="text-xs text-gray-600 mt-1">Scheduled today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Check-Ins</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingCheckIns}</div>
            <p className="text-xs text-gray-600 mt-1">Awaiting check-in</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">New This Month</CardTitle>
            <UserPlus className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newPatientsThisMonth}</div>
            <p className="text-xs text-gray-600 mt-1">New registrations</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Today's Check-In Queue */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Today's Check-In Queue
              </CardTitle>
              <Button
                onClick={() => router.push('/dashboard/receptionist/appointments')}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-24 bg-gray-200 animate-pulse rounded" />
                ))}
              </div>
            ) : todayAppointments.length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {todayAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold">
                          {appointment.patients
                            ? `${appointment.patients.first_name} ${appointment.patients.last_name}`
                            : 'Unknown Patient'}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {appointment.patients?.patient_number || 'N/A'}
                        </p>
                      </div>
                      <Badge className={getStatusColor(appointment.status || 'scheduled')}>
                        {(appointment.status || 'scheduled').replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatTime(appointment.appointment_time)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>
                          {appointment.users
                            ? `Dr. ${appointment.users.last_name}`
                            : 'N/A'}
                        </span>
                      </div>
                    </div>

                    {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
                      <Button
                        onClick={() => handleCheckIn(appointment.id!)}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Check In Patient
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-600">
                <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No appointments today</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={handlePatientRegister}
              className="w-full justify-start h-auto py-4"
            >
              <UserPlus className="mr-3 h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Register New Patient</div>
                <div className="text-xs opacity-90">Add a new patient to the system</div>
              </div>
            </Button>

            <Button
              onClick={() => router.push('/dashboard/receptionist/appointments')}
              className="w-full justify-start h-auto py-4"
            >
              <Calendar className="mr-3 h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Book Appointment</div>
                <div className="text-xs opacity-90">Schedule a new patient appointment</div>
              </div>
            </Button>

            <Button
              onClick={() => router.push('/dashboard/receptionist/patients')}
              className="w-full justify-start h-auto py-4"
            >
              <Users className="mr-3 h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">View All Patients</div>
                <div className="text-xs opacity-90">Search and manage patient records</div>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Patient Search Dialog */}
      <PatientSearchDialog
        open={patientSearchOpen}
        onOpenChange={setPatientSearchOpen}
        onSelect={(patient) => {
          setPatientSearchOpen(false);
          // Handle patient selection if needed
        }}
      />
    </DashboardLayout>
  );
}