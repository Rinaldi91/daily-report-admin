"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import Swal from "sweetalert2";
import EmployeeForm from "@/components/forms/EmployeeForm";
import { Users, ChevronLeft } from "lucide-react";
import Link from "next/link";

// --- Interface Definitions ---
interface Division { id: number; name: string; }
interface Position { id: number; name: string; }

export default function CreateEmployeePage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDropdownData = async () => {
      setLoading(true);
      try {
        const token = Cookies.get("token");
        if (!token) throw new Error("Unauthorized");
        
        const [divRes, posRes] = await Promise.all([
            fetch(`${process.env.NEXT_PUBLIC_BASE_URL_API}/api/division?all`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${process.env.NEXT_PUBLIC_BASE_URL_API}/api/position?all`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        const divJson = await divRes.json();
        const posJson = await posRes.json();

        setDivisions(divJson.data || []);
        setPositions(posJson.data || []);
      } catch (error) {
        console.error("Failed to fetch dropdown data", error);
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
    fetchDropdownData();
  }, []);

  const handleSubmit = async (data: FormData) => {
    setIsSaving(true);
    try {
        const token = Cookies.get("token");
        if (!token) throw new Error("Unauthorized");
        
        // Saat menggunakan FormData, browser akan otomatis mengatur Content-Type.
        // Jadi, kita tidak perlu menentukannya secara manual.
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL_API}/api/employee`, {
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
                text: 'Employee created successfully.',
                icon: 'success',
                background: '#1e293b',
                color: '#f8fafc',
                timer: 2000,
                timerProgressBar: true,
                showConfirmButton: false,
            });
            router.push('/dashboard/employees');
        } else {
            const errorMessages = Object.values(responseData.errors || {}).flat().join('\n') || responseData.message || "An unknown error occurred";
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
                    <Users className="w-6 h-6" /> Add New Employee
                </h1>
                <p className="mt-1 text-sm text-gray-400">Fill in the form to add a new employee.</p>
            </div>
        </div>
      <div className="bg-gray-900 p-6 rounded-lg">
        {loading ? (
           <div className="flex flex-col items-center justify-center min-h-[40vh]">
             <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500"></div>
             <p className="mt-4 text-gray-400">Loading Form...</p>
           </div>
        ) : (
          <EmployeeForm
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
