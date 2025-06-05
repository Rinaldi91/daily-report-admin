"use client";

import { useEffect, useState, useRef } from "react";
import Cookies from "js-cookie";
import { Eye, Edit, Trash2, Shield, Plus, Search } from "lucide-react";
import Swal from "sweetalert2";
import * as Dialog from "@radix-ui/react-dialog";

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
  created_at: string;
  updated_at: string;
  permissions: Permission[];
}

interface FormRole {
  id?: number;
  name: string;
  description: string;
  permission_ids: number[];
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [permissions, setPermissions] = useState<string[]>([]);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<FormRole>({
    name: "",
    description: "",
    permission_ids: [],
  });
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);

  const hasPermission = (slug: string) => permissions.includes(slug);

  const fetchPermissions = async () => {
    try {
      const token = Cookies.get("token");
      if (!token) {
        throw new Error("Token not found");
      }
      
      const res = await fetch("http://report-api.test/api/permission", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      
      if (!res.ok) {
        throw new Error("Failed to fetch permissions");
      }
      
      const json = await res.json();
      console.log("Permissions response:", json); // Debug log
      
      // Handle different response structures
      let permissionsData = [];
      if (Array.isArray(json.data)) {
        permissionsData = json.data;
      } else if (Array.isArray(json)) {
        permissionsData = json;
      } else if (json.permissions && Array.isArray(json.permissions)) {
        permissionsData = json.permissions;
      }
      
      console.log("Processed permissions:", permissionsData); // Debug log
      setAllPermissions(permissionsData);
    } catch (error) {
      console.error("Error fetching permissions:", error);
      setAllPermissions([]);
    }
  };

  const fetchRoles = async (page: number = 1, search: string = "") => {
    try {
      setLoading(true);
      setError(null);
      const token = Cookies.get("token");
      if (!token) throw new Error("Unauthorized");

      const params = new URLSearchParams();
      params.append("page", page.toString());
      if (search.trim()) params.append("search", search);

      const res = await fetch(
        `http://report-api.test/api/roles?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch roles");
      const json = await res.json();

      // Safe data handling dengan default values
      const rolesData = Array.isArray(json.data) 
        ? json.data.map((r: Partial<Role>) => ({
            id: r.id || 0,
            name: r.name || "",
            slug: r.slug || "",
            description: r.description || "",
            created_at: r.created_at || "",
            updated_at: r.updated_at || "",
            permissions: Array.isArray(r.permissions) ? r.permissions : [],
          }))
        : [];

      setRoles(rolesData);
      setCurrentPage(json.meta?.current_page || 1);
      setTotalPages(json.meta?.last_page || 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error fetching roles");
      setRoles([]); // Set empty array pada error
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (role: Role) => {
    setFormData({
      id: role.id,
      name: role.name || "",
      description: role.description || "",
      permission_ids: Array.isArray(role.permissions) 
        ? role.permissions.map((p) => p.id) 
        : [],
    });
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setFormData({ name: "", description: "", permission_ids: [] });
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
        ? `http://report-api.test/api/roles/${formData.id}`
        : "http://report-api.test/api/roles";

      // Prepare JSON payload
      const payload = {
        name: formData.name,
        description: formData.description,
        permission_ids: Array.isArray(formData.permission_ids) ? formData.permission_ids : []
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
        setFormData({ name: "", description: "", permission_ids: [] }); // Reset form
        fetchRoles();
        Swal.fire("Success", "Role has been saved", "success");
      } else {
        const errorData = await res.json();
        console.error("Error response:", errorData); // Debug log
        
        // Handle validation errors
        if (errorData.errors) {
          const errorMessages = Object.values(errorData.errors).flat().join("\n");
          Swal.fire("Validation Error", errorMessages, "error");
        } else {
          Swal.fire("Error", errorData.message || "Failed to save role", "error");
        }
      }
    } catch (error) {
      console.error("Error saving role:", error);
      Swal.fire("Error", "Network error or server unavailable", "error");
    }
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You will not be able to recover this role!",
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

        const res = await fetch(`http://report-api.test/api/roles/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (res.ok) {
          fetchRoles();
          Swal.fire("Deleted!", "Role has been deleted.", "success");
        } else {
          const errorData = await res.json();
          Swal.fire("Error", errorData.message || "Failed to delete role", "error");
        }
      } catch (error) {
        console.error("Error deleting role:", error);
        Swal.fire("Error", "Failed to delete role", "error");
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
          setPermissions(JSON.parse(stored));
        } catch {
          setPermissions([]);
        }
      }
      
      // Fetch data
      await Promise.all([
        fetchRoles(),
        fetchPermissions()
      ]);
    };
    
    initializeData();
  }, []);

  // Search debounce
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchRoles(1, searchTerm);
    }, 400);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchTerm]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      fetchRoles(page, searchTerm);
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-white">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="w-6 h-6" /> Roles Management
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              Manage access roles and permissions
            </p>
          </div>

          {hasPermission("create-roles") && (
            <button
              onClick={handleAdd}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Role
            </button>
          )}
        </div>

        {/* Search */}
        <div className="bg-gray-900 p-4 rounded-lg">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search roles by name or description..."
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
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-[15%]">
                  Role Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Permissions
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {Array.isArray(roles) && roles.map((role) => (
                <tr key={role.id} className="hover:bg-gray-800">
                  <td className="px-6 py-4 text-white w-[15%]">{role.name || ""}</td>
                  <td className="px-6 py-4 text-gray-300 text-sm">
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(role.permissions) && role.permissions.map((p) => (
                        <span
                          key={p.id}
                          className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-blue-700 text-white"
                        >
                          {p.name || ""}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {hasPermission("show-roles") && (
                        <button className="text-blue-400 hover:text-blue-300 p-1 cursor-pointer">
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      {hasPermission("update-roles") && (
                        <button
                          onClick={() => handleEdit(role)}
                          className="text-green-400 hover:text-green-300 p-1 cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {hasPermission("delete-roles") && (
                        <button
                          onClick={() => handleDelete(role.id)}
                          className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {(!Array.isArray(roles) || roles.length === 0) && !loading && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No roles found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {loading && (
            <div className="py-8 text-center text-gray-400">
              Loading roles...
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
              {formData.id ? "Edit Role" : "Add Role"}
            </Dialog.Title>

            <div className="space-y-3">
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Role name"
                className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white"
              />

              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Description"
                className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white"
              />

              <div>
                <label className="block text-sm mb-1">Permissions</label>
                {allPermissions.length === 0 ? (
                  <div className="text-gray-400 text-sm">Loading permissions...</div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-600 rounded p-2 bg-gray-700">
                    {allPermissions.map((perm) => (
                      <label key={perm.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.permission_ids.includes(perm.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                permission_ids: [...formData.permission_ids, perm.id]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                permission_ids: formData.permission_ids.filter(id => id !== perm.id)
                              });
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm text-white">{perm.name || ""}</span>
                      </label>
                    ))}
                  </div>
                )}
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
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 cursor-pointer"
              >
                Create
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}