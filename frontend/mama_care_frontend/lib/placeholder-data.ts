/**
 * lib/placeholder-data.ts
 *
 * Central home for ALL mock/stub data and placeholder API functions.
 * Now wired up to the real backend API.
 */

import { auth } from "./firebase";
import { FirebaseError } from "firebase/app";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  deleteUser
} from "firebase/auth";

/* ── TYPES ─────────────────────────────────────────────────────────────────── */

export interface PlatformStats {
  maternalDeathStat: string;
  maternalDeathLabel: string;
  languagesCount: string;
  languagesLabel: string;
  analysisType: string;
  analysisLabel: string;
}

export interface MockPatient {
  name: string;
  gestationalWeek: string;
  riskLevel: "Low" | "Moderate" | "High" | "Critical";
  lastAssessment: string;
}

export async function getPlatformStats(): Promise<PlatformStats> {
  return {
    maternalDeathStat: "~30%",
    maternalDeathLabel: "of global maternal deaths occur in Nigeria",
    languagesCount: "4",
    languagesLabel: "Nigerian languages supported (EN, YO, IG, HA)",
    analysisType: "Real-time",
    analysisLabel: "AI-powered risk analysis in under 10 seconds",
  };
}

export function getMockPatients(): MockPatient[] {
  return [
    { name: "Amina Bello",      gestationalWeek: "32 wks", riskLevel: "Critical", lastAssessment: "2h ago" },
    { name: "Grace Okonkwo",    gestationalWeek: "28 wks", riskLevel: "Moderate", lastAssessment: "1d ago" },
    { name: "Blessing Adeyemi", gestationalWeek: "36 wks", riskLevel: "Low",      lastAssessment: "3d ago" },
  ];
}

export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe",
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos",
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto",
  "Taraba", "Yobe", "Zamfara"
];

export interface OnboardingData {
  dob: string;
  state: string;
  lga: string;
  phone: string;
  gestationalWeek: number;
  edd: string;
  prevPregnancies: number;
  prevLiveBirths: number;
  conditions: string[];
  allergies: string;
  medications: string; // Not in backend model, will ignore
  providerCode: string;
}

export async function submitOnboarding(data: OnboardingData): Promise<{ success: boolean; error?: string; providerCodeInvalid?: boolean }> {
  try {
    const user = auth.currentUser;
    if (!user) return { success: false, error: "Not authenticated" };
    
    const token = await user.getIdToken();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    
    const response = await fetch(`${apiUrl}/api/v1/auth/onboarding`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        dob: data.dob,
        state_of_residence: data.state,
        lga: data.lga,
        estimated_due_date: data.edd,
        gestational_age_weeks: data.gestationalWeek,
        previous_pregnancies: data.prevPregnancies,
        previous_live_births: data.prevLiveBirths,
        pre_existing_conditions: data.conditions,
        allergies: data.allergies || undefined,
        provider_code: data.providerCode || undefined
      })
    });
    
    const resData = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      return { success: false, error: resData.detail || "Failed to submit onboarding profile" };
    }
    
    return { 
      success: true, 
      providerCodeInvalid: resData.provider_code_invalid 
    };
  } catch (error) {
    console.error("Onboarding error:", error);
    return { success: false, error: "Network error occurred during onboarding." };
  }
}

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "yo", label: "Yoruba" },
  { code: "ig", label: "Igbo" },
  { code: "ha", label: "Hausa" },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

export type UserRole = "patient" | "provider";

export interface RegisterPayload {
  role: UserRole;
  fullName: string;
  email: string;
  password: string;
  preferredLanguage: LanguageCode;
  licenceNumber: string;
  facilityName: string;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  redirectTo?: string;
  token?: string;
}

export async function registerUser(payload: RegisterPayload): Promise<AuthResult> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, payload.email, payload.password);
    const user = userCredential.user;
    const token = await user.getIdToken();
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    
    const response = await fetch(`${apiUrl}/api/v1/auth/register`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: payload.email,
        full_name: payload.fullName,
        role: payload.role,
        preferred_language: payload.role === "patient" ? payload.preferredLanguage : undefined,
        clinic_name: payload.role === "provider" ? payload.facilityName : undefined,
        license_number: payload.role === "provider" ? payload.licenceNumber : undefined
      })
    });

    if (!response.ok) {
      // Rollback Firebase user creation if backend fails
      await deleteUser(user);
      const errData = await response.json().catch(() => ({}));
      return { success: false, error: errData.detail || "Failed to create profile on server. Please try again." };
    }
    
    const redirectTo = payload.role === "patient" ? "/onboarding" : "/provider";
    return { success: true, redirectTo, token };
    
  } catch (error: any) {
    let errorMessage = "An error occurred during registration. Please try again.";
    
    if (error instanceof FirebaseError) {
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "An account with this email already exists. Try signing in instead.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Password should be at least 6 characters.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Please enter a valid email address.";
      }
    }
    
    return { success: false, error: errorMessage };
  }
}

export async function loginUser(email: string, password: string): Promise<AuthResult> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const response = await fetch(`${apiUrl}/api/v1/auth/me`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      return { success: false, error: "Could not fetch user profile from server." };
    }

    const data = await response.json();
    let redirectTo = "/dashboard";

    if (data.role === "provider") {
      redirectTo = "/provider";
    } else if (data.role === "patient") {
      if (!data.profile?.onboarded) {
        redirectTo = "/onboarding";
      } else {
        redirectTo = "/dashboard";
      }
    }
    
    return { success: true, redirectTo, token };
    
  } catch (error: any) {
    let errorMessage = "Incorrect email or password. Please try again.";
    
    if (error instanceof FirebaseError) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = "Incorrect email or password. Please try again.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Access to this account has been temporarily disabled due to many failed login attempts.";
      }
    }
    
    return { success: false, error: errorMessage };
  }
}

export async function sendPasswordReset(email: string): Promise<AuthResult> {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error: unknown) {
    return { success: true };
  }
}
