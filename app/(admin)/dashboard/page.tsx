"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
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
  LabelList,
} from "recharts";
import {
  LayoutDashboard,
  Users,
  Clock,
  FileText,
  Wrench,
  Building2,
  Calendar,
  CpuIcon,
  Map,
  MonitorSmartphoneIcon,
  ClockFading,
  XCircle,
  // Map,
} from "lucide-react";
import {
  Chart as ChartJS,
  RadialLinearScale,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
} from "chart.js";
import MultiSelectPopover from "@/components/ui/MultiSelectPopover";
import IndonesiaMap from "@/components/IndonesiaMap";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Info } from "lucide-react";

ChartJS.register(RadialLinearScale, ArcElement, ChartTooltip, ChartLegend);
// import IndonesiaMap from "@/components/IndonesiaMap";
interface PopulationItem {
  category_id: number;
  category_name: string;
  brand?: string | null;
  model?: string | null;
  total: number;
}

interface BrandItem {
  id: number;
  brand: string;
}

interface ModelItem {
  id: number;
  model: string;
}

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

interface Information {
  id: number;
  name: string;
  content: string;
  type: string;
  is_active: number;
  published_at: string;
  expired_at: string;
}

interface DeviceNotification {
  medical_device_id: number;
  last_service: string;
  days_since_service: number;
  brand: string;
  model: string;
  serial_number: string;
  health_facility: string;
  employee_name: string;
}

// --- FUNGSI GENERATOR WARNA RANDOM ---
const generateRandomColor = (): string => {
  const hue = Math.floor(Math.random() * 360);
  const saturation = Math.floor(Math.random() * 30) + 70; // 70-100% untuk warna yang lebih cerah
  const lightness = Math.floor(Math.random() * 20) + 45; // 45-65% untuk kontras yang baik
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

const categoryColorMap: Record<string, string> = {
  "HEMATOLOGY": "#fc0f0f",
  "CLINICAL CHEMISTRY": "#F59E0B",
  "URINE": "#10B981",
  "ELEKTROLYTE": "#8B5CF6",
  "FLUORESCENCE IMMUNOASSAY ANALYZER": "#02d4d1",
  "COAGULATION": "#02d436",
  "BLOOD GAS": "#b1d402",
  "POCT": "#d45a02",
  "IMUNNO HEMATOLOGY": "#2202d4",
  "PLATELET STORAGE": "#5d02d4",
  "BLOOD BANK": "#d40268",
  "OTHERS": "#c902d4",
};

// fungsi helper untuk ambil warna
const getCategoryColor = (category: string) =>
  categoryColorMap[category] || generateRandomColor(); // fallback ungu

const generateUniqueColors = (count: number): string[] => {
  const colors: string[] = [];
  const usedColors = new Set<string>();

  // Base colors yang bagus untuk chart
  const baseColors = [
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
    "#f43f5e",
    "#14b8a6",
    "#8b5cf6",
    "#f59e0b",
    "#06b6d4",
  ];

  // Gunakan base colors terlebih dahulu jika count <= baseColors.length
  if (count <= baseColors.length) {
    return baseColors.slice(0, count);
  }

  // Jika butuh lebih banyak warna, mulai dengan base colors lalu generate random
  colors.push(...baseColors);
  baseColors.forEach((color) => usedColors.add(color));

  // Generate warna random untuk sisanya
  while (colors.length < count) {
    let newColor = generateRandomColor();
    let attempts = 0;

    // Coba generate warna baru sampai dapat yang unik (max 50 attempts)
    while (usedColors.has(newColor) && attempts < 50) {
      newColor = generateRandomColor();
      attempts++;
    }

    if (!usedColors.has(newColor)) {
      colors.push(newColor);
      usedColors.add(newColor);
    } else {
      // Fallback: generate berdasarkan index jika sudah 50 attempts
      const fallbackColor = `hsl(${(colors.length * 137.5) % 360}, 70%, 55%)`;
      colors.push(fallbackColor);
      usedColors.add(fallbackColor);
    }
  }

  return colors;
};

// --- KOMPONEN SELECT KUSTOM ---
// interface CustomSelectOption {
//   value: string;
//   label: string;
// }

// const CustomScrollSelect = ({
//   options,
//   value,
//   onChange,
//   placeholder,
// }: {
//   options: CustomSelectOption[];
//   value: string;
//   onChange: (value: string) => void;
//   placeholder: string;
// }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const selectRef = useRef<HTMLDivElement>(null);
//   const selectedOption = options.find((opt) => opt.value === value);

//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (
//         selectRef.current &&
//         !selectRef.current.contains(event.target as Node)
//       ) {
//         setIsOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   return (
//     <div ref={selectRef} className="relative w-48">
//       <button
//         onClick={() => setIsOpen(!isOpen)}
//         className="flex items-center justify-between w-full bg-gray-900 border border-gray-700 text-white text-sm rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
//       >
//         <span>{selectedOption ? selectedOption.label : placeholder}</span>
//         <ChevronDown
//           className={`w-4 h-4 transition-transform ${
//             isOpen ? "transform rotate-180" : ""
//           }`}
//         />
//       </button>

//       {isOpen && (
//         <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg">
//           <ul className="py-1" style={{ maxHeight: "9rem", overflowY: "auto" }}>
//             {options.map((option) => (
//               <li
//                 key={option.value}
//                 onClick={() => {
//                   onChange(option.value);
//                   setIsOpen(false);
//                 }}
//                 className="px-3 py-2 text-sm text-white hover:bg-sky-500/20 cursor-pointer"
//               >
//                 {option.label}
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}
//     </div>
//   );
// };

