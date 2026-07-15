"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { 
  HeartPulse, 
  Activity, 
  Thermometer, 
  Droplet, 
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft
} from "lucide-react";
import { submitAssessment, AssessmentResult, RISK_COLOURS, getDashboardData } from "@/lib/dashboard-data";

const SYMPTOMS_LIST = [
  "Severe headache",
  "Blurred or double vision",
  "Swelling of hands, face, or feet",
  "Reduced or no fetal movement",
  "Vaginal bleeding",
  "Severe abdominal pain",
  "Difficulty breathing",
  "Fever or chills",
  "Nausea and vomiting",
  "Dizziness or fainting"
];

export default function NewAssessmentPage() {
  const router = useRouter();
  const [view, setView] = useState<"form" | "loading" | "result">("form");
  const [result, setResult] = useState<AssessmentResult | null>(null);

  // Form Data - Notice we removed age, pregnancies, and conditions!
  const [week, setWeek] = useState<string>("");
  const [bp, setBp] = useState<string>("");
  const [glucose, setGlucose] = useState<string>("");
  const [temp, setTemp] = useState<string>("");
  const [heartRate, setHeartRate] = useState<string>("");
  const [haemoglobin, setHaemoglobin] = useState<string>("");
  
  const [selectedSymptoms, setSelectedSymptoms] = useState<Set<string>>(new Set());
  const [otherInfo, setOtherInfo] = useState<string>("");
  const [language, setLanguage] = useState<string>("en");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          const data = await getDashboardData(token);
          if (data?.profile?.preferredLanguage) {
            setLanguage(data.profile.preferredLanguage);
          }
        } catch (e) {
          console.error("Error fetching language preference", e);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const toggleSymptom = (symptom: string) => {
    const newSet = new Set(selectedSymptoms);
    if (newSet.has(symptom)) {
      newSet.delete(symptom);
    } else {
      newSet.add(symptom);
    }
    setSelectedSymptoms(newSet);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setView("loading");

    const user = auth.currentUser;
    if (!user) {
      router.push("/login");
      return;
    }
    
    const token = await user.getIdToken();

    try {
      const res = await submitAssessment(token, {
        gestational_age_weeks: week ? parseInt(week) : null,
        bp: bp || null,
        blood_sugar: glucose ? parseFloat(glucose) : null,
        temperature: temp ? parseFloat(temp) : null,
        heart_rate: heartRate ? parseInt(heartRate) : null,
        haemoglobin: haemoglobin ? parseFloat(haemoglobin) : null,
        symptoms: Array.from(selectedSymptoms),
        other_info: otherInfo,
        language: language
      });
      
      setResult(res);
      setView("result");
    } catch (err) {
      console.error(err);
      alert("Something went wrong analyzing your data. Please try again.");
      setView("form");
    }
  };

  const resetForm = () => {
    setResult(null);
    setView("form");
  };

  /* ── 1. LOADING VIEW ─────────────────────────────────────────────────────── */
  if (view === "loading") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh", gap: "1.5rem" }}>
        <div className="pulse-ring" style={{ position: "relative", width: "80px", height: "80px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <HeartPulse size={40} color="#C0392B" />
          <div style={{
            position: "absolute", inset: 0, borderRadius: "50%", border: "4px solid #FDECEA",
            borderTopColor: "#C0392B", animation: "spin 1s linear infinite"
          }} />
        </div>
        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1A1A1A", margin: "0 0 0.5rem 0" }}>Analysing your readings...</h2>
          <p style={{ fontSize: "0.9375rem", color: "#6B7280", margin: 0 }}>MamaCare AI is reviewing your symptoms and vitals.</p>
        </div>
        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  /* ── 2. RESULT VIEW ──────────────────────────────────────────────────────── */
  if (view === "result" && result) {
    const colours = RISK_COLOURS[result.riskLevel];
    const isCritical = result.riskLevel === "Critical";

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "800px", margin: "0 auto" }}>
        
        {/* Critical Alert Overlay */}
        {isCritical && (
          <div style={{
            backgroundColor: "#DC2626", color: "white", padding: "1.5rem", borderRadius: "1rem",
            display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-start", boxShadow: "0 10px 25px -5px rgba(220, 38, 38, 0.4)"
          }}>
            <AlertTriangle size={32} style={{ flexShrink: 0 }} />
            <div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 0.5rem 0" }}>URGENT: Please Seek Medical Help</h2>
              <p style={{ margin: 0, fontSize: "1rem", lineHeight: 1.5, opacity: 0.9 }}>
                Your symptoms are highly concerning. Please call emergency services or go to the nearest hospital right away.
              </p>
            </div>
          </div>
        )}

        {/* Hero Banner */}
        <div style={{
          backgroundColor: colours.bg, border: `1px solid ${colours.border}`,
          borderRadius: "1rem", padding: "1.5rem", textAlign: "center"
        }}>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, color: colours.text, margin: "0 0 1rem 0", textTransform: "uppercase" }}>
            {result.riskLevel} Risk
          </h2>
          <p style={{ fontSize: "1.125rem", color: colours.text, margin: 0, lineHeight: 1.6, maxWidth: "600px", marginInline: "auto" }}>
            {result.explanation}
          </p>
        </div>

        {/* Flagged Conditions */}
        {result.conditionsFlagged.length > 0 && (
          <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #F0D9D9", borderRadius: "1rem", padding: "1.5rem" }}>
            <h3 style={{ fontSize: "1.125rem", fontWeight: 700, margin: "0 0 1rem 0", color: "#1A1A1A", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <AlertTriangle size={20} color="#EA580C" /> Conditions to monitor
            </h3>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {result.conditionsFlagged.map((cond, i) => (
                <li key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9375rem", color: "#1A1A1A", fontWeight: 500 }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#EA580C" }} />
                  {cond}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #F0D9D9", borderRadius: "1rem", padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1.125rem", fontWeight: 700, margin: "0 0 1rem 0", color: "#1A1A1A", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <CheckCircle2 size={20} color="#16A34A" /> What to do next
          </h3>
          <ul style={{ margin: 0, paddingLeft: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem", color: "#1A1A1A" }}>
            {result.recommendations.map((rec, i) => (
              <li key={i} style={{ fontSize: "0.9375rem", lineHeight: 1.5 }}>{rec}</li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", flexWrap: "wrap" }}>
          <Link href="/dashboard/assessment" style={{
            flex: 1, textAlign: "center", backgroundColor: "#C0392B", color: "white",
            padding: "1rem", borderRadius: "0.75rem", fontWeight: 700, textDecoration: "none"
          }}>
            View History
          </Link>
          <button onClick={resetForm} style={{
            flex: 1, backgroundColor: "#FFFFFF", color: "#6B7280", border: "1px solid #F0D9D9",
            padding: "1rem", borderRadius: "0.75rem", fontWeight: 600, cursor: "pointer"
          }}>
            Do Another Assessment
          </button>
        </div>

      </div>
    );
  }

  /* ── 3. FORM VIEW ────────────────────────────────────────────────────────── */
  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <Link href="/dashboard/assessment" style={{
          display: "flex", alignItems: "center", justifyContent: "center", width: "40px", height: "40px",
          backgroundColor: "#FFFFFF", border: "1px solid #F0D9D9", borderRadius: "0.5rem", color: "#1A1A1A"
        }}>
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1A1A1A", margin: 0 }}>New Health Check</h1>
          <p style={{ fontSize: "0.9375rem", color: "#6B7280", margin: "0.25rem 0 0 0" }}>Your age and medical history will be added securely.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
        
        {/* Vitals Section */}
        <section>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#1A1A1A", margin: "0 0 1rem 0" }}>Vital Signs (Optional)</h2>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem",
            backgroundColor: "#FFFFFF", padding: "1.5rem", borderRadius: "1rem", border: "1px solid #F0D9D9"
          }}>
            <InputField label="Gestational Week" icon={Calendar} value={week} onChange={setWeek} placeholder="e.g. 32" />
            <InputField label="Blood Pressure (mmHg)" icon={HeartPulse} value={bp} onChange={setBp} placeholder="e.g. 120/80" />
            <InputField label="Blood Glucose (mg/dL)" icon={Droplet} value={glucose} onChange={setGlucose} placeholder="e.g. 90" />
            <InputField label="Temperature (°C)" icon={Thermometer} value={temp} onChange={setTemp} placeholder="e.g. 36.5" />
            <InputField label="Heart Rate (bpm)" icon={Activity} value={heartRate} onChange={setHeartRate} placeholder="e.g. 75" />
            <InputField label="Haemoglobin (g/dL)" icon={Droplet} value={haemoglobin} onChange={setHaemoglobin} placeholder="e.g. 12.0" />
          </div>
        </section>

        {/* Symptoms Section */}
        <section>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#1A1A1A", margin: "0 0 0.25rem 0" }}>Current Symptoms</h2>
          <p style={{ fontSize: "0.875rem", color: "#6B7280", margin: "0 0 1rem 0" }}>Select any that you are experiencing right now.</p>
          
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
            {SYMPTOMS_LIST.map((symptom) => {
              const isSelected = selectedSymptoms.has(symptom);
              return (
                <button
                  key={symptom}
                  type="button"
                  onClick={() => toggleSymptom(symptom)}
                  style={{
                    padding: "0.625rem 1rem",
                    borderRadius: "9999px",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    border: "1px solid",
                    borderColor: isSelected ? "#C0392B" : "#F0D9D9",
                    backgroundColor: isSelected ? "#C0392B" : "#FFFFFF",
                    color: isSelected ? "#FFFFFF" : "#1A1A1A",
                  }}
                >
                  {symptom}
                </button>
              );
            })}
          </div>
        </section>

        {/* Other Information Section */}
        <section>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#1A1A1A", margin: "0 0 0.5rem 0" }}>Other Information</h2>
          <textarea
            value={otherInfo}
            onChange={(e) => setOtherInfo(e.target.value)}
            placeholder="Tell us anything else about how you are feeling today..."
            rows={4}
            style={{
              width: "100%",
              padding: "1rem",
              borderRadius: "0.75rem",
              border: "1px solid #F0D9D9",
              backgroundColor: "#FFFFFF",
              fontSize: "0.9375rem",
              color: "#1A1A1A",
              fontFamily: "inherit",
              resize: "vertical"
            }}
          />
        </section>

        {/* Submit */}
        <button
          type="submit"
          style={{
            backgroundColor: "#C0392B",
            color: "#FFFFFF",
            padding: "1.25rem",
            borderRadius: "0.75rem",
            fontSize: "1rem",
            fontWeight: 700,
            border: "none",
            cursor: "pointer",
            width: "100%",
            transition: "background-color 0.2s"
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#A93226"}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#C0392B"}
        >
          Get My Risk Assessment
        </button>

      </form>
    </div>
  );
}

/* ── REUSABLE INPUT COMPONENT ────────────────────────────────────────────── */
function InputField({ label, icon: Icon, value, onChange, placeholder }: { label: string, icon: React.ElementType, value: string, onChange: (v: string) => void, placeholder: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
      <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#4B5563" }}>{label}</label>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <div style={{ position: "absolute", left: "0.75rem", color: "#9CA3AF" }}>
          <Icon size={16} />
        </div>
        <input 
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: "100%",
            padding: "0.625rem 0.75rem 0.625rem 2.25rem",
            borderRadius: "0.5rem",
            border: "1px solid #E5E7EB",
            fontSize: "0.9375rem",
            color: "#1A1A1A"
          }}
        />
      </div>
    </div>
  );
}
