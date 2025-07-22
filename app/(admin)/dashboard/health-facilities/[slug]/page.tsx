"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Cookies from "js-cookie";
import Link from "next/link";
import { ChevronLeft, Hospital, MapPin, Mail, Phone, Wrench, CircleCheck, CircleX, Info } from "lucide-react";

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
}

export default function HealthFacilityDetailPage() {
  const params = useParams();
  const { slug } = params;
  const [facility, setFacility] = useState<HealthFacilityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      const fetchDetail = async () => {
        setLoading(true);
        setError(null);
        try {
          const token = Cookies.get("token");
          const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL_API}/api/health-facility/${slug}`, {
            headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
          });
          if (!res.ok) throw new Error("Failed to fetch facility details.");
          const json = await res.json();
          setFacility(json.data);
        } catch (err) {
          setError(err instanceof Error ? err.message : "An unexpected error occurred.");
        } finally {
          setLoading(false);
        }
      };
      fetchDetail();
    }
  }, [slug]);

  const StatusIcon = ({ status }: { status: string }) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === 'Baik' || lowerStatus === 'good') { // Handle both languages
        return <CircleCheck className="w-5 h-5 text-green-500" />;
    }
    if (lowerStatus === 'rusak' || lowerStatus === 'broken') { // Handle both languages
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
            <Link href="/dashboard/health-facilities" className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors">
                <ChevronLeft className="w-4 h-4" />
                Back to List
            </Link>
        </div>
    );
  }
  
  if (!facility) {
    return <div className="text-center py-12 text-gray-400">Facility not found.</div>;
  }

  return (
    <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Info className="w-8 h-8 text-blue-400" />
                Health Facility Details
            </h1>
            <Link href="/dashboard/health-facilities" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors">
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
                    <h2 className="text-2xl font-bold text-white text-center">{facility.name}</h2>
                    <p className="text-center text-blue-400 mt-1">{facility.type?.name}</p>
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
                            <p className="text-gray-300 break-all">{facility.email || "-"}</p>
                        </div>
                         <div className="flex items-center gap-3">
                            <Phone className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            <p className="text-gray-300">{facility.phone_number || "-"}</p>
                        </div>
                    </div>
                 </div>
            </div>

            {/* Kolom Kanan - Detail Perangkat */}
            <div className="lg:col-span-2">
                <div className="bg-gray-900 p-6 rounded-2xl shadow-lg border border-gray-800">
                     <h3 className="text-xl font-bold text-white mb-4">Registered Medical Devices ({facility.medical_devices?.length || 0})</h3>
                     {facility.medical_devices?.length > 0 ? (
                        <div className="space-y-4">
                            {facility.medical_devices.map((device) => (
                                <div key={device.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700 flex items-center gap-4 transition-all hover:border-blue-500 hover:bg-gray-700/50">
                                    <div className="flex-shrink-0">
                                        <StatusIcon status={device.status} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-white">{device.brand} {device.model}</h4>
                                        <p className="text-sm text-gray-400">
                                            Serial: <span className="font-mono text-gray-300">{device.serial_number}</span>
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Software Version: {device.software_version || 'N/A'}
                                        </p>
                                    </div>
                                    <span className="px-3 py-1 rounded-full text-xs font-medium capitalize" style={{
                                        backgroundColor: device.status.toLowerCase() === 'Baik' || device.status.toLowerCase() === 'good' ? 'rgba(34, 197, 94, 0.1)' : device.status.toLowerCase() === 'rusak' || device.status.toLowerCase() === 'broken' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                                        color: device.status.toLowerCase() === 'Baik' || device.status.toLowerCase() === 'good' ? '#22c55e' : device.status.toLowerCase() === 'rusak' || device.status.toLowerCase() === 'broken' ? '#ef4444' : '#eab308'
                                    }}>
                                        {device.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <p>No medical devices are registered for this facility.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
}
