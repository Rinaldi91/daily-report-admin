"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Cookies from "js-cookie";
import Link from "next/link";
import {
  Edit,
  Trash2,
  FileText,
  Plus,
  Search,
  X,
  Eye,
  CheckCircle,
  Clock,
  Hourglass, // Added for 'Pending' status
} from "lucide-react";
import Swal from "sweetalert2";

// --- Interface Definition updated for enum status ---
interface Employee {
  id: number;
  name: string;
  employee_number: string;
}

interface HealthFacility {
  id: number;
  name: string;
}

// The 'status' field now uses a string enum instead of a number.
interface Report {
  id: number;
  report_number: string;
  problem: string;
  is_status: "Progress" | "Pending" | "Completed"; // Changed from is_status
  completed_at: string | null;
  created_at: string;
  employee: Employee;
  health_facility: HealthFacility;
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

  // Check user permissions (with super-admin check)
  const hasPermission = (slug: string) => {
    if (userRole.toLowerCase() === "super-admin") {
      return true;
    }
    return userPermissions.includes(slug);
  };

  const fetchReports = useCallback(
    async (page: number = 1, search: string = "") => {
      setLoading(true);
      setError(null);
      try {
        const token = Cookies.get("token");
        if (!token) throw new Error("Unauthorized");

        const params = new URLSearchParams();
        params.append("page", page.toString());
        if (search.trim()) params.append("search", search);

        // Assuming the API endpoint remains the same
        const res = await fetch(`http://report-api.test/api/report?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || "Failed to fetch reports");
        }
        
        const json = await res.json();
        
        // The API is now expected to return a 'status' string.
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
    []
  );

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
        title: "Are you sure?",
        text: "You will not be able to recover this report!",
        icon: "warning",
        showCancelButton: true,
        background: "#1e293b",
        color: "#f8fafc",
        confirmButtonText: "Yes, delete it!",
        confirmButtonColor: "#dc2626"
    });

    if (result.isConfirmed) {
        try {
            const token = Cookies.get("token");
            if (!token) throw new Error("Token not found");

            const res = await fetch(`http://report-api.test/api/report/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });

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
                fetchReports(currentPage, searchTerm);
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
      
      await fetchReports(1);
    };
    initializeData();
  }, [fetchReports]);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
        fetchReports(1, searchTerm);
    }, 400);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchTerm, fetchReports]);
  
  const handlePageChange = useCallback((page: number) => {
      if (page >= 1 && page <= totalPages) {
          fetchReports(page, searchTerm);
      }
  }, [searchTerm, totalPages, fetchReports]);

  const getPaginationNumbers = () => {
    const delta = 2;
    const range = [];
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Report Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Health Facility</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {reports.map((report, index) => (
                  <tr key={report.id} className="hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{(currentPage - 1) * perPage + index + 1}</td>
                    <td className="px-6 py-4">
                      <code className="px-2 py-1 bg-gray-700 rounded text-xs text-white">{report.report_number}</code>
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm">{report.health_facility?.name || "-"}</td>
                    <td className="px-6 py-4 text-gray-300 text-sm">
                      <div>
                        <div className="font-medium text-white">{report.employee?.name || "-"}</div>
                        <div className="text-gray-400">{report.employee?.employee_number || "-"}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderStatusBadge(report.is_status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {hasPermission("show-report") && (
                          <Link href={`/dashboard/reports/${report.id}`} className="text-blue-400 hover:text-blue-300 p-1 cursor-pointer"><Eye className="w-4 h-4" /></Link>
                        )}
                        {/* Show edit button if status is not 'Completed' */}
                        {hasPermission("update-report") && report.is_status !== 'Completed' && (
                          <Link href={`/dashboard/reports/${report.id}/edit`} className="text-green-400 hover:text-green-300 p-1 cursor-pointer"><Edit className="w-4 h-4" /></Link>
                        )}
                        {hasPermission("delete-report") && (
                          <button onClick={() => handleDelete(report.id)} className="text-red-400 hover:text-red-300 p-1 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
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
                  Showing {(currentPage - 1) * perPage + 1} to {Math.min(currentPage * perPage, totalReports)} of {totalReports} results
              </div>
              <div className="flex items-center space-x-1">
                  <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="cursor-pointer px-3 py-2 text-sm border border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 text-gray-300 transition-colors">Previous</button>
                  {getPaginationNumbers().map((page, index) =>
                      page === "..." ? (
                          <span key={index} className="px-3 py-2 text-sm text-gray-500">...</span>
                      ) : (
                          <button key={index} onClick={() => handlePageChange(page as number)} className={`px-3 py-2 text-sm border rounded-md transition-colors cursor-pointer ${currentPage === page ? "bg-blue-600 text-white border-blue-600" : "border-gray-600 text-gray-300 hover:bg-gray-700"}`}>{page}</button>
                      )
                  )}
                  <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="cursor-pointer px-3 py-2 text-sm border border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 text-gray-300 transition-colors">Next</button>
              </div>
          </div>
        )}
      </>
    );
  };

  return (
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
          {hasPermission("create-report") && (
            <Link href="/dashboard/reports/create" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
              <Plus className="w-4 h-4 mr-2" /> Add Report
            </Link>
          )}
        </div>
      </div>

      <div className="bg-gray-900 p-4 rounded-lg">
          <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                  type="text"
                  placeholder="Search by report number, facility, employee, or problem..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border border-gray-800 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none bg-gray-800 text-white"
              />
              {searchTerm && <X className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 cursor-pointer hover:text-white" onClick={() => setSearchTerm("")} />}
          </div>
      </div>

      {renderContent()}

    </div>
  );
}
