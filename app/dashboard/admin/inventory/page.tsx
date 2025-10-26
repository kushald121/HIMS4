'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, AlertCircle, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminInventoryPage() {
  const { token, hospitalId, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [inventory, setInventory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingData, setLoadingData] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showLowStock, setShowLowStock] = useState(false);
  const [formData, setFormData] = useState({
    medication_name: '',
    generic_name: '',
    category: '',
    manufacturer: '',
    batch_number: '',
    expiry_date: '',
    stock_quantity: 0,
    reorder_threshold: 10,
    unit_price: 0
  });

  useEffect(() => {
    if (!loading && (!token || !hospitalId)) {
      router.push('/dashboard');
    } else if (token && hospitalId) {
      fetchInventory();
    }
  }, [token, hospitalId, loading, router]);

  const fetchInventory = async () => {
    try {
      const url = `/api/inventory?search=${searchTerm}${showLowStock ? '&low_stock=true' : ''}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-hospital-id': hospitalId!.toString()
        }
      });
      const data = await response.json();
      if (data.success) {
        setInventory(data.data.inventory || []);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-hospital-id': hospitalId!.toString()
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Inventory item added successfully'
        });
        setShowAddDialog(false);
        fetchInventory();
        setFormData({
          medication_name: '',
          generic_name: '',
          category: '',
          manufacturer: '',
          batch_number: '',
          expiry_date: '',
          stock_quantity: 0,
          reorder_threshold: 10,
          unit_price: 0
        });
      } else {
        toast({
          title: 'Error',
          description: data.error,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add inventory item',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateStock = async (id: number, newQuantity: number) => {
    try {
      const response = await fetch('/api/inventory', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-hospital-id': hospitalId!.toString()
        },
        body: JSON.stringify({ id, stock_quantity: newQuantity })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Stock updated successfully'
        });
        fetchInventory();
      } else {
        toast({
          title: 'Error',
          description: data.error,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update stock',
        variant: 'destructive'
      });
    }
  };

  if (loading || loadingData) {
    return (
      <DashboardLayout title="Inventory" role="admin">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  const lowStockCount = inventory.filter(item => item.stock_quantity <= item.reorder_threshold).length;

  return (
    <DashboardLayout title="Inventory Management" description="Manage medication stock and supplies" role="admin">
      <div className="mb-6">
        {lowStockCount > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-orange-800">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">
                  {lowStockCount} item{lowStockCount !== 1 ? 's' : ''} below reorder threshold
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Medication Inventory</CardTitle>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Inventory Item</DialogTitle>
                  <DialogDescription>Add a new medication to the inventory</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddItem} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="medication_name">Medication Name *</Label>
                      <Input
                        id="medication_name"
                        value={formData.medication_name}
                        onChange={(e) => setFormData({ ...formData, medication_name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="generic_name">Generic Name</Label>
                      <Input
                        id="generic_name"
                        value={formData.generic_name}
                        onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Input
                        id="category"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="manufacturer">Manufacturer</Label>
                      <Input
                        id="manufacturer"
                        value={formData.manufacturer}
                        onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="batch_number">Batch Number</Label>
                      <Input
                        id="batch_number"
                        value={formData.batch_number}
                        onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expiry_date">Expiry Date</Label>
                      <Input
                        id="expiry_date"
                        type="date"
                        value={formData.expiry_date}
                        onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="stock_quantity">Stock Quantity *</Label>
                      <Input
                        id="stock_quantity"
                        type="number"
                        min="0"
                        value={formData.stock_quantity}
                        onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reorder_threshold">Reorder Threshold</Label>
                      <Input
                        id="reorder_threshold"
                        type="number"
                        min="0"
                        value={formData.reorder_threshold}
                        onChange={(e) => setFormData({ ...formData, reorder_threshold: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unit_price">Unit Price</Label>
                      <Input
                        id="unit_price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.unit_price}
                        onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Add Item</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search medications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchInventory()}
              className="max-w-sm"
            />
            <Button onClick={fetchInventory}>Search</Button>
            <Button
              variant={showLowStock ? 'default' : 'outline'}
              onClick={() => {
                setShowLowStock(!showLowStock);
                setTimeout(fetchInventory, 100);
              }}
            >
              <AlertCircle className="mr-2 h-4 w-4" />
              Low Stock Only
            </Button>
          </div>

          {inventory.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No inventory items found. Add your first item to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medication</TableHead>
                  <TableHead>Generic Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.map((item) => {
                  const isLowStock = item.stock_quantity <= item.reorder_threshold;
                  const isExpiringSoon = item.expiry_date &&
                    new Date(item.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.medication_name}</TableCell>
                      <TableCell>{item.generic_name || '-'}</TableCell>
                      <TableCell>{item.category || '-'}</TableCell>
                      <TableCell>{item.batch_number || '-'}</TableCell>
                      <TableCell>
                        {item.expiry_date ? (
                          <span className={isExpiringSoon ? 'text-orange-600' : ''}>
                            {new Date(item.expiry_date).toLocaleDateString()}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <span className={isLowStock ? 'text-orange-600 font-semibold' : ''}>
                          {item.stock_quantity}
                        </span>
                      </TableCell>
                      <TableCell>
                        {isLowStock ? (
                          <Badge variant="destructive">Low Stock</Badge>
                        ) : (
                          <Badge variant="outline">In Stock</Badge>
                        )}
                      </TableCell>
                      <TableCell>${item.unit_price?.toFixed(2) || '0.00'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
