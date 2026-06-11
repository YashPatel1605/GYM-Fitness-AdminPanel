import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Programs Management | Gym Fitness Admin",
  description: "Redirects to the Programs management page.",
};

export default function CalendarPage() {
  redirect("/programs");
}
