"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Cookies from "js-cookie";
import Link from "next/link";
import {
  ChevronLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Cake,
  Building,
  Hash,
  Calendar,
  BadgeCheck,
  BadgeX,
  RotateCw,
  CalendarDays,
  CalendarRange,
  Filter,
  BarChart2,
  ListCheck,
  FileText,
  FileSpreadsheet,
} from "lucide-react";
import Image from "next/image";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";
import MultiSelectPopover from "@/components/ui/MultiSelectPopover";
import * as XLSX from "xlsx";

interface MedicalDeviceSummary {
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  health_facility: string | null;
}

interface MedicalDevicesByHealthFacility {
  health_facility: string | null;
  total_devices: number;
  devices: {
    brand: string | null;
    model: string | null;
    serial_number: string | null;
  }[];
}

interface EmployeeDetail {
  id: number;
  name: string;
  nik: string;
  employee_number: string;
  gender: string;
  place_of_birth: string;
  date_of_birth: string;
  email: string;
  phone_number: string;
  address: string;
  date_of_entry: string;
  region: string;
  is_active: number;
  photo: string;
  division: Division;
  position: Position;
  reports: Report[];
  reports_pagination: ReportPagination;

  // tambahan
  total_medical_devices_serviced: number;
  total_medical_devices_serviced_overall: number;
  medical_devices_summary: MedicalDeviceSummary[];
  medical_devices_by_health_facility: MedicalDevicesByHealthFacility[];
}

// Interface definitions remain the same
interface Division {
  name: string;
}
interface Position {
  name: string;
}

interface MedicalDevice {
  id: number;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
}

interface ReportWorkItem {
  id: number;
  medical_device: MedicalDevice | null;
}

interface HealthFacility {
  id: number;
  name: string;
}
interface Report {
  id: number;
  report_number: string;
  customer_name: string;
  completed_at: string;
  is_status: string;
  health_facility_id: number;
  created_at: string;
  health_facility: HealthFacility | null;
  report_work_item: ReportWorkItem[];
}

interface ReportPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}
interface ReportPaginationLinks {
  first: string;
  last: string;
  prev: string | null;
  next: string | null;
}
interface ReportPagination {
  meta: ReportPaginationMeta;
  links: ReportPaginationLinks;
}

const COLORS = [
  "#34D399",
  "#60A5FA",
  "#FBBF24",
  "#F87171",
  "#A78BFA",
  "#F472B6",
];

