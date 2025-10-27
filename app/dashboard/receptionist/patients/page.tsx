'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/DashboardLayout';
import PatientRegistrationForm from '@/app/components/patients/PatientRegistrationForm';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, UserPlus, Eye, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ReceptionistPatientsPage() {
  const { token, hospitalId, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [patients, setPatients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPatients, setTotalPatients] = useState(0);
  const [loadingData, setLoadingData] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && (!token || !hospitalId)) {
      router.push('/dashboard');
    } else if (!authLoading && token && hospitalId) {
      fetchPatients();
    }
  }, [currentPage, searchQuery, genderFilter, token, hospitalId, authLoading, router]);

  const fetchPatients = async () => {
    if (!token || !hospitalId) {
      console.log('Receptionist fetchPatients: Missing auth', { token: !!token, hospitalId });
      return;
    }
    
    try {
      setLoadingData(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchQuery && { search: searchQuery }),
        ...(genderFilter !== 'all' && { gender: genderFilter }),
      });

      console.log('Receptionist fetching patients with:', {
        url: `/api/patients?${params}`,
        token: token?.substring(0, 20) + '...',
        hospitalId
      });

      const response = await fetch(`/api/patients?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-hospital-id': hospitalId.toString()
        }
      });

      console.log('Receptionist fetch response:', response.status, response.ok);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Fetch patients error:', response.status, errorData);
        throw new Error(errorData.error || 'Failed to fetch patients');
      }

      const data = await response.json();
      console.log('Receptionist received data:', {
        success: data.success,
        patientsCount: data.patients?.length,
        dataPatients: data.data?.patients?.length,
        patients: data.patients,
        dataWrapper: data.data,
        pagination: data.pagination,
        rawData: data
      });
      
      // Handle both response formats
      const responseData = data.data || data;
      const patientsList = responseData.patients || [];
      const paginationData = responseData.pagination || {};
      
      setPatients(patientsList);
      setTotalPages(paginationData.totalPages || 1);
      setTotalPatients(paginationData.total || 0);
    } catch (error: any) {
      console.error('Failed to fetch patients:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load patients. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoadingData(false);
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

      toast({
        title: 'Success',
        description: 'Patient registered successfully',
      });

      setDialogOpen(false);
      fetchPatients();
    } catch (error: any) {
      console.error('Patient submit error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to register patient',
        variant: 'destructive',
      });
    }
  };

  const handleViewPatient = async (patient: any) => {
    setSelectedPatient(patient);
    setDetailDialogOpen(true);
  };

  if (authLoading) {
    return (
      <DashboardLayout title="Patients" role="receptionist">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Patient Registration" description="Register and manage patients" role="receptionist">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>All Patients ({totalPatients})</CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Register Patient
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Register New Patient</DialogTitle>
                  <DialogDescription>
                    Complete patient registration with all required information
                  </DialogDescription>
                </DialogHeader>
                <PatientRegistrationForm
                  onSuccess={handlePatientSubmit}
                  onCancel={() => setDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, patient number, phone..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="max-w-sm"
            />
            <Select value={genderFilter} onValueChange={(value) => {
              setGenderFilter(value);
              setCurrentPage(1);
            }}>
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
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {loadingData ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No patients found. Register your first patient to get started.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient Number</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Blood Group</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-medium">{patient.patient_number}</TableCell>
                      <TableCell>
                        {patient.users ? `${patient.users.first_name} ${patient.users.last_name}` : 'Walk-in Patient'}
                      </TableCell>
                      <TableCell>{patient.contact_number || '-'}</TableCell>
                      <TableCell>{patient.blood_group || '-'}</TableCell>
                      <TableCell className="capitalize">{patient.gender || '-'}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleViewPatient(patient)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    variant="outline"
                  >
                    Previous
                  </Button>
                  <span className="py-2 px-4 text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    variant="outline"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}