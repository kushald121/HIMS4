'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, HospitalUser } from '@/app/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  hospitalId: number | null;
  hospitalUser: HospitalUser | null;
  hospitals: any[];
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  selectHospital: (hospitalId: number) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [hospitalId, setHospitalId] = useState<number | null>(null);
  const [hospitalUser, setHospitalUser] = useState<HospitalUser | null>(null);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const storedHospitalId = localStorage.getItem('hospitalId');
    const storedHospitals = localStorage.getItem('hospitals');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      if (storedHospitalId) {
        setHospitalId(parseInt(storedHospitalId));
      }
      if (storedHospitals) {
        setHospitals(JSON.parse(storedHospitals));
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error);
    }

    setToken(data.data.token);
    setUser(data.data.user);
    setHospitals(data.data.hospitals || []);

    localStorage.setItem('token', data.data.token);
    localStorage.setItem('user', JSON.stringify(data.data.user));
    localStorage.setItem('hospitals', JSON.stringify(data.data.hospitals || []));
  };

  const register = async (userData: any) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error);
    }
  };

  const logout = async () => {
    if (token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
    }

    setUser(null);
    setToken(null);
    setHospitalId(null);
    setHospitalUser(null);
    setHospitals([]);

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('hospitalId');
    localStorage.removeItem('hospitals');
  };

  const selectHospital = (hospitalId: number) => {
    setHospitalId(hospitalId);
    localStorage.setItem('hospitalId', hospitalId.toString());

    const hospital = hospitals.find(h => h.hospital_id === hospitalId);
    if (hospital) {
      setHospitalUser({
        id: hospital.id,
        hospital_id: hospitalId,
        user_id: user!.id,
        role: hospital.role,
        employee_id: hospital.employee_id,
        department: hospital.department,
        created_at: hospital.created_at,
        updated_at: hospital.updated_at
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        hospitalId,
        hospitalUser,
        hospitals,
        login,
        register,
        logout,
        selectHospital,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
