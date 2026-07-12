"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingData, submitOnboarding } from "@/lib/placeholder-data";
import ProgressBar from "@/components/onboarding/ProgressBar";
import Step1Personal from "@/components/onboarding/Step1Personal";
import Step2Pregnancy from "@/components/onboarding/Step2Pregnancy";
import Step3Medical from "@/components/onboarding/Step3Medical";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  
  // Overall form state
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [data, setData] = useState<OnboardingData>({
    dob: "",
    state: "",
    lga: "",
    phone: "",
    gestationalWeek: 0,
    edd: "",
    prevPregnancies: 0,
    prevLiveBirths: 0,
    conditions: [],
    allergies: "",
    medications: "",
    providerCode: ""
  });

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [providerCodeInvalid, setProviderCodeInvalid] = useState(false);

  // Generic updater function passed to all steps
  const updateData = (fields: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...fields }));
  };

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    const result = await submitOnboarding(data);
    
    if (result.success) {
      if (result.providerCodeInvalid) {
        setProviderCodeInvalid(true);
      }
      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, result.providerCodeInvalid ? 3500 : 1500);
    } else {
      setError(result.error ?? "Failed to save profile. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "var(--color-bg)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem 1rem",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "600px",
        backgroundColor: "var(--color-surface)",
        borderRadius: "1rem",
        boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
        padding: "2.5rem",
        position: "relative",
      }}>
        
        {/* Error Banner */}
        {error && (
          <div style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            padding: "1rem", backgroundColor: "#FEF2F2", color: "#991B1B",
            borderRadius: "0.75rem", marginBottom: "1.5rem", border: "1px solid #FCA5A5"
          }}>
            <AlertTriangle size={20} />
            <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>{error}</span>
          </div>
        )}

        {/* Success State Overlay */}
        {success ? (
          <div className="fade-in" style={{ textAlign: "center", padding: "3rem 1rem" }}>
            <div style={{ 
              width: "80px", height: "80px", borderRadius: "50%", backgroundColor: "#F0FDF4",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem"
            }}>
              <CheckCircle2 size={40} color="#16A34A" />
            </div>
            <h2 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#1A1A1A", marginBottom: "0.75rem" }}>
              Profile Complete!
            </h2>
            {providerCodeInvalid ? (
               <div style={{ 
                  backgroundColor: "#FFFBEB", border: "1px solid #FEF3C7", 
                  padding: "1rem", borderRadius: "0.5rem", color: "#92400E",
                  marginBottom: "1.5rem", fontSize: "0.9rem", textAlign: "left",
                  display: "flex", gap: "0.5rem"
               }}>
                 <AlertTriangle size={20} style={{ flexShrink: 0 }} />
                 <span>Profile saved successfully, but the provider code you entered was incorrect. You can link your provider later in your settings.</span>
               </div>
            ) : null}
            <p style={{ color: "#6B7280", marginBottom: "1.5rem" }}>
              Welcome to MamaCare AI. Taking you to your dashboard...
            </p>
          </div>
        ) : (
          <>
            {/* The Wizard */}
            <ProgressBar currentStep={currentStep} />
            
            <div style={{ marginTop: "1rem" }}>
              {currentStep === 1 && (
                <Step1Personal data={data} updateData={updateData} onNext={handleNext} />
              )}
              {currentStep === 2 && (
                <Step2Pregnancy data={data} updateData={updateData} onNext={handleNext} onBack={handleBack} />
              )}
              {currentStep === 3 && (
                <Step3Medical data={data} updateData={updateData} onSubmit={handleSubmit} onBack={handleBack} isSubmitting={isSubmitting} />
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
