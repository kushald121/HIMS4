'use client';

import { useState } from 'react';
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
import { Edit, Trash2, AlertCircle, Package } from 'lucide-react';
import { format } from 'date-fns';
import type { Inventory } from '@/app/types';

interface InventoryTableProps {
  items: Inventory[];
  onEdit?: (item: Inventory) => void;
  onDelete?: (item: Inventory) => void;
  onAdjustStock?: (item: Inventory) => void;
  loading?: boolean;
}

export default function InventoryTable({
  items,
  onEdit,
  onDelete,
  onAdjustStock,
  loading,
}: InventoryTableProps) {
  const getStockStatus = (item: Inventory) => {
    const quantity = item.current_stock || 0;
    const reorderThreshold = item.minimum_stock || 10;

    if (quantity === 0) {
      return { label: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    } else if (quantity <= reorderThreshold) {
      return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { label: 'In Stock', color: 'bg-green-100 text-green-800' };
    }
  };

  const getExpiryStatus = (expiryDate: string | null | undefined) => {
    if (!expiryDate) return null;

    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.floor(
      (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry < 0) {
      return { label: 'Expired', color: 'bg-red-100 text-red-800', critical: true };
    } else if (daysUntilExpiry <= 30) {
      return { label: `Expires in ${daysUntilExpiry}d`, color: 'bg-yellow-100 text-yellow-800', critical: true };
    } else if (daysUntilExpiry <= 90) {
      return { label: `Expires in ${daysUntilExpiry}d`, color: 'bg-blue-100 text-blue-800', critical: false };
    }
    return null;
  };

  if (loading) {
    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Medication</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={7}>
                  <div className="h-8 bg-gray-200 animate-pulse rounded" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="border rounded-lg p-12 text-center">
        <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No inventory items</h3>
        <p className="text-gray-600 mb-4">
          Get started by adding your first medication to inventory
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Medication</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Stock Quantity</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Expiry Date</TableHead>
            <TableHead>Batch Number</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const stockStatus = getStockStatus(item);
            const expiryStatus = getExpiryStatus(item.expiry_date);

            return (
              <TableRow key={item.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{item.medication_name}</p>
                    {item.generic_name && (
                      <p className="text-sm text-gray-600">{item.generic_name}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge>{item.category}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end">
                    <span className="font-medium">{item.current_stock}</span>
                    <span className="text-xs text-gray-500">
                      Reorder at: {item.minimum_stock || 10}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Badge className={stockStatus.color}>{stockStatus.label}</Badge>
                    {expiryStatus?.critical && (
                      <Badge className={expiryStatus.color}>
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {expiryStatus.label}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {item.expiry_date ? (
                    <span className={expiryStatus?.critical ? 'text-red-600 font-medium' : ''}>
                      {format(new Date(item.expiry_date), 'MMM dd, yyyy')}
                    </span>
                  ) : (
                    <span className="text-gray-400">N/A</span>
                  )}
                </TableCell>
                <TableCell>
                  {item.batch_number || <span className="text-gray-400">N/A</span>}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    {onAdjustStock && (
                      <Button
                        onClick={() => onAdjustStock(item)}
                        className="border"
                      >
                        <Package className="h-4 w-4" />
                      </Button>
                    )}
                    {onEdit && (
                      <Button
                        onClick={() => onEdit(item)}
                        className="border"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        onClick={() => onDelete(item)}
                        className="border"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
