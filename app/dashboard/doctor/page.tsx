'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/DashboardLayout';
import DoctorAppointmentsWidget from '@/app/components/appointments/DoctorAppointmentsWidget';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, FileText, Calendar, Activity, TrendingUp, Pill } from 'lucide-react';
import { format } from 'date-fns';
import type { Visit, Prescription, Patient } from '@/app/types';

export default function DoctorDashboard() {
  const { user, token, hospitalId, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayVisits: 0,
    totalVisits: 0,
    totalPrescriptions: 0,
    pendingPrescriptions: 0,
  });
  const [recentVisits, setRecentVisits] = useState<Visit[]>([]);
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
      const today = format(new Date(), 'yyyy-MM-dd');

      // Fetch visits for this doctor
      const visitsParams = new URLSearchParams({
        hospital_id: hospitalId!.toString(),
        doctor_id: user!.id.toString(),
      });
      const visitsResponse = await fetch(`/api/visits?${visitsParams}`);
      if (visitsResponse.ok) {
        const visitsData = await visitsResponse.json();
        const visits = visitsData.visits || [];
        
        // Count unique patients
        const uniquePatients = new Set(visits.map((v: Visit) => v.patient_id));
        
        // Count today's visits
        const todayVisits = visits.filter((v: Visit) => 
          v.visit_date && v.visit_date.startsWith(today)
        );

        setRecentVisits(visits.slice(0, 5));
        
        // Fetch prescriptions
        const presParams = new URLSearchParams({
          hospital_id: hospitalId!.toString(),
          doctor_id: user!.id.toString(),
        });
        const presResponse = await fetch(`/api/prescriptions?${presParams}`);
        if (presResponse.ok) {
          const presData = await presResponse.json();
          const prescriptions = presData.prescriptions || [];
          const pendingPres = prescriptions.filter(
            (p: Prescription) => p.status === 'pending'
          );

          setStats({
            totalPatients: uniquePatients.size,
            todayVisits: todayVisits.length,
            totalVisits: visits.length,
            totalPrescriptions: prescriptions.length,
            pendingPrescriptions: pendingPres.length,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setStatsLoading(false);
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
      title="Doctor Dashboard"
      description={`Welcome back, Dr. ${user.last_name}`}
      role="doctor"
    >
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">My Patients</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatients}</div>
            <p className="text-xs text-gray-600 mt-1">Total patients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Today's Visits</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayVisits}</div>
            <p className="text-xs text-gray-600 mt-1">Scheduled today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Visits</CardTitle>
            <Activity className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVisits}</div>
            <p className="text-xs text-gray-600 mt-1">All consultations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Prescriptions</CardTitle>
            <Pill className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingPrescriptions}</div>
            <p className="text-xs text-gray-600 mt-1">Pending / {stats.totalPrescriptions} total</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Appointments Widget */}
        <DoctorAppointmentsWidget
          doctorId={user.id.toString()}
          hospitalId={hospitalId.toString()}
        />

        {/* Recent Visits */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Visits
              </CardTitle>
              <Button
                onClick={() => router.push('/dashboard/doctor/visits')}
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
            ) : recentVisits.length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {recentVisits.map((visit) => (
                  <div
                    key={visit.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold">
                          {visit.patients
                            ? `${visit.patients.first_name} ${visit.patients.last_name}`
                            : 'Unknown Patient'}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {visit.visit_number || 'N/A'}
                        </p>
                      </div>
                      <span className="text-sm text-gray-600">
                        {visit.visit_date
                          ? format(new Date(visit.visit_date), 'MMM dd, yyyy')
                          : 'N/A'}
                      </span>
                    </div>
                    {visit.chief_complaint && (
                      <p className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Complaint: </span>
                        {visit.chief_complaint}
                      </p>
                    )}
                    {visit.diagnosis && (
                      <div className="text-sm bg-blue-50 p-2 rounded">
                        <span className="font-medium">Diagnosis: </span>
                        {visit.diagnosis}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-600">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No recent visits</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
          <Button
            onClick={() => router.push('/dashboard/doctor/visits')}
            className="justify-start"
          >
            <FileText className="mr-2 h-4 w-4" />
            Record New Visit
          </Button>
          <Button
            onClick={() => router.push('/dashboard/doctor/patients')}
            className="justify-start"
          >
            <Users className="mr-2 h-4 w-4" />
            View All Patients
          </Button>
          <Button
            onClick={() => router.push('/dashboard/doctor/prescriptions')}
            className="justify-start"
          >
            <Pill className="mr-2 h-4 w-4" />
            View Prescriptions
          </Button>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
