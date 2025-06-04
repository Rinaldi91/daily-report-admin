"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { FileText, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

interface UserInfo {
  name: string;
  role?: {
    name: string;
  };
}

export default function Header() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const router = useRouter();

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
  }, []);

  const handleLogout = () => {
    Cookies.remove("token");
    Cookies.remove("user");
    Cookies.remove("role");
    Cookies.remove("permissions");
    router.push("/login");
  };

  return (
    <header className="w-full bg-red-700 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
      {/* Mobile Menu Button (Sidebar Trigger) */}
      <div className="md:hidden">
        {/* Sidebar Dialog Trigger ada di Sidebar.tsx */}
        {/* <button className="p-2">
          <Menu className="w-6 h-6" />
        </button> */}
      </div>
      <div className="flex items-center text-lg font-semibold text-white ml-1">
        <FileText className="w-5 h-5 mr-2" />
        Service Report
      </div>
      <div className="flex items-center gap-4">
        {user && (
          <div className="text-sm text-white text-right hidden md:block">
            <div>{user.name}</div>
            <div className="text-xs text-white">{user.role?.name}</div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="p-2 rounded transition-colors hover:bg-gray-100 group"
          title="Logout"
        >
          <LogOut className="w-5 h-5 text-white group-hover:text-red-700 transition-colors cursor-pointer" />
        </button>
      </div>
    </header>
  );
}
