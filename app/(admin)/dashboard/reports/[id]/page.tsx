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
    AlertTriangle,
    ImageIcon
} from "lucide-react";
import Image from 'next/image'; // <-- TAMBAHKAN IMPORT INI
import { format } from 'date-fns';

// --- Interface Definitions ---

// --- CHANGE START: Define the enum type for report status ---
type ReportStatus = 'Progress' | 'Pending' | 'Completed';
// --- CHANGE END ---

interface ReportDetailItem {
    id: number;
    note: string | null;
    suggestion: string | null;
    customer_name: string | null;
    customer_phone: string | null;
    employee_signature_url: string | null;
    customer_signature_url: string | null;
}

// NOTE: Merged the two MedicalDevice interfaces into one for clarity.
interface MedicalDevice {
    id: number;
    medical_device_category_id?: number; // Optional as it's not in the master list
    brand: string;
    model: string;
    serial_number?: string; // Optional as it's not in the master list
    software_version?: string | null; // Optional as it's not in the master list
}

interface Employee {
    id: number;
    name: string;
    employee_number: string;
    region: string;
    photo: string;
}

interface HealthFacility {
    id: number;
    name: string;
    city: string;
    address: string;
}

interface TypeOfWork {
    id: number;
    name: string;
}

interface ReportDeviceItem {
    id: number;
    medical_device_id: number;
    type_of_work_id: number;
}

interface Location {
    latitude: string;
    longitude: string;
    address: string;
}

interface Report {
    id: number;
    report_number: string;
    problem: string;
    error_code: string | null;
    job_action: string;
    // --- CHANGE START: Update is_status to use the new enum type ---
    is_status: ReportStatus; 
    // --- CHANGE END ---
    completed_at: string | null;
    created_at: string;
    report_detail: ReportDetailItem[];
    employee: Employee;
    health_facility: HealthFacility;
    report_device_item: ReportDeviceItem[];
    location: Location | null;
    total_time: string;
}

