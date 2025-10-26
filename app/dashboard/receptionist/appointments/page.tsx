'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import AppointmentBookingForm from '@/app/components/appointments/AppointmentBookingForm';
import AppointmentCard from '@/app/components/appointments/AppointmentCard';
import PatientSearchDialog from '@/app/components/patients/PatientSearchDialog';
import {
  Plus,
  Calendar,
  Clock,
  Users,
  Search,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import type { Appointment, Patient } from '@/app/types';

export default function ReceptionistAppointmentsPage() {
  const { user, hospitalId } = useAuth();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('today');
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, [hospitalId]);

  useEffect(() => {
    filterAppointments();
  }, [appointments, searchQuery, activeTab]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (hospitalId) params.append('hospital_id', hospitalId.toString());

      const response = await fetch(`/api/appointments?${params}`);
      if (!response.ok) throw new Error('Failed to fetch appointments');

      const data = await response.json();
      setAppointments(data.appointments || []);
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

  const filterAppointments = () => {
    let filtered = appointments;

    // Filter by tab
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayString = format(today, 'yyyy-MM-dd');

    switch (activeTab) {
      case 'today':
        filtered = filtered.filter((apt) => apt.appointment_date === todayString);
        break;
      case 'upcoming':
        filtered = filtered.filter(
          (apt) =>
            apt.appointment_date &&
            apt.appointment_date > todayString &&
            (apt.status === 'scheduled' || apt.status === 'confirmed')
        );
        break;
      case 'completed':
        filtered = filtered.filter((apt) => apt.status === 'completed');
        break;
      case 'cancelled':
        filtered = filtered.filter((apt) => apt.status === 'cancelled');
        break;
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (apt) =>
          apt.id?.toString().includes(query) ||
          (apt.patients &&
            `${apt.patients.first_name} ${apt.patients.last_name}`
              .toLowerCase()
              .includes(query)) ||
          (apt.patients && apt.patients.patient_number?.toLowerCase().includes(query)) ||
          apt.reason?.toLowerCase().includes(query)
      );
    }

    setFilteredAppointments(filtered);
  };

  const handleBookAppointment = () => {
    setPatientSearchOpen(true);
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setPatientSearchOpen(false);
    setBookingDialogOpen(true);
  };

  const handleCheckIn = async (appointment: Appointment) => {
    try {
      const response = await fetch(`/api/appointments/${appointment.id}/check-in`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to check in');
      }

      const data = await response.json();
      toast({
        title: 'Success',
        description: `Patient checked in. Visit ${data.visit.visit_number} created.`,
      });

      fetchAppointments();
    } catch (error) {
      console.error('Error checking in:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to check in patient',
        variant: 'destructive',
      });
    }
  };

  const handleCancelClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!selectedAppointment) return;

    try {
      const response = await fetch(`/api/appointments/${selectedAppointment.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cancellation_reason: cancellationReason || 'No reason provided',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel appointment');
      }

      toast({
        title: 'Success',
        description: 'Appointment cancelled successfully',
      });

      setCancelDialogOpen(false);
      setCancellationReason('');
      setSelectedAppointment(null);
      fetchAppointments();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to cancel appointment',
        variant: 'destructive',
      });
    }
  };

  const getStats = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayAppointments = appointments.filter(
      (apt) => apt.appointment_date === today
    );

    return {
      total: appointments.length,
      today: todayAppointments.length,
      scheduled: appointments.filter(
        (apt) => apt.status === 'scheduled' || apt.status === 'confirmed'
      ).length,
      completed: appointments.filter((apt) => apt.status === 'completed').length,
    };
  };

  const stats = getStats();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Appointments</h1>
          <p className="text-gray-600">Manage patient appointments</p>
        </div>
        <Button onClick={handleBookAppointment}>
          <Plus className="h-4 w-4 mr-2" />
          Book Appointment
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-gray-600">All appointments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Clock className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today}</div>
            <p className="text-xs text-gray-600">Appointments today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.scheduled}</div>
            <p className="text-xs text-gray-600">Pending appointments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-gray-600">Checked in</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search by patient name, ID, or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Appointments Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="today">
            Today
            <Badge className="ml-2">
              {
                appointments.filter(
                  (apt) => apt.appointment_date === format(new Date(), 'yyyy-MM-dd')
                ).length
              }
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="h-32 bg-gray-200 animate-pulse rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredAppointments.length > 0 ? (
            <div className="space-y-4">
              {filteredAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  onCheckIn={handleCheckIn}
                  onCancel={handleCancelClick}
                  showActions={true}
                  role="receptionist"
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No appointments found
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery
                    ? 'Try adjusting your search criteria'
                    : 'No appointments in this category'}
                </p>
                {!searchQuery && activeTab === 'today' && (
                  <Button onClick={handleBookAppointment}>
                    <Plus className="h-4 w-4 mr-2" />
                    Book Appointment
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Patient Search Dialog */}
      <PatientSearchDialog
        open={patientSearchOpen}
        onOpenChange={setPatientSearchOpen}
        onSelect={handlePatientSelect}
      />

      {/* Booking Dialog */}
      {selectedPatient && hospitalId && (
        <AppointmentBookingForm
          open={bookingDialogOpen}
          onOpenChange={setBookingDialogOpen}
          patient={selectedPatient}
          doctorId="1"
          doctorName="Dr. Smith"
          hospitalId={hospitalId.toString()}
          onSuccess={() => {
            setSelectedPatient(null);
            fetchAppointments();
          }}
        />
      )}

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to cancel this appointment?
            </p>
            <div className="space-y-2">
              <Label htmlFor="cancellation_reason">Cancellation Reason</Label>
              <Textarea
                id="cancellation_reason"
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Enter reason for cancellation..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setCancelDialogOpen(false)}>
                Keep Appointment
              </Button>
              <Button onClick={handleCancelConfirm} className="bg-red-600 hover:bg-red-700 text-white">
                <XCircle className="h-4 w-4 mr-2" />
                Cancel Appointment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}