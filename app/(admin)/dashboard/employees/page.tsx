import PermissionGuard from "@/components/PermissionGuard";
import EmployeesClientPage from "./employeesPage";

export default function Page() {
  // Sesuaikan izin (permission) sesuai dengan yang Anda definisikan untuk modul employee
  return (
    <PermissionGuard
      permissions={[
        "view-employee",
        "create-employee",
        "update-employee",
        "delete-employee",
        "show-employee",
      ]}
    >
      <EmployeesClientPage />
    </PermissionGuard>
  );
}
