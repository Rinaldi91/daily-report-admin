"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import {
  ArrowLeft,
  Building,
  FileText,
  User,
  MonitorSmartphone,
  Hash,
  Settings2,
  Clock,
  Tag,
  Camera,
  Wrench,
  Thermometer,
  Building2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import ErrorCodeChart from "@/components/ErrorCodeChart";
import MultiSelectPopover from "@/components/ui/MultiSelectPopover";
// import Image from "next/image";

// --- INTERFACES UPDATED ---

interface MedicalDeviceCategory {
  name: string;
}

interface MedicalDevice {
  id: number;
  brand: string;
  model: string;
  serial_number: string;
  status: string;
  medical_device_category: MedicalDeviceCategory;
  report: Report;
}

interface ReportImage {
  image: string;
}

interface TypeOfWork {
  name: string;
}

interface ReportWorkItemType {
  type_of_work: TypeOfWork;
}

interface Report {
  report_number: string;
  is_status: string;
  completed_at: string;
  note: string;
  suggestion: string;
  employee: {
    name: string;
  };
  health_facility: {
    name: string;
  };
  report_image: ReportImage[];
}

// Interface baru untuk setiap item dalam array 'parameter'
interface Parameter {
  id: number;
  name: string;
  uraian: string;
  description: string | null;
}

// Interface utama untuk setiap item dalam riwayat (diperbarui)
interface DeviceHistoryRecord {
  id: number;
  job_order: string;
  problem: string;
  error_code: string | null;
  job_action: string;
  total_time: string;
  note: string;
  medical_device: MedicalDevice;
  report: Report;
  report_work_item_type: ReportWorkItemType[];
  parameter: Parameter[]; // Menggunakan interface Parameter
  part_used_for_repair: string[]; // Ganti 'any' jika struktur data diketahui
  pagination: {
    total_service_count: number;
  };
}

