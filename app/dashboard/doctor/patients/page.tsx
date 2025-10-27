'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import DashboardLayout from '@/app/components/DashboardLayout';
import PatientTable from '@/app/components/patients/PatientTable';
import PatientDetailCard from '@/app/components/patients/PatientDetailCard';
import PatientSearchDialog from '@/app/components/patients/PatientSearchDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
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
import { Search, Users, Calendar, Activity, FileText } from 'lucide-react';
import type { Patient, Visit, Prescription } from '@/app/types';

export default function DoctorPatientsPage() {
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
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchPatients = async () => {
    if (!token || !hospitalId) return;

    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchQuery && { search: searchQuery }),
        ...(genderFilter !== 'all' && { gender: genderFilter }),
      });

      const response = await fetch(`/api/patients?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-hospital-id': hospitalId.toString()
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch patients');

      const data = await response.json();
      setPatients(data.patients);
      setTotalPages(data.pagination.totalPages);
      setTotalPatients(data.pagination.total);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load patients. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientDetails = async (patientId: string) => {
    if (!token || !hospitalId) return;

    try {
      const visitsResponse = await fetch(`/api/patients/${patientId}/visits`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-hospital-id': hospitalId.toString()
        }
      });
      if (visitsResponse.ok) {
        const visitsData = await visitsResponse.json();
        setPatientVisits(visitsData.visits || []);
      }

      const prescriptionsResponse = await fetch(`/api/prescriptions?patient_id=${patientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-hospital-id': hospitalId.toString()
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
  }, [currentPage, searchQuery, genderFilter, authLoading, token, hospitalId]);

  const handleViewPatient = async (patient: Patient) => {
    if (!patient.id) return;
    setSelectedPatient(patient);
    setPatientVisits([]);
    setPatientPrescriptions([]);
    setDetailDialogOpen(true);
    await fetchPatientDetails(patient.id.toString());
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
      title: 'Patients Today',
      value: patients.filter(p => {
        const created = new Date(p.created_at);
        const today = new Date();
        return created.toDateString() === today.toDateString();
      }).length.toString(),
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Active Cases',
      value: patients.filter(p => !p.deleted_at).length.toString(),
      icon: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'With Medical History',
      value: patients.filter(p => p.medical_history || p.chronic_conditions).length.toString(),
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <DashboardLayout title="My Patients" role="doctor">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">My Patients</h1>
            <p className="text-gray-600 mt-1">View and manage your patients</p>
          </div>
          <Button onClick={() => setSearchDialogOpen(true)}>
            <Search className="mr-2 h-4 w-4" />
            Search Patient
          </Button>
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
            <CardDescription>Search and filter your patients</CardDescription>
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

      {/* Patient Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          {selectedPatient && (
            <PatientDetailCard
              patient={selectedPatient as Patient & { age?: number | null }}
              visits={patientVisits}
              prescriptions={patientPrescriptions}
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
