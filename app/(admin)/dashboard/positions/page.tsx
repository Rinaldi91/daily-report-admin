
import PermissionGuard from "@/components/PermissionGuard";
import PositionsPage from "./positionsPage";

export default function Page() {
  return (
    <PermissionGuard permissions={["view-position", "create-position", "update-position", "delete-position", "show-position"]}>
      <PositionsPage />
    </PermissionGuard>
  );
}
