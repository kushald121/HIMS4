'use client';

import { useState } from 'react';
import { Patient } from '@/app/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Edit, Trash2, FileText } from 'lucide-react';

interface PatientWithAge extends Omit<Patient, 'users'> {
  age?: number | null;
  users?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  } | null;
}

interface PatientTableProps {
  patients: PatientWithAge[];
  onView?: (patient: PatientWithAge) => void;
  onEdit?: (patient: PatientWithAge) => void;
  onDelete?: (patient: PatientWithAge) => void;
  onViewHistory?: (patient: PatientWithAge) => void;
  loading?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

export default function PatientTable({
  patients,
  onView,
  onEdit,
  onDelete,
  onViewHistory,
  loading = false,
  canEdit = true,
  canDelete = false,
}: PatientTableProps) {
  const getGenderBadge = (gender: string) => {
    const colors: Record<string, string> = {
      male: 'bg-blue-100 text-blue-800',
      female: 'bg-pink-100 text-pink-800',
      other: 'bg-purple-100 text-purple-800',
      prefer_not_to_say: 'bg-gray-100 text-gray-800',
    };

    return (
      <Badge className={colors[gender] || 'bg-gray-100 text-gray-800'}>
        {gender.replace('_', ' ')}
      </Badge>
    );
  };

  const calculateAge = (dob: string | null): string => {
    if (!dob) return 'N/A';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age.toString();
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No patients found</p>
        <p className="text-gray-400 text-sm mt-2">Start by registering a new patient</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Patient #</TableHead>
            <TableHead>Name/Contact</TableHead>
            <TableHead>Age</TableHead>
            <TableHead>Gender</TableHead>
            <TableHead>Blood Group</TableHead>
            <TableHead>Registered</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.map((patient) => (
            <TableRow key={patient.id}>
              <TableCell className="font-medium">{patient.patient_number}</TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">
                    {patient.users?.first_name || patient.users?.last_name
                      ? `${patient.users?.first_name || ''} ${patient.users?.last_name || ''}`
                      : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-500">{patient.contact_number}</div>
                </div>
              </TableCell>
              <TableCell>{calculateAge(patient.date_of_birth || null)} yrs</TableCell>
              <TableCell>{patient.gender ? getGenderBadge(patient.gender) : 'N/A'}</TableCell>
              <TableCell>
                {patient.blood_group ? (
                  <Badge className="bg-gray-100 text-gray-800">{patient.blood_group}</Badge>
                ) : (
                  <span className="text-gray-400">N/A</span>
                )}
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {new Date(patient.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="h-8 w-8 p-0 hover:bg-gray-100">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {onView && (
                      <DropdownMenuItem onClick={() => onView(patient)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                    )}
                    {onViewHistory && (
                      <DropdownMenuItem onClick={() => onViewHistory(patient)}>
                        <FileText className="mr-2 h-4 w-4" />
                        View History
                      </DropdownMenuItem>
                    )}
                    {canEdit && onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(patient)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {canDelete && onDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete(patient)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
