"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Cookies from "js-cookie";
import Link from "next/link";
import {
  Edit,
  Trash2,
  FileText,
  X,
  Eye,
  CheckCircle,
  Clock,
  Hourglass,
  Download,
  Filter,
  RotateCw,
  CalendarDays,
  CalendarRange,
  Calendar,
  FileSpreadsheet,
  Printer,
} from "lucide-react";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";

import { useMemo } from "react";
import * as Popover from "@radix-ui/react-popover";
import { ChevronsUpDown, Check } from "lucide-react";

interface FullReport {
  id: number;
  report_number: string;
  is_status: "Progress" | "Pending" | "Completed";
  customer_name: string;
  customer_phone: string;
  note: string;
  suggestion: string;
  completed_at: string;
  total_time: string;
  employee: {
    id: number;
    name: string;
    employee_number: string;
    region: string;
  };
  health_facility: {
    name: string;
    city: string;
    address: string;
    type: { name: string };
    medical_devices: {
      id: number;
      brand: string;
      model: string;
      serial_number: string;
      medical_device_category: { name: string };
    }[];
  };
  report_work_item: {
    medical_device_id: number;
    problem: string;
    error_code: string;
    job_action: string;
    note: string;
    job_order: string;
    report_work_item_type: { type_of_work: { name: string } }[];
  }[];
  location: {
    address: string;
    latitude: string;
    longitude: string;
  };
}

interface Employee {
  id: number;
  name: string;
  employee_number: string;
}

interface HealthFacility {
  id: number;
  name: string;
}

interface Report {
  id: number;
  report_number: string;
  problem: string;
  is_status: "Progress" | "Pending" | "Completed";
  completed_at: string | null;
  created_at: string;
  employee: Employee;
  health_facility: HealthFacility;
}

interface FlatReportData {
  "Report Number": string;
  Status: string;
  "Date Completed": string;
  "Total Time": string;
  "Employee Name": string;
  "Employee Number": string;
  "Health Facility": string;
  "Facility Type": string;
  City: string;
  "Facility Address": string;
  "Job Order": string;
  "Type of Work": string;
  Problem: string;
  "Error Code": string;
  "Job Action": string;
  "Work Item Note": string;
  "Device Brand": string;
  "Device Model": string;
  "Device Serial Number": string;
  "Device Category": string;
  "Customer Name": string;
  "Customer Phone": string;
  "Report Note": string;
  Suggestion: string;
  "Location Address": string;
  Latitude: string;
  Longitude: string;
}

