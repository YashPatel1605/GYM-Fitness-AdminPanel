import type { Metadata } from "next";
import RatingManager from "@/components/ratings/RatingManager";

export const metadata: Metadata = {
  title: "Ratings Management | Gym Fitness Admin",
  description: "Manage user ratings and reviews for the gym fitness admin panel.",
};

export default function RatingsPage() {
  return (
    <div className="space-y-6">
      <RatingManager />
    </div>
  );
}
