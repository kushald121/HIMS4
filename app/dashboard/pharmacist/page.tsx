'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  FileText, 
  AlertCircle, 
  TrendingDown,
  CheckCircle,
  Clock,
  Pill
} from 'lucide-react';
import { format } from 'date-fns';
import type { Prescription, Inventory } from '@/app/types';

export default function PharmacistDashboard() {
  const { user, token, hospitalId, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    pendingPrescriptions: 0,
    fulfilledToday: 0,
    totalInventory: 0,
    lowStockItems: 0,
    outOfStock: 0,
  });
  const [pendingQueue, setPendingQueue] = useState<Prescription[]>([]);
  const [lowStockItems, setLowStockItems] = useState<Inventory[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!user || !hospitalId)) {
      router.push('/dashboard');
    }
    if (user && hospitalId) {
      fetchDashboardData();
    }
  }, [user, hospitalId, loading]);

  const fetchDashboardData = async () => {
    try {
      setStatsLoading(true);
      const today = format(new Date(), 'yyyy-MM-dd');

      // Fetch prescriptions
      const presParams = new URLSearchParams();
      if (hospitalId) presParams.append('hospital_id', hospitalId.toString());

      const presResponse = await fetch(`/api/prescriptions?${presParams}`);
      if (presResponse.ok) {
        const presData = await presResponse.json();
        const prescriptions = presData.prescriptions || [];
        
        const pending = prescriptions.filter((p: Prescription) => p.status === 'pending');
        const fulfilledToday = prescriptions.filter(
          (p: Prescription) =>
            p.status === 'filled' &&
            p.filled_at &&
            p.filled_at.startsWith(today)
        );

        setPendingQueue(pending.slice(0, 5));

        // Fetch inventory
        const invParams = new URLSearchParams();
        if (hospitalId) invParams.append('hospital_id', hospitalId.toString());

        const invResponse = await fetch(`/api/inventory?${invParams}`);
        if (invResponse.ok) {
          const invData = await invResponse.json();
          const inventory = invData.medications || [];
          
          const lowStock = inventory.filter(
            (item: Inventory) =>
              (item.quantity_in_stock ?? item.current_stock) <= (item.reorder_level ?? item.minimum_stock)
          );
          const outOfStock = inventory.filter(
            (item: Inventory) => (item.quantity_in_stock ?? item.current_stock) === 0
          );

          setLowStockItems(lowStock.slice(0, 5));
          setStats({
            pendingPrescriptions: pending.length,
            fulfilledToday: fulfilledToday.length,
            totalInventory: inventory.length,
            lowStockItems: lowStock.length,
            outOfStock: outOfStock.length,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleFulfillPrescription = (prescriptionId: number) => {
    router.push(`/dashboard/pharmacist/prescriptions?prescriptionId=${prescriptionId}`);
  };

  if (loading || !user || !hospitalId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <DashboardLayout
      title="Pharmacist Dashboard"
      description={`Welcome back, ${user.first_name}`}
      role="pharmacist"
    >
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Queue</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingPrescriptions}</div>
            <p className="text-xs text-gray-600 mt-1">Awaiting fulfillment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Fulfilled Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.fulfilledToday}</div>
            <p className="text-xs text-gray-600 mt-1">Completed today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Inventory Items</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInventory}</div>
            <p className="text-xs text-gray-600 mt-1">Total medications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Low Stock</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.lowStockItems}</div>
            <p className="text-xs text-gray-600 mt-1">{stats.outOfStock} out of stock</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Pending Prescriptions Queue */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Pending Prescriptions
              </CardTitle>
              <Button
                onClick={() => router.push('/dashboard/pharmacist/prescriptions')}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-24 bg-gray-200 animate-pulse rounded" />
                ))}
              </div>
            ) : pendingQueue.length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {pendingQueue.map((prescription) => (
                  <div
                    key={prescription.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold">
                          {prescription.patients
                            ? `${prescription.patients.first_name} ${prescription.patients.last_name}`
                            : 'Unknown Patient'}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {prescription.prescription_number || 'N/A'}
                        </p>
                      </div>
                      <Badge className="bg-orange-100 text-orange-800">
                        PENDING
                      </Badge>
                    </div>

                    <div className="text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Pill className="h-3 w-3" />
                        <span>
                          {prescription.prescription_items?.length || 0} medication(s)
                        </span>
                      </div>
                      {prescription.created_at && (
                        <p className="text-xs mt-1">
                          Prescribed: {format(new Date(prescription.created_at), 'MMM dd, yyyy HH:mm')}
                        </p>
                      )}
                    </div>

                    <Button
                      onClick={() => handleFulfillPrescription(prescription.id!)}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Process Prescription
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-600">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No pending prescriptions</p>
                <p className="text-sm text-green-600 mt-1">Queue is clear!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                Low Stock Alerts
              </CardTitle>
              <Button
                onClick={() => router.push('/dashboard/pharmacist/inventory')}
              >
                Manage Inventory
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 animate-pulse rounded" />
                ))}
              </div>
            ) : lowStockItems.length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {lowStockItems.map((item) => {
                  const currentStock = item.quantity_in_stock ?? item.current_stock;
                  const reorderLevel = item.reorder_level ?? item.minimum_stock;
                  return (
                    <div
                      key={item.id}
                      className={`border rounded-lg p-4 ${
                        currentStock === 0
                          ? 'border-red-300 bg-red-50'
                          : 'border-orange-300 bg-orange-50'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold">{item.medication_name}</h4>
                          <p className="text-sm text-gray-600">
                            {item.generic_name || 'N/A'}
                          </p>
                        </div>
                        <Badge
                          className={
                            currentStock === 0
                              ? 'bg-red-100 text-red-800'
                              : 'bg-orange-100 text-orange-800'
                          }
                        >
                          {currentStock === 0 ? 'OUT OF STOCK' : 'LOW STOCK'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Current: </span>
                          <span className="font-semibold">{currentStock}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Reorder at: </span>
                          <span className="font-semibold">{reorderLevel}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-600">
                <Package className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>All items in stock</p>
                <p className="text-sm text-green-600 mt-1">No alerts</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <Button
            onClick={() => router.push('/dashboard/pharmacist/prescriptions')}
            className="justify-start h-auto py-4"
          >
            <FileText className="mr-3 h-5 w-5" />
            <div className="text-left">
              <div className="font-semibold">Process Prescriptions</div>
              <div className="text-xs opacity-90">Fulfill pending prescriptions</div>
            </div>
          </Button>
          <Button
            onClick={() => router.push('/dashboard/pharmacist/inventory')}
            className="justify-start h-auto py-4"
          >
            <Package className="mr-3 h-5 w-5" />
            <div className="text-left">
              <div className="font-semibold">Manage Inventory</div>
              <div className="text-xs opacity-90">Add medications & adjust stock</div>
            </div>
          </Button>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
