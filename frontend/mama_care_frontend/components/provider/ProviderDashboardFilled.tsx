"use client";

import { ProviderDashboardData, RiskLevel } from "@/lib/provider-data";
import { AlertCircle, ChevronRight, Clock, Users, Activity } from "lucide-react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";

/**
 * components/provider/ProviderDashboardFilled.tsx
 *
 * Shown when the provider has assigned patients.
 * Includes a responsive patient list (cards on mobile, table on desktop).
 */

const RISK_STYLES: Record<RiskLevel, { bg: string; text: string; border: string }> = {
  Low: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  Moderate: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  High: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  Critical: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};

export default function ProviderDashboardFilled({ data }: { data: ProviderDashboardData }) {
  const criticalPatients = data.patients.filter(p => p.lastRiskLevel === "Critical");
  
  // Sort patients: Critical first, then High, Moderate, Low
  const riskWeight = { Critical: 4, High: 3, Moderate: 2, Low: 1 };
  const sortedPatients = [...data.patients].sort((a, b) => {
    if (riskWeight[a.lastRiskLevel] !== riskWeight[b.lastRiskLevel]) {
      return riskWeight[b.lastRiskLevel] - riskWeight[a.lastRiskLevel];
    }
    return new Date(b.lastAssessmentDate).getTime() - new Date(a.lastAssessmentDate).getTime();
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500">Welcome back, {data.providerName}. Here is your patient summary.</p>
      </div>

      {/* Critical Alert Banner */}
      {criticalPatients.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-r-xl flex items-start gap-3 shadow-sm">
          <AlertCircle className="text-red-600 w-6 h-6 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-red-800 font-semibold text-lg">Action Required</h3>
            <p className="text-red-700 mt-1">
              You have {criticalPatients.length} patient{criticalPatients.length > 1 ? "s" : ""} with a Critical risk level that requires immediate review.
            </p>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-full">
            <Users className="text-primary w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Patients</p>
            <p className="text-2xl font-bold text-gray-900">{data.patients.length}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-red-100 p-3 rounded-full">
            <Activity className="text-red-600 w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Critical/High Risk</p>
            <p className="text-2xl font-bold text-gray-900">
              {data.patients.filter(p => p.lastRiskLevel === "Critical" || p.lastRiskLevel === "High").length}
            </p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-gray-100 p-3 rounded-full">
            <Clock className="text-gray-600 w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Recent Assessments</p>
            <p className="text-2xl font-bold text-gray-900">
              {data.patients.filter(p => new Date(p.lastAssessmentDate).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000).length}
            </p>
            <p className="text-xs text-gray-400">in the last 7 days</p>
          </div>
        </div>
      </div>

      {/* Patient List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Patient List</h2>
          <span className="text-sm text-gray-500 font-medium">Provider Code: <strong className="text-gray-900">{data.providerCode}</strong></span>
        </div>

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
      </div>
    </div>
  );
}