export default function ReportsClientPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReports, setTotalReports] = useState(0);
  const [perPage, setPerPage] = useState(10);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [userRole, setUserRole] = useState<string>("");
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [isExporting, setIsExporting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [filterUser, setFilterUser] = useState<string>("");
  const [filterStartDate, setFilterStartDate] = useState<string>("");
  const [filterEndDate, setFilterEndDate] = useState<string>("");

  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEmployees = useMemo(() => {
    if (!searchQuery) {
      return employees;
    }
    return employees.filter((emp) =>
      emp.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [employees, searchQuery]);

  // Check user permissions (with super-admin check)
  const hasPermission = (slug: string) => {
    if (userRole.toLowerCase() === "super-admin") {
      return true;
    }
    return userPermissions.includes(slug);
  };

  const fetchReports = useCallback(
    async (
      page: number = 1,
      search: string = "",
      sDate: string,
      eDate: string
    ) => {
      setLoading(true);
      setError(null);
      try {
        const token = Cookies.get("token");
        if (!token) throw new Error("Unauthorized");

        const params = new URLSearchParams();
        params.append("page", page.toString());
        if (search.trim()) params.append("search", search);
        if (sDate) params.append("start_date", sDate);
        if (eDate) params.append("end_date", eDate);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL_API}/api/report?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to fetch reports");
        }

        const json = await res.json();

        setReports(Array.isArray(json.data.data) ? json.data.data : []);
        setCurrentPage(json.data.current_page);
        setTotalPages(json.data.last_page);
        setTotalReports(json.data.total);
        setPerPage(json.data.per_page);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error fetching reports");
        setReports([]);
      } finally {
        setLoading(false);
      }
    },
    [] // Removed perPage from dependencies as it's not needed
  );

  const handleFilterToday = () => {
    const today = format(new Date(), "yyyy-MM-dd");
    setStartDate(today);
    setEndDate(today);
    fetchReports(1, searchTerm, today, today);
  };

  const handleFilter = () => {
    fetchReports(1, searchTerm, startDate, endDate);
  };

  const handleReset = () => {
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
    fetchReports(1, "", "", "");
  };

  const fetchEmployees = async () => {
    try {
      const token = Cookies.get("token");
      if (!token) return;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL_API}/api/employee`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch employees");

      const json = await res.json();
      setEmployees(Array.isArray(json.data) ? json.data : []);
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  // Fixed useEffect with proper dependencies
  useEffect(() => {
    fetchReports(currentPage, searchTerm, startDate, endDate);
  }, [currentPage, fetchReports, searchTerm, startDate, endDate]);

  useEffect(() => {
    const initializeData = async () => {
      await fetchEmployees();
    };
    initializeData();
  }, []);

  const [activeDateFilter, setActiveDateFilter] = useState<
    "today" | "week" | "month" | "year" | null
  >(null);

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
    setFilterStartDate(start);
    setFilterEndDate(end);
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You will not be able to recover this report!",
      icon: "warning",
      showCancelButton: true,
      background: "#1e293b",
      color: "#f8fafc",
      confirmButtonText: "Yes, delete it!",
      confirmButtonColor: "#dc2626",
    });

    if (result.isConfirmed) {
      try {
        const token = Cookies.get("token");
        if (!token) throw new Error("Token not found");

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL_API}/api/report/${id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        if (res.ok) {
          Swal.fire({
            title: "Deleted!",
            text: "The report has been deleted.",
            icon: "success",
            background: "#1e293b",
            color: "#f8fafc",
            timer: 2000,
            showConfirmButton: false,
            timerProgressBar: true,
          });
          fetchReports(currentPage, searchTerm, startDate, endDate);
        } else {
          const errorData = await res.json();
          Swal.fire({
            title: "Error",
            text: errorData.message || "Failed to delete report",
            icon: "error",
            background: "#1e293b",
            color: "#f8fafc",
          });
        }
      } catch (error) {
        console.error("Error deleting report:", error);
        Swal.fire({
          title: "Error",
          text: "An unexpected error occurred.",
          icon: "error",
          background: "#1e293b",
          color: "#f8fafc",
        });
      }
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      const storedPermissions = Cookies.get("permissions");
      const storedRole = Cookies.get("role");

      if (storedPermissions) {
        try {
          setUserPermissions(JSON.parse(storedPermissions));
        } catch {
          setUserPermissions([]);
        }
      }
      if (storedRole) setUserRole(storedRole);

      await fetchReports(1, "", "", "");
    };
    initializeData();
  }, [fetchReports]);

  // Simplified useEffect for search debouncing
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when searching
      fetchReports(1, searchTerm, startDate, endDate);
    }, 400);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchTerm, startDate, endDate, fetchReports]);

  const handlePageChange = useCallback(
    (page: number) => {
      if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
      }
    },
    [totalPages]
  );

  const getPaginationNumbers = () => {
    const delta = 2;
    const range = [];
    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      range.unshift("...");
    }
    if (currentPage + delta < totalPages - 1) {
      range.push("...");
    }

    range.unshift(1);
    if (totalPages > 1) {
      range.push(totalPages);
    }

    return [...new Set(range)];
  };

  const renderStatusBadge = (status: Report["is_status"]) => {
    switch (status) {
      case "Completed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900 text-green-300">
            <CheckCircle className="w-3 h-3 mr-1.5" />
            Completed
          </span>
        );
      case "Pending":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900 text-blue-300">
            <Hourglass className="w-3 h-3 mr-1.5" />
            Pending
          </span>
        );
      case "Progress":
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-900 text-yellow-300">
            <Clock className="w-3 h-3 mr-1.5" />
            In Progress
          </span>
        );
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[40vh] bg-gray-900 rounded-lg">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500"></div>
          <p className="mt-4 text-gray-400">Loading Reports...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-900/20 text-red-400 p-6 rounded-lg text-center min-h-[40vh] flex flex-col justify-center items-center">
          <h3 className="text-lg font-bold">Failed to load data</h3>
          <p>{error}</p>
        </div>
      );
    }

    if (reports.length === 0) {
      return (
        <div className="bg-gray-900 rounded-lg text-center min-h-[40vh] flex flex-col justify-center items-center p-6">
          <FileText className="w-16 h-16 text-gray-600 mb-4" />
          <h3 className="text-xl font-semibold text-white">No Reports Found</h3>
          <p className="text-gray-500 mt-2 max-w-sm">
            {searchTerm
              ? "Try adjusting your search."
              : "Get started by creating a new report."}
          </p>
        </div>
      );
    }

    return (
      <>
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Report Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Health Facility
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {reports.map((report, index: number) => (
                  <tr key={report.id} className="hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {(currentPage - 1) * perPage + index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <code className="px-2 py-1 bg-gray-700 rounded text-xs text-white">
                        {report.report_number}
                      </code>
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm">
                      {report.health_facility?.name || "-"}
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm">
                      <div>
                        <div className="font-medium text-white">
                          {report.employee?.name || "-"}
                        </div>
                        <div className="text-gray-400">
                          {report.employee?.employee_number || "-"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderStatusBadge(report.is_status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {hasPermission("show-report") && (
                          <Link
                            href={`/dashboard/reports/${report.id}`}
                            className="text-blue-400 hover:text-blue-300 p-1 cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        )}
                        {hasPermission("update-report") &&
                          report.is_status !== "Completed" && (
                            <Link
                              href={`/dashboard/reports/${report.id}/edit`}
                              className="text-green-400 hover:text-green-300 p-1 cursor-pointer hidden"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                          )}
                        {hasPermission("delete-report") && (
                          <button
                            onClick={() => handleDelete(report.id)}
                            className="text-red-400 hover:text-red-300 p-1 cursor-pointer hidden"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
            <div className="text-sm text-gray-400">
              Showing {(currentPage - 1) * perPage + 1} to{" "}
              {Math.min(currentPage * perPage, totalReports)} of {totalReports}{" "}
              results
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="cursor-pointer px-3 py-2 text-sm border border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 text-gray-300 transition-colors"
              >
                Previous
              </button>
              {getPaginationNumbers().map((page, index) =>
                page === "..." ? (
                  <span key={index} className="px-3 py-2 text-sm text-gray-500">
                    ...
                  </span>
                ) : (
                  <button
                    key={index}
                    onClick={() => handlePageChange(page as number)}
                    className={`px-3 py-2 text-sm border rounded-md transition-colors cursor-pointer ${
                      currentPage === page
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-gray-600 text-gray-300 hover:bg-gray-700"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="cursor-pointer px-3 py-2 text-sm border border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 text-gray-300 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </>
    );
  };

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      const token = Cookies.get("token");
      if (!token) throw new Error("Unauthorized");

      const params = new URLSearchParams();
      if (searchTerm.trim()) params.append("search", searchTerm);
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL_API}/api/report-all?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.message || "Failed to fetch data for printing"
        );
      }

      const json = await res.json();
      const allReports: FullReport[] = Array.isArray(json.data)
        ? json.data
        : Array.isArray(json.data.data)
        ? json.data.data
        : [];

      if (allReports.length === 0) {
        Swal.fire(
          "No Data",
          "No data matches the selected filters to print.",
          "info"
        );
        return;
      }

      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Print Reports</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; line-height: 1.5; color: #333; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
                th, td { padding: 0.75rem; text-align: left; border: 1px solid #dee2e6; }
                thead th { background-color: #f8f9fa; border-bottom-width: 2px; }
                h1 { text-align: center; margin-bottom: 20px; }
                .print-header { display: none; }
                @media print {
                  .no-print { display: none; }
                  h1 { display: block; }
                }
              </style>
            </head>
            <body>
              <h1>Report Data</h1>
              <table>
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Report Number</th>
                    <th>Health Facility</th>
                    <th>Employee</th>
                    <th>Status</th>
                    <th>Date Completed</th>
                  </tr>
                </thead>
                <tbody>
                  ${allReports
                    .map(
                      (report, index) => `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${report.report_number}</td>
                      <td>${report.health_facility?.name ?? "-"}</td>
                      <td>${report.employee?.name ?? "-"}</td>
                      <td>${report.is_status}</td>
                      <td>${
                        report.completed_at
                          ? format(
                              new Date(report.completed_at),
                              "dd-MM-yyyy HH:mm"
                            )
                          : "-"
                      }</td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>
              <script>
                window.onload = function() {
                  window.print();
                  window.onafterprint = function() {
                    window.close();
                  }
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    } catch (err: unknown) {
      Swal.fire({
        title: "Print Failed",
        text:
          err instanceof Error ? err.message : "An unexpected error occurred.",
        icon: "error",
      });
    } finally {
      setIsPrinting(false);
    }
  };

  const handleExport = async (format: "xlsx" | "csv" | "json") => {
    setIsExporting(true);

    try {
      const token = Cookies.get("token");
      if (!token) throw new Error("Unauthorized");

      const params = new URLSearchParams();
      if (searchTerm.trim()) params.append("search", searchTerm);
      if (filterUser) params.append("user_id", filterUser);
      if (filterStartDate) params.append("start_date", filterStartDate);
      if (filterEndDate) params.append("end_date", filterEndDate);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL_API}/api/report-all?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to fetch data for export");
      }

      const json = await res.json();
      const allReports: FullReport[] = Array.isArray(json.data)
        ? json.data
        : Array.isArray(json.data.data)
        ? json.data.data
        : [];

      if (allReports.length === 0) {
        Swal.fire(
          "No Data",
          "Tidak ada data yang cocok dengan filter untuk diekspor.",
          "info"
        );
        return;
      }

      const fileName = `Reports_${new Date().toISOString().split("T")[0]}`;
      const flatData = flattenDataForExport(allReports);

      if (format === "xlsx") exportToXLSX(flatData, fileName);
      if (format === "csv") exportToCSV(flatData, fileName);
      if (format === "json") downloadJson(allReports, fileName);

      setIsExportModalOpen(false);
    } catch (err: unknown) {
      Swal.fire({
        title: "Export Failed",
        text:
          err instanceof Error ? err.message : "An unexpected error occurred.",
        icon: "error",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportToXLSX = (data: FlatReportData[], fileName: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reports");
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  };

  const exportToCSV = (data: FlatReportData[], fileName: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csvString = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${fileName}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadJson = (data: FullReport[], fileName: string) => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${fileName}.json`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const flattenDataForExport = (reports: FullReport[]): FlatReportData[] => {
    // Inisialisasi array dengan tipe yang benar.
    const flatData: FlatReportData[] = [];

    reports.forEach((report) => {
      if (report.report_work_item && report.report_work_item.length > 0) {
        report.report_work_item.forEach((item) => {
          // Find the corresponding medical device for this work item
          const device = report.health_facility.medical_devices.find(
            (d) => d.id === item.medical_device_id
          );

          // Objek yang di-push harus sesuai dengan interface FlatReportData.
          // Gunakan operator '??' atau '||' untuk memberikan nilai default jika data null/undefined.
          flatData.push({
            "Report Number": report.report_number,
            Status: report.is_status,
            "Date Completed": report.completed_at ?? "-",
            "Total Time": report.total_time ?? "-",
            "Employee Name": report.employee?.name ?? "-",
            "Employee Number": report.employee?.employee_number ?? "-",
            "Health Facility": report.health_facility?.name ?? "-",
            "Facility Type": report.health_facility?.type?.name ?? "-",
            City: report.health_facility?.city ?? "-",
            "Facility Address": report.health_facility?.address ?? "-",
            "Job Order": item.job_order ?? "-",
            "Type of Work":
              item.report_work_item_type
                .map((t) => t.type_of_work.name)
                .join(", ") || "-",
            Problem: item.problem ?? "-",
            "Error Code": item.error_code ?? "-",
            "Job Action": item.job_action ?? "-",
            "Work Item Note": item.note ?? "-",
            "Device Brand": device?.brand ?? "-",
            "Device Model": device?.model ?? "-",
            "Device Serial Number": device?.serial_number ?? "-",
            "Device Category": device?.medical_device_category?.name ?? "-",
            "Customer Name": report.customer_name ?? "-",
            "Customer Phone": report.customer_phone ?? "-",
            "Report Note": report.note ?? "-",
            Suggestion: report.suggestion ?? "-",
            "Location Address": report.location?.address ?? "-",
            Latitude: report.location?.latitude ?? "-",
            Longitude: report.location?.longitude ?? "-",
          });
        });
      } else {
        // Jika tidak ada work item, buat baris kosong yang sesuai dengan struktur
        // untuk menjaga konsistensi kolom di file Excel/CSV.
        flatData.push({
          "Report Number": report.report_number,
          Status: "No work items found",
          "Date Completed": report.completed_at ?? "-",
          "Total Time": report.total_time ?? "-",
          "Employee Name": report.employee?.name ?? "-",
          "Employee Number": report.employee?.employee_number ?? "-",
          "Health Facility": report.health_facility?.name ?? "-",
          "Facility Type": report.health_facility?.type?.name ?? "-",
          City: report.health_facility?.city ?? "-",
          "Facility Address": report.health_facility?.address ?? "-",
          "Job Order": "-",
          "Type of Work": "-",
          Problem: "-",
          "Error Code": "-",
          "Job Action": "-",
          "Work Item Note": "-",
          "Device Brand": "-",
          "Device Model": "-",
          "Device Serial Number": "-",
          "Device Category": "-",
          "Customer Name": report.customer_name ?? "-",
          "Customer Phone": report.customer_phone ?? "-",
          "Report Note": report.note ?? "-",
          Suggestion: report.suggestion ?? "-",
          "Location Address": report.location?.address ?? "-",
          Latitude: report.location?.latitude ?? "-",
          Longitude: report.location?.longitude ?? "-",
        });
      }
    });

    return flatData;
  };

  const handleCloseAndClearFilters = () => {
    // 1. Reset all filter states to their initial values
    setFilterUser("");
    setSearchQuery("");
    setActiveDateFilter(null); // Or whatever your initial state is, e.g., "today"
    setFilterStartDate(""); // Reset start date
    setFilterEndDate(""); // Reset end date

    // 2. Close the modal
    setIsExportModalOpen(false);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-white">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="w-6 h-6" /> Reports Management
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              Manage all job reports from technicians.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* {hasPermission("create-report") && (
              <Link
                href="/dashboard/reports/create"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Report
              </Link>
            )} */}
            {hasPermission("export-excel") && (
              <>
                <button
                  onClick={handlePrint}
                  disabled={isPrinting}
                  className="inline-flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-wait"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  {isPrinting ? "Printing..." : "Print"}
                </button>
                <button
                  onClick={() => setIsExportModalOpen(true)}
                  className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </button>
              </>
            )}
          </div>
        </div>

        {/* <div className="bg-gray-900 p-4 rounded-lg">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by report number, facility, employee, or problem..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-800 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none bg-gray-800 text-white"
            />
            {searchTerm && (
              <X
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 cursor-pointer hover:text-white"
                onClick={() => setSearchTerm("")}
              />
            )}
          </div>
        </div> */}
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {/* Search Input (dibuat lebih lebar) */}
            <div className="md:col-span-2">
              <label
                htmlFor="search"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Find Report by Report Number or Employee Name
              </label>
              <input
                type="text"
                id="search"
                placeholder="Report Number or Employee Name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-3 pr-10 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 outline-none bg-gray-900 text-white"
              />
            </div>
            {/* Start Date */}
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
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 border border-gray-600 rounded-lg bg-gray-900 text-white cursor-pointer"
              />
            </div>
            {/* End Date */}
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
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2 border border-gray-600 rounded-lg bg-gray-900 text-white cursor-pointer"
              />
            </div>
            {/* Filter and Reset Buttons */}
            <div className="md:col-span-3 flex items-end gap-2">
              <button
                onClick={handleFilter}
                className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </button>

              {/* --- TOMBOL BARU: Filter Hari Ini --- */}
              <button
                onClick={handleFilterToday}
                className="w-full inline-flex items-center justify-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors cursor-pointer"
              >
                <CalendarDays className="w-4 h-4 mr-2" />
                Today
              </button>

              <button
                onClick={handleReset}
                className="w-full inline-flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors cursor-pointer"
              >
                <RotateCw className="w-4 h-4 mr-2" />
                Reset
              </button>
            </div>
          </div>
        </div>

        {renderContent()}
      </div>
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-gray-900 rounded-lg p-8 w-full max-w-2xl space-y-6 text-white border border-gray-700">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Export Reports</h2>
              {/* --- MODIFIED BUTTON --- */}
              <button
                onClick={handleCloseAndClearFilters} // Use the new handler function here
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6 cursor-pointer" />
              </button>
            </div>

            {/* Filter by User */}
            <div>
              <label
                htmlFor="userFilter"
                className="block text-sm font-medium text-gray-300 mb-5"
              >
                Filter By Employee
              </label>
              <Popover.Root open={open} onOpenChange={setOpen}>
                <Popover.Trigger asChild>
                  <button
                    type="button"
                    role="combobox"
                    aria-expanded={open}
                    aria-controls="employee-listbox"
                    className="w-full flex items-center justify-between rounded-lg border ..."
                  >
                    <span className="truncate">
                      {filterUser
                        ? employees.find(
                            (emp) => emp.id.toString() === filterUser
                          )?.name
                        : "All Employees..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </button>
                </Popover.Trigger>

                <Popover.Portal>
                  <Popover.Content
                    id="employee-listbox"
                    sideOffset={5}
                    align="start"
                    className="w-[607px] items-center rounded-md border border-gray-700 bg-gray-800 p-1 text-white shadow-md z-50"
                    onCloseAutoFocus={(e) => e.preventDefault()}
                  >
                    {/* --- KOTAK PENCARIAN BARU --- */}
                    <div className="p-2">
                      <input
                        type="text"
                        placeholder="Search employee..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-gray-500"
                      />
                    </div>

                    {/* --- DAFTAR KARYAWAN YANG SUDAH DIFILTER --- */}
                    <div className="max-h-[200px] overflow-y-auto p-1">
                      {/* Opsi "All Employees" tetap di atas */}
                      <button
                        onClick={() => {
                          setFilterUser("");
                          setOpen(false); // Tutup popover setelah memilih
                        }}
                        className="w-full text-left flex items-center rounded-sm px-2 py-1.5 text-sm hover:bg-gray-700"
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            filterUser === "" ? "opacity-100" : "opacity-0"
                          }`}
                        />
                        All Employees
                      </button>

                      {/* Gunakan 'filteredEmployees' untuk me-render daftar */}
                      {filteredEmployees.length > 0 ? (
                        filteredEmployees.map((emp) => (
                          <button
                            key={emp.id}
                            onClick={() => {
                              setFilterUser(emp.id.toString());
                              setOpen(false); // Tutup popover setelah memilih
                            }}
                            className="w-full text-left flex items-center rounded-sm px-2 py-1.5 text-sm hover:bg-gray-700"
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                filterUser === emp.id.toString()
                                  ? "opacity-100"
                                  : "opacity-0"
                              }`}
                            />
                            <span>
                              {emp.name} ({emp.employee_number})
                            </span>
                          </button>
                        ))
                      ) : (
                        <p className="p-2 text-center text-sm text-gray-400">
                          No employee found.
                        </p>
                      )}
                    </div>
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>
            </div>

            {/* Filter by Date */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Filter By Date
              </label>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => {
                    setDateFilter("today");
                    setActiveDateFilter("today");
                  }}
                  className={`flex-1 px-3 py-1.5 rounded-md text-sm cursor-pointer flex items-center justify-center transition-colors ${
                    activeDateFilter === "today"
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-gray-700 hover:bg-gray-600"
                  }`}
                >
                  <CalendarDays className="w-4 h-4 mr-2" />
                  Hari Ini
                </button>
                <button
                  onClick={() => {
                    setDateFilter("week");
                    setActiveDateFilter("week");
                  }}
                  className={`flex-1 px-3 py-1.5 rounded-md text-sm cursor-pointer flex items-center justify-center transition-colors ${
                    activeDateFilter === "week"
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-gray-700 hover:bg-gray-600"
                  }`}
                >
                  <CalendarRange className="w-4 h-4 mr-2" />
                  This Week
                </button>
                <button
                  onClick={() => {
                    setDateFilter("month");
                    setActiveDateFilter("month");
                  }}
                  className={`flex-1 px-3 py-1.5 rounded-md text-sm cursor-pointer flex items-center justify-center transition-colors ${
                    activeDateFilter === "month"
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-gray-700 hover:bg-gray-600"
                  }`}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  This Month
                </button>
                <button
                  onClick={() => {
                    setDateFilter("year");
                    setActiveDateFilter("year");
                  }}
                  className={`flex-1 px-3 py-1.5 rounded-md text-sm cursor-pointer flex items-center justify-center transition-colors ${
                    activeDateFilter === "year"
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-gray-700 hover:bg-gray-600"
                  }`}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  This Year
                </button>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-full">
                  <label htmlFor="startDate" className="text-xs text-gray-400">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="w-full mt-1 p-2 border border-gray-700 rounded-lg bg-gray-800 text-white cursor-pointer"
                  />
                </div>
                <div className="w-full">
                  <label htmlFor="endDate" className="text-xs text-gray-400">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="w-full mt-1 p-2 border border-gray-700 rounded-lg bg-gray-800 text-white cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="border-t border-gray-700 pt-6 space-y-3">
              <h3 className="text-sm font-medium text-gray-300 mb-2">
                Choose Export Format:
              </h3>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => handleExport("xlsx")}
                  disabled={isExporting}
                  className="w-full inline-flex items-center justify-center px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-wait cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  {isExporting ? "Exporting..." : "Export to Excel (.xlsx)"}
                </button>
                <button
                  onClick={() => handleExport("csv")}
                  disabled={isExporting}
                  className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-wait cursor-pointer"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {isExporting ? "Exporting..." : "Export to CSV (.csv)"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
