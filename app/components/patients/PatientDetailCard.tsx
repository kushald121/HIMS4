'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  Heart,
  AlertCircle,
  FileText,
  Pill,
  Activity,
  Clock,
  Shield
} from 'lucide-react';
import type { Patient, Visit, Prescription } from '@/app/types';
import { format } from 'date-fns';

interface PatientDetailCardProps {
  patient: Patient & { age?: number | null };
  visits?: Visit[];
  prescriptions?: Prescription[];
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function PatientDetailCard({
  patient,
  visits = [],
  prescriptions = [],
  onEdit,
  onDelete,
}: PatientDetailCardProps) {
  const [activeTab, setActiveTab] = useState('demographics');

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'MMM dd, yyyy');
  };

  const formatDateTime = (date: string) => {
    return format(new Date(date), 'MMM dd, yyyy h:mm a');
  };

  const getGenderBadge = (gender: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      male: 'default',
      female: 'secondary',
      other: 'outline',
    };
    return variants[gender] || 'outline';
  };

  const getBloodGroupColor = (bloodGroup: string | null) => {
    if (!bloodGroup) return 'bg-gray-100 text-gray-800';
    if (bloodGroup.startsWith('O')) return 'bg-red-100 text-red-800';
    if (bloodGroup.startsWith('A')) return 'bg-blue-100 text-blue-800';
    if (bloodGroup.startsWith('B')) return 'bg-green-100 text-green-800';
    return 'bg-purple-100 text-purple-800';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-2xl">
              {patient.first_name} {patient.last_name}
            </CardTitle>
            <CardDescription className="text-base">
              Patient ID: {patient.patient_number}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {onEdit && (
              <Button onClick={onEdit} className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 px-3 py-1 text-sm">
                Edit
              </Button>
            )}
            {onDelete && (
              <Button onClick={onDelete} className="bg-red-600 text-white hover:bg-red-700 px-3 py-1 text-sm">
                Delete
              </Button>
            )}
          </div>
        </div>
        
        <div className="flex gap-2 mt-3">
          <Badge className={
            patient.gender === 'male' ? 'bg-blue-100 text-blue-800 border-blue-200' :
            patient.gender === 'female' ? 'bg-pink-100 text-pink-800 border-pink-200' :
            'bg-purple-100 text-purple-800 border-purple-200'
          }>
            {patient.gender}
          </Badge>
          {patient.blood_group && (
            <Badge className={getBloodGroupColor(patient.blood_group)}>
              {patient.blood_group}
            </Badge>
          )}
          {patient.age !== undefined && patient.age !== null && (
            <Badge className="border border-gray-300 bg-white text-gray-700">
              {patient.age} years old
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="demographics">Demographics</TabsTrigger>
            <TabsTrigger value="medical">Medical History</TabsTrigger>
            <TabsTrigger value="visits">Visits ({visits.length})</TabsTrigger>
            <TabsTrigger value="prescriptions">Prescriptions ({prescriptions.length})</TabsTrigger>
          </TabsList>

          {/* Demographics Tab */}
          <TabsContent value="demographics" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-gray-500 uppercase">Personal Information</h3>
                
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Date of Birth</p>
                    <p className="text-sm text-gray-600">{formatDate(patient.date_of_birth)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Gender</p>
                    <p className="text-sm text-gray-600 capitalize">{patient.gender}</p>
                  </div>
                </div>

                {patient.blood_group && (
                  <div className="flex items-start gap-3">
                    <Heart className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Blood Group</p>
                      <p className="text-sm text-gray-600">{patient.blood_group}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Contact Information */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-gray-500 uppercase">Contact Information</h3>
                
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-gray-600">{patient.contact_number}</p>
                  </div>
                </div>

                {patient.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-gray-600">{patient.email}</p>
                    </div>
                  </div>
                )}

                {patient.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Address</p>
                      <p className="text-sm text-gray-600">
                        {patient.address}
                        {patient.city && <>, {patient.city}</>}
                        {patient.state && <>, {patient.state}</>}
                        {patient.postal_code && <> {patient.postal_code}</>}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator className="my-4" />

            {/* Emergency Contact */}
            {patient.emergency_contact_name && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-gray-500 uppercase">Emergency Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium">Name</p>
                    <p className="text-sm text-gray-600">{patient.emergency_contact_name}</p>
                  </div>
                  {patient.emergency_contact_number && (
                    <div>
                      <p className="text-sm font-medium">Phone</p>
                      <p className="text-sm text-gray-600">{patient.emergency_contact_number}</p>
                    </div>
                  )}
                  {patient.emergency_contact_relationship && (
                    <div>
                      <p className="text-sm font-medium">Relationship</p>
                      <p className="text-sm text-gray-600">{patient.emergency_contact_relationship}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Insurance Information */}
            {patient.insurance_provider && (
              <>
                <Separator className="my-4" />
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-gray-500 uppercase flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Insurance Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium">Provider</p>
                      <p className="text-sm text-gray-600">{patient.insurance_provider}</p>
                    </div>
                    {patient.insurance_policy_number && (
                      <div>
                        <p className="text-sm font-medium">Policy Number</p>
                        <p className="text-sm text-gray-600">{patient.insurance_policy_number}</p>
                      </div>
                    )}
                    {patient.insurance_group_number && (
                      <div>
                        <p className="text-sm font-medium">Group Number</p>
                        <p className="text-sm text-gray-600">{patient.insurance_group_number}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* Medical History Tab */}
          <TabsContent value="medical" className="space-y-4 mt-4">
            {patient.allergies && (
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  Allergies
                </h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-900">{patient.allergies}</p>
                </div>
              </div>
            )}

            {patient.chronic_conditions && (
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Chronic Conditions
                </h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-900">{patient.chronic_conditions}</p>
                </div>
              </div>
            )}

            {patient.current_medications && (
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Pill className="h-5 w-5" />
                  Current Medications
                </h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-900">{patient.current_medications}</p>
                </div>
              </div>
            )}

            {patient.medical_history && (
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Medical History
                </h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{patient.medical_history}</p>
                </div>
              </div>
            )}

            {!patient.allergies && !patient.chronic_conditions && !patient.current_medications && !patient.medical_history && (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No medical history recorded</p>
              </div>
            )}
          </TabsContent>

          {/* Visits Tab */}
          <TabsContent value="visits" className="space-y-4 mt-4">
            {visits.length > 0 ? (
              <div className="space-y-3">
                {visits.map((visit) => (
                  <Card key={visit.id}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold">{visit.visit_number}</p>
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" />
                            {formatDateTime(visit.visit_date)}
                          </p>
                        </div>
                        <Badge className={visit.visit_type === 'emergency' ? 'bg-red-100 text-red-800 border-red-200' : 'bg-gray-100 text-gray-800 border-gray-200'}>
                          {visit.visit_type}
                        </Badge>
                      </div>
                      
                      {visit.diagnosis && (
                        <div className="mt-3">
                          <p className="text-sm font-medium">Diagnosis</p>
                          <p className="text-sm text-gray-600">{visit.diagnosis}</p>
                        </div>
                      )}

                      {visit.vital_signs && (
                        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          {typeof visit.vital_signs === 'object' && (
                            <>
                              {(visit.vital_signs as any).blood_pressure && (
                                <div>
                                  <span className="text-gray-500">BP: </span>
                                  <span className="font-medium">{(visit.vital_signs as any).blood_pressure}</span>
                                </div>
                              )}
                              {(visit.vital_signs as any).temperature && (
                                <div>
                                  <span className="text-gray-500">Temp: </span>
                                  <span className="font-medium">{(visit.vital_signs as any).temperature}°F</span>
                                </div>
                              )}
                              {(visit.vital_signs as any).pulse && (
                                <div>
                                  <span className="text-gray-500">Pulse: </span>
                                  <span className="font-medium">{(visit.vital_signs as any).pulse} bpm</span>
                                </div>
                              )}
                              {(visit.vital_signs as any).weight && (
                                <div>
                                  <span className="text-gray-500">Weight: </span>
                                  <span className="font-medium">{(visit.vital_signs as any).weight} kg</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No visits recorded</p>
              </div>
            )}
          </TabsContent>

          {/* Prescriptions Tab */}
          <TabsContent value="prescriptions" className="space-y-4 mt-4">
            {prescriptions.length > 0 ? (
              <div className="space-y-3">
                {prescriptions.map((prescription) => (
                  <Card key={prescription.id}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold">{prescription.prescription_number}</p>
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" />
                            {formatDateTime(prescription.created_at)}
                          </p>
                        </div>
                        <Badge className={
                          prescription.status === 'filled' ? 'bg-green-100 text-green-800 border-green-200' :
                          prescription.status === 'partially_filled' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                          prescription.status === 'pending' ? 'bg-gray-100 text-gray-800 border-gray-200' : 'bg-red-100 text-red-800 border-red-200'
                        }>
                          {prescription.status}
                        </Badge>
                      </div>

                      {prescription.notes && (
                        <div className="mt-3">
                          <p className="text-sm font-medium">Notes</p>
                          <p className="text-sm text-gray-600">{prescription.notes}</p>
                        </div>
                      )}

                      {prescription.filled_at && (
                        <div className="mt-2 text-xs text-gray-500">
                          Filled on: {formatDateTime(prescription.filled_at)}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Pill className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No prescriptions recorded</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
