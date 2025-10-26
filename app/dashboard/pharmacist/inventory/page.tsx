'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, AlertCircle, Package } from 'lucide-react';

export default function PharmacistInventoryPage() {
  const { token, hospitalId, loading } = useAuth();
  const router = useRouter();
  const [inventory, setInventory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingData, setLoadingData] = useState(true);
  const [showLowStock, setShowLowStock] = useState(false);

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

  if (loading || loadingData) {
    return (
      <DashboardLayout title="Inventory" role="pharmacist">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  const lowStockCount = inventory.filter(item => item.stock_quantity <= item.reorder_threshold).length;

  return (
    <DashboardLayout title="Inventory" description="View and manage medication stock" role="pharmacist">
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
          <CardTitle>Medication Inventory</CardTitle>
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
              <p>No inventory items found.</p>
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
