'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Package } from 'lucide-react';
import type { Inventory } from '@/app/types';

const adjustStockSchema = z.object({
  quantity_change: z.number().int('Must be a whole number'),
  reason: z.string().min(3, 'Reason must be at least 3 characters'),
});

type AdjustStockFormData = z.infer<typeof adjustStockSchema>;

interface AdjustStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medication: Inventory | null;
  onSuccess?: () => void;
}

export default function AdjustStockDialog({
  open,
  onOpenChange,
  medication,
  onSuccess,
}: AdjustStockDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<AdjustStockFormData>({
    resolver: zodResolver(adjustStockSchema),
  });

  const quantityChange = watch('quantity_change', 0);
  const newStock = (medication?.current_stock || 0) + quantityChange;

  const onSubmit = async (data: AdjustStockFormData) => {
    if (!medication) return;

    try {
      setLoading(true);

      const response = await fetch('/api/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medication_id: medication.id,
          quantity_change: data.quantity_change,
          reason: data.reason,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to adjust stock');
      }

      toast({
        title: 'Success',
        description: 'Stock adjusted successfully',
      });

      reset();
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error adjusting stock:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to adjust stock',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!medication) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Adjust Stock
          </DialogTitle>
          <DialogDescription>
            Adjust inventory quantity for {medication.medication_name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Current Stock Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Current Stock:</span>
              <span className="font-semibold">{medication.current_stock}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Minimum Stock:</span>
              <span className="font-semibold">{medication.minimum_stock}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Maximum Stock:</span>
              <span className="font-semibold">{medication.maximum_stock}</span>
            </div>
          </div>

          {/* Quantity Change */}
          <div className="space-y-2">
            <Label htmlFor="quantity_change">
              Quantity Change <span className="text-red-500">*</span>
            </Label>
            <Input
              id="quantity_change"
              type="number"
              {...register('quantity_change', { valueAsNumber: true })}
              placeholder="Enter positive to add, negative to remove"
            />
            <p className="text-xs text-gray-500">
              Use positive numbers to add stock, negative to remove (e.g., 50 or -20)
            </p>
            {errors.quantity_change && (
              <p className="text-sm text-red-500">{errors.quantity_change.message}</p>
            )}
          </div>

          {/* New Stock Preview */}
          {quantityChange !== 0 && (
            <div
              className={`rounded-lg p-4 ${
                newStock < 0
                  ? 'bg-red-50 border border-red-200'
                  : newStock <= medication.minimum_stock
                  ? 'bg-yellow-50 border border-yellow-200'
                  : 'bg-blue-50 border border-blue-200'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">New Stock:</span>
                <span className="text-lg font-bold">{newStock}</span>
              </div>
              {newStock < 0 && (
                <p className="text-xs text-red-600 mt-1">
                  ⚠️ Warning: Stock cannot be negative
                </p>
              )}
              {newStock >= 0 && newStock <= medication.minimum_stock && (
                <p className="text-xs text-yellow-600 mt-1">
                  ⚠️ Warning: Below minimum stock level
                </p>
              )}
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">
              Reason <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reason"
              {...register('reason')}
              placeholder="e.g., Stock received from supplier, Damaged items removed, Physical count correction"
              rows={3}
            />
            {errors.reason && <p className="text-sm text-red-500">{errors.reason.message}</p>}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || newStock < 0}>
              {loading ? 'Adjusting...' : 'Adjust Stock'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
