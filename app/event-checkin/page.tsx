// app/event-checkin/page.tsx
"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";

type CheckupResult = {
  found: boolean;
  name: string;
  status: string;
  email: string;
};

export default function UserCheckupKiosk() {
  const [emailInput, setEmailInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckupResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCheckupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;

    setLoading(true);
    setResult(null);
    setErrorMessage(null);

    try {
      // Hits your existing live Google Sheets validation API
      const res = await fetch(`/api/event-verify?email=${encodeURIComponent(emailInput.trim())}`);
      const data = await res.json();

      if (res.ok && data.found) {
        setResult(data);
      } else {
        setErrorMessage(data.message || "❌ ไม่พบรายชื่อการลงทะเบียนของคุณ กรุณาตรวจสอบอีเมลอีกครั้ง (Registration email not found).");
      }
    } catch (error) {
      setErrorMessage("⚠️ ระบบเกิดข้อผิดพลาดชั่วคราว กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  // Format the direct scanner execution link that your staff terminal decodes
  const targetPassUrl = result 
    ? `${window.location.origin}/event-checkin/admin?email=${encodeURIComponent(result.email.toLowerCase().trim())}`
    : "";

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white text-gray-900 rounded-3xl shadow-2xl p-8 border border-gray-100 transition-all">
        
        {/* Header branding */}
        <div className="text-center mb-6">
          <span className="inline-block bg-red-50 text-red-600 font-black text-xs uppercase tracking-widest px-3 py-1 rounded-full mb-2">
            iHAVECPU Checkup Portal
          </span>
          <h1 className="text-2xl font-black text-gray-900">รับของรางวัลประจำกิจกรรม</h1>
          <p className="text-xs text-gray-400 mt-1">กรุณากรอกอีเมลที่ใช้ลงทะเบียนเข้าร่วมงาน เพื่อรับสิทธิ์</p>
        </div>

        {/* ----------------- STATE 1: INITIAL INPUT FORM ----------------- */}
        {!result && (
          <form onSubmit={handleCheckupSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wide text-gray-500 mb-1">Registered Email (อีเมลลงทะเบียน)</label>
              <input 
                type="email" 
                required
                placeholder="yourname@gmail.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full p-3.5 border border-gray-300 rounded-xl font-medium text-sm outline-none focus:ring-2 focus:ring-red-600 text-gray-900 transition-all"
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl text-sm uppercase tracking-wider transition-all disabled:opacity-50 shadow-md"
            >
              {loading ? "กำลังตรวจสอบข้อมูล..." : "ตรวจสอบสิทธิ์ (Check Eligibility)"}
            </button>

            {errorMessage && (
              <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl text-center border border-red-100 leading-relaxed">
                {errorMessage}
              </div>
            )}
          </form>
        )}

        {/* ----------------- STATE 2: REJECTED / ALREADY RECEIVED 👕 ----------------- */}
        {result && result.status === "CLAIMED" && (
          <div className="text-center space-y-4 py-4 animate-scale-up">
            <div className="text-5xl animate-bounce">👕❌</div>
            <h2 className="text-xl font-black text-red-600">คุณได้รับของรางวัลไปเรียบร้อยแล้ว</h2>
            <div className="bg-red-50 p-4 rounded-2xl border border-red-100 text-left space-y-1">
              <p className="text-xs text-gray-400 uppercase font-bold">Attendee Info</p>
              <p className="text-sm font-bold text-gray-800">{result.name}</p>
              <p className="text-xs text-red-600 font-medium">Status: ได้รับของรางวัลแล้ว (CLAIMED)</p>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">หากมีข้อสงสัย กรุณาติดต่อติดต่อเจ้าหน้าที่ประจำบูธ</p>
            
            <button onClick={() => setResult(null)} className="text-xs text-blue-500 font-bold hover:underline block mx-auto pt-2">
              ตรวจสอบอีเมลอื่น
            </button>
          </div>
        )}

        {/* ----------------- STATE 3: ELIGIBLE / GENERATE SECURE PASS 🎫 ----------------- */}
        {result && result.status !== "CLAIMED" && (
          <div className="text-center flex flex-col items-center py-2 animate-scale-up">
            <div className="bg-green-50 text-green-700 border border-green-100 text-xs font-black tracking-widest uppercase px-4 py-1.5 rounded-full mb-3">
              🎉 ได้รับสิทธิ์รับของรางวัล (Eligible)
            </div>
            
            <p className="text-sm font-bold text-gray-800 mb-1">{result.name}</p>
            <p className="text-xs text-gray-400 mb-6 font-mono">{result.email}</p>

            {/* 🔮 THE DYNAMIC PASS GENERATOR ELEMENT */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 shadow-inner mb-4">
              <QRCodeSVG 
                value={targetPassUrl}
                size={180}
                level={"M"}
              />
            </div>


            <p className="text-[11px] text-gray-400 max-w-[280px] leading-relaxed">
              ยื่นหน้าจอนี้ให้เจ้าหน้าที่ประจำบูธสแกน QR Code เพื่อรับของรางวัล (Show this QR code to the staff at the booth to claim your gift)
            </p>

            <button onClick={() => setResult(null)} className="text-xs text-gray-400 font-bold hover:text-red-600 transition-colors mt-6">
              ย้อนกลับ (Go Back)
            </button>
          </div>
        )}

      </div>
    </main>
  );
}