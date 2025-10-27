'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Package, 
  Activity, 
  AlertCircle,
  Calendar,
  TrendingUp,
  FileText,
  Pill,
  UserCheck,
  ClipboardList,
  UserCog
} from 'lucide-react';
import { format, startOfMonth, subMonths } from 'date-fns';
import type { Patient, Appointment, Visit, Prescription, Inventory } from '@/app/types';

export default function AdminDashboard() {
  const { user, token, hospitalId, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalPatients: 0,
    newPatientsThisMonth: 0,
    totalAppointments: 0,
    appointmentsToday: 0,
    totalVisits: 0,
    visitsThisMonth: 0,
    totalPrescriptions: 0,
    pendingPrescriptions: 0,
    totalInventory: 0,
    lowStockItems: 0,
    outOfStock: 0,
    totalStaff: 0,
    activeStaff: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!user || !hospitalId)) {
      router.push('/dashboard');
    }
    if (user && hospitalId) {
      fetchDashboardData();
    }
  }, [user, hospitalId, loading]);

  const fetchDashboardData = async () => {
    try {
      setStatsLoading(true);
      
      // Ensure we have token and hospitalId before making API calls
      if (!token || !hospitalId) {
        console.error('Missing token or hospitalId');
        return;
      }
      
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
        
        const newThisMonth = patients.filter((p: Patient) =>
          p.created_at && p.created_at >= monthStart
        );

        // Fetch appointments
        const aptParams = new URLSearchParams();
        if (hospitalId) aptParams.append('hospital_id', hospitalId.toString());
        
        const aptResponse = await fetch(`/api/appointments?${aptParams}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-hospital-id': hospitalId!.toString()
          }
        });
        if (aptResponse.ok) {
          const aptData = await aptResponse.json();
          const appointments = aptData.appointments || [];
          
          const aptToday = appointments.filter(
            (a: Appointment) => a.appointment_date === today
          );
          
          const upcoming = appointments
            .filter(
              (a: Appointment) =>
                a.appointment_date &&
                a.appointment_date >= today &&
                (a.status === 'scheduled' || a.status === 'confirmed')
            )
            .sort((a: Appointment, b: Appointment) =>
              `${a.appointment_date} ${a.appointment_time}`.localeCompare(
                `${b.appointment_date} ${b.appointment_time}`
              )
            )
            .slice(0, 5);

          setUpcomingAppointments(upcoming);

          // Fetch visits
          const visitsParams = new URLSearchParams();
          if (hospitalId) visitsParams.append('hospital_id', hospitalId.toString());
          
          const visitsResponse = await fetch(`/api/visits?${visitsParams}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'x-hospital-id': hospitalId!.toString()
            }
          });
          if (visitsResponse.ok) {
            const visitsData = await visitsResponse.json();
            const visits = visitsData.visits || [];
            
            const visitsThisMonth = visits.filter((v: Visit) =>
              v.visit_date && v.visit_date >= monthStart
            );

            // Fetch prescriptions
            const presParams = new URLSearchParams();
            if (hospitalId) presParams.append('hospital_id', hospitalId.toString());
            
            const presResponse = await fetch(`/api/prescriptions?${presParams}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'x-hospital-id': hospitalId!.toString()
              }
            });
            if (presResponse.ok) {
              const presData = await presResponse.json();
              const prescriptions = presData.prescriptions || [];
              
              const pendingPres = prescriptions.filter(
                (p: Prescription) => p.status === 'pending'
              );

              // Fetch inventory
              const invParams = new URLSearchParams();
              if (hospitalId) invParams.append('hospital_id', hospitalId.toString());
              
              const invResponse = await fetch(`/api/inventory?${invParams}`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'x-hospital-id': hospitalId!.toString()
                }
              });
              if (invResponse.ok) {
                const invData = await invResponse.json();
                const inventory = invData.medications || [];
                
                const lowStock = inventory.filter(
                  (item: Inventory) =>
                    (item.quantity_in_stock ?? item.current_stock) <= (item.reorder_level ?? item.minimum_stock)
                );
                const outOfStock = inventory.filter(
                  (item: Inventory) => (item.quantity_in_stock ?? item.current_stock) === 0
                );

                // Fetch staff
                const staffParams = new URLSearchParams();
                if (hospitalId) staffParams.append('hospital_id', hospitalId.toString());
                
                const staffResponse = await fetch(`/api/staff?${staffParams}`, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-hospital-id': hospitalId!.toString()
                  }
                });
                
                let totalStaff = 0;
                let activeStaff = 0;
                
                if (staffResponse.ok) {
                  const staffData = await staffResponse.json();
                  const staff = staffData.staff || [];
                  totalStaff = staff.length;
                  activeStaff = staff.filter((s: any) => s.is_active).length;
                }

                // Build recent activity
                const activity = [
                  ...appointments.slice(0, 3).map((a: Appointment) => ({
                    type: 'appointment',
                    message: `New appointment for ${a.patients?.first_name} ${a.patients?.last_name}`,
                    time: a.created_at,
                    icon: 'calendar',
                  })),
                  ...visits.slice(0, 2).map((v: Visit) => ({
                    type: 'visit',
                    message: `Visit recorded: ${v.visit_number}`,
                    time: v.created_at,
                    icon: 'activity',
                  })),
                ].sort((a, b) => (b.time || '').localeCompare(a.time || '')).slice(0, 5);

                setRecentActivity(activity);

                setStats({
                  totalPatients: patients.length,
                  newPatientsThisMonth: newThisMonth.length,
                  totalAppointments: appointments.length,
                  appointmentsToday: aptToday.length,
                  totalVisits: visits.length,
                  visitsThisMonth: visitsThisMonth.length,
                  totalPrescriptions: prescriptions.length,
                  pendingPrescriptions: pendingPres.length,
                  totalInventory: inventory.length,
                  lowStockItems: lowStock.length,
                  outOfStock: outOfStock.length,
                  totalStaff,
                  activeStaff,
                });
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setStatsLoading(false);
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

  if (loading || !user || !hospitalId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <DashboardLayout
      title="Admin Dashboard"
      description={`Hospital Overview - ${format(new Date(), 'MMMM dd, yyyy')}`}
      role="admin"
    >
      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Patients</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatients}</div>
            <p className="text-xs text-green-600 mt-1">
              +{stats.newPatientsThisMonth} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Staff</CardTitle>
            <UserCog className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStaff}</div>
            <p className="text-xs text-gray-600 mt-1">
              {stats.activeStaff} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAppointments}</div>
            <p className="text-xs text-gray-600 mt-1">
              {stats.appointmentsToday} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Visits</CardTitle>
            <Activity className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVisits}</div>
            <p className="text-xs text-gray-600 mt-1">
              {stats.visitsThisMonth} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Inventory</CardTitle>
            <Package className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInventory}</div>
            <p className="text-xs text-red-600 mt-1">
              {stats.lowStockItems} low stock
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Prescriptions</CardTitle>
            <Pill className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPrescriptions}</div>
            <p className="text-xs text-orange-600 mt-1">
              {stats.pendingPrescriptions} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Stock Alerts</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.lowStockItems}</div>
            <p className="text-xs text-gray-600 mt-1">
              {stats.outOfStock} out of stock
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +{stats.newPatientsThisMonth}
            </div>
            <p className="text-xs text-gray-600 mt-1">New patients this month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Appointments
              </CardTitle>
              <Button
                onClick={() => router.push('/dashboard/admin/appointments')}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 animate-pulse rounded" />
                ))}
              </div>
            ) : upcomingAppointments.length > 0 ? (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {upcomingAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="border rounded-lg p-3 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">
                          {appointment.patients
                            ? `${appointment.patients.first_name} ${appointment.patients.last_name}`
                            : 'Unknown'}
                        </h4>
                        <p className="text-xs text-gray-600">
                          {appointment.users ? `Dr. ${appointment.users.last_name}` : 'N/A'}
                        </p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800 text-xs">
                        {appointment.status?.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {appointment.appointment_date
                          ? format(new Date(appointment.appointment_date), 'MMM dd')
                          : 'N/A'}
                      </span>
                      <span>•</span>
                      <span>{formatTime(appointment.appointment_time)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-600">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p className="text-sm">No upcoming appointments</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 animate-pulse rounded" />
                ))}
              </div>
            ) : recentActivity.length > 0 ? (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="mt-1">
                      {activity.icon === 'calendar' ? (
                        <Calendar className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Activity className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.message}</p>
                      <p className="text-xs text-gray-600">
                        {activity.time
                          ? format(new Date(activity.time), 'MMM dd, HH:mm')
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-600">
                <ClipboardList className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p className="text-sm">No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Management</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-4 gap-4">
          <Button
            onClick={() => router.push('/dashboard/admin/patients')}
            className="justify-start h-auto py-4"
          >
            <Users className="mr-3 h-5 w-5" />
            <div className="text-left">
              <div className="font-semibold">Patients</div>
              <div className="text-xs opacity-90">{stats.totalPatients} registered</div>
            </div>
          </Button>
          <Button
            onClick={() => router.push('/dashboard/admin/staff')}
            className="justify-start h-auto py-4 bg-indigo-600 hover:bg-indigo-700"
          >
            <UserCog className="mr-3 h-5 w-5" />
            <div className="text-left">
              <div className="font-semibold">Staff</div>
              <div className="text-xs opacity-90">{stats.totalStaff} members</div>
            </div>
          </Button>
          <Button
            onClick={() => router.push('/dashboard/admin/appointments')}
            className="justify-start h-auto py-4"
          >
            <Calendar className="mr-3 h-5 w-5" />
            <div className="text-left">
              <div className="font-semibold">Appointments</div>
              <div className="text-xs opacity-90">{stats.totalAppointments} total</div>
            </div>
          </Button>
          <Button
            onClick={() => router.push('/dashboard/admin/inventory')}
            className="justify-start h-auto py-4"
          >
            <Package className="mr-3 h-5 w-5" />
            <div className="text-left">
              <div className="font-semibold">Inventory</div>
              <div className="text-xs opacity-90">{stats.totalInventory} items</div>
            </div>
          </Button>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
