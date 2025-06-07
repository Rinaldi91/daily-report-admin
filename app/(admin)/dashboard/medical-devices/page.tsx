
import PermissionGuard from "@/components/PermissionGuard";
import MedicalDevicesPage from "./medicalDevicesPage";

export default function Page() {
  return (
    <PermissionGuard permissions={["view-medical-device", "create-medical-device", "update-medical-device", "delete-medical-device", "show-medical-device"]}>
      <MedicalDevicesPage />
    </PermissionGuard>
  );
}
