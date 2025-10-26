'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/DashboardLayout';
import PatientRegistrationForm from '@/app/components/patients/PatientRegistrationForm';
import PatientTable from '@/app/components/patients/PatientTable';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';

export default function ReceptionistPatientsPage() {
  const { user, token, hospitalId, loading } = useAuth();
  const router = useRouter();
  const [patients, setPatients] = useState<any[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    if (!loading && (!user || !hospitalId)) {
      router.push('/dashboard');
    }
  }, [user, hospitalId, loading, router]);

  useEffect(() => {
    if (hospitalId && token) {
      fetchPatients();
    }
  }, [hospitalId, token, pagination.page, searchTerm, genderFilter]);

  const fetchPatients = async () => {
    setPatientsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (searchTerm) params.append('search', searchTerm);
      if (genderFilter) params.append('gender', genderFilter);

      const response = await fetch(`/api/patients?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        setPatients(result.data.patients);
        setPagination(result.data.pagination);
      } else {
        toast.error('Failed to fetch patients');
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to fetch patients');
    } finally {
      setPatientsLoading(false);
    }
  };

  const handleRegistrationSuccess = (patient: any) => {
    setShowRegistrationForm(false);
    setSelectedPatient(null);
    fetchPatients();
  };

  const handleEdit = (patient: any) => {
    setSelectedPatient(patient);
    setShowRegistrationForm(true);
  };

  const handleDelete = async (patient: any) => {
    if (!confirm(`Are you sure you want to delete patient ${patient.patient_number}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/patients/${patient.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Patient deleted successfully');
        fetchPatients();
      } else {
        toast.error(result.error || 'Failed to delete patient');
      }
    } catch (error) {
      console.error('Error deleting patient:', error);
      toast.error('Failed to delete patient');
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPagination(prev => ({ ...prev, page: 1 }));
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
      title="Patient Management"
      description="Register and manage patient records"
      role="receptionist"
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by patient #, name, or phone..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={genderFilter} onValueChange={setGenderFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">All Genders</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => {
            setSelectedPatient(null);
            setShowRegistrationForm(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Register Patient
          </Button>
        </div>

        {/* Patients Table */}
        <Card>
          <CardHeader>
            <CardTitle>Patients ({pagination.total})</CardTitle>
          </CardHeader>
          <CardContent>
            <PatientTable
              patients={patients}
              loading={patientsLoading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              canEdit={true}
              canDelete={true}
            />

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} patients
                </div>
                <div className="flex gap-2">
                  <Button
                    className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 px-3 py-1 text-sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 px-3 py-1 text-sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Registration Dialog */}
      <Dialog open={showRegistrationForm} onOpenChange={setShowRegistrationForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedPatient ? 'Edit Patient' : 'Register New Patient'}
            </DialogTitle>
          </DialogHeader>
          <PatientRegistrationForm
            mode={selectedPatient ? 'edit' : 'create'}
            patientId={selectedPatient?.id}
            initialData={selectedPatient}
            onSuccess={handleRegistrationSuccess}
            onCancel={() => {
              setShowRegistrationForm(false);
              setSelectedPatient(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
