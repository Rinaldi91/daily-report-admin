
import PermissionGuard from "@/components/PermissionGuard";
import TypeOfHealthFacilitiesPage from "./typeOfHealthFacilitiesPage";

export default function Page() {
  return (
    <PermissionGuard permissions={["view-type-of-health-facility", "create-type-of-health-facility", "update-type-of-health-facility", "delete-type-of-health-facility", "show-type-of-health-facility"]}>
      <TypeOfHealthFacilitiesPage />
    </PermissionGuard>
  );
}
