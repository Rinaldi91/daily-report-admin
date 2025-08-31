"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Cookies from "js-cookie";
import { FileText, LogOut, Search, ChevronLeft, Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
config.autoAddCss = false;

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { renderToString } from "react-dom/server";

const MySwal = withReactContent(Swal);

interface UserInfo {
  name: string;
  role?: {
    name: string;
  };
}

interface MenuItem {
  label: string;
  href?: string;
  permission?: string;
  children?: MenuItem[];
}

interface HeaderProps {
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

interface DeviceNotification {
  medical_device_id: number;
  last_service: string;
  days_since_service: number;
  brand: string;
  model: string;
  serial_number: string;
  health_facility: string;
  employee_name: string;
}

// Menu items data (same as in Sidebar.tsx)
const menuItems: MenuItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
  },
  {
    label: "Users",
    href: "/dashboard/users",
    permission: "view-users",
  },
  {
    label: "Roles",
    href: "/dashboard/roles",
    permission: "view-roles",
  },
  {
    label: "Permissions",
    href: "/dashboard/permissions",
    permission: "view-roles",
  },
  {
    label: "Roles",
    href: "/dashboard/roles",
    permission: "view-roles",
  },
  {
    label: "Device Categories ",
    href: "/dashboard/medical-device-categories",
    permission: "view-medical-device-category",
  },
  {
    label: "Medical Devices ",
    href: "/dashboard/medical-devices",
    permission: "view-medical-device",
  },
  {
    label: "Type Of Facilities",
    href: "/dashboard/type-of-health-facilities",
    permission: "view-type-of-health-facility",
  },
  {
    label: "Health Facilities",
    href: "/dashboard/health-facilities",
    permission: "view-health-facility",
  },
  {
    label: "Divisions",
    href: "/dashboard/divisions",
    permission: "view-division",
  },
  {
    label: "Positions",
    href: "/dashboard/positions",
    permission: "view-position",
  },
];

