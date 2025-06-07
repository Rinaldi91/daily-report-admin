
import PermissionGuard from "@/components/PermissionGuard";
import HealthFacilitiesPage from "./healthFacilitiesPage";

export default function Page() {
  return (
    <PermissionGuard permissions={["view-health-facility", "create-health-facility", "update-health-facility", "delete-health-facility", "show-health-facility"]}>
      <HealthFacilitiesPage />
    </PermissionGuard>
  );
}
