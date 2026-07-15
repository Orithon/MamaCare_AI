"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getAllProviderAssessments, PaginatedAssessments, RiskLevel } from "@/lib/provider-data";
import { RISK_COLOURS } from "@/lib/dashboard-data";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function PaginatedReportsTable() {
  const [data, setData] = useState<PaginatedAssessments | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    let unsubscribe = () => {};
    setLoading(true);

    unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          const result = await getAllProviderAssessments(token, page, limit);
          setData(result);
        } catch (err) {
          console.error("Error fetching assessments:", err);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [page]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400 border border-gray-200 rounded-xl bg-white mt-6 shadow-sm">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
        <p>Loading assessments feed...</p>
      </div>
    );
  }

  if (!data || data.assessments.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Assessments Found</h3>
        <p className="text-gray-500">Your patients have not completed any risk assessments yet.</p>
      </div>
    );
  }

  const totalPages = Math.ceil(data.total / limit);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mt-6">
      <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900">All Patient Assessments</h2>
        <p className="text-sm text-gray-500">A chronological feed of all risk assessments across your patients.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-semibold border-b border-gray-200">Date</th>
              <th className="px-6 py-4 font-semibold border-b border-gray-200">Patient</th>
              <th className="px-6 py-4 font-semibold border-b border-gray-200">Risk Level</th>
              <th className="px-6 py-4 font-semibold border-b border-gray-200">Flags</th>
              <th className="px-6 py-4 font-semibold border-b border-gray-200 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.assessments.map((pred) => {
              // Ensure normalized capitalization
              const riskNormalized = pred.risk_level.charAt(0).toUpperCase() + pred.risk_level.slice(1).toLowerCase();
              const riskKey = riskNormalized as keyof typeof RISK_COLOURS;
              const styles = RISK_COLOURS[riskKey] || RISK_COLOURS["Low"];
              
              return (
                <tr key={pred.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {format(new Date(pred.created_at), "MMM d, yyyy")}
                    </div>
                    <div className="text-xs text-gray-500">
                      {format(new Date(pred.created_at), "h:mm a")}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-semibold text-gray-900">{pred.patient_name}</div>
                    <div className="text-xs text-gray-500">Week {pred.gestational_week}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span 
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border uppercase"
                      style={{ backgroundColor: styles.bg, color: styles.text, borderColor: styles.border }}
                    >
                      {pred.risk_level === "CRITICAL" && <AlertCircle className="w-3 h-3 mr-1" />}
                      {pred.risk_level}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {pred.identified_risks && pred.identified_risks.length > 0 ? (
                      <div className="text-xs text-gray-600 line-clamp-2 max-w-xs">
                        {pred.identified_risks.join(" • ")}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm italic">None</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <Link 
                      href={`/provider/patients/${pred.patient_id}`}
                      className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary hover:text-white transition-colors"
                    >
                      View Record
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-white">
          <span className="text-sm text-gray-500">
            Showing Page <span className="font-medium text-gray-900">{page}</span> of <span className="font-medium text-gray-900">{totalPages}</span>
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" /> Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
