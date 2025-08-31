"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Cookies from "js-cookie";
import Link from "next/link";
import {
  Edit,
  Trash2,
  Hospital,
  Plus,
  Search,
  X,
  Eye,
  FileDown,
} from "lucide-react";
import Swal from "sweetalert2";
import MultiSelectPopover from "@/components/ui/MultiSelectPopover";
import * as XLSX from "xlsx";

// --- Interface Definitions ---
interface TypeOfHealthFacility {
  id: number;
  name: string;
  slug: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface MedicalDevice {
  brand: string;
  model: string;
  serial_number: string;
  software_version?: string;
  status: string;
}

type Option = {
  label: string;
  value: string | number;
};

interface HealthFacility {
  medical_devices: MedicalDevice[] | boolean;
  id: number;
  type_of_health_facility_id: number;
  name: string;
  slug: string;
  email: string;
  phone_number: string;
  city: string;
  address: string;
  created_at: string;
  updated_at: string;
  type: TypeOfHealthFacility;
}

interface ExcelRow {
  "Tipe Fasilitas": string;
  "Nama Fasilitas": string;
  Email: string;
  "Nomor Telepon": string;
  Kota: string;
  Alamat: string;
  "Merek Perangkat": string;
  "Model Perangkat": string;
  "Nomor Seri": string;
  "Versi Software": string;
  "Status Perangkat": string;
}

export default function HealthFacilitiesClientPage() {
  const [healthFacilities, setHealthFacilities] = useState<HealthFacility[]>(
    []
  );
  const [healthFacilityTypes, setHealthFacilityTypes] = useState<
    TypeOfHealthFacility[]
  >([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalHealthFacility, setTotalHealthFacility] = useState(0);
  const [perPage, setPerPage] = useState(10);

  const [searchTerm, setSearchTerm] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get("search") || "";
    }
    return "";
  });
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [userRole, setUserRole] = useState<string>("");
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const [selectedTypeFilters, setSelectedTypeFilters] = useState<Option[]>(
    () => {
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const typeIds = urlParams.getAll("type_ids[]");
        // Ambil dari healthFacilityTypes jika perlu, atau simpan label via lookup
        return typeIds
          .map((id) => ({
            label: `Loading...`, // sementara
            value: parseInt(id, 10),
          }))
          .filter((item) => !isNaN(item.value));
      }
      return [];
    }
  );

  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const [cities, setCities] = useState<Option[]>([]);

  const fetchCities = async () => {
    try {
      const token = Cookies.get("token");
      if (!token) throw new Error("Unauthorized");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL_API}/api/health-facility/city`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch cities");
      const json = await res.json();

      if (json.data && Array.isArray(json.data)) {
        const cityOptions: Option[] = json.data
          .filter((c: { city: string }) => c.city && c.city !== "-")
          .map((c: { city: string }) => ({
            label: c.city,
            value: c.city,
          }));
        // const fetchCities = async () => {
        //   try {
        //     const token = Cookies.get("token");
        //     if (!token) throw new Error("Unauthorized");

        //     const res = await fetch(
        //       `${process.env.NEXT_PUBLIC_BASE_URL_API}/api/health-facility/city`,
        //       {
        //         headers: {
        //           Authorization: `Bearer ${token}`,
        //           Accept: "application/json",
        //         },
        //       }
        //     );

        //     if (!res.ok) throw new Error("Failed to fetch cities");
        //     const json = await res.json();

        //     if (json.data && Array.isArray(json.data)) {
        //       const cityOptions: Option[] = json.data
        //         .filter((c: { city: string }) => c.city && c.city !== "-")
        //         .map((c: { city: string }) => ({
        //           label: c.city,
        //           value: c.city,
        //         }))
        //         .sort((a: Option, b: Option) => a.label.localeCompare(b.label));

        //       setCities(cityOptions);
        //     }
        //   } catch (err) {
        //     console.error("Error fetching cities:", err);
        //     setCities([]);
        //   }
        // };

        setCities(cityOptions);
      }
    } catch (err) {
      console.error("Error fetching cities:", err);
      setCities([]);
    }
  };


  const handleExport = async () => {
    setIsExporting(true);
    const token = Cookies.get("token");

    if (!token) {
      Swal.fire({
        title: "Gagal",
        text: "Token otentikasi tidak ditemukan. Silakan login kembali.",
        icon: "error",
        background: "#1e293b",
        color: "#f8fafc",
      });
      setIsExporting(false);
      return;
    }

    Swal.fire({
      title: "Mengekspor Data",
      text: "Mohon tunggu, kami sedang menyiapkan file Anda...",
      allowOutsideClick: false,
      background: "#1e293b",
      color: "#f8fafc",
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      // --- Ambil filter aktif ---
      const typeIds = selectedTypeFilters.map((f) => f.value);
      const cityValues = selectedCityFilters.map((c) => c.value);

      const params = new URLSearchParams();
      params.append("all_health_facilities", "true"); // ✅ ambil semua data

      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }
      if (typeIds.length > 0) {
        typeIds.forEach((id) => params.append("type_ids[]", id.toString()));
      }
      if (cityValues.length > 0) {
        cityValues.forEach((city) =>
          params.append("cities[]", city.toString())
        );
      }

      console.log("Export params:", params.toString());

      // --- Fetch semua data list sesuai filter ---
      const listRes = await fetch(
        `${
          process.env.NEXT_PUBLIC_BASE_URL_API
        }/api/health-facility?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      if (!listRes.ok) {
        throw new Error(
          `Gagal mengambil daftar fasilitas kesehatan. Status: ${listRes.status}`
        );
      }

      const listJson = await listRes.json();

      let facilitiesToFetch: HealthFacility[] = [];
      if (listJson.data && Array.isArray(listJson.data)) {
        facilitiesToFetch = listJson.data;
      } else if (Array.isArray(listJson)) {
        facilitiesToFetch = listJson;
      }

      if (facilitiesToFetch.length === 0) {
        throw new Error("Tidak ada data yang tersedia untuk diekspor.");
      }

      // --- Ambil detail tiap fasilitas (medical_devices) ---
      const detailResults = await Promise.all(
        facilitiesToFetch.map(async (facility) => {
          try {
            const detailRes = await fetch(
              `${process.env.NEXT_PUBLIC_BASE_URL_API}/api/health-facility/${facility.slug}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  Accept: "application/json",
                },
              }
            );
            if (detailRes.ok) {
              const detailJson = await detailRes.json();
              return detailJson.data || detailJson;
            }
            return facility;
          } catch {
            return facility;
          }
        })
      );

      const facilitiesWithDetails = detailResults.filter(
        Boolean
      ) as HealthFacility[];

      // --- Siapkan data Excel ---
      const excelData: ExcelRow[] = [];
      facilitiesWithDetails.forEach((facility) => {
        const devices = Array.isArray(facility.medical_devices)
          ? facility.medical_devices
          : [];

        if (devices.length > 0) {
          devices.forEach((device, index) => {
            excelData.push({
              "Tipe Fasilitas": index === 0 ? facility.type?.name ?? "-" : "",
              "Nama Fasilitas": index === 0 ? facility.name ?? "-" : "",
              Email: index === 0 ? facility.email ?? "-" : "",
              "Nomor Telepon": index === 0 ? facility.phone_number ?? "-" : "",
              Kota: index === 0 ? facility.city ?? "-" : "",
              Alamat: index === 0 ? facility.address ?? "-" : "",
              "Merek Perangkat": device.brand ?? "-",
              "Model Perangkat": device.model ?? "-",
              "Nomor Seri": device.serial_number ?? "-",
              "Versi Software": device.software_version ?? "-",
              "Status Perangkat": device.status ?? "-",
            });
          });
        } else {
          excelData.push({
            "Tipe Fasilitas": facility.type?.name ?? "-",
            "Nama Fasilitas": facility.name ?? "-",
            Email: facility.email ?? "-",
            "Nomor Telepon": facility.phone_number ?? "-",
            Kota: facility.city ?? "-",
            Alamat: facility.address ?? "-",
            "Merek Perangkat": "-",
            "Model Perangkat": "-",
            "Nomor Seri": "-",
            "Versi Software": "-",
            "Status Perangkat": "-",
          });
        }
      });

      if (excelData.length === 0) {
        throw new Error("Tidak ada data yang dapat diekspor.");
      }

      // --- Generate file Excel ---
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Fasilitas Kesehatan");

      worksheet["!cols"] = Object.keys(excelData[0]).map((key) => ({
        wch: Math.max(key.length, 20),
      }));

      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, "-");
      XLSX.writeFile(workbook, `Laporan_Fasilitas_Kesehatan_${timestamp}.xlsx`);

      Swal.fire({
        title: "Ekspor Berhasil!",
        text: `Data ${facilitiesWithDetails.length} fasilitas berhasil diekspor.`,
        icon: "success",
        background: "#1e293b",
        color: "#f8fafc",
      });
    } catch (err) {
      Swal.fire({
        title: "Ekspor Gagal",
        text: err instanceof Error ? err.message : "Terjadi kesalahan.",
        icon: "error",
        background: "#1e293b",
        color: "#f8fafc",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Menggunakan logika permission yang benar (dengan super-admin check)
  const hasPermission = (slug: string) => {
    if (userRole.toLowerCase() === "super-admin") {
      return true;
    }
    return userPermissions.includes(slug);
  };

  const fetchHealthFacilityTypes = async () => {
    try {
      const token = Cookies.get("token");
      if (!token) throw new Error("Unauthorized");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL_API}/api/type-of-health-facility?per_page=All`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch health facility types");
      const json = await res.json();
      setHealthFacilityTypes(Array.isArray(json.data) ? json.data : []);
    } catch (err) {
      console.error("Error fetching health facility types:", err);
      setHealthFacilityTypes([]);
    }
  };

  const fetchHealthFacilities = useCallback(
    async (
      page: number = 1,
      search: string = "",
      typeIds: number[] = [],
      cities: string[] = []
    ) => {
      setLoading(true);
      setError(null);
      try {
        const token = Cookies.get("token");
        if (!token) throw new Error("Unauthorized");

        const params = new URLSearchParams();
        params.append("page", page.toString());
        if (search.trim()) params.append("search", search);
        if (typeIds.length > 0) {
          typeIds.forEach((id) => params.append("type_ids[]", id.toString()));
        }
        if (cities.length > 0) {
          cities.forEach((city) => params.append("cities[]", city.toString()));
        }

        const res = await fetch(
          `${
            process.env.NEXT_PUBLIC_BASE_URL_API
          }/api/health-facility?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        if (!res.ok) throw new Error("Failed to fetch health facilities");
        const json = await res.json();

        setHealthFacilities(Array.isArray(json.data) ? json.data : []);
        setCurrentPage(json.meta.current_page);
        setTotalPages(json.meta.last_page);
        setTotalHealthFacility(json.meta.total);
        setPerPage(json.meta.per_page);
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : "Error fetching health facilities"
        );
        setHealthFacilities([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You will not be able to recover this health facility!",
      icon: "warning",
      showCancelButton: true,
      background: "#1e293b",
      color: "#f8fafc",
      confirmButtonText: "Yes, delete it!",
      confirmButtonColor: "#dc2626",
    });

    if (result.isConfirmed) {
      try {
        const token = Cookies.get("token");
        if (!token) throw new Error("Token not found");

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL_API}/api/health-facility/${id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        if (res.ok) {
          Swal.fire({
            title: "Deleted!",
            text: "Health facility has been deleted.",
            icon: "success",
            background: "#1e293b",
            color: "#f8fafc",
            timer: 2000,
            showConfirmButton: false,
            timerProgressBar: true,
          });
          // Re-fetch data for the current page
          const typeIds = selectedTypeFilters.map((item) => item.value);
          fetchHealthFacilities(currentPage, searchTerm, typeIds as number[]);
        } else {
          const errorData = await res.json();
          Swal.fire({
            title: "Error",
            text: errorData.message || "Failed to delete health facility",
            icon: "error",
            background: "#1e293b",
            color: "#f8fafc",
          });
        }
      } catch (error) {
        console.error("Error deleting health facility:", error);
        Swal.fire({
          title: "Error",
          text: "An unexpected error occurred.",
          icon: "error",
          background: "#1e293b",
          color: "#f8fafc",
        });
      }
    }
  };

  const handleMultiDelete = async () => {
    if (selectedItems.size === 0) return;

    const selectedHealthFacilities = healthFacilities.filter((cat) =>
      selectedItems.has(cat.id)
    );
    const healthFacilityNames = selectedHealthFacilities
      .map((cat) => cat.name)
      .join(", ");

    const result = await Swal.fire({
      title: "Delete Multiple Health Facilities?",
      html: `
          <p>You are about to delete <strong>${selectedItems.size}</strong> health facilities:</p>
          <p style="font-size: 14px; color: #9CA3AF; margin-top: 8px;">${healthFacilityNames}</p>
          <p style="color: #EF4444; margin-top: 12px;">This action cannot be undone!</p>
        `,
      icon: "warning",
      showCancelButton: true,
      background: "#111827",
      color: "#F9FAFB",
      confirmButtonText: "Yes, delete all!",
      confirmButtonColor: "#EF4444",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      setIsDeleting(true);
      try {
        const token = Cookies.get("token");
        if (!token) throw new Error("Token not found");

        const deletePromises = Array.from(selectedItems).map((id) =>
          fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL_API}/api/health-facility/${id}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
              },
            }
          )
        );

        const results = await Promise.allSettled(deletePromises);
        const successCount = results.filter(
          (res) => res.status === "fulfilled" && res.value.ok
        ).length;
        const failedCount = selectedItems.size - successCount;

        if (failedCount === 0) {
          Swal.fire({
            title: "Success!",
            text: `Successfully deleted ${successCount} health facilities.`,
            icon: "success",
            background: "#1e293b",
            color: "#f8fafc",
          });
        } else {
          Swal.fire({
            title: "Partially Completed",
            text: `Deleted ${successCount} successfully. ${failedCount} failed.`,
            icon: "warning",
            background: "#1e293b",
            color: "#f8fafc",
          });
        }
      } catch (error) {
        console.error("Error in multi-delete:", error);
        Swal.fire({
          title: "Error",
          text: "An error occurred during multi-delete.",
          icon: "error",
          background: "#1e293b",
          color: "#f8fafc",
        });
      } finally {
        setIsDeleting(false);
        setSelectedItems(new Set());
        // Re-fetch the first page
        fetchHealthFacilities(
          1,
          searchTerm,
          selectedTypeFilters.map((f) => f.value as number),
          selectedCityFilters.map((c) => c.value as string)
        );
      }
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(healthFacilities.map((item) => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) newSelected.add(id);
    else newSelected.delete(id);
    setSelectedItems(newSelected);
  };

  // const cityOptions: Option[] = Array.from(
  //   new Set(healthFacilities.map((hf) => hf.city).filter(Boolean))
  // )
  //   .map(
  //     (city: string): Option => ({
  //       label: city,
  //       value: city, // ✅ string → cocok dengan Option['value']
  //     })
  //   )
  //   .sort((a, b) => a.label.localeCompare(b.label));

  useEffect(() => {
    const initializeData = async () => {
      const storedPermissions = Cookies.get("permissions");
      const storedRole = Cookies.get("role");

      if (storedPermissions) {
        try {
          setUserPermissions(JSON.parse(storedPermissions));
        } catch {
          setUserPermissions([]);
        }
      }
      if (storedRole) setUserRole(storedRole);

      await Promise.all([
        fetchHealthFacilityTypes(),
        fetchHealthFacilities(1),
        fetchCities(),
      ]);
    };
    initializeData();
  }, [fetchHealthFacilities]);

  const [selectedCityFilters, setSelectedCityFilters] = useState<Option[]>(
    () => {
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const cities = urlParams.getAll("cities[]"); // 🔄 ganti dari "city"
        return cities.map((city) => ({ label: city, value: city }));
      }
      return [];
    }
  );

  useEffect(() => {
    if (healthFacilityTypes.length > 0 && selectedTypeFilters.length > 0) {
      const typeMap = new Map(healthFacilityTypes.map((t) => [t.id, t.name]));
      const updated = selectedTypeFilters
        .map((f) => ({
          label: typeMap.get(f.value as number) || `Unknown Type (${f.value})`,
          value: f.value,
        }))
        .filter((f) => typeof f.value === "number"); // pastikan value tetap number

      if (updated.some((f, i) => f.label !== selectedTypeFilters[i]?.label)) {
        setSelectedTypeFilters(updated);
      }
    }
  }, [healthFacilityTypes, selectedTypeFilters]);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(() => {
      const typeIds = selectedTypeFilters.map((item) => item.value);
      const cities = selectedCityFilters.map((item) => item.value);

      const params = new URLSearchParams();
      if (searchTerm.trim()) params.set("search", searchTerm.trim());
      if (typeIds.length > 0) {
        typeIds.forEach((id) => params.append("type_ids[]", id.toString()));
      }
      if (cities.length > 0) {
        cities.forEach((city) => params.append("cities[]", city.toString()));
      }

      const newUrl = `/dashboard/health-facilities?${params.toString()}`;
      window.history.replaceState(null, "", newUrl);

      fetchHealthFacilities(
        1,
        searchTerm,
        typeIds as number[],
        cities as string[]
      );
    }, 400);

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [
    searchTerm,
    selectedTypeFilters,
    selectedCityFilters,
    fetchHealthFacilities,
  ]);

  const handlePageChange = useCallback(
    (page: number) => {
      if (page >= 1 && page <= totalPages) {
        const typeIds = selectedTypeFilters.map((item) => item.value as number);
        const cities = selectedCityFilters.map((item) => item.value as string);

        fetchHealthFacilities(page, searchTerm, typeIds, cities);
      }
    },
    [
      searchTerm,
      totalPages,
      fetchHealthFacilities,
      selectedTypeFilters,
      selectedCityFilters,
    ]
  );

  const getPaginationNumbers = () => {
    const delta = 2;
    const range = [];
    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      range.unshift("...");
    }
    if (currentPage + delta < totalPages - 1) {
      range.push("...");
    }

    range.unshift(1);
    if (totalPages > 1) {
      range.push(totalPages);
    }

    // Remove duplicates that can arise in small number of pages
    return [...new Set(range)];
  };

  const isAllSelected =
    healthFacilities.length > 0 &&
    selectedItems.size === healthFacilities.length;
  const isIndeterminate = selectedItems.size > 0 && !isAllSelected;

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[40vh] bg-gray-900 rounded-lg">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500"></div>
          <p className="mt-4 text-gray-400">Loading Health Facilities...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-900/20 text-red-400 p-6 rounded-lg text-center min-h-[40vh] flex flex-col justify-center items-center">
          <h3 className="text-lg font-bold">Failed to load data</h3>
          <p>{error}</p>
        </div>
      );
    }

    if (healthFacilities.length === 0) {
      return (
        <div className="bg-gray-900 rounded-lg text-center min-h-[40vh] flex flex-col justify-center items-center p-6">
          <Hospital className="w-16 h-16 text-gray-600 mb-4" />
          <h3 className="text-xl font-semibold text-white">
            No Health Facilities Found
          </h3>
          <p className="text-gray-500 mt-2 max-w-sm">
            {searchTerm || selectedTypeFilters.length > 0
              ? "Try adjusting your search or filter."
              : "Get started by adding a new health facility."}
          </p>
        </div>
      );
    }

    return (
      <>
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800 text-white">
                <tr>
                  {hasPermission("delete-health-facility") && (
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = isIndeterminate;
                        }}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                      />
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Facility Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {healthFacilities.map((facility, index) => (
                  <tr key={facility.id} className="hover:bg-gray-800">
                    {hasPermission("delete-health-facility") && (
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(facility.id)}
                          onChange={(e) =>
                            handleSelectItem(facility.id, e.target.checked)
                          }
                          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {(currentPage - 1) * perPage + index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-white font-medium uppercase">
                          {facility.name}
                        </div>
                        <div className="text-gray-400 text-sm">
                          <code className="px-2 py-1 bg-gray-700 rounded text-xs">
                            {facility.slug}
                          </code>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      <span className="px-2 py-1 bg-blue-600 text-white rounded text-sm">
                        {facility.type?.name || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm">
                      <div>
                        <div>{facility.email || "-"}</div>
                        <div className="text-gray-400">
                          {facility.phone_number || "-"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm">
                      <div>
                        <div className="font-medium">
                          {facility.city || "-"}
                        </div>
                        <div className="text-gray-400 truncate max-w-xs">
                          {facility.address || "-"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {hasPermission("show-health-facility") && (
                          <Link
                            href={`/dashboard/health-facilities/${facility.slug}`}
                            className="text-blue-400 hover:text-blue-300 p-1 cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        )}
                        {hasPermission("update-health-facility") && (
                          <Link
                            href={`/dashboard/health-facilities/${facility.slug}/edit`}
                            className="text-green-400 hover:text-green-300 p-1 cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                        )}
                        {hasPermission("delete-health-facility") && (
                          <button
                            onClick={() => handleDelete(facility.id)}
                            className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
            <div className="text-sm text-gray-400">
              Showing {(currentPage - 1) * perPage + 1} to{" "}
              {Math.min(currentPage * perPage, totalHealthFacility)} of{" "}
              {totalHealthFacility} results
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="cursor-pointer px-3 py-2 text-sm border border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 text-gray-300 transition-colors"
              >
                Previous
              </button>
              {getPaginationNumbers().map((page, index) =>
                page === "..." ? (
                  <span key={index} className="px-3 py-2 text-sm text-gray-500">
                    ...
                  </span>
                ) : (
                  <button
                    key={index}
                    onClick={() => handlePageChange(page as number)}
                    className={`px-3 py-2 text-sm border rounded-md transition-colors cursor-pointer ${
                      currentPage === page
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-gray-600 text-gray-300 hover:bg-gray-700"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="cursor-pointer px-3 py-2 text-sm border border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 text-gray-300 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-white">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Hospital className="w-6 h-6" /> Health Facilities Management
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Manage health facilities and their information
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedItems.size > 0 &&
            hasPermission("delete-health-facility") && (
              <button
                onClick={handleMultiDelete}
                disabled={isDeleting}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isDeleting
                  ? "Deleting..."
                  : `Delete ${selectedItems.size} Items`}
              </button>
            )}
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileDown className="w-4 h-4 mr-2" />
            {isExporting ? "Exporting..." : "Export to Excel"}
          </button>
          {hasPermission("create-health-facility") && (
            <Link
              href="/dashboard/health-facilities/create"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Health Facility
            </Link>
          )}
        </div>
      </div>

      <div className="bg-gray-900 p-4 rounded-lg">
        <div className="flex flex-col md:flex-row justify-between items-center gap-2">
          <div className="relative w-full md:w-1/2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search health facilities by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-800 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none bg-gray-800 text-white"
            />
            {searchTerm && (
              <X
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 cursor-pointer hover:text-white"
                onClick={() => setSearchTerm("")}
              />
            )}
          </div>
          <div className="w-full md:w-1/2">
            <MultiSelectPopover
              options={healthFacilityTypes.map((type) => ({
                label: type.name,
                value: type.id,
              }))}
              selected={selectedTypeFilters}
              onChange={setSelectedTypeFilters} // ✅ Sekarang OK: Option[] => Option[]
              placeholder="Filter by facility type"
            />
          </div>

          <div className="w-full md:w-1/2">
            <MultiSelectPopover
              options={cities}
              selected={selectedCityFilters}
              onChange={setSelectedCityFilters}
              placeholder="Filter by city"
            />
          </div>

          {(selectedTypeFilters.length > 0 ||
            selectedCityFilters.length > 0 ||
            searchTerm.trim() !== "") && (
            <button
              onClick={() => {
                setSelectedTypeFilters([]);
                setSelectedCityFilters([]);
                setSearchTerm("");
              }}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-300 hover:text-white transition cursor-pointer"
              title="Clear filter"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {selectedItems.size > 0 && (
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
          <p className="text-blue-300 text-sm">
            {selectedItems.size} item{selectedItems.size > 1 ? "s" : ""}{" "}
            selected
            <button
              onClick={() => setSelectedItems(new Set())}
              className="ml-2 text-blue-400 hover:text-blue-300 underline cursor-pointer"
            >
              Clear selection
            </button>
          </p>
        </div>
      )}

      {renderContent()}
    </div>
  );
}
