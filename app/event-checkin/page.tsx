/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

type AttendeeData = {
  found: boolean;
  rowIndex?: number;
  email: string;
  name: string;
  status: string;
};

export default function EventCheckInPage() {
  const { data: session, status: sessionStatus } = useSession();

  const [inputEmail, setInputEmail] = useState("");
  const [activeEmail, setActiveEmail] = useState<string | null>(null);
  const [attendee, setAttendee] = useState<AttendeeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [verifiedAt, setVerifiedAt] = useState<string | null>(null);

  // 🔍 Lookup attendee registration from Google Sheets via /api/event-verify
  const checkRegistration = useCallback(async (emailToCheck: string) => {
    const normalized = emailToCheck.toLowerCase().trim();
    if (!normalized) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(
        `/api/event-verify?email=${encodeURIComponent(normalized)}`,
        { cache: "no-store" }
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to verify registration");
      }

      if (!data.found) {
        setAttendee(null);
        setActiveEmail(null);
        setErrorMsg(
          `ไม่พบอีเมล "${normalized}" ในรายชื่อผู้ลงทะเบียน กรุณาตรวจสอบอีเมลที่ใช้สมัครอีกครั้ง`
        );
        return;
      }

      setActiveEmail(normalized);
      setAttendee({
        found: true,
        rowIndex: data.rowIndex,
        email: data.email,
        name: data.name,
        status: data.status || "NOT CLAIMED",
      });

      if (data.status === "CLAIMED") {
        setVerifiedAt(new Date().toISOString());
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการเชื่อมต่อ";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-check if user is already signed in with Google
  useEffect(() => {
    if (session?.user?.email && !activeEmail && !attendee && !errorMsg) {
      setInputEmail(session.user.email);
      checkRegistration(session.user.email);
    }
  }, [session, activeEmail, attendee, errorMsg, checkRegistration]);

  // ⚡ Real-time Firestore listener + 3-second backup poll while waiting on QR screen
  useEffect(() => {
    if (!activeEmail || attendee?.status === "CLAIMED") return;

    const normalizedEmail = activeEmail.toLowerCase().trim();

    const markClaimed = (name?: string, timestamp?: string) => {
      setAttendee((prev) =>
        prev
          ? { ...prev, status: "CLAIMED", name: name || prev.name }
          : {
              found: true,
              email: normalizedEmail,
              name: name || "Attendee",
              status: "CLAIMED",
            }
      );
      setVerifiedAt(timestamp || new Date().toISOString());
    };

    // 1. Instant Firestore listener
    const unsub = onSnapshot(
      doc(db, "checkins", normalizedEmail),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.status === "CLAIMED") {
            markClaimed(data.name, data.verifiedAt);
          }
        }
      },
      (err) => {
        console.warn("Firestore listener fallback active:", err.message);
      }
    );

    // 2. Backup Google Sheets poll every 3 seconds until claimed
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/event-verify?email=${encodeURIComponent(normalizedEmail)}`,
          { cache: "no-store" }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (data.found && data.status === "CLAIMED") {
          markClaimed(data.name);
        }
      } catch {
        // Ignore transient network errors during polling
      }
    }, 3000);

    return () => {
      unsub();
      clearInterval(pollInterval);
    };
  }, [activeEmail, attendee?.status]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputEmail.trim()) return;
    checkRegistration(inputEmail);
  };

  const handleReset = () => {
    setActiveEmail(null);
    setAttendee(null);
    setErrorMsg(null);
    setVerifiedAt(null);
  };

  // Encode verification payload into QR code
  const qrPayload = attendee
    ? encodeURIComponent(attendee.email.toLowerCase().trim())
    : "";
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${qrPayload}`;

  // ============================================================================
  // ✅ VIEW 1: VERIFIED / CLAIMED SCREEN (Switched automatically in real-time)
  // ============================================================================
  if (attendee && attendee.status === "CLAIMED") {
    return (
      <main className="min-h-screen bg-gradient-to-b from-emerald-950 via-gray-900 to-gray-950 flex flex-col items-center justify-center p-5 text-white select-none">
        <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-emerald-400/50 rounded-3xl p-8 shadow-2xl text-center">
          {/* Checkmark Badge */}
          <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_35px_rgba(16,185,129,0.6)]">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold uppercase tracking-widest mb-4">
            Verified & Claimed
          </span>

          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1">
            {attendee.name}
          </h1>
          <p className="text-sm text-gray-300 font-mono mb-6">
            {attendee.email}
          </p>

          <div className="bg-black/40 border border-emerald-500/30 rounded-2xl p-5 mb-6 space-y-2">
            <p className="text-lg font-bold text-emerald-300">
              ยืนยันตัวตนและรับสิทธิ์สำเร็จ! 🎉
            </p>
            <p className="text-xs text-gray-300">
              iHAVECPU — Event Pass
            </p>
            {verifiedAt && (
              <p className="text-xs text-gray-400 pt-2 border-t border-white/10 font-mono">
                เวลาที่ยืนยัน:{" "}
                {new Date(verifiedAt).toLocaleTimeString("th-TH", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </p>
            )}
          </div>

          <button
            onClick={handleReset}
            className="text-xs text-gray-400 hover:text-white underline transition-colors"
          >
            ตรวจสอบอีเมลอื่น
          </button>
        </div>
      </main>
    );
  }

  // ============================================================================
  // 📱 VIEW 2: QR CODE PASS (Waiting for Staff Scan & Verification)
  // ============================================================================
  if (attendee && attendee.found) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-red-950/60 via-gray-900 to-gray-950 flex flex-col items-center justify-center p-5 text-white select-none">
        <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl text-center">
          <span className="inline-block px-4 py-1 rounded-full bg-red-600 text-white text-xs font-bold uppercase tracking-widest mb-3 shadow">
            iHAVECPU EVENT
          </span>

          <h1 className="text-2xl font-extrabold text-white mb-1">
            {attendee.name}
          </h1>
          <p className="text-sm text-gray-300 font-mono mb-6">
            {attendee.email}
          </p>

          {/* QR Code Box */}
          <div className="bg-white p-4 rounded-2xl inline-block shadow-xl mb-5">
            <img
              src={qrImageUrl}
              alt="Attendee Check-in QR Code"
              className="w-56 h-56 object-contain"
            />
          </div>

          <div className="bg-black/40 border border-white/10 rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-center gap-2 text-amber-300 text-sm font-semibold mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <span>รอเจ้าหน้าที่สแกนเพื่อยืนยันสิทธิ์</span>
            </div>
            <p className="text-xs text-gray-400">
              หน้าจอนี้จะเปลี่ยนเป็นสีเขียวอัตโนมัติทันทีที่เจ้าหน้าที่กดยืนยัน
            </p>
          </div>

          <button
            onClick={handleReset}
            className="text-xs text-gray-400 hover:text-white underline transition-colors"
          >
            เปลี่ยนอีเมลลงทะเบียน
          </button>
        </div>
      </main>
    );
  }

  // ============================================================================
  // 🔐 VIEW 3: EMAIL LOOKUP / GOOGLE SIGN-IN SCREEN
  // ============================================================================
  return (
    <main className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-5 text-white">
      <div className="w-full max-w-md bg-black/50 backdrop-blur-lg border border-white/15 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-6">
          <span className="inline-block px-3.5 py-1 rounded-full bg-red-600/20 border border-red-500/40 text-red-400 text-xs font-bold uppercase tracking-widest mb-3">
            Event Check-In
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            iHAVECPU
          </h1>
          <p className="text-lg font-bold text-red-500">EVENT</p>
          <p className="text-sm text-gray-300 mt-2">
            กรอกอีเมลที่ใช้ลงทะเบียนเพื่อรับ QR Code สำหรับยืนยันหน้างาน
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-200 text-sm text-center">
            {errorMsg}
          </div>
        )}

        {/* Email Form */}
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5"
            >
              อีเมลที่ลงทะเบียน (Registered Email)
            </label>
            <input
              id="email"
              type="email"
              required
              value={inputEmail}
              onChange={(e) => setInputEmail(e.target.value)}
              placeholder="example@gmail.com"
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !inputEmail.trim()}
            className="w-full py-3.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 disabled:bg-gray-700 disabled:text-gray-400 font-bold text-white shadow-lg transition-all cursor-pointer"
          >
            {loading ? "กำลังตรวจสอบข้อมูล..." : "รับ QR Code เข้างาน"}
          </button>
        </form>

        {/* Divider & Google Sign-In Option */}
        {sessionStatus !== "authenticated" && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/15" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-gray-900 px-3 text-gray-400">หรือ</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => signIn("google")}
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-white text-gray-900 hover:bg-gray-100 font-bold text-sm flex items-center justify-center gap-2.5 shadow transition-all cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                />
              </svg>
              เข้าสู่ระบบด้วย Google
            </button>
          </>
        )}
      </div>
    </main>
  );
}