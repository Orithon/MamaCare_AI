"use client";
/**
 * components/auth/RegisterForm.tsx
 *
 * Main registration form for MamaCare AI.
 * Handles ALL state, validation, and submission for both patient
 * and provider registration flows.
 *
 * Architecture:
 *  - This component holds all form state and validation logic.
 *  - The visual fields are split into PatientFields / ProviderFields
 *    so this file stays under 500 lines.
 *  - RoleToggle switches which field set is shown.
 *  - On submit, calls registerUser() from lib/placeholder-data.ts
 *    (which will later be swapped for real Firebase auth).
 *
 * Requires "use client" because it uses useState, event handlers,
 * and eventually will use useRouter for post-login redirect.
 */

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PartyPopper, AlertTriangle } from "lucide-react";
import RoleToggle   from "@/components/auth/RoleToggle";
import PatientFields, { PatientFieldValues, PatientFieldErrors } from "@/components/auth/PatientFields";
import ProviderFields, { ProviderFieldValues, ProviderFieldErrors } from "@/components/auth/ProviderFields";
import { registerUser, UserRole, LanguageCode } from "@/lib/placeholder-data";

/* ── VALIDATION ─────────────────────────────────────────────────────────────── */

/** Email format check */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates the patient form fields and returns an error map.
 * Returns an empty object when all fields are valid.
 */
function validatePatient(v: PatientFieldValues): PatientFieldErrors {
  const e: PatientFieldErrors = {};
  if (!v.fullName.trim() || v.fullName.trim().length < 2)
    e.fullName = "Please enter your full name (at least 2 characters).";
  if (!EMAIL_REGEX.test(v.email))
    e.email = "Please enter a valid email address.";
  if (v.password.length < 8)
    e.password = "Password must be at least 8 characters.";
  if (v.confirmPassword !== v.password)
    e.confirmPassword = "Passwords do not match.";
  if (!v.preferredLanguage)
    e.preferredLanguage = "Please choose a preferred language.";
  return e;
}

/**
 * Validates the provider form fields and returns an error map.
 * Returns an empty object when all fields are valid.
 */
function validateProvider(v: ProviderFieldValues): ProviderFieldErrors {
  const e: ProviderFieldErrors = {};
  if (!v.fullName.trim() || v.fullName.trim().length < 2)
    e.fullName = "Please enter your full name (at least 2 characters).";
  if (!EMAIL_REGEX.test(v.email))
    e.email = "Please enter a valid work email address.";
  if (v.password.length < 8)
    e.password = "Password must be at least 8 characters.";
  if (v.confirmPassword !== v.password)
    e.confirmPassword = "Passwords do not match.";
  if (!v.licenceNumber.trim())
    e.licenceNumber = "Medical licence number is required.";
  if (!v.facilityName.trim())
    e.facilityName = "Facility name is required.";
  return e;
}

/* ── INITIAL STATE ──────────────────────────────────────────────────────────── */

const INITIAL_PATIENT: PatientFieldValues = {
  fullName: "", email: "", password: "", confirmPassword: "", preferredLanguage: "",
};

const INITIAL_PROVIDER: ProviderFieldValues = {
  fullName: "", email: "", password: "", confirmPassword: "",
  licenceNumber: "", facilityName: "",
};

/* ── COMPONENT ─────────────────────────────────────────────────────────────── */

export interface RegisterFormProps {
  /**
   * Pre-select a role when the form mounts.
   * Used by the register page to honour the ?role=provider URL param
   * (e.g. when the user clicks "For Healthcare Providers" on the landing page).
   */
  initialRole?: UserRole;
}

