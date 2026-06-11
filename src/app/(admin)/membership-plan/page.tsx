import type { Metadata } from "next";
import MembershipPlanManager from "@/components/membershipPlans/MembershipPlanManager";

export const metadata: Metadata = {
  title: "Membership Plan Management | Gym Fitness Admin",
  description: "Manage membership plans for the gym fitness admin panel.",
};

export default function MembershipPlanPage() {
  return (
    <div className="space-y-6">
      <MembershipPlanManager />
    </div>
  );
}
