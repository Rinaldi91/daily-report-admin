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
  Cog,
  Package,
  X,
  AlertTriangle,
  Printer,
} from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import PrintLayout from "@/components/PrintLayout";

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

interface Parameter {
  id: number;
  name: string;
  uraian: string;
  description: string;
}

interface PartImage {
  id: number;
  image: string;
  description: string;
}

interface PartUsedForRepair {
  id: number;
  uraian: string;
  quantity: string;
  images: PartImage[];
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
  created_at: string;
  updated_at: string;
  note: string;
  job_order: string;
  report_work_item_type: ReportWorkItemType[];
  parameter: Parameter[];
  part_used_for_repair: PartUsedForRepair[];
}

interface Location {
  id: number;
  report_id: number;
  latitude: string;
  longitude: string;
  address: string;
}

// --- START: Interface baru untuk ReportImage ---
interface ReportImage {
  id: number;
  report_id: number;
  image: string;
  created_at: string;
  updated_at: string;
}
// --- END: Interface baru untuk ReportImage ---

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
  report_image: ReportImage[]; // Tambahkan properti report_image
}

// --- START: Komponen Dialog Gambar ---
const ImageDialog = ({
  imageUrl,
  description,
  onClose,
}: {
  imageUrl: string | null;
  description: string;
  onClose: () => void;
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setIsError(false);
  }, [imageUrl]);

  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 rounded-lg shadow-xl relative max-w-4xl max-h-[90vh] w-full h-full flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with close button */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h3 className="text-white font-semibold">Image Preview</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white bg-gray-800 rounded-full p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image container */}
        <div className="flex-1 p-4 flex items-center justify-center relative min-h-0">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          )}

          {isError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-red-400 flex flex-col items-center gap-2">
                <AlertTriangle className="w-12 h-12" />
                <span className="text-lg">Gagal memuat gambar</span>
                <span className="text-sm text-gray-500 text-center">
                  Pastikan URL gambar valid dan dapat diakses
                </span>
              </div>
            </div>
          )}

          {/* Image */}
          <div className="relative w-full h-full">
            <Image
              src={imageUrl}
              alt={description || "Enlarged image"}
              fill
              style={{ objectFit: "contain" }}
              className={`transition-opacity duration-300 ${
                isLoading || isError ? "opacity-0" : "opacity-100"
              }`}
              onLoad={() => {
                console.log("Image loaded successfully:", imageUrl);
                setIsLoading(false);
              }}
              onError={(_e) => {
                console.error("Failed to load image:", imageUrl);
                setIsLoading(false);
                setIsError(true);
              }}
              unoptimized // Add this to bypass Next.js optimization if needed
            />
          </div>
        </div>

        {/* Description footer */}
        {description && !isError && (
          <div className="p-4 border-t border-gray-700">
            <p className="text-center text-gray-300 text-sm">{description}</p>
          </div>
        )}
      </div>
    </div>
  );
};
// --- END: Komponen Dialog Gambar ---

