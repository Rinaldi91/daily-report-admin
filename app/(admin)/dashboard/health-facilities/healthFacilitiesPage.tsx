"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Cookies from "js-cookie";
import {
  Edit,
  Trash2,
  Hospital,
  Plus,
  Search,
  X,
  Save,
  Eye,
} from "lucide-react";
import Swal from "sweetalert2";
import * as Dialog from "@radix-ui/react-dialog";

interface TypeOfHealthFacility {
  id: number;
  name: string;
  slug: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface MedicalDevice {
  id: number;
  medical_device_category_id: number;
  brand: string;
  model: string;
  serial_number: string;
  software_version?: string | null;
  status: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
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
  created_at: string;
  updated_at: string;
  type: TypeOfHealthFacility;
}

interface FormHealthFacility {
  id?: number;
  type_of_health_facility_id: string;
  name: string;
  slug: string;
  email: string;
  phone_number: string;
  city: string;
  address: string;
  medical_device_ids: number[];
}

interface HealthFacilityDetail extends HealthFacility {
  medical_devices: MedicalDevice[];
}

export default function HealthFacilitiesPage() {
  const [healthFacilities, setHealthFacilities] = useState<HealthFacility[]>(
    []
  );
  const [healthFacilityTypes, setHealthFacilityTypes] = useState<
    TypeOfHealthFacility[]
  >([]);
  const [medicalDevices, setMedicalDevices] = useState<MedicalDevice[]>([]);
  const [filteredDevices, setFilteredDevices] = useState<MedicalDevice[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalHealthFacility, setTotalHealthFacility] = useState(0);
  const [perPage, setPerPage] = useState(10);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedFacility, setSelectedFacility] =
    useState<HealthFacilityDetail | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<FormHealthFacility>({
    type_of_health_facility_id: "",
    name: "",
    slug: "",
    email: "",
    phone_number: "",
    city: "",
    address: "",
    medical_device_ids: [],
  });

  const hasPermission = (slug: string) => userPermissions.includes(slug);