// --- KOMPONEN UTAMA ---
export default function LisDetailPage() {
  const [pagination, setPagination] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const router = useRouter();
  const { id } = useParams();

  // Hanya butuh satu state untuk menyimpan semua data riwayat
  const [history, setHistory] = useState<DeviceHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [visibleCards, setVisibleCards] = useState<Set<number>>(
    new Set<number>()
  );

  const [selectedEmployees, setSelectedEmployees] = useState<
    { label: string; value: string }[]
  >([]);

  const employeeOptions = Array.from(
    new Set(history.map((rec) => rec.report.employee?.name).filter(Boolean))
  ).map((name) => ({
    label: name!,
    value: name!,
  }));

  const filteredHistory = history.filter((rec) =>
    selectedEmployees.length > 0
      ? selectedEmployees.some(
          (s) =>
            s.value.toLowerCase() === rec.report.employee?.name?.toLowerCase()
        )
      : true
  );

  const filteredCount = filteredHistory.length;

  interface ToggleCardFn {
    (cardId: number): void;
  }

  const toggleCard: ToggleCardFn = (cardId) => {
    const newVisibleCards = new Set<number>(visibleCards);
    if (newVisibleCards.has(cardId)) {
      newVisibleCards.delete(cardId);
    } else {
      newVisibleCards.add(cardId);
    }
    setVisibleCards(newVisibleCards);
  };

  useEffect(() => {
    if (!id) return;

    const fetchDeviceDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = Cookies.get("token");
        if (!token) throw new Error("Unauthorized");

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL_API}/api/medical-device/${id}?page=${currentPage}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || "Failed to fetch device details.");
        }

        const json = await res.json();

        if (json.status && Array.isArray(json.data)) {
          setHistory(json.data);
          setPagination(json.pagination); // simpan data pagination
        } else {
          throw new Error(json.message || "Invalid data structure from API.");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDeviceDetails();
  }, [id, currentPage]);

  // Ambil data riwayat pertama secara keseluruhan
  const firstRecord = history.length > 0 ? history[0] : null;

  // Ambil info perangkat dan info laporan dari data pertama tersebut
  const mainDevice = firstRecord ? firstRecord.medical_device : null;
  const mainReport = firstRecord ? firstRecord.report : null;

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "-";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-600";
      case "pending":
        return "bg-yellow-600";
      default:
        return "bg-gray-600";
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
        <p className="mt-4 text-gray-400">Loading Lis Details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <h2 className="text-2xl font-bold text-red-500">Failed to Load Data</h2>
        <p className="text-red-400 mt-2">{error}</p>
        <button
          onClick={() => router.back()}
          className="mt-6 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen text-white p-4 sm:p-6 lg:p-8 rounded-2xl">
      <div className="max-w-9xl mx-auto">
        {/* Header Halaman */}
        <div className="mb-10">
          {/* Back Button */}
          <button
            onClick={() => router.push("/dashboard/laboratorium-information-system")}
            className="group inline-flex items-center gap-3 text-gray-400 hover:text-white mb-6 transition-all duration-300 hover:gap-4 cursor-pointer"
          >
            <div className="p-2 rounded-lg bg-gray-800/50 border border-gray-700/50 group-hover:border-blue-500/50 group-hover:bg-blue-500/10 transition-all duration-300">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="font-medium">Back</span>
          </button>

          {/* Device Information Card */}
          {mainDevice && (
            <>
              <div className="relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden shadow-2xl">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-500/5 to-transparent rounded-full -translate-y-32 translate-x-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-500/5 to-transparent rounded-full translate-y-24 -translate-x-24"></div>

                {/* Main Content */}
                <div className="relative p-8">
                  {/* Header Section */}
                  <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6 mb-8">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl border border-blue-500/30">
                          <MonitorSmartphone className="w-8 h-8 text-blue-400" />
                        </div>
                        <div>
                          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                            {mainDevice.brand} {mainDevice.model}
                          </h1>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            <p className="text-gray-400 font-medium">
                              Service and maintenance history for the selected
                              device
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <span className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-sm font-semibold shadow-lg hover:shadow-blue-500/25 transition-shadow">
                        {mainDevice.medical_device_category?.name ||
                          "Uncategorized"}
                      </span>
                    </div>
                  </div>

                  {/* Device Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {/* Client Information */}
                    <div className="group p-5 rounded-xl bg-gradient-to-br from-gray-700/30 to-gray-800/30 border border-gray-600/30 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/30 group-hover:bg-blue-500/30 transition-colors">
                          <Building2 className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                            Client
                          </p>
                          <p className="text-sm text-gray-500">
                            Health Facility
                          </p>
                        </div>
                      </div>
                      {mainReport?.health_facility?.name ? (
                        <button
                          onClick={() => {
                            const facilityName =
                              mainReport.health_facility.name;
                            // Konversi nama fasilitas ke format URL slug
                            const facilitySlug = facilityName
                              .toLowerCase()
                              .replace(/\s+/g, "-")
                              .replace(/[^a-z0-9-]/g, "");

                            router.push(
                              `/dashboard/health-facilities/${facilitySlug}`
                            );
                          }}
                          className="font-semibold text-white text-lg leading-tight hover:text-blue-400 transition-colors cursor-pointer text-left w-full group/button"
                        >
                          <span className="group-hover/button:underline">
                            {mainReport.health_facility.name}
                          </span>
                          <svg
                            className="inline-block w-4 h-4 ml-2 opacity-0 group-hover/button:opacity-100 transition-opacity"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </button>
                      ) : (
                        <p className="font-semibold text-white text-lg leading-tight">
                          Not Assigned
                        </p>
                      )}
                    </div>
                    {/* <div className="group p-5 rounded-xl bg-gradient-to-br from-gray-700/30 to-gray-800/30 border border-gray-600/30 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/30 group-hover:bg-blue-500/30 transition-colors">
                        <Building2 className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                          Client
                        </p>
                        <p className="text-sm text-gray-500">Health Facility</p>
                      </div>
                    </div>
                    <p className="font-semibold text-white text-lg leading-tight">
                      {mainReport?.health_facility?.name || "Not Assigned"}
                    </p>
                  </div> */}
                    {/* Serial Number */}
                    <div className="group p-5 rounded-xl bg-gradient-to-br from-gray-700/30 to-gray-800/30 border border-gray-600/30 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30 group-hover:bg-purple-500/30 transition-colors">
                          <Hash className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                            Serial Number
                          </p>
                          <p className="text-sm text-gray-500">
                            Device Identifier
                          </p>
                        </div>
                      </div>
                      <p className="font-mono font-semibold text-white text-lg tracking-wider">
                        {mainDevice.serial_number || "N/A"}
                      </p>
                    </div>
                    {/* Device Status */}
                    <div className="group p-5 rounded-xl bg-gradient-to-br from-gray-700/30 to-gray-800/30 border border-gray-600/30 hover:border-green-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-green-500/20 border border-green-500/30 group-hover:bg-green-500/30 transition-colors">
                          <Tag className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-green-400 uppercase tracking-wider">
                            Status
                          </p>
                          <p className="text-sm text-gray-500">Current State</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            mainDevice.status === "Baik"
                              ? "bg-green-400 shadow-lg shadow-green-400/50"
                              : mainDevice.status === "Maintenance"
                              ? "bg-yellow-400 shadow-lg shadow-yellow-400/50"
                              : "bg-red-400 shadow-lg shadow-red-400/50 text-red-500"
                          }`}
                        ></div>
                        <p className="font-semibold text-white text-lg">
                          {mainDevice.status}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats Bar */}
                  <div className="mt-8 p-4 rounded-xl bg-gradient-to-r from-gray-700/20 to-gray-800/20 border border-gray-600/30">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                        <span className="text-gray-400 font-medium">
                          Device Overview
                        </span>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          <span className="text-gray-300">
                            Tracked Since Registration
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-gray-300">
                            Real-time Status
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 mb-3">
                      <ErrorCodeChart
                        medicalDeviceId={mainDevice.id.toString()}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Daftar Riwayat */}
        <div className="space-y-8">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2 flex items-center">
                <Settings2 className="inline w-6 h-6 mr-2 text-purple-400" />
                Service History
              </h2>
              <p className="text-gray-400">
                {history.length} {history.length === 1 ? "record" : "records"}{" "}
                found
              </p>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-purple-900/30 to-purple-800/30 border border-purple-700/50 shadow-md hover:shadow-lg transition-shadow w-[350px]">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-600/20 text-purple-400">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Service Records</p>
                  <p className="text-lg font-bold text-white leading-tight">
                    {filteredCount} / {pagination.total_service_count}
                  </p>
                  {/* <p className="text-xs text-gray-400">(Filtered / All)</p> */}
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end w-full">
            <div className="w-100 ml-auto">
              <MultiSelectPopover
                options={employeeOptions}
                selected={selectedEmployees}
                onChange={(selected) =>
                  setSelectedEmployees(
                    selected.map((option) => ({
                      ...option,
                      value: option.value.toString(),
                    }))
                  )
                }
                placeholder="Filter by Technician"
              />
            </div>
          </div>

          {/* Service Records */}
          <div className="space-y-6">
            {filteredHistory.map((record) => (
              <div key={record.id} className="space-y-4">
                {/* Card Header - Always Visible */}
                <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden shadow-2xl">
                  <div
                    className="relative p-6 bg-gradient-to-r from-gray-700/30 to-gray-800/30 cursor-pointer hover:from-gray-700/40 hover:to-gray-800/40 transition-all duration-300"
                    onClick={() => toggleCard(record.id)}
                  >
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                      <div className="flex items-start gap-4">
                        <div className="bg-blue-500/20 p-3 rounded-xl border border-blue-500/30">
                          <Tag className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white mb-1">
                            {record.report.report_number}
                          </h3>
                          <p className="text-gray-400 font-medium">
                            {record.job_order}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-white font-semibold">
                            {formatDate(record.report.completed_at)}
                          </p>
                          <p className="text-gray-400 text-sm">Completed</p>
                        </div>
                        <span
                          className={`px-4 py-2 text-sm font-semibold rounded-full border ${getStatusBadgeColor(
                            record.report.is_status
                          )}`}
                        >
                          {record.report.is_status}
                        </span>

                        {/* Toggle Button */}
                        <button className="ml-2 p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 transition-colors border border-gray-600/30">
                          {visibleCards.has(record.id) ? (
                            <ChevronUp className="w-5 h-5 text-gray-300" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-300" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Quick Info Bar */}
                    <div className="mt-4 pt-4 border-t border-gray-600/30">
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-300">
                          <User className="w-4 h-4 text-blue-400" />
                          {record.report.employee?.name || "Not assigned"}
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                          <Building className="w-4 h-4 text-purple-400" />
                          {record.report.health_facility?.name ||
                            "Not specified"}
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                          <Clock className="w-4 h-4 text-yellow-400" />
                          {record.total_time || "Not specified"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Content */}
                  {visibleCards.has(record.id) && (
                    <div className="border-t border-gray-700/50 animate-in slide-in-from-top-5 duration-300">
                      <div className="p-6 grid grid-cols-1 xl:grid-cols-3 gap-8">
                        {/* Work Details Column */}
                        <div className="space-y-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                            <h4 className="text-lg font-semibold text-white">
                              Work Details
                            </h4>
                          </div>

                          <div className="space-y-5">
                            <div className="group">
                              <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-700/30 border border-gray-600/30 hover:border-blue-500/30 transition-colors">
                                <div className="bg-red-500/20 p-2 rounded-lg border border-red-500/30">
                                  <FileText className="w-4 h-4 text-red-400" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-3">
                                    <p className="font-semibold text-white">
                                      Problem
                                    </p>
                                    {record.problem && (
                                      <span className="bg-red-600/50 text-red-300 text-xs px-2 py-1 rounded-full">
                                        {record.problem.split(",").length}{" "}
                                        issues
                                      </span>
                                    )}
                                  </div>

                                  {record.problem ? (
                                    <div className="space-y-3">
                                      {record.problem
                                        .split(",")
                                        .map((problem, index) => (
                                          <div
                                            key={index}
                                            className="flex items-start gap-3 group/item hover:bg-red-500/5 p-2 rounded-lg transition-colors border-l-2 border-red-500/30"
                                          >
                                            <div className="bg-gradient-to-r from-red-500 to-red-400 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                              {index + 1}
                                            </div>
                                            <p className="text-gray-300 text-sm leading-relaxed capitalize">
                                              {problem.trim()}
                                            </p>
                                          </div>
                                        ))}
                                    </div>
                                  ) : (
                                    <p className="text-gray-400 text-sm italic">
                                      No problem description
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="group">
                              <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-700/30 border border-gray-600/30 hover:border-green-500/30 transition-colors">
                                <div className="bg-green-500/20 p-2 rounded-lg border border-green-500/30">
                                  <Settings2 className="w-4 h-4 text-green-400" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-3">
                                    <p className="font-semibold text-white">
                                      Job Action
                                    </p>
                                    {record.job_action && (
                                      <span className="bg-green-600/50 text-green-300 text-xs px-2 py-1 rounded-full">
                                        {record.job_action.split(",").length}{" "}
                                        tasks
                                      </span>
                                    )}
                                  </div>

                                  {record.job_action ? (
                                    <div className="space-y-3">
                                      {record.job_action
                                        .split(",")
                                        .map((action, index) => (
                                          <div
                                            key={index}
                                            className="flex items-start gap-3 group/item hover:bg-green-500/5 p-2 rounded-lg transition-colors border-l-2 border-green-500/30"
                                          >
                                            <div className="bg-gradient-to-r from-green-500 to-green-400 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                              {index + 1}
                                            </div>
                                            <p className="text-gray-300 text-sm leading-relaxed capitalize">
                                              {action.trim()}
                                            </p>
                                          </div>
                                        ))}
                                    </div>
                                  ) : (
                                    <p className="text-gray-400 text-sm italic">
                                      No action description
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-700/30 border border-gray-600/30">
                              <div className="bg-yellow-500/20 p-2 rounded-lg border border-yellow-500/30">
                                <Clock className="w-4 h-4 text-yellow-400" />
                              </div>
                              <div>
                                <p className="font-semibold text-white">
                                  Total Time
                                </p>
                                <p className="text-gray-300 text-sm">
                                  {record.total_time || "Not specified"}
                                </p>
                              </div>
                            </div>
                            <div>
                              <p className="font-semibold text-white mb-3">
                                Type Of Work
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {record.report_work_item_type.map(
                                  (item, idx) => (
                                    <span
                                      key={idx}
                                      className="px-3 py-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 text-blue-300 rounded-lg text-xs font-medium hover:from-blue-600/30 hover:to-purple-600/30 transition-colors"
                                    >
                                      {item.type_of_work.name}
                                    </span>
                                  )
                                )}
                                {record.report_work_item_type.length === 0 && (
                                  <span className="text-gray-400 text-sm italic">
                                    No type of work assigned
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Personnel & Location Column */}
                        <div className="space-y-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-1 bg-gradient-to-r from-green-500 to-blue-500 rounded-full"></div>
                            <h4 className="text-lg font-semibold text-white">
                              Personnel & Location
                            </h4>
                          </div>

                          <div className="space-y-5">
                            <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-700/30 border border-gray-600/30">
                              <div className="bg-blue-500/20 p-2 rounded-lg border border-blue-500/30">
                                <User className="w-4 h-4 text-blue-400" />
                              </div>
                              <div>
                                <p className="font-semibold text-white mb-1">
                                  Technician
                                </p>
                                <p className="text-gray-300 text-sm">
                                  {record.report.employee?.name ||
                                    "Not assigned"}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-700/30 border border-gray-600/30">
                              <div className="bg-purple-500/20 p-2 rounded-lg border border-purple-500/30">
                                <Building className="w-4 h-4 text-purple-400" />
                              </div>
                              <div>
                                <p className="font-semibold text-white mb-1">
                                  Health Facility
                                </p>
                                <p className="text-gray-300 text-sm">
                                  {record.report.health_facility?.name ||
                                    "Not specified"}
                                </p>
                              </div>
                            </div>

                            <div className="p-4 rounded-xl bg-gradient-to-br from-gray-700/20 to-gray-800/20 border border-gray-600/30">
                              {/* Notes Section */}
                              {record.note && (
                                <div className="mb-4">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                    <p className="font-semibold text-white">
                                      Notes
                                    </p>
                                  </div>
                                  <p className="text-gray-300 text-sm leading-relaxed mb-3">
                                    {record.note}
                                  </p>
                                </div>
                              )}

                              {/* Suggestions Section */}
                              {record.report?.suggestion && (
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                                    <p className="font-semibold text-white">
                                      Suggestions
                                    </p>
                                  </div>
                                  <p className="text-gray-300 text-sm leading-relaxed">
                                    {record.report.suggestion}
                                  </p>
                                </div>
                              )}

                              {/* Fallback jika tidak ada notes atau suggestions */}
                              {!record.note && !record.report?.suggestion && (
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                  <p className="text-gray-400 text-sm">
                                    No additional notes or suggestions provided.
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Attachments & Parts Column */}
                        <div className="space-y-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                            <h4 className="text-lg font-semibold text-white">
                              Resources & Media
                            </h4>
                          </div>

                          <div className="space-y-5">
                            <div className="p-4 rounded-xl bg-gray-700/30 border border-gray-600/30">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="bg-pink-500/20 p-2 rounded-lg border border-pink-500/30">
                                  <Camera className="w-4 h-4 text-pink-400" />
                                </div>
                                <p className="font-semibold text-white">
                                  Report Images
                                </p>
                              </div>
                              {record.report.report_image &&
                              record.report.report_image.length > 0 ? (
                                <div className="grid grid-cols-2 gap-3">
                                  {record.report.report_image.map(
                                    (img, idx) => (
                                      <div key={idx} className="relative group">
                                        <div className="rounded-lg w-full h-24 bg-gray-600 flex items-center justify-center cursor-pointer border border-gray-600/30 hover:border-blue-500/50 transition-all duration-300 group-hover:scale-105">
                                          <Camera className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                          <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                                            <svg
                                              className="w-4 h-4 text-white"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                              />
                                            </svg>
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  )}
                                </div>
                              ) : (
                                <div className="text-center py-6 bg-gray-800/30 rounded-lg border border-dashed border-gray-600">
                                  <Camera className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                                  <p className="text-gray-400 text-sm">
                                    No images attached
                                  </p>
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                              <div className="p-4 rounded-xl bg-gray-700/30 border border-gray-600/30">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="bg-orange-500/20 p-2 rounded-lg border border-orange-500/30">
                                    <Wrench className="w-4 h-4 text-orange-400" />
                                  </div>
                                  <p className="font-semibold text-white">
                                    Parts Used
                                  </p>
                                </div>
                                <p className="text-gray-300 text-sm">
                                  {record.part_used_for_repair.length > 0
                                    ? `${record.part_used_for_repair.length} parts used`
                                    : "No parts used"}
                                </p>
                              </div>

                              <div className="p-4 rounded-xl bg-gray-700/30 border border-gray-600/30">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="bg-cyan-500/20 p-2 rounded-lg border border-cyan-500/30">
                                    <Thermometer className="w-4 h-4 text-cyan-400" />
                                  </div>
                                  <p className="font-semibold text-white">
                                    Parameters
                                  </p>
                                </div>
                                {record.parameter.length > 0 ? (
                                  <div className="space-y-2">
                                    {record.parameter.map((param) => (
                                      <div
                                        key={param.id}
                                        className="flex justify-between items-center text-sm p-2 bg-gray-900/50 rounded-md hover:bg-gray-800/70"
                                      >
                                        <span className="text-gray-300 capitalize">
                                          {param.name}
                                        </span>
                                        <div className="flex gap-2">
                                          <span className="font-mono text-cyan-300 bg-cyan-500/10 px-2 py-1 rounded text-xs">
                                            {param.uraian}
                                          </span>
                                          <span className="font-mono text-cyan-300 bg-cyan-500/10 px-2 py-1 rounded text-xs">
                                            {param.description}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-gray-400 text-sm italic text-center py-2">
                                    No parameters recorded
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {history.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50">
                <div className="mb-6">
                  <div className="w-20 h-20 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2 text-center">
                    No Service History
                  </h3>
                  <p className="text-gray-400 max-w-md mx-auto text-center">
                    There are no service or maintenance records available for
                    this device yet. Records will appear here once service
                    activities are completed.
                  </p>
                </div>
              </div>
            )}
          </div>
          {/* Pagination Controls */}
          {pagination && pagination.total > 0 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={!pagination.prev_page_url}
                className={`px-4 py-2 rounded-lg border ${
                  pagination.prev_page_url
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-gray-800 text-gray-500 cursor-not-allowed"
                }`}
              >
                Previous
              </button>

              <span className="text-gray-300">
                Page {pagination.current_page} of {pagination.last_page}
              </span>

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(pagination.last_page, p + 1))
                }
                disabled={!pagination.next_page_url}
                className={`px-4 py-2 rounded-lg border ${
                  pagination.next_page_url
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-gray-800 text-gray-500 cursor-not-allowed"
                }`}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
