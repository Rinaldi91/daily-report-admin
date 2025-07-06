"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Cookies from "js-cookie";
import Link from "next/link";
import {
  ChevronLeft,
  FileText,
  MapPin,
  Wrench,
  ClipboardCheck,
  CheckCircle,
  Clock,
  UserCheck,
  Building,
  ClipboardList,
  ImageIcon,
} from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";

// --- Interface Definitions ---

type ReportStatus = "Progress" | "Pending" | "Completed";

interface User {
  id: number;
  name: string;
  email: string;
  role_id: number;
}

interface Employee {
  id: number;
  user_id: number;
  division_id: number;
  position_id: number;
  region: string;
  employee_number: string;
  nik: string;
  name: string;
  gender: string;
  place_of_birth: string;
  date_of_birth: string;
  phone_number: string;
  email: string;
  address: string;
  status: string;
  date_of_entry: string;
  is_active: number;
  photo: string;
}

interface TypeOfHealthFacility {
  id: number;
  name: string;
  slug: string;
  description: string;
}

interface MedicalDevice {
  id: number;
  medical_device_category_id: number;
  brand: string;
  model: string;
  serial_number: string;
  software_version: string;
  status: string;
  notes: string | null;
  pivot: {
    health_facility_id: number;
    medical_device_id: number;
  };
}

interface HealthFacility {
  id: number;
  type_of_health_facility_id: number;
  name: string;
  slug: string;
  email: string;
  phone_number: string;
  city: string;
  address: string;
  lat: string | null;
  lng: string | null;
  type: TypeOfHealthFacility;
  medical_devices: MedicalDevice[];
}

interface TypeOfWork {
  id: number;
  name: string;
  slug: string;
  description: string | null;
}

interface ReportWorkItemType {
  id: number;
  report_work_item_id: number;
  type_of_work_id: number;
  type_of_work: TypeOfWork;
}

interface ReportWorkItem {
  id: number;
  report_id: number;
  medical_device_id: number;
  problem: string;
  error_code: string;
  job_action: string;
  completion_status_id: number;
  completed_at: string;
  total_time: string;
  note: string;
  job_order: string;
  report_work_item_type: ReportWorkItemType[];
  parameter: string[];
  part_used_for_repair: string[];
}

interface Location {
  id: number;
  report_id: number;
  latitude: string;
  longitude: string;
  address: string;
}

interface Report {
  id: number;
  user_id: number;
  employee_id: number;
  health_facility_id: number;
  report_number: string;
  is_status: ReportStatus;
  customer_name: string;
  customer_phone: string;
  note: string | null;
  suggestion: string;
  attendance_customer: string;
  attendance_employee: string;
  completed_at: string;
  total_time: string;
  created_at: string;
  updated_at: string;
  user: User;
  employee: Employee;
  health_facility: HealthFacility;
  report_work_item: ReportWorkItem[];
  location: Location;
}

