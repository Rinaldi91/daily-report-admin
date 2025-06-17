
import PermissionGuard from "@/components/PermissionGuard";
import TypeOfWorkPage from "./typeOfWorksPage";

export default function Page() {
  return (
    <PermissionGuard permissions={["view-type-of-work", "create-type-of-work", "update-type-of-work", "delete-type-of-work", "show-type-of-work"]}>
      <TypeOfWorkPage />
    </PermissionGuard>
  );
}