const DetailItem = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | React.ReactNode;
}) => (
  <div className="space-y-1">
    <dt className="text-sm font-medium text-gray-400 flex items-center gap-2">
      <Icon className="w-4 h-4" />
      {label}
    </dt>
    <dd className="text-base text-white truncate">{value || "-"}</dd>
  </div>
);

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const [employeeInfo, setEmployeeInfo] = useState<EmployeeDetail | null>(null);
  const [fullReports, setFullReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fix: Use the correct interface for health facilities
  const [selectedHealthFacilities, setSelectedHealthFacilities] = useState<
    { label: string; value: string | number }[]
  >([]);
  const [healthFacilities, setHealthFacilities] = useState<
    { id: number; name: string }[]
  >([]);

  // State for pagination and filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [reportPagination, setReportPagination] =
    useState<ReportPagination | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [activeDateFilter, setActiveDateFilter] = useState<string | null>(null);

  // State for chart expansion - MOVED TO TOP LEVEL
  const [showAllDates, setShowAllDates] = useState(false);
  const [visibleCount, setVisibleCount] = useState(8);

  const fetchData = useCallback(
    async (
      page: number,
      sDate: string,
      eDate: string,
      healthFacilityIds: { label: string; value: string | number }[]
    ) => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const token = Cookies.get("token");
        if (!token) throw new Error("Unauthorized");

        // Fetch paginated reports with filters
        const paginatedParams = new URLSearchParams();
        paginatedParams.append("page", page.toString());
        if (sDate) paginatedParams.append("start_date", sDate);
        if (eDate) paginatedParams.append("end_date", eDate);

        // Add health facility filter
        if (healthFacilityIds.length > 0) {
          healthFacilityIds.forEach(
            (hf) => paginatedParams.append("health_facility_names[]", hf.label) // gunakan nama, bukan ID
          );
        }

        console.log("Fetching with params:", paginatedParams.toString()); // Debug log

        const resPaginated = await fetch(
          `${
            process.env.NEXT_PUBLIC_BASE_URL_API
          }/api/employee/${id}?${paginatedParams.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );
        const dataPaginated = await resPaginated.json();
        console.log("Paginated response:", dataPaginated); // Debug log

        if (!dataPaginated.status) throw new Error(dataPaginated.message);
        setEmployeeInfo(dataPaginated.data);
        setReportPagination(dataPaginated.data.reports_pagination);

        // Fetch all reports for the chart with the same filters
        const allParams = new URLSearchParams();
        allParams.append("all", "true");
        if (sDate) allParams.append("start_date", sDate);
        if (eDate) allParams.append("end_date", eDate);

        // Add health facility filter for all reports
        if (healthFacilityIds.length > 0) {
          healthFacilityIds.forEach(
            (hf) => allParams.append("health_facility_names[]", hf.label) // gunakan nama
          );
        }

        const resAll = await fetch(
          `${
            process.env.NEXT_PUBLIC_BASE_URL_API
          }/api/employee/${id}?${allParams.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );
        const dataAll = await resAll.json();
        if (!dataAll.status) throw new Error(dataAll.message);

        setFullReports(dataAll.data.reports || dataAll.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unexpected error");
      } finally {
        setLoading(false);
      }
    },
    [id]
  );

  // const exportToExcel = (employeeInfo: any, reports: any[]) => {
  //   if (!employeeInfo) return;

  //   // --- Hitung summary ---
  //   const totalReports = reports.length;
  //   const activeDays = new Set(reports.map((r) => r.completed_at.split(" ")[0]))
  //     .size;
  //   const avgDay = totalReports / (activeDays || 1);

  //   // Hitung peak
  //   const dateCount: Record<string, number> = {};
  //   reports.forEach((r) => {
  //     const date = r.completed_at.split(" ")[0]; // YYYY-MM-DD
  //     dateCount[date] = (dateCount[date] || 0) + 1;
  //   });

  //   let peakCount = 0;
  //   let peakDate = "";

  //   Object.entries(dateCount).forEach(([date, count]) => {
  //     if (
  //       count > peakCount ||
  //       (count === peakCount && new Date(date) > new Date(peakDate))
  //     ) {
  //       peakCount = count;
  //       peakDate = date;
  //     }
  //   });

  //   // Format tanggal Indonesia
  //   const formatDateIndo = (dateStr: string) => {
  //     if (!dateStr) return "";
  //     return new Intl.DateTimeFormat("id-ID", {
  //       weekday: "long",
  //       day: "numeric",
  //       month: "long",
  //       year: "numeric",
  //     }).format(new Date(dateStr));
  //   };

  //   const peak = `${peakCount} laporan pada ${formatDateIndo(peakDate)}`;

  //   // --- Header Row ---
  //   const headerRow = [
  //     "Technician",
  //     "Total Reports",
  //     "Total Days",
  //     "Avg/Day",
  //     "Peak",
  //     "Total Medical Devices Serviced (All Reports)",
  //   ];

  //   const headerValues = [
  //     employeeInfo.name,
  //     totalReports,
  //     activeDays,
  //     avgDay.toFixed(1),
  //     peak,
  //     employeeInfo.total_medical_devices_serviced_overall,
  //   ];

  //   // --- Report Rows ---
  //   const reportsSheet = reports.flatMap((r, idx) =>
  //     r.report_work_item.length > 0
  //       ? r.report_work_item.map((wi: any, wiIdx: number) => [
  //           `${idx + 1}.${wiIdx + 1}`,
  //           r.report_number,
  //           r.health_facility?.name || "",
  //           employeeInfo.name,
  //           formatDateIndo(r.completed_at), // ✅ tanggal Indonesia
  //           r.is_status,
  //           `${wi.medical_device?.brand || ""} ${
  //             wi.medical_device?.model || ""
  //           } (${wi.medical_device?.serial_number || ""})`,
  //         ])
  //       : [
  //           [
  //             idx + 1,
  //             r.report_number,
  //             r.health_facility?.name || "",
  //             employeeInfo.name,
  //             formatDateIndo(r.completed_at), // ✅ tanggal Indonesia
  //             r.is_status,
  //             "-",
  //           ],
  //         ]
  //   );

  //   const reportHeader = [
  //     "No",
  //     "Report Number",
  //     "Health Facility",
  //     "User",
  //     "Date",
  //     "Status",
  //     "Device Serviced",
  //   ];

  //   // Gabungkan semua
  //   const worksheetData = [
  //     headerRow,
  //     headerValues,
  //     [],
  //     reportHeader,
  //     ...reportsSheet,
  //   ];

  //   // Buat workbook
  //   const wb = XLSX.utils.book_new();
  //   const ws = XLSX.utils.aoa_to_sheet(worksheetData);

  //   XLSX.utils.book_append_sheet(wb, ws, "Employee Reports");
  //   XLSX.writeFile(wb, `${employeeInfo.name}_Reports.xlsx`);
  // };

  const exportToExcel = (employeeInfo: any, reports: any[]) => {
    if (!employeeInfo) return;

    // --- Hitung summary ---
    const totalReports = reports.length;
    const activeDays = new Set(reports.map((r) => r.completed_at.split(" ")[0]))
      .size;
    const avgDay = totalReports / (activeDays || 1);

    // Hitung peak
    const dateCount: Record<string, number> = {};
    reports.forEach((r) => {
      const date = r.completed_at.split(" ")[0]; // YYYY-MM-DD
      dateCount[date] = (dateCount[date] || 0) + 1;
    });

    let peakCount = 0;
    let peakDate = "";

    Object.entries(dateCount).forEach(([date, count]) => {
      if (
        count > peakCount ||
        (count === peakCount && new Date(date) > new Date(peakDate))
      ) {
        peakCount = count;
        peakDate = date;
      }
    });

    // Format tanggal Indonesia
    const formatDateIndo = (dateStr: string) => {
      if (!dateStr) return "";
      return new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(dateStr));
    };

    const peak = `${peakCount} laporan pada ${formatDateIndo(peakDate)}`;

    // --- Header Row ---
    const headerRow = [
      "Technician",
      "Total Reports",
      "Total Days",
      "Avg/Day",
      "Peak",
      "Total Medical Devices Serviced (All Reports)",
    ];

    const headerValues = [
      employeeInfo.name,
      totalReports,
      activeDays,
      avgDay.toFixed(1),
      peak,
      employeeInfo.total_medical_devices_serviced_overall,
    ];

    // --- Report Rows dengan data yang lebih bersih ---
    const reportsSheet = reports.flatMap((r, idx) => {
      if (r.report_work_item.length > 0) {
        // Untuk item pertama, tampilkan semua data
        const firstRow = [
          idx + 1,
          r.report_number,
          r.health_facility?.name || "",
          (r.customer_name || "").toUpperCase(),
          formatDateIndo(r.completed_at),
          r.is_status,
          `${r.report_work_item[0].medical_device?.brand || ""} ${
            r.report_work_item[0].medical_device?.model || ""
          } (${r.report_work_item[0].medical_device?.serial_number || ""})`,
        ];

        // Untuk item selanjutnya, hanya tampilkan device
        const additionalRows = r.report_work_item.slice(1).map((wi: any) => [
          "", // No kosong
          "", // Report Number kosong
          "", // Health Facility kosong
          "", // User kosong
          "", // Date kosong
          "", // Status kosong
          `${wi.medical_device?.brand || ""} ${
            wi.medical_device?.model || ""
          } (${wi.medical_device?.serial_number || ""})`,
        ]);

        return [firstRow, ...additionalRows];
      } else {
        return [
          [
            idx + 1,
            r.report_number,
            r.health_facility?.name || "",
            (r.customer_name || "").toUpperCase(),
            formatDateIndo(r.completed_at),
            r.is_status,
            "-",
          ],
        ];
      }
    });

    const reportHeader = [
      "No",
      "Report Number",
      "Health Facility",
      "User",
      "Date",
      "Status",
      "Device Serviced",
    ];

    // Gabungkan semua
    const worksheetData = [
      headerRow,
      headerValues,
      [],
      reportHeader,
      ...reportsSheet,
    ];

    // Buat workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    // Optional: Styling untuk membuat lebih rapi
    // Merge cells untuk kolom yang kosong agar lebih terlihat rapi
    ws["!merges"] = []; // Bisa ditambahkan merge cells jika diperlukan

    XLSX.utils.book_append_sheet(wb, ws, "Employee Reports");
    XLSX.writeFile(wb, `${employeeInfo.name}_Reports.xlsx`);
  };

  // Separate useEffect for initial load and when dependencies change
  useEffect(() => {
    fetchData(1, startDate, endDate, selectedHealthFacilities);
  }, [startDate, endDate, selectedHealthFacilities, fetchData]);

  // Separate useEffect for pagination changes
  useEffect(() => {
    if (currentPage > 1) {
      fetchData(currentPage, startDate, endDate, selectedHealthFacilities);
    }
  }, [currentPage]);

  // Reset chart expansion when data changes
  useEffect(() => {
    setVisibleCount;
    setShowAllDates(false);
  }, [fullReports]);

  useEffect(() => {
    const fetchHealthFacilities = async () => {
      const token = Cookies.get("token");
      if (!token) return;
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL_API}/api/health-facility-name`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );
        const data = await res.json();
        if (data.status) {
          console.log("Health facilities loaded:", data.data); // Debug log
          setHealthFacilities(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch health facilities", err);
      }
    };
    fetchHealthFacilities();
  }, []);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= (reportPagination?.meta.last_page || 1)) {
      console.log("Changing page to:", page); // Debug log
      setCurrentPage(page);
    }
  };

  const setDateFilter = (range: "today" | "week" | "month" | "year") => {
    const today = new Date();
    let start, end;
    switch (range) {
      case "today":
        start = end = format(today, "yyyy-MM-dd");
        break;
      case "week":
        start = format(startOfWeek(today), "yyyy-MM-dd");
        end = format(endOfWeek(today), "yyyy-MM-dd");
        break;
      case "month":
        start = format(startOfMonth(today), "yyyy-MM-dd");
        end = format(endOfMonth(today), "yyyy-MM-dd");
        break;
      case "year":
        start = format(startOfYear(today), "yyyy-MM-dd");
        end = format(endOfYear(today), "yyyy-MM-dd");
        break;
    }
    setStartDate(start);
    setEndDate(end);
    setActiveDateFilter(range);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setStartDate("");
    setEndDate("");
    setActiveDateFilter(null);
    setSelectedHealthFacilities([]);
    setCurrentPage(1);
  };

  const getPaginationNumbers = () => {
    if (!reportPagination) return [];
    const { last_page: totalPages, current_page: page } = reportPagination.meta;
    const delta = 2;
    const range = [];
    for (
      let i = Math.max(2, page - delta);
      i <= Math.min(totalPages - 1, page + delta);
      i++
    ) {
      range.push(i);
    }
    if (page - delta > 2) range.unshift("...");
    if (page + delta < totalPages - 1) range.push("...");
    range.unshift(1);
    if (totalPages > 1) range.push(totalPages);
    return [...new Set(range)];
  };

  // Handle health facility selection change
  const handleHealthFacilityChange = (
    selectedOptions: { label: string; value: string | number }[]
  ) => {
    console.log("Selected health facilities:", selectedOptions);
    setSelectedHealthFacilities(selectedOptions);
    setCurrentPage(1); // Reset to page 1 when filter changes
  };

  useEffect(() => {
    // set default filter ke bulan berjalan saat pertama kali load
    const today = new Date();
    const start = format(startOfMonth(today), "yyyy-MM-dd");
    const end = format(endOfMonth(today), "yyyy-MM-dd");

    setStartDate(start);
    setEndDate(end);
    setDateFilter("month");
  }, []);

  // MOVED renderReportsChart to use passed props instead of hooks
  const renderReportsChart = (reports: Report[]) => {
    if (!reports || reports.length === 0) {
      return (
        <section className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-xl w-full mx-auto">
          <header className="mb-6 border-b border-gray-800 pb-4 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
              Report Overview
            </h2>
          </header>
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <BarChart2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No report data available</p>
              <p className="text-sm">
                Reports will appear here when data is available
              </p>
            </div>
          </div>
        </section>
      );
    }

    // Group reports by date and collect health facilities
    const dateGroups = reports.reduce(
      (acc, report) => {
        const reportDate = new Date(report.completed_at);
        // Format with day and date: "Mon, 15 Jan 2024"
        const dateWithDay = reportDate.toLocaleDateString("id-ID", {
          weekday: "short",
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
        // Keep original date format for sorting
        const dateOnly = reportDate.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });

        acc[dateWithDay] = acc[dateWithDay] || {
          date: dateWithDay,
          dateOnly: dateOnly,
          sortDate: reportDate,
          count: 0,
          reports: [],
          healthFacilities: new Set(),
        };
        acc[dateWithDay].count++;
        acc[dateWithDay].reports.push(report);

        // Add health facility name if exists
        if (report.health_facility?.name) {
          acc[dateWithDay].healthFacilities.add(report.health_facility.name);
        }

        return acc;
      },
      {} as {
        [key: string]: {
          date: string;
          dateOnly: string;
          sortDate: Date;
          count: number;
          reports: Report[];
          healthFacilities: Set<string>;
        };
      }
    );

    // Convert to array and sort by date (most recent first for display)
    const barChartData = Object.values(dateGroups).sort((a, b) => {
      return b.sortDate.getTime() - a.sortDate.getTime();
    });

    // For the chart, we want chronological order (oldest to newest for better visualization)
    const chartData = [...barChartData].reverse();

    // Calculate some statistics
    const totalReports = reports.length;
    const avgReportsPerDay = totalReports / barChartData.length;
    const maxReportsInDay = Math.max(...barChartData.map((d) => d.count));
    const mostActiveDate = barChartData.find(
      (d) => d.count === maxReportsInDay
    );

    return (
      <section className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-xl w-full mx-auto">
        <header className="mb-6 border-b border-gray-800 pb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
              Report Overview
            </h2>
            <p className="text-sm text-gray-500">
              Updated{" "}
              {new Date().toLocaleDateString("id-ID", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-gray-400">
            <span>
              Total:{" "}
              <span className="text-white font-medium">{totalReports}</span>{" "}
              reports
            </span>
            <span>
              Days:{" "}
              <span className="text-white font-medium">
                {barChartData.length}
              </span>
            </span>
            <span>
              Avg/day:{" "}
              <span className="text-white font-medium">
                {avgReportsPerDay.toFixed(1)}
              </span>
            </span>
            {mostActiveDate && (
              <span>
                Peak:{" "}
                <span className="text-white font-medium">
                  {mostActiveDate.count}
                </span>{" "}
                on {mostActiveDate.date}
              </span>
            )}
          </div>
        </header>

        <div className="flex flex-col xl:flex-row gap-6">
          {/* Bar Chart */}
          <div className="flex-1 w-full">
            <div className="bg-gray-800/50 rounded-lg p-2 h-full">
              <h3 className="text-lg font-medium text-gray-200 mb-12 mt-3 flex items-center gap-4">
                <BarChart2 className="w-5 h-5 ml-3" />
                Reports by Dates
              </h3>
              <div className="min-h-[500px]">
                <ResponsiveContainer width="100%" height={500}>
                  <BarChart
                    data={chartData}
                    margin={{ top: 50, right: 30, left: 0, bottom: 0 }}
                    barGap={10}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#374151"
                      horizontal={true}
                      vertical={false}
                    />
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
                      height={80}
                      interval={0}
                    />
                    <YAxis
                      tick={{ fill: "#9CA3AF", fontSize: 12 }}
                      axisLine={{ stroke: "#4B5563" }}
                      tickLine={{ stroke: "#4B5563" }}
                      domain={[0, "dataMax + 1"]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #374151",
                        borderRadius: "8px",
                        color: "white",
                        fontSize: "14px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                      formatter={(value: any) => [
                        <span className="font-medium">{value} reports</span>,
                        "Total",
                      ]}
                      labelFormatter={(label: string) => (
                        <span className="font-medium text-blue-400">
                          {label}
                        </span>
                      )}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const healthFacilities = Array.from(
                            data.healthFacilities
                          ) as string[];

                          return (
                            <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 shadow-lg max-w-sm">
                              <p className="font-medium text-blue-400 mb-2">
                                {String(label)}
                              </p>
                              <div className="space-y-1 mb-3">
                                <p className="text-white">
                                  <span className="font-medium">
                                    {payload[0].value as number} reports
                                  </span>
                                </p>
                              </div>

                              {healthFacilities.length > 0 && (
                                <div className="border-t border-gray-600 pt-2">
                                  <p className="text-gray-300 text-sm font-medium mb-1">
                                    Health Facilities ({healthFacilities.length}
                                    ):
                                  </p>
                                  <div className="space-y-1 max-h-32 overflow-y-auto">
                                    {healthFacilities.map((facility, index) => (
                                      <div
                                        key={index}
                                        className="flex items-start gap-2"
                                      >
                                        <span className="inline-block w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 flex-shrink-0"></span>
                                        <span className="text-gray-200 text-sm">
                                          {facility}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                      cursor={{ fill: "rgba(59, 130, 246, 0.1)" }}
                    />
                    <Bar
                      dataKey="count"
                      fill="#3B82F6"
                      radius={[4, 4, 0, 0]}
                      stroke="#1E40AF"
                      strokeWidth={1}
                      barSize={35}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Summary Panel */}
          <div className="xl:w-80 w-full">
            <div className="bg-gray-800/50 rounded-lg p-4 h-full">
              <h3 className="text-lg font-medium text-gray-200 mb-4">
                Daily Breakdown
              </h3>

              {/* Top dates */}
              <div className="space-y-3 mb-6 max-h-80 overflow-y-auto">
                {barChartData
                  .slice(0, showAllDates ? barChartData.length : visibleCount)
                  .map((entry, index) => (
                    <div
                      key={entry.date}
                      className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor:
                                index === 0
                                  ? "#EF4444"
                                  : index === 1
                                  ? "#F59E0B"
                                  : index === 2
                                  ? "#10B981"
                                  : "#6B7280",
                            }}
                          />
                          <span className="text-xs font-medium text-gray-400">
                            #{index + 1}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-300 font-medium block">
                            {entry.date}
                          </span>
                          <span className="text-xs text-gray-500">
                            {((entry.count / totalReports) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-white text-sm block">
                          {entry.count}
                        </span>
                        <span className="text-xs text-gray-500">reports</span>
                      </div>
                    </div>
                  ))}

                {!showAllDates && barChartData.length > visibleCount && (
                  <button
                    onClick={() => setShowAllDates(true)}
                    className="w-full text-center text-blue-400 hover:text-blue-300 text-sm py-3 border-t border-gray-700 hover:bg-gray-800/50 transition-all duration-200 rounded-b-lg cursor-pointer"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span>
                        Show {barChartData.length - visibleCount} more dates
                      </span>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </button>
                )}

                {showAllDates && barChartData.length > visibleCount && (
                  <button
                    onClick={() => setShowAllDates(false)}
                    className="w-full text-center text-gray-400 hover:text-gray-300 text-sm py-3 border-t border-gray-700 hover:bg-gray-800/50 transition-all duration-200 rounded-b-lg cursor-pointer"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span>Show less</span>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                    </div>
                  </button>
                )}
              </div>

              {/* Summary Stats */}
              <div className="space-y-3 pt-4 border-t border-gray-700">
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-900/30 to-blue-800/30 rounded-lg border border-blue-800/50">
                  <span className="text-base font-medium text-blue-200">
                    Total Reports
                  </span>
                  <span className="font-bold text-white text-xl">
                    {totalReports}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700">
                  <span className="text-sm font-medium text-gray-300">
                    Active Days
                  </span>
                  <span className="font-semibold text-white">
                    {barChartData.length}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700">
                  <span className="text-sm font-medium text-gray-300">
                    Daily Average
                  </span>
                  <span className="font-semibold text-white">
                    {avgReportsPerDay.toFixed(1)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700">
                  <span className="text-sm font-medium text-gray-300">
                    Peak Day
                  </span>
                  <span className="font-semibold text-white">
                    {maxReportsInDay}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  };

  if (loading && !employeeInfo)
    return (
      <div className="flex justify-center items-center h-screen text-white">
        Loading...
      </div>
    );
  if (error)
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        Error: {error}
      </div>
    );
  if (!employeeInfo)
    return (
      <div className="text-gray-500 text-center">No employee data found.</div>
    );

  const { reports, reports_pagination } = employeeInfo;

  return (
    <main className="px-3 py-3 mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <User className="w-8 h-8 text-blue-400" />
          Employee Details
        </h1>
        <Link
          href="/dashboard/employees"
          className="flex items-center gap-2 text-sm text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
        >
          <ChevronLeft className="w-4 h-4" /> Back to List
        </Link>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-xl text-center">
          <Image
            src={`${process.env.NEXT_PUBLIC_FILE_BASE_URL}/storage/employee_photos/${employeeInfo.photo}`}
            alt={employeeInfo.name}
            width={100}
            height={100}
            layout="fixed"
            objectFit="cover"
            unoptimized
            className="rounded-full object-cover mx-auto w-24 h-24 mb-8 mt-10"
          />
          <h2 className="text-xl font-semibold text-white">
            {employeeInfo.name}
          </h2>
          <p className="text-blue-400">{employeeInfo.position.name}</p>
          <p className="text-gray-400 text-sm">{employeeInfo.division.name}</p>
          <div
            className={`mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
              employeeInfo.is_active
                ? "bg-green-900/50 text-green-400"
                : "bg-red-900/50 text-red-400"
            }`}
          >
            {employeeInfo.is_active ? (
              <BadgeCheck className="w-4 h-4" />
            ) : (
              <BadgeX className="w-4 h-4" />
            )}
            <span>{employeeInfo.is_active ? "Active" : "Inactive"}</span>
          </div>
        </div>

        <div className="lg:col-span-2 bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-xl">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <DetailItem icon={Hash} label="NIK" value={employeeInfo.nik} />
            <DetailItem
              icon={Hash}
              label="Employee Number"
              value={employeeInfo.employee_number}
            />
            <DetailItem icon={Mail} label="Email" value={employeeInfo.email} />
            <DetailItem
              icon={Phone}
              label="Phone"
              value={employeeInfo.phone_number}
            />
            <DetailItem
              icon={Cake}
              label="Date of Birth"
              value={`${employeeInfo.place_of_birth}, ${new Date(
                employeeInfo.date_of_birth
              ).toLocaleDateString("id-ID")}`}
            />
            <DetailItem
              icon={User}
              label="Gender"
              value={employeeInfo.gender}
            />
            <DetailItem
              icon={Calendar}
              label="Date of Entry"
              value={new Date(employeeInfo.date_of_entry).toLocaleDateString(
                "id-ID"
              )}
            />
            <DetailItem
              icon={Building}
              label="Region"
              value={employeeInfo.region}
            />
            <DetailItem
              icon={MapPin}
              label="Address"
              value={employeeInfo.address}
            />
          </dl>
        </div>
      </section>

      {/* Reports Section */}
      <div className="space-y-6">
        {/* Filter Controls */}
        <div className="p-4 bg-gray-900 rounded-lg border border-gray-800 space-y-4">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
            <Filter className="w-5 h-5" />
            Filter Data
          </h2>

          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setDateFilter("today")}
              className={`flex-1 px-3 py-1.5 rounded-md text-sm cursor-pointer flex items-center justify-center transition-colors ${
                activeDateFilter === "today"
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-700 hover:bg-gray-600 text-gray-300"
              }`}
            >
              <CalendarDays className="w-4 h-4 mr-2" /> Today
            </button>
            <button
              onClick={() => setDateFilter("week")}
              className={`flex-1 px-3 py-1.5 rounded-md text-sm cursor-pointer flex items-center justify-center transition-colors ${
                activeDateFilter === "week"
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-700 hover:bg-gray-600 text-gray-300"
              }`}
            >
              <CalendarRange className="w-4 h-4 mr-2" /> This Week
            </button>
            <button
              onClick={() => setDateFilter("month")}
              className={`flex-1 px-3 py-1.5 rounded-md text-sm cursor-pointer flex items-center justify-center transition-colors ${
                activeDateFilter === "month"
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-700 hover:bg-gray-600 text-gray-300"
              }`}
            >
              <Calendar className="w-4 h-4 mr-2" /> This Month
            </button>
            <button
              onClick={() => setDateFilter("year")}
              className={`flex-1 px-3 py-1.5 rounded-md text-sm cursor-pointer flex items-center justify-center transition-colors ${
                activeDateFilter === "year"
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-700 hover:bg-gray-600 text-gray-300"
              }`}
            >
              <Calendar className="w-4 h-4 mr-2" /> This Year
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setActiveDateFilter(null);
                  setCurrentPage(1);
                }}
                className="w-full p-2 border border-gray-600 rounded-lg bg-gray-800 text-white cursor-pointer"
              />
            </div>
            <div className="md:col-span-1">
              <label
                htmlFor="endDate"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setActiveDateFilter(null);
                  setCurrentPage(1);
                }}
                className="w-full p-2 border border-gray-600 rounded-lg bg-gray-800 text-white cursor-pointer"
              />
            </div>
            <div className="md:col-span-1">
              <label
                htmlFor="healthFacilities"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Health Facilities
              </label>
              <MultiSelectPopover
                options={healthFacilities.map((hf) => ({
                  label: hf.name,
                  value: hf.name, // sebelumnya hf.id
                }))}
                selected={selectedHealthFacilities}
                onChange={handleHealthFacilityChange}
                placeholder="Select Health Facilities"
              />
            </div>
            <div className="md:col-span-1 flex items-end">
              <button
                onClick={handleReset}
                className="w-full inline-flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors cursor-pointer"
              >
                <RotateCw className="w-4 h-4 mr-2" />
                Reset Filter
              </button>
            </div>
          </div>

          {/* Show selected health facilities */}
          {selectedHealthFacilities.length > 0 && (
            <div className="mt-3 p-3 bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-300 mb-2">
                Selected Health Facilities ({selectedHealthFacilities.length}):
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedHealthFacilities.map((hf) => (
                  <span
                    key={hf.value}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-600 text-white"
                  >
                    {hf.label}
                    <button
                      onClick={() => {
                        const newSelected = selectedHealthFacilities.filter(
                          (item) => item.value !== hf.value
                        );
                        setSelectedHealthFacilities(newSelected);
                        setCurrentPage(1);
                      }}
                      className="ml-1 text-blue-200 hover:text-white"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Chart */}
        {fullReports.length > 0 && renderReportsChart(fullReports)}

        {/* Report List and Pagination */}
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-xl w-full mx-auto">
          <div className="flex justify-between items-center gap-2">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <ListCheck className="w-5 h-5" />
              Report List ({reports_pagination?.meta.total || 0})
            </h2>
            <button
              onClick={() => exportToExcel(employeeInfo, fullReports)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 mb-4 flex items-center gap-2 cursor-pointer"
            >
              <FileSpreadsheet className="w-5 h-5" />
              Export to Excel
            </button>
          </div>

          {/* Total medical devices serviced */}
          <div className="mb-4 text-sm text-gray-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {/* Current Page Devices */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-900/30 to-blue-800/30 border border-blue-700/50 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600/20 text-blue-400">
                    <ListCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">
                      Total Medical Devices Serviced (This Page)
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {employeeInfo.total_medical_devices_serviced || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Overall Devices */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-purple-900/30 to-purple-800/30 border border-purple-700/50 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-600/20 text-purple-400">
                    <BarChart2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">
                      Total Medical Devices Serviced (All Reports)
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {employeeInfo.total_medical_devices_serviced_overall || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {loading && (
            <div className="text-center py-4">Loading reports...</div>
          )}

          {!loading && reports && reports.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="table-auto w-full text-sm text-left text-gray-300">
                  <thead className="text-xs uppercase bg-gray-800 text-gray-400">
                    <tr>
                      <th className="px-4 py-3 whitespace-nowrap">No</th>
                      <th className="px-4 py-3 whitespace-nowrap">
                        Report Number
                      </th>
                      <th className="px-4 py-3">Health Facility</th>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3 whitespace-nowrap">Date</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Device Services</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report, index) => (
                      <tr
                        key={report.id}
                        className="border-b border-gray-700 hover:bg-gray-800"
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          {(reports_pagination.meta.current_page - 1) *
                            reports_pagination.meta.per_page +
                            index +
                            1}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <Link
                            href={`/dashboard/reports/${report.id}`}
                            className="text-blue-400 hover:text-blue-300 underline"
                          >
                            {report.report_number}
                          </Link>
                        </td>

                        <td className="px-4 py-3 uppercase">
                          {report.health_facility?.name || "-"}
                        </td>
                        <td className="px-4 py-3 uppercase">
                          {report.customer_name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {report.completed_at
                            ? new Date(report.completed_at).toLocaleDateString(
                                "id-ID",
                                {
                                  weekday: "long",
                                  day: "2-digit",
                                  month: "long",
                                  year: "numeric",
                                }
                              )
                            : "-"}
                        </td>
                        <td className="px-4 py-3">{report.is_status}</td>

                        {/* Devices */}
                        <td className="px-4 py-3">
                          {report.report_work_item?.length > 0 ? (
                            <ul className="space-y-1">
                              {report.report_work_item.map(
                                (wi: any, i: number) => (
                                  <li
                                    key={i}
                                    className="text-sm whitespace-nowrap"
                                  >
                                    {wi.medical_device?.brand} -{" "}
                                    {wi.medical_device?.model}
                                    <span className="text-gray-400">
                                      {" "}
                                      (SN:{" "}
                                      {wi.medical_device?.serial_number || "-"})
                                    </span>
                                  </li>
                                )
                              )}
                            </ul>
                          ) : (
                            <span className="text-gray-500 italic">
                              No devices
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {reports_pagination && reports_pagination.meta.last_page > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                  <div className="text-sm text-gray-400">
                    Showing{" "}
                    {(reports_pagination.meta.current_page - 1) *
                      reports_pagination.meta.per_page +
                      1}{" "}
                    to{" "}
                    {Math.min(
                      reports_pagination.meta.current_page *
                        reports_pagination.meta.per_page,
                      reports_pagination.meta.total
                    )}{" "}
                    of {reports_pagination.meta.total} results
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() =>
                        handlePageChange(
                          reports_pagination.meta.current_page - 1
                        )
                      }
                      disabled={reports_pagination.meta.current_page === 1}
                      className="cursor-pointer px-3 py-2 text-sm border border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 text-gray-300 transition-colors"
                    >
                      Previous
                    </button>
                    {getPaginationNumbers().map((page, index) =>
                      page === "..." ? (
                        <span
                          key={index}
                          className="px-3 py-2 text-sm text-gray-500"
                        >
                          ...
                        </span>
                      ) : (
                        <button
                          key={index}
                          onClick={() => handlePageChange(page as number)}
                          className={`px-3 py-2 text-sm border rounded-md transition-colors cursor-pointer ${
                            reports_pagination.meta.current_page === page
                              ? "bg-blue-600 text-white border-blue-600"
                              : "border-gray-600 text-gray-300 hover:bg-gray-700"
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}
                    <button
                      onClick={() =>
                        handlePageChange(
                          reports_pagination.meta.current_page + 1
                        )
                      }
                      disabled={
                        reports_pagination.meta.current_page ===
                        reports_pagination.meta.last_page
                      }
                      className="cursor-pointer px-3 py-2 text-sm border border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 text-gray-300 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            !loading && (
              <div className="text-center py-10 text-gray-500">
                No reports found for the selected criteria.
              </div>
            )
          )}
        </div>
      </div>
    </main>
  );
}
