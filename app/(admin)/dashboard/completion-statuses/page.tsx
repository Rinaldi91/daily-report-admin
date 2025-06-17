
import PermissionGuard from "@/components/PermissionGuard";
import CompletionstatusPage from "./completionStatusesPage";

export default function Page() {
  return (
    <PermissionGuard permissions={["view-completion-status", "create-completion-status", "update-completion-status", "delete-completion-status", "show-completion-status"]}>
      <CompletionstatusPage />
    </PermissionGuard>
  );
}
