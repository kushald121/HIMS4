'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import DashboardLayout from '@/app/components/DashboardLayout';
import PatientTable from '@/app/components/patients/PatientTable';
import PatientRegistrationForm from '@/app/components/patients/PatientRegistrationForm';
import PatientDetailCard from '@/app/components/patients/PatientDetailCard';
import PatientSearchDialog from '@/app/components/patients/PatientSearchDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Users, UserPlus, Activity, AlertCircle } from 'lucide-react';
import type { Patient, Visit, Prescription } from '@/app/types';

export default function AdminPatientsPage() {
  const { token, hospitalId, loading: authLoading } = useAuth();
  const [patients, setPatients] = useState<(Patient & { age?: number })[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientVisits, setPatientVisits] = useState<Visit[]>([]);
  const [patientPrescriptions, setPatientPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPatients, setTotalPatients] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const { toast } = useToast();

  const fetchPatients = async () => {
    try {
      setLoading(true);
      
      // Check if we have token and hospitalId
      if (!token || !hospitalId) {
        console.error('Missing auth credentials:', { token: !!token, hospitalId: !!hospitalId });
        toast({
          title: 'Authentication Error',
          description: 'Please log in again.',
          variant: 'destructive',
        });
        return;
      }
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchQuery && { search: searchQuery }),
        ...(genderFilter !== 'all' && { gender: genderFilter }),
      });

      const response = await fetch(`/api/patients?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-hospital-id': hospitalId?.toString() || ''
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Fetch patients error:', response.status, errorData);
        throw new Error(errorData.error || 'Failed to fetch patients');
      }

      const result = await response.json();
      
      // Handle successResponse wrapper: { success: true, data: { patients, pagination } }
      if (result.success && result.data) {
        setPatients(result.data.patients || []);
        setTotalPages(result.data.pagination?.totalPages || 1);
        setTotalPatients(result.data.pagination?.total || 0);
      } else {
        // Fallback for direct response
        setPatients(result.patients || []);
        setTotalPages(result.pagination?.totalPages || 1);
        setTotalPatients(result.pagination?.total || 0);
      }
    } catch (error: any) {
      console.error('Failed to fetch patients:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load patients. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientDetails = async (patientId: string) => {
    try {
      const visitsResponse = await fetch(`/api/patients/${patientId}/visits`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-hospital-id': hospitalId?.toString() || ''
        }
      });
      if (visitsResponse.ok) {
        const visitsData = await visitsResponse.json();
        setPatientVisits(visitsData.visits || []);
      }

      const prescriptionsResponse = await fetch(`/api/prescriptions?patient_id=${patientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-hospital-id': hospitalId?.toString() || ''
        }
      });
      if (prescriptionsResponse.ok) {
        const prescData = await prescriptionsResponse.json();
        setPatientPrescriptions(prescData.prescriptions || []);
      }
    } catch (error) {
      console.error('Failed to fetch patient details:', error);
    }
  };

  useEffect(() => {
    if (!authLoading && token && hospitalId) {
      fetchPatients();
    }
  }, [currentPage, searchQuery, genderFilter, token, hospitalId, authLoading]);

  const handleAddPatient = () => {
    setEditingPatient(null);
    setDialogOpen(true);
  };

  const handleEditPatient = (patient: Patient) => {
    setEditingPatient(patient);
    setDialogOpen(true);
  };

  const handleViewPatient = async (patient: Patient) => {
    setSelectedPatient(patient);
    setPatientVisits([]);
    setPatientPrescriptions([]);
    setDetailDialogOpen(true);
    await fetchPatientDetails(patient.id!.toString());
  };

  const handleDeletePatient = async (patient: Patient) => {
    if (!confirm('Are you sure you want to delete this patient?')) return;

    try {
      const response = await fetch(`/api/patients/${patient.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-hospital-id': hospitalId?.toString() || ''
        }
      });

      if (!response.ok) throw new Error('Failed to delete patient');

      toast({
        title: 'Success',
        description: 'Patient deleted successfully',
      });

      fetchPatients();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete patient',
      });
    }
  };

  const handlePatientSubmit = async (data: any) => {
    try {
      if (!token || !hospitalId) {
        toast({
          title: 'Error',
          description: 'Authentication required. Please log in again.',
          variant: 'destructive',
        });
        return;
      }

      const url = editingPatient
        ? `/api/patients/${editingPatient.id}`
        : '/api/patients';
      const method = editingPatient ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-hospital-id': hospitalId.toString()
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to save patient');
      }

      toast({
        title: 'Success',
        description: `Patient ${editingPatient ? 'updated' : 'registered'} successfully`,
      });

      setDialogOpen(false);
      setEditingPatient(null);
      fetchPatients();
    } catch (error: any) {
      console.error('Patient submit error:', error);
      toast({
        title: 'Error',
        description: error.message || `Failed to ${editingPatient ? 'update' : 'register'} patient`,
        variant: 'destructive',
      });
    }
  };

  const handleSearchPatient = (patient: Patient) => {
    handleViewPatient(patient);
  };

  const stats = [
    {
      title: 'Total Patients',
      value: totalPatients.toString(),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'New Patients (This Month)',
      value: patients.filter(p => {
        const created = new Date(p.created_at);
        const now = new Date();
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
      }).length.toString(),
      icon: UserPlus,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Active Patients',
      value: patients.filter(p => !p.deleted_at).length.toString(),
      icon: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Patients with Allergies',
      value: patients.filter(p => p.allergies && p.allergies.length > 0).length.toString(),
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  return (
    <DashboardLayout title="Patient Management" role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-600 mt-1">Manage all hospital patients</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setSearchDialogOpen(true)}>
              <Search className="mr-2 h-4 w-4" />
              Quick Search
            </Button>
            <Button onClick={handleAddPatient}>
              <Plus className="mr-2 h-4 w-4" />
              Add Patient
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Patient List</CardTitle>
            <CardDescription>Search and filter patients</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by name, ID, phone..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <PatientTable
              patients={patients}
              loading={loading}
              onEdit={(patient) => handleEditPatient(patient as Patient)}
              onDelete={(patient) => handleDeletePatient(patient as Patient)}
              onView={(patient) => handleViewPatient(patient as Patient)}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <Button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="py-2 px-4">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Patient Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPatient ? 'Edit Patient' : 'Register New Patient'}
            </DialogTitle>
            <DialogDescription>
              {editingPatient
                ? 'Update patient information below'
                : 'Fill in the patient details to register them in the system'}
            </DialogDescription>
          </DialogHeader>
          <PatientRegistrationForm
            initialData={editingPatient ? {
              ...editingPatient,
              allergies: Array.isArray(editingPatient.allergies) ? editingPatient.allergies.join(', ') : editingPatient.allergies,
              chronic_conditions: Array.isArray(editingPatient.chronic_conditions) ? editingPatient.chronic_conditions.join(', ') : editingPatient.chronic_conditions
            } : undefined}
            onSuccess={handlePatientSubmit}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Patient Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          {selectedPatient && (
            <PatientDetailCard
              patient={selectedPatient}
              visits={patientVisits}
              prescriptions={patientPrescriptions}
              onEdit={() => {
                setDetailDialogOpen(false);
                handleEditPatient(selectedPatient);
              }}
              onDelete={() => {
                setDetailDialogOpen(false);
                if (selectedPatient) {
                  handleDeletePatient(selectedPatient);
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Search Dialog */}
      <PatientSearchDialog
        open={searchDialogOpen}
        onOpenChange={setSearchDialogOpen}
        onSelectPatient={handleSearchPatient}
      />
    </DashboardLayout>
  );
}
