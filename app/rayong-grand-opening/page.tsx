// app/rayong-grand-opening/page.tsx
"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

export default function RayongDisplayBoard() {
  const [winnerName, setWinnerName] = useState<string | null>(null);
  const [prize, setPrize] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    // 1. Set up a REAL-TIME listener to a specific document in Firebase
    // Whenever the admin updates this document, this page updates instantly!
    const unsub = onSnapshot(doc(db, "events", "rayong-lucky-draw"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setWinnerName(data.currentWinner);
        setPrize(data.prize);
        setIsDrawing(data.isDrawing);
      }
    });

    // Cleanup listener on unmount
    return () => unsub();
  }, []);

  return (
    <main className="min-h-screen bg-gray-900 flex flex-col relative overflow-hidden">
      
      {/* Background Styling */}
      <div className="absolute inset-0 z-0 opacity-40">
        {/* Replace with your actual Rayong event background */}
        <Image
          src="/rayong-banner.jpg" 
          alt="Background"
          fill
          className="object-cover blur-sm"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/80 to-gray-900" />
      </div>

      {/* Header */}
      <div className="relative z-10 p-10 text-center mt-10">
        <span className="inline-block py-2 px-6 rounded-full bg-orange-500 text-white text-lg font-bold tracking-widest uppercase mb-6 shadow-lg animate-pulse">
          Live Lucky Draw
        </span>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white drop-shadow-2xl">
          iHAVECPU <span className="text-orange-500">RAYONG</span>
        </h1>
        <p className="text-2xl text-orange-200 mt-4 font-medium tracking-wide">
          Grand Opening Celebration
        </p>
      </div>

      {/* The Display Screen */}
      <div className="relative z-10 flex-grow flex items-center justify-center p-6">
        <div className="w-full max-w-4xl bg-white/10 backdrop-blur-md border border-white/20 p-12 md:p-20 rounded-3xl shadow-2xl text-center transform transition-all">
          
          {isDrawing ? (
            // 🌀 THE "DRUMROLL" ANIMATION STATE
            <div className="animate-pulse">
              <h2 className="text-4xl md:text-6xl font-bold text-orange-400 mb-6">
                กำลังสุ่มผู้โชคดี...
              </h2>
              <p className="text-2xl text-white opacity-80">(Drawing winner...)</p>
            </div>
          ) : winnerName ? (
            // 🎉 THE WINNER STATE
            <div className="animate-bounce-short">
              <p className="text-2xl font-bold text-orange-300 uppercase tracking-widest mb-4">
                ผู้โชคดีได้รับ {prize || "รางวัลพิเศษ"}
              </p>
              <h2 className="text-6xl md:text-8xl font-black text-white drop-shadow-xl mb-4 bg-clip-text text-transparent bg-gradient-to-r from-orange-300 to-yellow-500">
                {winnerName}
              </h2>
              <p className="text-3xl text-white mt-8">ขอแสดงความยินดีด้วยครับ! 🎉</p>
            </div>
          ) : (
            // ⏳ THE WAITING STATE
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