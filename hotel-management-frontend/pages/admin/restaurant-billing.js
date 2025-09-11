import { useAuth } from "@/context/AuthContext";
import withRoleGuard from "@/hoc/withRoleGuard";
import RestaurantBillingForm from "@/components/RestaurantBillingForm";

function AdminRestaurantBilling() {
  const { user } = useAuth();
  return <RestaurantBillingForm user={user} token={user.access} />;
}

export default withRoleGuard(AdminRestaurantBilling, "admin");
