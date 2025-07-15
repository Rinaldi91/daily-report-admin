// page.tsx

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
  Filter,
  RotateCw,
  CalendarDays,
  CalendarRange,
} from "lucide-react";
import Image from "next/image";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";

// Interface definitions remain the same
interface Division {
  name: string;
}
interface Position {
  name: string;
}
interface Report {
  id: number;
  report_number: string;
  customer_name: string;
  completed_at: string;
  is_status: string;
  health_facility_id: number;
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
  photo_url: string;
  division: Division;
  position: Position;
  reports: Report[];
  reports_pagination: ReportPagination;
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

const renderReportsChart = (reports: Report[]) => {
  if (!reports || reports.length === 0) {
    // Jangan render chart jika tidak ada data
    return null;
  }

  const pieChartData = Object.values(
    reports.reduce((acc, report) => {
      // Mengelompokkan berdasarkan tanggal penyelesaian
      const date = new Date(report.completed_at).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      acc[date] = acc[date] || { name: date, value: 0 };
      acc[date].value++;
      return acc;
    }, {} as { [key: string]: { name: string; value: number } })
  );

  return (
    <section className="bg-gray-950 p-6 rounded-2xl border border-gray-800 shadow-xl w-full mx-auto">
      <header className="mb-6 border-b border-gray-800 pb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
          {/* Judul dikembalikan ke versi semula */}
          Report Overview
        </h2>
        <p className="text-sm text-gray-500">
          Updated{" "}
          {new Date().toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </p>
      </header>

      <div className="flex flex-col md:flex-row gap-10 items-center">
        <div className="flex-1">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieChartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={110}
                innerRadius={70}
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
              >
                {pieChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "none",
                  borderRadius: "8px",
                  color: "white",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-4 w-full">
          <h3 className="text-lg font-medium text-gray-200">Summary</h3>
          {/* Summary diubah untuk menampilkan tanggal */}
          {pieChartData.map((entry, index) => (
            <div
              key={index}
              className="flex items-center justify-between text-sm text-gray-300"
            >
              <span className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                ></span>
                {entry.name}
              </span>
              <span className="font-semibold text-white">{entry.value}</span>
            </div>
          ))}
          <hr className="border-gray-800 my-4" />
          <div className="flex items-center justify-between text-lg font-medium text-white">
            <span>Total Reports</span>
            <span className="font-semibold">{reports.length}</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const [employeeInfo, setEmployeeInfo] = useState<EmployeeDetail | null>(null);
  const [fullReports, setFullReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for pagination and filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [reportPagination, setReportPagination] =
    useState<ReportPagination | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [activeDateFilter, setActiveDateFilter] = useState<string | null>(null);

  const fetchData = useCallback(
    async (page: number, sDate: string, eDate: string) => {
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

        const resPaginated = await fetch(
          `http://report-api.test/api/employee/${id}?${paginatedParams.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );
        const dataPaginated = await resPaginated.json();
        if (!dataPaginated.status) throw new Error(dataPaginated.message);
        setEmployeeInfo(dataPaginated.data);
        setReportPagination(dataPaginated.data.reports_pagination);
        setCurrentPage(dataPaginated.data.reports_pagination.meta.current_page);

        // Fetch all reports for the chart with the same filters
        const allParams = new URLSearchParams();
        allParams.append("all", "true");
        if (sDate) allParams.append("start_date", sDate);
        if (eDate) allParams.append("end_date", eDate);
        const resAll = await fetch(
          `http://report-api.test/api/employee/${id}?${allParams.toString()}`,
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

  useEffect(() => {
    fetchData(currentPage, startDate, endDate);
  }, [id, currentPage, startDate, endDate, fetchData]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= (reportPagination?.meta.last_page || 1)) {
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
    setCurrentPage(1); // Reset page to 1 when filter changes
  };

  const handleReset = () => {
    setStartDate("");
    setEndDate("");
    setActiveDateFilter(null);
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
        <div className="bg-gray-950 p-6 rounded-xl border border-gray-800 shadow-xl text-center">
          <Image
            src={
              employeeInfo.photo_url ||
              `http://report-api.test/storage/images/logos/LogoArbi.png`
            }
            alt={employeeInfo.name}
            width={128}
            height={128}
            className="rounded-full mx-auto mb-4 mt-8 object-cover"
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

        <div className="lg:col-span-2 bg-gray-950 p-6 rounded-xl border border-gray-800 shadow-xl">
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
        {/* Chart */}
        {fullReports.length > 0 && renderReportsChart(fullReports)}

        {/* Filter Controls */}
        <div className="p-4 bg-gray-950 rounded-lg border border-gray-800 space-y-4">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        </div>

        {/* Report List and Pagination */}
        <div className="bg-gray-950 p-6 rounded-xl border border-gray-800 shadow-xl w-full mx-auto">
          <h2 className="text-xl font-bold text-white mb-4">
            Report List ({reports_pagination?.meta.total || 0})
          </h2>
          {loading && (
            <div className="text-center py-4">Loading reports...</div>
          )}
          {!loading && reports && reports.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-300">
                  <thead className="text-xs uppercase bg-gray-800 text-gray-400">
                    <tr>
                      <th className="px-4 py-3">No</th>
                      <th className="px-4 py-3">Report Number</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report, index) => (
                      <tr
                        key={report.id}
                        className="border-b border-gray-700 hover:bg-gray-800"
                      >
                        <td className="px-4 py-3">
                          {(reports_pagination.meta.current_page - 1) *
                            reports_pagination.meta.per_page +
                            index +
                            1}
                        </td>
                        <td className="px-4 py-3">{report.report_number}</td>
                        <td className="px-4 py-3">{report.customer_name}</td>
                        <td className="px-4 py-3">
                          {new Date(report.completed_at).toLocaleDateString(
                            "id-ID"
                          )}
                        </td>
                        <td className="px-4 py-3">{report.is_status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
