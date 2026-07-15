"use client";

import { useState, useEffect } from "react";
import { ProviderDashboardData, getProviderDashboard } from "@/lib/provider-data";
import ProviderDashboardEmpty from "@/components/provider/ProviderDashboardEmpty";
import ProviderDashboardFilled from "@/components/provider/ProviderDashboardFilled";
import PaginatedReportsTable from "@/components/provider/PaginatedReportsTable";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * app/(provider)/provider/page.tsx
 *
 * The main Provider Dashboard page.
 */

export default function ProviderDashboardPage() {
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
          setError("Failed to load dashboard data.");
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
        <p>Loading your dashboard...</p>
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

  return (
    <div className="pb-24">
      {data.patients.length === 0 ? (
        <ProviderDashboardEmpty data={data} />
      ) : (
        <>
          <ProviderDashboardFilled data={data} />
          <PaginatedReportsTable />
        </>
      )}
    </div>
  );
}
