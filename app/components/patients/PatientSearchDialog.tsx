'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, User, Phone, Calendar, Loader2 } from 'lucide-react';
import type { Patient } from '@/app/types';
import { format } from 'date-fns';

interface PatientSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPatient?: (patient: Patient) => void;
  onSelect?: (patient: Patient) => void; // alias for compatibility
}

export default function PatientSearchDialog({
  open,
  onOpenChange,
  onSelectPatient,
  onSelect,
}: PatientSearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState<(Patient & { age?: number | null })[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSelectPatient = (patient: Patient) => {
    if (onSelectPatient) onSelectPatient(patient);
    if (onSelect) onSelect(patient);
    onOpenChange(false);
  };
  const [error, setError] = useState<string | null>(null);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setPatients([]);
      return;
    }

    const delaySearch = setTimeout(async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(
          `/api/patients?search=${encodeURIComponent(searchQuery)}&limit=20`
        );
        
        if (!response.ok) {
          throw new Error('Failed to search patients');
        }

        const data = await response.json();
        setPatients(data.patients || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
        setPatients([]);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const handleSelect = (patient: Patient) => {
    if (onSelectPatient) onSelectPatient(patient);
    if (onSelect) onSelect(patient);
    onOpenChange(false);
    setSearchQuery('');
    setPatients([]);
  };

  const getGenderBadge = (gender: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      male: 'default',
      female: 'secondary',
      other: 'outline',
    };
    return variants[gender] || 'outline';
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'MMM dd, yyyy');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Search Patients</DialogTitle>
          <DialogDescription>
            Search by patient name, ID, phone number, or email
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Start typing to search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          {/* Results */}
          <ScrollArea className="h-[400px] rounded-md border">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-sm text-gray-500">Searching...</span>
              </div>
            )}

            {error && (
              <div className="p-4 text-center">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}

            {!loading && !error && searchQuery.length < 2 && (
              <div className="p-8 text-center text-gray-500">
                <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Enter at least 2 characters to search</p>
              </div>
            )}

            {!loading && !error && searchQuery.length >= 2 && patients.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <User className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No patients found</p>
                <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
              </div>
            )}

            {!loading && patients.length > 0 && (
              <div className="divide-y">
                {patients.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() => handleSelect(patient)}
                    className="w-full p-4 text-left hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-100"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-sm truncate">
                            {patient.first_name} {patient.last_name}
                          </p>
                          <Badge className={`text-xs ${patient.gender === 'male' ? 'bg-blue-100 text-blue-800' : patient.gender === 'female' ? 'bg-pink-100 text-pink-800' : 'bg-gray-100 text-gray-800'}`}>
                            {patient.gender}
                          </Badge>
                          {patient.blood_group && (
                            <Badge className="text-xs border border-gray-300">
                              {patient.blood_group}
                            </Badge>
                          )}
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs text-gray-600 flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {patient.patient_number}
                            {patient.age !== undefined && (
                              <span className="ml-2">• {patient.age} years old</span>
                            )}
                          </p>

                          <p className="text-xs text-gray-600 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {patient.contact_number}
                          </p>

                          {patient.date_of_birth && (
                            <p className="text-xs text-gray-600 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              DOB: {formatDate(patient.date_of_birth)}
                            </p>
                          )}
                        </div>

                        {patient.allergies && (
                          <div className="mt-2">
                            <Badge className="text-xs bg-red-100 text-red-800">
                              Allergies: {typeof patient.allergies === 'string' 
                                ? patient.allergies.substring(0, 30)
                                : patient.allergies.join(', ').substring(0, 30)}
                              {(typeof patient.allergies === 'string' 
                                ? patient.allergies.length 
                                : patient.allergies.join(', ').length) > 30 ? '...' : ''}
                            </Badge>
                          </div>
                        )}
                      </div>

                      <Button className="ml-2 shrink-0">
                        Select
                      </Button>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>

          {patients.length > 0 && (
            <p className="text-xs text-gray-500 text-center">
              Showing {patients.length} result{patients.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
