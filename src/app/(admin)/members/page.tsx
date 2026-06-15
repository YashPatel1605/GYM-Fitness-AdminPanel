import MembersManager from "@/components/members/MembersManager";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Members Management | Gym Fitness Admin",
  description: "View user details for the gym fitness admin panel.",
};

export default function MembersPage() {
  return (
    <div>
      <MembersManager />
    </div>
  );
}
