"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import Cookies from "js-cookie";
import {
  Edit,
  Trash2,
  Plus,
  Search,
  Save,
  PlusIcon,
  X,
  MonitorSmartphone,
  Pencil,
  PlusCircle,
  Eye,
  XCircle,
  MonitorCog,
} from "lucide-react";
import Swal from "sweetalert2";
import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import MultiSelectPopover from "@/components/ui/MultiSelectPopover";

interface Permission {
  id: number;
  name: string;
  slug: string;
}

interface Role {
  id: number;
  name: string;
  slug: string;
  description: string;
  permissions: Permission[];
}

interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string;
  created_at: string;
  updated_at: string;
  role: Role;
}

interface MedicalDeviceCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface ReportWorkItem {
  id: number;
  report_id: number;
  medical_device_id: number;
  created_at: string;
  updated_at: string;
}

interface MedicalDevice {
  id: number;
  medical_device_category_id: number;
  brand: string;
  model: string;
  serial_number: string;
  software_version: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  report_work_item: ReportWorkItem[];
  category_name?: string;
}

interface FormMedicalDevice {
  id?: number;
  medical_device_category_id: string;
  brand: string;
  model: string;
  serial_number: string;
  software_version: string;
  status: string;
  notes: string;
}

// Option interface for MultiSelectPopover
interface Option {
  label: string;
  value: string | number;
}

// New interfaces for brand and model
interface BrandItem {
  id: number;
  brand: string;
}

interface ModelItem {
  id: number;
  model: string;
}

