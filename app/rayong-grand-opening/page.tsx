// app/rayong-grand-opening/page.tsx
"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

export default function RayongDisplayBoard() {
  const [winnerNames, setWinnerNames] = useState<string[]>([]); // <-- Array of names
  const [prize, setPrize] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "events", "rayong-lucky-draw"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setWinnerNames(data.currentWinners || []); // Load the array
        setPrize(data.prize);
        setIsDrawing(data.isDrawing);
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
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/80 to-gray-900" />
      </div>

      <div className="relative z-10 p-10 text-center mt-10">
        <span className="inline-block py-2 px-6 rounded-full bg-red-500 text-white text-lg font-bold tracking-widest uppercase mb-6 shadow-lg animate-pulse">
          Live Lucky Draw
        </span>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white drop-shadow-2xl">
          iHAVECPU <span className="text-red-500">RAYONG</span>
        </h1>
      </div>

      <div className="relative z-10 flex-grow flex items-center justify-center p-6">
        <div className="w-full max-w-5xl bg-white/10 backdrop-blur-md border border-white/20 p-12 md:p-20 rounded-3xl shadow-2xl text-center">
          
          {isDrawing ? (
            <div className="animate-pulse">
              <h2 className="text-4xl md:text-6xl font-bold text-red-400 mb-6">กำลังสุ่มผู้โชคดี...</h2>
              <p className="text-2xl text-white opacity-80">(Drawing winners...)</p>
            </div>
          ) : winnerNames.length > 0 ? (
            <div className="animate-bounce-short">
              <p className="text-2xl font-bold text-red-300 uppercase tracking-widest mb-8">
                ผู้โชคดีได้รับ 
              </p>
              <p className="text-3xl font-bold text-white tracking-widest mb-8">
                {prize || "รางวัลพิเศษ"}
              </p>
              
              {/* Dynamic Grid: Adjusts based on how many winners there are! */}
              <div className={`grid gap-6 ${winnerNames.length > 1 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'} mb-8`}>
                {winnerNames.map((name, index) => (
                  <div key={index} className="bg-white/10 rounded-2xl py-6 px-4 border border-white/20 shadow-inner">
                    <h2 className="text-4xl md:text-5xl font-black text-white drop-shadow-md bg-clip-text text-transparent bg-gradient-to-r from-orange-300 to-yellow-500">
                      {name}
                    </h2>
                  </div>
                ))}
              </div>
              
              <p className="text-3xl text-white mt-8">ขอแสดงความยินดีด้วยครับ! 🎉</p>
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