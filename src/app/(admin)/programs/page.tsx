import type { Metadata } from "next";
import ProgramManager from "@/components/programs/ProgramManager";

export const metadata: Metadata = {
  title: "Programs Management | Gym Fitness Admin",
  description: "Manage workout programs for the gym fitness admin panel.",
};

export default function ProgramsPage() {
  return (
    <div className="space-y-6">
      <ProgramManager />
    </div>
  );
}
