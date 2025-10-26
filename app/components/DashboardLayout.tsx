'use client';

import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Activity, LogOut, Building2, Users, Package, Calendar, FileText, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { ReactNode } from 'react';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  role: string;
}

export default function DashboardLayout({ children, title, description, role }: DashboardLayoutProps) {
  const { user, logout, hospitalId, hospitals } = useAuth();
  const router = useRouter();

  const hospital = hospitals.find(h => h.hospital_id === hospitalId);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const getNavItems = () => {
    const baseItems = [
      { href: `/dashboard/${role}`, icon: LayoutDashboard, label: 'Dashboard' }
    ];

    switch (role) {
      case 'admin':
        return [
          ...baseItems,
          { href: `/dashboard/${role}/staff`, icon: Users, label: 'Staff' },
          { href: `/dashboard/${role}/patients`, icon: Users, label: 'Patients' },
          { href: `/dashboard/${role}/inventory`, icon: Package, label: 'Inventory' }
        ];
      case 'doctor':
        return [
          ...baseItems,
          { href: `/dashboard/${role}/patients`, icon: Users, label: 'Patients' },
          { href: `/dashboard/${role}/visits`, icon: FileText, label: 'Visits' },
          { href: `/dashboard/${role}/prescriptions`, icon: FileText, label: 'Prescriptions' }
        ];
      case 'pharmacist':
        return [
          ...baseItems,
          { href: `/dashboard/${role}/prescriptions`, icon: FileText, label: 'Prescriptions' },
          { href: `/dashboard/${role}/inventory`, icon: Package, label: 'Inventory' }
        ];
      case 'receptionist':
        return [
          ...baseItems,
          { href: `/dashboard/${role}/patients`, icon: Users, label: 'Patients' },
          { href: `/dashboard/${role}/appointments`, icon: Calendar, label: 'Appointments' }
        ];
      default:
        return baseItems;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-blue-600 mr-2" />
              <span className="text-xl font-bold text-gray-900">HIMS</span>
              {hospital && (
                <div className="ml-8 flex items-center text-sm text-gray-600">
                  <Building2 className="h-4 w-4 mr-2" />
                  {hospital.hospitals?.name}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={() => router.push('/dashboard')}>
                Switch Hospital
              </Button>
              <div className="text-sm text-gray-700">
                {user?.first_name} {user?.last_name}
                <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  {role}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        <aside className="w-64 bg-white border-r min-h-[calc(100vh-4rem)]">
          <nav className="p-4 space-y-2">
            {getNavItems().map((item) => (
              <Link key={item.href} href={item.href}>
                <div className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                  <item.icon className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-700">{item.label}</span>
                </div>
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            {description && <p className="text-gray-600 mt-2">{description}</p>}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
