'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  UserPlus,
  Search,
  Edit,
  Trash2,
  Mail,
  Phone,
  Briefcase,
  Shield,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import type { HospitalUser, User } from '@/app/types';

interface StaffMember extends HospitalUser {
  users?: User;
}

export default function StaffManagementPage() {
  const { user, token, hospitalId, loading: authLoading } = useAuth();
  const router = useRouter();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: 'receptionist',
    employee_id: '',
    department: '',
    specialization: '',
    license_number: ''
  });

  useEffect(() => {
    if (!authLoading && (!user || !hospitalId)) {
      router.push('/dashboard');
    }
    if (user && hospitalId) {
      fetchStaff();
    }
  }, [user, hospitalId, authLoading]);

  useEffect(() => {
    filterStaff();
  }, [searchQuery, roleFilter, staff]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/staff?hospital_id=${hospitalId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-hospital-id': hospitalId!.toString()
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStaff(data.data?.staff || []);
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch staff:', errorData);
        setError(errorData.error || 'Failed to fetch staff members');
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
      setError('Failed to fetch staff members');
    } finally {
      setLoading(false);
    }
  };

  const filterStaff = () => {
    let filtered = staff;

    if (searchQuery) {
      filtered = filtered.filter(s =>
        s.users?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.users?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.users?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.employee_id?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(s => s.role === roleFilter);
    }

    setFilteredStaff(filtered);
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-hospital-id': hospitalId!.toString()
        },
        body: JSON.stringify({
          ...formData,
          hospital_id: hospitalId
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to add staff member');
      }

      setSuccess('Staff member added successfully');
      setShowAddDialog(false);
      resetForm();
      fetchStaff();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;

    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/staff/${selectedStaff.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-hospital-id': hospitalId!.toString()
        },
        body: JSON.stringify({
          ...formData,
          hospital_id: hospitalId
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to update staff member');
      }

      setSuccess('Staff member updated successfully');
      setShowEditDialog(false);
      setSelectedStaff(null);
      resetForm();
      fetchStaff();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteStaff = async (staffId: number) => {
    if (!confirm('Are you sure you want to remove this staff member?')) return;

    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/staff/${staffId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-hospital-id': hospitalId!.toString()
        }
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete staff member');
      }

      setSuccess('Staff member removed successfully');
      fetchStaff();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleToggleStatus = async (staffMember: StaffMember) => {
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/staff/${staffMember.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-hospital-id': hospitalId!.toString()
        },
        body: JSON.stringify({
          is_active: !staffMember.is_active
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to update status');
      }

      setSuccess(`Staff member ${staffMember.is_active ? 'deactivated' : 'activated'} successfully`);
      fetchStaff();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openEditDialog = (staffMember: StaffMember) => {
    setSelectedStaff(staffMember);
    setFormData({
      email: staffMember.users?.email || '',
      password: '',
      first_name: staffMember.users?.first_name || '',
      last_name: staffMember.users?.last_name || '',
      phone: staffMember.users?.phone || '',
      role: staffMember.role,
      employee_id: staffMember.employee_id || '',
      department: staffMember.department || '',
      specialization: staffMember.specialization || '',
      license_number: staffMember.license_number || ''
    });
    setShowEditDialog(true);
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      phone: '',
      role: 'receptionist',
      employee_id: '',
      department: '',
      specialization: '',
      license_number: ''
    });
    setShowPassword(false);
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-100 text-red-800 border-red-200',
      doctor: 'bg-blue-100 text-blue-800 border-blue-200',
      pharmacist: 'bg-green-100 text-green-800 border-green-200',
      receptionist: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[role] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const statsCards = [
    {
      title: 'Total Staff',
      value: staff.length,
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Doctors',
      value: staff.filter(s => s.role === 'doctor').length,
      icon: Briefcase,
      color: 'text-green-600'
    },
    {
      title: 'Pharmacists',
      value: staff.filter(s => s.role === 'pharmacist').length,
      icon: Shield,
      color: 'text-purple-600'
    },
    {
      title: 'Receptionists',
      value: staff.filter(s => s.role === 'receptionist').length,
      icon: Users,
      color: 'text-orange-600'
    }
  ];

  if (authLoading || !user || !hospitalId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <DashboardLayout title="Staff Management" role="admin">
      {/* Alerts */}
      {error && (
        <Alert className="mb-6 bg-red-50 border-red-200">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-6">
        {statsCards.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters and Actions */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, or employee ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="doctor">Doctors</option>
              <option value="pharmacist">Pharmacists</option>
              <option value="receptionist">Receptionists</option>
              <option value="admin">Admins</option>
            </select>
            <Button onClick={() => setShowAddDialog(true)} className="bg-blue-600 hover:bg-blue-700">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Staff Member
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Members ({filteredStaff.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 animate-pulse rounded" />
              ))}
            </div>
          ) : filteredStaff.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Employee ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredStaff.map((staffMember) => (
                    <tr key={staffMember.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="font-medium text-sm">
                          {staffMember.users?.first_name} {staffMember.users?.last_name}
                        </div>
                        {staffMember.users?.phone && (
                          <div className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                            <Phone className="h-3 w-3" />
                            {staffMember.users.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-600 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {staffMember.users?.email}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge className={getRoleBadgeColor(staffMember.role)}>
                          {staffMember.role?.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-sm">{staffMember.employee_id || '-'}</td>
                      <td className="px-4 py-4 text-sm">{staffMember.department || '-'}</td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => handleToggleStatus(staffMember)}
                          className="flex items-center gap-1"
                        >
                          {staffMember.is_active ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800 border-gray-200">
                              <XCircle className="h-3 w-3 mr-1" />
                              Inactive
                            </Badge>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() => openEditDialog(staffMember)}
                            className="bg-blue-600 hover:bg-blue-700 px-3 py-1 text-sm"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleDeleteStaff(staffMember.id)}
                            className="bg-red-600 hover:bg-red-700 px-3 py-1 text-sm"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No staff members found</h3>
              <p className="text-gray-600">
                {searchQuery || roleFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Get started by adding your first staff member'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Staff Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Staff Member</DialogTitle>
            <DialogDescription>Create a new staff member account</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddStaff} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role">Role *</Label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="receptionist">Receptionist</option>
                  <option value="doctor">Doctor</option>
                  <option value="pharmacist">Pharmacist</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <Label htmlFor="employee_id">Employee ID</Label>
                <Input
                  id="employee_id"
                  value={formData.employee_id}
                  onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
              />
            </div>

            {formData.role === 'doctor' && (
              <>
                <div>
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input
                    id="specialization"
                    value={formData.specialization}
                    onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="license_number">License Number</Label>
                  <Input
                    id="license_number"
                    value={formData.license_number}
                    onChange={(e) => setFormData({...formData, license_number: e.target.value})}
                  />
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                onClick={() => {
                  setShowAddDialog(false);
                  resetForm();
                }}
                className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Add Staff Member
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Staff Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
            <DialogDescription>Update staff member information</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateStaff} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_first_name">First Name *</Label>
                <Input
                  id="edit_first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_last_name">Last Name *</Label>
                <Input
                  id="edit_last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit_phone">Phone</Label>
              <Input
                id="edit_phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_role">Role *</Label>
                <select
                  id="edit_role"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="receptionist">Receptionist</option>
                  <option value="doctor">Doctor</option>
                  <option value="pharmacist">Pharmacist</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <Label htmlFor="edit_employee_id">Employee ID</Label>
                <Input
                  id="edit_employee_id"
                  value={formData.employee_id}
                  onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit_department">Department</Label>
              <Input
                id="edit_department"
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
              />
            </div>

            {formData.role === 'doctor' && (
              <>
                <div>
                  <Label htmlFor="edit_specialization">Specialization</Label>
                  <Input
                    id="edit_specialization"
                    value={formData.specialization}
                    onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_license_number">License Number</Label>
                  <Input
                    id="edit_license_number"
                    value={formData.license_number}
                    onChange={(e) => setFormData({...formData, license_number: e.target.value})}
                  />
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                onClick={() => {
                  setShowEditDialog(false);
                  setSelectedStaff(null);
                  resetForm();
                }}
                className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Update Staff Member
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
