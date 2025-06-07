"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
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
} from "recharts";
import { LayoutDashboard } from "lucide-react";

const chartData = [
  { name: "Jan", Sales: 1200 },
  { name: "Feb", Sales: 2100 },
  { name: "Mar", Sales: 800 },
  { name: "Apr", Sales: 1600 },
];

const donutData = [
  { name: "Service A", value: 35 },
  { name: "Service B", value: 45 },
  { name: "Service C", value: 20 },
];

const COLORS = ["#00bcd4", "#f43f5e", "#f59e0b"];

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

// Utility function to get data from cookies
const getUserDataFromCookies = (): {
  user: User | null;
  token: string | null;
  permissions: string[];
} => {
  try {
    const token = Cookies.get("token") || null; // Convert undefined to null
    const userCookie = Cookies.get("user");
    const permissionsCookie = Cookies.get("permissions");

    let user: User | null = null;
    let permissions: string[] = [];

    if (userCookie) {
      user = JSON.parse(userCookie);
    }

    if (permissionsCookie) {
      permissions = JSON.parse(permissionsCookie);
    }

    return { user, token, permissions };
  } catch (error) {
    console.error("Error parsing cookie data:", error);
    return { user: null, token: null, permissions: [] };
  }
};

// Function to fetch fresh user data from API
const fetchUserProfile = async (token: string): Promise<User | null> => {
  try {
    console.log("🚀 Fetching fresh user data from API");

    const response = await fetch("http://report-api.test/api/profile", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    console.log("📡 API Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ API Error Response:", errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse = await response.json();
    console.log("✅ Fresh API Response:", result);

    if (result.status && result.data) {
      return result.data;
    } else {
      throw new Error(result.message || "Failed to fetch user data");
    }
  } catch (error) {
    console.error("❌ Error fetching user profile:", error);
    return null;
  }
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<"cookie" | "api" | "fallback">(
    "cookie"
  );

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. First, try to get data from cookies (faster)
        const {
          user: cookieUser,
          token,
          permissions,
        } = getUserDataFromCookies();

        console.log("🍪 Cookie data:", {
          hasUser: !!cookieUser,
          hasToken: !!token,
          permissionsCount: permissions.length,
        });

        if (cookieUser && token) {
          // Set cookie data immediately for fast loading
          setUser(cookieUser);
          setDataSource("cookie");
          setLoading(false);

          // 2. Then try to fetch fresh data from API (background update)
          try {
            const freshUser = await fetchUserProfile(token);
            if (freshUser) {
              console.log("🔄 Updating with fresh API data");
              setUser(freshUser);
              setDataSource("api");

              // Update cookies with fresh data
              Cookies.set("user", JSON.stringify(freshUser), { expires: 1 });

              // Update permissions if available
              if (freshUser.role?.permissions) {
                const permissionSlugs = freshUser.role.permissions.map(
                  (p) => p.slug
                );
                Cookies.set("permissions", JSON.stringify(permissionSlugs), {
                  expires: 1,
                });
              }
            }
          } catch (apiError) {
            console.warn(
              "⚠️ Failed to fetch fresh data, using cookie data:",
              apiError
            );
            setError("Using cached data. Could not fetch latest updates.");
          }
        } else if (token) {
          // 3. If no user in cookie but token exists, fetch from API
          console.log("🔍 No user in cookies, fetching from API...");
          const apiUser = await fetchUserProfile(token);

          if (apiUser) {
            setUser(apiUser);
            setDataSource("api");

            // Save to cookies for next time
            Cookies.set("user", JSON.stringify(apiUser), { expires: 1 });
            if (apiUser.role?.permissions) {
              const permissionSlugs = apiUser.role.permissions.map(
                (p) => p.slug
              );
              Cookies.set("permissions", JSON.stringify(permissionSlugs), {
                expires: 1,
              });
            }
          } else {
            throw new Error("Failed to fetch user data from API");
          }
        } else {
          // 4. No token found, user needs to login
          console.warn("❌ No authentication token found");
          setError("Please login to access dashboard");
          setDataSource("fallback");

          // Redirect to login or show login prompt
          // window.location.href = '/login';
        }
      } catch (err) {
        console.error("Failed to load user data:", err);
        setError("Failed to load user data. Please try refreshing the page.");
        setDataSource("fallback");

        // Fallback user for development
        setUser({
          id: 0,
          name: "Guest User",
          email: "guest@example.com",
          role_id: 1,
          email_verified_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          role: {
            id: 1,
            name: "Guest",
            slug: "guest",
            description: "Guest role",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            permissions: [],
          },
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-white text-lg">Loading dashboard...</div>
          <div className="text-white/60 text-sm mt-2">
            Fetching data...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error notification */}
      {error && (
        <div className="bg-yellow-500/20 border border-yellow-500/50 text-yellow-200 px-4 py-3 rounded-lg mb-4">
          <div className="flex items-center">
            <svg
              className="w-4 h-4 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* Data source indicator */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6" />
            Dashboard
          </h1>
          <p className="text-white/80 mt-1 flex items-center gap-2">
            <span className="text-lg">👋</span>
            Welcome Back, {user?.name || "User"}!
          </p>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-white/60 text-sm">
              Role: {user?.role?.name}
            </span>
            <span className="text-white/60 text-sm">•</span>
            <span className="text-white/60 text-sm">ID: {user?.id}</span>
            <span className="text-white/60 text-sm">•</span>
            <span className="text-white/60 text-sm">
              Permissions: {user?.role?.permissions?.length || 0}
            </span>
            <span className="text-white/60 text-sm">•</span>
            <span
              className={`text-xs px-2 py-1 rounded ${
                dataSource === "api"
                  ? "bg-green-500/20 text-green-300"
                  : dataSource === "cookie"
                  ? "bg-blue-500/20 text-blue-300"
                  : "bg-gray-500/20 text-gray-300"
              }`}
            >
              {dataSource === "api"
                ? "🔄 Live Data"
                : dataSource === "cookie"
                ? "🍪 Cached"
                : "👤 Guest"}
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
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString("id-ID", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "N/A"}
            </div>
          </div>
          <div>
            <span className="text-white/60">Last Updated:</span>
            <div className="text-white">
              {user?.updated_at
                ? new Date(user.updated_at).toLocaleDateString("id-ID", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "N/A"}
            </div>
          </div>
          <div>
            <span className="text-white/60">Role Description:</span>
            <div className="text-white">
              {user?.role?.description || "No description"}
            </div>
          </div>
        </div>
      </div>

      {/* Permissions Card */}
      {/* {user?.role?.permissions && user.role.permissions.length > 0 && (
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg">
          <h3 className="text-white font-medium mb-2">Your Permissions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
            {user.role.permissions.map((permission) => (
              <div
                key={permission.id}
                className="bg-white/5 px-3 py-2 rounded text-sm border border-white/10"
              >
                <div className="text-white font-medium">{permission.name}</div>
                <div className="text-white/60 text-xs">{permission.slug}</div>
                {permission.description && (
                  <div className="text-white/40 text-xs mt-1">{permission.description}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )} */}

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
        <div className="bg-white p-6 rounded-lg shadow-lg ">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            Penjualan Bulanan
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
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
                  backgroundColor: "#1f2937",
                  border: "none",
                  borderRadius: "8px",
                  color: "white",
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
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            Tren Penjualan
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
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
                  backgroundColor: "#1f2937",
                  border: "none",
                  borderRadius: "8px",
                  color: "white",
                }}
              />
              <Line
                type="monotone"
                dataKey="Sales"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: "#10b981" }}
                name="Penjualan"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Donut Chart */}
        <div className="bg-white p-6 rounded-lg shadow-lg col-span-full md:col-span-2">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            Distribusi Layanan
          </h2>
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
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {donutData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
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
                  backgroundColor: "#1f2937",
                  border: "none",
                  borderRadius: "8px",
                  color: "white",
                }}
                labelStyle={{ color: "white" }}
                itemStyle={{ color: "white" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
