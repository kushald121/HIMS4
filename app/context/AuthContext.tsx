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
  authLoading: boolean;
  authError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [hospitalId, setHospitalId] = useState<number | null>(null);
  const [hospitalUser, setHospitalUser] = useState<HospitalUser | null>(null);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

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
    setAuthLoading(true);
    setAuthError(null);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Login failed');
      }

      setToken(data.data.token);
      setUser(data.data.user);
      setHospitals(data.data.hospitals || []);

      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      localStorage.setItem('hospitals', JSON.stringify(data.data.hospitals || []));
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err.message || 'Login failed. Please try again.';
      setAuthError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setAuthLoading(false);
    }
  };

  const register = async (userData: any) => {
    setAuthLoading(true);
    setAuthError(null);
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Registration failed');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      const errorMessage = err.message || 'Registration failed. Please try again.';
      setAuthError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
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
        is_active: hospital.is_active || true,
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
        loading,
        authLoading,
        authError
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