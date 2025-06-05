"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import clsx from "clsx";
import * as Dialog from "@radix-ui/react-dialog";
import {
  LayoutDashboard,
  LucideIcon,
  Menu,
  Shield,
  Users,
  X,
  ChevronDown,
  ChevronRight,
  SquareUserRound,
  Key,
  Building2,
  ClipboardTypeIcon,
  Hospital,
} from "lucide-react";

interface MenuItem {
  label: string;
  href?: string;
  icon: LucideIcon;
  permission?: string;
  children?: MenuItem[];
}

interface SidebarProps {
  isCollapsed?: boolean;
}

const menuItems: MenuItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "User Management",
    href: "#",
    icon: SquareUserRound,
    children: [
       {
        label: "Permissions",
        href: "/dashboard/permissions",
        icon: Key,
        permission: "view-roles",
      },
      {
        label: "Roles",
        href: "/dashboard/roles",
        icon: Shield,
        permission: "view-roles",
      },
      {
        label: "Users",
        href: "/dashboard/users",
        icon: Users,
        permission: "view-users",
      },
    ],
  },
  {
    label: "Master Data",
    href: "#",
    icon: Building2,
    children: [
       {
        label: "Type Of Facilities",
        href: "/dashboard/type-of-health-facilities",
        icon: ClipboardTypeIcon,
        permission: "view-type-of-health-facility",
      },
      {
        label: "Health Facilities",
        href: "/dashboard/health-facilities",
        icon: Hospital,
        permission: "view-health-facility",
      },
    ],
  },
];

