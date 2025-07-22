"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import Cookies from "js-cookie";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  LayoutDashboard,
  Users,
  Clock,
  FileText,
  Wrench,
  ChevronDown,
  Building2,
} from "lucide-react";

// --- [TIPE DATA TIDAK BERUBAH] ---
interface Permission {
  id: number;
  name: string;
  slug: string;
}
interface Role {
  id: number;
  name: string;
  slug: string;
  description: string;
  permissions: Permission[];
}
interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string;
  created_at: string;
  updated_at: string;
  role: Role;
}
interface ApiResponse {
  status: boolean;
  message: string;
  data: User;
}
interface DashboardStats {
  total_facilities: number;
  total_reports: number;
  progress_reports: number;
  completed_reports: number;
  total_engineers: number;
}
interface ReportVolumeData {
  day: string;
  reports: number;
}
interface UserReportStats {
  user_name: string;
  report_count: number;
}
interface HealthFacility {
  id: number;
  name: string;
  city: string;
  type_of_health_facility_id: number;
}
interface HealthFacilityType {
    id: number;
    name: string;
}

// --- KOMPONEN SELECT KUSTOM ---
interface CustomSelectOption {
    value: string;
    label: string;
}

const CustomScrollSelect = ({
    options,
    value,
    onChange,
    placeholder
}: {
    options: CustomSelectOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectRef = useRef<HTMLDivElement>(null);
    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={selectRef} className="relative w-48">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full bg-gray-900 border border-gray-700 text-white text-sm rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
                <span>{selectedOption ? selectedOption.label : placeholder}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg">
                    <ul className="py-1" style={{ maxHeight: '9rem', overflowY: 'auto' }}>
                        {options.map(option => (
                            <li
                                key={option.value}
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className="px-3 py-2 text-sm text-white hover:bg-sky-500/20 cursor-pointer"
                            >
                                {option.label}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};


// --- FUNGSI HELPER ---
const getUserDataFromCookies = (): { user: User | null; token: string | null; } => {
  try {
    const token = Cookies.get("token") || null;
    const userCookie = Cookies.get("user");
    const user: User | null = userCookie ? JSON.parse(userCookie) : null;
    return { user, token };
  } catch (error) {
    console.error("Error parsing cookie data:", error);
    return { user: null, token: null };
  }
};

const fetchUserProfile = async (token: string): Promise<User | null> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL_API}/api/profile`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (!response.ok) return null;
    const result: ApiResponse = await response.json();
    return result.status && result.data ? result.data : null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};


// --- KOMPONEN UTAMA ---
export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [reportVolume, setReportVolume] = useState<ReportVolumeData[]>([]);
  const [userStats, setUserStats] = useState<UserReportStats[]>([]);
  const [healthFacilities, setHealthFacilities] = useState<HealthFacility[]>([]);
  const [healthFacilityTypes, setHealthFacilityTypes] = useState<HealthFacilityType[]>([]);
  const [selectedFacilityType, setSelectedFacilityType] = useState<string>("");


  const [dataSource, setDataSource] = useState<"cookie" | "api" | "fallback">(
    "cookie"
  );
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // --- LOGIKA FETCH DATA ---
  const loadData = useCallback(async () => {
    setLoading(true);
    const { user: cookieUser, token } = getUserDataFromCookies();

    if (cookieUser) {
      setUser(cookieUser);
      setDataSource("cookie");
    }

    if (token) {
      try {
        const [
            freshUser,
            statsRes,
            volumeRes,
            userStatsRes,
            healthFacilitiesRes,
            facilityTypesRes
        ] =
          await Promise.all([
            fetchUserProfile(token),
            fetch(`${process.env.NEXT_PUBLIC_BASE_URL_API}/api/dashboard/stats`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch(
              `${process.env.NEXT_PUBLIC_BASE_URL_API}/api/dashboard/report-volume?year=${selectedYear}&month=${selectedMonth}`,
              { headers: { Authorization: `Bearer ${token}` } }
            ),
            fetch(
              `${process.env.NEXT_PUBLIC_BASE_URL_API}/api/dashboard/reports/stats-by-user`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            ),
            fetch(
                `${process.env.NEXT_PUBLIC_BASE_URL_API}/api/dashboard/health-facility?all_health_facilities=true`,
                { headers: { Authorization: `Bearer ${token}` } }
            ),
            fetch(
                `${process.env.NEXT_PUBLIC_BASE_URL_API}/api/type-of-health-facility?per_page=All`,
                { headers: { Authorization: `Bearer ${token}` } }
            )
          ]);

        if (freshUser) {
          setUser(freshUser);
          setDataSource("api");
          Cookies.set("user", JSON.stringify(freshUser), { expires: 1 });
        }

        const statsData = await statsRes.json();
        if (statsData.data) setStats(statsData.data);

        const volumeData = await volumeRes.json();
        if (volumeData.data) setReportVolume(volumeData.data);

        const userStatsData = await userStatsRes.json();
        if (userStatsData.data) setUserStats(userStatsData.data);

        const healthFacilitiesData = await healthFacilitiesRes.json();
        if (healthFacilitiesData.data) setHealthFacilities(healthFacilitiesData.data);

        const facilityTypesData = await facilityTypesRes.json();
        if (facilityTypesData.data) setHealthFacilityTypes(facilityTypesData.data);


      } catch (error) {
        console.error("Error fetching live data:", error);
        setError("Failed to fetch live data. Displaying cached information.");
      }
    } else {
      setError("Authentication required. Please login.");
    }

    setLoading(false);
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Opsi untuk filter dropdown
  const years = useMemo(
    () => Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i),
    []
  );
  const months = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        value: i + 1,
        name: new Date(0, i).toLocaleString("id-ID", { month: "long" }),
      })),
    []
  );

  const facilityTypeOptions = useMemo(() => {
        const defaultOption = { value: "", label: "All Types" };
        const otherOptions = healthFacilityTypes.map(type => ({ value: String(type.id), label: type.name }));
        return [defaultOption, ...otherOptions];
    }, [healthFacilityTypes]);

  // Transform user stats data for pie chart
  const pieChartData = useMemo(() => {
    return userStats.map((item) => ({
      name: item.user_name,
      value: item.report_count,
    }));
  }, [userStats]);

    const healthFacilityChartData = useMemo(() => {
        const filteredFacilities = selectedFacilityType
            ? healthFacilities.filter(facility => facility.type_of_health_facility_id === Number(selectedFacilityType))
            : healthFacilities;

        const countByCity = filteredFacilities.reduce((acc, facility) => {
            acc[facility.city] = (acc[facility.city] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(countByCity).map(([cityName, count]) => ({
            name: cityName,
            value: count,
        }));
    }, [healthFacilities, selectedFacilityType]);
    
    const totalHealthFacilities = useMemo(() => healthFacilityChartData.reduce((sum, item) => sum + item.value, 0), [healthFacilityChartData]);


  // Colors for pie chart
  const COLORS = [
    "#38bdf8",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
    "#84cc16",
    "#f97316",
    "#ec4899",
    "#6366f1",
  ];

  if (loading && !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[90vh] bg-gray-900 rounded-lg">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500"></div>
        <p className="mt-4 text-gray-400">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
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
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                <span className="text-white/60 text-sm">
                  Role: {user?.role?.name}
                </span>
                <span className="text-white/60 text-sm">•</span>
                <span className="text-white/60 text-sm">
                  Permissions: {user?.role?.permissions?.length || 0}
                </span>
                <span className="text-white/60 text-sm">•</span>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    dataSource === "api"
                      ? "bg-green-500/20 text-green-300"
                      : "bg-blue-500/20 text-blue-300"
                  }`}
                >
                  {dataSource === "api" ? "🔄 Live Data" : "🍪 Cached"}
                </span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-white/60 text-sm">Email</div>
              <div className="text-white text-sm">{user?.email}</div>
              {user?.email_verified_at && (
                <div className="text-green-400 text-xs mt-1">✓ Verified</div>
              )}
            </div>
          </div>
        </div>

        {/* --- KARTU STATISTIK LIS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-sky-500/20 rounded-lg">
                <Building className="w-6 h-6 text-sky-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Health Facilities</p>
                <p className="text-2xl font-bold text-white">
                  {loading ? "..." : stats?.total_facilities ?? 0}
                </p>
              </div>
            </div>
          </div> */}
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/20 rounded-lg">
                <FileText className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Reports</p>
                <p className="text-2xl font-bold text-white">
                  {loading ? "..." : stats?.total_reports ?? 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/20 rounded-lg">
                <Clock className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Progress Status</p>
                <p className="text-2xl font-bold text-white">
                  {loading ? "..." : stats?.progress_reports ?? 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <Clock className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Completed Status</p>
                <p className="text-2xl font-bold text-white">
                  {loading ? "..." : stats?.completed_reports ?? 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-500/20 rounded-lg">
                <Wrench className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Technician</p>
                <p className="text-2xl font-bold text-white">
                  {loading ? "..." : stats?.total_engineers ?? 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* --- GRAFIK VOLUME LAPORAN --- */}
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">
              Monthly Report Volume
            </h2>
            <div className="flex items-center gap-2 mt-2 sm:mt-0">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-gray-900 border border-gray-700 text-white text-sm rounded-lg p-2"
              >
                {months.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.name}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-gray-900 border border-gray-700 text-white text-sm rounded-lg p-2"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportVolume}>
              <XAxis
                dataKey="day"
                name="Date"
                stroke="#9ca3af"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#9ca3af"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "white" }}
              />
              <Bar
                dataKey="reports"
                fill="#38bdf8"
                radius={[4, 4, 0, 0]}
                name="Total Reports"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* --- GRAFIK DISTRIBUSI LAPORAN PER USER --- */}
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                <h2 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Report Distribution Per User
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                    <Pie
                        data={pieChartData}
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
                        {pieChartData.map((_entry, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                        />
                        ))}
                    </Pie>
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value) => (
                        <span style={{ color: "white" }}>{value}</span>
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


            {/* --- GRAFIK DISTRIBUSI FASILITAS KESEHATAN PER KOTA --- */}
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        Health Facility
                    </h2>
                    <div className="mt-2 sm:mt-0">
                        <CustomScrollSelect
                            placeholder="Select Type"
                            options={facilityTypeOptions}
                            value={selectedFacilityType}
                            onChange={setSelectedFacilityType}
                        />
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                        <Pie
                            data={healthFacilityChartData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            fill="#8884d8"
                            paddingAngle={0}
                            labelLine={false}
                            label={false}
                        >
                            {healthFacilityChartData.map((_entry, index) => (
                            <Cell key={`cell-hf-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                         <Legend
                            verticalAlign="bottom"
                            height={50}
                            formatter={(value) => (
                              <span className="text-white">{value}</span>
                            )}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#1f2937",
                                border: "none",
                                borderRadius: "8px",
                            }}
                             labelStyle={{ color: "white" }}
                            itemStyle={{ color: "white" }}
                        />
                        <text x='50%' y='40%' textAnchor="middle" dominantBaseline="central" className="fill-white text-3xl font-bold">
                          {totalHealthFacilities}
                        </text>
                        <text x='50%' y='50%' textAnchor="middle" dominantBaseline="central" className="fill-gray-400 text-sm">
                          Total Fasilitas
                        </text>
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>
    </>
  );
}