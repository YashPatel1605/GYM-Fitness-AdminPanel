import type { Metadata } from "next";
import FaqManager from "@/components/faq/FaqManager";

export const metadata: Metadata = {
  title: "FAQ Management | Gym Fitness Admin",
  description: "Manage frequently asked questions for the gym fitness admin panel.",
};

export default function FaqPage() {
  return (
    <div className="space-y-6">
      <FaqManager />
    </div>
  );
}
