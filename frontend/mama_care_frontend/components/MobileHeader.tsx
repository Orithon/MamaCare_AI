"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

export default function MobileHeader() {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <Link href="/" className="flex items-center gap-1.5 text-decoration-none">
        <span className="text-xl font-bold text-primary tracking-tight">MamaCare</span>
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">AI</span>
      </Link>

      <button 
        onClick={handleSignOut}
        className="flex items-center justify-center p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
        aria-label="Sign Out"
      >
        <LogOut size={20} />
      </button>
    </header>
  );
}
