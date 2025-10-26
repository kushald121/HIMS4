'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function PharmacistPrescriptionsPage() {
  const { token, hospitalId, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    if (!loading && (!token || !hospitalId)) {
      router.push('/dashboard');
    } else if (token && hospitalId) {
      fetchPrescriptions();
    }
  }, [token, hospitalId, loading, router]);

  const fetchPrescriptions = async (status?: string) => {
    try {
      const url = status ? `/api/prescriptions?status=${status}` : '/api/prescriptions';
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-hospital-id': hospitalId!.toString()
        }
      });
      const data = await response.json();
      if (data.success) {
        setPrescriptions(data.data.prescriptions || []);
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleFulfill = async (prescriptionId: number) => {
    toast({
      title: 'Info',
      description: 'Fulfillment feature coming soon'
    });
  };

  if (loading || loadingData) {
    return (
      <DashboardLayout title="Prescriptions" role="pharmacist">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  const pendingPrescriptions = prescriptions.filter(p => p.status === 'pending');
  const filledPrescriptions = prescriptions.filter(p => p.status === 'filled');
  const cancelledPrescriptions = prescriptions.filter(p => p.status === 'cancelled');

  return (
    <DashboardLayout title="Prescription Management" description="Process and fulfill prescriptions" role="pharmacist">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Prescriptions</CardTitle>
            <div className="flex space-x-2">
              <Badge variant="default" className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {pendingPrescriptions.length} Pending
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="pending">
                Pending ({pendingPrescriptions.length})
              </TabsTrigger>
              <TabsTrigger value="filled">
                Filled ({filledPrescriptions.length})
              </TabsTrigger>
              <TabsTrigger value="cancelled">
                Cancelled ({cancelledPrescriptions.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-4">
              {pendingPrescriptions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No pending prescriptions. All caught up!</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Medication</TableHead>
                      <TableHead>Dosage</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingPrescriptions.map((prescription) => (
                      <TableRow key={prescription.id}>
                        <TableCell>
                          {prescription.visits?.patients?.patient_number}
                        </TableCell>
                        <TableCell className="font-medium">
                          {prescription.medication_name}
                          {prescription.generic_name && (
                            <div className="text-xs text-gray-500">{prescription.generic_name}</div>
                          )}
                        </TableCell>
                        <TableCell>{prescription.dosage}</TableCell>
                        <TableCell>{prescription.frequency}</TableCell>
                        <TableCell>{prescription.duration}</TableCell>
                        <TableCell>{prescription.quantity_prescribed}</TableCell>
                        <TableCell>
                          {prescription.hospital_users?.users?.first_name}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => handleFulfill(prescription.id)}
                          >
                            Fulfill
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="filled" className="mt-4">
              {filledPrescriptions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>No filled prescriptions yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Medication</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filledPrescriptions.map((prescription) => (
                      <TableRow key={prescription.id}>
                        <TableCell>
                          {prescription.visits?.patients?.patient_number}
                        </TableCell>
                        <TableCell className="font-medium">{prescription.medication_name}</TableCell>
                        <TableCell>{prescription.quantity_prescribed}</TableCell>
                        <TableCell>
                          <Badge variant="outline">Filled</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="cancelled" className="mt-4">
              {cancelledPrescriptions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>No cancelled prescriptions.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Medication</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cancelledPrescriptions.map((prescription) => (
                      <TableRow key={prescription.id}>
                        <TableCell>
                          {prescription.visits?.patients?.patient_number}
                        </TableCell>
                        <TableCell className="font-medium">{prescription.medication_name}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">Cancelled</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
