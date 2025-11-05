import { useAdminAuth } from "@/hooks/use-admin-auth";
import DashboardContent from "@/components/admin/DashboardContent";

export default function AdminPage() {
    const { loading, isAdmin } = useAdminAuth();

    if (loading || !isAdmin) return null;

    return <DashboardContent />;
}
