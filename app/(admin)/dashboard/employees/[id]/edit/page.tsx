"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Cookies from "js-cookie";
import Swal from "sweetalert2";
import EmployeeForm, { EmployeeFormData } from "@/components/forms/EmployeeForm";
import { Users, ChevronLeft } from "lucide-react";
import Link from "next/link";

// --- Interface Definitions ---
interface Division { id: number; name: string; }
interface Position { id: number; name: string; }

export default function EditEmployeePage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params; // Mengambil ID dari URL

  const [initialData, setInitialData] = useState<EmployeeFormData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const token = Cookies.get("token");
        if (!token) throw new Error("Unauthorized");

        // Mengambil data karyawan, divisi, dan posisi secara bersamaan
        const [employeeRes, divRes, posRes] = await Promise.all([
          fetch(`http://report-api.test/api/employee/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch('http://report-api.test/api/division?all', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('http://report-api.test/api/position?all', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        const employeeJson = await employeeRes.json();
        const divJson = await divRes.json();
        const posJson = await posRes.json();

        if (!employeeJson.status) throw new Error(employeeJson.message || "Failed to fetch employee data");

        // Menyiapkan initialData untuk form
        setInitialData({
            ...employeeJson.data,
            division_id: employeeJson.data.division_id.toString(),
            position_id: employeeJson.data.position_id.toString(),
        });

        setDivisions(divJson.data || []);
        setPositions(posJson.data || []);

      } catch (error) {
        console.error("Failed to fetch initial data", error);
        Swal.fire({
            title: "Error",
            text: "Could not load data for editing.",
            icon: "error",
            background: "#1e293b",
            color: "#f8fafc",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleSubmit = async (data: FormData) => {
    if (!id) return;
    setIsSaving(true);
    try {
        const token = Cookies.get("token");
        if (!token) throw new Error("Unauthorized");
        
        // Mengirim data sebagai POST, tapi dengan _method=PUT untuk Laravel
        const res = await fetch(`http://report-api.test/api/employee/${id}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
            },
            body: data,
        });

        const responseData = await res.json();

        if (res.ok) {
            await Swal.fire({
                title: 'Success!',
                text: 'Employee updated successfully.',
                icon: 'success',
                background: '#1e293b',
                color: '#f8fafc',
                timer: 2000,
                timerProgressBar: true,
                showConfirmButton: false,
            });
            router.push('/dashboard/employees');
        } else {
            const errorMessages = Object.values(responseData.errors || {}).flat().join('\n') || responseData.message;
            Swal.fire({
                title: 'Error',
                text: errorMessages,
                icon: 'error',
                background: '#1e293b',
                color: '#f8fafc',
            });
        }
    } catch (error) {
        console.error("Submit error:", error);
         Swal.fire({
            title: "Network Error",
            text: "An unexpected network error occurred.",
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
            <Link href="/dashboard/employees" className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors">
                <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
                    <Users className="w-6 h-6" /> Edit Employee
                </h1>
                <p className="mt-1 text-sm text-gray-400">
                    {loading ? "Loading..." : `Editing: ${initialData?.name}`}
                </p>
            </div>
        </div>
      <div className="bg-gray-900 p-6 rounded-lg">
        {loading || !initialData ? (
            <div className="flex flex-col items-center justify-center min-h-[40vh]">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500"></div>
              <p className="mt-4 text-gray-400">Loading Form Data...</p>
            </div>
        ) : (
          <EmployeeForm
            initialData={initialData}
            onSubmit={handleSubmit}
            isSaving={isSaving}
            divisions={divisions}
            positions={positions}
          />
        )}
      </div>
    </div>
  );
}
