"use client";

import { useEffect, useState, useRef } from "react";
import Cookies from "js-cookie";
import { Eye, Edit, Trash2, Key, Plus, Search } from "lucide-react";
import Swal from "sweetalert2";
import * as Dialog from "@radix-ui/react-dialog";

interface Permission {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface FormPermission {
  id?: number;
  name: string;
  slug: string;
  description: string;
}

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<FormPermission>({
    name: "",
    slug: "",
    description: "",
  });

  const hasPermission = (slug: string) => userPermissions.includes(slug);

  const fetchPermissions = async (page: number = 1, search: string = "") => {
    try {
      setLoading(true);
      setError(null);
      const token = Cookies.get("token");
      if (!token) throw new Error("Unauthorized");

      const params = new URLSearchParams();
      params.append("page", page.toString());
      if (search.trim()) params.append("search", search);

      const res = await fetch(
        `http://report-api.test/api/permission-with-pagination?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch permissions");
      const json = await res.json();

      // Safe data handling dengan default values
      const permissionsData = Array.isArray(json.data) 
        ? json.data.map((p: Partial<Permission>) => ({
            id: p.id || 0,
            name: p.name || "",
            slug: p.slug || "",
            description: p.description || "",
            created_at: p.created_at || "",
            updated_at: p.updated_at || "",
          }))
        : [];

      setPermissions(permissionsData);
      setCurrentPage(json.meta?.current_page || 1);
      setTotalPages(json.meta?.last_page || 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error fetching permissions");
      setPermissions([]); // Set empty array pada error
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .trim();
  };

  const handleEdit = (permission: Permission) => {
    setFormData({
      id: permission.id,
      name: permission.name || "",
      slug: permission.slug || "",
      description: permission.description || "",
    });
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setFormData({ name: "", slug: "", description: "" });
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
        ? `http://report-api.test/api/permission/${formData.id}`
        : "http://report-api.test/api/permission";

      // Prepare JSON payload
      const payload = {
        name: formData.name,
        slug: formData.slug || generateSlug(formData.name),
        description: formData.description || null
      };

      console.log("Submitting payload:", payload); // Debug log

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log("Response status:", res.status); // Debug log

      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ name: "", slug: "", description: "" }); // Reset form
        fetchPermissions();
        Swal.fire("Success", "Permission has been saved", "success");
      } else {
        const errorData = await res.json();
        console.error("Error response:", errorData); // Debug log
        
        // Handle validation errors
        if (errorData.errors) {
          const errorMessages = Object.values(errorData.errors).flat().join("\n");
          Swal.fire("Validation Error", errorMessages, "error");
        } else {
          Swal.fire("Error", errorData.message || "Failed to save permission", "error");
        }
      }
    } catch (error) {
      console.error("Error saving permission:", error);
      Swal.fire("Error", "Network error or server unavailable", "error");
    }
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You will not be able to recover this permission!",
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

        const res = await fetch(`http://report-api.test/api/permission/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (res.ok) {
          fetchPermissions();
          Swal.fire("Deleted!", "Permission has been deleted.", "success");
        } else {
          const errorData = await res.json();
          Swal.fire("Error", errorData.message || "Failed to delete permission", "error");
        }
      } catch (error) {
        console.error("Error deleting permission:", error);
        Swal.fire("Error", "Failed to delete permission", "error");
      }
    }
  };

  // Initial load
  useEffect(() => {
    const initializeData = async () => {
      // Load permissions from cookies
      const stored = Cookies.get("permissions");
      if (stored) {
        try {
          setUserPermissions(JSON.parse(stored));
        } catch {
          setUserPermissions([]);
        }
      }
      
      // Fetch data
      await fetchPermissions();
    };
    
    initializeData();
  }, []);

  // Search debounce
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchPermissions(1, searchTerm);
    }, 400);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchTerm]);

  // Auto-generate slug when name changes
  useEffect(() => {
    if (formData.name) { // Only auto-generate for new permissions
      setFormData(prev => ({
        ...prev,
        slug: generateSlug(prev.name)
      }));
    }
  }, [formData.name, formData.id]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      fetchPermissions(page, searchTerm);
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
              <Key className="w-6 h-6" /> Permissions Management
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              Manage system permissions and access controls
            </p>
          </div>

          {hasPermission("create-permissions") && (
            <button
              onClick={handleAdd}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Permission
            </button>
          )}
        </div>

        {/* Search */}
        <div className="bg-gray-900 p-4 rounded-lg">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search permissions by name or slug..."
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
          <table className="w-full">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Permission Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Description
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
              {Array.isArray(permissions) && permissions.map((permission) => (
                <tr key={permission.id} className="hover:bg-gray-800">
                  <td className="px-6 py-4 text-white font-medium">
                    {permission.name || ""}
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    <code className="px-2 py-1 bg-gray-700 rounded text-sm">
                      {permission.slug || ""}
                    </code>
                  </td>
                  <td className="px-6 py-4 text-gray-300 text-sm">
                    {permission.description || "-"}
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-sm">
                    {formatDate(permission.created_at)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {hasPermission("show-permissions") && (
                        <button className="text-blue-400 hover:text-blue-300 p-1 cursor-pointer">
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      {hasPermission("update-permissions") && (
                        <button
                          onClick={() => handleEdit(permission)}
                          className="text-green-400 hover:text-green-300 p-1 cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {hasPermission("delete-permissions") && (
                        <button
                          onClick={() => handleDelete(permission.id)}
                          className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {(!Array.isArray(permissions) || permissions.length === 0) && !loading && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No permissions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {loading && (
            <div className="py-8 text-center text-gray-400">
              Loading permissions...
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
          <Dialog.Content className="fixed top-1/2 left-1/2 bg-gray-800 text-white p-6 rounded-lg w-[90%] max-w-lg -translate-x-1/2 -translate-y-1/2">
            <Dialog.Title className="text-xl font-bold mb-4">
              {formData.id ? "Edit Permission" : "Add Permission"}
            </Dialog.Title>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Permission Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Create Users"
                  className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  placeholder="e.g., create-users"
                  className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Auto-generated from name, but you can customize it
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Brief description of this permission"
                  rows={3}
                  className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!formData.name.trim()}
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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