/** The full registration form — role toggle + dynamic fields + submit */
export default function RegisterForm({ initialRole = "patient" }: RegisterFormProps) {
  const router = useRouter();
  
  /* Which role the user has selected — starts from initialRole prop */
  const [role, setRole] = useState<UserRole>(initialRole);

  /* Separate state for each field group so switching roles doesn't clear the other */
  const [patientValues, setPatientValues] = useState<PatientFieldValues>(INITIAL_PATIENT);
  const [providerValues, setProviderValues] = useState<ProviderFieldValues>(INITIAL_PROVIDER);

  /* Validation errors — reset when the user starts correcting a field */
  const [patientErrors, setPatientErrors] = useState<PatientFieldErrors>({});
  const [providerErrors, setProviderErrors] = useState<ProviderFieldErrors>({});

  /* Form-level submission state */
  const [isSubmitting, setIsSubmitting] = useState(false);
  /** "idle" | "success" | "error" */
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  /** Error message returned from the API (e.g. duplicate email) */
  const [apiError, setApiError] = useState("");

  /* ── HANDLERS ─────────────────────────────────────────────────────────── */

  /** Update a single patient field and clear its error */
  function handlePatientChange(field: keyof PatientFieldValues, value: string) {
    setPatientValues((prev) => ({ ...prev, [field]: value }));
    setPatientErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  /** Update a single provider field and clear its error */
  function handleProviderChange(field: keyof ProviderFieldValues, value: string) {
    setProviderValues((prev) => ({ ...prev, [field]: value }));
    setProviderErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  /** Validate → submit → handle result */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError("");

    /* Run the appropriate validation */
    const errors = role === "patient"
      ? validatePatient(patientValues)
      : validateProvider(providerValues);

    /* If any errors, show them and stop */
    if (Object.keys(errors).length > 0) {
      if (role === "patient")  setPatientErrors(errors as PatientFieldErrors);
      else                     setProviderErrors(errors as ProviderFieldErrors);
      return;
    }

    /* All valid — call the placeholder (later: real Firebase) */
    setIsSubmitting(true);
    try {
      const result = await registerUser({
        role,
        fullName:          role === "patient" ? patientValues.fullName  : providerValues.fullName,
        email:             role === "patient" ? patientValues.email     : providerValues.email,
        password:          role === "patient" ? patientValues.password  : providerValues.password,
        preferredLanguage: (patientValues.preferredLanguage || "en") as LanguageCode,
        licenceNumber:     providerValues.licenceNumber,
        facilityName:      providerValues.facilityName,
      });

      if (result.success) {
        setSubmitStatus("success");
        if (result.token) {
          console.log("🔥 Registration Success! Firebase JWT (Send this to backend):");
        }
        setTimeout(() => {
          router.push(result.redirectTo!);
        }, 1500);
      } else {
        setApiError(result.error ?? "Something went wrong. Please try again.");
        setSubmitStatus("error");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  /* ── SUCCESS STATE ─────────────────────────────────────────────────────── */

  if (submitStatus === "success") {
    return (
      <div style={{ textAlign: "center", padding: "1rem 0" }}>
        {/* PartyPopper icon replaces 🎉 emoji */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem", color: "#C0392B" }}>
          <PartyPopper size={56} aria-hidden="true" />
        </div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.75rem" }}>
          Account Created!
        </h2>
        <p style={{ color: "#6B7280", lineHeight: 1.6, marginBottom: "1.5rem" }}>
          {role === "patient"
            ? "Welcome to MamaCare AI. Let's set up your health profile."
            : "Welcome, Doctor. You'll be able to start managing patients shortly."}
        </p>
        <p style={{ fontSize: "0.875rem", color: "#C0392B", fontWeight: 600 }}>
          Redirecting you to the next step…
        </p>
      </div>
    );
  }

  /* ── MAIN FORM RENDER ─────────────────────────────────────────────────── */

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {/* Role toggle — always shown at the top */}
      <RoleToggle value={role} onChange={setRole} disabled={isSubmitting} />

      {/* Divider */}
      <div style={{ borderTop: "1px solid #F0D9D9" }} />

      {/* Dynamic field set — swaps when role changes */}
      {role === "patient" ? (
        <PatientFields
          values={patientValues}
          errors={patientErrors}
          disabled={isSubmitting}
          onChange={handlePatientChange}
        />
      ) : (
        <ProviderFields
          values={providerValues}
          errors={providerErrors}
          disabled={isSubmitting}
          onChange={handleProviderChange}
        />
      )}

      {/* API-level error banner (e.g. duplicate email) */}
      {apiError && (
        <div role="alert" style={{
          backgroundColor: "#FEF2F2", border: "1px solid #FECACA",
          borderRadius: "10px", padding: "0.875rem 1rem",
          display: "flex", gap: "0.75rem", alignItems: "flex-start",
        }}>
          {/* AlertTriangle icon replaces ⚠️ emoji in API error banner */}
          <AlertTriangle size={18} style={{ flexShrink: 0 }} color="#DC2626" aria-hidden="true" />
          <p style={{ color: "#DC2626", fontSize: "0.9rem", lineHeight: 1.5 }}>{apiError}</p>
        </div>
      )}

      {/* Submit button */}
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
          transition: "background-color 0.2s ease, transform 0.1s ease",
          boxShadow: isSubmitting ? "none" : "0 4px 16px rgba(192,57,43,0.3)",
        }}
      >
        {/* Show a spinner while submitting */}
        {isSubmitting ? (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white"
              strokeWidth="2.5" strokeLinecap="round" style={{ animation: "spin 0.8s linear infinite" }}>
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
            Creating account…
          </>
        ) : (
          "Create Account →"
        )}
      </button>

      {/* Link to login */}
      <p style={{ textAlign: "center", fontSize: "0.9rem", color: "#6B7280" }}>
        Already have an account?{" "}
        <Link href="/login" style={{ color: "#C0392B", fontWeight: 600, textDecoration: "none" }}>
          Sign in →
        </Link>
      </p>

      {/* Keyframe for spinner — injected as a style tag */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </form>
  );
}
