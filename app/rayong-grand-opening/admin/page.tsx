// app/rayong-grand-opening/admin/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

export default function RayongRemoteControl() {
  const { data: session, status } = useSession();
  const [prizeInput, setPrizeInput] = useState("การ์ดจอ RTX 4060");
  const [qtyInput, setQtyInput] = useState(1); // <-- New Quantity State
  const [isProcessing, setIsProcessing] = useState(false);

  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "")
    .split(",")
    .map((email) => email.trim().toLowerCase());
    
  const isAdmin = session?.user?.email ? adminEmails.includes(session.user.email.toLowerCase()) : false;

  const handleDrawWinner = async () => {
    if (!confirm(`Ready to draw ${qtyInput} winner(s) for: ${prizeInput}?`)) return;
    setIsProcessing(true);

    try {
      const eventRef = doc(db, "events", "rayong-lucky-draw");

      // 1. Trigger the drumroll
      await setDoc(eventRef, { isDrawing: true, prize: prizeInput }, { merge: true });

      // 2. Send the requested quantity to our API
      const res = await fetch("/api/draw-rayong-winner", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qty: Number(qtyInput) }) // Pass qty here!
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      await new Promise((resolve) => setTimeout(resolve, 3000));

      // 3. Reveal the array of winners on the TV
      await setDoc(eventRef, { 
        isDrawing: false, 
        currentWinners: data.winnerNames // Saving as an array now
      }, { merge: true });

    } catch (error: unknown) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Draw failed");
      await setDoc(doc(db, "events", "rayong-lucky-draw"), { isDrawing: false }, { merge: true });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetScreen = async () => {
    if (!confirm("Reset the TV back to the waiting screen?")) return;
    await setDoc(doc(db, "events", "rayong-lucky-draw"), { 
      isDrawing: false, 
      currentWinners: [], // Reset to empty array
      prize: null
    }, { merge: true });
  };

  if (status === "loading") return <div className="p-10 text-center">Loading...</div>;
  if (!session || !isAdmin) return <div className="p-10 text-center text-red-500 font-bold">Access Denied.</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-6 md:p-12 flex justify-center items-start">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mt-10">
        <div className="bg-gray-900 text-white p-6 text-center">
          <span className="text-orange-500 font-bold text-sm tracking-widest uppercase mb-1 block">Remote Control</span>
          <h1 className="text-2xl font-black">Rayong Live Draw</h1>
        </div>

        <div className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Current Prize (ของรางวัล)</label>
            <input 
              type="text" 
              value={prizeInput}
              onChange={(e) => setPrizeInput(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-xl font-bold text-lg focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Quantity (จำนวนผู้โชคดี)</label>
            <input 
              type="number" 
              min="1"
              max="20"
              value={qtyInput}
              onChange={(e) => setQtyInput(Number(e.target.value))}
              className="w-full p-4 border border-gray-300 rounded-xl font-bold text-lg focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>

          <div className="space-y-4 pt-4">
            <button 
              onClick={handleDrawWinner}
              disabled={isProcessing}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white py-5 rounded-xl font-black text-2xl shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              {isProcessing ? "Drawing..." : `🎉 DRAW ${qtyInput} WINNER(S)`}
            </button>
            <button 
              onClick={handleResetScreen}
              disabled={isProcessing}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-4 rounded-xl font-bold text-lg transition-colors"
            >
              Reset TV Screen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}