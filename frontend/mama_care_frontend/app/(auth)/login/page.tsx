/**
 * app/auth/login/page.tsx — Login Page (/auth/login)
 *
 * Server Component that handles metadata and wraps the LoginForm
 * Client Component inside the shared AuthCard layout.
 */

import type { Metadata } from "next";
import AuthCard   from "@/components/auth/AuthCard";
import LoginForm  from "@/components/auth/LoginForm";

/* SEO metadata for the login page */
export const metadata: Metadata = {
  title: "Sign In — MamaCare AI",
  description:
    "Sign in to your MamaCare AI account to view your risk assessments, "
    + "upload reports, and talk to the AI health assistant.",
};

/** Login page — centred card with the sign-in form */
export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to continue your pregnancy health journey."
    >
      <LoginForm />
    </AuthCard>
  );
}