export default function ReportDetailPage() {
  const params = useParams();
  const { id } = params;
  const [report, setReport] = useState<Report | null>(null);
  const [medicalDevices, setMedicalDevices] = useState<MedicalDevice[]>([]);
  const [typesOfWork, setTypesOfWork] = useState<TypeOfWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const fetchAllData = async () => {
        setLoading(true);
        setError(null);
        try {
          const token = Cookies.get("token");
          if (!token) throw new Error("Unauthorized");
          
          const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };

          const [reportRes, devicesRes, workTypesRes] = await Promise.all([
              fetch(`http://report-api.test/api/report/${id}`, { headers }),
              fetch(`http://report-api.test/api/medical-device`, { headers }),
              fetch(`http://report-api.test/api/type-of-work`, { headers })
          ]);

          if (!reportRes.ok) {
              const errorData = await reportRes.json();
              throw new Error(errorData.message || "Failed to fetch report details.");
          }
          if (!devicesRes.ok) throw new Error("Failed to fetch medical devices.");
          if (!workTypesRes.ok) throw new Error("Failed to fetch types of work.");

          const reportJson = await reportRes.json();
          const devicesJson = await devicesRes.json();
          const workTypesJson = await workTypesRes.json();
          
          setReport(reportJson.data);
          setMedicalDevices(Array.isArray(devicesJson.data) ? devicesJson.data : []);
          setTypesOfWork(Array.isArray(workTypesJson.data) ? workTypesJson.data : []);

        } catch (err) {
          setError(err instanceof Error ? err.message : "An unexpected error occurred.");
        } finally {
          setLoading(false);
        }
      };
      fetchAllData();
    }
  }, [id]);

  const groupedServicedDevices = useMemo(() => {
    if (!report?.report_device_item || medicalDevices.length === 0 || typesOfWork.length === 0) {
        return [];
    }

    const grouped: { [key: number]: { device: MedicalDevice; workTypes: TypeOfWork[] } } = {};

    report.report_device_item.forEach(item => {
        const device = medicalDevices.find(d => d.id === item.medical_device_id);
        const workType = typesOfWork.find(w => w.id === item.type_of_work_id);

        if (device && workType) {
            if (!grouped[device.id]) {
                grouped[device.id] = {
                    device: device,
                    workTypes: []
                };
            }
            grouped[device.id].workTypes.push(workType);
        }
    });

    return Object.values(grouped);
  }, [report, medicalDevices, typesOfWork]);
  
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    try {
        return format(new Date(dateString), 'd MMMM yyyy, HH:mm');
    } catch {
        return dateString;
    }
  }

  const InfoCard = ({ icon, title, children }: { icon: React.ReactNode, title: string, children: React.ReactNode }) => (
    <div className="bg-gray-900 p-6 rounded-2xl shadow-lg border border-gray-800">
        <div className="flex items-center gap-3 mb-4">
            {icon}
            <h3 className="text-xl font-bold text-white">{title}</h3>
        </div>
        <div className="space-y-3 text-gray-300">
            {children}
        </div>
    </div>
  );
  
  const InfoRow = ({ label, value }: { label: string, value: React.ReactNode }) => (
    <div className="flex flex-col sm:flex-row justify-between">
        <p className="text-gray-400">{label}</p>
        <p className="font-semibold text-white text-right">{value}</p>
    </div>
  );

  const SignatureBox = ({ title, url }: { title: string, url: string | null }) => {
    // Gabungkan base URL dengan path dari API jika URL ada
    const fullImageUrl = url ? `${url}` : null;

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
                        style={{ objectFit: 'contain' }} // Gunakan style untuk objectFit saat menggunakan 'fill'
                        className="bg-white rounded-md p-1" // Styling untuk background, border-radius, dan padding
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
            <Link href="/dashboard/reports" className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors">
                <ChevronLeft className="w-4 h-4" />
                Back to List
            </Link>
        </div>
    );
  }
  
  if (!report) {
    return <div className="text-center py-12 text-gray-400">Report not found.</div>;
  }
  
  const completionDetails = report.report_detail?.[0];

  // --- CHANGE START: Create a config object for statuses for cleaner rendering ---
  const statusConfig: { [key in ReportStatus]: { className: string; Icon: React.ElementType; title: string } } = {
    Completed: {
      className: 'bg-green-900/50 text-green-300',
      Icon: CheckCircle,
      title: 'Report Completed',
    },
    Progress: {
      className: 'bg-yellow-900/50 text-yellow-300',
      Icon: Clock,
      title: 'Report In Progress',
    },
    Pending: {
      className: 'bg-orange-900/50 text-orange-300', // Using orange for 'Pending'
      Icon: Clock, // Clock icon works well for pending too
      title: 'Report Pending',
    },
  };

  const currentStatus = statusConfig[report.is_status] || statusConfig.Progress; // Default to Progress if status is invalid
  // --- CHANGE END ---

  // Letakkan fungsi ini di bawah fungsi formatDate yang sudah ada
  const formatTotalWaktu = (timeString: string | null | undefined): string => {
    if (!timeString) return "N/A";

    const parts = timeString.split(':');
    if (parts.length !== 3) return timeString; // Kembalikan format asli jika tidak sesuai

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
        return "0 detik"; // Jika durasi 0
    }

    return resultParts.join(' ');
  };

  return (
    <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-400" />
                Report Details
            </h1>
            <Link href="/dashboard/reports" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors">
                <ChevronLeft className="w-4 h-4" />
                Back to List
            </Link>
        </div>
        
        {/* --- CHANGE START: Refactored Status Banner --- */}
        <div className={`p-4 rounded-xl flex items-center gap-4 ${currentStatus.className}`}>
            <currentStatus.Icon className="w-8 h-8" />
            <div>
                <h2 className="text-xl font-bold text-white">{currentStatus.title}</h2>
                <p>
                    {report.is_status === 'Completed'
                        ? `Completed on ${formatDate(report.completed_at)}`
                        : `Report created on ${formatDate(report.created_at)}`
                    }
                </p>
            </div>
        </div>
        {/* --- CHANGE END --- */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - General Info */}
            <div className="lg:col-span-1 space-y-6">
                <InfoCard icon={<ClipboardCheck className="text-blue-400 w-6 h-6"/>} title="General Info">
                    <InfoRow label="Report Number" value={<code className="text-sm bg-gray-700 px-2 py-1 rounded">{report.report_number}</code>} />
                    <InfoRow label="Created At" value={formatDate(report.created_at)} />
                    <InfoRow label="Completed At" value={formatDate(report.completed_at)} />
                    <InfoRow label="Total Waktu" value={formatTotalWaktu(report.total_time)} />
                </InfoCard>
                
                <InfoCard icon={<UserCheck className="text-blue-400 w-6 h-6"/>} title="Technician">
                    <InfoRow label="Name" value={report.employee.name} />
                    <InfoRow label="Employee ID" value={report.employee.employee_number} />
                    <InfoRow label="Region" value={report.employee.region} />
                </InfoCard>

                <InfoCard icon={<Building className="text-blue-400 w-6 h-6"/>} title="Health Facility">
                    <InfoRow label="Name" value={report.health_facility.name} />
                    <InfoRow label="City" value={report.health_facility.city} />
                    <div className="text-sm pt-2">
                        <p className="text-gray-400 mb-1">Address:</p>
                        <p className="text-white">{report.health_facility.address}</p>
                    </div>
                </InfoCard>

                 {report.location && (
                    <InfoCard icon={<MapPin className="text-blue-400 w-6 h-6"/>} title="Job Location">
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
                <InfoCard icon={<AlertTriangle className="text-blue-400 w-6 h-6"/>} title="Job Details">
                    <div>
                        <h4 className="font-semibold text-white mb-1">Problem Description</h4>
                        <p className="text-gray-300 p-3 bg-gray-800 rounded-lg">{report.problem}</p>
                    </div>
                    {report.error_code && (
                    <div>
                        <h4 className="font-semibold text-white mb-1">Error Code</h4>
                        <p className="text-gray-300 p-3 bg-gray-800 rounded-lg font-mono">{report.error_code}</p>
                    </div>
                    )}
                    <div>
                        <h4 className="font-semibold text-white mb-1">Action Taken</h4>
                        <p className="text-gray-300 p-3 bg-gray-800 rounded-lg">{report.job_action}</p>
                    </div>
                </InfoCard>

                 <InfoCard icon={<Wrench className="text-blue-400 w-6 h-6"/>} title="Serviced Devices">
                     {groupedServicedDevices.length > 0 ? (
                         <div className="space-y-4">
                             {groupedServicedDevices.map(({ device, workTypes }) => (
                                 <div key={device.id} className="bg-gray-800 p-4 rounded-lg">
                                     <p className="font-bold text-white text-lg">{device.brand} {device.model}</p>
                                     <div className="text-sm text-gray-400 mt-2 space-y-1">
                                         <p>Serial: <span className="font-mono text-gray-300">{device.serial_number}</span></p>
                                         <p>Software Ver: <span className="font-mono text-gray-300">{device.software_version || 'N/A'}</span></p>
                                     </div>
                                     <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-700">
                                         {workTypes.map(workType => (
                                             <span key={workType.id} className="text-sm text-blue-300 bg-blue-900/50 px-2 py-1 rounded">
                                                 {workType.name}
                                             </span>
                                         ))}
                                     </div>
                                 </div>
                             ))}
                         </div>
                       ) : (
                         <p>No specific devices were recorded for this report.</p>
                       )}
                </InfoCard>
                
                {completionDetails && (
                    <InfoCard icon={<ClipboardList className="text-blue-400 w-6 h-6"/>} title="Completion Details">
                        <InfoRow label="Customer Name" value={completionDetails.customer_name || '-'} />
                        <InfoRow label="Customer Phone" value={completionDetails.customer_phone || '-'} />
                        {completionDetails.note && (
                            <div className="pt-2">
                                <h4 className="font-semibold text-white mb-1">Notes from Technician</h4>
                                <p className="text-gray-300 p-3 bg-gray-800 rounded-lg">{completionDetails.note}</p>
                            </div>
                        )}
                         {completionDetails.suggestion && (
                            <div className="pt-2">
                                <h4 className="font-semibold text-white mb-1">Suggestion</h4>
                                <p className="text-gray-300 p-3 bg-gray-800 rounded-lg">{completionDetails.suggestion}</p>
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <SignatureBox title="Technician Signature" url={completionDetails.employee_signature_url} />
                            <SignatureBox title="Customer Signature" url={completionDetails.customer_signature_url} />
                        </div>
                    </InfoCard>
                )}
            </div>
        </div>
    </div>
  );
}