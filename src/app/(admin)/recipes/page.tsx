import type { Metadata } from "next";
import RecipeManager from "@/components/recipes/RecipeManager";

export const metadata: Metadata = {
  title: "Recipes Management | Gym Fitness Admin",
  description: "Manage nutrition recipes for the gym fitness admin panel.",
};

export default function RecipesPage() {
  return (
    <div className="space-y-6">
      <RecipeManager />
    </div>
  );
}
