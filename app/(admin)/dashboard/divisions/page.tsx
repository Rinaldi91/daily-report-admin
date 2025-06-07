
import PermissionGuard from "@/components/PermissionGuard";
import DivisionsPage from "./divisionsPage";

export default function Page() {
  return (
    <PermissionGuard permissions={["view-division", "create-division", "update-division", "delete-division", "show-division"]}>
      <DivisionsPage />
    </PermissionGuard>
  );
}
