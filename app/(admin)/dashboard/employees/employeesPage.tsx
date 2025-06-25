"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Cookies from "js-cookie";
import Link from "next/link";
import { Edit, Trash2, Users, Plus, Search, Eye, X } from "lucide-react";
import Swal from "sweetalert2";
import Image from "next/image";

// --- Interface Definitions ---
interface Division {
  id: number;
  name: string;
}

interface Position {
  id: number;
  name: string;
}

interface Employee {
  id: number;
  name: string;
  nik: string;
  employee_number: string;
  email: string;
  phone_number: string;
  is_active: number;
  photo_url: string;
  division: Division;
  position: Position;
}

export default function EmployeesClientPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [perPage, setPerPage] = useState(10);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedDivision, setSelectedDivision] = useState<string>("");
  const [selectedPosition, setSelectedPosition] = useState<string>("");
  const [selectedIsActive, setSelectedIsActive] = useState<string>("");

  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [userRole, setUserRole] = useState<string>("");

  // State for selected items using a Set for efficiency
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const hasPermission = (slug: string) => {
    if (userRole.toLowerCase() === "super-admin") return true;
    return userPermissions.includes(slug);
  };

  const fetchDropdownData = async () => {
    try {
      const token = Cookies.get("token");
      const [divRes, posRes] = await Promise.all([
        fetch("http://report-api.test/api/division?all", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://report-api.test/api/position?all", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const divJson = await divRes.json();
      const posJson = await posRes.json();

      if (divJson.status) setDivisions(divJson.data);
      if (posJson.status) setPositions(posJson.data);
    } catch (err) {
      console.error("Failed to fetch dropdown data", err);
    }
  };

  const fetchEmployees = useCallback(
    async (page: number = 1) => {
      setLoading(true);
      setError(null);
      // Clear selection when fetching new data
      setSelectedItems(new Set());
      try {
        const token = Cookies.get("token");
        if (!token) throw new Error("Unauthorized");

        const params = new URLSearchParams();
        params.append("page", page.toString());
        if (searchTerm.trim()) params.append("search", searchTerm);
        if (selectedDivision) params.append("division_id", selectedDivision);
        if (selectedPosition) params.append("position_id", selectedPosition);
        if (selectedIsActive) params.append("is_active", selectedIsActive);

        const res = await fetch(
          `http://report-api.test/api/employee?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        if (!res.ok) throw new Error("Failed to fetch employees");
        const json = await res.json();

        setEmployees(json.data || []);
        setCurrentPage(json.meta.current_page);
        setTotalPages(json.meta.last_page);
        setTotalEmployees(json.meta.total);
        setPerPage(json.meta.per_page);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Error fetching employees"
        );
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    },
    [searchTerm, selectedDivision, selectedPosition, selectedIsActive]
  );

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You will not be able to recover this employee!",
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
        const res = await fetch(`http://report-api.test/api/employee/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (res.ok) {
          Swal.fire({
            title: "Deleted!",
            text: "Employee has been deleted.",
            icon: "success",
            background: "#1e293b",
            color: "#f8fafc",
            timer: 2000,
            showConfirmButton: false,
          });
          fetchEmployees(currentPage); // Re-fetch the current page
        } else {
          const errorData = await res.json();
          Swal.fire({
            title: "Error!",
            text: errorData.message || "Failed to delete employee.",
            icon: "error",
            background: "#1e293b",
            color: "#f8fafc",
          });
        }
      } catch {
        Swal.fire({
          title: "Error!",
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

    const selectedEmployeesData = employees.filter((emp) =>
      selectedItems.has(emp.id)
    );
    const employeeNames = selectedEmployeesData
      .map((emp) => emp.name)
      .join(", ");

    const result = await Swal.fire({
      title: "Delete Multiple Employees?",
      html: `
        <p>You are about to delete <strong>${selectedItems.size}</strong> employee(s):</p>
        <p style="font-size: 14px; color: #9CA3AF; margin-top: 8px;">${employeeNames}</p>
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
          fetch(`http://report-api.test/api/employee/${id}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          })
        );

        const results = await Promise.allSettled(deletePromises);
        const successCount = results.filter(
          (res) => res.status === "fulfilled" && res.value.ok
        ).length;
        const failedCount = selectedItems.size - successCount;

        if (failedCount === 0) {
              Swal.fire({
                title:"Success!", 
                text: `Successfully deleted ${successCount} employees.`, 
                icon: "success",
                background: "#1e293b",
                color: "#f8fafc",
              });
            } else {
              Swal.fire({
                title:"Partially Completed", 
                text:`Deleted ${successCount} successfully. ${failedCount} failed.`, 
                icon:"warning",
                background: "#1e293b",
                color: "#f8fafc",
              });
            }
      } catch {
        Swal.fire({
          title: "Error!",
          text: "An unexpected error occurred during bulk deletion.",
          icon: "error",
          background: "#1e293b",
          color: "#f8fafc",
        });
      } finally {
        setIsDeleting(false);
        setSelectedItems(new Set()); // Clear selection in all cases
        fetchEmployees();
      }
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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIdsOnPage = employees.map((emp) => emp.id);
      setSelectedItems(new Set(allIdsOnPage));
    } else {
      setSelectedItems(new Set());
    }
  };
  
  // Fungsi untuk membersihkan semua filter
  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedDivision("");
    setSelectedPosition("");
    setSelectedIsActive("");
  };

  useEffect(() => {
    const initializeData = () => {
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
      fetchDropdownData();
    };
    initializeData();
  }, []);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchEmployees(1);
    }, 400);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [fetchEmployees]);

  const handlePageChange = useCallback(
    (page: number) => {
      if (page >= 1 && page <= totalPages) {
        fetchEmployees(page);
      }
    },
    [totalPages, fetchEmployees]
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

    if (currentPage - delta > 2) range.unshift("...");
    if (currentPage + delta < totalPages - 1) range.push("...");

    range.unshift(1);
    if (totalPages > 1) range.push(totalPages);

    return [...new Set(range)];
  };

  const isAllSelected =
    employees.length > 0 && selectedItems.size === employees.length;
  const isIndeterminate = selectedItems.size > 0 && !isAllSelected;

  // Cek apakah ada filter yang aktif
  const isFilterActive = searchTerm || selectedDivision || selectedPosition || selectedIsActive;

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[40vh] bg-gray-900 rounded-lg">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500"></div>
          <p className="mt-4 text-gray-400">Loading Employees...</p>
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

    if (employees.length === 0) {
      return (
        <div className="bg-gray-900 rounded-lg text-center min-h-[40vh] flex flex-col justify-center items-center p-6">
          <Users className="w-16 h-16 text-gray-600 mb-4" />
          <h3 className="text-xl font-semibold text-white">
            No Employees Found
          </h3>
          <p className="text-gray-500 mt-2 max-w-sm">
            {searchTerm || selectedDivision || selectedPosition || selectedIsActive
              ? "Try adjusting your search or filter."
              : "Get started by adding a new employee."}
          </p>
        </div>
      );
    }

    return (
      <div className="bg-gray-900 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800 text-white">
              <tr>
                {hasPermission("delete-employee") && (
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 cursor-pointer"
                      checked={isAllSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isIndeterminate;
                      }}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  NIK / Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Division
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {employees.map((employee, index) => (
                <tr
                  key={employee.id}
                  className={
                    selectedItems.has(employee.id)
                      ? "bg-gray-800"
                      : "hover:bg-gray-800/50"
                  }
                >
                  {hasPermission("delete-employee") && (
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        className="form-checkbox h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 cursor-pointer"
                        checked={selectedItems.has(employee.id)}
                        onChange={(e) =>
                          handleSelectItem(employee.id, e.target.checked)
                        }
                      />
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {(currentPage - 1) * perPage + index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 relative">
                        <Image
                          className="rounded-full object-cover"
                          src={
                            employee.photo_url ||
                            "https://placehold.co/40x40/1f2937/F9FAFB?text=N/A"
                          }
                          alt={employee.name}
                          fill
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-white">
                          {employee.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    <div>NIK: {employee.nik}</div>
                    <div className="text-gray-400">
                      No: {employee.employee_number}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    <div>{employee.email}</div>
                    <div className="text-gray-400">{employee.phone_number}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    <div>{employee.division.name}</div>
                    <div className="text-gray-400">
                      {employee.position.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        employee.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {employee.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {hasPermission("show-employee") && (
                        <Link
                          href={`/dashboard/employees/${employee.id}`}
                          className="text-blue-400 hover:text-blue-300 p-1 cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      )}
                      {hasPermission("update-employee") && (
                        <Link
                          href={`/dashboard/employees/${employee.id}/edit`}
                          className="text-green-400 hover:text-green-300 p-1 cursor-pointer"
                          title="Edit Employee"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                      )}
                      {hasPermission("delete-employee") && (
                        <button
                          onClick={() => handleDelete(employee.id)}
                          className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                          title="Delete Employee"
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
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-white">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6" /> Employee Management
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Manage your companys employees
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedItems.size > 0 && hasPermission("delete-employee") && (
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
          {hasPermission("create-employee") && (
            <Link
              href="/dashboard/employees/create"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Employee
            </Link>
          )}
        </div>
      </div>

      <div className="bg-gray-900 p-4 rounded-lg flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-grow w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by employee name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-gray-800 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-blue-500"
          />
          {searchTerm && (
            <X
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 cursor-pointer hover:text-white"
              onClick={() => setSearchTerm("")}
            />
          )}
        </div>
        <select
          value={selectedDivision}
          onChange={(e) => setSelectedDivision(e.target.value)}
          className="w-full md:w-auto px-3 py-2 rounded bg-gray-800 border border-gray-800 text-white cursor-pointer focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Divisions</option>
          {divisions.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <select
          value={selectedPosition}
          onChange={(e) => setSelectedPosition(e.target.value)}
          className="w-full md:w-auto px-3 py-2 rounded bg-gray-800 border border-gray-800 text-white cursor-pointer focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Positions</option>
          {positions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          value={selectedIsActive}
          onChange={(e) => setSelectedIsActive(e.target.value)}
          className="w-full md:w-auto px-3 py-2 rounded bg-gray-800 border border-gray-800 text-white cursor-pointer focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Status</option>
          <option key={1} value={1}>{"Active"}</option>
          <option key={0} value={0}>{"InActive"}</option>
        </select>
        {isFilterActive && (
          <button
            onClick={handleClearFilters}
            className="flex-shrink-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-gray-500 transition-colors cursor-pointer"
            title="Clear all filters"
          >
            <X className="w-4 h-4 mr-2 -ml-1" />
            Clear
          </button>
        )}
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

      {totalPages > 1 && !loading && !error && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
          <div className="text-sm text-gray-400">
            Showing {(currentPage - 1) * perPage + 1} to{" "}
            {Math.min(currentPage * perPage, totalEmployees)} of{" "}
            {totalEmployees} results
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
    </div>
  );
}
