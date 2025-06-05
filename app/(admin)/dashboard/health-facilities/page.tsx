
import PermissionGuard from "@/components/PermissionGuard";
import HealthFacilitiesPage from "./healthFacilities";

export default function Page() {
  return (
    <PermissionGuard permissions={["view-permissions", "create-permissions", "update-permissions", "delete-permissions", "show-permissions"]}>
      <HealthFacilitiesPage />
    </PermissionGuard>
  );
}
