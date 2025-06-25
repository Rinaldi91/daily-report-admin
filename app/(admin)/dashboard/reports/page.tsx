import PermissionGuard from "@/components/PermissionGuard";
import ReportsClientPage from "./reportsPage";

export default function Page() {
  return (
    <PermissionGuard
      permissions={[
        "view-report",
        "create-report",
        "update-report",
        "delete-report",
        "show-report",
      ]}
    >
      <ReportsClientPage />
    </PermissionGuard>
  );
}
