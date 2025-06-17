"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Cookies from "js-cookie";
import Link from "next/link";
import {
  ChevronLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Cake,
  Building,
  Hash,
  Calendar,
  BadgeCheck,
  BadgeX,
} from "lucide-react";
import Image from "next/image";

// --- Interface Definitions ---
interface Division {
  name: string;
}
interface Position {
  name: string;
}
interface EmployeeDetail {
  id: number;
  name: string;
  nik: string;
  employee_number: string;
  gender: string;
  place_of_birth: string;
  date_of_birth: string;
  email: string;
  phone_number: string;
  address: string;
  date_of_entry: string;
  region: string;
  is_active: number;
  photo_url: string;
  division: Division;
  position: Position;
}

const DetailItem = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | React.ReactNode;
}) => (
  <div>
    <dt className="text-sm font-medium text-gray-400 flex items-center gap-2">
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </dt>
    <dd className="mt-1 text-base text-white">{value || "-"}</dd>
  </div>
);

export default function EmployeeDetailPage() {
  const params = useParams();
  const { id } = params;
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const fetchDetail = async () => {
        setLoading(true);
        setError(null);
        try {
          const token = Cookies.get("token");
          const res = await fetch(`http://report-api.test/api/employee/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          });
          if (!res.ok) throw new Error("Failed to fetch employee details.");
          const json = await res.json();
          if (!json.status) throw new Error(json.message);
          setEmployee(json.data);
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
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
        <span className="mt-4 text-gray-400">Loading Employee Details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-400 bg-red-900/20 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-2">An Error Occurred</h2>
        <p>{error}</p>
        <Link
          href="/dashboard/employees"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to List
        </Link>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-12 text-gray-400">Employee not found.</div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <User className="w-8 h-8 text-blue-400" />
          Employee Details
        </h1>
        <Link
          href="/dashboard/employees"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to List
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Kolom Kiri - Info Utama */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gray-900 p-6 rounded-2xl shadow-lg border border-gray-800 text-center">
            <Image
              src={
                employee.photo_url ||
                `https://placehold.co/128x128/1f2937/F9FAFB?text=${employee.name.charAt(
                  0
                )}`
              }
              alt={employee.name}
              width={128}
              height={128}
              className="rounded-full mx-auto mb-4 object-cover border-4 border-gray-700"
            />
            <h2 className="text-2xl font-bold text-white">{employee.name}</h2>
            <p className="text-blue-400 mt-1">{employee.position.name}</p>
            <p className="text-gray-400 text-sm">{employee.division.name}</p>

            <div
              className={`mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                employee.is_active
                  ? "bg-green-900/50 text-green-400"
                  : "bg-red-900/50 text-red-400"
              }`}
            >
              {employee.is_active ? (
                <BadgeCheck className="w-4 h-4" />
              ) : (
                <BadgeX className="w-4 h-4" />
              )}
              <span>{employee.is_active ? "Active" : "Inactive"}</span>
            </div>
          </div>
        </div>

        {/* Kolom Kanan - Detail Informasi */}
        <div className="lg:col-span-2">
          <div className="bg-gray-900 p-6 rounded-2xl shadow-lg border border-gray-800">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
              <DetailItem icon={Hash} label="NIK" value={employee.nik} />
              <DetailItem
                icon={Hash}
                label="Employee Number"
                value={employee.employee_number}
              />
              <DetailItem
                icon={Mail}
                label="Email Address"
                value={employee.email}
              />
              <DetailItem
                icon={Phone}
                label="Phone Number"
                value={employee.phone_number}
              />
              <DetailItem
                icon={Cake}
                label="Date of Birth"
                value={`${employee.place_of_birth}, ${new Date(
                  employee.date_of_birth
                ).toLocaleDateString("en-GB")}`}
              />
              <DetailItem icon={User} label="Gender" value={employee.gender} />
              <DetailItem
                icon={Calendar}
                label="Date of Entry"
                value={new Date(employee.date_of_entry).toLocaleDateString(
                  "en-GB"
                )}
              />
              <DetailItem
                icon={Building}
                label="Region"
                value={employee.region}
              />
              <div className="sm:col-span-2">
                <DetailItem
                  icon={MapPin}
                  label="Address"
                  value={employee.address}
                />
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
