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
import { useToast } from '@/hooks/use-toast';

const medicationSchema = z.object({
  medication_name: z.string().min(1, 'Medication name is required'),
  generic_name: z.string().optional(),
  brand_name: z.string().optional(),
  category: z.string().optional(),
  form: z.string().optional(),
  strength: z.string().optional(),
  manufacturer: z.string().optional(),
  supplier: z.string().optional(),
  batch_number: z.string().optional(),
  manufacture_date: z.string().optional(),
  expiry_date: z.string().optional(),
  current_stock: z.number().min(0, 'Stock must be 0 or greater'),
  minimum_stock: z.number().min(0, 'Minimum stock must be 0 or greater'),
  maximum_stock: z.number().min(0, 'Maximum stock must be 0 or greater'),
  unit_cost: z.number().min(0, 'Unit cost must be 0 or greater').optional(),
  selling_price: z.number().min(0, 'Selling price must be 0 or greater').optional(),
  storage_location: z.string().optional(),
});

type MedicationFormData = z.infer<typeof medicationSchema>;

interface AddMedicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hospitalId: string;
  onSuccess?: () => void;
}

export default function AddMedicationDialog({
  open,
  onOpenChange,
  hospitalId,
  onSuccess,
}: AddMedicationDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<MedicationFormData>({
    resolver: zodResolver(medicationSchema),
    defaultValues: {
      current_stock: 0,
      minimum_stock: 10,
      maximum_stock: 100,
    },
  });

  const onSubmit = async (data: MedicationFormData) => {
    try {
      setLoading(true);

      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          hospital_id: hospitalId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add medication');
      }

      toast({
        title: 'Success',
        description: 'Medication added successfully',
      });

      reset();
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error adding medication:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add medication',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Medication</DialogTitle>
          <DialogDescription>
            Enter medication details to add to inventory
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Medication Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Medication Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="medication_name">
                  Medication Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="medication_name"
                  {...register('medication_name')}
                  placeholder="e.g., Paracetamol"
                />
                {errors.medication_name && (
                  <p className="text-sm text-red-500">{errors.medication_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="generic_name">Generic Name</Label>
                <Input
                  id="generic_name"
                  {...register('generic_name')}
                  placeholder="e.g., Acetaminophen"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand_name">Brand Name</Label>
                <Input id="brand_name" {...register('brand_name')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  {...register('category')}
                  placeholder="e.g., Analgesic"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="form">Form</Label>
                <Input
                  id="form"
                  {...register('form')}
                  placeholder="e.g., Tablet, Syrup"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="strength">Strength</Label>
                <Input
                  id="strength"
                  {...register('strength')}
                  placeholder="e.g., 500mg"
                />
              </div>
            </div>
          </div>

          {/* Supplier Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Supplier Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Input id="manufacturer" {...register('manufacturer')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Input id="supplier" {...register('supplier')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="batch_number">Batch Number</Label>
                <Input id="batch_number" {...register('batch_number')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="storage_location">Storage Location</Label>
                <Input id="storage_location" {...register('storage_location')} />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Dates</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manufacture_date">Manufacture Date</Label>
                <Input id="manufacture_date" type="date" {...register('manufacture_date')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiry_date">Expiry Date</Label>
                <Input id="expiry_date" type="date" {...register('expiry_date')} />
              </div>
            </div>
          </div>

          {/* Stock Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Stock Information</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="current_stock">
                  Current Stock <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="current_stock"
                  type="number"
                  {...register('current_stock', { valueAsNumber: true })}
                />
                {errors.current_stock && (
                  <p className="text-sm text-red-500">{errors.current_stock.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="minimum_stock">
                  Minimum Stock <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="minimum_stock"
                  type="number"
                  {...register('minimum_stock', { valueAsNumber: true })}
                />
                {errors.minimum_stock && (
                  <p className="text-sm text-red-500">{errors.minimum_stock.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="maximum_stock">
                  Maximum Stock <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="maximum_stock"
                  type="number"
                  {...register('maximum_stock', { valueAsNumber: true })}
                />
                {errors.maximum_stock && (
                  <p className="text-sm text-red-500">{errors.maximum_stock.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Pricing</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit_cost">Unit Cost</Label>
                <Input
                  id="unit_cost"
                  type="number"
                  step="0.01"
                  {...register('unit_cost', { valueAsNumber: true })}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="selling_price">Selling Price</Label>
                <Input
                  id="selling_price"
                  type="number"
                  step="0.01"
                  {...register('selling_price', { valueAsNumber: true })}
                  placeholder="0.00"
                />
              </div>
            </div>
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
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Medication'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
