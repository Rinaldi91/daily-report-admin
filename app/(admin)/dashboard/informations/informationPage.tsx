"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Cookies from "js-cookie";
import "react-quill/dist/quill.snow.css";
import dynamic from "next/dynamic";
import { Editor } from "@tinymce/tinymce-react";

import {
  Edit,
  Trash2,
  Info,
  Plus,
  Search,
  Save,
  X,
  Pencil,
  PlusCircle,
} from "lucide-react";
import Swal from "sweetalert2";
import * as Dialog from "@radix-ui/react-dialog";
import PermissionGuard from "@/components/PermissionGuard";

interface Information {
  id: number;
  name: string;
  slug: string;
  content: string;
  type: string;
  is_active: number;
  published_at: string;
  expired_at: string;
  created_at: string;
  updated_at: string;
}

interface FormInformation {
  id?: number;
  name: string;
  slug: string;
  content: string;
  type: string;
  is_active: number;
  published_at: string;
  expired_at: string;
}

export default function InformationPage() {
  const [information, setInformation] = useState<Information[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [perPage, setPerPage] = useState(10);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<FormInformation>({
    name: "",
    slug: "",
    content: "",
    type: "general",
    is_active: 1,
    published_at: "",
    expired_at: "",
  });

  const [selectedItem, setSelectedItem] = useState<Information | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

  const fetchInformation = useCallback(
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
          `${
            process.env.NEXT_PUBLIC_BASE_URL_API
          }/api/information?${params.toString()}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }
        );

        if (!res.ok) throw new Error("Failed to fetch information");
        const json = await res.json();

        const data = Array.isArray(json.data)
          ? json.data.map((i: Partial<Information>) => ({
              id: i.id || 0,
              name: i.name || "",
              slug: i.slug || "",
              content: i.content || "",
              type: i.type || "general",
              is_active: i.is_active ?? 1,
              published_at: i.published_at || "",
              expired_at: i.expired_at || "",
              created_at: i.created_at || "",
              updated_at: i.updated_at || "",
            }))
          : [];

        setInformation(data);
        setCurrentPage(json.meta?.current_page || 1);
        setTotalPages(json.meta?.last_page || 1);
        setTotalData(json.meta?.total || 0);
        setPerPage(json.meta?.per_page || 10);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error fetching data");
        setInformation([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handlePageChange = useCallback(
    (page: number) => {
      if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
        fetchInformation(page, searchTerm);
      }
    },
    [searchTerm, totalPages, fetchInformation]
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

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleEdit = (item: Information) => {
    setFormData({
      id: item.id,
      name: item.name || "",
      slug: item.slug || "",
      content: item.content || "",
      type: item.type || "general",
      is_active: item.is_active ?? 1,
      published_at: item.published_at || "",
      expired_at: item.expired_at || "",
    });
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setFormData({
      name: "",
      slug: "",
      content: "",
      type: "general",
      is_active: 1,
      published_at: "",
      expired_at: "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const token = Cookies.get("token");
      if (!token) throw new Error("Token not found");

      const method = formData.id ? "PUT" : "POST";
      const url = formData.id
        ? `${process.env.NEXT_PUBLIC_BASE_URL_API}/api/information/${formData.id}`
        : `${process.env.NEXT_PUBLIC_BASE_URL_API}/api/information`;

      const payload = {
        ...formData,
        slug: formData.slug || generateSlug(formData.name),
      };

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchInformation();
        Swal.fire({
          title: "Success",
          text: "Information has been saved",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
          background: "#1f2937",
          color: "#F9FAFB",
        });
      } else {
        const errorData = await res.json();
        Swal.fire("Error", errorData.message || "Failed to save", "error");
      }
    } catch (error) {
      Swal.fire("Error", "Network error or server unavailable", "error");
    }
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You will not be able to recover this information!",
      icon: "warning",
      showCancelButton: true,
      background: "#1f2937", // ⬅️ dark gray background
      color: "#F9FAFB", // ⬅️ light text
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "rounded-xl", // biar lebih smooth
      },
    });

    if (result.isConfirmed) {
      try {
        const token = Cookies.get("token");
        if (!token) throw new Error("Token not found");

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL_API}/api/information/${id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        if (res.ok) {
          fetchInformation();
          Swal.fire({
            title: "Deleted!",
            text: "Information has been deleted.",
            icon: "success",
            timer: 2000, // ⬅️ auto close setelah 2 detik
            showConfirmButton: false,
            background: "#1f2937",
            color: "#F9FAFB",
            customClass: {
              popup: "rounded-xl p-6",
            },
          });
        } else {
          const errorData = await res.json();
          Swal.fire({
            title: "Error",
            text: errorData.message || "Failed to delete",
            icon: "error",
            background: "#1f2937",
            color: "#F9FAFB",
          });
        }
      } catch (error) {
        Swal.fire({
          title: "Error",
          text: "Failed to delete information",
          icon: "error",
          background: "#1f2937",
          color: "#F9FAFB",
        });
      }
    }
  };

  useEffect(() => {
    fetchInformation();
  }, [fetchInformation]);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchInformation(1, searchTerm);
    }, 400);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchTerm, fetchInformation]);

  useEffect(() => {
    if (formData.name) {
      setFormData((prev) => ({
        ...prev,
        slug: generateSlug(prev.name),
      }));
    }
  }, [formData.name]);

  const formatDateID = (dateString: string) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
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
              <Info className="w-6 h-6" /> Information Management
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              Manage general information and announcements
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAdd}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Information
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-gray-900 p-4 rounded-lg">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search information by name..."
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
        </div>

        {/* Table */}
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="px-6 py-3 text-left">No</th>
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Type</th>
                <th className="px-6 py-3 text-left">Active</th>
                <th className="px-6 py-3 text-left">Published</th>
                <th className="px-6 py-3 text-left">Expired</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {information.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-800">
                  <td className="px-6 py-4 text-sm text-white">
                    {(currentPage - 1) * perPage + index + 1}
                  </td>
                  <td className="px-6 py-4 font-medium text-white">
                    {item.name}
                    <br></br>
                  </td>
                  <td className="px-6 py-4 text-gray-300">{item.type}</td>
                  <td className="px-6 py-4 text-gray-300">
                    {item.is_active ? "Yes" : "No"}
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    {formatDateID(item.published_at)}
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    {formatDateID(item.expired_at)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <PermissionGuard
                        permissions={["view-information", "show-information"]}
                      >
                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            setIsDetailOpen(true);
                          }}
                          className="text-blue-400 hover:text-blue-300 p-1 cursor-pointer"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      </PermissionGuard>

                      <PermissionGuard permissions={["update-information"]}>
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-green-400 hover:text-green-300 p-1 cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </PermissionGuard>

                      <PermissionGuard permissions={["delete-information"]}>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </PermissionGuard>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {information.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-400">
              No information found
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center min-h-[40vh] bg-gray-900 rounded-lg">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500"></div>
              <p className="mt-4 text-gray-400">Loading information...</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Showing {(currentPage - 1) * perPage + 1} to{" "}
              {Math.min(currentPage * perPage, totalData)} of {totalData}{" "}
              results
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm border border-gray-600 rounded-md disabled:opacity-50"
              >
                Previous
              </button>
              {getPaginationNumbers().map((page, index) => (
                <div key={index}>
                  {page === "..." ? (
                    <span className="px-3 py-2 text-sm text-gray-500">...</span>
                  ) : (
                    <button
                      onClick={() => handlePageChange(page as number)}
                      className={`px-3 py-2 text-sm border rounded-md ${
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
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm border border-gray-600 rounded-md disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <Dialog.Root
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        modal={true}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
          <Dialog.Content className="fixed top-1/2 left-1/2 bg-gray-900 text-white rounded-2xl w-[95%] max-w-3xl -translate-x-1/2 -translate-y-1/2 max-h-[90vh] overflow-y-auto shadow-xl z-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4 flex items-center gap-2 rounded-t-2xl">
              <Info className="w-5 h-5" />
              <Dialog.Title className="text-lg font-semibold">
                Information Detail
              </Dialog.Title>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {selectedItem ? (
                <>
                  {/* Metadata */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-800 rounded-lg p-4">
                      <p className="text-xs uppercase text-gray-400">Name</p>
                      <p className="font-semibold text-white">
                        {selectedItem.name}
                      </p>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4">
                      <p className="text-xs uppercase text-gray-400">Slug</p>
                      <p className="font-semibold text-white">
                        {selectedItem.slug}
                      </p>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4">
                      <p className="text-xs uppercase text-gray-400">Type</p>
                      <p className="font-semibold capitalize">
                        {selectedItem.type}
                      </p>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4">
                      <p className="text-xs uppercase text-gray-400">Active</p>
                      <p className="font-semibold">
                        {selectedItem.is_active ? (
                          <span className="text-green-400">Yes</span>
                        ) : (
                          <span className="text-red-400">No</span>
                        )}
                      </p>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4">
                      <p className="text-xs uppercase text-gray-400">
                        Published At
                      </p>
                      <p className="font-semibold">
                        {formatDateID(selectedItem.published_at)}
                      </p>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4">
                      <p className="text-xs uppercase text-gray-400">
                        Expired At
                      </p>
                      <p className="font-semibold">
                        {formatDateID(selectedItem.expired_at)}
                      </p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="bg-gray-800 rounded-lg p-4">
                    <p className="text-xs uppercase text-gray-400 mb-2">
                      Content
                    </p>
                    <div
                      className="prose prose-invert max-w-none text-gray-200"
                      dangerouslySetInnerHTML={{ __html: selectedItem.content }}
                    />
                  </div>
                </>
              ) : (
                <p className="text-gray-400">No data selected</p>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-800 px-6 py-4 flex justify-end rounded-b-2xl">
              <button
                onClick={() => setIsDetailOpen(false)}
                className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center gap-2 text-white transition"
              >
                <X className="w-4 h-4" /> Close
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Modal */}
      <Dialog.Root
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        modal={true}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
          <Dialog.Content className="fixed top-1/2 left-1/2 bg-gray-800 text-white rounded-lg w-[100%] max-w-2xl -translate-x-1/2 -translate-y-1/2 max-h-[90vh] overflow-y-auto z-50">
            <div className="bg-blue-600 px-6 py-4 flex items-center gap-2">
              {formData.id ? (
                <>
                  <Pencil className="w-5 h-5" />
                  <Dialog.Title className="text-lg font-semibold">
                    Edit Information
                  </Dialog.Title>
                </>
              ) : (
                <>
                  <PlusCircle className="w-5 h-5" />
                  <Dialog.Title className="text-lg font-semibold">
                    Add Information
                  </Dialog.Title>
                </>
              )}
            </div>

            <div className="p-6 space-y-4">
              {/* Name & Slug */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter information name"
                  className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {/* <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">
                  Slug
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  disabled
                  placeholder="Auto-generated slug"
                  className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-gray-400"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Generated automatically from name
                </p>
              </div> */}
              {/* Type & Active side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white"
                  >
                    <option value="general">General</option>
                    <option value="announcement">Announcement</option>
                    <option value="news">News</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">
                    Active
                  </label>
                  <select
                    value={formData.is_active}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        is_active: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white"
                  >
                    <option value={1}>Yes</option>
                    <option value={0}>No</option>
                  </select>
                </div>
              </div>
              {/* Published & Expired side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">
                    Published At
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.published_at}
                    onChange={(e) =>
                      setFormData({ ...formData, published_at: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">
                    Expired At
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.expired_at}
                    onChange={(e) =>
                      setFormData({ ...formData, expired_at: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white"
                  />
                </div>
              </div>
              {/* Content */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">
                  Content
                </label>
                <Editor
                  apiKey="uvz5s0262zi3cdi6cxwnffmf347hpqccxisuhi58t3dut8iw"
                  init={{
                    height: 400,
                    menubar: false,
                    skin: "oxide-dark", // ⬅️ gunakan dark skin
                    content_css: "dark", // ⬅️ isi editor juga dark
                    plugins: [
                      "advlist",
                      "autolink",
                      "lists",
                      "link",
                      "image",
                      "charmap",
                      "preview",
                      "anchor",
                      "searchreplace",
                      "visualblocks",
                      "code",
                      "fullscreen",
                      "insertdatetime",
                      "media",
                      "table",
                      "help",
                      "wordcount",
                    ],
                    toolbar:
                      "undo redo | blocks | bold italic underline forecolor | " +
                      "alignleft aligncenter alignright alignjustify | " +
                      "bullist numlist outdent indent | removeformat | " +
                      "link image | code",
                    content_style:
                      "body { font-family:Helvetica,Arial,sans-serif; font-size:14px; color:#d1d5db; background-color:#1f2937; }",
                  }}
                  value={formData.content}
                  onEditorChange={(content) =>
                    setFormData({ ...formData, content })
                  }
                />
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-700 px-6 py-4 flex justify-end gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 flex items-center gap-2 text-white"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!formData.name.trim()}
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 flex items-center gap-2 text-white"
              >
                {formData.id ? (
                  <>
                    <Save className="w-4 h-4" /> Update
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" /> Create
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
