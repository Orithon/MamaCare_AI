"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { 
  FileUp, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  ChevronLeft,
  X,
  Volume2,
  VolumeX,
  Languages,
  Loader2
} from "lucide-react";
import { uploadReport, ReportInterpretation, getDashboardData } from "@/lib/dashboard-data";

type Language = "en" | "yo" | "ig" | "ha";

const LANGUAGES: { code: Language; label: string }[] = [
  { code: "en", label: "English" },
  { code: "yo", label: "Yoruba" },
  { code: "ig", label: "Igbo" },
  { code: "ha", label: "Hausa" }
];

export default function NewReportPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [language, setLanguage] = useState<Language>("en");
  
  const [view, setView] = useState<"empty" | "loading" | "result">("empty");
  const [result, setResult] = useState<ReportInterpretation | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          const data = await getDashboardData(token);
          if (data?.profile?.preferredLanguage) {
            setLanguage(data.profile.preferredLanguage as Language);
          }
        } catch (e) {
          console.error("Error fetching language preference", e);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // ── FILE HANDLING ────────────────────────────────────────────────────────

  const validateAndSetFile = (selectedFile: File) => {
    setError("");
    const validTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(selectedFile.type)) {
      setError("Please upload a PDF, JPEG, or PNG file.");
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File is too large. Maximum size is 10MB.");
      return;
    }
    setFile(selectedFile);
    setView("empty");
    setResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleProcess = async () => {
    if (!file) return;
    setView("loading");
    stopSpeaking();
    
    const user = auth.currentUser;
    if (!user) {
      router.push("/login");
      return;
    }
    
    try {
      const token = await user.getIdToken();
      const res = await uploadReport(token, file, language);
      setResult(res);
      setView("result");
    } catch (err) {
      console.error(err);
      setError("Something went wrong interpreting your report. Ensure it contains readable text.");
      setView("empty");
    }
  };

  const clearFile = () => {
    setFile(null);
    setResult(null);
    setView("empty");
    stopSpeaking();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── TEXT-TO-SPEECH (TTS) ────────────────────────────────────────────────

  const toggleSpeech = async () => {
    if (isSpeaking || isLoadingAudio) {
      stopSpeaking();
      return;
    }

    if (!result) return;
    setIsLoadingAudio(true);

    const textToRead = `
      Summary: ${result.summary}. 
      ${result.abnormalValues && result.abnormalValues.length > 0 ? "Abnormal findings: " + result.abnormalValues.map(v => v.finding + ". " + v.meaning).join(" ") : ""}
      Recommendations: ${result.recommendations.join(". ")}
    `;

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToRead, language: language })
      });

      if (!res.ok) throw new Error("TTS generation failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      
      const audio = new Audio(url);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
      };

      await audio.play();
      setIsSpeaking(true);
    } catch (error) {
      console.error(error);
      alert("Failed to generate speech audio. Please try again.");
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsSpeaking(false);
    setIsLoadingAudio(false);
  };

  // ── UI RENDER ────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "2rem" }}>
      
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <Link href="/dashboard/reports" style={{
          display: "flex", alignItems: "center", justifyContent: "center", width: "40px", height: "40px",
          backgroundColor: "#FFFFFF", border: "1px solid #F0D9D9", borderRadius: "0.5rem", color: "#1A1A1A"
        }}>
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1A1A1A", margin: 0 }}>Report Interpreter</h1>
          <p style={{ fontSize: "0.9375rem", color: "#6B7280", margin: "0.25rem 0 0 0" }}>Upload medical reports for a simple explanation.</p>
        </div>
      </div>

      <div className="reports-layout" style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "2rem", alignItems: "start" }}>
        
        {/* ── LEFT PANEL: UPLOAD & PREVIEW ──────────────────────────────── */}
        <section style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${isDragging ? "#C0392B" : "#F0D9D9"}`,
              backgroundColor: isDragging ? "#FFF5F5" : "#FFFFFF",
              borderRadius: "1rem",
              padding: "3rem 1.5rem",
              textAlign: "center",
              transition: "all 0.2s",
              cursor: "pointer",
              position: "relative"
            }}
            onClick={() => !file && fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: "none" }} 
              accept="application/pdf,image/jpeg,image/png,image/webp"
              onChange={(e) => e.target.files?.[0] && validateAndSetFile(e.target.files[0])}
            />

            {!file ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "#FFF5F5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FileUp size={28} color="#C0392B" strokeWidth={1.5} />
                </div>
                <div>
                  <p style={{ fontSize: "1rem", fontWeight: 600, color: "#1A1A1A", margin: "0 0 0.25rem 0" }}>Tap to upload or drag & drop</p>
                  <p style={{ fontSize: "0.875rem", color: "#6B7280", margin: 0 }}>PDF, JPEG, or PNG (Max. 10MB)</p>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#F9FAFB", padding: "1rem", borderRadius: "0.75rem", border: "1px solid #E5E7EB" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", overflow: "hidden" }}>
                  <FileText size={24} color="#C0392B" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: "0.9375rem", fontWeight: 500, color: "#1A1A1A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", wordBreak: "break-all" }}>
                    {file.name}
                  </span>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); clearFile(); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: "0.25rem" }}
                >
                  <X size={20} />
                </button>
              </div>
            )}
          </div>

          {error && (
            <p style={{ fontSize: "0.875rem", color: "#DC2626", margin: 0, fontWeight: 500, display: "flex", alignItems: "center", gap: "0.375rem" }}>
              <AlertCircle size={16} /> {error}
            </p>
          )}

          <button
            onClick={handleProcess}
            disabled={!file || view === "loading"}
            style={{
              backgroundColor: !file ? "#F3F4F6" : "#C0392B",
              color: !file ? "#9CA3AF" : "#FFFFFF",
              padding: "1rem",
              borderRadius: "0.75rem",
              fontSize: "1rem",
              fontWeight: 700,
              border: "none",
              cursor: !file || view === "loading" ? "not-allowed" : "pointer",
              transition: "background-color 0.2s"
            }}
          >
            Process Report
          </button>
        </section>

        {/* ── RIGHT PANEL: AI SUMMARY ────────────────────────────────────── */}
        <section style={{ backgroundColor: "#FFFFFF", border: "1px solid #F0D9D9", borderRadius: "1rem", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem", minHeight: "400px" }}>
          
          {/* Language Selector */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #F3F4F6", paddingBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#1A1A1A", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Languages size={20} color="#6B7280" /> AI Summary
            </h2>
            <select
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value as Language);
                if (view === "result") {
                  setView("empty");
                  setResult(null);
                }
              }}
              style={{
                padding: "0.5rem 2rem 0.5rem 1rem",
                borderRadius: "0.5rem",
                border: "1px solid #E5E7EB",
                backgroundColor: "#F9FAFB",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#1A1A1A",
                appearance: "none",
                cursor: "pointer"
              }}
            >
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.label}</option>
              ))}
            </select>
          </div>

          {/* Views */}
          {view === "empty" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#9CA3AF", textAlign: "center", gap: "1rem" }}>
              <FileText size={48} strokeWidth={1} />
              <p style={{ margin: 0, maxWidth: "240px", lineHeight: 1.5 }}>Upload a medical report to see a plain-language explanation here.</p>
            </div>
          )}

          {view === "loading" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ height: "24px", width: "60%", backgroundColor: "#F3F4F6", borderRadius: "0.25rem", animation: "pulse 1.5s infinite" }} />
              <div style={{ height: "16px", width: "100%", backgroundColor: "#F3F4F6", borderRadius: "0.25rem", animation: "pulse 1.5s infinite" }} />
              <div style={{ height: "16px", width: "90%", backgroundColor: "#F3F4F6", borderRadius: "0.25rem", animation: "pulse 1.5s infinite" }} />
              <div style={{ height: "16px", width: "95%", backgroundColor: "#F3F4F6", borderRadius: "0.25rem", animation: "pulse 1.5s infinite" }} />
              <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
            </div>
          )}

          {view === "result" && result && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              
              <button 
                onClick={toggleSpeech}
                disabled={isLoadingAudio}
                style={{
                  alignSelf: "flex-start",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 1rem",
                  backgroundColor: isSpeaking ? "#FDECEA" : (isLoadingAudio ? "#E5E7EB" : "#F3F4F6"),
                  color: isSpeaking ? "#C0392B" : (isLoadingAudio ? "#9CA3AF" : "#4B5563"),
                  border: "none",
                  borderRadius: "9999px",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  cursor: isLoadingAudio ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                {isLoadingAudio ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : isSpeaking ? (
                  <VolumeX size={16} />
                ) : (
                  <Volume2 size={16} />
                )}
                {isLoadingAudio ? "Generating Voice..." : isSpeaking ? "Stop Reading" : "Read Aloud"}
              </button>

              <div>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#1A1A1A", margin: "0 0 0.5rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  📋 What This Report Shows
                </h3>
                <p style={{ fontSize: "0.9375rem", color: "#4B5563", margin: 0, lineHeight: 1.6 }}>
                  {result.summary}
                </p>
              </div>

              {result.abnormalValues && result.abnormalValues.length > 0 && (
                <div style={{ backgroundColor: "#FFF5F5", padding: "1rem", borderRadius: "0.75rem", border: "1px solid #F0D9D9" }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#991B1B", margin: "0 0 0.75rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <AlertCircle size={18} /> Values That Need Attention
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {result.abnormalValues.map((av, i) => (
                      <li key={i} style={{ fontSize: "0.9375rem", color: "#1A1A1A" }}>
                        <strong>{av.finding}:</strong> {av.meaning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.recommendations && result.recommendations.length > 0 && (
                <div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#1A1A1A", margin: "0 0 0.75rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <CheckCircle2 size={18} color="#16A34A" /> What To Do Next
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem", color: "#4B5563" }}>
                    {result.recommendations.map((rec, i) => (
                      <li key={i} style={{ fontSize: "0.9375rem", lineHeight: 1.5 }}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>

      </div>

      <style>{`
        @media (max-width: 768px) {
          .reports-layout {
            grid-template-columns: 1fr !important;
          }
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
