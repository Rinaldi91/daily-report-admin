"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Cookies from "js-cookie";
import {
  Edit,
  Trash2,
  FileBoxIcon,
  Plus,
  Search,
  X,
  Save,
  Pencil,
  PlusCircle,
} from "lucide-react";
import Swal from "sweetalert2";
import * as Dialog from "@radix-ui/react-dialog";

interface Position {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface FormPosition {
  id?: number;
  name: string;
  slug: string;
  description: string;
}

export default function PositionsPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosition, setTotalPosition] = useState(0);
  const [perPage, setPerPage] = useState(10);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<FormPosition>({
    name: "",
    slug: "",
    description: "",
  });

  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const hasPermission = (slug: string) => userPermissions.includes(slug);

  const fetchPositions = useCallback(
    async (page: number = 1, search: string = "") => {
      try {
        setLoading(true);
        setError(null);
        const token = Cookies.get("token");
        if (!token) throw new Error("Unauthorized");

        const params = new URLSearchParams();
        params.append("page", page.toString());
        if (search.trim()) params.append("search", search);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL_API}/api/position?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        if (!res.ok) throw new Error("Failed to fetch positions");
        const json = await res.json();

        const positionsData = Array.isArray(json.data)
          ? json.data.map((p: Partial<Position>) => ({
              id: p.id || 0,
              name: p.name || "",
              slug: p.slug || "",
              description: p.description || "",
              created_at: p.created_at || "",
              updated_at: p.updated_at || "",
            }))
          : [];

        setPositions(positionsData);
        setCurrentPage(json.meta.current_page);
        setTotalPages(json.meta.last_page);
        setTotalPosition(json.meta.total);
        setPerPage(json.meta.per_page);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Error fetching positions"
        );
        setPositions([]);
      } finally {
        setLoading(false);
      }
    },
    [] // tambahkan dependency jika perlu seperti token tetap
  );

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
      .trim();
  };

  const handleEdit = (position: Position) => {
    setFormData({
      id: position.id,
      name: position.name || "",
      slug: position.slug || "",
      description: position.description || "",
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
        ? `${process.env.NEXT_PUBLIC_BASE_URL_API}/api/position/${formData.id}`
        : `${process.env.NEXT_PUBLIC_BASE_URL_API}/api/position`;

      // Prepare JSON payload
      const payload = {
        name: formData.name,
        slug: formData.slug || generateSlug(formData.name),
        description: formData.description || null,
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
        fetchPositions();
        Swal.fire({
          title: "Success",
          text: "Position has been saved",
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
        console.error("Error response:", errorData); // Debug log

        // Handle validation errors
        if (errorData.errors) {
          const errorMessages = Object.values(errorData.errors)
            .flat()
            .join("\n");
          Swal.fire("Validation Error", errorMessages, "error");
        } else {
          Swal.fire(
            "Error",
            errorData.message || "Failed to save position",
            "error"
          );
        }
      }
    } catch (error) {
      console.error("Error saving position:", error);
      Swal.fire("Error", "Network error or server unavailable", "error");
    }
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You will not be able to recover this position!",
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

        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL_API}/api/position/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (res.ok) {
          fetchPositions();
          Swal.fire({
            title: "Deleted!",
            text: "Position has been deleted.",
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
            errorData.message || "Failed to delete position",
            "error"
          );
        }
      } catch (error) {
        console.error("Error deleting position:", error);
        Swal.fire("Error", "Failed to delete position", "error");
      }
    }
  };

  // Multi-delete functions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(positions.map((item) => item.id));
      setSelectedItems(allIds);
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedItems(newSelected);
  };

  const handleMultiDelete = async () => {
    if (selectedItems.size === 0) return;

    const selectedPositions = positions.filter((cat) =>
      selectedItems.has(cat.id)
    );
    const positionNames = selectedPositions.map((cat) => cat.name).join(", ");

    const result = await Swal.fire({
      title: "Delete Multiple Positions?",
      html: `
            <p>You are about to delete <strong>${selectedItems.size}</strong> position:</p>
            <p style="font-size: 14px; color: #9CA3AF; margin-top: 8px;">${positionNames}</p>
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
        if (!token) {
          throw new Error("Token not found");
        }

        const deletePromises = selectedPositions.map((item) =>
          fetch(`${process.env.NEXT_PUBLIC_BASE_URL_API}/api/position/${item.id}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          })
        );

        const results = await Promise.allSettled(deletePromises);

        // Count successful deletions
        const successCount = results.filter(
          (result) => result.status === "fulfilled" && result.value.ok
        ).length;

        const failedCount = selectedItems.size - successCount;

        // Refresh data
        await fetchPositions();

        // Show result
        if (failedCount === 0) {
          Swal.fire({
            title: "Success!",
            text: `Successfully deleted ${successCount} position.`,
            icon: "success",
            timer: 3000,
            showConfirmButton: false,
            timerProgressBar: true,
            background: "#1f2937",
            color: "#F9FAFB",
            customClass: {
              popup: "rounded-xl p-6",
            },
          });
        } else {
          Swal.fire({
            title: "Partially Completed",
            text: `Deleted ${successCount} position successfully. ${failedCount} failed to delete.`,
            icon: "warning",
            background: "#1f2937",
            color: "#F9FAFB",
            customClass: {
              popup: "rounded-xl p-6",
            },
          });
        }
      } catch (error) {
        console.error("Error in multi-delete:", error);
        Swal.fire({
          title: "Error",
          text: "Failed to delete position. Please try again.",
          icon: "error",
          background: "#1f2937",
          color: "#F9FAFB",
        });
      } finally {
        setIsDeleting(false);
        setSelectedItems(new Set());
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
      await fetchPositions();
    };

    initializeData();
  }, [fetchPositions]);

  // Search debounce
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchPositions(1, searchTerm);
    }, 400);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchTerm, fetchPositions]);

  // Auto-generate slug when name changes
  useEffect(() => {
    if (formData.name) {
      // Only auto-generate for new positions
      setFormData((prev) => ({
        ...prev,
        slug: generateSlug(prev.name),
      }));
    }
  }, [formData.name, formData.id]);

  // Handle pagination
  const handlePageChange = useCallback(
    (page: number) => {
      if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
        fetchPositions(page, searchTerm);
      }
    },
    [searchTerm, totalPages, fetchPositions]
  );

  // Generate pagination numbers
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

  const isAllSelected =
    positions.length > 0 && positions.every((cat) => selectedItems.has(cat.id));
  const isIndeterminate = selectedItems.size > 0 && !isAllSelected;

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-white">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileBoxIcon className="w-6 h-6" /> Positions Management
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              Manage organizational positions and job roles
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selectedItems.size > 0 && hasPermission("delete-position") && (
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

            {hasPermission("create-position") && (
              <button
                onClick={handleAdd}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Position
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="bg-gray-900 p-4 rounded-lg">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search positions by name ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-800 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none bg-gray-800 text-white"
            />
            {searchTerm && (
              <X
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 cursor-pointer hover:text-white"
                onClick={() => setSearchTerm("")}
              />
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
                {hasPermission("delete-position") && (
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
                  Position Name
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
              {Array.isArray(positions) &&
                positions.map((position, index) => (
                  <tr key={position.id} className="hover:bg-gray-800">
                    {hasPermission("delete-position") && (
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(position.id)}
                          onChange={(e) =>
                            handleSelectItem(position.id, e.target.checked)
                          }
                          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {(currentPage - 1) * perPage + index + 1}
                    </td>
                    <td className="px-6 py-4 text-white font-medium">
                      {position.name || ""}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      <code className="px-2 py-1 bg-gray-700 rounded text-sm">
                        {position.slug || ""}
                      </code>
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm">
                      {position.description || "-"}
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">
                      {formatDate(position.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* {hasPermission("show-position") && (
                        <button className="text-blue-400 hover:text-blue-300 p-1 cursor-pointer">
                          <Eye className="w-4 h-4" />
                        </button>
                      )} */}
                        {hasPermission("update-position") && (
                          <button
                            onClick={() => handleEdit(position)}
                            className="text-green-400 hover:text-green-300 p-1 cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {hasPermission("delete-position") && (
                          <button
                            onClick={() => handleDelete(position.id)}
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

          {positions.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">
                No positions found
              </div>
              <div className="text-gray-500 text-sm">
                {searchTerm
                  ? "Try adjusting your search criteria"
                  : "No users available"}
              </div>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center min-h-[40vh] bg-gray-900 rounded-lg">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500"></div>
              <p className="mt-4 text-gray-400">Loading positions...</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-400">
              Showing {(currentPage - 1) * perPage + 1} to{" "}
              {Math.min(currentPage * perPage, totalPosition)} of{" "}
              {totalPosition} results
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
            onPointerDownOutside={(e) => e.preventDefault()} // <- Ini yang mencegah modal tertutup saat klik luar
          >
            {/* Header */}
            <div className="bg-blue-600 px-6 py-4 flex items-center gap-2">
              {formData.id ? (
                <>
                  <Pencil className="w-5 h-5 text-white" />
                  <Dialog.Title className="text-lg font-semibold text-white">
                    Edit Position
                  </Dialog.Title>
                </>
              ) : (
                <>
                  <PlusCircle className="w-5 h-5 text-white" />
                  <Dialog.Title className="text-lg font-semibold text-white">
                    Add Position
                  </Dialog.Title>
                </>
              )}
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Position Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Senior Developer"
                  className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  disabled={true}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  placeholder="e.g., senior-developer"
                  className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Auto-generated from name, but you can customize it
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Brief description of this position"
                  rows={3}
                  className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-700 px-6 py-4 flex justify-end gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 cursor-pointer flex items-center gap-2 text-white"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!formData.name.trim()}
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2 text-white"
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
    </>
  );
}
