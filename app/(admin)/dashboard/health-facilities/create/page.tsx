"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
}

export default function CreateHealthFacilityPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [healthFacilityTypes, setHealthFacilityTypes] = useState<TypeOfHealthFacility[]>([]);
  const [medicalDevices, setMedicalDevices] = useState<MedicalDevice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = Cookies.get("token");
        const [typesRes, devicesRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_BASE_URL_API}/api/type-of-health-facility?per_page=All`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${process.env.NEXT_PUBLIC_BASE_URL_API}/api/medical-device?page_all=All`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        const typesJson = await typesRes.json();
        const devicesJson = await devicesRes.json();
        setHealthFacilityTypes(typesJson.data || []);
        setMedicalDevices(devicesJson.data || []);
      } catch (error) {
        console.error("Failed to fetch initial data", error);
        Swal.fire({
          title: "Error",
          text: "Could not load data for the form.",
          icon: "error",
          background: "#1e293b",
          color: "#f8fafc",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (data: FormHealthFacilityData) => {
    setIsSaving(true);
    try {
      const token = Cookies.get("token");
      const payload = {
        ...data,
        type_of_health_facility_id: parseInt(data.type_of_health_facility_id),
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL_API}/api/health-facility`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await Swal.fire({
          title: "Success!",
          text: "Health facility created successfully.",
          icon: "success",
          background: "#1e293b",
          color: "#f8fafc",
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
        });
        router.push("/dashboard/health-facilities");
      } else {
        const errorData = await res.json();
        const errorMessages = Object.values(errorData.errors || {}).flat().join("\n") || errorData.message;
        Swal.fire({
          title: "Error",
          text: errorMessages,
          icon: "error",
          background: "#1e293b",
          color: "#f8fafc",
        });
      }
    } catch (error) {
      console.error("Submit error:", error);
      Swal.fire({
        title: "Error",
        text: "An unexpected error occurred.",
        icon: "error",
        background: "#1e293b",
        color: "#f8fafc",
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
                    <Hospital className="w-6 h-6" /> Add New Health Facility
                </h1>
                <p className="mt-1 text-sm text-gray-400">Fill in the details to create a new health facility.</p>
            </div>
        </div>

      <div className="bg-gray-900 p-6 rounded-lg">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh]">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500"></div>
            <p className="mt-4 text-gray-400">Loading Form...</p>
          </div>
        ) : (
          <HealthFacilityForm
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