export default function Sidebar({ isCollapsed = false }: SidebarProps) {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [activeHref, setActiveHref] = useState<string | null>(null);

  useEffect(() => {
    const stored = Cookies.get("permissions");
    if (stored) {
      setPermissions(JSON.parse(stored));
    }
  }, []);

  const hasPermission = (perm?: string) => {
    if (!perm) return true;
    return permissions.includes(perm);
  };

  useEffect(() => {
    const stored = localStorage.getItem("activeMenu");
    if (stored) {
      setActiveHref(stored);
    }
  }, []);

  const handleClick = (href: string) => {
    setActiveHref(href);
    localStorage.setItem("activeMenu", href);
  };

  const SidebarContent = ({ collapsed = false }: { collapsed?: boolean }) => {
    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
    const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
    const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

    const toggleMenu = (label: string) => {
      if (collapsed) return; // Don't allow toggle when collapsed
      setOpenMenus((prev) => ({
        ...prev,
        [label]: !prev[label],
      }));
    };

    const handleMouseEnter = (label: string) => {
      if (!collapsed) return;
      
      // Clear any existing timeout
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
      
      setHoveredMenu(label);
    };

    const handleMouseLeave = () => {
      if (!collapsed) return;
      
      // Add delay before hiding popup
      const timeout = setTimeout(() => {
        setHoveredMenu(null);
      }, 150); // 150ms delay
      
      setHoverTimeout(timeout);
    };

    const handlePopupMouseEnter = () => {
      if (!collapsed) return;
      
      // Clear timeout when mouse enters popup
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
        setHoverTimeout(null);
      }
    };

    const handlePopupMouseLeave = () => {
      if (!collapsed) return;
      
      // Hide popup when mouse leaves popup area
      setHoveredMenu(null);
    };

    // Cleanup timeout on unmount
    useEffect(() => {
      return () => {
        if (hoverTimeout) {
          clearTimeout(hoverTimeout);
        }
      };
    }, [hoverTimeout]);

    return (
      <nav className="flex flex-col gap-1 p-0">
        {menuItems.map((item) => {
          const hasChildren = item.children && item.children.length > 0;

          if (hasChildren) {
            const isOpen = !collapsed && (openMenus[item.label] || false);
            const isHovered = collapsed && hoveredMenu === item.label;

            return (
              <div key={item.label} className="relative">
                <button
                  onClick={() => toggleMenu(item.label)}
                  onMouseEnter={() => handleMouseEnter(item.label)}
                  onMouseLeave={handleMouseLeave}
                  className={clsx(
                    "w-full px-3 py-2 font-semibold text-white flex items-center gap-2 hover:bg-red-700 rounded transition cursor-pointer",
                    collapsed ? "justify-center" : ""
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon size={20} className="flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left font-semibold">{item.label}</span>
                      {isOpen ? (
                        <ChevronDown className="w-4 h-4 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 flex-shrink-0" />
                      )}
                    </>
                  )}
                </button>

                {/* Normal submenu when not collapsed */}
                {isOpen && !collapsed && (
                  <div className="ml-4 mt-1 flex flex-col gap-1 font-semibold">
                    {(item.children ?? [])
                      .filter((child) => hasPermission(child.permission))
                      .map((child) => {
                        const isActive = activeHref === child.href;
                        const IconComponent = child.icon;

                        return (
                          <Link
                            key={child.href}
                            href={child.href!}
                            onClick={() => handleClick(child.href!)}
                            className={clsx(
                              "px-3 py-2 rounded font-medium transition-colors flex items-center gap-2 cursor-pointer",
                              isActive
                                ? "bg-red-700 text-white"
                                : "text-white hover:bg-red-700 hover:text-white"
                            )}
                          >
                            <IconComponent size={18} className="flex-shrink-0" />
                            {child.label}
                          </Link>
                        );
                      })}
                  </div>
                )}

                {/* Popup submenu when collapsed */}
                {isHovered && collapsed && (
                  <div 
                    className="absolute left-full top-0 ml-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 min-w-48"
                    onMouseEnter={handlePopupMouseEnter}
                    onMouseLeave={handlePopupMouseLeave}
                  >
                    <div className="p-2">
                      <div className="px-3 py-2 text-white font-semibold border-b border-gray-700 mb-2">
                        {item.label}
                      </div>
                      <div className="flex flex-col gap-1">
                        {(item.children ?? [])
                          .filter((child) => hasPermission(child.permission))
                          .map((child) => {
                            const isActive = activeHref === child.href;
                            const IconComponent = child.icon;

                            return (
                              <Link
                                key={child.href}
                                href={child.href!}
                                onClick={() => {
                                  handleClick(child.href!);
                                  setHoveredMenu(null);
                                  // Clear any existing timeout
                                  if (hoverTimeout) {
                                    clearTimeout(hoverTimeout);
                                    setHoverTimeout(null);
                                  }
                                }}
                                className={clsx(
                                  "px-3 py-2 rounded font-medium transition-colors flex items-center gap-2 cursor-pointer",
                                  isActive
                                    ? "bg-red-700 text-white"
                                    : "text-white hover:bg-red-700 hover:text-white"
                                )}
                              >
                                <IconComponent size={18} className="flex-shrink-0" />
                                {child.label}
                              </Link>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          }

          if (!hasPermission(item.permission)) return null;

          const isActive = activeHref === item.href;
          const IconComponent = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href!}
              onClick={() => handleClick(item.href!)}
              className={clsx(
                "px-3 py-2 rounded font-medium transition-colors flex items-center gap-2",
                collapsed ? "justify-center" : "",
                isActive
                  ? "bg-red-700 text-white"
                  : "text-white hover:bg-red-700 hover:text-white"
              )}
              title={collapsed ? item.label : undefined}
            >
              <IconComponent size={20} className="flex-shrink-0" />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>
    );
  };

  return (
    <>
      {/* Sidebar Desktop */}
      <aside 
        className={clsx(
          "bg-gray-900 border-r h-auto p-4 hidden md:block text-gray-700 transition-all duration-300 ease-in-out",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        <SidebarContent collapsed={isCollapsed} />
      </aside>

      {/* Sidebar Mobile */}
      <div className="md:hidden">
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger asChild>
            <button className="p-2">
              <Menu className="w-6 h-6" />
            </button>
          </Dialog.Trigger>

          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
            <Dialog.Content className="fixed top-0 left-0 w-64 h-full bg-gray-900 z-50 shadow-md text-white">
              <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <h2 className="text-lg font-bold">Menu</h2>
                <button onClick={() => setOpen(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4">
                <SidebarContent collapsed={false} />
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </>
  );
}