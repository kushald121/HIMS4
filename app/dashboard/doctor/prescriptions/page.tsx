'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function DoctorPrescriptionsPage() {
  const { token, hospitalId, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    visit_id: '',
    medication_name: '',
    generic_name: '',
    dosage: '',
    frequency: '',
    duration: '',
    quantity_prescribed: 0,
    instructions: ''
  });

  useEffect(() => {
    if (!loading && (!token || !hospitalId)) {
      router.push('/dashboard');
    } else if (token && hospitalId) {
      fetchPrescriptions();
      fetchVisits();
    }
  }, [token, hospitalId, loading, router]);

  const fetchPrescriptions = async () => {
    try {
      const response = await fetch('/api/prescriptions', {
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

  const fetchVisits = async () => {
    try {
      const response = await fetch('/api/visits?status=active', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-hospital-id': hospitalId!.toString()
        }
      });
      const data = await response.json();
      if (data.success) {
        setVisits(data.data.visits || []);
      }
    } catch (error) {
      console.error('Error fetching visits:', error);
    }
  };

  const handleAddPrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-hospital-id': hospitalId!.toString()
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Prescription created successfully'
        });
        setShowAddDialog(false);
        fetchPrescriptions();
        setFormData({
          visit_id: '',
          medication_name: '',
          generic_name: '',
          dosage: '',
          frequency: '',
          duration: '',
          quantity_prescribed: 0,
          instructions: ''
        });
      } else {
        toast({
          title: 'Error',
          description: data.error,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create prescription',
        variant: 'destructive'
      });
    }
  };

  if (loading || loadingData) {
    return (
      <DashboardLayout title="Prescriptions" role="doctor">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Prescriptions" description="Manage patient prescriptions" role="doctor">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>All Prescriptions</CardTitle>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Prescription
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Prescription</DialogTitle>
                  <DialogDescription>Add a new prescription for a patient</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddPrescription} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="visit_id">Visit *</Label>
                    <select
                      id="visit_id"
                      className="w-full border rounded-md p-2"
                      value={formData.visit_id}
                      onChange={(e) => setFormData({ ...formData, visit_id: e.target.value })}
                      required
                    >
                      <option value="">Select a visit</option>
                      {visits.map((visit) => (
                        <option key={visit.id} value={visit.id}>
                          {visit.visit_number} - {visit.patients?.patient_number} ({new Date(visit.visit_date).toLocaleDateString()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="medication_name">Medication Name *</Label>
                      <Input
                        id="medication_name"
                        value={formData.medication_name}
                        onChange={(e) => setFormData({ ...formData, medication_name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="generic_name">Generic Name</Label>
                      <Input
                        id="generic_name"
                        value={formData.generic_name}
                        onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dosage">Dosage *</Label>
                      <Input
                        id="dosage"
                        placeholder="e.g., 500mg"
                        value={formData.dosage}
                        onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="frequency">Frequency *</Label>
                      <Input
                        id="frequency"
                        placeholder="e.g., Twice daily"
                        value={formData.frequency}
                        onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration *</Label>
                      <Input
                        id="duration"
                        placeholder="e.g., 7 days"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity_prescribed">Quantity Prescribed</Label>
                    <Input
                      id="quantity_prescribed"
                      type="number"
                      min="0"
                      value={formData.quantity_prescribed}
                      onChange={(e) => setFormData({ ...formData, quantity_prescribed: parseInt(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instructions">Instructions</Label>
                    <Textarea
                      id="instructions"
                      placeholder="Take after meals with water"
                      value={formData.instructions}
                      onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Prescription</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {prescriptions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No prescriptions created yet.</p>
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
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prescriptions.map((prescription) => (
                  <TableRow key={prescription.id}>
                    <TableCell>
                      {prescription.visits?.patients?.patient_number}
                    </TableCell>
                    <TableCell className="font-medium">{prescription.medication_name}</TableCell>
                    <TableCell>{prescription.dosage}</TableCell>
                    <TableCell>{prescription.frequency}</TableCell>
                    <TableCell>{prescription.duration}</TableCell>
                    <TableCell>{prescription.quantity_prescribed}</TableCell>
                    <TableCell>
                      <Badge variant={prescription.status === 'pending' ? 'default' : 'outline'}>
                        {prescription.status}
                      </Badge>
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
