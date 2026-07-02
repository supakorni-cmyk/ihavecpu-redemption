// app/admin/event-checkin/page.tsx
"use client";

import { useSession, signIn } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Html5Qrcode } from "html5-qrcode";

type Attendee = {
  rowIndex: number;
  email: string;
  name: string;
  size: string;
  status: string;
};

export default function EventCheckIn() {
  const { data: session, status } = useSession();
  
  // 🔑 NEW: Shared Terminal Access States
  const [inputPIN, setInputPIN] = useState("");
  const [isTerminalUnlocked, setIsTerminalUnlocked] = useState(false);
  const [pinError, setPinError] = useState(false);

  // Define your on-site master passcode here
  const MASTER_EVENT_PIN = "iHAVECPU2026"; 

  // Terminal Mode Toggle: "scan" or "walk-in"
  const [panelMode, setPanelMode] = useState<"scan" | "walk-in">("scan");

  // Search/Scan States
  const [searchEmail, setSearchEmail] = useState("");
  const [attendee, setAttendee] = useState<Attendee | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Manual Walk-In States
  const [walkInName, setWalkInName] = useState("");
  const [walkInEmail, setWalkInEmail] = useState("");
  const [walkInSize, setWalkInSize] = useState("M");
  const [walkInLoading, setWalkInLoading] = useState(false);

  // Scanner States
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const SCANNER_ELEMENT_ID = "webcam-scanner-view";

  useEffect(() => { return () => { stopScanner(); }; }, []);

  // Handle PIN entry validation
  const handleVerifyPIN = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (inputPIN === MASTER_EVENT_PIN) {
      setIsTerminalUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const executeLookup = async (emailToSearch: string) => {
    if (!emailToSearch) return;
    setSearchLoading(true);
    setAttendee(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/event-verify?email=${encodeURIComponent(emailToSearch.trim())}`);
      const data = await res.json();
      if (data.found) setAttendee(data);
      else setMessage(data.message || "❌ ไม่พบข้อมูลการลงทะเบียน");
    } catch (error) { setMessage("⚠️ Connection error."); }
    finally { setSearchLoading(false); }
  };

  const handleManualSearch = (e: React.SyntheticEvent) => {
    e.preventDefault();
    executeLookup(searchEmail);
  };

  const startScanner = async () => {
    setIsScanning(true);
    setAttendee(null);
    setMessage(null);
    setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode(SCANNER_ELEMENT_ID);
        scannerRef.current = html5QrCode;
        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 230, height: 230 } },
          (decodedText) => {
            let extractedEmail = decodedText;
            if (decodedText.includes("email=")) {
              const urlParams = new URLSearchParams(decodedText.split("?")[1]);
              extractedEmail = urlParams.get("email") || decodedText;
            }
            setSearchEmail(extractedEmail);
            stopScanner();
            executeLookup(extractedEmail);
          },
          () => {}
        );
      } catch (err) {
        setMessage("❌ Could not open camera.");
        setIsScanning(false);
      }
    }, 200);
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      await scannerRef.current.stop();
    }
    scannerRef.current = null;
    setIsScanning(false);
  };

  const handleClaimTshirt = async () => {
    if (!attendee) return;
    setClaimLoading(true);
    try {
      const res = await fetch("/api/event-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "claim", rowIndex: attendee.rowIndex }),
      });
      if (res.ok) {
        alert("👕 มอบเสื้อยืดเรียบร้อยสำเร็จ!");
        setAttendee({ ...attendee, status: "CLAIMED" });
      }
    } catch (error) { alert("Action failed"); }
    finally { setClaimLoading(false); }
  };

  const handleWalkInSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setWalkInLoading(true);
    try {
      const res = await fetch("/api/event-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "walk-in",
          name: walkInName,
          email: walkInEmail,
          size: walkInSize
        }),
      });
      if (res.ok) {
        alert("🎉 ลงทะเบียน Walk-In เรียบร้อย!");
        setWalkInName("");
        setWalkInEmail("");
        setPanelMode("scan");
      }
    } catch (error) { alert("Failed to log walk-in."); }
    finally { setWalkInLoading(false); }
  };

  if (status === "loading") return <div className="p-10 text-center">Loading Verification Interface...</div>;

  // ⚡ LOCK SCREEN: If the terminal hasn't been unlocked with the passcode yet, show the access pad
  if (!isTerminalUnlocked) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6 text-center text-gray-800">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full border">
          <div className="text-4xl mb-3">👕🏬</div>
          <h1 className="text-xl font-black text-gray-900 mb-1">iHAVECPU Staff Terminal</h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6">ระบบสแกนรับเสื้อประจำบูธ</p>
          
          <form onSubmit={handleVerifyPIN} className="space-y-4">
            <div>
              <input 
                type="password" 
                required
                placeholder="กรอกรหัสผ่านประจำบูธ" 
                value={inputPIN}
                onChange={(e) => setInputPIN(e.target.value)}
                className="w-full p-3.5 border border-gray-300 rounded-xl text-center font-bold tracking-widest text-lg outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            
            <button 
              type="submit"
              className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow"
            >
              Unlock Terminal (เปิดเครื่องสแกน)
            </button>
          </form>

          {pinError && (
            <p className="text-xs text-red-600 font-bold mt-3 animate-pulse">❌ รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง</p>
          )}
        </div>
      </div>
    );
  }

  // --- Beyond this point, the main operational dashboard renders normally ---
  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 sm:px-6 lg:px-8 text-gray-800">
      <div className="max-w-md mx-auto">
        
        {/* Operations Header */}
        <div className="bg-gray-900 text-white p-5 rounded-t-2xl shadow-md text-center">
          <h1 className="text-xl font-black">iHAVECPU Check-in Master Terminal</h1>
          <div className="flex mt-4 bg-gray-800 p-1 rounded-xl text-xs font-bold border border-gray-700">
            <button onClick={() => { setPanelMode("scan"); stopScanner(); setAttendee(null); }} className={`flex-1 py-2 rounded-lg transition-all ${panelMode === "scan" ? "bg-red-600 text-white shadow" : "text-gray-400"}`}>
              🔍 Scan & Search Pass
            </button>
            <button onClick={() => { setPanelMode("walk-in"); stopScanner(); setAttendee(null); }} className={`flex-1 py-2 rounded-lg transition-all ${panelMode === "walk-in" ? "bg-blue-600 text-white shadow" : "text-gray-400"}`}>
              ➕ Add Walk-In Guest
            </button>
          </div>
        </div>

        {/* MODE A: SCANNER / SEARCH VIEW */}
        {panelMode === "scan" && (
          <>
            <div className="bg-white p-6 shadow-md border-b border-gray-100 space-y-4">
              {!isScanning ? (
                <button type="button" onClick={startScanner} className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-black text-sm uppercase tracking-wider transition-all shadow-sm">
                  📷 Open QR Code Scanner
                </button>
              ) : (
                <div className="space-y-3">
                  <div id={SCANNER_ELEMENT_ID} className="w-full overflow-hidden rounded-xl border border-blue-500 bg-black" />
                  <button type="button" onClick={stopScanner} className="w-full bg-gray-200 text-gray-700 font-bold py-2 rounded-lg text-xs">Cancel Scan</button>
                </div>
              )}

              <form onSubmit={handleManualSearch} className="pt-2">
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Manual Email Lookup</label>
                <div className="flex gap-2">
                  <input type="email" required placeholder="name@example.com" value={searchEmail} onChange={(e) => setSearchEmail(e.target.value)} className="flex-grow p-3 border border-gray-300 rounded-lg text-sm font-medium outline-none" />
                  <button type="submit" disabled={searchLoading || isScanning} className="bg-gray-900 text-white px-5 rounded-lg text-sm font-bold disabled:opacity-50">
                    {searchLoading ? "..." : "Verify"}
                  </button>
                </div>
              </form>
              {message && <div className="p-3 bg-red-50 text-red-700 text-sm font-bold rounded-lg text-center border">{message}</div>}
            </div>

            {/* Attendance Badge Display Result Panel Card */}
            {attendee && (
              <div className="bg-white p-6 rounded-b-2xl shadow-md space-y-4 border-t">
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase">Name</p>
                  <p className="text-lg font-bold text-gray-900">{attendee.name}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase">Shirt Size</p>
                    <p className="text-2xl font-black text-gray-900">{attendee.size}</p>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-xs font-black ${attendee.status === "CLAIMED" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                    {attendee.status === "CLAIMED" ? "⛔ CLAIMED" : "✅ ELIGIBLE"}
                  </span>
                </div>
                {attendee.status !== "CLAIMED" ? (
                  <button onClick={handleClaimTshirt} disabled={claimLoading} className="w-full bg-green-600 text-white font-bold py-3.5 rounded-xl shadow text-sm uppercase tracking-wider">
                    {claimLoading ? "Updating..." : "Confirm Handout"}
                  </button>
                ) : (
                  <div className="bg-red-50 p-3 rounded-xl text-center border text-red-700 text-xs font-bold">⚠️ Do Not Hand Out Secondary Shirt!</div>
                )}
              </div>
            )}
          </>
        )}

        {/* MODE B: ON-THE-SPOT WALK-IN REGISTRATION FORM */}
        {panelMode === "walk-in" && (
          <div className="bg-white p-6 rounded-b-2xl shadow-md">
            <h2 className="text-sm font-black uppercase text-gray-400 mb-4 border-b pb-2">Walk-In Registration Entry</h2>
            <form onSubmit={handleWalkInSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Full Name (ชื่อ-นามสกุล)</label>
                <input type="text" required value={walkInName} onChange={(e) => setWalkInName(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg text-sm" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Email Address</label>
                <input type="email" required value={walkInEmail} onChange={(e) => setWalkInEmail(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg text-sm" placeholder="john@example.com" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">T-Shirt Size Selection</label>
                <select value={walkInSize} onChange={(e) => setWalkInSize(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg text-sm font-bold bg-white">
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                  <option value="XXL">XXL</option>
                </select>
              </div>
              <button type="submit" disabled={walkInLoading} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl text-sm uppercase tracking-wider shadow-md mt-6">
                {walkInLoading ? "Adding to logs..." : "Register & Dispense Shirt"}
              </button>
            </form>
          </div>
        )}

        <div className="text-center mt-6">
          <Link href="/admin" className="text-xs text-gray-400 font-bold hover:text-gray-600">&larr; Main Console</Link>
        </div>

      </div>
    </div>
  );
}