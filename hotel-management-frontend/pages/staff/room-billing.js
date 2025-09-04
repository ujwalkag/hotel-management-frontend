import withRoleGuard from "@/hoc/withRoleGuard";
import RoomBillingForm from "@/components/RoomBillingForm";
export default withRoleGuard(() => <RoomBillingForm role="staff" />, "staff");

