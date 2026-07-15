"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPatientDetails, PatientDetails } from "@/lib/provider-data";
import PatientProfileCard from "@/components/provider/PatientProfileCard";
import ClinicalNotes from "@/components/provider/ClinicalNotes";
import { ArrowLeft, Activity, FileText, AlertCircle, Loader2 } from "lucide-react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { format } from "date-fns";
import { RISK_COLOURS } from "@/lib/dashboard-data";

/**
 * app/(provider)/provider/patients/[id]/page.tsx
 *
 * Detailed view of a specific patient's history.
 */

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [patient, setPatient] = useState<PatientDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // Hardcode the provider name for the demo (since we have no real auth context here)
  const currentProviderName = "Nurse Chidinma";

  useEffect(() => {
    const id = params.id as string;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          const data = await getPatientDetails(token, id);
          setPatient(data);
        } catch (err) {
          console.error("Failed to fetch patient details:", err);
        } finally {
          setLoading(false);
        }
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-primary">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="font-medium">Loading patient record...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Patient Not Found</h2>
        <p className="text-gray-500 mb-6">We couldn't find the record you were looking for.</p>
        <button onClick={() => router.back()} className="text-primary font-medium hover:underline">
          &larr; Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="pb-12 space-y-6">
      {/* Back Button & Title */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="p-2 bg-white rounded-full border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors text-gray-600"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Patient Record</h1>
      </div>

      {/* Top Section: Profile */}
      <PatientProfileCard profile={patient.profile} />

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: History & Reports (Takes up 2 cols on lg) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Prediction History */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-gray-500" />
                <h2 className="text-lg font-semibold text-gray-900">Risk Assessment History</h2>
              </div>
              <span className="text-xs font-semibold bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                {patient.predictions.length} Records
              </span>
            </div>
            
            <div className="p-6">
              {patient.predictions.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No risk assessments found for this patient.</p>
              ) : (
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                  {patient.predictions.map((pred, i) => {
                    const isLatest = i === 0;
                    return (
                      <div key={pred.id} className="relative flex items-start justify-between md:justify-normal md:odd:flex-row-reverse group">
                        
                        {/* Timeline dot */}
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-gray-100 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                          <span className="text-[10px] font-bold text-gray-500">{patient.predictions.length - i}</span>
                        </div>
                        
                        {/* Card */}
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-4 rounded-xl border border-gray-100 shadow-sm bg-white hover:border-gray-300 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                              {format(new Date(pred.date), "MMM d, yyyy - h:mm a")}
                              {isLatest && <span className="ml-2 text-primary font-bold">(Latest)</span>}
                            </span>
                            <span 
                              className="px-2 py-0.5 text-xs font-bold rounded-md border uppercase"
                              style={{ 
                                backgroundColor: (RISK_COLOURS[pred.riskLevel as keyof typeof RISK_COLOURS] || RISK_COLOURS["Low"]).bg, 
                                color: (RISK_COLOURS[pred.riskLevel as keyof typeof RISK_COLOURS] || RISK_COLOURS["Low"]).text, 
                                borderColor: (RISK_COLOURS[pred.riskLevel as keyof typeof RISK_COLOURS] || RISK_COLOURS["Low"]).border 
                              }}
                            >
                              {pred.riskLevel}
                            </span>
                          </div>
                          
                          <p className="text-sm font-medium text-gray-800 mb-3">{pred.summary}</p>
                          
                          {/* Metrics Grid */}
                          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                            <div className="bg-gray-50 p-2 rounded border border-gray-100">
                              <span className="block text-gray-400 font-medium">Blood Pressure</span>
                              <span className="font-semibold text-gray-900">{pred.systolicBP}/{pred.diastolicBP} <span className="font-normal text-gray-500">mmHg</span></span>
                            </div>
                            <div className="bg-gray-50 p-2 rounded border border-gray-100">
                              <span className="block text-gray-400 font-medium">Heart Rate</span>
                              <span className="font-semibold text-gray-900">{pred.heartRate} <span className="font-normal text-gray-500">bpm</span></span>
                            </div>
                            <div className="bg-gray-50 p-2 rounded border border-gray-100">
                              <span className="block text-gray-400 font-medium">Glucose</span>
                              <span className="font-semibold text-gray-900">{pred.bloodGlucose} <span className="font-normal text-gray-500">mg/dL</span></span>
                            </div>
                            <div className="bg-gray-50 p-2 rounded border border-gray-100">
                              <span className="block text-gray-400 font-medium">Haemoglobin</span>
                              <span className="font-semibold text-gray-900">{pred.haemoglobin} <span className="font-normal text-gray-500">g/dL</span></span>
                            </div>
                          </div>

                          {pred.flaggedConditions.length > 0 && (
                            <div className="pt-2 border-t border-gray-100 mt-2">
                              <div className="flex items-center gap-1 mb-1">
                                <AlertCircle className="w-3 h-3 text-red-500" />
                                <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Flags Raised</span>
                              </div>
                              <p className="text-xs text-gray-600 font-medium">{pred.flaggedConditions.join(" • ")}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Uploaded Reports */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-500" />
                <h2 className="text-lg font-semibold text-gray-900">Lab Reports & Scans</h2>
              </div>
            </div>
            
            <div className="p-6">
              {patient.reports.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No reports uploaded by patient yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {patient.reports.map(report => (
                    <Link 
                      key={report.id} 
                      href={`/provider/patients/${patient.id}/reports/${report.id}`}
                      className="p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-white hover:border-gray-300 transition-colors cursor-pointer block"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-primary px-2 py-0.5 bg-primary/10 rounded">PDF</span>
                        <span className="text-xs text-gray-500">{format(new Date(report.date), "MMM d, yyyy")}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 truncate mb-1" title={report.filename}>{report.filename}</h3>
                      <p className="text-xs text-gray-600 line-clamp-2">{report.summarySnippet}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Clinical Notes */}
        <div className="lg:col-span-1 h-[600px] lg:h-auto">
          {/* We set a fixed height on mobile/tablet so the sticky works well, on desktop it expands */}
          <div className="h-full sticky top-6">
            <ClinicalNotes patientId={patient.id} providerName={currentProviderName} />
          </div>
        </div>

      </div>
    </div>
  );
}
