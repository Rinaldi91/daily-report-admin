"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import Link from "next/link";
import {
  ChevronLeft,
  Hospital,
  MapPin,
  Mail,
  Phone,
  Wrench,
  CircleCheck,
  CircleX,
  Info,
  Calendar,
  MonitorCog,
} from "lucide-react";

// --- Interface Definitions ---
interface TypeOfHealthFacility {
  name: string;
}
interface MedicalDevice {
  id: number;
  brand: string;
  model: string;
  serial_number: string;
  software_version?: string | null;
  status: string;
}
interface ReportWorkItem {
  id: number;
  report_id: number;
  medical_device_id: number;
  problem: string | null;
  error_code: string | null;
  job_action: string | null;
  completion_status_id: number | null;
  completed_at: string | null;
  total_time: string | null;
  note: string | null;
  job_order: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}
interface Report {
  id: number;
  user_id: number;
  employee_id: number;
  health_facility_id: number;
  report_number: string;
  is_status: string;
  customer_name: string | null;
  customer_phone: string | null;
  note: string | null;
  suggestion: string | null;
  attendance_customer: string | null;
  attendance_employee: string | null;
  completed_at: string | null;
  total_time: string | null;
  created_at: string;
  updated_at: string;
  report_work_item: ReportWorkItem[];
  user: {
    id: number;
    name: string;
    email: string;
    role_id: number;
    email_verified_at: string;
    created_at: string;
    updated_at: string;
  };
}
interface HealthFacilityDetail {
  id: number;
  name: string;
  slug: string;
  email: string;
  phone_number: string;
  city: string;
  address: string;
  type: TypeOfHealthFacility;
  medical_devices: MedicalDevice[];
  reports: Report[];
}

