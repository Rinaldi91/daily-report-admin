"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Cookies from "js-cookie";
import Swal from "sweetalert2";
import HealthFacilityForm, { FormHealthFacilityData } from "@/components/forms/HealthFacilityForm";
import { Hospital, ChevronLeft } from "lucide-react";
import Link from "next/link";

// --- Interface Definitions ---
interface TypeOfHealthFacility {
  id: number;
  name: string;
}
interface MedicalDevice {
  id: number;
  brand: string;
  model: string;
  serial_number: string;
  medical_devices?: MedicalDevice[]; // Untuk detail facility
}

export default function EditHealthFacilityPage() {
  const router = useRouter();
  const params = useParams();
  const { slug } = params;

  const [initialData, setInitialData] = useState<FormHealthFacilityData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [healthFacilityTypes, setHealthFacilityTypes] = useState<TypeOfHealthFacility[]>([]);
  const [medicalDevices, setMedicalDevices] = useState<MedicalDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [facilityName, setFacilityName] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const token = Cookies.get("token");
        const [facilityRes, typesRes, devicesRes] = await Promise.all([
          fetch(`http://report-api.test/api/health-facility/${slug}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`http://report-api.test/api/type-of-health-facility?per_page=All`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`http://report-api.test/api/medical-device?page_all=All`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        const facilityJson = await facilityRes.json();
        const typesJson = await typesRes.json();
        const devicesJson = await devicesRes.json();
        
        const facilityData = facilityJson.data;
        setFacilityName(facilityData.name);
        setInitialData({
          ...facilityData,
          type_of_health_facility_id: facilityData.type_of_health_facility_id.toString(),
          medical_device_ids: facilityData.medical_devices?.map((d: MedicalDevice) => d.id) || []
        });

        setHealthFacilityTypes(typesJson.data || []);
        setMedicalDevices(devicesJson.data || []);

      } catch (error) {
        console.error("Failed to fetch initial data", error);
        Swal.fire({
            title: "Error",
            text: "Could not load data for editing.",
            icon: "error",
            background: "#1e293b", // slate-800
            color: "#f8fafc", // slate-50
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug]);

  const handleSubmit = async (data: FormHealthFacilityData) => {
    if (!initialData?.id) return;
    setIsSaving(true);
    try {
      const token = Cookies.get("token");
      const payload = {
        ...data,
        type_of_health_facility_id: parseInt(data.type_of_health_facility_id),
      };

      const res = await fetch(`http://report-api.test/api/health-facility/${initialData.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        // DIUBAH: Mengganti gaya notifikasi Swal
        await Swal.fire({
          title: "Success!",
          text: "Health facility updated successfully.",
          icon: "success",
          background: "#1e293b", // slate-800
          color: "#f8fafc", // slate-50
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
        });
        router.push("/dashboard/health-facilities");
      } else {
        const errorData = await res.json();
        const errorMessages = Object.values(errorData.errors || {}).flat().join("\n") || errorData.message;
        // DIUBAH: Menyesuaikan gaya notifikasi error juga
        Swal.fire({
          title: "Error",
          text: errorMessages,
          icon: "error",
          background: "#1e293b", // slate-800
          color: "#f8fafc", // slate-50
        });
      }
    } catch (error) {
      console.error("Submit error:", error);
      Swal.fire({
        title: "Error",
        text: "An unexpected error occurred.",
        icon: "error",
        background: "#1e293b", // slate-800
        color: "#f8fafc", // slate-50
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
            <Link href="/dashboard/health-facilities" className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors">
                <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
                    <Hospital className="w-6 h-6" /> Edit Health Facility
                </h1>
                <p className="mt-1 text-sm text-gray-400">
                    {loading ? "Loading..." : `Editing: ${facilityName}`}
                </p>
            </div>
      </div>
      <div className="bg-gray-900 p-6 rounded-lg">
        {loading || !initialData ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh]">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500"></div>
            <p className="mt-4 text-gray-400">Loading Form...</p>
          </div>
        ) : (
          <HealthFacilityForm
            initialData={initialData}
            onSubmit={handleSubmit}
            isSaving={isSaving}
            healthFacilityTypes={healthFacilityTypes}
            medicalDevices={medicalDevices}
          />
        )}
      </div>
    </div>
  );
}
