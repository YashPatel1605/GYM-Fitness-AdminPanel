import type { Metadata } from "next";
import ServiceManager from "@/components/services/ServiceManager";

export const metadata: Metadata = {
  title: "Services Management | Gym Fitness Admin",
  description: "Manage gym services for the gym fitness admin panel.",
};

export default function ServicesPage() {
  return (
    <div className="space-y-6">
      <ServiceManager />
    </div>
  );
}
