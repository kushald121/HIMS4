'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Building2, Plus, Activity } from 'lucide-react';

export default function DashboardPage() {
  const { user, hospitals, hospitalId, selectHospital, loading } = useAuth();
  const router = useRouter();
  const [showCreateHospital, setShowCreateHospital] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (hospitalId && hospitals.length > 0) {
      const hospital = hospitals.find(h => h.hospital_id === hospitalId);
      if (hospital) {
        router.push(`/dashboard/${hospital.role}`);
      }
    }
  }, [hospitalId, hospitals, router]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (hospitals.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Activity className="h-12 w-12 text-blue-600" />
            </div>
            <CardTitle>Welcome to HIMS</CardTitle>
            <CardDescription>
              You're not associated with any hospital yet. Create a new hospital or wait for an invitation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/dashboard/setup')} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Create Hospital
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Activity className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">HIMS</span>
          </div>
          <div className="text-sm text-gray-600">
            {user.first_name} {user.last_name}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Select Hospital</h1>
          <p className="text-gray-600">Choose which hospital you'd like to access</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hospitals.map((hospital: any) => (
            <Card
              key={hospital.hospital_id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => selectHospital(hospital.hospital_id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-full">
                    {hospital.role}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="mb-2">{hospital.hospitals?.name || 'Hospital'}</CardTitle>
                <CardDescription>
                  {hospital.hospitals?.address || 'No address provided'}
                </CardDescription>
              </CardContent>
            </Card>
          ))}

          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer border-dashed"
            onClick={() => router.push('/dashboard/setup')}
          >
            <CardHeader>
              <div className="bg-gray-100 p-3 rounded-lg w-fit">
                <Plus className="h-6 w-6 text-gray-600" />
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="mb-2">Create New Hospital</CardTitle>
              <CardDescription>Set up a new hospital facility</CardDescription>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
