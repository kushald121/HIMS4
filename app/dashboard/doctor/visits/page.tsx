'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import VisitRecordingForm from '@/app/components/visits/VisitRecordingForm';
import PatientSearchDialog from '@/app/components/patients/PatientSearchDialog';
import {
  Plus,
  FileText,
  Calendar,
  Users,
  Search,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import type { Visit, Patient } from '@/app/types';

export default function DoctorVisitsPage() {
  const { user, hospitalId } = useAuth();
  const { toast } = useToast();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [filteredVisits, setFilteredVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);

  useEffect(() => {
    fetchVisits();
  }, [hospitalId, user]);

  useEffect(() => {
    filterVisits();
  }, [visits, searchQuery]);

  const fetchVisits = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (hospitalId) params.append('hospital_id', hospitalId.toString());
      if (user?.id) params.append('doctor_id', user.id.toString());

      const response = await fetch(`/api/visits?${params}`);
      if (!response.ok) throw new Error('Failed to fetch visits');

      const data = await response.json();
      setVisits(data.visits || []);
    } catch (error) {
      console.error('Error fetching visits:', error);
      toast({
        title: 'Error',
        description: 'Failed to load visits',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterVisits = () => {
    let filtered = visits;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (visit) =>
          visit.visit_number?.toLowerCase().includes(query) ||
          visit.chief_complaint?.toLowerCase().includes(query) ||
          visit.diagnosis?.toLowerCase().includes(query) ||
          (visit.patients &&
            `${visit.patients.first_name} ${visit.patients.last_name}`
              .toLowerCase()
              .includes(query))
      );
    }

    setFilteredVisits(filtered);
  };

  const handleRecordVisit = () => {
    setPatientSearchOpen(true);
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setPatientSearchOpen(false);
    setRecordDialogOpen(true);
  };

  const handleVisitRecorded = () => {
    setRecordDialogOpen(false);
    setSelectedPatient(null);
    fetchVisits();
    toast({
      title: 'Success',
      description: 'Visit recorded successfully',
    });
  };

  const handleViewVisit = (visit: Visit) => {
    setSelectedVisit(visit);
    setViewDialogOpen(true);
  };

  const getStats = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const visitsToday = visits.filter((visit) => {
      const visitDate = new Date(visit.visit_date || visit.created_at);
      visitDate.setHours(0, 0, 0, 0);
      return visitDate.getTime() === today.getTime();
    }).length;

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const visitsThisMonth = visits.filter((visit) => {
      const visitDate = new Date(visit.visit_date || visit.created_at);
      return visitDate >= thisMonth;
    }).length;

    return {
      total: visits.length,
      today: visitsToday,
      thisMonth: visitsThisMonth,
    };
  };

  const getVisitTypeBadge = (visitType: string) => {
    const colors: Record<string, string> = {
      consultation: 'bg-blue-100 text-blue-800',
      follow_up: 'bg-green-100 text-green-800',
      emergency: 'bg-red-100 text-red-800',
      routine_checkup: 'bg-purple-100 text-purple-800',
    };
    return colors[visitType] || 'bg-gray-100 text-gray-800';
  };

  const stats = getStats();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Patient Visits</h1>
          <p className="text-gray-600">Record and manage patient consultations</p>
        </div>
        <Button onClick={handleRecordVisit}>
          <Plus className="h-4 w-4 mr-2" />
          Record New Visit
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-gray-600">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Visits Today</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today}</div>
            <p className="text-xs text-gray-600">Consultations today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisMonth}</div>
            <p className="text-xs text-gray-600">Visits this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search by visit number, patient name, complaint, or diagnosis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Visits Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Visit History</CardTitle>
            <Badge>
              {filteredVisits.length} of {visits.length} visits
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 animate-pulse rounded" />
              ))}
            </div>
          ) : filteredVisits.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Visit #</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Chief Complaint</TableHead>
                  <TableHead>Diagnosis</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVisits.map((visit) => (
                  <TableRow key={visit.id}>
                    <TableCell className="font-medium">
                      {visit.visit_number}
                    </TableCell>
                    <TableCell>
                      {visit.patients ? (
                        <div>
                          <p className="font-medium">
                            {visit.patients.first_name} {visit.patients.last_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {visit.patients.patient_number}
                          </p>
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {visit.visit_date
                        ? format(new Date(visit.visit_date), 'MMM dd, yyyy')
                        : format(new Date(visit.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Badge className={getVisitTypeBadge(visit.visit_type)}>
                        {visit.visit_type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {visit.chief_complaint || '-'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {visit.diagnosis || '-'}
                    </TableCell>
                    <TableCell>
                      <Button
                        onClick={() => handleViewVisit(visit)}
                        className="border"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No visits found
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery
                  ? 'Try adjusting your search criteria'
                  : 'Record your first visit to get started'}
              </p>
              {!searchQuery && (
                <Button onClick={handleRecordVisit}>
                  <Plus className="h-4 w-4 mr-2" />
                  Record New Visit
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Patient Search Dialog */}
      <PatientSearchDialog
        open={patientSearchOpen}
        onOpenChange={setPatientSearchOpen}
        onSelect={handlePatientSelect}
      />

      {/* Record Visit Dialog */}
      {selectedPatient && user && hospitalId && (
        <Dialog open={recordDialogOpen} onOpenChange={setRecordDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Record Visit - {selectedPatient.first_name}{' '}
                {selectedPatient.last_name}
              </DialogTitle>
            </DialogHeader>
            <VisitRecordingForm
              patientId={selectedPatient.id?.toString() || ''}
              doctorId={user.id.toString()}
              hospitalId={hospitalId.toString()}
              onSuccess={handleVisitRecorded}
              onCancel={() => setRecordDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* View Visit Dialog */}
      {selectedVisit && (
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Visit Details - {selectedVisit.visit_number}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Patient Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Patient Information</h3>
                {selectedVisit.patients && (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Name:</span>{' '}
                      <span className="font-medium">
                        {selectedVisit.patients.first_name}{' '}
                        {selectedVisit.patients.last_name}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Patient #:</span>{' '}
                      <span className="font-medium">
                        {selectedVisit.patients.patient_number}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Visit Details */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-semibold text-gray-700">
                    Visit Type
                  </label>
                  <Badge className={getVisitTypeBadge(selectedVisit.visit_type)}>
                    {selectedVisit.visit_type.replace('_', ' ')}
                  </Badge>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">
                    Chief Complaint
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedVisit.chief_complaint || 'N/A'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">
                    Diagnosis
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedVisit.diagnosis || 'N/A'}
                  </p>
                </div>

                {selectedVisit.notes && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700">
                      Notes
                    </label>
                    <p className="text-sm text-gray-900">{selectedVisit.notes}</p>
                  </div>
                )}

                {/* Vital Signs */}
                {selectedVisit.vital_signs && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Vital Signs
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {selectedVisit.vital_signs.blood_pressure && (
                        <div className="bg-gray-50 p-2 rounded">
                          <p className="text-xs text-gray-600">Blood Pressure</p>
                          <p className="font-medium">
                            {selectedVisit.vital_signs.blood_pressure}
                          </p>
                        </div>
                      )}
                      {selectedVisit.vital_signs.temperature && (
                        <div className="bg-gray-50 p-2 rounded">
                          <p className="text-xs text-gray-600">Temperature</p>
                          <p className="font-medium">
                            {selectedVisit.vital_signs.temperature}°F
                          </p>
                        </div>
                      )}
                      {selectedVisit.vital_signs.pulse && (
                        <div className="bg-gray-50 p-2 rounded">
                          <p className="text-xs text-gray-600">Pulse</p>
                          <p className="font-medium">
                            {selectedVisit.vital_signs.pulse} bpm
                          </p>
                        </div>
                      )}
                      {selectedVisit.vital_signs.respiratory_rate && (
                        <div className="bg-gray-50 p-2 rounded">
                          <p className="text-xs text-gray-600">Resp. Rate</p>
                          <p className="font-medium">
                            {selectedVisit.vital_signs.respiratory_rate}/min
                          </p>
                        </div>
                      )}
                      {selectedVisit.vital_signs.weight && (
                        <div className="bg-gray-50 p-2 rounded">
                          <p className="text-xs text-gray-600">Weight</p>
                          <p className="font-medium">
                            {selectedVisit.vital_signs.weight} kg
                          </p>
                        </div>
                      )}
                      {selectedVisit.vital_signs.height && (
                        <div className="bg-gray-50 p-2 rounded">
                          <p className="text-xs text-gray-600">Height</p>
                          <p className="font-medium">
                            {selectedVisit.vital_signs.height} cm
                          </p>
                        </div>
                      )}
                      {selectedVisit.vital_signs.oxygen_saturation && (
                        <div className="bg-gray-50 p-2 rounded">
                          <p className="text-xs text-gray-600">O2 Saturation</p>
                          <p className="font-medium">
                            {selectedVisit.vital_signs.oxygen_saturation}%
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