export default function ReportDetailPage() {
  const params = useParams();
  const { id } = params;
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    description: string;
  } | null>(null);

  const [isPrinting, setIsPrinting] = useState(false);

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
            `${process.env.NEXT_PUBLIC_BASE_URL_API}/api/report/${id}`,
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

  const groupedWorkItems = useMemo(() => {
    if (!report?.report_work_item) return [];

    const grouped: {
      [key: number]: { device: MedicalDevice; workItems: ReportWorkItem[] };
    } = {};

    report.report_work_item.forEach((workItem) => {
      const device = report.health_facility?.medical_devices?.find(
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
      return format(new Date(dateString), "d MMMM yyyy, HH:mm:ss");
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "HH:mm:ss");
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
    const baseStorageUrl = process.env.NEXT_PUBLIC_FILE_BASE_URL;
    let fullImageUrl = null;

    if (url) {
      let folderPath = "";
      if (url.includes("customer_signature")) {
        folderPath = "storage/signatures/customer_signatures";
      } else if (url.includes("employee_signature")) {
        folderPath = "storage/signatures/employee_signatures";
      } else {
        folderPath = "storage/signatures";
      }
      fullImageUrl = `${baseStorageUrl}/${folderPath}/${url}`;
    }

    return (
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 text-center flex flex-col">
        <p className="text-sm font-semibold text-white mb-2">{title}</p>
        <div className="relative flex-grow w-full h-24 bg-gray-700 rounded-md">
          {fullImageUrl ? (
            <Image
              src={fullImageUrl}
              alt={`${title} signature`}
              fill
              unoptimized
              style={{ objectFit: "contain" }}
              className="bg-white rounded-md p-1"
              onError={(e) => {
                console.error("Failed to load image:", fullImageUrl);
                const target = e.currentTarget as HTMLImageElement;
                target.style.display = "none";
                const parent = target.parentElement;
                if (parent) {
                  const placeholder = parent.querySelector(".placeholder-icon");
                  if (placeholder)
                    (placeholder as HTMLElement).style.display = "flex";
                }
              }}
            />
          ) : null}
          <div
            className={`w-full h-full flex items-center justify-center placeholder-icon ${
              fullImageUrl ? "hidden" : ""
            }`}
          >
            <ImageIcon className="w-8 h-8 text-gray-500" />
          </div>
        </div>
      </div>
    );
  };

  const PartImageBox = ({
    image,
    onImageClick,
  }: {
    image: PartImage;
    onImageClick: (url: string, description: string) => void;
  }) => {
    const baseStorageUrl = process.env.NEXT_PUBLIC_FILE_BASE_URL;
    const fullImageUrl = image.image
      ? `${baseStorageUrl}/storage/parts_used_images/${image.image}`
      : null;

    const handleClick = () => {
      if (fullImageUrl) {
        onImageClick(fullImageUrl, image.description || "Part image");
      }
    };

    return (
      <div
        className="border border-gray-600 rounded-lg p-2 text-center flex flex-col cursor-pointer hover:border-blue-400 transition-colors"
        onClick={handleClick}
      >
        <div className="relative w-full h-32 bg-gray-700 rounded-md mb-2 flex-grow">
          {fullImageUrl ? (
            <Image
              src={fullImageUrl}
              alt={image.description || "Part image"}
              fill
              style={{ objectFit: "contain" }}
              className="bg-white rounded-md p-1"
              onError={(e) => {
                console.error("Failed to load part image:", fullImageUrl);
                const target = e.currentTarget as HTMLImageElement;
                target.style.display = "none";
                const parent = target.parentElement;
                if (parent) {
                  const placeholder = parent.querySelector(".placeholder-icon");
                  if (placeholder)
                    (placeholder as HTMLElement).style.display = "flex";
                }
              }}
            />
          ) : null}
          <div
            className={`w-full h-full items-center justify-center placeholder-icon ${
              fullImageUrl ? "hidden" : "flex"
            }`}
          >
            <ImageIcon className="w-8 h-8 text-gray-500" />
          </div>
        </div>
        <p className="text-xs text-gray-300 h-8 overflow-hidden">
          {image.description || "No description"}
        </p>
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
    <>
      <ImageDialog
        imageUrl={selectedImage?.url || null}
        description={selectedImage?.description || ""}
        onClose={() => setSelectedImage(null)}
      />

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
          className={`p-4 rounded-xl flex items-center justify-between gap-4 ${currentStatus.className}`}
        >
          {/* Konten Kiri: Ikon & Status */}
          <div className="flex items-center gap-4">
            <currentStatus.Icon className="w-8 h-8 text-white" />
            <div>
              <h2 className="text-xl font-bold text-white">
                {currentStatus.title}
              </h2>
              <p className="text-white/80">
                {report.is_status === "Completed"
                  ? `Completed on ${formatDate(report.completed_at)}`
                  : `Report created on ${formatDate(report.created_at)}`}
              </p>
            </div>
          </div>

          {/* Tombol Print di Kanan */}
          <button
            onClick={() => setIsPrinting(true)}
            className="inline-flex items-center px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors flex-shrink-0 cursor-pointer"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print
          </button>
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
              <InfoRow label="Check-in" value={formatDate(report.created_at)} />
              <InfoRow
                label="Completed Report"
                value={formatDate(report.completed_at)}
              />
              <InfoRow
                label="Count Time"
                value={formatTotalWaktu(report.total_time)}
              />
            </InfoCard>

            <InfoCard
              icon={<UserCheck className="text-blue-400 w-6 h-6" />}
              title="Technician"
            >
              <InfoRow label="Name" value={report.employee?.name ?? "N/A"} />
              <InfoRow
                label="Employee ID"
                value={report.employee?.employee_number ?? "N/A"}
              />
              <InfoRow
                label="Region"
                value={report.employee?.region ?? "N/A"}
              />
              <InfoRow
                label="Phone"
                value={report.employee?.phone_number ?? "N/A"}
              />
              <InfoRow
                label="Status"
                value={report.employee?.status ?? "N/A"}
              />
            </InfoCard>

            <InfoCard
              icon={<Building className="text-blue-400 w-6 h-6" />}
              title="Health Facility"
            >
              <InfoRow
                label="Name"
                value={report.health_facility?.name ?? "N/A"}
              />
              <InfoRow
                label="Type"
                value={report.health_facility?.type?.name ?? "N/A"}
              />
              <InfoRow
                label="City"
                value={report.health_facility?.city ?? "N/A"}
              />
              <InfoRow
                label="Phone"
                value={report.health_facility?.phone_number ?? "N/A"}
              />
              <div className="text-sm pt-2">
                <p className="text-gray-400 mb-1">Address:</p>
                <p className="text-white">
                  {report.health_facility?.address ?? "N/A"}
                </p>
              </div>
            </InfoCard>

            {/* --- START: Perubahan pada Kartu Lokasi --- */}
            {report.location && (
              <InfoCard
                icon={<MapPin className="text-blue-400 w-6 h-6" />}
                title="Location"
              >
                <div className="text-sm">
                  <p className="text-gray-400 mb-1">Address:</p>
                  <p className="text-white">{report.location.address}</p>
                </div>

                {/* --- START: Kode yang diubah --- */}
                <div className="mt-3 flex items-center gap-x-4 gap-y-2 flex-wrap text-sm justify-between">
                  {/* Link ke Google Maps */}
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${report.location.latitude},${report.location.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    View on Google Maps
                  </a>

                  {/* Link untuk menampilkan dialog gambar (hanya muncul jika ada gambar) */}
                  {report.report_image?.[0] && (
                    <button
                      onClick={() => {
                        const baseStorageUrl =
                          process.env.NEXT_PUBLIC_FILE_BASE_URL;
                        const reportImage = report.report_image[0];
                        const fullImageUrl = `${baseStorageUrl}/storage/${reportImage.image}`;
                        setSelectedImage({
                          url: fullImageUrl,
                          description: "Check-in Image",
                        });
                      }}
                      className="text-blue-400 hover:underline cursor-pointer"
                    >
                      Image Check-in
                    </button>
                  )}
                </div>
                {/* --- END: Kode yang diubah --- */}
              </InfoCard>
            )}
          </div>

          {/* Right Column - Job and Completion Details */}
          <div className="lg:col-span-2 space-y-6">
            <InfoCard
              icon={<Wrench className="text-blue-400 w-6 h-6" />}
              title="Work Items"
            >
              {(() => {
                // Menangani kasus jika tidak ada item pekerjaan sama sekali
                if (groupedWorkItems.length === 0) {
                  return <p>No work items found for this report.</p>;
                }

                // Inisialisasi satu penghitung untuk semua item pekerjaan
                let overallWorkItemIndex = 0;

                return (
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

                        {workItems.map((workItem) => {
                          // Tambahkan nilai penghitung untuk setiap item yang akan ditampilkan
                          overallWorkItemIndex++;

                          return (
                            <div
                              key={workItem.id}
                              className="mt-4 pt-4 border-t border-gray-600 space-y-4"
                            >
                              <div className="flex justify-between items-start">
                                <h4 className="font-semibold text-white">
                                  {/* Gunakan penghitung keseluruhan yang tidak akan di-reset */}
                                  Work Item #{overallWorkItemIndex}
                                </h4>
                                <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded">
                                  {workItem.job_order}
                                </span>
                              </div>

                              <div className="space-y-3 text-sm">
                                <div>
                                  <p className="text-gray-400 mb-1">Problem:</p>
                                  <p className="text-white bg-gray-700 p-2 rounded">
                                    {workItem.problem}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-gray-400 mb-1">
                                    Error Code:
                                  </p>
                                  <p className="text-white font-mono bg-gray-700 p-2 rounded">
                                    {workItem.error_code}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-gray-400 mb-1">
                                    Action Taken:
                                  </p>
                                  <p className="text-white bg-gray-700 p-2 rounded">
                                    {workItem.job_action}
                                  </p>
                                </div>
                              </div>

                              {workItem.parameter?.length > 0 && (
                                <div className="bg-gray-700/70 p-4 rounded-lg border border-gray-600">
                                  <div className="flex items-center gap-2 mb-3">
                                    <Cog className="w-5 h-5 text-gray-300" />
                                    <h5 className="font-semibold text-white">
                                      Parameters Checked
                                    </h5>
                                  </div>
                                  <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                      <thead>
                                        <tr className="border-b border-gray-600">
                                          <th className="text-left p-3 text-white font-semibold bg-gray-800/60">
                                            Parameter Name
                                          </th>
                                          <th className="text-left p-3 text-white font-semibold bg-gray-800/60">
                                            Uraian
                                          </th>
                                          <th className="text-left p-3 text-white font-semibold bg-gray-800/60">
                                            Description
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {workItem.parameter.map(
                                          (param, index) => (
                                            <tr
                                              key={param.id}
                                              className={`border-b border-gray-600/50 ${
                                                index % 2 === 0
                                                  ? "bg-gray-800/30"
                                                  : "bg-gray-800/60"
                                              }`}
                                            >
                                              <td className="p-3 text-white font-medium">
                                                {param.name}
                                              </td>
                                              <td className="p-3 text-gray-300 text-sm">
                                                {param.uraian}
                                              </td>
                                              <td className="p-3 text-gray-300 text-sm">
                                                {param.description}
                                              </td>
                                            </tr>
                                          )
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}

                              {workItem.part_used_for_repair?.length > 0 && (
                                <div className="bg-gray-700/70 p-4 rounded-lg border border-gray-600">
                                  <div className="flex items-center gap-2 mb-3">
                                    <Package className="w-5 h-5 text-gray-300" />
                                    <h5 className="font-semibold text-white">
                                      Parts Used for Repair
                                    </h5>
                                  </div>
                                  <div className="space-y-3">
                                    {workItem.part_used_for_repair.map(
                                      (part) => (
                                        <div
                                          key={part.id}
                                          className="bg-gray-800/60 p-3 rounded-md"
                                        >
                                          <p className="text-white">
                                            {part.uraian} (Quantity:{" "}
                                            {part.quantity})
                                          </p>
                                          {part.images?.length > 0 && (
                                            <div className="mt-3">
                                              <p className="text-gray-400 text-xs font-semibold mb-2">
                                                Images:
                                              </p>
                                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                {part.images.map((img) => (
                                                  <PartImageBox
                                                    key={img.id}
                                                    image={img}
                                                    onImageClick={(url, desc) =>
                                                      setSelectedImage({
                                                        url: url,
                                                        description: desc,
                                                      })
                                                    }
                                                  />
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}

                              {workItem.note && (
                                <div>
                                  <p className="text-gray-400 mb-1">Notes:</p>
                                  <p className="text-white bg-gray-700 p-2 rounded">
                                    {workItem.note}
                                  </p>
                                </div>
                              )}

                              <div className="flex justify-between items-center pt-2">
                                <div>
                                  <p className="text-gray-400 text-sm">
                                    Work Types:
                                  </p>
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
                                  <div className="mb-1 justify-between flex items-center">
                                    <p className="text-gray-400 text-sm">
                                      Start Time:
                                    </p>
                                    <p className="text-white font-semibold ml-1">
                                      {formatTime(workItem.created_at)}
                                    </p>

                                    <p className="text-gray-400 text-sm ml-7">
                                      End Time:
                                    </p>
                                    <p className="text-white font-semibold">
                                      {formatTime(workItem.updated_at)}
                                    </p>
                                  </div>
                                  <p className="text-gray-400 text-sm">
                                    Time Spent:
                                  </p>
                                  <p className="text-white font-semibold">
                                    {formatTotalWaktu(workItem.total_time)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                );
              })()}
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
      {/* Render komponen PrintLayout sebagai overlay jika isPrinting true */}
      {isPrinting && report && (
        <PrintLayout report={report} onClose={() => setIsPrinting(false)} />
      )}
    </>
  );
}
