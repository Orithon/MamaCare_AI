"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getProviderPatientReport } from "@/lib/provider-data";
import { Loader2, ArrowLeft, FileText, Calendar, Activity } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function ProviderReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;
  const reportId = params.reportId as string;

  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          const reportData = await getProviderPatientReport(token, patientId, reportId);
          setReport(reportData);
        } catch (err) {
          console.error(err);
          setError("Failed to load report details. It may not exist or you don't have access.");
        } finally {
          setLoading(false);
        }
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [patientId, reportId, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
        <p>Loading report details...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <button onClick={() => router.back()} className="hover:text-gray-900 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to Patient
          </button>
        </div>
        <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100 flex items-center gap-3">
          <Activity className="w-6 h-6" />
          <p className="font-medium">{error || "Report not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/provider" className="hover:text-gray-900">Dashboard</Link>
        <span>/</span>
        <Link href="/provider/patients" className="hover:text-gray-900">Patients</Link>
        <span>/</span>
        <Link href={`/provider/patients/${patientId}`} className="hover:text-gray-900">Patient Record</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Report Details</span>
      </div>

      <div className="flex items-center gap-4 mb-2">
        <button 
          onClick={() => router.back()}
          className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{report.file_name}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>Uploaded: {format(new Date(report.created_at), "PPP 'at' p")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              <span>{report.document_type || "Medical Report"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Extracted Contents
          </h2>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            AI Extracted
          </span>
        </div>
        
        {/* Short Summary Section */}
        {report.simplified_summary && (
          <div className="p-6 border-b border-gray-100 bg-amber-50/30">
            <h3 className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wide">Key Takeaway</h3>
            <p className="text-gray-700 font-medium">{report.simplified_summary}</p>
          </div>
        )}

        {/* Full Text Content */}
        <div className="p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">Full Report Text</h3>
          <div className="prose prose-sm max-w-none text-gray-700 bg-gray-50 p-6 rounded-lg border border-gray-100 whitespace-pre-wrap font-mono text-xs overflow-x-auto leading-relaxed">
            {report.extracted_text || "No text could be extracted from this report."}
          </div>
        </div>
      </div>
    </div>
  );
}