export default function ReportDetailPage() {
  const params = useParams();
  const { id } = params;
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const fetchReportData = async () => {
        setLoading(true);
        setError(null);
        try {
          const token = Cookies.get("token");
          if (!token) throw new Error("Unauthorized");

          const headers = {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          };

          const reportRes = await fetch(
            `http://report-api.test/api/report/${id}`,
            { headers }
          );

          if (!reportRes.ok) {
            const errorData = await reportRes.json();
            throw new Error(
              errorData.message || "Failed to fetch report details."
            );
          }

          const reportJson = await reportRes.json();
          setReport(reportJson.data);
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "An unexpected error occurred."
          );
        } finally {
          setLoading(false);
        }
      };
      fetchReportData();
    }
  }, [id]);

  // Group work items by device
  const groupedWorkItems = useMemo(() => {
    if (!report?.report_work_item) return [];

    const grouped: {
      [key: number]: { device: MedicalDevice; workItems: ReportWorkItem[] };
    } = {};

    report.report_work_item.forEach((workItem) => {
      const device = report.health_facility.medical_devices.find(
        (d) => d.id === workItem.medical_device_id
      );

      if (device) {
        if (!grouped[device.id]) {
          grouped[device.id] = { device, workItems: [] };
        }
        grouped[device.id].workItems.push(workItem);
      }
    });

    return Object.values(grouped);
  }, [report]);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "d MMMM yyyy, HH:mm");
    } catch {
      return dateString;
    }
  };

  const formatTotalWaktu = (timeString: string | null | undefined): string => {
    if (!timeString) return "N/A";

    const parts = timeString.split(":");
    if (parts.length !== 3) return timeString;

    const jam = parseInt(parts[0], 10);
    const menit = parseInt(parts[1], 10);
    const detik = parseInt(parts[2], 10);

    const resultParts: string[] = [];

    if (jam > 0) {
      resultParts.push(`${jam} jam`);
    }
    if (menit > 0) {
      resultParts.push(`${menit} menit`);
    }
    if (detik > 0) {
      resultParts.push(`${detik} detik`);
    }

    if (resultParts.length === 0) {
      return "0 detik";
    }

    return resultParts.join(" ");
  };

  const InfoCard = ({
    icon,
    title,
    children,
  }: {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
  }) => (
    <div className="bg-gray-900 p-6 rounded-2xl shadow-lg border border-gray-800">
      <div className="flex items-center gap-3 mb-4">
        {icon}
        <h3 className="text-xl font-bold text-white">{title}</h3>
      </div>
      <div className="space-y-3 text-gray-300">{children}</div>
    </div>
  );

  const InfoRow = ({
    label,
    value,
  }: {
    label: string;
    value: React.ReactNode;
  }) => (
    <div className="flex flex-col sm:flex-row justify-between">
      <p className="text-gray-400">{label}</p>
      <p className="font-semibold text-white text-right">{value}</p>
    </div>
  );

  const SignatureBox = ({
    title,
    url,
  }: {
    title: string;
    url: string | null;
  }) => {
    // Base URL untuk storage dari environment variable
    const baseStorageUrl = process.env.NEXT_PUBLIC_FILE_BASE_URL;
    
    // Konstruksi URL berdasarkan jenis signature dan nama file
    let fullImageUrl = null;
    
    if (url) {
      // Tentukan folder berdasarkan nama file
      let folderPath = '';
      
      if (url.includes('customer_signature')) {
        folderPath = 'signatures/customer_signatures';
      } else if (url.includes('employee_signature')) {
        folderPath = 'signatures/employee_signatures';
      } else {
        // Default jika tidak ada pattern yang cocok
        folderPath = 'signatures';
      }
      
      fullImageUrl = `${baseStorageUrl}/${folderPath}/${url}`;
    }
    
    console.log('Full Image URL:', fullImageUrl);

    return (
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 text-center flex flex-col">
        <p className="text-sm font-semibold text-white mb-2">{title}</p>

        {/* Container ini dibuat 'relative' agar Image dengan prop 'fill' bisa mengisinya.
              Kita juga beri 'flex-grow' agar mengambil sisa ruang vertikal.
            */}
        <div className="relative flex-grow w-full h-24 bg-gray-700 rounded-md">
          {fullImageUrl ? (
            <Image
              src={fullImageUrl}
              alt={`${title} signature`}
              fill
              style={{ objectFit: "contain" }} // Gunakan style untuk objectFit saat menggunakan 'fill'
              className="bg-white rounded-md p-1" // Styling untuk background, border-radius, dan padding
              onError={(e) => {
                // Handle error jika gambar gagal dimuat
                console.error('Failed to load image:', fullImageUrl);
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-gray-500" />
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
        <span className="mt-4 text-gray-400">Loading report details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-400 bg-red-900/20 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-2">An Error Occurred</h2>
        <p>{error}</p>
        <Link
          href="/dashboard/reports"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to List
        </Link>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-12 text-gray-400">Report not found.</div>
    );
  }

  const statusConfig: {
    [key in ReportStatus]: {
      className: string;
      Icon: React.ElementType;
      title: string;
    };
  } = {
    Completed: {
      className: "bg-green-900/50 text-green-300",
      Icon: CheckCircle,
      title: "Report Completed",
    },
    Progress: {
      className: "bg-yellow-900/50 text-yellow-300",
      Icon: Clock,
      title: "Report In Progress",
    },
    Pending: {
      className: "bg-orange-900/50 text-orange-300",
      Icon: Clock,
      title: "Report Pending",
    },
  };

  const currentStatus = statusConfig[report.is_status] || statusConfig.Progress;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <FileText className="w-8 h-8 text-blue-400" />
          Report Details
        </h1>
        <Link
          href="/dashboard/reports"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to List
        </Link>
      </div>

      {/* Status Banner */}
      <div
        className={`p-4 rounded-xl flex items-center gap-4 ${currentStatus.className}`}
      >
        <currentStatus.Icon className="w-8 h-8" />
        <div>
          <h2 className="text-xl font-bold text-white">
            {currentStatus.title}
          </h2>
          <p>
            {report.is_status === "Completed"
              ? `Completed on ${formatDate(report.completed_at)}`
              : `Report created on ${formatDate(report.created_at)}`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - General Info */}
        <div className="lg:col-span-1 space-y-6">
          <InfoCard
            icon={<ClipboardCheck className="text-blue-400 w-6 h-6" />}
            title="General Info"
          >
            <InfoRow
              label="Report Number"
              value={
                <code className="text-sm bg-gray-700 px-2 py-1 rounded">
                  {report.report_number}
                </code>
              }
            />
            <InfoRow label="Created At" value={formatDate(report.created_at)} />
            <InfoRow
              label="Completed At"
              value={formatDate(report.completed_at)}
            />
            <InfoRow
              label="Total Waktu"
              value={formatTotalWaktu(report.total_time)}
            />
          </InfoCard>

          <InfoCard
            icon={<UserCheck className="text-blue-400 w-6 h-6" />}
            title="Technician"
          >
            <InfoRow label="Name" value={report.employee.name} />
            <InfoRow
              label="Employee ID"
              value={report.employee.employee_number}
            />
            <InfoRow label="Region" value={report.employee.region} />
            <InfoRow label="Phone" value={report.employee.phone_number} />
            <InfoRow label="Status" value={report.employee.status} />
          </InfoCard>

          <InfoCard
            icon={<Building className="text-blue-400 w-6 h-6" />}
            title="Health Facility"
          >
            <InfoRow label="Name" value={report.health_facility.name} />
            <InfoRow label="Type" value={report.health_facility.type.name} />
            <InfoRow label="City" value={report.health_facility.city} />
            <InfoRow
              label="Phone"
              value={report.health_facility.phone_number}
            />
            <div className="text-sm pt-2">
              <p className="text-gray-400 mb-1">Address:</p>
              <p className="text-white">{report.health_facility.address}</p>
            </div>
          </InfoCard>

          {report.location && (
            <InfoCard
              icon={<MapPin className="text-blue-400 w-6 h-6" />}
              title="Location"
            >
              <div className="text-sm">
                <p className="text-gray-400 mb-1">Address:</p>
                <p className="text-white">{report.location.address}</p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${report.location.latitude},${report.location.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline mt-2 inline-block"
                >
                  View on Google Maps
                </a>
              </div>
            </InfoCard>
          )}
        </div>

        {/* Right Column - Job and Completion Details */}
        <div className="lg:col-span-2 space-y-6">
          <InfoCard
            icon={<Wrench className="text-blue-400 w-6 h-6" />}
            title="Work Items"
          >
            {groupedWorkItems.length > 0 ? (
              <div className="space-y-6">
                {groupedWorkItems.map(({ device, workItems }) => (
                  <div
                    key={device.id}
                    className="bg-gray-800 p-4 rounded-lg border border-gray-700"
                  >
                    <div className="mb-4">
                      <p className="font-bold text-white text-lg">
                        {device.brand} {device.model}
                      </p>
                      <div className="text-sm text-gray-400 mt-2 space-y-1">
                        <p>
                          Serial:{" "}
                          <span className="font-mono text-gray-300">
                            {device.serial_number}
                          </span>
                        </p>
                        <p>
                          Software Ver:{" "}
                          <span className="font-mono text-gray-300">
                            {device.software_version || "N/A"}
                          </span>
                        </p>
                        <p>
                          Status:{" "}
                          <span className="text-green-400">
                            {device.status}
                          </span>
                        </p>
                      </div>
                    </div>

                    {workItems.map((workItem, index) => (
                      <div
                        key={workItem.id}
                        className="mt-4 pt-4 border-t border-gray-600"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-semibold text-white">
                            Work Item #{index + 1}
                          </h4>
                          <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded">
                            {workItem.job_order}
                          </span>
                        </div>

                        <div className="space-y-3 text-sm">
                          <div>
                            <p className="text-gray-400">Problem:</p>
                            <p className="text-white bg-gray-700 p-2 rounded">
                              {workItem.problem}
                            </p>
                          </div>

                          <div>
                            <p className="text-gray-400">Error Code:</p>
                            <p className="text-white font-mono bg-gray-700 p-2 rounded">
                              {workItem.error_code}
                            </p>
                          </div>

                          <div>
                            <p className="text-gray-400">Action Taken:</p>
                            <p className="text-white bg-gray-700 p-2 rounded">
                              {workItem.job_action}
                            </p>
                          </div>

                          {workItem.note && (
                            <div>
                              <p className="text-gray-400">Notes:</p>
                              <p className="text-white bg-gray-700 p-2 rounded">
                                {workItem.note}
                              </p>
                            </div>
                          )}

                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-gray-400">Work Types:</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {workItem.report_work_item_type.map(
                                  (workType) => (
                                    <span
                                      key={workType.id}
                                      className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded"
                                    >
                                      {workType.type_of_work.name}
                                    </span>
                                  )
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-gray-400">Time Spent:</p>
                              <p className="text-white font-semibold">
                                {formatTotalWaktu(workItem.total_time)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <p>No work items found for this report.</p>
            )}
          </InfoCard>

          <InfoCard
            icon={<ClipboardList className="text-blue-400 w-6 h-6" />}
            title="Completion Details"
          >
            <InfoRow
              label="Customer Name"
              value={report.customer_name || "-"}
            />
            <InfoRow
              label="Customer Phone"
              value={report.customer_phone || "-"}
            />

            {report.note && (
              <div className="pt-2">
                <h4 className="font-semibold text-white mb-1">Notes</h4>
                <p className="text-gray-300 p-3 bg-gray-800 rounded-lg">
                  {report.note}
                </p>
              </div>
            )}

            {report.suggestion && (
              <div className="pt-2">
                <h4 className="font-semibold text-white mb-1">Suggestion</h4>
                <p className="text-gray-300 p-3 bg-gray-800 rounded-lg">
                  {report.suggestion}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <SignatureBox
                title="Technician Signature"
                url={report.attendance_employee}
              />
              <SignatureBox
                title="Customer Signature"
                url={report.attendance_customer}
              />
            </div>
          </InfoCard>
        </div>
      </div>
    </div>
  );
}
