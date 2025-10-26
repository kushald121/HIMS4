'use client';

import { useState } from 'react';
import DashboardLayout from '@/app/components/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, User, Phone } from 'lucide-react';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([
    {
      id: 1,
      patientName: 'John Doe',
      date: '2025-10-27',
      time: '10:00 AM',
      doctor: 'Dr. Smith',
      status: 'Confirmed'
    },
    {
      id: 2,
      patientName: 'Jane Smith',
      date: '2025-10-27',
      time: '11:30 AM',
      doctor: 'Dr. Johnson',
      status: 'Pending'
    }
  ]);

  const [newAppointment, setNewAppointment] = useState({
    patientName: '',
    date: '',
    time: '',
    doctor: '',
    phone: ''
  });

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real application, this would connect to the backend
    alert('Appointment created successfully!');
    setNewAppointment({
      patientName: '',
      date: '',
      time: '',
      doctor: '',
      phone: ''
    });
  };

  return (
    <DashboardLayout
      title="Appointments"
      description="Manage patient appointments"
      role="receptionist"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Create New Appointment</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateAppointment} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="patientName">Patient Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="patientName"
                    placeholder="Enter patient name"
                    className="pl-10"
                    value={newAppointment.patientName}
                    onChange={(e) => setNewAppointment({...newAppointment, patientName: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="date"
                      type="date"
                      className="pl-10"
                      value={newAppointment.date}
                      onChange={(e) => setNewAppointment({...newAppointment, date: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="time"
                      type="time"
                      className="pl-10"
                      value={newAppointment.time}
                      onChange={(e) => setNewAppointment({...newAppointment, time: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="doctor">Doctor</Label>
                <Input
                  id="doctor"
                  placeholder="Enter doctor name"
                  value={newAppointment.doctor}
                  onChange={(e) => setNewAppointment({...newAppointment, doctor: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter phone number"
                    className="pl-10"
                    value={newAppointment.phone}
                    onChange={(e) => setNewAppointment({...newAppointment, phone: e.target.value})}
                  />
                </div>
              </div>
              
              <Button type="submit" className="w-full">
                Create Appointment
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Today's Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div key={appointment.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{appointment.patientName}</h3>
                      <p className="text-sm text-gray-600">{appointment.doctor}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      appointment.status === 'Confirmed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {appointment.status}
                    </span>
                  </div>
                  <div className="flex items-center mt-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{appointment.date} at {appointment.time}</span>
                  </div>
                  <div className="flex space-x-2 mt-3">
                    <Button size="sm" variant="outline">Edit</Button>
                    <Button size="sm" variant="outline">Cancel</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}