  const fetchMedicalDevices = async () => {
    try {
      const token = Cookies.get("token");
      const res = await fetch(
        `http://report-api.test/api/medical-device?page_all=All`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      const json = await res.json();
      setMedicalDevices(json.data || []);
    } catch {
      console.error("Failed to fetch medical devices:");
      setMedicalDevices([]);
    }
  };

  const fetchHealthFacilityTypes = async () => {
    try {
      const token = Cookies.get("token");
      if (!token) throw new Error("Unauthorized");

      const res = await fetch(
        `http://report-api.test/api/type-of-health-facility?per_page=All`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch health facility types");
      const json = await res.json();

      const typesData = Array.isArray(json.data)
        ? json.data.map((t: Partial<TypeOfHealthFacility>) => ({
            id: t.id || 0,
            name: t.name || "",
            slug: t.slug || "",
            description: t.description || "",
            created_at: t.created_at || "",
            updated_at: t.updated_at || "",
          }))
        : [];

      setHealthFacilityTypes(typesData);
    } catch (err: unknown) {
      console.error("Error fetching health facility types:", err);
      setHealthFacilityTypes([]);
    }
  };

  const handleShowDetail = async (slug: string) => {
    try {
      const token = Cookies.get("token");
      const res = await fetch(
        `http://report-api.test/api/health-facility/${slug}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      const json = await res.json();
      if (json?.data) {
        setSelectedFacility(json.data);
        setDetailModalOpen(true);
      } else {
        Swal.fire("Error", "Failed to retrieve detail", "error");
      }
    } catch {
      Swal.fire("Error", "Network error while fetching detail", "error");
    }
  };

  const fetchHealthFacilities = async (
    page: number = 1,
    search: string = ""
  ) => {
    try {
      setLoading(true);
      setError(null);
      const token = Cookies.get("token");
      if (!token) throw new Error("Unauthorized");

      const params = new URLSearchParams();
      params.append("page", page.toString());
      if (search.trim()) params.append("search", search);

      const res = await fetch(
        `http://report-api.test/api/health-facility?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch health facilities");
      const json = await res.json();

      const facilitiesData = Array.isArray(json.data)
        ? json.data.map((f: Partial<HealthFacility>) => ({
            id: f.id || 0,
            type_of_health_facility_id: f.type_of_health_facility_id || 0,
            name: f.name || "",
            slug: f.slug || "",
            email: f.email || "",
            phone_number: f.phone_number || "",
            city: f.city || "",
            address: f.address || "",
            created_at: f.created_at || "",
            updated_at: f.updated_at || "",
            type: f.type || {
              id: 0,
              name: "",
              slug: "",
              description: "",
              created_at: "",
              updated_at: "",
            },
          }))
        : [];

      setHealthFacilities(facilitiesData);
      setCurrentPage(json.meta.current_page);
      setTotalPages(json.meta.last_page);
      setTotalHealthFacility(json.meta.total);
      setPerPage(json.meta.per_page);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Error fetching health facilities"
      );
      setHealthFacilities([]);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleEdit = (facility: HealthFacility) => {
    setFormData({
      id: facility.id,
      type_of_health_facility_id:
        facility.type_of_health_facility_id.toString(),
      name: facility.name || "",
      slug: facility.slug || "",
      email: facility.email || "",
      phone_number: facility.phone_number || "",
      city: facility.city || "",
      address: facility.address || "",
      medical_device_ids: formData.medical_device_ids,
    });
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setFormData({
      type_of_health_facility_id: "",
      name: "",
      slug: "",
      email: "",
      phone_number: "",
      city: "",
      address: "",
      medical_device_ids: formData.medical_device_ids,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const token = Cookies.get("token");
      if (!token) {
        throw new Error("Token not found");
      }

      const method = formData.id ? "PUT" : "POST";
      const url = formData.id
        ? `http://report-api.test/api/health-facility/${formData.id}`
        : "http://report-api.test/api/health-facility";

      const payload = {
        type_of_health_facility_id: parseInt(
          formData.type_of_health_facility_id
        ),
        name: formData.name,
        slug: formData.slug || generateSlug(formData.name),
        email: formData.email,
        phone_number: formData.phone_number,
        city: formData.city,
        address: formData.address,
        medical_device_ids: formData.medical_device_ids,
      };

      console.log("Submitting payload:", payload);

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log("Response status:", res.status);

      if (res.ok) {
        setIsModalOpen(false);
        setFormData({
          type_of_health_facility_id: "",
          name: "",
          slug: "",
          email: "",
          phone_number: "",
          city: "",
          address: "",
          medical_device_ids: formData.medical_device_ids,
        });
        fetchHealthFacilities();
        Swal.fire({
          title: "Success",
          text: "Health facility has been saved",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
          timerProgressBar: true,
          background: "#1f2937",
          color: "#F9FAFB",
          customClass: {
            popup: "rounded-xl p-6",
          },
        });
      } else {
        const errorData = await res.json();
        console.error("Error response:", errorData);

        if (errorData.errors) {
          const errorMessages = Object.values(errorData.errors)
            .flat()
            .join("\n");
          Swal.fire("Validation Error", errorMessages, "error");
        } else {
          Swal.fire(
            "Error",
            errorData.message || "Failed to save health facility",
            "error"
          );
        }
      }
    } catch (error) {
      console.error("Error saving health facility:", error);
      Swal.fire("Error", "Network error or server unavailable", "error");
    }
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You will not be able to recover this health facility!",
      icon: "warning",
      showCancelButton: true,
      background: "#111827",
      color: "#F9FAFB",
      customClass: {
        popup: "rounded-xl",
      },
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        const token = Cookies.get("token");
        if (!token) {
          throw new Error("Token not found");
        }

        const res = await fetch(
          `http://report-api.test/api/health-facility/${id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        if (res.ok) {
          fetchHealthFacilities();
          Swal.fire({
            title: "Deleted!",
            text: "Health facility has been deleted.",
            icon: "success",
            timer: 2000,
            showConfirmButton: false,
            timerProgressBar: true,
            background: "#1f2937",
            color: "#F9FAFB",
            customClass: {
              popup: "rounded-xl p-6",
            },
          });
        } else {
          const errorData = await res.json();
          Swal.fire(
            "Error",
            errorData.message || "Failed to delete health facility",
            "error"
          );
        }
      } catch (error) {
        console.error("Error deleting health facility:", error);
        Swal.fire("Error", "Failed to delete health facility", "error");
      }
    }
  };

  // Initial load
  useEffect(() => {
    const initializeData = async () => {
      const stored = Cookies.get("permissions");
      if (stored) {
        try {
          setUserPermissions(JSON.parse(stored));
        } catch {
          setUserPermissions([]);
        }
      }

      await Promise.all([
        fetchHealthFacilityTypes(),
        fetchHealthFacilities(),
        fetchMedicalDevices(),
      ]);
    };

    initializeData();
  }, []);

  // Search debounce
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchHealthFacilities(1, searchTerm);
    }, 400);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchTerm]);

  // Auto-generate slug when name changes
  useEffect(() => {
    if (formData.name) {
      setFormData((prev) => ({
        ...prev,
        slug: generateSlug(prev.name),
      }));
    }
  }, [formData.name, formData.id]);

  useEffect(() => {
    setFilteredDevices(medicalDevices);
  }, [medicalDevices]);

  const handlePageChange = useCallback(
    (page: number) => {
      if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
        fetchHealthFacilities(page, searchTerm);
      }
    },
    [searchTerm, totalPages, fetchHealthFacilities]
  );

  const getPaginationNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "-";
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-white">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Hospital className="w-6 h-6" /> Health Facilities Management
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              Manage health facilities and their information
            </p>
          </div>

          {hasPermission("create-health-facility") && (
            <button
              onClick={handleAdd}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Health Facility
            </button>
          )}
        </div>

        {/* Search */}
        <div className="bg-gray-900 p-4 rounded-lg">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search health facilities by name, city, or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-800 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none bg-gray-800 text-white"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800 text-white">
                <tr>
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
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {Array.isArray(healthFacilities) &&
                  healthFacilities.map((facility, index) => (
                    <tr key={facility.id} className="hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {(currentPage - 1) * perPage + index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-white font-medium">
                            {facility.name || ""}
                          </div>
                          <div className="text-gray-400 text-sm">
                            <code className="px-2 py-1 bg-gray-700 rounded text-xs">
                              {facility.slug || ""}
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
                      <td className="px-6 py-4 text-gray-400 text-sm">
                        {formatDate(facility.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {hasPermission("show-health-facility") && (
                            <button
                              onClick={() => handleShowDetail(facility.slug)}
                              className="text-blue-400 hover:text-blue-300 p-1 cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          {hasPermission("update-health-facility") && (
                            <button
                              onClick={() => handleEdit(facility)}
                              className="text-green-400 hover:text-green-300 p-1 cursor-pointer"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
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

                {(!Array.isArray(healthFacilities) ||
                  healthFacilities.length === 0) &&
                  !loading && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        No health facilities found.
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>

          {loading && (
            <div className="py-8 text-center text-gray-400">
              Loading health facilities...
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-400">
              Showing {(currentPage - 1) * perPage + 1} to{" "}
              {Math.min(currentPage * perPage, totalHealthFacility)} of {totalHealthFacility}{" "}
              results
            </div>

            <div className="flex items-center space-x-1">
              {/* Previous button */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="cursor-pointer px-3 py-2 text-sm border border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 text-gray-300 transition-colors"
              >
                Previous
              </button>

              {/* Page numbers */}
              {getPaginationNumbers().map((page, index) => (
                <div key={index}>
                  {page === "..." ? (
                    <span className="px-3 py-2 text-sm text-gray-500 cursor-pointer">
                      ...
                    </span>
                  ) : (
                    <button
                      onClick={() => handlePageChange(page as number)}
                      className={`px-3 py-2 text-sm border rounded-md transition-colors cursor-pointer ${
                        currentPage === page
                          ? "bg-blue-600 text-white border-blue-600"
                          : "border-gray-600 text-gray-300 hover:bg-gray-700"
                      }`}
                    >
                      {page}
                    </button>
                  )}
                </div>
              ))}

              {/* Next button */}
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
      </div>

      {/* Modal */}
      <Dialog.Root
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        modal={true}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content
            onPointerDownOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
            className="fixed top-1/2 left-1/2 bg-gray-800 text-white p-6 rounded-lg w-[95%] md:w-[900px] lg:w-[1000px] -translate-x-1/2 -translate-y-1/2 max-h-[90vh] overflow-y-auto"
          >
            <Dialog.Title className="text-xl font-bold mb-4 mt-7">
              {formData.id ? "Edit Health Facility" : "Add Health Facility"}
            </Dialog.Title>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Facility Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., RSU Sehat Selalu"
                    className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Type *
                  </label>
                  <select
                    value={formData.type_of_health_facility_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type_of_health_facility_id: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select facility type</option>
                    {healthFacilityTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Medical Devices
                </label>
                <input
                  type="text"
                  placeholder="Search medical device..."
                  onChange={(e) => {
                    const keyword = e.target.value.toLowerCase();
                    const filtered = medicalDevices.filter((device) =>
                      `${device.brand} ${device.model} ${device.serial_number}`
                        .toLowerCase()
                        .includes(keyword)
                    );
                    setFilteredDevices(filtered);
                  }}
                  className="w-full px-3 py-2 mb-2 rounded bg-gray-700 border border-gray-600 text-white"
                />
                <div className="max-h-[200px] overflow-y-auto border border-gray-600 rounded bg-gray-700 px-3 py-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
                    {filteredDevices.map((device) => (
                      <label
                        key={device.id}
                        className="flex items-center justify-between gap-2 bg-gray-800 px-3 py-2 rounded hover:bg-gray-600 cursor-pointer"
                      >
                        <span className="text-sm text-white truncate">
                          {device.brand} {device.model} - {device.serial_number}
                        </span>
                        <input
                          type="checkbox"
                          className="form-checkbox w-4 h-4 accent-blue-600"
                          checked={formData.medical_device_ids.includes(
                            device.id
                          )}
                          onChange={(e) => {
                            const selected = [...formData.medical_device_ids];
                            if (e.target.checked) {
                              selected.push(device.id);
                            } else {
                              const index = selected.indexOf(device.id);
                              if (index > -1) selected.splice(index, 1);
                            }
                            setFormData({
                              ...formData,
                              medical_device_ids: selected,
                            });
                          }}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="e.g., facility@example.com"
                    className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) =>
                      setFormData({ ...formData, phone_number: e.target.value })
                    }
                    placeholder="e.g., 081370197253"
                    className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  placeholder="e.g., Medan"
                  className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="e.g., Jl. Setia Luhur No. 1, Medan"
                  rows={3}
                  className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 cursor-pointer flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={
                  !formData.name.trim() || !formData.type_of_health_facility_id
                }
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
              >
                {formData.id ? (
                  <>
                    <Save className="w-4 h-4" />
                    Update
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create
                  </>
                )}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={detailModalOpen} onOpenChange={() => {}}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in-0" />
          <Dialog.Content
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                 bg-white dark:bg-gray-900 shadow-2xl rounded-2xl 
                 w-[95%] md:w-[850px] max-h-[90vh] 
                 animate-in fade-in-0 zoom-in-95 slide-in-from-left-1/2 slide-in-from-top-[48%]
                 border border-gray-200 dark:border-gray-700"
            onPointerDownOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
          >
            {/* Header dengan gradient */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl mt-9">
              <Dialog.Title className="text-2xl font-bold flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-6m-8 0H3m2 0h6M9 7h6m-6 4h6m-6 4h6m-6 4h6"
                    />
                  </svg>
                </div>
                Health Facility Details
              </Dialog.Title>
              <p className="text-blue-100 mt-2 text-sm">
                Complete information about the selected facility
              </p>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {selectedFacility ? (
                <div className="space-y-6">
                  {/* Basic Information Card */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-blue-600 dark:text-blue-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      Basic Information
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Facility Name
                          </label>
                          <p className="text-gray-900 dark:text-white font-medium">
                            {selectedFacility.name}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Type
                          </label>
                          <p>
                            <span className="inline-block mt-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                              {selectedFacility.type?.name}
                            </span>
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            City
                          </label>
                          <p className="text-gray-900 dark:text-white">
                            {selectedFacility.city}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Email
                          </label>
                          <p className="text-gray-900 dark:text-white break-all">
                            {selectedFacility.email}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Phone
                          </label>
                          <p className="text-gray-900 dark:text-white">
                            {selectedFacility.phone_number}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Address
                      </label>
                      <p className="text-gray-900 dark:text-white mt-1">
                        {selectedFacility.address}
                      </p>
                    </div>
                  </div>

                  {/* Medical Devices Card */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-green-600 dark:text-green-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                          />
                        </svg>
                      </div>
                      Medical Devices (
                      {selectedFacility.medical_devices?.length || 0})
                    </h3>

                    {selectedFacility.medical_devices?.length > 0 ? (
                      <div className="space-y-3">
                        {selectedFacility.medical_devices.map((device) => (
                          <div
                            key={device.id}
                            className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 dark:text-white">
                                  {device.brand} {device.model}
                                </h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  Serial: {device.serial_number}
                                </p>
                                <span className="px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 rounded-md text-xs font-medium">
                                  Software Version: {device.software_version}
                                </span>
                              </div>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${(() => {
                                  const status = device.status?.toLowerCase();
                                  if (status === "bagus") {
                                    return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
                                  } else if (status === "rusak") {
                                    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
                                  } else if (status === "maintenance") {
                                    return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
                                  } else if (
                                    status === "tidak digunakan / nonaktif"
                                  ) {
                                    return "bg-gray-300 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
                                  } else {
                                    return "bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200";
                                  }
                                })()}`}
                              >
                                {device.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <svg
                          className="w-12 h-12 mx-auto mb-3 opacity-50"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.291-1.1-5.7-2.836"
                          />
                        </svg>
                        <p>No medical devices registered</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600 dark:text-gray-400">
                    Loading facility details...
                  </span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 rounded-b-2xl border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-end">
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="px-6 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg 
                     font-medium transition-all duration-200 
                     hover:shadow-lg hover:scale-105 active:scale-95
                     focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
