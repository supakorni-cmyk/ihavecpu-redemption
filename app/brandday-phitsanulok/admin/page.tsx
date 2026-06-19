// app/rayong-grand-opening/admin/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

// Updated Type to include supporter
type Prize = { name: string; value: string; supporter: string };

export default function RayongRemoteControl() {
  const { data: session, status } = useSession();
  
  const [prizeInput, setPrizeInput] = useState(""); 

  const [prizeSupporter, setPrizeSupporter] = useState(""); // <-- NEW: State for Supporter
  const [prizesList, setPrizesList] = useState<Prize[]>([]); 
  const [isLoadingPrizes, setIsLoadingPrizes] = useState(true);

  const [qtyInput, setQtyInput] = useState(1);
  const [isGrandPrize, setIsGrandPrize] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "")
    .split(",")
    .map((email) => email.trim().toLowerCase());
    
  const isAdmin = session?.user?.email ? adminEmails.includes(session.user.email.toLowerCase()) : false;

  useEffect(() => {
    const fetchPrizes = async () => {
      try {
        const res = await fetch("/api/get-phitsanulok-prizes");
        const data = await res.json();
        
        if (data.prizes && data.prizes.length > 0) {
          setPrizesList(data.prizes);
          setPrizeInput(data.prizes[0].name);
          setPrizeSupporter(data.prizes[0].supporter); // <-- Set initial supporter
        }
      } catch (error) {
        console.error("Failed to fetch prizes", error);
      } finally {
        setIsLoadingPrizes(false);
      }
    };

    if (isAdmin) {
      fetchPrizes();
    } else if (status !== "loading") {
      setIsLoadingPrizes(false);
    }
  }, [isAdmin, status]);

  // Handle dropdown change to update name, value, AND supporter
  const handlePrizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedName = e.target.value;
    const selectedPrize = prizesList.find(p => p.name === selectedName);
    setPrizeInput(selectedName);
    if (selectedPrize) {
      setPrizeSupporter(selectedPrize.supporter); // <-- Update supporter state
    }
  };

  const handleDrawWinner = async () => {
    if (!prizeInput) return alert("Please select a prize first!");
    if (!confirm(`Ready to draw ${qtyInput} winner(s) for: ${prizeInput}?`)) return;
    setIsProcessing(true);

    try {
      const eventRef = doc(db, "events", "phitsanulok-lucky-draw");

      // Send prize name, value, and supporter to Firebase for the TV screen
      await setDoc(eventRef, { 
        isDrawing: true, 
        prize: prizeInput,
        prizeSupporter: prizeSupporter, // <-- Send supporter to Firebase
        isGrandPrize: isGrandPrize 
      }, { merge: true });

      const res = await fetch("/api/draw-phitsanulok-winner", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          qty: Number(qtyInput),
          prizeName: prizeInput 
        }) 
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      await new Promise((resolve) => setTimeout(resolve, isGrandPrize ? 5000 : 3000));

      await setDoc(eventRef, { 
        isDrawing: false, 
        currentWinners: data.winnerNames 
      }, { merge: true });

    } catch (error: unknown) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Draw failed");
      await setDoc(doc(db, "events", "phitsanulok-lucky-draw"), { isDrawing: false }, { merge: true });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetScreen = async () => {
    if (!confirm("Reset the TV back to the waiting screen?")) return;
    await setDoc(doc(db, "events", "phitsanulok-lucky-draw"), { 
      isDrawing: false, 
      currentWinners: [], 
      prize: null,
      prizeSupporter: null, // <-- Clear supporter
      isGrandPrize: false 
    }, { merge: true });
    setIsGrandPrize(false); 
  };

  if (status === "loading") return <div className="p-10 text-center">Loading...</div>;
  if (!session || !isAdmin) return <div className="p-10 text-center text-red-500 font-bold">Access Denied.</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-6 md:p-12 flex justify-center items-start">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mt-10">
        <div className="bg-gray-900 text-white p-6 text-center">
          <span className="text-red-500 font-bold text-sm tracking-widest uppercase mb-1 block">Remote Control</span>
          <h1 className="text-2xl font-black">Rayong Live Draw</h1>
        </div>

        <div className="p-8 space-y-6">
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Current Prize (ของรางวัล)</label>
            {isLoadingPrizes ? (
              <div className="w-full p-4 border text-gray-500 bg-gray-50 border-gray-300 rounded-xl font-bold text-lg animate-pulse">
                Loading prizes...
              </div>
            ) : prizesList.length > 0 ? (
              <select 
                value={prizeInput}
                onChange={handlePrizeChange} 
                className="w-full p-4 border text-black border-gray-300 rounded-xl font-bold text-lg focus:ring-2 focus:ring-red-500 outline-none bg-white cursor-pointer"
              >
                {prizesList.map((prize, index) => (
                  <option key={index} value={prize.name}>
                    {prize.name} {prize.supporter ? `[${prize.supporter}]` : ""}
                  </option>
                ))}
              </select>
            ) : (
              <input 
                type="text" 
                value={prizeInput}
                onChange={(e) => setPrizeInput(e.target.value)}
                placeholder="Type prize name here..."
                className="w-full p-4 border text-black border-gray-300 rounded-xl font-bold text-lg focus:ring-2 focus:ring-red-500 outline-none"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Quantity (จำนวนผู้โชคดี)</label>
            <input 
              type="number" 
              min="1"
              max="20"
              value={qtyInput}
              onChange={(e) => setQtyInput(Number(e.target.value))}
              className="w-full p-4 border text-black border-gray-300 rounded-xl font-bold text-lg focus:ring-2 focus:ring-red-500 outline-none"
            />
          </div>

          <div className="flex items-center space-x-3 bg-red-50 p-4 rounded-xl border border-red-200">
            <input 
              type="checkbox" 
              id="grandPrize"
              checked={isGrandPrize}
              onChange={(e) => setIsGrandPrize(e.target.checked)}
              className="w-6 h-6 text-red-600 bg-white border-gray-300 rounded focus:ring-red-500"
            />
            <label htmlFor="grandPrize" className="text-lg font-black text-red-600 uppercase tracking-wide cursor-pointer flex-grow select-none">
              🌟 Grand Prize Mode
            </label>
          </div>

          <div className="space-y-4 pt-4">
            <button 
              onClick={handleDrawWinner}
              disabled={isProcessing || isLoadingPrizes}
              className={`w-full py-5 rounded-xl font-black text-2xl shadow-lg transition-transform hover:scale-105 active:scale-95 text-white ${
                isGrandPrize 
                  ? "bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 animate-pulse" 
                  : "bg-red-500 hover:bg-red-600 disabled:bg-red-300"
              }`}
            >
              {isProcessing ? "Drawing..." : isGrandPrize ? `👑 DRAW GRAND PRIZE!` : `🎉 DRAW ${qtyInput} WINNER(S)`}
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