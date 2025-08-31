import PermissionGuard from "@/components/PermissionGuard";
import InformationPage from "./informationPage";

export default function Page() {
  return (
    <PermissionGuard permissions={["view-information", "create-information", "update-information", "delete-information", "show-information"]}>
      <InformationPage />
    </PermissionGuard>
  );
}