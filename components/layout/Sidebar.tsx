'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import clsx from 'clsx';
import * as Dialog from '@radix-ui/react-dialog';
import { Menu, X } from 'lucide-react';

interface MenuItem {
  label: string;
  href: string;
  permission?: string;
}

const menuItems: MenuItem[] = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Users', href: '/users', permission: 'view-users' },
  { label: 'Roles', href: '/roles', permission: 'view-roles' },
  { label: 'Admin Panel', href: '/admin', permission: 'access-admin-panel' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const stored = Cookies.get('permissions');
    if (stored) {
      setPermissions(JSON.parse(stored));
    }
  }, []);

  const hasPermission = (perm?: string) => {
    if (!perm) return true;
    return permissions.includes(perm);
  };

  const SidebarContent = () => (
    <nav className="flex flex-col gap-1 p-0">
      {menuItems
        .filter((item) => hasPermission(item.permission))
        .map((item) => (
         <Link
          key={item.href}
          href={item.href}
          onClick={() => setOpen(false)}
          className={clsx(
            'px-3 py-2 rounded font-medium transition-colors',
            pathname.startsWith(item.href)
              ? 'bg-red-700 text-white hover:bg-red-700 hover:text-white'
              : 'text-white hover:bg-red-700 hover:text-white'
          )}
        >
          {item.label}
        </Link>
        ))}
    </nav>
  );

  return (
    <>
      {/* Sidebar Desktop */}
      <aside className="w-64 bg-gray-900 border-r h-auto p-4 hidden md:block text-gray-700">
        <SidebarContent />
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
            <Dialog.Content className="fixed top-0 left-0 w-64 h-full bg-black/40 z-50 shadow-md text-white">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-bold">Menu</h2>
                <button onClick={() => setOpen(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <SidebarContent />
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </>
  );
}
