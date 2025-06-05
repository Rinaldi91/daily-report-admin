"use client";

import { useEffect, useState, useRef } from "react";
import Cookies from "js-cookie";
import { Eye, Edit, Trash2, Building2, Plus, Search } from "lucide-react";
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
}

export default function HealthFacilitiesPage() {
  const [healthFacilities, setHealthFacilities] = useState<HealthFacility[]>([]);
  const [healthFacilityTypes, setHealthFacilityTypes] = useState<TypeOfHealthFacility[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<FormHealthFacility>({
    type_of_health_facility_id: "",
    name: "",
    slug: "",
    email: "",
    phone_number: "",
    city: "",
    address: "",
  });

  const hasPermission = (slug: string) => userPermissions.includes(slug);

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

  const fetchHealthFacilities = async (page: number = 1, search: string = "") => {
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
      setCurrentPage(json.meta?.current_page || 1);
      setTotalPages(json.meta?.last_page || 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error fetching health facilities");
      setHealthFacilities([]);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleEdit = (facility: HealthFacility) => {
    setFormData({
      id: facility.id,
      type_of_health_facility_id: facility.type_of_health_facility_id.toString(),
      name: facility.name || "",
      slug: facility.slug || "",
      email: facility.email || "",
      phone_number: facility.phone_number || "",
      city: facility.city || "",
      address: facility.address || "",
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
        type_of_health_facility_id: parseInt(formData.type_of_health_facility_id),
        name: formData.name,
        slug: formData.slug || generateSlug(formData.name),
        email: formData.email,
        phone_number: formData.phone_number,
        city: formData.city,
        address: formData.address,
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
        });
        fetchHealthFacilities();
        Swal.fire("Success", "Health facility has been saved", "success");
      } else {
        const errorData = await res.json();
        console.error("Error response:", errorData);
        
        if (errorData.errors) {
          const errorMessages = Object.values(errorData.errors).flat().join("\n");
          Swal.fire("Validation Error", errorMessages, "error");
        } else {
          Swal.fire("Error", errorData.message || "Failed to save health facility", "error");
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

        const res = await fetch(`http://report-api.test/api/health-facility/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (res.ok) {
          fetchHealthFacilities();
          Swal.fire("Deleted!", "Health facility has been deleted.", "success");
        } else {
          const errorData = await res.json();
          Swal.fire("Error", errorData.message || "Failed to delete health facility", "error");
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
        fetchHealthFacilities()
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
      setFormData(prev => ({
        ...prev,
        slug: generateSlug(prev.name)
      }));
    }
  }, [formData.name, formData.id]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      fetchHealthFacilities(page, searchTerm);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
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
              <Building2 className="w-6 h-6" /> Health Facilities Management
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
                {Array.isArray(healthFacilities) && healthFacilities.map((facility) => (
                  <tr key={facility.id} className="hover:bg-gray-800">
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
                        <div className="text-gray-400">{facility.phone_number || "-"}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm">
                      <div>
                        <div className="font-medium">{facility.city || "-"}</div>
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
                          <button className="text-blue-400 hover:text-blue-300 p-1 cursor-pointer">
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

                {(!Array.isArray(healthFacilities) || healthFacilities.length === 0) && !loading && (
                  <tr>
                    <td
                      colSpan={6}
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
          <div className="flex justify-center space-x-2">
            {[...Array(totalPages)].map((_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-4 py-2 text-sm border rounded-md transition-colors cursor-pointer ${
                    currentPage === page
                      ? "bg-blue-600 text-white border-blue-600"
                      : "border-gray-600 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Modal */}
      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 bg-gray-800 text-white p-6 rounded-lg w-[90%] max-w-2xl -translate-x-1/2 -translate-y-1/2 max-h-[90vh] overflow-y-auto">
            <Dialog.Title className="text-xl font-bold mb-4">
              {formData.id ? "Edit Health Facility" : "Add Health Facility"}
            </Dialog.Title>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Facility Name *</label>
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
                  <label className="block text-sm font-medium mb-1">Type *</label>
                  <select
                    value={formData.type_of_health_facility_id}
                    onChange={(e) =>
                      setFormData({ ...formData, type_of_health_facility_id: e.target.value })
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
                <label className="block text-sm font-medium mb-1">Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  placeholder="e.g., rsu-sehat-selalu"
                  className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Auto-generated from name, but you can customize it
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
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
                  <label className="block text-sm font-medium mb-1">Phone Number</label>
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
                <label className="block text-sm font-medium mb-1">Address</label>
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
                className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!formData.name.trim() || !formData.type_of_health_facility_id}
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {formData.id ? "Update" : "Create"}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}