export default function HealthFacilityDetailPage() {
  const params = useParams();
  const { slug } = params;
  const [facility, setFacility] = useState<HealthFacilityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (slug) {
      const fetchDetail = async () => {
        setLoading(true);
        setError(null);
        try {
          const token = Cookies.get("token");
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL_API}/api/health-facility/${slug}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
              },
            }
          );
          if (!res.ok) throw new Error("Failed to fetch facility details.");
          const json = await res.json();
          setFacility(json.data);
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "An unexpected error occurred."
          );
        } finally {
          setLoading(false);
        }
      };
      fetchDetail();
    }
  }, [slug]);

  // Function to get last service date for a medical device
  const getLastServiceDate = (deviceId: number): string | null => {
    if (!facility?.reports) return null;

    let latestDate: string | null = null;

    facility.reports.forEach((report) => {
      report.report_work_item.forEach((workItem) => {
        if (workItem.medical_device_id === deviceId) {
          if (
            !latestDate ||
            new Date(workItem.created_at) > new Date(latestDate)
          ) {
            latestDate = workItem.created_at;
          }
        }
      });
    });

    return latestDate;
  };

  // Function to format date to Indonesian format
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const days = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
    ];
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Agu",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];

    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${dayName}, ${day} ${month} ${year}`;
  };

  const StatusIcon = ({ status }: { status: string }) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === "baik" || lowerStatus === "good") {
      // Handle both languages
      return <CircleCheck className="w-5 h-5 text-green-500" />;
    }
    if (lowerStatus === "rusak" || lowerStatus === "broken") {
      // Handle both languages
      return <CircleX className="w-5 h-5 text-red-500" />;
    }
    return <Wrench className="w-5 h-5 text-yellow-500" />;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
        <span className="mt-4 text-gray-400">Loading facility details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-400 bg-red-900/20 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-2">An Error Occurred</h2>
        <p>{error}</p>
        <Link
          href="/dashboard/health-facilities"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to List
        </Link>
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="text-center py-12 text-gray-400">Facility not found.</div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Info className="w-8 h-8 text-blue-400" />
          Health Facility Details
        </h1>
        <Link
          href="/dashboard/health-facilities"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to List
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Kolom Kiri - Info Utama */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gray-900 p-6 rounded-2xl shadow-lg border border-gray-800">
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <Hospital className="w-12 h-12 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white text-center">
              {facility.name}
            </h2>
            <p className="text-center text-blue-400 mt-1">
              {facility.type?.name}
            </p>
            <div className="mt-6 border-t border-gray-700 pt-6 space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-white">{facility.city}</p>
                  <p className="text-gray-400 text-sm">{facility.address}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <p className="text-gray-300 break-all">
                  {facility.email || "-"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <p className="text-gray-300">{facility.phone_number || "-"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan - Detail Perangkat */}
        <div className="lg:col-span-2 space-y-6">
          {/* Medical Devices Section */}
          <div className="bg-gray-900 p-6 rounded-2xl shadow-lg border border-gray-800">
            <h3 className="text-xl font-bold text-white mb-4">
              Registered Medical Devices (
              {facility.medical_devices?.filter(
                (device) =>
                  !["VANSLAB", "VANSLITE"].includes(device.brand?.toUpperCase())
              ).length || 0}
              )
            </h3>
            {facility.medical_devices?.filter(
              (device) =>
                !["VANSLAB", "VANSLITE"].includes(device.brand?.toUpperCase())
            ).length > 0 ? (
              <div className="space-y-4">
                {facility.medical_devices
                  .filter(
                    (device) =>
                      !["VANSLAB", "VANSLITE"].includes(
                        device.brand?.toUpperCase()
                      )
                  )
                  .map((device) => {
                    const lastServiceDate = getLastServiceDate(device.id);
                    return (
                      <div
                        key={device.id}
                        className="bg-gray-800 rounded-lg p-4 border border-gray-700 flex items-center gap-4 transition-all hover:border-blue-500 hover:bg-gray-700/50 cursor-pointer"
                        onClick={() =>
                          router.push(`/dashboard/medical-devices/${device.id}`)
                        }
                      >
                        <div className="flex-shrink-0">
                          <StatusIcon status={device.status} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-white">
                            {device.brand} {device.model}
                          </h4>
                          <p className="text-sm text-gray-400">
                            Serial:{" "}
                            <span className="font-mono text-gray-300">
                              {device.serial_number}
                            </span>
                          </p>
                          <p className="text-xs text-gray-500">
                            Software Version: {device.software_version || "N/A"}
                          </p>
                          {/* Last Service Date */}
                          <div className="flex items-center gap-1 mt-2">
                            <Calendar className="w-3 h-3 text-blue-400" />
                            <p className="text-xs text-blue-400">
                              Last Service:{" "}
                              {lastServiceDate
                                ? formatDate(lastServiceDate)
                                : "Belum ada service"}
                            </p>
                          </div>
                        </div>
                        <span
                          className="px-3 py-1 rounded-full text-xs font-medium capitalize"
                          style={{
                            backgroundColor:
                              device.status.toLowerCase() === "baik" ||
                              device.status.toLowerCase() === "good"
                                ? "rgba(34, 197, 94, 0.1)"
                                : device.status.toLowerCase() === "rusak" ||
                                  device.status.toLowerCase() === "broken"
                                ? "rgba(239, 68, 68, 0.1)"
                                : "rgba(234, 179, 8, 0.1)",
                            color:
                              device.status.toLowerCase() === "baik" ||
                              device.status.toLowerCase() === "good"
                                ? "#22c55e"
                                : device.status.toLowerCase() === "rusak" ||
                                  device.status.toLowerCase() === "broken"
                                ? "#ef4444"
                                : "#eab308",
                          }}
                        >
                          {device.status}
                        </span>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>No medical devices are registered for this facility.</p>
              </div>
            )}
          </div>

          {/* LIS Applications Section */}
          <div className="bg-gray-900 p-6 rounded-2xl shadow-lg border border-gray-800">
            <h3 className="text-xl font-bold text-white mb-4">
              LIS Applications (
              {facility.medical_devices?.filter((device) =>
                ["VANSLAB", "VANSLITE"].includes(device.brand?.toUpperCase())
              ).length || 0}
              )
            </h3>
            {facility.medical_devices?.filter((device) =>
              ["VANSLAB", "VANSLITE"].includes(device.brand?.toUpperCase())
            ).length > 0 ? (
              <div className="space-y-4">
                {facility.medical_devices
                  .filter((device) =>
                    ["VANSLAB", "VANSLITE"].includes(
                      device.brand?.toUpperCase()
                    )
                  )
                  .map((device) => {
                    const lastServiceDate = getLastServiceDate(device.id);
                    return (
                      <div
                        key={device.id}
                        className="bg-gray-800 rounded-lg p-4 border border-gray-700 flex items-center gap-4 transition-all hover:border-purple-500 hover:bg-gray-700/50 cursor-pointer"
                        onClick={() =>
                          router.push(`/dashboard/medical-devices/${device.id}`)
                        }
                      >
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
                            <MonitorCog className="w-5 h-5 text-purple-400" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-white">
                            {device.brand} {device.model}
                          </h4>
                          <p className="text-sm text-gray-400">
                            License Key:{" "}
                            <span className="font-mono text-gray-300">
                              {device.serial_number}
                            </span>
                          </p>
                          <p className="text-xs text-gray-500">
                            Version: {device.software_version || "N/A"}
                          </p>
                          {/* Last Update/Service Date */}
                          <div className="flex items-center gap-1 mt-2">
                            <Calendar className="w-3 h-3 text-purple-400" />
                            <p className="text-xs text-purple-400">
                              Last Update:{" "}
                              {lastServiceDate
                                ? formatDate(lastServiceDate)
                                : "Belum ada update"}
                            </p>
                          </div>
                        </div>
                        <span
                          className="px-3 py-1 rounded-full text-xs font-medium capitalize"
                          style={{
                            backgroundColor:
                              device.status.toLowerCase() === "baik" ||
                              device.status.toLowerCase() === "good" ||
                              device.status.toLowerCase() === "aktif" ||
                              device.status.toLowerCase() === "active"
                                ? "rgba(34, 197, 94, 0.1)"
                                : device.status.toLowerCase() === "rusak" ||
                                  device.status.toLowerCase() === "broken" ||
                                  device.status.toLowerCase() ===
                                    "tidak aktif" ||
                                  device.status.toLowerCase() === "inactive"
                                ? "rgba(239, 68, 68, 0.1)"
                                : "rgba(234, 179, 8, 0.1)",
                            color:
                              device.status.toLowerCase() === "baik" ||
                              device.status.toLowerCase() === "good" ||
                              device.status.toLowerCase() === "aktif" ||
                              device.status.toLowerCase() === "active"
                                ? "#22c55e"
                                : device.status.toLowerCase() === "rusak" ||
                                  device.status.toLowerCase() === "broken" ||
                                  device.status.toLowerCase() ===
                                    "tidak aktif" ||
                                  device.status.toLowerCase() === "inactive"
                                ? "#ef4444"
                                : "#eab308",
                          }}
                        >
                          {device.status}
                        </span>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>No LIS applications are registered for this facility.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
