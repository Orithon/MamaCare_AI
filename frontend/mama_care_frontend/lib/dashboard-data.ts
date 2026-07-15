/**
 * lib/dashboard-data.ts
 *
 * Types and API fetchers for the Patient Dashboard.
 */

/* ── TYPES ─────────────────────────────────────────────────────────────── */

export type RiskLevel = "Low" | "Moderate" | "High" | "Critical";

export const RISK_COLOURS: Record<RiskLevel, { bg: string; text: string; border: string }> = {
  Low:      { bg: "#F0FDF4", text: "#166534", border: "#86EFAC" },
  Moderate: { bg: "#FEFCE8", text: "#854D0E", border: "#FDE047" },
  High:     { bg: "#FFF7ED", text: "#9A3412", border: "#FDBA74" },
  Critical: { bg: "#FEF2F2", text: "#991B1B", border: "#FCA5A5" },
};

export interface PatientProfile {
  fullName: string;
  gestationalWeek: number;
  edd: string;
  daysUntilDue: number;
  conditions: string[];
  provider?: string;
  providerCode?: string;
  preferredLanguage?: string;
}

export interface PredictionEntry {
  id: string;
  date: string;
  riskLevel: RiskLevel;
  summary: string;
  systolicBP: number;
  diastolicBP: number;
  bloodGlucose: number;
  haemoglobin: number;
  heartRate: number;
  temperature: number;
  flaggedConditions: string[];
}

export interface ReportEntry {
  id: string;
  filename: string;
  date: string;
  summarySnippet: string;
}

export interface DashboardData {
  profile: PatientProfile;
  latestPrediction: PredictionEntry | null;
  recentPredictions: PredictionEntry[];
  recentReports: ReportEntry[];
}

export interface AssessmentResult {
  riskLevel: RiskLevel;
  conditionsFlagged: string[];
  explanation: string;
  recommendations: string[];
}

export interface ReportInterpretation {
  summary: string;
  abnormalValues: { finding: string; meaning: string }[];
  recommendations: string[];
}

/* ── API FUNCTIONS ────────────────────────────────────────────────── */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function getDashboardData(token: string): Promise<DashboardData | null> {
  const res = await fetch(`${API_BASE}/api/v1/dashboard/patient`, {
    headers: { "Authorization": `Bearer ${token}` }
  });

  if (!res.ok) {
    if (res.status === 404 || res.status === 401) return null;
    throw new Error("Failed to fetch dashboard data");
  }

  return await res.json();
}

/**
 * Submits health data and returns AI risk assessment.
 */
export async function submitAssessment(token: string, data: any): Promise<AssessmentResult> {
  const res = await fetch(`${API_BASE}/api/v1/predictions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    throw new Error("Failed to submit assessment");
  }

  const result = await res.json();
  
  return {
    riskLevel: result.risk_level.charAt(0) + result.risk_level.slice(1).toLowerCase() as RiskLevel,
    conditionsFlagged: result.conditions_flagged || [],
    explanation: result.explanation || "",
    recommendations: result.recommendations || []
  };
}

/**
 * Fetches the paginated history of predictions for the patient.
 */
export async function getAssessmentHistory(token: string, page = 1): Promise<PredictionEntry[]> {
  const res = await fetch(`${API_BASE}/api/v1/predictions?page=${page}`, {
    headers: { "Authorization": `Bearer ${token}` }
  });

  if (!res.ok) {
    if (res.status === 404 || res.status === 401) return [];
    throw new Error("Failed to fetch history");
  }

  const data = await res.json();
  
  // Map MongoDB data to frontend PredictionEntry format
  return data.predictions.map((pred: any) => {
    const input = pred.input_data || {};
    const extractedId = pred.id || pred._id || pred.id_ || "";
    
    if (!extractedId) {
      console.warn("Missing ID in prediction entry:", pred);
    }
    
    return {
      id: extractedId,
      date: pred.created_at,
      riskLevel: pred.risk_level.charAt(0) + pred.risk_level.slice(1).toLowerCase() as RiskLevel,
      summary: pred.explanation ? pred.explanation.split(".")[0] + "." : "",
      systolicBP: input.bp_systolic || input.systolic_bp || 0,
      diastolicBP: input.bp_diastolic || input.diastolic_bp || 0,
      bloodGlucose: input.blood_sugar || input.blood_glucose || 0,
      haemoglobin: input.haemoglobin || 0,
      heartRate: input.heart_rate || 0,
      temperature: input.temperature || 0,
      flaggedConditions: pred.conditions_flagged || []
    };
  });
}

/**
 * Fetches the full details of a single assessment.
 */
export async function getAssessmentDetail(token: string, id: string): Promise<AssessmentResult> {
  const res = await fetch(`${API_BASE}/api/v1/predictions/${id}`, {
    headers: { "Authorization": `Bearer ${token}` }
  });

  if (!res.ok) {
    throw new Error("Failed to fetch assessment detail");
  }

  const result = await res.json();
  
  return {
    riskLevel: result.risk_level.charAt(0) + result.risk_level.slice(1).toLowerCase() as RiskLevel,
    conditionsFlagged: result.conditions_flagged || [],
    explanation: result.explanation || "",
    recommendations: result.recommendations || []
  };
}

/**
 * Uploads a medical report and returns AI interpretation.
 */
export async function uploadReport(token: string, file: File, language: string): Promise<ReportInterpretation> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("language", language);

  const res = await fetch(`${API_BASE}/api/v1/reports/upload`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`
    },
    body: formData
  });

  if (!res.ok) {
    throw new Error("Failed to upload report");
  }

  const result = await res.json();

  return {
    summary: result.simplified_summary || "",
    abnormalValues: [], // Note: backend doesn't currently explicitly extract abnormalValues array, it might be in summary
    recommendations: result.recommendations || []
  };
}

/**
 * Fetches the history of reports for the patient.
 */
export async function getReportHistory(token: string): Promise<ReportEntry[]> {
  const res = await fetch(`${API_BASE}/api/v1/reports`, {
    headers: { "Authorization": `Bearer ${token}` }
  });

  if (!res.ok) {
    if (res.status === 404 || res.status === 401) return [];
    throw new Error("Failed to fetch reports");
  }

  const data = await res.json();
  
  return data.reports.map((report: any) => {
    const extractedId = report.id || report._id || report.id_ || "";
    
    if (!extractedId) {
      console.warn("Missing ID in report entry:", report);
    }
    
    return {
      id: extractedId,
      filename: report.file_name,
      date: report.created_at,
      summarySnippet: report.simplified_summary ? report.simplified_summary.split(".")[0] + "." : ""
    };
  });
}

/**
 * Fetches the full details of a single report.
 */
export async function getReportDetail(token: string, reportId: string): Promise<ReportInterpretation & { filename: string, date: string }> {
  const res = await fetch(`${API_BASE}/api/v1/reports/${reportId}`, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!res.ok) {
    throw new Error("Failed to fetch report detail");
  }

  const data = await res.json();
  
  return {
    filename: data.file_name,
    date: data.created_at,
    summary: data.simplified_summary || "",
    abnormalValues: [], 
    recommendations: data.recommendations || []
  };
}

/**
 * Sends a chat message to the Multilingual Voice Assistant backend.
 */
export async function sendChatMessage(token: string, message: string, language: string, sessionId: string) {
  const res = await fetch(`${API_BASE}/api/v1/assistant/chat`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message,
      language,
      session_id: sessionId
    })
  });

  if (!res.ok) {
    throw new Error("Failed to send chat message");
  }

  return res.json();
}