export default function LisPage() {
  const [devices, setDevices] = useState<MedicalDevice[]>([]);
  const router = useRouter();
  const [medicalDevices, setMedicalDevices] = useState<MedicalDevice[]>([]);
  const [medicalDeviceCategories, setMedicalDeviceCategories] = useState<
    MedicalDeviceCategory[]
  >([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMedicalDevice, setTotalMedicalDevice] = useState(0);
  const [perPage, setPerPage] = useState(10);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Multi-delete states
  const [selectedDevices, setSelectedDevices] = useState<Set<number>>(
    new Set()
  );

  // New state for brands and models data
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [models, setModels] = useState<ModelItem[]>([]);

  // Updated filter states - using the same structure as dashboard
  const [selectedCategories, setSelectedCategories] = useState<Option[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<Option[]>([]);
  const [selectedModels, setSelectedModels] = useState<Option[]>([]);

  // Get URL parameters
  const category_medical_device =
    searchParams.get("category_medical_device") || "";
  const brand = searchParams.get("brand") || "";
  const model = searchParams.get("model") || "";

  const [filters, setFilters] = useState({
    category_medical_device,
    brand,
    model,
  });

  useEffect(() => {
    setFilters({
      category_medical_device:
        searchParams.get("category_medical_device") || "",
      brand: searchParams.get("brand") || "",
      model: searchParams.get("model") || "",
    });
  }, [searchParams]);

  const [isDeleting, setIsDeleting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<FormMedicalDevice>({
    medical_device_category_id: "",
    brand: "",
    model: "",
    serial_number: "",
    software_version: "",
    status: "",
    notes: "",
  });

  const hasPermission = (slug: string) => userPermissions.includes(slug);

  //Fetch Medical Device Category
  const fetchMedicalDeviceCategories = async () => {
    try {
      const token = Cookies.get("token");
      if (!token) throw new Error("Unauthorized");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL_API}/api/medical-device-category?per_page=All`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch medical device categories");
      const json = await res.json();

      const categoriesData = Array.isArray(json.data)
        ? json.data.map((c: Partial<MedicalDeviceCategory>) => ({
            id: c.id || 0,
            name: c.name || "",
            slug: c.slug || "",
            description: c.description || "",
            created_at: c.created_at || "",
            updated_at: c.updated_at || "",
          }))
        : [];

      setMedicalDeviceCategories(categoriesData);
    } catch (err: unknown) {
      console.error("Error fetching medical device categories:", err);
      setMedicalDeviceCategories([]);
    }
  };

  // Fetch Brand & Model
  const loadBrandsAndModels = useCallback(async () => {
    const token = Cookies.get("token");
    if (!token) return;

    try {
      const [brandRes, modelRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_BASE_URL_API}/api/brand`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_BASE_URL_API}/api/model`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const brandData = await brandRes.json();
      const modelData = await modelRes.json();

      if (brandData.status && brandData.data) setBrands(brandData.data);
      if (modelData.status && modelData.data) setModels(modelData.data);
    } catch (err) {
      console.error("Failed fetch brand/model:", err);
    }
  }, []);

  // Fixed fetchMedicalDevices function - replace the existing one

  const fetchMedicalDevices = useCallback(
    async (page: number = 1, search: string = "") => {
      try {
        setLoading(true);
        setError(null);

        const token = Cookies.get("token");
        if (!token) throw new Error("Unauthorized");

        const params = new URLSearchParams();
        params.append("page", page.toString());

        // Add search parameter
        if (search.trim()) params.append("search", search);

        // Handle category filters - combine URL params and multiselect
        const allCategoryFilters = new Set<string>();

        // Add URL parameter category if exists
        if (filters.category_medical_device) {
          allCategoryFilters.add(filters.category_medical_device);
        }

        // Add multiselect categories
        const excludedCategoryIds = [31]; // Exclude category 31
        selectedCategories.forEach((cat) => {
          if (typeof cat.value === "string") {
            allCategoryFilters.add(cat.value);
          } else {
            const category = medicalDeviceCategories.find(
              (c) => c.id === cat.value
            );
            if (category && !excludedCategoryIds.includes(category.id)) {
              // Use the actual category name instead of slug for API compatibility
              allCategoryFilters.add(category.name);
            }
          }
        });

        // Append all unique category filters (URLSearchParams handles encoding automatically)
        allCategoryFilters.forEach((categoryName) => {
          params.append("category_medical_device", categoryName);
        });

        // Handle brand filters - combine URL params and multiselect
        const allBrandFilters = new Set<string>();

        // Add URL parameter brand if exists
        if (filters.brand) {
          allBrandFilters.add(filters.brand.toLowerCase());
        }

        // Add multiselect brands
        selectedBrands.forEach((brand) => {
          const brandValue = String(brand.value).toLowerCase();
          allBrandFilters.add(brandValue);
        });

        // Append all unique brand filters
        allBrandFilters.forEach((brand) => {
          params.append("brand", brand);
        });

        // Handle model filters - combine URL params and multiselect
        const allModelFilters = new Set<string>();

        // Add URL parameter model if exists
        if (filters.model) {
          allModelFilters.add(filters.model.toLowerCase());
        }

        // Add multiselect models
        selectedModels.forEach((model) => {
          allModelFilters.add(String(model.value).toLowerCase());
        });

        // Append all unique model filters
        allModelFilters.forEach((model) => {
          params.append("model", model);
        });

        console.log(
          "API URL:",
          `${
            process.env.NEXT_PUBLIC_BASE_URL_API
          }/api/list-only-lis?${params.toString()}`
        );

        const res = await fetch(
          `${
            process.env.NEXT_PUBLIC_BASE_URL_API
          }/api/list-only-lis?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        if (!res.ok) throw new Error("Failed to fetch medical devices");

        const json = await res.json();
        console.log("API Response:", json);

        const devicesData = Array.isArray(json.data)
          ? json.data.map((d: Partial<MedicalDevice>) => ({
              id: d.id || 0,
              medical_device_category_id: d.medical_device_category_id || 0,
              brand: d.brand || "",
              model: d.model || "",
              serial_number: d.serial_number || "",
              software_version: d.software_version || null,
              status: d.status || "",
              notes: d.notes || null,
              created_at: d.created_at || "",
              updated_at: d.updated_at || "",
              report_work_item: d.report_work_item || [],
              category_name: d.category_name || "",
            }))
          : [];

        setMedicalDevices(devicesData);
        setCurrentPage(json.meta?.current_page || 1);
        setTotalPages(json.meta?.last_page || 1);
        setTotalMedicalDevice(json.meta?.total || 0);
        setPerPage(json.meta?.per_page || 10);

        setSelectedDevices(new Set());
      } catch (err: unknown) {
        console.error("Fetch error:", err);
        setError(
          err instanceof Error ? err.message : "Error fetching medical devices"
        );
        setMedicalDevices([]);
        setSelectedDevices(new Set());
      } finally {
        setLoading(false);
      }
    },
    [
      filters,
      selectedCategories,
      selectedBrands,
      selectedModels,
      medicalDeviceCategories,
    ]
  );

  // Handle filter changes
  const handleFilterChange = useCallback(() => {
    fetchMedicalDevices(1, searchTerm);
  }, [
    selectedCategories,
    selectedBrands,
    selectedModels,
    searchTerm,
    filters,
    fetchMedicalDevices,
  ]);

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedCategories([]);
    setSelectedBrands([]);
    setSelectedModels([]);
    setFilters({
      category_medical_device: "",
      brand: "",
      model: "",
    });
    fetchMedicalDevices(1, "");
  };

  // Check if any filters are active
  const hasActiveFilters =
    searchTerm ||
    selectedCategories.length > 0 ||
    selectedBrands.length > 0 ||
    selectedModels.length > 0 ||
    filters.category_medical_device ||
    filters.brand ||
    filters.model;

  // Generate filter options based on available data
  const categoryOptions = medicalDeviceCategories
    .filter((cat) => cat.id !== 31) // Exclude category 31
    .map((cat) => ({
      value: cat.name, // Use name instead of slug
      label: cat.name,
    }));

  const brandOptions = brands
    .filter((b) => !["VANSLITE", "VANSLAB"].includes(b.brand.toUpperCase()))
    .map((b) => ({
      value: b.brand.toLowerCase(), // Lowercase to match API
      label: b.brand,
    }));

  const modelOptions = models
    .filter((m) => m.id !== 31) // Filter out models from excluded category
    .map((m) => ({
      value: m.model.toLowerCase(), // Lowercase to match API
      label: m.model,
    }));

  // Initialize filters from URL parameters
  useEffect(() => {
    if (
      medicalDeviceCategories.length > 0 &&
      brands.length > 0 &&
      models.length > 0
    ) {
      const urlCategorySlug = searchParams.get("category_medical_device");
      const urlBrand = searchParams.get("brand");
      const urlModel = searchParams.get("model");

      // Set selected categories from URL
      if (urlCategorySlug) {
        const category = medicalDeviceCategories.find(
          (cat) => cat.slug === urlCategorySlug
        );
        if (category) {
          setSelectedCategories([
            {
              value: category.slug,
              label: category.name,
            },
          ]);
        }
      }

      // Set selected brands from URL
      if (urlBrand) {
        const brand = brands.find(
          (b) => b.brand.toLowerCase() === urlBrand.toLowerCase()
        );
        if (brand) {
          setSelectedBrands([
            {
              value: brand.brand.toLowerCase(),
              label: brand.brand,
            },
          ]);
        }
      }

      // Set selected models from URL
      if (urlModel) {
        const model = models.find(
          (m) => m.model.toLowerCase() === urlModel.toLowerCase()
        );
        if (model) {
          setSelectedModels([
            {
              value: model.model.toLowerCase(),
              label: model.model,
            },
          ]);
        }
      }
    }
  }, [medicalDeviceCategories, brands, models, searchParams]);

  // Handle individual checkbox selection
  const handleDeviceSelect = (id: number) => {
    const newSelected = new Set(selectedDevices);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedDevices(newSelected);
  };

  // Handle select all checkbox
  const handleSelectAll = () => {
    if (selectedDevices.size === medicalDevices.length) {
      setSelectedDevices(new Set());
    } else {
      setSelectedDevices(new Set(medicalDevices.map((d) => d.id)));
    }
  };

  // Multi-delete function
  const handleMultiDelete = async () => {
    if (selectedDevices.size === 0) return;

    const selectedList = medicalDevices.filter((d) =>
      selectedDevices.has(d.id)
    );
    const deviceLabels = selectedList
      .map((d) => `${d.brand} ${d.model}`)
      .join(", ");

    const result = await Swal.fire({
      title: "Delete Multiple Devices?",
      html: `
      <p>You are about to delete <strong>${selectedDevices.size}</strong> devices:</p>
      <p style="font-size: 14px; color: #9CA3AF; margin-top: 8px;">${deviceLabels}</p>
      <p style="color: #EF4444; margin-top: 12px;">This action cannot be undone!</p>
    `,
      icon: "warning",
      showCancelButton: true,
      background: "#111827",
      color: "#F9FAFB",
      customClass: {
        popup: "rounded-xl",
      },
      confirmButtonText: "Yes, delete all!",
      confirmButtonColor: "#EF4444",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      setIsDeleting(true);
      try {
        const token = Cookies.get("token");
        if (!token) throw new Error("Token not found");

        const deletePromises = selectedList.map((device) =>
          fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL_API}/api/medical-device/${device.id}`,
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
          (r) => r.status === "fulfilled" && r.value.ok
        ).length;

        const failedCount = selectedDevices.size - successCount;

        handleFilterChange();
        setSelectedDevices(new Set());

        if (failedCount === 0) {
          Swal.fire({
            title: "Success!",
            text: `Successfully deleted ${successCount} devices.`,
            icon: "success",
            timer: 3000,
            showConfirmButton: false,
            timerProgressBar: true,
            background: "#1f2937",
            color: "#F9FAFB",
          });
        } else {
          Swal.fire({
            title: "Partially Completed",
            text: `Deleted ${successCount} devices successfully. ${failedCount} failed to delete.`,
            icon: "warning",
            background: "#1f2937",
            color: "#F9FAFB",
          });
        }
      } catch (error) {
        console.error("Error during multi-delete:", error);
        Swal.fire({
          title: "Error",
          text: "Failed to delete devices. Please try again.",
          icon: "error",
          background: "#1f2937",
          color: "#F9FAFB",
        });
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleEdit = (device: MedicalDevice) => {
    setFormData({
      id: device.id,
      medical_device_category_id: device.medical_device_category_id.toString(),
      brand: device.brand || "",
      model: device.model || "",
      serial_number: device.serial_number || "",
      software_version: device.software_version || "",
      status: device.status || "",
      notes: device.notes || "",
    });
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setFormData({
      medical_device_category_id: "",
      brand: "",
      model: "",
      serial_number: "",
      software_version: "",
      status: "",
      notes: "",
    });
    setIsModalOpen(true);
  };

  const handleShow = (device: MedicalDevice) => {
    router.push(`/dashboard/laboratorium-information-system/${device.id}`);
  };

  const handleSubmit = async () => {
    try {
      const token = Cookies.get("token");
      if (!token) {
        throw new Error("Token not found");
      }

      const method = formData.id ? "PUT" : "POST";
      const url = formData.id
        ? `${process.env.NEXT_PUBLIC_BASE_URL_API}/api/medical-device/${formData.id}`
        : `${process.env.NEXT_PUBLIC_BASE_URL_API}/api/medical-device`;

      const payload = {
        medical_device_category_id: parseInt(
          formData.medical_device_category_id
        ),
        brand: formData.brand,
        model: formData.model,
        serial_number: formData.serial_number,
        software_version: formData.software_version || null,
        status: formData.status,
        notes: formData.notes || null,
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
          medical_device_category_id: "",
          brand: "",
          model: "",
          serial_number: "",
          software_version: "",
          status: "",
          notes: "",
        });
        handleFilterChange();
        Swal.fire({
          title: "Success",
          text: "Medical device has been saved",
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
            errorData.message || "Failed to save medical device",
            "error"
          );
        }
      }
    } catch (error) {
      console.error("Error saving medical device:", error);
      Swal.fire("Error", "Network error or server unavailable", "error");
    }
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You will not be able to recover this medical device!",
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
          `${process.env.NEXT_PUBLIC_BASE_URL_API}/api/medical-device/${id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        if (res.ok) {
          handleFilterChange();
          Swal.fire({
            title: "Deleted!",
            text: "Medical device has been deleted.",
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
            errorData.message || "Failed to delete medical device",
            "error"
          );
        }
      } catch (error) {
        console.error("Error deleting medical device:", error);
        Swal.fire("Error", "Failed to delete medical device", "error");
      }
    }
  };

  const getCategoryName = (categoryId: number) => {
    const category = medicalDeviceCategories.find((c) => c.id === categoryId);
    return category?.name || "-";
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "baik":
        return "bg-green-600";
      case "rusak":
        return "bg-red-600";
      case "perbaikan":
        return "bg-yellow-600";
      case "tidak aktif":
        return "bg-gray-400";
      default:
        return "bg-gray-600";
    }
  };

  const getLastServiceDate = (items: ReportWorkItem[]): string | null => {
    if (!items || items.length === 0) {
      return null;
    }
    const sortedItems = [...items].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return sortedItems[0].created_at;
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
        fetchMedicalDeviceCategories(),
        loadBrandsAndModels(),
      ]);
    };

    initializeData();
  }, [loadBrandsAndModels]);

  // Load medical devices after categories and brands/models are loaded
  useEffect(() => {
    if (
      medicalDeviceCategories.length > 0 &&
      brands.length > 0 &&
      models.length > 0
    ) {
      fetchMedicalDevices();
    }
  }, [medicalDeviceCategories, brands, models, fetchMedicalDevices]);

  // Search debounce
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      handleFilterChange();
    }, 400);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchTerm, handleFilterChange]);

  // Filter effect
  useEffect(() => {
    if (
      medicalDeviceCategories.length > 0 &&
      brands.length > 0 &&
      models.length > 0
    ) {
      handleFilterChange();
    }
  }, [selectedCategories, selectedBrands, selectedModels, filters]);

  const handlePageChange = useCallback(
    (page: number) => {
      if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
        fetchMedicalDevices(page, searchTerm);
      }
    },
    [searchTerm, totalPages, fetchMedicalDevices]
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
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
              <MonitorCog className="w-6 h-6" /> Laboratorium Information System
              Management
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              Manage Laboratorium Information System
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Multi-delete button */}
            {hasPermission("delete-medical-device") &&
              selectedDevices.size > 0 && (
                <button
                  onClick={handleMultiDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isDeleting
                    ? "Deleting..."
                    : `Delete ${selectedDevices.size} Items`}
                </button>
              )}

            {hasPermission("create-medical-device") && (
              <button
                onClick={handleAdd}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-2" /> Add LIS
              </button>
            )}
          </div>
        </div>

        {/* Enhanced Search and Filter Section */}
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
          {/* Search Input */}
          <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by serial number.."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-800 text-white"
              />
            </div>

          {/* Filter Controls */}
          {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Categories
              </label>
              <MultiSelectPopover
                options={categoryOptions}
                selected={selectedCategories}
                onChange={setSelectedCategories}
                placeholder="Select categories..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Brands
              </label>
              <MultiSelectPopover
                options={brandOptions}
                selected={selectedBrands}
                onChange={setSelectedBrands}
                placeholder="Select brands..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Models
              </label>
              <MultiSelectPopover
                options={modelOptions}
                selected={selectedModels}
                onChange={setSelectedModels}
                placeholder="Select models..."
              />
            </div>
          </div> */}

          {/* Clear Filters Button */}
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Bagian kiri: label + badges */}
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-blue-300 font-medium">
                  Active filters:
                </span>

                {/* URL Parameters */}
                {filters.category_medical_device && (
                  <span className="bg-blue-600/90 text-white px-3 py-1.5 rounded-full text-xs shadow-sm">
                    Category: {filters.category_medical_device}
                  </span>
                )}
                {filters.brand && (
                  <span className="bg-green-600/90 text-white px-3 py-1.5 rounded-full text-xs shadow-sm">
                    Brand: {filters.brand}
                  </span>
                )}
                {filters.model && (
                  <span className="bg-purple-600/90 text-white px-3 py-1.5 rounded-full text-xs shadow-sm">
                    Model: {filters.model}
                  </span>
                )}

                {/* MultiSelect Filters */}
                {selectedCategories.map((cat) => (
                  <span
                    key={cat.value}
                    className="bg-blue-600/90 text-white px-3 py-1.5 rounded-full text-xs shadow-sm"
                  >
                    Category: {cat.label}
                  </span>
                ))}
                {selectedBrands.map((brand) => (
                  <span
                    key={brand.value}
                    className="bg-green-600/90 text-white px-3 py-1.5 rounded-full text-xs shadow-sm"
                  >
                    Brand: {brand.label}
                  </span>
                ))}
                {selectedModels.map((model) => (
                  <span
                    key={model.value}
                    className="bg-purple-600/90 text-white px-3 py-1.5 rounded-full text-xs shadow-sm"
                  >
                    Model: {model.label}
                  </span>
                ))}

                {searchTerm && (
                  <span className="bg-yellow-600/90 text-white px-3 py-1.5 rounded-full text-xs shadow-sm">
                    Search: "{searchTerm}"
                  </span>
                )}
              </div>

              {/* Bagian kanan: tombol clear */}
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm shadow-sm cursor-pointer"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* Selection Info */}
        {selectedDevices.size > 0 && (
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-3 mt-3 shadow-sm">
            <p className="text-blue-300 text-sm flex items-center">
              <span>
                {selectedDevices.size} item
                {selectedDevices.size > 1 ? "s" : ""} selected
              </span>
              <button
                onClick={() => setSelectedDevices(new Set())}
                className="ml-3 text-blue-400 hover:text-blue-300 underline text-sm"
              >
                Clear selection
              </button>
            </p>
          </div>
        )}

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
                  {hasPermission("delete-medical-device") && (
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={
                          medicalDevices.length > 0 &&
                          selectedDevices.size === medicalDevices.length
                        }
                        ref={(el) => {
                          if (el) {
                            el.indeterminate =
                              selectedDevices.size > 0 &&
                              selectedDevices.size < medicalDevices.length;
                          }
                        }}
                        onChange={() => handleSelectAll()}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2 cursor-pointer"
                      />
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Device Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Serial Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Last Service
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {Array.isArray(medicalDevices) &&
                  medicalDevices.map((device, index) => (
                    <tr key={device.id} className="hover:bg-gray-800">
                      {hasPermission("delete-medical-device") && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedDevices.has(device.id)}
                            onChange={() => handleDeviceSelect(device.id)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2 cursor-pointer"
                          />
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white text-center align-top">
                        {(currentPage - 1) * perPage + index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-white font-medium">
                            {device.brand || ""} {device.model || ""}
                          </div>
                          <div className="text-gray-400 text-sm">
                            Brand : {device.brand || "-"} | Model :{" "}
                            {device.model || "N/A"} | Software Version :{" "}
                            {device.software_version || "N/A"}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        <span className="px-2 py-1 bg-blue-600 text-white rounded text-sm">
                          {getCategoryName(device.medical_device_category_id)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-300 text-sm">
                        <code className="px-2 py-1 bg-gray-700 rounded text-xs">
                          {device.serial_number || "-"}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-white rounded text-sm ${getStatusBadgeColor(
                            device.status
                          )}`}
                        >
                          {device.status || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-sm">
                        {formatDate(
                          getLastServiceDate(device.report_work_item)
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {hasPermission("show-medical-device") && (
                            <button
                              onClick={() => handleShow(device)}
                              className="text-blue-400 hover:text-blue-300 p-1 cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          {hasPermission("update-medical-device") && (
                            <button
                              onClick={() => handleEdit(device)}
                              className="text-green-400 hover:text-green-300 p-1 cursor-pointer"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {hasPermission("delete-medical-device") && (
                            <button
                              onClick={() => handleDelete(device.id)}
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

          {medicalDevices.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">
                No medical devices found
              </div>
              <div className="text-gray-500 text-sm">
                {hasActiveFilters
                  ? "Try adjusting your search or filter criteria"
                  : "No medical devices available"}
              </div>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center min-h-[40vh] bg-gray-900 rounded-lg">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500"></div>
              <p className="mt-4 text-gray-400">Loading medical devices...</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-400">
              Showing {(currentPage - 1) * perPage + 1} to{" "}
              {Math.min(currentPage * perPage, totalMedicalDevice)} of{" "}
              {totalMedicalDevice} results
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
      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
          <Dialog.Content
            className="fixed top-1/2 left-1/2 bg-gray-800 text-white rounded-lg w-[90%] max-w-2xl -translate-x-1/2 -translate-y-1/2 max-h-[90vh] overflow-y-auto z-50"
            onPointerDownOutside={(e) => e.preventDefault()}
          >
            {/* Header dengan ikon */}
            <div className="bg-blue-600 px-6 py-4 rounded-t-lg flex items-center gap-2">
              {formData.id ? (
                <Pencil size={20} className="text-white" />
              ) : (
                <PlusCircle size={20} className="text-white" />
              )}
              <Dialog.Title className="text-xl font-bold text-white">
                {formData.id ? "Edit Medical Device" : "Add Medical Device"}
              </Dialog.Title>
            </div>

            {/* Body */}
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Brand *
                  </label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) =>
                      setFormData({ ...formData, brand: e.target.value })
                    }
                    placeholder="e.g., Mindray"
                    className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Model *
                  </label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) =>
                      setFormData({ ...formData, model: e.target.value })
                    }
                    placeholder="e.g., BC-30"
                    className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Category *
                </label>
                <select
                  value={formData.medical_device_category_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      medical_device_category_id: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select device category</option>
                  {medicalDeviceCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Serial Number *
                  </label>
                  <input
                    type="text"
                    value={formData.serial_number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        serial_number: e.target.value,
                      })
                    }
                    placeholder="e.g., MDRY-00123"
                    className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Software Version
                  </label>
                  <input
                    type="text"
                    value={formData.software_version}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        software_version: e.target.value,
                      })
                    }
                    placeholder="e.g., v2.1.0"
                    className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select status</option>
                  <option value="Baik">Baik</option>
                  <option value="Rusak">Rusak</option>
                  <option value="Perbaikan">Perbaikan</option>
                  <option value="Tidak Aktif">Tidak Aktif</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Additional notes about the device..."
                  rows={3}
                  className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-700 px-6 py-4 rounded-b-lg flex justify-end gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex items-center gap-2 px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 cursor-pointer"
              >
                <X size={16} />
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={
                  !formData.brand.trim() ||
                  !formData.model.trim() ||
                  !formData.serial_number.trim() ||
                  !formData.medical_device_category_id ||
                  !formData.status
                }
                className="flex items-center gap-2 px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {formData.id ? (
                  <>
                    <Save size={16} />
                    Update
                  </>
                ) : (
                  <>
                    <PlusIcon size={16} />
                    Create
                  </>
                )}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
