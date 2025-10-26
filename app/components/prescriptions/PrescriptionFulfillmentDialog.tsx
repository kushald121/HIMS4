'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle, Package } from 'lucide-react';
import type { Prescription } from '@/app/types';

interface PrescriptionFulfillmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prescription: Prescription & {
    items?: any[];
    patient?: any;
  };
  pharmacistId: string;
  onSuccess?: () => void;
}

export default function PrescriptionFulfillmentDialog({
  open,
  onOpenChange,
  prescription,
  pharmacistId,
  onSuccess,
}: PrescriptionFulfillmentDialogProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleQuantityChange = (itemId: string, quantity: number) => {
    setQuantities({ ...quantities, [itemId]: quantity });
  };

  const handleFulfill = async () => {
    try {
      setLoading(true);

      // Build items array with dispensed quantities
      const items = (prescription.items || []).map((item) => ({
        item_id: item.id,
        quantity_dispensed: quantities[item.id] || 0,
      }));

      // Check if any quantity is dispensed
      const hasDispensedItems = items.some((item) => item.quantity_dispensed > 0);
      if (!hasDispensedItems) {
        toast({
          title: 'Error',
          description: 'Please enter at least one quantity to dispense',
          variant: 'destructive',
        });
        return;
      }

      const response = await fetch(`/api/prescriptions/${prescription.id}/fulfill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filled_by: pharmacistId,
          items,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fulfill prescription');
      }

      const result = await response.json();

      toast({
        title: 'Success',
        description: result.message || 'Prescription fulfilled successfully',
      });

      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Fulfillment error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fulfill prescription',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getTotalItems = () => {
    return prescription.items?.length || 0;
  };

  const getItemsToDispense = () => {
    return Object.values(quantities).filter((q) => q > 0).length;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Fulfill Prescription
          </DialogTitle>
          <DialogDescription>
            Review prescription details and enter quantities to dispense
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Prescription Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{prescription.prescription_number}</p>
                <p className="text-sm text-gray-600">
                  Patient: {prescription.patient?.first_name} {prescription.patient?.last_name}
                </p>
              </div>
              <Badge className="bg-blue-100 text-blue-800">
                {prescription.status}
              </Badge>
            </div>
          </div>

          {/* Patient Allergies Alert */}
          {prescription.patient?.allergies && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Patient Allergies:</strong> {prescription.patient.allergies}
              </AlertDescription>
            </Alert>
          )}

          {/* Medication Items */}
          <div className="space-y-3">
            <h3 className="font-semibold">Medications</h3>
            {prescription.items && prescription.items.length > 0 ? (
              prescription.items.map((item, index) => (
                <div key={item.id || index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{item.medication_name}</p>
                      <p className="text-sm text-gray-600">
                        {item.dosage} - {item.frequency}
                      </p>
                      <p className="text-sm text-gray-600">Duration: {item.duration}</p>
                      {item.instructions && (
                        <p className="text-sm text-gray-600 italic mt-1">
                          Instructions: {item.instructions}
                        </p>
                      )}
                    </div>
                    <Badge className="border border-gray-300 bg-white text-gray-700">
                      Prescribed: {item.quantity}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`quantity-${item.id}`}>
                        Quantity to Dispense
                      </Label>
                      <Input
                        id={`quantity-${item.id}`}
                        type="number"
                        min="0"
                        max={item.quantity}
                        value={quantities[item.id] || 0}
                        onChange={(e) =>
                          handleQuantityChange(item.id, parseInt(e.target.value) || 0)
                        }
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <div className="flex items-center gap-2 h-10">
                        {quantities[item.id] > 0 ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-600">
                              {quantities[item.id] >= item.quantity
                                ? 'Fully dispensed'
                                : 'Partially dispensed'}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm text-gray-500">Not dispensed</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No medications in this prescription</p>
            )}
          </div>

          {/* Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900">Summary</p>
            <p className="text-sm text-blue-800">
              Dispensing {getItemsToDispense()} of {getTotalItems()} medication(s)
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleFulfill}
              disabled={loading || getItemsToDispense() === 0}
            >
              {loading ? 'Processing...' : 'Fulfill Prescription'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
