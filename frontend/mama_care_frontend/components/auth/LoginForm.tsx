"use client";
/**
 * components/auth/LoginForm.tsx
 *
 * The sign-in form for returning MamaCare AI users.
 *
 * Features:
 *  - Email + Password fields with inline validation
 *  - Show/hide toggle on the password field
 *  - "Forgot Password?" inline reveal — shows a small email input and
 *    sends a password reset email (placeholder function for now)
 *  - Loading spinner during submission
 *  - Error banner for invalid credentials
 *  - Link to the registration page
 *
 * Requires "use client" because of useState, form events, and
 * eventually useRouter for redirect after successful login.
 */

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Mail, AlertTriangle } from "lucide-react";
import FormField     from "@/components/auth/FormField";
import PasswordField from "@/components/auth/PasswordField";
import { loginUser, sendPasswordReset } from "@/lib/placeholder-data";

/* ── TYPES ─────────────────────────────────────────────────────────────────── */

interface LoginErrors {
  email?: string;
  password?: string;
}

/* ── HELPERS ────────────────────────────────────────────────────────────────── */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ── COMPONENT ─────────────────────────────────────────────────────────────── */

/** Sign-in form with email, password, forgot-password flow, and error handling */
export default function LoginForm() {
  const router = useRouter();

  /* ── Form fields ── */
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [errors,   setErrors]   = useState<LoginErrors>({});

  /* ── Submission state ── */
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError,     setApiError]     = useState("");
  /** True once loginUser() returns success — swaps the form for a success card */
  const [loginSuccess, setLoginSuccess] = useState(false);

  /* ── Forgot password flow ── */
  const [showForgot,        setShowForgot]        = useState(false);
  const [resetEmail,        setResetEmail]        = useState("");
  const [resetError,        setResetError]        = useState("");
  const [isSendingReset,    setIsSendingReset]    = useState(false);
  const [resetSent,         setResetSent]         = useState(false);

  /* ── HANDLERS ──────────────────────────────────────────────────────────── */

  /** Validates fields and calls loginUser() placeholder */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError("");

    /* Client-side validation */
    const newErrors: LoginErrors = {};
    if (!EMAIL_REGEX.test(email))  newErrors.email    = "Please enter a valid email address.";
    if (password.length < 1)       newErrors.password = "Please enter your password.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await loginUser(email, password);
      if (result.success) {
        if (result.token) {
          console.log("🔥 Login Success! Firebase JWT (Send this to backend):");
        }
        setLoginSuccess(true);
        setTimeout(() => {
          router.push(result.redirectTo!);
        }, 1500);
      } else {
        setApiError(result.error ?? "Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  /** Sends a password reset email for the provided resetEmail address */
  async function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResetError("");

    if (!EMAIL_REGEX.test(resetEmail)) {
      setResetError("Please enter a valid email address.");
      return;
    }

    setIsSendingReset(true);
    try {
      await sendPasswordReset(resetEmail);
      setResetSent(true); // show the success message regardless (security best practice)
    } finally {
      setIsSendingReset(false);
    }
  }

  /* ── RENDER ────────────────────────────────────────────────────────────── */

  /* Show a clean success card after a successful login (pre-Firebase demo) */
  if (loginSuccess) {
    return (
      <div style={{ textAlign: "center", padding: "1rem 0" }}>
        {/* CheckCircle2 icon replaces ✅ emoji */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem", color: "#16A34A" }}>
          <CheckCircle2 size={56} aria-hidden="true" />
        </div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.75rem", color: "#1A1A1A" }}>
          Signed in successfully!
        </h2>
        <p style={{ color: "#6B7280", lineHeight: 1.6, marginBottom: "1rem" }}>
          You have successfully authenticated with MamaCare AI.
        </p>
        <p style={{ fontSize: "0.875rem", color: "#C0392B", fontWeight: 600 }}>
          Redirecting to dashboard…
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* ── Main login form ── */}
      <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

        {/* Email field */}
        <FormField
          id="login-email"
          label="Email Address"
          type="email"
          value={email}
          onChange={(v) => { setEmail(v); setErrors((p) => ({ ...p, email: undefined })); }}
          placeholder="you@example.com"
          error={errors.email}
          disabled={isSubmitting}
          required
        />

        {/* Password field + forgot password link */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
          <PasswordField
            id="login-password"
            label="Password"
            value={password}
            onChange={(v) => { setPassword(v); setErrors((p) => ({ ...p, password: undefined })); }}
            error={errors.password}
            autoComplete="current-password"
            disabled={isSubmitting}
            required
          />

          {/* Forgot password toggle link — right-aligned */}
          <div style={{ textAlign: "right", marginTop: "0.125rem" }}>
            <button
              type="button"
              onClick={() => { setShowForgot((v) => !v); setResetSent(false); setResetError(""); setResetEmail(""); }}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#C0392B", fontSize: "0.8125rem", fontWeight: 600,
                padding: 0,
              }}
            >
              {showForgot ? "← Back to sign in" : "Forgot password?"}
            </button>
          </div>
        </div>

        {/* API error banner — only shows on failure now */}
        {apiError && (
          <div
            role="alert"
            style={{
              padding: "0.875rem 1rem",
              borderRadius: "10px",
              border: "1px solid #FECACA",
              backgroundColor: "#FEF2F2",
              fontSize: "0.9rem", lineHeight: 1.5,
              color: "#DC2626",
              display: "flex", gap: "0.5rem", alignItems: "flex-start",
            }}
          >
          {/* AlertTriangle icon replaces ⚠️ emoji */}
          <AlertTriangle size={16} style={{ flexShrink: 0 }} aria-hidden="true" />
          <span>{apiError}</span>
          </div>
        )}

        {/* Sign In button */}
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: "100%", height: "52px",
            backgroundColor: isSubmitting ? "#E5A09A" : "#C0392B",
            color: "#ffffff",
            fontWeight: 700, fontSize: "1rem",
            border: "none", borderRadius: "9999px",
            cursor: isSubmitting ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: "0.5rem",
            transition: "background-color 0.2s ease",
            boxShadow: isSubmitting ? "none" : "0 4px 16px rgba(192,57,43,0.3)",
          }}
        >
          {isSubmitting ? (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="white" strokeWidth="2.5" strokeLinecap="round"
                style={{ animation: "spin 0.8s linear infinite" }}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
              Signing in…
            </>
          ) : "Sign In →"}
        </button>

      </form>

      {/* ── Forgot password inline panel ── */}
      {showForgot && (
        <div style={{
          backgroundColor: "#FFF5F5",
          border: "1.5px solid #F0D9D9",
          borderRadius: "14px",
          padding: "1.25rem",
        }}>
          {resetSent ? (
            /* Success state after sending reset email */
            <div style={{ textAlign: "center" }}>
              {/* Mail icon replaces 📧 emoji */}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.5rem", color: "#C0392B" }}>
                <Mail size={36} aria-hidden="true" />
              </div>
              <p style={{ fontWeight: 700, color: "#1A1A1A", marginBottom: "0.25rem" }}>
                Check your inbox
              </p>
              <p style={{ color: "#6B7280", fontSize: "0.9rem" }}>
                If an account with that email exists, we&apos;ve sent a reset link.
                Check your spam folder if you don&apos;t see it.
              </p>
            </div>
          ) : (
            /* Email input form for password reset */
            <form onSubmit={handleForgotSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <p style={{ fontWeight: 700, color: "#1A1A1A", fontSize: "0.9375rem" }}>
                Reset your password
              </p>
              <p style={{ color: "#6B7280", fontSize: "0.875rem", lineHeight: 1.5, marginTop: "-0.5rem" }}>
                Enter the email address you used to register and we&apos;ll send you a reset link.
              </p>

              <FormField
                id="reset-email"
                label="Email Address"
                type="email"
                value={resetEmail}
                onChange={(v) => { setResetEmail(v); setResetError(""); }}
                placeholder="you@example.com"
                error={resetError}
                disabled={isSendingReset}
                required
              />

              <button
                type="submit"
                disabled={isSendingReset}
                style={{
                  height: "44px",
                  backgroundColor: isSendingReset ? "#E5A09A" : "#C0392B",
                  color: "white", fontWeight: 600, fontSize: "0.9375rem",
                  border: "none", borderRadius: "9999px",
                  cursor: isSendingReset ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                }}
              >
                {isSendingReset ? "Sending…" : "Send Reset Link"}
              </button>
            </form>
          )}
        </div>
      )}

      {/* ── Divider + register link ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div style={{ flex: 1, height: "1px", backgroundColor: "#F0D9D9" }} />
        <span style={{ color: "#9CA3AF", fontSize: "0.8125rem", whiteSpace: "nowrap" }}>
          New to MamaCare AI?
        </span>
        <div style={{ flex: 1, height: "1px", backgroundColor: "#F0D9D9" }} />
      </div>

      <Link href="/register" style={{
        display: "block", width: "100%", height: "48px",
        border: "1.5px solid #C0392B", borderRadius: "9999px",
        color: "#C0392B", fontWeight: 600, fontSize: "0.9375rem",
        textDecoration: "none", textAlign: "center",
        lineHeight: "48px", // vertically centre the text
        transition: "background-color 0.2s ease",
      }}>
        Create a free account →
      </Link>

      {/* Spinner keyframe */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
