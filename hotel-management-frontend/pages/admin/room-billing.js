import { useAuth } from "@/context/AuthContext";
import withRoleGuard from "@/hoc/withRoleGuard";
import RoomBillingForm from "@/components/RoomBillingForm";

function AdminRoomBilling() {
  const { user } = useAuth();
  return <RoomBillingForm user={user} token={user.access} />;
}

export default withRoleGuard(AdminRoomBilling, "admin");
