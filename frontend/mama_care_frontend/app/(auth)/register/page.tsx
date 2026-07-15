/**
 * app/auth/register/page.tsx — Registration Page (/auth/register)
 *
 * This is a Server Component — it handles metadata, reads URL search params,
 * and passes the initial role selection down to the RegisterForm client component.
 *
 * Supported URL params:
 *   ?role=provider  — pre-selects the "Healthcare Provider" tab on load.
 *                     This is the URL used by the "For Healthcare Providers" CTA
 *                     on the landing page.
 *
 * Why read searchParams here (server) and pass as prop (not in the client form)?
 * → Server components can access searchParams without any browser API.
 *   Doing it here avoids adding useSearchParams() + a Suspense boundary in the form.
 */

import type { Metadata } from "next";
import AuthCard     from "@/components/auth/AuthCard";
import RegisterForm from "@/components/auth/RegisterForm";
import { UserRole } from "@/lib/placeholder-data";

/* SEO metadata for the register page */
export const metadata: Metadata = {
  title: "Create Account — MamaCare AI",
  description:
    "Register as a pregnant patient or healthcare provider on MamaCare AI. "
    + "Get AI-powered maternal health insights in your language.",
};

/**
 * Props injected by Next.js App Router.
 * `searchParams` holds the parsed query string — e.g. { role: "provider" }.
 */
interface RegisterPageProps {
  searchParams: Promise<{ role?: string }>;
}

/** Registration page — reads ?role= and seeds the form's initial tab */
export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  /* Await the searchParams promise (Next.js 15+ async searchParams) */
  const params = await searchParams;

  /*
   * Validate the role value — only accept "patient" or "provider".
   * Anything else (or missing) defaults to "patient".
   */
  const initialRole: UserRole =
    params.role === "provider" ? "provider" : "patient";

  return (
    <AuthCard
      title="Create your account"
      subtitle="Join thousands of women and providers already using MamaCare AI."
    >
      <RegisterForm initialRole={initialRole} />
    </AuthCard>
  );
}
