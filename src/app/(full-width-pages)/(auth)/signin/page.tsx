import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Sign In | Gym Fitness",
  description: "Sign in to the Gym Fitness admin panel.",
};

export default function SignIn() {
  return <SignInForm />;
}
