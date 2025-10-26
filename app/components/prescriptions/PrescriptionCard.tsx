'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Pill, Calendar, User, FileText, Printer } from 'lucide-react';
import { format } from 'date-fns';
import type { Prescription } from '@/app/types';

interface PrescriptionCardProps {
  prescription: Prescription & {
    patient?: any;
    doctor?: any;
    visit?: any;
    items?: any[];
  };
  onFulfill?: (prescription: Prescription) => void;
  onPrint?: (prescription: Prescription) => void;
  showActions?: boolean;
  role?: 'doctor' | 'pharmacist' | 'admin';
}

export default function PrescriptionCard({
  prescription,
  onFulfill,
  onPrint,
  showActions = true,
  role = 'doctor',
}: PrescriptionCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'filled':
        return 'bg-green-100 text-green-800';
      case 'partially_filled':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'out_of_stock':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: string) => {
    return format(new Date(date), 'MMM dd, yyyy h:mm a');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Pill className="h-5 w-5" />
              {prescription.prescription_number}
            </CardTitle>
            <p className="text-sm text-gray-500">
              Created: {formatDate(prescription.created_at)}
            </p>
          </div>
          <Badge className={getStatusColor(prescription.status)}>
            {prescription.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Patient & Doctor Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {prescription.patient && (
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Patient</p>
                <p className="text-sm text-gray-600">
                  {prescription.patient.first_name} {prescription.patient.last_name}
                </p>
                <p className="text-xs text-gray-500">
                  {prescription.patient.patient_number}
                </p>
              </div>
            </div>
          )}

          {prescription.doctor && (
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Prescribed by</p>
                <p className="text-sm text-gray-600">
                  Dr. {prescription.doctor.first_name} {prescription.doctor.last_name}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Visit Info */}
        {prescription.visit && (
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Visit</p>
              <p className="text-sm text-gray-600">
                {prescription.visit.visit_number} - {formatDate(prescription.visit.visit_date)}
              </p>
              {prescription.visit.diagnosis && (
                <p className="text-xs text-gray-500 mt-1">
                  Diagnosis: {prescription.visit.diagnosis}
                </p>
              )}
            </div>
          </div>
        )}

        <Separator />

        {/* Medications */}
        {prescription.items && prescription.items.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Medications ({prescription.items.length})</p>
            {prescription.items.map((item, index) => (
              <div key={item.id || index} className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{item.medication_name}</p>
                    <p className="text-sm text-gray-600">
                      {item.dosage} - {item.frequency}
                    </p>
                  </div>
                  <Badge className="border border-gray-300 bg-white text-gray-700">
                    {item.quantity} {item.quantity === 1 ? 'unit' : 'units'}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Duration: {item.duration}</p>
                  {item.instructions && (
                    <p className="italic">Instructions: {item.instructions}</p>
                  )}
                  {item.quantity_dispensed !== undefined && item.quantity_dispensed > 0 && (
                    <p className="text-green-600 font-medium">
                      Dispensed: {item.quantity_dispensed} units
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Notes */}
        {prescription.notes && (
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Notes</p>
              <p className="text-sm text-gray-600">{prescription.notes}</p>
            </div>
          </div>
        )}

        {/* Fulfillment Info */}
        {prescription.filled_at && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800">
              <span className="font-medium">Fulfilled:</span>{' '}
              {formatDate(prescription.filled_at)}
            </p>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 pt-2">
            {onPrint && (
              <Button onClick={() => onPrint(prescription)}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
            )}
            {role === 'pharmacist' && 
             prescription.status === 'pending' && 
             onFulfill && (
              <Button onClick={() => onFulfill(prescription)}>
                Fulfill Prescription
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
