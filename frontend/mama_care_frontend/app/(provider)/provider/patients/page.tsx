"use client";

import { useState, useEffect } from "react";
import { ProviderDashboardData, getProviderDashboard, RiskLevel } from "@/lib/provider-data";
import PaginatedReportsTable from "@/components/provider/PaginatedReportsTable";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { AlertCircle, ChevronRight, Users, Loader2 } from "lucide-react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

const RISK_STYLES: Record<RiskLevel, { bg: string; text: string; border: string }> = {
  Low: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  Moderate: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  High: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  Critical: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};

export default function PatientsPage() {
  const [data, setData] = useState<ProviderDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          const dashboardData = await getProviderDashboard(token);
          setData(dashboardData);
        } catch (err) {
          console.error(err);
          setError("Failed to load patient data.");
        } finally {
          setLoading(false);
        }
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
        <p>Loading your patients...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const riskWeight = { Critical: 4, High: 3, Moderate: 2, Low: 1 } as Record<string, number>;
  const sortedPatients = [...data.patients].sort((a, b) => {
    const weightA = riskWeight[a.lastRiskLevel] || 1;
    const weightB = riskWeight[b.lastRiskLevel] || 1;
    if (weightA !== weightB) {
      return weightB - weightA;
    }
    return new Date(b.lastAssessmentDate).getTime() - new Date(a.lastAssessmentDate).getTime();
  });

  return (
    <div className="pb-12 space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-gray-900">All Patients</h1>
        <p className="text-gray-500">View and manage all patients assigned to you.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Patient List ({data.patients.length})</h2>
          <span className="text-sm text-gray-500 font-medium">Provider Code: <strong className="text-gray-900">{data.providerCode}</strong></span>
        </div>

        {data.patients.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Patients Yet</h3>
            <p className="max-w-md mx-auto text-base">You haven't been linked with any patients. Share your Provider Code <strong>{data.providerCode}</strong> with your patients so they can add you.</p>
          </div>
        ) : (
          <>
            {/* Mobile View: Cards */}
            <div className="md:hidden divide-y divide-gray-100">
          {sortedPatients.map(patient => (
            <Link 
              href={`/provider/patients/${patient.id}`} 
              key={patient.id}
              className="block p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900">{patient.fullName}</h3>
                  <p className="text-sm text-gray-500">Week {patient.gestationalWeek}</p>
                </div>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${(RISK_STYLES[patient.lastRiskLevel as RiskLevel] || RISK_STYLES["Low"]).bg} ${(RISK_STYLES[patient.lastRiskLevel as RiskLevel] || RISK_STYLES["Low"]).text} ${(RISK_STYLES[patient.lastRiskLevel as RiskLevel] || RISK_STYLES["Low"]).border}`}>
                  {patient.lastRiskLevel}
                </span>
              </div>
              
              {patient.conditionsFlagged.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1">
                  {patient.conditionsFlagged.map((cond, i) => (
                    <span key={i} className="inline-block bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-semibold">
                      {cond}
                    </span>
                  ))}
                </div>
              )}
              
              <div className="flex justify-between items-center text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
                <span>Last check: {formatDistanceToNow(new Date(patient.lastAssessmentDate), { addSuffix: true })}</span>
                <div className="flex items-center text-primary font-medium">
                  View <ChevronRight className="w-3 h-3 ml-0.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold border-b border-gray-200">Patient Name</th>
                <th className="px-6 py-4 font-semibold border-b border-gray-200">Gestational Week</th>
                <th className="px-6 py-4 font-semibold border-b border-gray-200">Risk Level</th>
                <th className="px-6 py-4 font-semibold border-b border-gray-200">Conditions</th>
                <th className="px-6 py-4 font-semibold border-b border-gray-200">Last Assessment</th>
                <th className="px-6 py-4 font-semibold border-b border-gray-200 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedPatients.map(patient => (
                <tr key={patient.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900">{patient.fullName}</p>
                    <p className="text-sm text-gray-500">EDD: {patient.daysUntilDue} days</p>
                  </td>
                  <td className="px-6 py-4 text-gray-700">Week {patient.gestationalWeek}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${(RISK_STYLES[patient.lastRiskLevel as RiskLevel] || RISK_STYLES["Low"]).bg} ${(RISK_STYLES[patient.lastRiskLevel as RiskLevel] || RISK_STYLES["Low"]).text} ${(RISK_STYLES[patient.lastRiskLevel as RiskLevel] || RISK_STYLES["Low"]).border}`}>
                      {patient.lastRiskLevel === "Critical" && <AlertCircle className="w-3 h-3 mr-1" />}
                      {patient.lastRiskLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {patient.conditionsFlagged.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {patient.conditionsFlagged.map((cond, i) => (
                          <span key={i} className="text-xs text-gray-600 font-medium">
                            • {cond}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm italic">None</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {format(new Date(patient.lastAssessmentDate), "d MMM yyyy")}
                    <span className="block text-gray-400 text-xs">
                      {formatDistanceToNow(new Date(patient.lastAssessmentDate), { addSuffix: true })}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      href={`/provider/patients/${patient.id}`}
                      className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary hover:text-white transition-colors"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
        )}
      </div>

      {data.patients.length > 0 && <PaginatedReportsTable />}
    </div>
  );
}
