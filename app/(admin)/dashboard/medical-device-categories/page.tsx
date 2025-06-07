import PermissionGuard from "@/components/PermissionGuard";
import MedicalDeviceCategoriesPage from "./medicalDeviceCategoriesPage";


export default function Page() {
  return (
    <PermissionGuard permissions={["view-medical-device-category", "create-medical-device-category", "update-medical-device-category", "delete-medical-device-category", "show-medical-device-category"]}>
      <MedicalDeviceCategoriesPage />
    </PermissionGuard>
  );
}
