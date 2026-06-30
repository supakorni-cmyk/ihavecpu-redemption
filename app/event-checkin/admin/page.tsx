// app/event-checkin/admin/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Html5Qrcode } from "html5-qrcode"; // <-- Import the web scanner engine

type Attendee = {
  rowIndex: number;
  email: string;
  name: string;
  status: string;
};

export default function EventCheckIn() {
  const { data: session, status } = useSession();
  
  const [searchEmail, setSearchEmail] = useState("");
  const [attendee, setAttendee] = useState<Attendee | null>(null);
  
  const [searchLoading, setSearchLoading] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // 📷 Scanner Specific States
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const SCANNER_ELEMENT_ID = "webcam-scanner-view";

  // Security Gate
  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "").split(",").map(e => e.trim().toLowerCase());
  const isAdmin = session?.user?.email ? adminEmails.includes(session.user.email.toLowerCase()) : false;

  // Cleanup scanner stream if staff navigates away unexpectedly
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  // 1. Core Fetch logic abstracted out so both manual submit & scanner can call it
  const executeLookup = async (emailToSearch: string) => {
    if (!emailToSearch) return;
    setSearchLoading(true);
    setAttendee(null);
    setMessage(null);

    try {
      const res = await fetch(`/api/event-verify?email=${encodeURIComponent(emailToSearch.trim())}`);
      const data = await res.json();

      if (data.found) {
        setAttendee(data);
      } else {
        setMessage(data.message || "❌ User registration records not found.");
      }
    } catch (error) {
      setMessage("⚠️ Failed to communicate with database terminal.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    executeLookup(searchEmail);
  };

  // 📷 2. Start Camera Scan Stream
  const startScanner = async () => {
    setIsScanning(true);
    setAttendee(null);
    setMessage(null);
    
    // Tiny delay to ensure Next.js mounts the HTML injection target element container
    setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode(SCANNER_ELEMENT_ID);
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" }, // Forces mobile back-facing camera module
          {
            fps: 10,
            qrbox: { width: 230, height: 230 },
          },
          (decodedText) => {
            // 🎉 SUCCESSFUL QR CODE SCAN TARGET DETECTED
            let extractedEmail = decodedText;

            // Intelligent Fallback: If the QR is a full URL link, gracefully extract the email query parameter
            if (decodedText.includes("email=")) {
              try {
                const urlParams = new URLSearchParams(decodedText.split("?")[1]);
                extractedEmail = urlParams.get("email") || decodedText;
              } catch (e) {
                console.error("URL Parameter parsing fallback exception triggered", e);
              }
            }

            setSearchEmail(extractedEmail);
            stopScanner();
            executeLookup(extractedEmail); // Auto trigger database lookup chain immediately
          },
          () => {
            // Silent drop framing exceptions to keep UI fluid while lens hunts focus
          }
        );
      } catch (err) {
        console.error("Failed to acquire camera frame bounds context profile stream permissions:", err);
        setMessage("❌ Could not open camera. Please check app permissions.");
        setIsScanning(false);
      }
    }, 200);
  };

  // 📷 3. Stop Camera Stream & Kill Tracker Latency Loops
  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.error("Camera release hardware sequence interrupt fault:", err);
      }
    }
    scannerRef.current = null;
    setIsScanning(false);
  };

  const handleClaimTshirt = async () => {
    if (!attendee) return;
    if (!confirm(`Confirm handing out shirt to ${attendee.name}?`)) return;

    setClaimLoading(true);
    try {
      const res = await fetch("/api/event-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rowIndex: attendee.rowIndex }),
      });
      const data = await res.json();

      if (res.ok) {
        alert("👕 T-Shirt Disbursed Successfully!");
        setAttendee({ ...attendee, status: "CLAIMED" });
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      alert(`Error completing request: ${error.message}`);
    } finally {
      setClaimLoading(false);
    }
  };

  if (status === "loading") return <div className="p-10 text-center">Loading Verification Interface...</div>;
  if (!session || !isAdmin) return <div className="p-10 text-center text-red-500 font-bold">Access Denied. Admins Only.</div>;

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 sm:px-6 lg:px-8 text-gray-800">
      <div className="max-w-md mx-auto">
        
        {/* Brand Operations Header */}
        <div className="bg-gray-900 text-white p-6 rounded-t-2xl shadow-md text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-red-500 block mb-1">On-Site Staff Terminal</span>
          <h1 className="text-xl font-black">T-Shirt Check-in Verification</h1>
        </div>

        {/* Search Panel Box */}
        <div className="bg-white p-6 shadow-md border-b border-gray-100 space-y-4">
          
          {/* CAMERA SCANNER ACTIVATOR TRIGGER BAR */}
          {!isScanning ? (
            <button 
              type="button"
              onClick={startScanner}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 px-4 rounded-xl font-black text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              📷 Open QR Code Scanner
            </button>
          ) : (
            <div className="space-y-3">
              {/* Dynamic Video Mount Element Container Canvas Target */}
              <div 
                id={SCANNER_ELEMENT_ID} 
                className="w-full overflow-hidden rounded-xl border-2 border-dashed border-blue-500 bg-black shadow-inner"
              />
              <button 
                type="button"
                onClick={stopScanner}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 rounded-lg text-xs transition-colors"
              >
                Close Camera / Cancel Scan
              </button>
            </div>
          )}

          <div className="relative flex py-2 items-center text-gray-300">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-4 text-xs font-bold text-gray-400 uppercase">OR MANUAL ENTRY</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          <form onSubmit={handleManualSearch} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">Search Attendee Email</label>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  required
                  placeholder="name@example.com" 
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  className="flex-grow p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-gray-900 text-sm font-medium"
                />
                <button 
                  type="submit" 
                  disabled={searchLoading || isScanning}
                  className="bg-gray-900 hover:bg-gray-800 text-white px-5 rounded-lg text-sm font-bold disabled:opacity-50 transition-colors"
                >
                  {searchLoading ? "Checking..." : "Verify"}
                </button>
              </div>
            </div>
          </form>

          {message && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm font-bold rounded-lg text-center border border-red-100">
              {message}
            </div>
          )}
        </div>

        {/* 👕 VERIFICATION SCORE CARD PANEL */}
        {attendee && (
          <div className="bg-white p-6 rounded-b-2xl shadow-md space-y-5 border-t border-gray-100">
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 border-b pb-2">Attendee Registration Card</h2>
            
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase">Full Name</p>
                <p className="text-lg font-bold text-gray-900">{attendee.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase">Registered Email</p>
                <p className="text-sm font-medium text-gray-600 font-mono">{attendee.email}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex justify-between items-center">
                <span className={`px-4 py-2 rounded-full text-xs font-black tracking-wide ${
                  attendee.status === "CLAIMED" 
                    ? "bg-red-100 text-red-700 border border-red-200 animate-pulse" 
                    : "bg-green-100 text-green-700 border border-green-200"
                }`}>
                  {attendee.status === "CLAIMED" ? "⛔ ALREADY RECEIVED" : "✅ ELIGIBLE"}
                </span>
              </div>
            </div>

            {/* ACTION DISBURSEMENT TRIGGER */}
            {attendee.status !== "CLAIMED" ? (
              <button 
                onClick={handleClaimTshirt}
                disabled={claimLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-md transition-all text-sm uppercase tracking-wider"
              >
                {claimLoading ? "Updating Sheet..." : "Confirm Handout (มอบเสื้อยืด)"}
              </button>
            ) : (
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-center">
                <p className="text-red-700 font-black text-sm">⚠️ Do Not Hand Out Shirt!</p>
                <p className="text-xs text-red-500 mt-1">This user already claimed their shirt on this device or another lookup terminal.</p>
              </div>
            )}
          </div>
        )}

        <div className="text-center mt-6">
          <Link href="/admin" className="text-xs text-gray-400 font-bold hover:text-gray-600 transition-colors">
            &larr; Exit to Main Admin Console
          </Link>
        </div>

      </div>
    </div>
  );
}