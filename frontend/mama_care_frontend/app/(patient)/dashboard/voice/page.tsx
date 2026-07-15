"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Send, Volume2, Globe } from "lucide-react";
import VoiceVisualizer from "@/components/dashboard/VoiceVisualizer";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getDashboardData, sendChatMessage } from "@/lib/dashboard-data";

/**
 * app/(patient)/dashboard/voice/page.tsx
 *
 * The Voice Assistant module.
 * Uses MediaRecorder -> ElevenLabs STT -> Mock Chat Backend -> ElevenLabs TTS.
 */

type ChatMessage = {
  id: string;
  role: "user" | "ai";
  text: string;
};

type AppStatus = "idle" | "listening" | "processing" | "speaking";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "yo", label: "Yoruba" },
  { code: "ig", label: "Igbo" },
  { code: "ha", label: "Hausa" },
];

export default function VoiceAssistantPage() {
  const [status, setStatus] = useState<AppStatus>("idle");
  const [language, setLanguage] = useState("en");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [textInput, setTextInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [sessionId] = useState<string>(() => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Clean up audio player on unmount & fetch preferred language
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          const data = await getDashboardData(token);
          if (data?.profile?.preferredLanguage) {
            setLanguage(data.profile.preferredLanguage);
          }
        } catch (e) {
          console.error("Failed to load preferred language", e);
        }
      }
    });

    return () => {
      unsubscribe();
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.src = "";
      }
    };
  }, []);

  // 1. Handle Mic Start
  const startRecording = async () => {
    try {
      setErrorMsg("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await handleAudioBlob(audioBlob);
        // Stop all tracks to release mic
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setStatus("listening");
    } catch (err) {
      console.error("Microphone access denied:", err);
      setErrorMsg("Could not access microphone. Please check permissions or use text input.");
    }
  };

  // 2. Handle Mic Stop
  const stopRecording = () => {
    if (mediaRecorderRef.current && status === "listening") {
      mediaRecorderRef.current.stop();
      setStatus("processing");
    }
  };

  // 3. Process Audio (STT -> Chat -> TTS)
  const handleAudioBlob = async (blob: Blob) => {
    setStatus("processing");
    try {
      // Step A: Speech to Text (ElevenLabs)
      const sttFormData = new FormData();
      sttFormData.append("file", blob, "recording.webm");
      
      const sttRes = await fetch("/api/stt", {
        method: "POST",
        body: sttFormData,
      });

      if (!sttRes.ok) throw new Error("Failed to transcribe audio");
      const sttData = await sttRes.json();
      
      if (!sttData.text || sttData.text.trim() === "") {
        throw new Error("I couldn't hear anything clearly. Please try again.");
      }

      await processUserText(sttData.text);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An error occurred during processing.");
      setStatus("idle");
    }
  };

  // 4. Process Text (Chat -> TTS) - Shared by STT and Text Input
  const processUserText = async (text: string) => {
    setStatus("processing");
    setErrorMsg("");

    // Add user message to UI
    const userMsgId = Date.now().toString();
    setMessages((prev) => [...prev, { id: userMsgId, role: "user", text }]);

    try {
      // Step B: Chat API
      const user = auth.currentUser;
      if (!user) throw new Error("Please log in to use the assistant.");
      const token = await user.getIdToken();
      
      const chatData = await sendChatMessage(token, text, language, sessionId);
      const aiText = chatData.response;

      // Add AI message to UI
      const aiMsgId = (Date.now() + 1).toString();
      setMessages((prev) => [...prev, { id: aiMsgId, role: "ai", text: aiText }]);

      // Step C: Text to Speech (ElevenLabs)
      const ttsRes = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: aiText, language }),
      });

      if (!ttsRes.ok) throw new Error("Failed to generate audio response");
      
      const audioBlob = await ttsRes.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      playAudio(audioUrl);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An error occurred during processing.");
      setStatus("idle");
    }
  };

  const playAudio = (url: string) => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
    const audio = new Audio(url);
    audioPlayerRef.current = audio;

    audio.onplay = () => setStatus("speaking");
    audio.onended = () => {
      setStatus("idle");
      URL.revokeObjectURL(url);
    };
    audio.onerror = () => {
      setStatus("idle");
      URL.revokeObjectURL(url);
    };

    audio.play().catch((err) => {
      console.error("Auto-play prevented", err);
      setStatus("idle");
    });
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || status !== "idle") return;
    
    const textToProcess = textInput;
    setTextInput("");
    processUserText(textToProcess);
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col relative">
      {/* Header & Language Selector */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-4 flex items-center justify-between z-10 shrink-0 border border-border">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Voice Assistant</h1>
          <p className="text-sm text-gray-500">Ask questions in your native language</p>
        </div>
        <div className="flex items-center gap-2 bg-background px-3 py-1.5 rounded-full border border-border">
          <Globe className="w-4 h-4 text-primary" />
          <select
            className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer outline-none text-gray-700"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            disabled={status !== "idle"}
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto bg-white rounded-2xl shadow-sm p-4 mb-4 border border-border z-10">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <Mic className="w-8 h-8 text-primary" />
            </div>
            <p>Tap the microphone to start asking questions.</p>
            <p className="text-sm">E.g., &quot;Is it normal to have swollen feet?&quot;</p>
          </div>
        ) : (
          <div className="space-y-4 pb-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-primary text-white rounded-br-sm"
                      : "bg-background border border-border text-gray-800 rounded-bl-sm"
                  }`}
                >
                  <p className="text-[15px]">{msg.text}</p>
                </div>
              </div>
            ))}
            {/* Status Indicators in Chat */}
            {status === "processing" && (
              <div className="flex justify-start">
                <div className="bg-background border border-border text-gray-500 rounded-2xl rounded-bl-sm px-4 py-3 text-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                </div>
              </div>
            )}
            {status === "speaking" && (
              <div className="flex justify-start">
                <div className="bg-green-50 border border-green-100 text-green-700 rounded-2xl rounded-bl-sm px-4 py-3 text-sm flex items-center gap-2">
                  <Volume2 className="w-4 h-4 animate-pulse" />
                  <span>Speaking...</span>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>
        )}
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm border border-red-100 z-10 shrink-0 text-center">
          {errorMsg}
        </div>
      )}

      {/* Controls Area */}
      <div className="relative flex flex-col items-center justify-center shrink-0">
        <VoiceVisualizer status={status} />

        <div className="z-10 bg-white rounded-full p-2 shadow-lg mb-4">
          {status === "listening" ? (
            <button
              onClick={stopRecording}
              className="w-16 h-16 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-white transition-all shadow-md transform hover:scale-105"
              aria-label="Stop recording"
            >
              <Square className="w-6 h-6 fill-current" />
            </button>
          ) : (
            <button
              onClick={startRecording}
              disabled={status !== "idle"}
              className={`w-16 h-16 rounded-full flex items-center justify-center text-white transition-all shadow-md ${
                status === "idle"
                  ? "bg-primary hover:bg-red-700 transform hover:scale-105"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
              aria-label="Start recording"
            >
              <Mic className="w-8 h-8" />
            </button>
          )}
        </div>

        <p className="text-gray-500 text-sm font-medium mb-4 z-10">
          {status === "idle" && "Tap to speak"}
          {status === "listening" && "Listening..."}
          {status === "processing" && "Thinking..."}
          {status === "speaking" && "Speaking..."}
        </p>

        {/* Text Fallback */}
        <form onSubmit={handleTextSubmit} className="w-full flex gap-2 z-10">
          <input
            type="text"
            placeholder="Or type your question here..."
            className="flex-1 bg-white border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            disabled={status !== "idle"}
          />
          <button
            type="submit"
            disabled={!textInput.trim() || status !== "idle"}
            className="bg-primary text-white p-3 rounded-xl hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