// --- FUNGSI HELPER ---
const getUserDataFromCookies = (): {
  user: User | null;
  token: string | null;
} => {
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
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL_API}/api/profile`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );
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
  const [informations, setInformations] = useState<Information[]>([]);
  const [selectedItem, setSelectedItem] = useState<Information | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [reportVolume, setReportVolume] = useState<ReportVolumeData[]>([]);
  const [userStats, setUserStats] = useState<UserReportStats[]>([]);
  const [, setHealthFacilities] = useState<HealthFacility[]>(
    []
  );
  const [, setHealthFacilityTypes] = useState<
    HealthFacilityType[]
  >([]);
  // const [selectedFacilityType, setSelectedFacilityType] = useState<string>("");
  // const [selectedFacilityType] = useState<
  //   { value: string | number; label: string }[]
  // >([]);

  // const [selectedCities] = useState<
  //   { value: string | number; label: string }[]
  // >([]);


  // const cityOptions = useMemo(() => {
  //   const uniqueCities = Array.from(
  //     new Set(healthFacilities.map((f) => f.city || "")) // fallback string kosong
  //   ).filter((c) => c !== ""); // buang yang kosong/null
  //   const options = uniqueCities.map((city) => ({
  //     value: city,
  //     label: city,
  //   }));
  //   return [{ value: "ALL", label: "All Cities" }, ...options];
  // }, [healthFacilities]);

  const [dataSource, setDataSource] = useState<"cookie" | "api" | "fallback">(
    "cookie"
  );
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  const [population, setPopulation] = useState<PopulationItem[]>([]);
  // const colors = generateUniqueColors(population.length);

  const [selectedCategories, setSelectedCategories] = useState<
    { value: string | number; label: string }[]
  >([]);

  const [selectedUsers, setSelectedUsers] = useState<
    { value: string | number; label: string }[]
  >([]);

  const userOptions = useMemo(() => {
    return userStats.map((u) => ({
      value: u.user_name,
      label: u.user_name,
    }));
  }, [userStats]);

  const categoryOptions = useMemo(
    () =>
      population.map((item) => ({
        value: item.category_id, // pakai persis string category_name
        label: item.category_name,
      })),
    [population]
  );

  // const filteredPopulation = population;

  // const filteredPopulation = useMemo(() => {
  //   if (selectedCategories.length === 0) return population;

  //   const selectedValues = selectedCategories.map((s) => Number(s.value));
  //   return population.filter((item) =>
  //     selectedValues.includes(item.category_id)
  //   );
  // }, [population, selectedCategories]);

  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [models, setModels] = useState<ModelItem[]>([]);

  const [selectedBrands, setSelectedBrands] = useState<
    { value: string | number; label: string }[]
  >([]);
  const [selectedModels, setSelectedModels] = useState<
    { value: string | number; label: string }[]
  >([]);

  // const filteredColors = useMemo(
  //   () => generateUniqueColors(filteredPopulation.length),
  //   [filteredPopulation.length]
  // );

  const [, setDeviceNotifications] = useState<
    DeviceNotification[]
  >([]);

  const safeGetData = <T,>(res: unknown): T[] => {
    if (!res) return [];
    if (Array.isArray(res)) return res as T[];
    if (typeof res === "object" && res !== null) {
      if ("data" in res && Array.isArray((res as { data: unknown }).data)) {
        return (res as { data: T[] }).data;
      }
      if (
        "results" in res &&
        Array.isArray((res as { results: unknown }).results)
      ) {
        return (res as { results: T[] }).results;
      }
    }
    return [];
  };

  const [totalFacilities, setTotalFacilities] = useState<number>(0);

  // Tambahkan fungsi fetch untuk total health facilities
  const loadTotalFacilities = useCallback(async () => {
    const { token } = getUserDataFromCookies();
    if (!token) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL_API}/api/total-health-facilities`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      const result = await res.json();
      if (result.status && typeof result.data === "number") {
        setTotalFacilities(result.data);
      }
    } catch (err) {
      console.error("Failed fetch total facilities:", err);
    }
  }, []);

  // Panggil di useEffect
  useEffect(() => {
    loadTotalFacilities();
  }, [loadTotalFacilities]);

  const [totalMedicalDevices, setTotalMedicalDevices] = useState<number>(0);

  const loadTotalMedicalDevices = useCallback(async () => {
    const { token } = getUserDataFromCookies();
    if (!token) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL_API}/api/total-medical-devices`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      const result = await res.json();
      if (result.status && typeof result.data === "number") {
        setTotalMedicalDevices(result.data);
      }
    } catch (err) {
      console.error("Failed fetch total medical devices:", err);
    }
  }, []);

  // Panggil di useEffect
  useEffect(() => {
    loadTotalMedicalDevices();
  }, [loadTotalMedicalDevices]);

  // Panggil di useEffect
  useEffect(() => {
    loadTotalFacilities();
  }, [loadTotalFacilities]);

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
          facilityTypesRes,
        ] = await Promise.all([
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
            { headers: { Authorization: `Bearer ${token}` } }
          ),
          fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL_API}/api/dashboard/health-facility?all_health_facilities=true`,
            { headers: { Authorization: `Bearer ${token}` } }
          ),
          fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL_API}/api/type-of-health-facility?per_page=All`,
            { headers: { Authorization: `Bearer ${token}` } }
          ),
        ]);

        if (freshUser) {
          setUser(freshUser);
          setDataSource("api");
          Cookies.set("user", JSON.stringify(freshUser), { expires: 1 });
        }

        const statsData = await statsRes.json();
        if (statsData?.data) setStats(statsData.data);

        const volumeData = await volumeRes.json();
        if (Array.isArray(volumeData)) {
          setReportVolume(volumeData);
        } else if (Array.isArray(volumeData.data)) {
          setReportVolume(volumeData.data);
        } else if (Array.isArray(volumeData.results)) {
          setReportVolume(volumeData.results);
        } else {
          console.warn("Unexpected report-volume format:", volumeData);
          setReportVolume([]);
        }
        setReportVolume(safeGetData(volumeData));

        const userStatsData = await userStatsRes.json();
        // setUserStats(safeGetData(userStatsData));
        setUserStats(safeGetData<UserReportStats>(userStatsData));

        const healthFacilitiesData = await healthFacilitiesRes.json();
        // setHealthFacilities(safeGetData(healthFacilitiesData));
        setHealthFacilities(safeGetData<HealthFacility>(healthFacilitiesData));

        const facilityTypesData = await facilityTypesRes.json();
        // setHealthFacilityTypes(safeGetData(facilityTypesData));
        setHealthFacilityTypes(
          safeGetData<HealthFacilityType>(facilityTypesData)
        );
      } catch (error) {
        console.error("Error fetching live data:", error);
        setError("Failed to fetch live data. Displaying cached information.");
      }
    } else {
      setError("Authentication required. Please login.");
    }

    setLoading(false);
  }, [selectedYear, selectedMonth]);

  const loadPopulation = useCallback(async () => {
    const { token } = getUserDataFromCookies();
    if (!token) return;

    try {
      const excludedBrands = ["VANSLITE", "VANSLAB"];

      const categoryIds = selectedCategories.map((c) => c.value);

      const filteredCategoryIds = categoryIds
        .filter((id) => String(id) !== "31") // 🚫 buang kategori 31
        .join(",");

      const filteredBrandNames = selectedBrands
        .filter(
          (b) => !excludedBrands.includes(b.value.toString().toUpperCase())
        )
        .map((b) => b.value)
        .join(",");

      const filteredModelNames = selectedModels.map((m) => m.value).join(",");

      const params = new URLSearchParams();
      if (filteredCategoryIds)
        params.append("medical_device_category_id", filteredCategoryIds);
      if (filteredBrandNames) params.append("brand", filteredBrandNames);
      if (filteredModelNames) params.append("model", filteredModelNames);

      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_BASE_URL_API
        }/api/medical-device/population?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      const result = await res.json();
      if (result.status && result.data) {
        // 🚫 filter hasil supaya tidak ada kategori 31
        const cleanedData = result.data.filter(
          (item: PopulationItem) => item.category_id !== 31
        );
        setPopulation(cleanedData);
      }
    } catch (err) {
      console.error("Failed fetch population:", err);
    }
  }, [selectedCategories, selectedBrands, selectedModels]);

  const loadBrandsAndModels = useCallback(async () => {
    const { token } = getUserDataFromCookies();
    if (!token) return;

    try {
      const [brandRes, modelRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_BASE_URL_API}/api/brand`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_BASE_URL_API}/api/model`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const brandData = await brandRes.json();
      const modelData = await modelRes.json();

      if (brandData.status && brandData.data) setBrands(brandData.data);
      if (modelData.status && modelData.data) setModels(modelData.data);
    } catch (err) {
      console.error("Failed fetch brand/model:", err);
    }
  }, []);

  useEffect(() => {
    loadBrandsAndModels();
  }, [loadBrandsAndModels]);

  useEffect(() => {
    loadPopulation();
  }, [loadPopulation]);

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

  // const facilityTypeOptions = useMemo(() => {
  //   const defaultOption = { value: "", label: "All Types" };
  //   const otherOptions = healthFacilityTypes.map(
  //     (type: HealthFacilityType) => ({
  //       value: String(type.id),
  //       label: type.name,
  //     })
  //   );
  //   return [defaultOption, ...otherOptions];
  // }, [healthFacilityTypes]);

  // Transform user stats data for pie chart
  const pieChartData = useMemo(() => {
    return userStats.map((item) => ({
      name: item.user_name,
      value: item.report_count,
    }));
  }, [userStats]);

  // const healthFacilityChartData = useMemo(() => {
  //   let filteredFacilities = healthFacilities;

  //   // Filter berdasarkan Type
  //   if (
  //     selectedFacilityType.length > 0 &&
  //     !selectedFacilityType.some((opt) => opt.value === "")
  //   ) {
  //     const selectedIds = selectedFacilityType.map((opt) => Number(opt.value));
  //     filteredFacilities = filteredFacilities.filter((f) =>
  //       selectedIds.includes(f.type_of_health_facility_id)
  //     );
  //   }

  //   // Filter berdasarkan City
  //   if (
  //     selectedCities.length > 0 &&
  //     !selectedCities.some((opt) => opt.value === "ALL")
  //   ) {
  //     const selectedCityNames = selectedCities.map((opt) => String(opt.value));
  //     filteredFacilities = filteredFacilities.filter((f) =>
  //       selectedCityNames.includes(f.city)
  //     );
  //   }
  //   // Hitung jumlah per kota
  //   const countByCity = filteredFacilities.reduce((acc, facility) => {
  //     acc[facility.city] = (acc[facility.city] || 0) + 1;
  //     return acc;
  //   }, {} as Record<string, number>);

  //   return Object.entries(countByCity).map(([cityName, count]) => ({
  //     name: cityName,
  //     value: count,
  //   }));
  // }, [healthFacilities, selectedFacilityType, selectedCities]);

  // const totalHealthFacilities = useMemo(
  //   () => healthFacilityChartData.reduce((sum, item) => sum + item.value, 0),
  //   [healthFacilityChartData]
  // );

  const filteredPieChartData = useMemo(() => {
    if (selectedUsers.length === 0) return pieChartData;
    const selectedNames = selectedUsers.map((u) => u.value);
    return pieChartData.filter((item) => selectedNames.includes(item.name));
  }, [pieChartData, selectedUsers]);

  // Generate unique colors for pie charts
  const userStatsColors = useMemo(() => {
    return generateUniqueColors(pieChartData.length);
  }, [pieChartData.length]);

  // const healthFacilityColors = useMemo(() => {
  //   return generateUniqueColors(healthFacilityChartData.length);
  // }, [healthFacilityChartData.length]);

  const formatDateTimeID = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      weekday: "long", // Senin
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    const fetchInformation = async () => {
      try {
        const token = Cookies.get("token");
        if (!token) throw new Error("Unauthorized");

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL_API}/api/information`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        const data = await res.json();
        if (data.status) {
          const now = new Date();

          const activeData = data.data.filter((item: Information) => {
            const publishedAt = new Date(item.published_at);
            const expiredAt = new Date(item.expired_at);
            return (
              item.is_active === 1 && publishedAt <= now && expiredAt >= now
            );
          });

          setInformations(activeData);
        }
      } catch (error) {
        console.error("Failed to fetch information", error);
      }
    };

    fetchInformation();
  }, []);

  useEffect(() => {
    const fetchDeviceNotifications = async () => {
      try {
        const token = Cookies.get("token");
        if (!token) throw new Error("Unauthorized");

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL_API}/api/notification-device`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        const data = await res.json();
        if (data.status && Array.isArray(data.data)) {
          setDeviceNotifications(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch device notifications", error);
      }
    };

    fetchDeviceNotifications();
  }, []);

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

        <div className="bg-gray-800 rounded-lg p-6 shadow-md max-h-[400px] overflow-y-auto pr-2">
          <h2 className="text-lg font-semibold text-white mb-4">
            📢 Latest Information
          </h2>

          {/* Bagian Informasi */}
          {informations.length > 0 ? (
            <ul className="space-y-4 ">
              {informations.map((info) => (
                <li
                  key={info.id}
                  onClick={() => {
                    setSelectedItem(info);
                    setIsDetailOpen(true);
                  }}
                  className="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:border-blue-500 transition cursor-pointer"
                >
                  <h3 className="text-md font-bold text-blue-400">
                    {info.name}
                  </h3>
                  <p className="text-sm text-gray-400 mb-2">
                    Berlaku: {formatDateTimeID(info.published_at)} —{" "}
                    {formatDateTimeID(info.expired_at)}
                  </p>
                  <p className="text-gray-300 line-clamp-2">
                    {info.content.replace(/<[^>]+>/g, "").slice(0, 150)}...
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400">There is no active information at this time.</p>
          )}
        </div>

        {/* --- CARD SERVICE REPORT --- */}
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-700/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-cyan-900/30 to-cyan-800/30 border border-cyan-700/50 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-cyan-600/20 text-cyan-400 group-hover:scale-110 transition-transform duration-300">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-300/90 font-medium">
                    Total Health Facilities
                  </p>
                  <p className="text-3xl font-bold text-white leading-tight">
                    {loading ? "..." : totalFacilities ?? 0}
                  </p>
                </div>
              </div>
              <div className="w-1 h-16 rounded-full bg-cyan-400 opacity-50 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-purple-900/30 to-purple-800/30 border border-purple-700/50 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-600/20 text-purple-400 group-hover:scale-110 transition-transform duration-300">
                  <MonitorSmartphoneIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-300/90 font-medium">
                    Total Medical Devices
                  </p>
                  <p className="text-3xl font-bold text-white leading-tight">
                    {loading ? "..." : totalMedicalDevices ?? 0}
                  </p>
                </div>
              </div>
              <div className="w-1 h-16 rounded-full bg-purple-400 opacity-50 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-red-900/30 to-red-800/30 border border-red-700/50 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-600/20 text-red-400 group-hover:scale-110 transition-transform duration-300">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-300/90 font-medium">
                    Total Reports
                  </p>
                  <p className="text-3xl font-bold text-white leading-tight">
                    {loading ? "..." : stats?.total_reports ?? 0}
                  </p>
                </div>
              </div>
              <div className="w-1 h-16 rounded-full bg-red-400 opacity-50 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-amber-900/30 to-amber-800/30 border border-amber-700/50 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-600/20 text-amber-400 group-hover:scale-110 transition-transform duration-300">
                  <ClockFading className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-300/90 font-medium">
                    Progress Status
                  </p>
                  <p className="text-3xl font-bold text-white leading-tight">
                    {loading ? "..." : stats?.progress_reports ?? 0}
                  </p>
                </div>
              </div>
              <div className="w-1 h-16 rounded-full bg-amber-400 opacity-50 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-emerald-900/30 to-emerald-800/30 border border-emerald-700/50 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-600/20 text-emerald-400 group-hover:scale-110 transition-transform duration-300">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-300/90 font-medium">
                    Completed Status
                  </p>
                  <p className="text-3xl font-bold text-white leading-tight">
                    {loading ? "..." : stats?.completed_reports ?? 0}
                  </p>
                </div>
              </div>
              <div className="w-1 h-16 rounded-full bg-emerald-400 Completed Status-400 opacity-50 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-900/30 to-blue-800/30 border border-blue-700/50 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-600/20 text-blue-400 group-hover:scale-110 transition-transform duration-300">
                  <Wrench className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-300/90 font-medium">
                    Total Technician
                  </p>
                  <p className="text-3xl font-bold text-white leading-tight">
                    {loading ? "..." : stats?.total_engineers ?? 0}
                  </p>
                </div>
              </div>
              <div className="w-1 h-16 rounded-full bg-blue-400 opacity-50 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </div>
        </div>

        {/* --- MAP LOCATION HEALTH FACILITIES --- */}
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-800 h-[600px] flex flex-col">
          <h2 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
            <Map className="w-5 h-5" />
            Maps Location Health Facilities
          </h2>
          <div className="flex-1 min-h-0">
            <IndonesiaMap />
          </div>
        </div>

        {/* POPULATION HEALTH FACILITIES */}
        {/* <div className="bg-gray-900 p-6 rounded-lg border border-gray-800 h-[500px]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Population of Health Facility
            </h2>
            <div className="flex gap-2">
              <div className="w-56">
                <MultiSelectPopover
                  options={facilityTypeOptions}
                  selected={selectedFacilityType}
                  onChange={setSelectedFacilityType}
                  placeholder="Select Type Health Facility"
                />
              </div>
              <div className="w-56">
                <MultiSelectPopover
                  options={cityOptions}
                  selected={selectedCities}
                  onChange={setSelectedCities}
                  placeholder="Select City"
                />
              </div>
              <button
                onClick={() => {
                  setSelectedFacilityType([]);
                  setSelectedCities([]);
                }}
                className="bg-white/10 hover:bg-white/20 text-white text-sm px-3 py-2 rounded-lg border border-gray-800 cursor-pointer flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Clear Filters
              </button>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
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
                {healthFacilityChartData.map(
                  (_entry: { name: string; value: number }, index: number) => (
                    <Cell
                      key={`cell-hf-${index}`}
                      fill={healthFacilityColors[index]}
                    />
                  )
                )}
              </Pie>
              <Legend
                verticalAlign="bottom"
                height={38}
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
              <text
                x="50%"
                y="40%"
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-white text-3xl font-bold"
              >
                {totalHealthFacilities}
              </text>
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-gray-400 text-sm"
              >
                Total Fasilitas
              </text>
            </PieChart>
          </ResponsiveContainer>
        </div> */}

        {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-3"></div> */}

        {/* POPULATION MEDICAL DEVICES */}
        <div className="bg-gray-900 p-10 rounded-lg border border-gray-800 h-[800px]">
          {/* Header dengan Total Medical Devices di atas */}
          <div className="mb-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
                <CpuIcon className="w-6 h-6" />
                Population of Medical Devices
              </h2>

              {/* Total Medical Devices Card - Positioned at top right */}
              <div className="bg-gradient-to-r from-purple-900/40 to-purple-800/40 border border-purple-700/60 rounded-xl px-6 py-4 shadow-lg backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-600/30 text-purple-400">
                    <CpuIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-300/90 font-medium">
                      Total Medical Devices
                    </p>
                    <p className="text-3xl font-bold text-white leading-tight">
                      {totalMedicalDevices ?? 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="flex gap-3 items-center flex-wrap w-full">
              <div className="flex-1 min-w-[200px]">
                <MultiSelectPopover
                  options={categoryOptions}
                  selected={selectedCategories}
                  onChange={setSelectedCategories}
                  placeholder="Select categories..."
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <MultiSelectPopover
                  options={brands
                    // 🚫 pastikan brand dari kategori 31 tidak ikut
                    .filter((b) => b.id !== 31)
                    .map((b) => ({
                      value: b.brand,
                      label: b.brand,
                    }))}
                  selected={selectedBrands}
                  onChange={setSelectedBrands}
                  placeholder="Select brands..."
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <MultiSelectPopover
                  options={models
                    .filter((m) => m.id !== 31) // 🚫 buang model kategori 31
                    .map((m) => ({
                      value: m.model,
                      label: m.model,
                    }))}
                  selected={selectedModels}
                  onChange={setSelectedModels}
                  placeholder="Select types..."
                />
              </div>
              <button
                onClick={() => {
                  setSelectedCategories([]);
                  setSelectedBrands([]);
                  setSelectedModels([]);
                }}
                className="bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-2 rounded-lg border border-gray-800 cursor-pointer transition-colors duration-200 font-medium flex items-center gap-2 h-[41px]"
              >
                <XCircle className="w-4 h-4" />
                Clear Filters
              </button>
            </div>
          </div>

          {/* Chart Container */}
          <div className="flex-1 h-[550px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={population.map((item) => ({
                  category: item.category_name,
                  brand: item.brand || "no brand",
                  model: item.model || "no type",
                  total: item.total,
                }))}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 80, bottom: 10 }}
              >
                <XAxis
                  type="number"
                  stroke="#9ca3af"
                  domain={[
                    0,
                    Math.max(...population.map((item) => item.total)),
                  ]}
                  width={200}
                />

                <YAxis
                  dataKey="category"
                  type="category"
                  tick={{ fill: "white", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "none",
                    borderRadius: "8px",
                    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
                  }}
                  labelStyle={{ color: "white" }}
                  itemStyle={{ color: "white" }}
                  formatter={(
                    value: number,
                    _name: string,
                    entry: {
                      payload?: {
                        category: string;
                        brand: string;
                        model: string;
                      };
                    }
                  ) => [
                    `${value} Unit`,
                    `${entry.payload?.category} | ${entry.payload?.brand} | ${entry.payload?.model}`,
                  ]}
                />
                <Legend
                  wrapperStyle={{ color: "white" }}
                  formatter={(value) => (
                    <span className="text-white">{value}</span>
                  )}
                  iconType="circle" // bisa "circle" | "rect" | "line" | "diamond"
                  payload={[
                    {
                      value: "Medical Devices",
                      type: "square",
                      color: "white", // 👉 ubah jadi putih
                      id: "medical-devices-legend",
                    },
                  ]}
                />
                <Bar
                  dataKey="total"
                  radius={[4, 4, 0, 0]}
                  name="Medical Devices"
                >
                  {population.map((entry, index) => (
                    <Cell
                      key={`cell-pop-${index}`}
                      fill={getCategoryColor(entry.category_name)}
                    />
                  ))}
                  <LabelList
                    dataKey="total"
                    position="right"
                    style={{ fill: "white", fontSize: 12, fontWeight: "bold" }}
                    formatter={(value: number) => `${value}`}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* REPORT TEHCNICIAN DISTRIBUTION */}
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-800 h-[500px]">
          <div className="flex justify-between items-center gap-2">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              Report Distribution By Technician
            </h2>
            <div className="flex gap-2">
              <div className="w-[350px]">
                <MultiSelectPopover
                  options={userOptions}
                  selected={selectedUsers}
                  onChange={setSelectedUsers}
                  placeholder="Select Technician..."
                />
              </div>
              <button
                onClick={() => setSelectedUsers([])}
                className="bg-white/10 hover:bg-white/20 text-white text-sm px-3 py-2 rounded-lg border border-gray-800 cursor-pointer flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Clear Filters
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={filteredPieChartData}
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
                {filteredPieChartData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={userStatsColors[index]} />
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

        <div className="bg-gray-900 p-10 rounded-lg border border-gray-800 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h2 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Monthly Report Volume
            </h2>
            <div className="flex items-center gap-2 mt-2 sm:mt-0">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-gray-900 border border-gray-700 text-white text-sm rounded-lg p-2 cursor-pointer"
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
                className="bg-gray-900 border border-gray-700 text-white text-sm rounded-lg p-2 cursor-pointer"
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
                dataKey="date"
                tick={{
                  fill: "#9CA3AF",
                  fontSize: 11,
                  textAnchor: "end",
                }}
                axisLine={{ stroke: "#4B5563" }}
                tickLine={{ stroke: "#4B5563" }}
                angle={-45}
                height={90}
                interval={0}
                tickFormatter={(value: string) => {
                  const d = new Date(value);
                  if (isNaN(d.getTime())) return value;

                  return d.toLocaleDateString("id-ID", {
                    weekday: "long", // jumat
                    day: "numeric", // 7
                    month: "long", // agustus
                    year: "numeric", // 2025
                  });
                }}
              />

              <YAxis
                stroke="#9ca3af"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                domain={[0, "dataMax"]} // <= sesuai data paling besar
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                labelFormatter={(label: string) => {
                  const d = new Date(label);
                  if (isNaN(d.getTime())) return label;

                  return d.toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  });
                }}
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

        <Dialog.Root
          open={isDetailOpen}
          onOpenChange={setIsDetailOpen}
          modal={true}
        >
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
            <Dialog.Content className="fixed top-1/2 left-1/2 bg-gray-800 text-white rounded-lg w-[95%] max-w-2xl -translate-x-1/2 -translate-y-1/2 max-h-[90vh] overflow-y-auto z-50">
              <div className="bg-blue-600 px-6 py-4 flex items-center gap-2">
                <Info className="w-5 h-5" />
                <Dialog.Title className="text-lg font-semibold">
                  Information Detail
                </Dialog.Title>
              </div>

              <div className="p-6 space-y-4">
                {selectedItem ? (
                  <>
                    <div>
                      <p className="text-sm text-gray-400">Name</p>
                      <p className="font-medium">{selectedItem.name}</p>
                    </div>
                    {/* <div>
                      <p className="text-sm text-gray-400">Published At</p>
                      <p className="font-medium">
                        {formatDateTimeID(selectedItem.published_at)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Expired At</p>
                      <p className="font-medium">
                        {formatDateTimeID(selectedItem.expired_at)}
                      </p>
                    </div> */}
                    <div>
                      <p className="text-sm text-gray-400">Content</p>
                      <div
                        className="prose prose-invert max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: selectedItem.content,
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <p className="text-gray-400">No data selected</p>
                )}
              </div>

              <div className="bg-gray-700 px-6 py-4 flex justify-end">
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 flex items-center gap-2 text-white"
                >
                  <X className="w-4 h-4" /> Close
                </button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </>
  );
}
