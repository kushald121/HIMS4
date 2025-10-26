'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, FileText } from 'lucide-react';

export default function DoctorPatientsPage() {
  const { token, hospitalId, loading } = useAuth();
  const router = useRouter();
  const [patients, setPatients] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && (!token || !hospitalId)) {
      router.push('/dashboard');
    } else if (token && hospitalId) {
      fetchPatients();
    }
  }, [token, hospitalId, loading, router]);

  const fetchPatients = async () => {
    try {
      const response = await fetch(`/api/patients?search=${searchTerm}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-hospital-id': hospitalId!.toString()
        }
      });
      const data = await response.json();
      if (data.success) {
        setPatients(data.data.patients || []);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoadingData(false);
    }
  };

  if (loading || loadingData) {
    return (
      <DashboardLayout title="Patients" role="doctor">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Patients" description="View and manage your patients" role="doctor">
      <Card>
        <CardHeader>
          <CardTitle>Patient List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchPatients()}
              className="max-w-sm"
            />
            <Button onClick={fetchPatients}>Search</Button>
          </div>

          {patients.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No patients found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient Number</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Blood Group</TableHead>
                  <TableHead>Allergies</TableHead>
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
                    <TableCell>
                      {patient.blood_group ? (
                        <Badge variant="outline">{patient.blood_group}</Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {patient.allergies ? (
                        <span className="text-sm text-red-600">{patient.allergies.substring(0, 30)}...</span>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/dashboard/doctor/patients/${patient.id}`)}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
