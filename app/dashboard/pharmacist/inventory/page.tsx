'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import InventoryTable from '@/app/components/inventory/InventoryTable';
import AddMedicationDialog from '@/app/components/inventory/AddMedicationDialog';
import AdjustStockDialog from '@/app/components/inventory/AdjustStockDialog';
import {
  Search,
  Package,
  AlertTriangle,
  Calendar,
  Plus,
} from 'lucide-react';
import type { Inventory } from '@/app/types';

export default function PharmacistInventoryPage() {
  const { hospitalId } = useAuth();
  const { toast } = useToast();
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<Inventory | null>(null);

  useEffect(() => {
    fetchInventory();
  }, [hospitalId]);

  useEffect(() => {
    filterInventory();
  }, [inventory, searchQuery, categoryFilter]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (hospitalId) params.append('hospital_id', hospitalId.toString());

      const response = await fetch(`/api/inventory?${params}`);
      if (!response.ok) throw new Error('Failed to fetch inventory');

      const data = await response.json();
      setInventory(data.inventory || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast({
        title: 'Error',
        description: 'Failed to load inventory',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterInventory = () => {
    let filtered = inventory;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.medication_name?.toLowerCase().includes(query) ||
          item.generic_name?.toLowerCase().includes(query) ||
          item.category?.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (categoryFilter) {
      filtered = filtered.filter((item) => item.category === categoryFilter);
    }

    setFilteredInventory(filtered);
  };

  const handleAdjustStock = (medication: Inventory) => {
    setSelectedMedication(medication);
    setAdjustDialogOpen(true);
  };

  const handleEdit = (medication: Inventory) => {
    toast({
      title: 'Info',
      description: 'Edit functionality coming soon',
    });
  };

  const handleDelete = (medication: Inventory) => {
    toast({
      title: 'Info',
      description: 'Delete functionality coming soon',
    });
  };

  const getStats = () => {
    const totalItems = inventory.length;
    const lowStock = inventory.filter(
      (item) => item.current_stock <= item.minimum_stock
    ).length;
    const expiringSoon = inventory.filter((item) => {
      if (!item.expiry_date) return false;
      const expiry = new Date(item.expiry_date);
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      return expiry <= thirtyDaysFromNow;
    }).length;

    return { totalItems, lowStock, expiringSoon };
  };

  const getLowStockItems = () => {
    return inventory.filter((item) => item.current_stock <= item.minimum_stock);
  };

  const getExpiringItems = () => {
    return inventory.filter((item) => {
      if (!item.expiry_date) return false;
      const expiry = new Date(item.expiry_date);
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      return expiry <= thirtyDaysFromNow;
    });
  };

  const categories = Array.from(new Set(inventory.map((item) => item.category).filter(Boolean)));
  const stats = getStats();
  const lowStockItems = getLowStockItems();
  const expiringItems = getExpiringItems();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-gray-600">Manage medication stock and supplies</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Medication
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems}</div>
            <p className="text-xs text-gray-600">Medications in inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lowStock}</div>
            <p className="text-xs text-gray-600">Below minimum stock</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <Calendar className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.expiringSoon}</div>
            <p className="text-xs text-gray-600">Within 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {(lowStockItems.length > 0 || expiringItems.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lowStockItems.length > 0 && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription>
                <p className="font-semibold text-yellow-800 mb-2">
                  {lowStockItems.length} item(s) low on stock
                </p>
                <div className="space-y-1">
                  {lowStockItems.slice(0, 3).map((item) => (
                    <div key={item.id} className="text-sm text-yellow-700">
                      • {item.medication_name}: {item.current_stock} (min: {item.minimum_stock})
                    </div>
                  ))}
                  {lowStockItems.length > 3 && (
                    <p className="text-sm text-yellow-600">
                      and {lowStockItems.length - 3} more...
                    </p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {expiringItems.length > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <Calendar className="h-4 w-4 text-red-600" />
              <AlertDescription>
                <p className="font-semibold text-red-800 mb-2">
                  {expiringItems.length} item(s) expiring soon
                </p>
                <div className="space-y-1">
                  {expiringItems.slice(0, 3).map((item) => (
                    <div key={item.id} className="text-sm text-red-700">
                      • {item.medication_name}:{' '}
                      {item.expiry_date &&
                        new Date(item.expiry_date).toLocaleDateString()}
                    </div>
                  ))}
                  {expiringItems.length > 3 && (
                    <p className="text-sm text-red-600">
                      and {expiringItems.length - 3} more...
                    </p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search medications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
            </div>
            {categories.length > 0 && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="border rounded-md px-3 py-2"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            )}
            {(searchQuery || categoryFilter) && (
              <Button
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('');
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Medications</CardTitle>
            <Badge>
              {filteredInventory.length} of {inventory.length} items
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <InventoryTable
            items={filteredInventory}
            onAdjustStock={handleAdjustStock}
            onEdit={handleEdit}
            onDelete={handleDelete}
            loading={loading}
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      {hospitalId && (
        <>
          <AddMedicationDialog
            open={addDialogOpen}
            onOpenChange={setAddDialogOpen}
            hospitalId={hospitalId?.toString() || ''}
            onSuccess={fetchInventory}
          />
          <AdjustStockDialog
            open={adjustDialogOpen}
            onOpenChange={setAdjustDialogOpen}
            medication={selectedMedication}
            onSuccess={fetchInventory}
          />
        </>
      )}
    </div>
  );
}
