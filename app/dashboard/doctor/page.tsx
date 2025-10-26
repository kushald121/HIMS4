'use client';

import { useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, FileText, Calendar } from 'lucide-react';

export default function DoctorDashboard() {
  const { user, token, hospitalId, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !hospitalId)) {
      router.push('/dashboard');
    }
  }, [user, hospitalId, loading, router]);

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
      description="Manage your patients and consultations"
      role="doctor"
    >
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">My Patients</CardTitle>
            <Users className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-gray-600 mt-1">Total patients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Today's Visits</CardTitle>
            <Calendar className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-gray-600 mt-1">Scheduled today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Prescriptions</CardTitle>
            <FileText className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-gray-600 mt-1">Pending prescriptions</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            onClick={() => router.push('/dashboard/doctor/patients')}
            className="w-full justify-start"
            variant="outline"
          >
            <Users className="mr-2 h-4 w-4" />
            View All Patients
          </Button>
          <Button
            onClick={() => router.push('/dashboard/doctor/visits')}
            className="w-full justify-start"
            variant="outline"
          >
            <FileText className="mr-2 h-4 w-4" />
            View Visits
          </Button>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
