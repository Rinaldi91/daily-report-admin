import PermissionGuard from "@/components/PermissionGuard";
import LisPage from "./lisPage";

export default function Page() {
  return (
    <PermissionGuard permissions={["view-medical-device", "create-medical-device", "update-medical-device", "delete-medical-device", "show-medical-device"]}>
      <LisPage />
    </PermissionGuard>
  );
}