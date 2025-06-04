'use client';

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const chartData = [
  { name: 'Jan', Sales: 1200 },
  { name: 'Feb', Sales: 2100 },
  { name: 'Mar', Sales: 800 },
  { name: 'Apr', Sales: 1600 },
];

const donutData = [
  { name: 'Service A', value: 35 },
  { name: 'Service B', value: 45 },
  { name: 'Service C', value: 20 },
];

const COLORS = ['#00bcd4', '#f43f5e', '#f59e0b'];

type Permission = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  pivot?: {
    role_id: number;
    permission_id: number;
  };
};

type Role = {
  id: number;
  name: string;
  slug: string;
  description: string;
  created_at: string;
  updated_at: string;
  permissions: Permission[];
};

type User = {
  id: number;
  name: string;
  email: string;
  role_id: number;
  email_verified_at: string;
  created_at: string;
  updated_at: string;
  role: Role;
};

type ApiResponse = {
  status: boolean;
  message: string;
  data: User;
};

// Function to get token from localStorage or wherever you store it
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    // Try different possible token storage keys
    return localStorage.getItem('token') || 
           localStorage.getItem('auth_token') || 
           localStorage.getItem('accessToken') ||
           sessionStorage.getItem('token') ||
           sessionStorage.getItem('auth_token');
  }
  return null;
};

// Function to fetch user profile from API
const fetchUserProfile = async (): Promise<User | null> => {
  try {
    const token = getAuthToken();
    
    console.log('🔍 Debug - Token found:', token ? 'Yes' : 'No');
    console.log('🔍 Debug - Token value:', token?.substring(0, 20) + '...');
    
    if (!token) {
      console.warn('❌ No authentication token found');
      console.log('🔍 Debug - Checking all storage locations:');
      console.log('localStorage.token:', localStorage.getItem('token'));
      console.log('localStorage.auth_token:', localStorage.getItem('auth_token'));
      console.log('localStorage.accessToken:', localStorage.getItem('accessToken'));
      console.log('sessionStorage.token:', sessionStorage.getItem('token'));
      console.log('sessionStorage.auth_token:', sessionStorage.getItem('auth_token'));
      return null;
    }

    console.log('🚀 Making API request to:', 'http://report-api.test/api/profile');

    // Ganti dengan URL yang sesuai environment Anda
    const apiUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:8000/api/profile'  // Laravel default
      : 'http://report-api.test/api/profile';
    
    console.log('🔗 API URL:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    console.log('📡 API Response status:', response.status);
    console.log('📡 API Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const result: ApiResponse = await response.json();
    console.log('✅ API Response data:', result);
    
    if (result.status && result.data) {
      console.log('✅ User data loaded successfully:', result.data.name);
      return result.data;
    } else {
      console.error('❌ API returned success=false:', result.message);
      throw new Error(result.message || 'Failed to fetch user data');
    }
  } catch (error) {
    console.error('❌ Error fetching user profile:', error);
    
    // Log more details about the error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('🌐 Network error - Check if API is running and CORS is configured');
    }
    
    return null;
  }
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Try to fetch user data from API
        const userData = await fetchUserProfile();
        
        if (userData) {
          setUser(userData);
        } else {
          // Fallback: Set mock user data for development/testing
          console.warn('Using fallback user data');
          setUser({
            id: 1,
            name: 'Demo User',
            email: 'demo@example.com',
            role_id: 1,
            email_verified_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            role: {
              id: 1,
              name: 'Administrator',
              slug: 'admin',
              description: 'Administrator role',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              permissions: []
            }
          });
          setError('Could not load user data from server. Using demo data.');
        }
      } catch (err) {
        console.error('Failed to load user data:', err);
        setError('Failed to load user data');
        
        // Set fallback user if there's an error
        setUser({
          id: 1,
          name: 'Guest User',
          email: 'guest@example.com',
          role_id: 1,
          email_verified_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          role: {
            id: 1,
            name: 'Guest',
            slug: 'guest',
            description: 'Guest role',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            permissions: []
          }
        });
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-white text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error notification */}
      {error && (
        <div className="bg-yellow-500/20 border border-yellow-500/50 text-yellow-200 px-4 py-3 rounded-lg mb-4">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-white/80 mt-1">Selamat datang, {user?.name || 'User'}!</p>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-white/60 text-sm">Role: {user?.role?.name}</span>
            <span className="text-white/60 text-sm">•</span>
            <span className="text-white/60 text-sm">ID: {user?.id}</span>
            <span className="text-white/60 text-sm">•</span>
            <span className="text-white/60 text-sm">
              Permissions: {user?.role?.permissions?.length || 0}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-white/60 text-sm">Email</div>
          <div className="text-white text-sm">{user?.email}</div>
          {user?.email_verified_at && (
            <div className="text-green-400 text-xs mt-1">✓ Verified</div>
          )}
        </div>
      </div>

      {/* User Info Card */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
        <h3 className="text-white font-medium mb-2">User Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-white/60">Created:</span>
            <div className="text-white">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
            </div>
          </div>
          <div>
            <span className="text-white/60">Last Updated:</span>
            <div className="text-white">
              {user?.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'N/A'}
            </div>
          </div>
          <div>
            <span className="text-white/60">Role Description:</span>
            <div className="text-white">{user?.role?.description || 'No description'}</div>
          </div>
        </div>
      </div>

      {/* Permissions Card */}
      {user?.role?.permissions && user.role.permissions.length > 0 && (
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
          <h3 className="text-white font-medium mb-2">Your Permissions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
            {user.role.permissions.map((permission) => (
              <div key={permission.id} className="bg-white/5 px-3 py-2 rounded text-sm">
                <div className="text-white font-medium">{permission.name}</div>
                <div className="text-white/60 text-xs">{permission.slug}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-lg text-white">
          <h3 className="text-sm font-medium text-blue-100">Total Sales</h3>
          <p className="text-2xl font-bold">5,700</p>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-lg text-white">
          <h3 className="text-sm font-medium text-green-100">Revenue</h3>
          <p className="text-2xl font-bold">$45,231</p>
        </div>
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-4 rounded-lg text-white">
          <h3 className="text-sm font-medium text-yellow-100">Orders</h3>
          <p className="text-2xl font-bold">1,234</p>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 rounded-lg text-white">
          <h3 className="text-sm font-medium text-purple-100">Customers</h3>
          <p className="text-2xl font-bold">567</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Penjualan Bulanan</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <XAxis 
                dataKey="name" 
                stroke="#64748b" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
              <Bar 
                dataKey="Sales" 
                fill="#6366f1" 
                radius={[4, 4, 0, 0]}
                name="Penjualan"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Line Chart */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Tren Penjualan</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <XAxis 
                dataKey="name" 
                stroke="#64748b" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="Sales" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#10b981' }}
                name="Penjualan"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Donut Chart */}
        <div className="bg-white p-6 rounded-lg shadow-lg col-span-full md:col-span-2">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Distribusi Layanan</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={donutData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={60}
                fill="#8884d8"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {donutData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value, entry) => (
                  <span style={{ color: entry.color }}>{value}</span>
                )}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}