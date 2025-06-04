'use client';

import Cookies from 'js-cookie';

interface PermissionGuardProps {
  permission: string;
  children: React.ReactNode;
}

export default function PermissionGuard({ permission, children }: PermissionGuardProps) {
  const raw = Cookies.get('permissions') || '[]';
  const permissions: string[] = JSON.parse(raw);

  if (!permissions.includes(permission)) return null;

  return <>{children}</>;
}
