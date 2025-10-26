'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './context/AuthContext';
import { Button } from '@/components/ui/button';
import { Building2, Users, Shield, Activity } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
          <div className="flex space-x-4">
            <Link href="/auth/login">
              <Button variant="outline">Login</Button>
            </Link>
            <Link href="/auth/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Modern Hospital Management
            <br />
            <span className="text-blue-600">Simplified</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
            Streamline your hospital operations with our integrated platform.
            From patient management to inventory tracking, everything you need in one place.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/auth/register">
              <Button size="lg" className="text-lg px-8">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/hospitals">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Browse Hospitals
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="bg-blue-100 w-14 h-14 rounded-lg flex items-center justify-center mb-6">
              <Building2 className="h-7 w-7 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900">Multi-Hospital Support</h3>
            <p className="text-gray-600 leading-relaxed">
              Manage multiple hospital locations with isolated data and centralized oversight.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="bg-green-100 w-14 h-14 rounded-lg flex items-center justify-center mb-6">
              <Users className="h-7 w-7 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900">Role-Based Access</h3>
            <p className="text-gray-600 leading-relaxed">
              Tailored dashboards for doctors, pharmacists, receptionists, and administrators.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="bg-purple-100 w-14 h-14 rounded-lg flex items-center justify-center mb-6">
              <Shield className="h-7 w-7 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900">Secure & Compliant</h3>
            <p className="text-gray-600 leading-relaxed">
              Built with HIPAA/GDPR principles, ensuring data security and patient privacy.
            </p>
          </div>
        </div>

        <div className="mt-20 bg-white rounded-2xl p-12 shadow-lg border border-gray-100">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Ready to modernize your hospital?
              </h2>
              <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                Join healthcare providers who have transformed their operations with our platform.
              </p>
              <Link href="/auth/register">
                <Button size="lg" className="text-lg px-8">
                  Create Account
                </Button>
              </Link>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-8">
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-start">
                  <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                    ✓
                  </div>
                  <span>Patient self-registration and management</span>
                </li>
                <li className="flex items-start">
                  <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                    ✓
                  </div>
                  <span>Digital prescription workflow</span>
                </li>
                <li className="flex items-start">
                  <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                    ✓
                  </div>
                  <span>Inventory and pharmacy management</span>
                </li>
                <li className="flex items-start">
                  <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                    ✓
                  </div>
                  <span>Comprehensive visit and medical history</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t bg-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-600">
          <p>© 2025 Hospital Information Management System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
