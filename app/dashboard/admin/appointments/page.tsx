'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import AppointmentCard from '@/app/components/appointments/AppointmentCard';
import {
  Calendar,
  Clock,
  Users,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Download,
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';
import type { Appointment } from '@/app/types';

export default function AdminAppointmentsPage() {
  const { hospitalId } = useAuth();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchAppointments();
  }, [hospitalId]);

  useEffect(() => {
    filterAppointments();
  }, [appointments, searchQuery, statusFilter, dateRange, activeTab]);

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

    // Filter by date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayString = format(today, 'yyyy-MM-dd');

    if (dateRange !== 'all') {
      let startDate: Date;
      let endDate: Date;

      switch (dateRange) {
        case 'today':
          filtered = filtered.filter((apt) => apt.appointment_date === todayString);
          break;
        case 'this_week':
          startDate = startOfWeek(today);
          endDate = endOfWeek(today);
          filtered = filtered.filter(
            (apt) =>
              apt.appointment_date &&
              apt.appointment_date >= format(startDate, 'yyyy-MM-dd') &&
              apt.appointment_date <= format(endDate, 'yyyy-MM-dd')
          );
          break;
        case 'this_month':
          startDate = startOfMonth(today);
          endDate = endOfMonth(today);
          filtered = filtered.filter(
            (apt) =>
              apt.appointment_date &&
              apt.appointment_date >= format(startDate, 'yyyy-MM-dd') &&
              apt.appointment_date <= format(endDate, 'yyyy-MM-dd')
          );
          break;
        case 'last_7_days':
          startDate = subDays(today, 7);
          filtered = filtered.filter(
            (apt) =>
              apt.appointment_date &&
              apt.appointment_date >= format(startDate, 'yyyy-MM-dd') &&
              apt.appointment_date <= todayString
          );
          break;
      }
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((apt) => apt.status === statusFilter);
    }

    // Filter by tab
    switch (activeTab) {
      case 'upcoming':
        filtered = filtered.filter(
          (apt) =>
            apt.appointment_date &&
            apt.appointment_date >= todayString &&
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
          (apt.users &&
            `${apt.users.first_name} ${apt.users.last_name}`
              .toLowerCase()
              .includes(query)) ||
          apt.reason?.toLowerCase().includes(query)
      );
    }

    setFilteredAppointments(filtered);
  };

  const getStats = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const thisWeekStart = format(startOfWeek(new Date()), 'yyyy-MM-dd');
    const thisWeekEnd = format(endOfWeek(new Date()), 'yyyy-MM-dd');

    return {
      total: appointments.length,
      today: appointments.filter((apt) => apt.appointment_date === today).length,
      thisWeek: appointments.filter(
        (apt) =>
          apt.appointment_date &&
          apt.appointment_date >= thisWeekStart &&
          apt.appointment_date <= thisWeekEnd
      ).length,
      scheduled: appointments.filter(
        (apt) => apt.status === 'scheduled' || apt.status === 'confirmed'
      ).length,
      completed: appointments.filter((apt) => apt.status === 'completed').length,
      cancelled: appointments.filter((apt) => apt.status === 'cancelled').length,
      noShow: appointments.filter((apt) => apt.status === 'no_show').length,
    };
  };

  const handleExport = () => {
    // Export appointments to CSV
    const csv = [
      [
        'ID',
        'Date',
        'Time',
        'Patient',
        'Patient Number',
        'Doctor',
        'Status',
        'Reason',
        'Notes',
        'Cancellation Reason',
      ],
      ...filteredAppointments.map((apt) => [
        apt.id,
        apt.appointment_date,
        apt.appointment_time,
        apt.patients
          ? `${apt.patients.first_name} ${apt.patients.last_name}`
          : 'N/A',
        apt.patients?.patient_number || 'N/A',
        apt.users ? `${apt.users.first_name} ${apt.users.last_name}` : 'N/A',
        apt.status,
        apt.reason || '',
        apt.notes || '',
        apt.cancellation_reason || '',
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `appointments-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Success',
      description: `Exported ${filteredAppointments.length} appointments`,
    });
  };

  const stats = getStats();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Appointments Management</h1>
          <p className="text-gray-600">Comprehensive appointment analytics and management</p>
        </div>
        <Button onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-gray-600">All time</p>
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
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisWeek}</div>
            <p className="text-xs text-gray-600">Appointments this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.scheduled}</div>
            <p className="text-xs text-gray-600">Pending appointments</p>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-gray-600" />
              <div>
                <div className="text-2xl font-bold">{stats.completed}</div>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold">{stats.cancelled}</div>
                <p className="text-sm text-gray-600">Cancelled</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">{stats.noShow}</div>
                <p className="text-sm text-gray-600">No Show</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{stats.scheduled}</div>
                <p className="text-sm text-gray-600">Scheduled</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search appointments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="no_show">No Show</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue placeholder="All Dates" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="this_week">This Week</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="last_7_days">Last 7 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            All
            <Badge className="ml-2">{appointments.length}</Badge>
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
                  showActions={false}
                  role="admin"
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
                <p className="text-gray-600">
                  {searchQuery || statusFilter !== 'all' || dateRange !== 'all'
                    ? 'Try adjusting your filters'
                    : 'No appointments to display'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