export default function Header({
  onToggleSidebar,
  isSidebarCollapsed = false,
}: HeaderProps) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredMenus, setFilteredMenus] = useState<MenuItem[]>([]);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<DeviceNotification[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = Cookies.get("token");
        if (!token) return;

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL_API}/api/notification-device`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        const data = await res.json();
        if (data.status && Array.isArray(data.data)) {
          setNotifications(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      }
    };

    fetchNotifications();
  }, []);

  useEffect(() => {
    const stored = Cookies.get("user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      } catch {
        setUser(null);
      }
    }

    const storedPermissions = Cookies.get("permissions");
    if (storedPermissions) {
      setPermissions(JSON.parse(storedPermissions));
    }
  }, []);

  // Flatten menu items for searching
  const getAllMenuItems = (items: MenuItem[]): MenuItem[] => {
    const result: MenuItem[] = [];

    items.forEach((item) => {
      if (item.children) {
        // Add children items
        item.children.forEach((child) => {
          result.push(child);
        });
      } else if (item.href) {
        // Add parent item if it has href
        result.push(item);
      }
    });

    return result;
  };

  // Moved hasPermission inside useCallback to fix dependency issue
  const hasPermission = useCallback(
    (perm?: string) => {
      if (!perm) return true;
      return permissions.includes(perm);
    },
    [permissions]
  );

  // Filter menus based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredMenus([]);
      return;
    }

    const allMenus = getAllMenuItems(menuItems);
    const filtered = allMenus.filter(
      (menu) =>
        hasPermission(menu.permission) &&
        menu.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredMenus(filtered);
  }, [searchTerm, hasPermission]); // Added hasPermission to dependencies

  // Handle click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleMenuClick = (href: string) => {
    setSearchTerm("");
    // Store active menu in localStorage like in Sidebar
    localStorage.setItem("activeMenu", href);
    router.push(href);
  };

  const handleToggleSidebar = () => {
    if (onToggleSidebar) {
      onToggleSidebar();
    }
  };

  const handleLogout = async () => {
    const result = await MySwal.fire({
      title: "Are you sure?",
      text: "You will be logged out from your account.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444", // Tailwind red-500
      cancelButtonColor: "#6b7280", // Tailwind gray-500
      confirmButtonText: "Yes, log out",
      cancelButtonText: "No",
      background: "#111827", // Tailwind bg-gray-900
      color: "#F9FAFB", // Tailwind text-gray-100
      customClass: {
        popup: "rounded-xl", // optional styling
      },
    });

    if (result.isConfirmed) {
      Cookies.remove("token");
      Cookies.remove("user");
      Cookies.remove("role");
      Cookies.remove("permissions");

      await MySwal.fire({
        icon: "success",
        title: "Logged out",
        text: "You have been logged out successfully.",
        timer: 1500,
        showConfirmButton: false,
        background: "#111827",
        color: "#F9FAFB",
        customClass: {
          popup: "rounded-xl",
        },
      });

      router.push("/login");
    }
  };

  return (
    <header className="w-auto bg-red-700 border-b border-red-800 px-4 py-2 flex items-center justify-between sticky top-0 z-50 shadow-sm">
      {/* Logo/Brand Section */}
      <div className="flex items-center flex-1">
        <div className="flex items-center mr-4">
          <div className="bg-white p-2 rounded-lg mr-3">
            <FileText className="w-6 h-6 text-red-700" />
          </div>
          <span className="text-xl font-bold text-white">Service Report</span>
        </div>

        {/* Navigation Back Button - Now with toggle functionality */}
        <button
          onClick={handleToggleSidebar}
          className="p-2 hover:bg-red-600 rounded-lg transition-colors mr-2 cursor-pointer"
          title={isSidebarCollapsed ? "Show Sidebar" : "Hide Sidebar"}
        >
          <ChevronLeft
            className={`w-5 h-5 text-white transition-transform duration-200 ${
              isSidebarCollapsed ? "rotate-180" : ""
            }`}
          />
        </button>

        <div
          className="flex-1 max-w-2xl mx-4 relative"
          ref={searchContainerRef}
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for results..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-gray-900 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-300 focus:border-red-500 transition-all"
            />
          </div>

          {/* Search Results Dropdown */}
          {filteredMenus.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-60 overflow-y-auto">
              {filteredMenus.map((menu, index) => (
                <button
                  key={`${menu.href}-${index}`}
                  onClick={() => handleMenuClick(menu.href!)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 text-gray-900"
                >
                  <div className="font-medium">{menu.label}</div>
                  <div className="text-sm text-gray-500">{menu.href}</div>
                </button>
              ))}
            </div>
          )}

          {/* No Results Message */}
          {searchTerm.trim() !== "" && filteredMenus.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 p-4 text-center text-gray-500">
              No menu items found for &quot;{searchTerm}&quot;
            </div>
          )}
        </div>
      </div>

      {/* Right Side Icons */}
      <div className="flex items-center gap-2 ml-auto">
        {user && (
          <div className="flex items-center ml-2">
            <div className="w-8 h-8 bg-white rounded-full mr-2 flex items-center justify-center">
              <span className="text-red-700 text-sm font-medium">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="text-sm text-white hidden lg:block">
              <div className="font-medium">{user.name}</div>
              <div className="text-xs text-red-200">{user.role?.name}</div>
            </div>
          </div>
        )}
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 hover:bg-red-600 rounded-lg transition-colors relative cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-5 h-5 text-white hover:text-red-200" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-yellow-400 text-red-900 text-xs font-bold rounded-full px-1">
                {notifications.length}
              </span>
            )}
          </button>

          {/* Dropdown Notification */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-96 bg-gray-800 text-gray-900 rounded-lg shadow-lg border border-gray-500 z-50 max-h-50 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <button
                    key={notif.medical_device_id}
                    onClick={async () => {
                      setIsNotifOpen(false);
                      await MySwal.fire({
                        title: renderToString(
                          <span className="flex items-center text-center gap-2 text-red-500">
                            <FontAwesomeIcon icon={faTriangleExclamation} />{" "}
                            Service Alert
                          </span>
                        ),
                        html: `
                          <div class="bg-gray-800 rounded-lg p-6 mt-4 border border-gray-700">
                            <div class="grid gap-4">
                              <div class="flex items-center justify-between bg-gray-900 rounded-lg p-3 border-l-4 border-red-500">
                                <div class="flex items-center">
                                  <div class="bg-red-500 rounded-full p-2 mr-3">
                                    <i class="fas fa-barcode text-white text-sm"></i>
                                  </div>
                                  <span class="text-gray-300 font-medium">Medical Device</span>
                                </div>
                                <span class="text-white font-mono font-bold">${
                                  notif.brand
                                } ${notif.model}</span>
                              </div>
                              
                              <!-- Serial Number -->
                              <div class="flex items-center justify-between bg-gray-900 rounded-lg p-3 border-l-4 border-blue-500">
                                <div class="flex items-center">
                                  <div class="bg-blue-500 rounded-full p-2 mr-3">
                                    <i class="fas fa-barcode text-white text-sm"></i>
                                  </div>
                                  <span class="text-gray-300 font-medium">Serial Number</span>
                                </div>
                                <span class="text-white font-mono font-bold">${
                                  notif.serial_number
                                }</span>
                              </div>

                              <!-- Health Facility -->
                              <div class="flex items-center justify-between bg-gray-900 rounded-lg p-3 border-l-4 border-green-500">
                                <div class="flex items-center">
                                  <div class="bg-green-500 rounded-full p-2 mr-3">
                                    <i class="fas fa-hospital text-white text-sm"></i>
                                  </div>
                                  <span class="text-gray-300 font-medium">Health Facility</span>
                                </div>
                                <span class="text-white font-semibold">${
                                  notif.health_facility
                                }</span>
                              </div>

                              <!-- Last Service -->
                              <div class="flex items-center justify-between bg-gray-900 rounded-lg p-3 border-l-4 border-purple-500">
                                <div class="flex items-center">
                                  <div class="bg-purple-500 rounded-full p-2 mr-3">
                                    <i class="fas fa-calendar-alt text-white text-sm"></i>
                                  </div>
                                  <span class="text-gray-300 font-medium">Last Service</span>
                                </div>
                                <span class="text-white font-semibold">${new Date(
                                  notif.last_service
                                ).toLocaleDateString("id-ID", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}</span>
                              </div>

                              

                              <!-- Technician -->
                              <div class="flex items-center justify-between bg-gray-900 rounded-lg p-3 border-l-4 border-yellow-500">
                                <div class="flex items-center">
                                  <div class="bg-yellow-500 rounded-full p-2 mr-3">
                                    <i class="fas fa-user-cog text-white text-sm"></i>
                                  </div>
                                  <span class="text-gray-300 font-medium">Technician</span>
                                </div>
                                <span class="text-white font-semibold">${
                                  notif.employee_name
                                }</span>
                              </div>

                              <!-- Days Since Service -->
                              <div class="bg-gradient-to-r from-red-600 to-red-500 rounded-lg p-4 border border-red-400">
                                <div class="flex items-center justify-center">
                                  <div class="text-center">
                                    <div class="text-3xl font-bold text-white">${
                                      notif.days_since_service
                                    }</div>
                                    <div class="text-red-100 font-medium">Days since last service</div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <!-- Action Recommendation -->
                            <div class="mt-6 p-4 bg-yellow-900 bg-opacity-50 border border-yellow-600 rounded-lg">
                              <div class="flex items-start">
                                <i class="fas fa-lightbulb text-yellow-400 mt-1 mr-3"></i>
                                <div>
                                  <h4 class="text-yellow-300 font-semibold mb-2">Recommendation</h4>
                                  <p class="text-yellow-100 text-sm">
                                    This equipment requires immediate attention. Please coordinate with a technician to schedule maintenance.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        `,
                        confirmButtonText: (
                          <span className="flex items-center gap-2">
                            <FontAwesomeIcon icon={faCheck} /> Oke
                          </span>
                        ),
                        confirmButtonColor: "#ef4444",
                        background: "#1f2937",
                        color: "#f9fafb",
                        width: "650",
                        padding: "1em",
                        customClass: {
                          popup:
                            "rounded-2xl shadow-2xl border border-gray-700",
                          title: "mb-0",
                          htmlContainer: "mb-4",
                          confirmButton:
                            "rounded-lg font-semibold px-6 py-3 hover:bg-red-600 transition-colors duration-200",
                        },
                        showClass: {
                          popup:
                            "animate__animated animate__fadeInUp animate__faster",
                        },
                        hideClass: {
                          popup:
                            "animate__animated animate__fadeOutDown animate__faster",
                        },
                      });

                      // 🔹 setelah popup ditutup, auto close panel notifikasi
                      setIsNotifOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors border-b border-gray-300 last:border-b-0 cursor-pointer"
                  >
                    <div className="font-medium text-red-600">
                      ⚠️ {notif.brand} {notif.model}
                    </div>
                    <div className="text-sm text-white">
                      {notif.health_facility} — {notif.days_since_service} Days
                      ago
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No service notification
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="p-2 hover:bg-red-600 rounded-lg transition-colors ml-2 cursor-pointer mr-2"
          title="Logout"
        >
          <LogOut className="w-5 h-5 text-white hover:text-red-200 transition-colors" />
        </button>
      </div>
    </header>
  );
}
