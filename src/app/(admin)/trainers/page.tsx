import type { Metadata } from "next";
import TrainerManager from "@/components/trainers/TrainerManager";

export const metadata: Metadata = {
  title: "Trainers Management | Gym Fitness Admin",
  description: "Manage gym trainers for the gym fitness admin panel.",
};

export default function TrainersPage() {
  return (
    <div className="space-y-6">
      <TrainerManager />
    </div>
  );
}
