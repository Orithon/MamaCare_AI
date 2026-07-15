/**
 * lib/provider-data.ts
 *
 * Mock data and types for the Provider Dashboard.
 * TODO: Replace with real backend API calls.
 */

export type RiskLevel = "Low" | "Moderate" | "High" | "Critical";

export interface AssignedPatient {
  id: string;
  fullName: string;
  gestationalWeek: number;
  lastAssessmentDate: string; // ISO string
  lastRiskLevel: RiskLevel;
  conditionsFlagged: string[];
  daysUntilDue: number;
}

export interface ProviderDashboardData {
  providerName: string;
  providerCode: string;
  facilityName: string;
  patients: AssignedPatient[];
}

// Import from dashboard-data for full history types
import { PredictionEntry, ReportEntry, PatientProfile } from "./dashboard-data";

export interface PatientDetails {
  id: string;
  profile: PatientProfile;
  predictions: PredictionEntry[];
  reports: ReportEntry[];
  notes?: any[]; // We can expand notes type later if needed
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Fetches the unified provider dashboard data.
 */
export async function getProviderDashboard(token: string): Promise<ProviderDashboardData> {
  const res = await fetch(`${API_BASE}/api/v1/provider/dashboard`, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!res.ok) {
    throw new Error("Failed to fetch provider dashboard");
  }

  return res.json();
}

/**
 * Fetches detailed data for a specific patient from the provider endpoint.
 */
export async function getPatientDetails(token: string, id: string): Promise<PatientDetails> {
  const res = await fetch(`${API_BASE}/api/v1/provider/patients/${id}`, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!res.ok) {
    throw new Error("Failed to fetch patient details");
  }

  const data = await res.json();

  // The backend returns:
  // {
  //   "patient": { full_name, email, gestational_age_weeks, etc },
  //   "predictions": [...],
  //   "reports": [...],
  //   "notes": [...]
  // }
  
  // We need to map it to PatientDetails
  return {
    id,
    profile: {
      fullName: data.patient.full_name || "Unknown",
      gestationalWeek: data.patient.gestational_age_weeks || 0,
      edd: data.patient.estimated_due_date || "",
      daysUntilDue: (() => {
        const edd = data.patient.estimated_due_date;
        if (!edd) return 0;
        const diffTime = new Date(edd).getTime() - new Date().getTime();
        return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      })(),
      conditions: data.patient.pre_existing_conditions || [],
      provider: "Assigned to You",
      preferredLanguage: data.patient.preferred_language || "en"
    },
    predictions: data.predictions.map((p: any) => ({
      id: p.id,
      date: p.created_at,
      riskLevel: p.risk_level,
      summary: (p.recommendations || []).join(" "), // Or a generic summary
      systolicBP: p.input_data?.bp_systolic || 0,
      diastolicBP: p.input_data?.bp_diastolic || 0,
      bloodGlucose: p.input_data?.blood_sugar || 0,
      haemoglobin: p.input_data?.haemoglobin || 0,
      heartRate: p.input_data?.heart_rate || 0,
      temperature: p.input_data?.temperature || 0,
      flaggedConditions: p.identified_risks || []
    })),
    reports: data.reports.map((r: any) => ({
      id: r.id,
      filename: r.file_name,
      date: r.created_at,
      summarySnippet: r.simplified_summary
    })),
    notes: data.notes
  };
}

export interface PaginatedAssessments {
  assessments: any[]; // we can type this better, but using any for speed
  total: number;
  page: number;
  limit: number;
}

/**
 * Fetches all assessments across all patients assigned to the provider, paginated.
 */
export async function getAllProviderAssessments(token: string, page: number = 1, limit: number = 10): Promise<PaginatedAssessments> {
  const res = await fetch(`${API_BASE}/api/v1/provider/all-assessments?page=${page}&limit=${limit}`, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!res.ok) {
    throw new Error("Failed to fetch paginated assessments");
  }

  return res.json();
}

/**
 * Fetches the full details of a specific report.
 */
export async function getProviderPatientReport(token: string, patientId: string, reportId: string) {
  const res = await fetch(`${API_BASE}/api/v1/provider/patients/${patientId}/reports/${reportId}`, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!res.ok) {
    throw new Error("Failed to fetch patient report details");
  }

  return res.json();
}
