import type { Metadata } from "next";
import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";

export const metadata: Metadata = {
  title:
    "Next.js E-commerce Dashboard | Gym-fitness - Next.js Dashboard Template",
  description: "This is Next.js Home for Gym-fitness Dashboard Template",
};

export default function Ecommerce() {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
     
      <div className="col-span-12 space-y-6">
        <EcommerceMetrics />
      </div>
    </div>
  );
}