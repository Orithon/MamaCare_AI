"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getDashboardData, PatientProfile } from "@/lib/dashboard-data";
import { User, Settings, Link as LinkIcon, Unlink, Loader2, AlertTriangle } from "lucide-react";

export default function SettingsPage() {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [providerCode, setProviderCode] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [linkError, setLinkError] = useState("");
  const [linkSuccess, setLinkSuccess] = useState("");

  const [showUnlinkModal, setShowUnlinkModal] = useState(false);
  const [unlinkConfirmCode, setUnlinkConfirmCode] = useState("");
  const [isUnlinking, setIsUnlinking] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          const dashboardData = await getDashboardData(token);
          if (dashboardData) {
            setProfile(dashboardData.profile);
          } else {
            setError("Failed to load profile.");
          }
        } catch (err) {
          console.error(err);
          setError("Failed to load settings data.");
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLinkProvider = async () => {
    if (!providerCode.trim() || providerCode.length !== 7) {
      setLinkError("Please enter a valid 7-character provider code (e.g. abc-123).");
      return;
    }
    
    setLinkError("");
    setLinkSuccess("");
    setIsLinking(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      const token = await user.getIdToken();

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          provider_code: providerCode
        })
      });

      if (!res.ok) {
        if (res.status === 400) {
           throw new Error("Invalid Provider Code.");
        }
        throw new Error("Failed to link provider.");
      }

      setLinkSuccess("Provider successfully linked!");
      setProviderCode("");
      
      // Refresh profile
      const dashboardData = await getDashboardData(token);
      if (dashboardData) {
        setProfile(dashboardData.profile);
      }
    } catch (err: any) {
      setLinkError(err.message || "An error occurred.");
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlinkProvider = async () => {
    if (unlinkConfirmCode !== profile?.providerCode) {
      setLinkError("The confirmation code does not match your provider's code.");
      return;
    }

    setLinkError("");
    setLinkSuccess("");
    setIsUnlinking(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      const token = await user.getIdToken();

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          unlink_provider: true
        })
      });

      if (!res.ok) {
        throw new Error("Failed to unlink provider.");
      }

      setLinkSuccess("Provider successfully unlinked.");
      setShowUnlinkModal(false);
      setUnlinkConfirmCode("");
      
      // Refresh profile
      const dashboardData = await getDashboardData(token);
      if (dashboardData) {
        setProfile(dashboardData.profile);
      }
    } catch (err: any) {
      setLinkError(err.message || "An error occurred.");
    } finally {
      setIsUnlinking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
        <p>Loading your settings...</p>
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

  return (
    <div className="pb-24 space-y-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary/10 rounded-xl">
          <Settings className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <User className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-bold text-gray-800">Healthcare Provider</h2>
        </div>

        {linkSuccess && (
          <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 text-sm font-medium">
            {linkSuccess}
          </div>
        )}

        {linkError && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 text-sm font-medium">
            {linkError}
          </div>
        )}

        {profile?.provider ? (
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Assigned Provider</p>
                <p className="font-bold text-lg text-gray-900">{profile.provider}</p>
                <p className="text-sm font-medium text-gray-500 mt-1">Code: <span className="text-gray-800 font-bold bg-white px-2 py-0.5 rounded border">{profile.providerCode}</span></p>
              </div>
              <div className="bg-primary/10 text-primary p-2 rounded-lg">
                <LinkIcon className="w-5 h-5" />
              </div>
            </div>
            
            <button 
              onClick={() => setShowUnlinkModal(true)}
              className="w-full py-2.5 flex items-center justify-center gap-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium transition-colors"
            >
              <Unlink className="w-4 h-4" />
              Unlink Provider
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600 text-sm">
              Link your account to your healthcare provider to allow them to monitor your pregnancy progress and risk assessments.
            </p>
            
            <div className="space-y-2">
              <label htmlFor="providerCode" className="block text-sm font-semibold text-gray-700">Provider Code</label>
              <input 
                type="text" 
                id="providerCode"
                value={providerCode}
                onChange={(e) => setProviderCode(e.target.value)}
                placeholder="e.g. abc-123"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            
            <button 
              onClick={handleLinkProvider}
              disabled={isLinking}
              className="w-full bg-primary hover:bg-primaryHover text-white py-3 rounded-xl font-bold shadow-md shadow-primary/20 transition-all flex justify-center items-center gap-2"
            >
              {isLinking ? <Loader2 className="w-5 h-5 animate-spin" /> : <LinkIcon className="w-5 h-5" />}
              Link Provider
            </button>
          </div>
        )}
      </div>

      {/* Unlink Safety Modal */}
      {showUnlinkModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-6">
            <div className="flex items-center gap-3 text-red-600 border-b border-red-100 pb-4">
              <div className="bg-red-100 p-2 rounded-full">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold">Unlink Provider?</h2>
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-600 text-sm">
                Unlinking your provider means they will no longer receive updates about your risk assessments. This action cannot be undone unless you ask them for their code again.
              </p>
              
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <p className="text-xs text-gray-500 font-semibold uppercase mb-1">To confirm, type your provider's code:</p>
                <p className="text-lg font-bold text-gray-900 tracking-wider mb-3">{profile?.providerCode}</p>
                
                <input 
                  type="text"
                  value={unlinkConfirmCode}
                  onChange={(e) => setUnlinkConfirmCode(e.target.value)}
                  placeholder="Enter code here"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => {
                  setShowUnlinkModal(false);
                  setUnlinkConfirmCode("");
                  setLinkError("");
                }}
                className="flex-1 py-3 font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleUnlinkProvider}
                disabled={isUnlinking || unlinkConfirmCode !== profile?.providerCode}
                className="flex-1 py-3 font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors flex justify-center items-center"
              >
                {isUnlinking ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Unlink"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
