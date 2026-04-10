"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

export default function RayongDisplayBoard() {
  const [winnerNames, setWinnerNames] = useState<string[]>([]); // <-- Array of names
  const [prize, setPrize] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isGrandPrize, setIsGrandPrize] = useState(false); // <-- Catch the Grand Prize flag

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "events", "rayong-lucky-draw"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setWinnerNames(data.currentWinners || []); // Load the array
        setPrize(data.prize);
        setIsDrawing(data.isDrawing);
        setIsGrandPrize(data.isGrandPrize || false); // Update state
      }
    });
    return () => unsub();
  }, []);

  return (
    <main className="min-h-screen bg-gray-900 flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-40">
        <Image
          src="/rayong-banner.jpg" 
          alt="Background"
          fill
          className="object-cover blur-sm"
        />
        {/* Dynamic Background Overlay: Dark for normal, Gold/Red for Grand Prize */}
        <div className={`absolute inset-0 transition-colors duration-700 ${isGrandPrize && (isDrawing || winnerNames.length > 0) ? 'bg-gradient-to-b from-yellow-900/80 via-red-900/80 to-gray-900' : 'bg-gradient-to-b from-gray-900/80 to-gray-900'}`} />
      </div>

      <div className="relative z-10 p-10 text-center mt-10">
        <span className={`inline-block py-2 px-6 rounded-full text-white text-lg font-bold tracking-widest uppercase mb-6 shadow-lg animate-pulse ${isGrandPrize ? 'bg-yellow-500' : 'bg-red-500'}`}>
          Live Lucky Draw
        </span>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white drop-shadow-2xl">
          iHAVECPU <span className={isGrandPrize ? 'text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)]' : 'text-red-500'}>RAYONG</span>
        </h1>
        <h2 className={`text-4xl md:text-6xl font-extrabold tracking-tight drop-shadow-2xl ${isGrandPrize ? 'text-yellow-300' : 'text-white'}`}>
          GRAND OPENING
        </h2>
      </div>

      <div className="relative z-10 flex-grow flex items-center justify-center p-6">
        <div className={`w-full max-w-5xl backdrop-blur-md border p-12 md:p-20 rounded-3xl shadow-2xl text-center transition-all duration-500 ${isGrandPrize ? 'bg-black/40 border-yellow-500/50 scale-105' : 'bg-white/10 border-white/20'}`}>
          
          {isDrawing ? (
            <div className={`animate-pulse ${isGrandPrize ? 'scale-110' : ''}`}>
              {isGrandPrize && <div className="text-7xl mb-4">🚨👑🚨</div>}
              <h2 className={`text-4xl md:text-6xl font-bold mb-6 ${isGrandPrize ? 'text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]' : 'text-red-400'}`}>
                {isGrandPrize ? "กำลังสุ่มรางวัลใหญ่สุดพิเศษ!" : "กำลังสุ่มผู้โชคดี..."}
              </h2>
              <p className="text-2xl text-white opacity-80">(Drawing winners...)</p>
            </div>
          ) : winnerNames.length > 0 ? (
            <div className="animate-bounce-short">
              {isGrandPrize && <div className="text-8xl mb-6 animate-bounce">👑</div>}
              <p className={`text-2xl font-bold uppercase tracking-widest mb-2 ${isGrandPrize ? 'text-yellow-300' : 'text-red-300'}`}>
                ผู้โชคดีได้รับ 
              </p>
              <p className={`text-3xl font-bold tracking-widest mb-8 ${isGrandPrize ? 'text-yellow-400 drop-shadow-md' : 'text-white'}`}>
                {prize || "รางวัลพิเศษ"}
              </p>
              
              {/* Dynamic Grid: Adjusts based on how many winners there are! */}
              <div className={`grid gap-6 ${winnerNames.length > 1 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'} mb-8`}>
                {winnerNames.map((name, index) => (
                  <div key={index} className={`rounded-2xl py-6 px-4 border shadow-inner ${isGrandPrize ? 'bg-gradient-to-r from-yellow-500/20 to-red-500/20 border-yellow-400/50' : 'bg-white/10 border-white/20'}`}>
                    <h2 className={`text-4xl md:text-5xl font-black text-white drop-shadow-md bg-clip-text text-transparent ${isGrandPrize ? 'bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]' : 'bg-gradient-to-r from-orange-300 to-yellow-500'}`}>
                      {name}
                    </h2>
                  </div>
                ))}
              </div>
              
              <p className={`text-3xl mt-8 font-bold ${isGrandPrize ? 'text-yellow-400' : 'text-white'}`}>ขอแสดงความยินดีด้วยครับ! 🎉</p>
            </div>
          ) : (
            <div>
              <div className="text-8xl mb-6">🎁</div>
              <h2 className="text-4xl font-bold text-white mb-4">เตรียมตัวให้พร้อม!</h2>
              <p className="text-xl text-gray-300">รอลุ้นรับรางวัลใหญ่จากทาง iHAVECPU เร็วๆ นี้</p>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}