"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getReportHistory, ReportEntry } from "@/lib/dashboard-data";
import { Activity, Plus, ChevronLeft } from "lucide-react";
import RecentReports from "@/components/dashboard/RecentReports";

/**
 * Patient Reports History Page
 */
export default function ReportsHistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<ReportEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          setIsLoading(true);
          const token = await user.getIdToken();
          const data = await getReportHistory(token);
          setHistory(data);
        } catch (error) {
          console.error("Error fetching history:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "2rem" }}>
      
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link href="/dashboard" style={{
            display: "flex", alignItems: "center", justifyContent: "center", width: "40px", height: "40px",
            backgroundColor: "#FFFFFF", border: "1px solid #F0D9D9", borderRadius: "0.5rem", color: "#1A1A1A"
          }}>
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1A1A1A", margin: 0 }}>My Reports</h1>
            <p style={{ fontSize: "0.9375rem", color: "#6B7280", margin: "0.25rem 0 0 0" }}>Review your interpreted medical reports.</p>
          </div>
        </div>

        <Link href="/dashboard/reports/new" style={{
          display: "flex", alignItems: "center", gap: "0.5rem",
          backgroundColor: "#C0392B", color: "white", padding: "0.75rem 1.25rem",
          borderRadius: "0.75rem", fontWeight: 600, textDecoration: "none",
          fontSize: "0.9375rem"
        }}>
          <Plus size={16} />
          Upload Report
        </Link>
      </div>

      {/* Content */}
      {isLoading ? (
        <div style={{ textAlign: "center", padding: "3rem 0", color: "#6B7280" }}>
          <Activity size={32} className="pulse-ring" style={{ color: "#C0392B", margin: "0 auto 1rem auto" }} />
          Loading your history...
        </div>
      ) : (
        <RecentReports reports={history} hideViewAll={true} />
      )}
    </div>
  );
}
