'use client';

import { useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Calendar, UserPlus } from 'lucide-react';

export default function ReceptionistDashboard() {
  const { user, token, hospitalId, loading } = useAuth();
  const router = useRouter();

  // Removed the authentication check to allow access without login
  // useEffect(() => {
  //   if (!loading && (!user || !hospitalId)) {
  //     router.push('/dashboard');
  //   }
  // }, [user, hospitalId, loading, router]);

  // Removed the loading check
  // if (loading || !user || !hospitalId) {
  //   return (
  //     <div className="flex items-center justify-center min-h-screen">
  //       <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  //     </div>
  //   );
  // }

  return (
    <DashboardLayout
      title="Receptionist Dashboard"
      description="Manage patient registration and appointments"
      role="receptionist"
    >
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-gray-600 mt-1">Registered patients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Today's Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-gray-600 mt-1">Scheduled today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">New Registrations</CardTitle>
            <UserPlus className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-gray-600 mt-1">This month</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            onClick={() => router.push('/dashboard/receptionist/patients')}
            className="w-full justify-start"
            variant="outline"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Register New Patient
          </Button>
          <Button
            onClick={() => router.push('/dashboard/receptionist/appointments')}
            className="w-full justify-start"
            variant="outline"
          >
            <Calendar className="mr-2 h-4 w-4" />
            Manage Appointments
          </Button>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}