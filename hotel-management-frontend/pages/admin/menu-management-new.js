import { useAuth } from "@/context/AuthContext";
import withRoleGuard from "@/hoc/withRoleGuard";
import DashboardLayout from "@/components/DashboardLayout";
import MenuManagement from "@/components/admin/MenuManagement";

function MenuManagementPage() {
    const { user } = useAuth();

    return (
        <DashboardLayout>
            <MenuManagement />
        </DashboardLayout>
    );
}

export default withRoleGuard(MenuManagementPage, "admin");
