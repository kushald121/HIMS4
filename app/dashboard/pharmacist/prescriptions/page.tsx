'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import PrescriptionCard from '@/app/components/prescriptions/PrescriptionCard';
import PrescriptionFulfillmentDialog from '@/app/components/prescriptions/PrescriptionFulfillmentDialog';
import { Search, Pill, PackageCheck, AlertTriangle, Package } from 'lucide-react';
import type { Prescription } from '@/app/types';

export default function PharmacistPrescriptionsPage() {
  const { user, hospitalId } = useAuth();
  const { toast } = useToast();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [fulfillmentDialogOpen, setFulfillmentDialogOpen] = useState(false);

  useEffect(() => {
    fetchPrescriptions();
  }, [hospitalId]);

  useEffect(() => {
    filterPrescriptions();
  }, [prescriptions, searchQuery, activeTab]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (hospitalId) params.append('hospital_id', hospitalId.toString());

      const response = await fetch(`/api/prescriptions?${params}`);
      if (!response.ok) throw new Error('Failed to fetch prescriptions');

      const data = await response.json();
      setPrescriptions(data.prescriptions || []);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load prescriptions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterPrescriptions = () => {
    let filtered = prescriptions;

    // Filter by status (active tab)
    if (activeTab !== 'all') {
      filtered = filtered.filter((p) => p.status === activeTab);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.prescription_number?.toLowerCase().includes(query) ||
          (p.patient &&
            `${p.patient.first_name} ${p.patient.last_name}`.toLowerCase().includes(query))
      );
    }

    setFilteredPrescriptions(filtered);
  };

  const handleFulfill = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setFulfillmentDialogOpen(true);
  };

  const handleFulfillmentSuccess = () => {
    fetchPrescriptions();
    toast({
      title: 'Success',
      description: 'Prescription fulfilled successfully',
    });
  };

  const handlePrint = (prescription: Prescription) => {
    // Implement print functionality
    window.print();
  };

  const getStats = () => {
    return {
      pending: prescriptions.filter((p) => p.status === 'pending').length,
      filled: prescriptions.filter((p) => p.status === 'filled').length,
      partially_filled: prescriptions.filter((p) => p.status === 'partially_filled').length,
      out_of_stock: prescriptions.filter((p) => p.status === 'out_of_stock').length,
    };
  };

  const stats = getStats();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Prescriptions</h1>
          <p className="text-gray-600">Manage and fulfill prescriptions</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Pill className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-gray-600">Awaiting fulfillment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Fulfilled Today</CardTitle>
            <PackageCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.filled}</div>
            <p className="text-xs text-gray-600">Successfully dispensed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Partially Filled</CardTitle>
            <Package className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.partially_filled}</div>
            <p className="text-xs text-gray-600">Incomplete fulfillment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.out_of_stock}</div>
            <p className="text-xs text-gray-600">Stock unavailable</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search by prescription number or patient name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Prescriptions Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            All
            <Badge className="ml-2">{prescriptions.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending
            <Badge className="ml-2 bg-blue-100 text-blue-800">{stats.pending}</Badge>
          </TabsTrigger>
          <TabsTrigger value="filled">
            Filled
            <Badge className="ml-2 bg-green-100 text-green-800">{stats.filled}</Badge>
          </TabsTrigger>
          <TabsTrigger value="partially_filled">
            Partial
            <Badge className="ml-2 bg-yellow-100 text-yellow-800">{stats.partially_filled}</Badge>
          </TabsTrigger>
          <TabsTrigger value="out_of_stock">
            Out of Stock
            <Badge className="ml-2 bg-red-100 text-red-800">{stats.out_of_stock}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="h-32 bg-gray-200 animate-pulse rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredPrescriptions.length > 0 ? (
            <div className="space-y-4">
              {filteredPrescriptions.map((prescription) => (
                <PrescriptionCard
                  key={prescription.id}
                  prescription={prescription}
                  onFulfill={handleFulfill}
                  onPrint={handlePrint}
                  showActions={true}
                  role="pharmacist"
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Pill className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No prescriptions found
                </h3>
                <p className="text-gray-600">
                  {searchQuery
                    ? 'Try adjusting your search criteria'
                    : 'No prescriptions in this category'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Fulfillment Dialog */}
      {selectedPrescription && user && (
        <PrescriptionFulfillmentDialog
          open={fulfillmentDialogOpen}
          onOpenChange={setFulfillmentDialogOpen}
          prescription={selectedPrescription}
          pharmacistId={user.id.toString()}
          onSuccess={handleFulfillmentSuccess}
        />
      )}
    </div>
  );
}
