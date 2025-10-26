'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, Package, Activity, AlertCircle } from 'lucide-react';

export default function AdminDashboard() {
  const { user, token, hospitalId, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalStaff: 0,
    lowStockItems: 0,
    activeVisits: 0
  });

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
      title="Admin Dashboard"
      description="Hospital overview and management"
      role="admin"
    >
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatients}</div>
            <p className="text-xs text-gray-600 mt-1">Registered patients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Staff Members</CardTitle>
            <Users className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStaff}</div>
            <p className="text-xs text-gray-600 mt-1">Active staff</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Visits</CardTitle>
            <Activity className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeVisits}</div>
            <p className="text-xs text-gray-600 mt-1">Ongoing consultations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Low Stock</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.lowStockItems}</div>
            <p className="text-xs text-gray-600 mt-1">Items need reorder</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <button
              onClick={() => router.push('/dashboard/admin/staff')}
              className="w-full text-left px-4 py-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              <div className="font-medium text-blue-900">Manage Staff</div>
              <div className="text-sm text-blue-700">Add or manage hospital staff</div>
            </button>
            <button
              onClick={() => router.push('/dashboard/admin/patients')}
              className="w-full text-left px-4 py-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors"
            >
              <div className="font-medium text-green-900">View Patients</div>
              <div className="text-sm text-green-700">Access patient records</div>
            </button>
            <button
              onClick={() => router.push('/dashboard/admin/inventory')}
              className="w-full text-left px-4 py-3 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors"
            >
              <div className="font-medium text-purple-900">Manage Inventory</div>
              <div className="text-sm text-purple-700">Track medication stock</div>
            </button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              <p>No recent activity to display</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
