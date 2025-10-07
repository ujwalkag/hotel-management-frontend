// File: pages/admin/manage-menu.js - UPDATE TO REDIRECT
import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import withRoleGuard from "@/hoc/withRoleGuard";

function ManageMenuRedirect() {
    const router = useRouter();
    
    useEffect(() => {
        // Redirect to new menu management page
        router.replace('/admin/menu-management-new');
    }, []);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Redirecting to new menu management...</p>
            </div>
        </div>
    );
}

export default withRoleGuard(ManageMenuRedirect, "admin");
